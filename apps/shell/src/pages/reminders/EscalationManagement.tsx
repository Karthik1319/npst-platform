import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from '@/lib/toast';
import { Pencil, Plus, ShieldAlert, Trash2 } from '@/components/icons';
import { applicationService } from '@/services/adminService';
import { reminderService } from '@/services/reminderService';
import { PageHeader } from '@/components/common/PageHeader';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CHANNEL_KEYS, CHANNEL_LABELS } from '@/lib/labels';
import type { ChannelKey, EscalationLevel } from '@/types';
import styles from './EscalationManagement.module.css';

const ESCALATION_RECIPIENTS = [
  'Employee',
  'Approver',
  'Reporting Manager',
  'Department Head',
  'Administrator',
];

const escalationSchema = z.object({
  level: z.number().min(1, 'Level must be at least 1'),
  triggerCondition: z.string().min(5, 'Describe the trigger condition'),
  timeAfterDue: z.number().min(0, 'Cannot be negative'),
  recipient: z.string().min(1, 'Select a recipient'),
  channels: z
    .array(z.enum(['inapp', 'email', 'sms', 'push']))
    .min(1, 'Pick at least one channel'),
  message: z.string().min(5, 'Write the escalation message'),
});

type EscalationFormValues = z.infer<typeof escalationSchema>;

export default function EscalationManagement() {
  const queryClient = useQueryClient();
  const { data: policies = [] } = useQuery({
    queryKey: ['reminder-policies'],
    queryFn: () => reminderService.listPolicies(),
  });
  const { data: escalations = [] } = useQuery({
    queryKey: ['reminder-escalations'],
    queryFn: () => reminderService.listEscalations(),
  });
  const { data: apps = [] } = useQuery({
    queryKey: ['apps'],
    queryFn: () => applicationService.list(),
  });

  const [policyId, setPolicyId] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<EscalationLevel | null>(null);
  const [deleting, setDeleting] = useState<EscalationLevel | null>(null);

  // Select the first policy once the policies are loaded (set during render).
  if (policies.length > 0 && !policyId) setPolicyId(policies[0].id);

  const appName = useMemo(
    () => new Map(apps.map((a) => [a.id, a.name])),
    [apps],
  );
  const levels = useMemo(
    () =>
      escalations
        .filter((e) => e.policyId === policyId)
        .sort((a, b) => a.level - b.level),
    [escalations, policyId],
  );
  const selectedPolicy = policies.find((p) => p.id === policyId);

  const form = useForm<EscalationFormValues>({
    resolver: zodResolver(escalationSchema),
    defaultValues: {
      level: 1,
      triggerCondition: '',
      timeAfterDue: 1,
      recipient: 'Employee',
      channels: ['email'],
      message: '',
    },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['reminder-escalations'] });
    queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
  };

  const openCreate = () => {
    setEditing(null);
    form.reset({
      level: levels.length + 1,
      triggerCondition: '',
      timeAfterDue: (levels.at(-1)?.timeAfterDue ?? 0) + 2,
      recipient: 'Administrator',
      channels: ['email'],
      message: '',
    });
    setFormOpen(true);
  };

  const openEdit = (level: EscalationLevel) => {
    setEditing(level);
    form.reset({
      level: level.level,
      triggerCondition: level.triggerCondition,
      timeAfterDue: level.timeAfterDue,
      recipient: level.recipient,
      channels: level.channels,
      message: level.message,
    });
    setFormOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: (values: EscalationFormValues) => {
      if (!selectedPolicy) return Promise.resolve(undefined);
      const payload = {
        ...values,
        policyId: selectedPolicy.id,
        appId: selectedPolicy.appId,
      };
      return editing
        ? Promise.resolve(reminderService.updateEscalation(editing.id, payload))
        : Promise.resolve(reminderService.createEscalation(payload));
    },
    onSuccess: () => {
      invalidate();
      toast.success(
        editing ? 'Escalation level updated' : 'Escalation level added',
      );
      setFormOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      Promise.resolve(reminderService.removeEscalation(id)),
    onSuccess: () => {
      invalidate();
      toast.success('Escalation level removed');
      setDeleting(null);
    },
  });

  return (
    <div className={styles.div}>
      <PageHeader
        title="Escalation Management"
        description="Define the escalation ladder per reminder policy — who is chased, when, and through which channels."
        testId="escalations-title"
        actions={
          <div className={styles.div2}>
            <Select value={policyId} onValueChange={setPolicyId}>
              <SelectTrigger
                className={styles.selectTrigger}
                data-testid="escalation-policy-select"
              >
                <SelectValue>
                  {selectedPolicy?.name ?? 'Select a policy'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {policies.map((policy) => (
                  <SelectItem key={policy.id} value={policy.id}>
                    {policy.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={openCreate}
              disabled={!selectedPolicy}
              data-testid="add-escalation-button"
            >
              <Plus className={`${styles.plus} npst-sized`} /> Add Level
            </Button>
          </div>
        }
      />

      {levels.length === 0 ? (
        <EmptyState
          title="No escalation levels configured"
          description="Add levels to build the ladder — e.g. L1 Employee, L2 Reporting Manager, L3 Department Head, L4 Administrator."
        />
      ) : (
        <Card className={styles.card}>
          <CardContent className={styles.cardContent}>
            <Table data-testid="escalations-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Level</TableHead>
                  <TableHead>Trigger Condition</TableHead>
                  <TableHead className={styles.tableHead}>
                    Time After Due
                  </TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead className={styles.tableHead2}>Channels</TableHead>
                  <TableHead className={styles.tableHead3}>Message</TableHead>
                  <TableHead className={styles.tableHead4}>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {levels.map((level) => (
                  <TableRow key={level.id}>
                    <TableCell>
                      <span className={styles.span}>
                        <ShieldAlert
                          className={`${styles.shieldAlert} npst-sized`}
                        />{' '}
                        L{level.level}
                      </span>
                    </TableCell>
                    <TableCell className={styles.tableCell}>
                      {level.triggerCondition}
                    </TableCell>
                    <TableCell className={styles.tableCell2}>
                      {level.timeAfterDue} day
                      {level.timeAfterDue === 1 ? '' : 's'}
                    </TableCell>
                    <TableCell>{level.recipient}</TableCell>
                    <TableCell className={styles.tableHead2}>
                      <div className={styles.div3}>
                        {level.channels.map((channel) => (
                          <span key={channel} className={styles.span2}>
                            {CHANNEL_LABELS[channel as ChannelKey]}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className={styles.tableCell3}>
                      {level.message}
                    </TableCell>
                    <TableCell className={styles.tableHead4}>
                      <div className={styles.div4}>
                        <Button
                          variant="outline"
                          size="icon-sm"
                          aria-label="Edit level"
                          onClick={() => openEdit(level)}
                          data-testid={`escalation-edit-${level.id}`}
                        >
                          <Pencil className={`${styles.plus} npst-sized`} />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon-sm"
                          className={styles.button}
                          aria-label="Delete level"
                          onClick={() => setDeleting(level)}
                          data-testid={`escalation-delete-${level.id}`}
                        >
                          <Trash2 className={`${styles.plus} npst-sized`} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className={styles.dialogContent}>
          <DialogHeader>
            <DialogTitle>
              {editing ? `Edit Level ${editing.level}` : 'Add Escalation Level'}
            </DialogTitle>
            <DialogDescription>
              For {selectedPolicy?.name ?? 'the policy'} in{' '}
              {selectedPolicy ? appName.get(selectedPolicy.appId) : ''}.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit((values) =>
              saveMutation.mutate(values),
            )}
            className={styles.form}
            data-testid="escalation-form"
          >
            <div className={styles.div5}>
              <Controller
                control={form.control}
                name="level"
                render={({ field }) => (
                  <div className={styles.div6}>
                    <Label htmlFor="esc-level">Escalation level</Label>
                    <Input
                      id="esc-level"
                      type="number"
                      min={1}
                      value={field.value}
                      onChange={(e) =>
                        field.onChange(Math.max(1, Number(e.target.value)))
                      }
                      data-testid="escalation-level-input"
                    />
                    {form.formState.errors.level && (
                      <p className={styles.p}>
                        {form.formState.errors.level.message}
                      </p>
                    )}
                  </div>
                )}
              />
              <Controller
                control={form.control}
                name="timeAfterDue"
                render={({ field }) => (
                  <div className={styles.div6}>
                    <Label htmlFor="esc-days">Time after due date (days)</Label>
                    <Input
                      id="esc-days"
                      type="number"
                      min={0}
                      value={field.value}
                      onChange={(e) =>
                        field.onChange(Math.max(0, Number(e.target.value)))
                      }
                      data-testid="escalation-days-input"
                    />
                    {form.formState.errors.timeAfterDue && (
                      <p className={styles.p}>
                        {form.formState.errors.timeAfterDue.message}
                      </p>
                    )}
                  </div>
                )}
              />
            </div>
            <div className={styles.div6}>
              <Label htmlFor="esc-condition">Trigger condition</Label>
              <Input
                id="esc-condition"
                placeholder="e.g. Approval pending beyond 3 days"
                {...form.register('triggerCondition')}
                data-testid="escalation-condition-input"
              />
              {form.formState.errors.triggerCondition && (
                <p className={styles.p}>
                  {form.formState.errors.triggerCondition.message}
                </p>
              )}
            </div>
            <Controller
              control={form.control}
              name="recipient"
              render={({ field }) => (
                <div className={styles.div6}>
                  <Label>Escalation recipient</Label>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger data-testid="escalation-recipient-select">
                      <SelectValue>{field.value}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {ESCALATION_RECIPIENTS.map((recipient) => (
                        <SelectItem key={recipient} value={recipient}>
                          {recipient}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            />
            <Controller
              control={form.control}
              name="channels"
              render={({ field }) => (
                <div className={styles.div6}>
                  <Label>Notification channels</Label>
                  <div className={styles.div7}>
                    {CHANNEL_KEYS.map((key) => (
                      <label key={key} className={styles.label}>
                        <Checkbox
                          checked={field.value.includes(key)}
                          onCheckedChange={(checked) =>
                            field.onChange(
                              checked
                                ? [...field.value, key]
                                : field.value.filter((c) => c !== key),
                            )
                          }
                          data-testid={`escalation-channel-${key}`}
                        />
                        {CHANNEL_LABELS[key]}
                      </label>
                    ))}
                  </div>
                  {form.formState.errors.channels && (
                    <p className={styles.p}>
                      {form.formState.errors.channels.message}
                    </p>
                  )}
                </div>
              )}
            />
            <div className={styles.div6}>
              <Label htmlFor="esc-message">Escalation message</Label>
              <Textarea
                id="esc-message"
                rows={3}
                placeholder="Escalation: {{taskName}} has been pending for {{dueDate}}."
                {...form.register('message')}
                data-testid="escalation-message-input"
              />
              {form.formState.errors.message && (
                <p className={styles.p}>
                  {form.formState.errors.message.message}
                </p>
              )}
            </div>
            <DialogFooter className={styles.dialogFooter}>
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormOpen(false)}
                data-testid="escalation-form-cancel-button"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saveMutation.isPending}
                data-testid="escalation-form-submit-button"
              >
                {editing ? 'Save changes' : 'Add level'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Remove Level ${deleting?.level ?? ''}?`}
        description="Reminders will skip this rung of the escalation ladder."
        confirmLabel="Remove level"
        destructive
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
      />
    </div>
  );
}

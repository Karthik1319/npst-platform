import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Pencil, Plus, Power, Search, Trash2 } from 'lucide-react';
import { applicationService } from '@/services/adminService';
import { notificationService } from '@/services/notificationService';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { CHANNEL_KEYS, CHANNEL_LABELS, PRIORITY_LABELS, RECIPIENT_OPTIONS, TRIGGER_LABELS } from '@/lib/labels';
import type { ChannelKey, NotificationRule } from '@/types';

const ruleSchema = z.object({
  name: z.string().min(2, 'Rule name is required'),
  appId: z.string().min(1, 'Select an application'),
  triggerEvent: z.enum(['employee-onboarding', 'approval-pending', 'task-due', 'payment-received', 'document-expiring', 'deal-stage-change', 'course-due']),
  recipient: z.string().min(1, 'Select a recipient'),
  channels: z.array(z.enum(['inapp', 'email', 'sms', 'push'])).min(1, 'Pick at least one channel'),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  templateId: z.string().min(1, 'Select a template'),
  conditions: z.string().min(5, 'Describe when this rule fires'),
  status: z.enum(['active', 'inactive']),
});

type RuleFormValues = z.infer<typeof ruleSchema>;

export default function NotificationRules() {
  const queryClient = useQueryClient();
  const { data: rules = [] } = useQuery({ queryKey: ['notification-rules'], queryFn: () => notificationService.listRules() });
  const { data: apps = [] } = useQuery({ queryKey: ['apps'], queryFn: () => applicationService.list() });
  const { data: templates = [] } = useQuery({ queryKey: ['notification-templates'], queryFn: () => notificationService.listTemplates() });

  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<NotificationRule | null>(null);
  const [deleting, setDeleting] = useState<NotificationRule | null>(null);

  const appName = useMemo(() => new Map(apps.map((a) => [a.id, a.name])), [apps]);
  const templateName = useMemo(() => new Map(templates.map((t) => [t.id, t.name])), [templates]);

  const form = useForm<RuleFormValues>({
    resolver: zodResolver(ruleSchema),
    defaultValues: {
      name: '',
      appId: '',
      triggerEvent: 'approval-pending',
      recipient: 'employee',
      channels: ['inapp'],
      priority: 'medium',
      templateId: '',
      conditions: '',
      status: 'active',
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rules;
    return rules.filter((r) => r.name.toLowerCase().includes(q) || TRIGGER_LABELS[r.triggerEvent].toLowerCase().includes(q));
  }, [rules, search]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['notification-rules'] });
    queryClient.invalidateQueries({ queryKey: ['search-index'] });
    queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
  };

  const openCreate = () => {
    setEditing(null);
    form.reset({
      name: '',
      appId: '',
      triggerEvent: 'approval-pending',
      recipient: 'employee',
      channels: ['inapp'],
      priority: 'medium',
      templateId: '',
      conditions: '',
      status: 'active',
    });
    setFormOpen(true);
  };

  const openEdit = (rule: NotificationRule) => {
    setEditing(rule);
    form.reset({
      name: rule.name,
      appId: rule.appId,
      triggerEvent: rule.triggerEvent,
      recipient: rule.recipient,
      channels: rule.channels,
      priority: rule.priority,
      templateId: rule.templateId,
      conditions: rule.conditions,
      status: rule.status,
    });
    setFormOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: (values: RuleFormValues) =>
      editing ? Promise.resolve(notificationService.updateRule(editing.id, values)) : Promise.resolve(notificationService.createRule(values)),
    onSuccess: () => {
      invalidate();
      toast.success(editing ? 'Rule updated' : 'Rule created');
      setFormOpen(false);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (rule: NotificationRule) =>
      Promise.resolve(notificationService.updateRule(rule.id, { status: rule.status === 'active' ? 'inactive' : 'active' })),
    onSuccess: (updated) => {
      invalidate();
      toast.success(`Rule ${updated?.status === 'active' ? 'enabled' : 'disabled'}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => Promise.resolve(notificationService.removeRule(id)),
    onSuccess: () => {
      invalidate();
      toast.success('Rule deleted');
      setDeleting(null);
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notification Rules"
        description="Wire trigger events from integrated applications to templates, channels and recipients."
        testId="rules-title"
        actions={
          <Button onClick={openCreate} data-testid="add-rule-button">
            <Plus className="size-4" /> Create Rule
          </Button>
        }
      />

      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search rules or triggers…" className="pl-9" data-testid="rule-search-input" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No rules found" description="Create a rule to start dispatching notifications on application events." />
      ) : (
        <Card className="shadow-sm">
          <CardContent className="p-0">
            <Table data-testid="rules-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Rule</TableHead>
                  <TableHead>Application</TableHead>
                  <TableHead className="hidden lg:table-cell">Trigger</TableHead>
                  <TableHead className="hidden md:table-cell">Channels</TableHead>
                  <TableHead className="hidden md:table-cell">Priority</TableHead>
                  <TableHead className="hidden xl:table-cell">Template</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell>
                      <p className="font-medium text-foreground">{rule.name}</p>
                      <p className="text-xs text-muted-foreground">→ {RECIPIENT_OPTIONS.find((r) => r.value === rule.recipient)?.label ?? rule.recipient}</p>
                    </TableCell>
                    <TableCell>{appName.get(rule.appId) ?? rule.appId}</TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">{TRIGGER_LABELS[rule.triggerEvent]}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {rule.channels.map((channel) => (
                          <span key={channel} className="rounded-md bg-blue-50 px-1.5 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
                            {CHANNEL_LABELS[channel as ChannelKey]}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <StatusBadge value={rule.priority} label={PRIORITY_LABELS[rule.priority]} />
                    </TableCell>
                    <TableCell className="hidden xl:table-cell max-w-40 truncate text-muted-foreground">{templateName.get(rule.templateId) ?? '—'}</TableCell>
                    <TableCell>
                      <StatusBadge value={rule.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={<Button variant="ghost" size="icon-sm" aria-label={`${rule.name} actions`} data-testid={`rule-actions-${rule.id}`} />}
                        >
                          <Pencil className="size-4 rotate-90" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem onClick={() => openEdit(rule)} data-testid={`rule-edit-${rule.id}`}>
                            <Pencil className="size-4" /> Edit rule
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleMutation.mutate(rule)} data-testid={`rule-toggle-${rule.id}`}>
                            <Power className="size-4" /> {rule.status === 'active' ? 'Disable' : 'Enable'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem variant="destructive" onClick={() => setDeleting(rule)} data-testid={`rule-delete-${rule.id}`}>
                            <Trash2 className="size-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[90svh] max-w-xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${editing.name}` : 'Create Notification Rule'}</DialogTitle>
            <DialogDescription>
              Example: when an approval is pending in NPST Finance, notify the approver via In-App + Email with high priority.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))} className="grid gap-4" data-testid="rule-form">
            <div className="space-y-1.5">
              <Label htmlFor="rule-name">Rule name</Label>
              <Input id="rule-name" placeholder="e.g. Stale Approval Escalation" {...form.register('name')} data-testid="rule-name-input" />
              {form.formState.errors.name && <p className="text-xs font-medium text-red-600">{form.formState.errors.name.message}</p>}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Controller
                control={form.control}
                name="appId"
                render={({ field }) => (
                  <div className="space-y-1.5">
                    <Label>Application</Label>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger data-testid="rule-app-select">
                        <SelectValue>{field.value ? appName.get(field.value) : 'Select…'}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {apps.map((app) => (
                          <SelectItem key={app.id} value={app.id}>
                            {app.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.appId && <p className="text-xs font-medium text-red-600">{form.formState.errors.appId.message}</p>}
                  </div>
                )}
              />
              <Controller
                control={form.control}
                name="triggerEvent"
                render={({ field }) => (
                  <div className="space-y-1.5">
                    <Label>Trigger event</Label>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger data-testid="rule-trigger-select">
                        <SelectValue>{TRIGGER_LABELS[field.value]}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(TRIGGER_LABELS) as (keyof typeof TRIGGER_LABELS)[]).map((key) => (
                          <SelectItem key={key} value={key}>
                            {TRIGGER_LABELS[key]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              />
              <Controller
                control={form.control}
                name="recipient"
                render={({ field }) => (
                  <div className="space-y-1.5">
                    <Label>Recipient</Label>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger data-testid="rule-recipient-select">
                        <SelectValue>{RECIPIENT_OPTIONS.find((r) => r.value === field.value)?.label}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {RECIPIENT_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              />
              <Controller
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <div className="space-y-1.5">
                    <Label>Priority</Label>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger data-testid="rule-priority-select">
                        <SelectValue>{PRIORITY_LABELS[field.value]}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(PRIORITY_LABELS) as (keyof typeof PRIORITY_LABELS)[]).map((key) => (
                          <SelectItem key={key} value={key}>
                            {PRIORITY_LABELS[key]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              />
            </div>
            <Controller
              control={form.control}
              name="channels"
              render={({ field }) => (
                <div className="space-y-1.5">
                  <Label>Channels</Label>
                  <div className="flex flex-wrap gap-x-5 gap-y-2">
                    {CHANNEL_KEYS.map((key) => (
                      <label key={key} className="flex cursor-pointer items-center gap-2 text-sm">
                        <Checkbox
                          checked={field.value.includes(key)}
                          onCheckedChange={(checked) =>
                            field.onChange(checked ? [...field.value, key] : field.value.filter((c) => c !== key))
                          }
                          data-testid={`rule-channel-${key}`}
                        />
                        {CHANNEL_LABELS[key]}
                      </label>
                    ))}
                  </div>
                  {form.formState.errors.channels && <p className="text-xs font-medium text-red-600">{form.formState.errors.channels.message}</p>}
                </div>
              )}
            />
            <Controller
              control={form.control}
              name="templateId"
              render={({ field }) => (
                <div className="space-y-1.5">
                  <Label>Template</Label>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger data-testid="rule-template-select">
                      <SelectValue>{field.value ? templateName.get(field.value) : 'Select…'}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.templateId && <p className="text-xs font-medium text-red-600">{form.formState.errors.templateId.message}</p>}
                </div>
              )}
            />
            <div className="space-y-1.5">
              <Label htmlFor="rule-conditions">Conditions</Label>
              <Textarea
                id="rule-conditions"
                rows={3}
                placeholder="e.g. Fires after 24h without action; repeats every 48h until cleared"
                {...form.register('conditions')}
                data-testid="rule-conditions-input"
              />
              {form.formState.errors.conditions && <p className="text-xs font-medium text-red-600">{form.formState.errors.conditions.message}</p>}
            </div>
            <Controller
              control={form.control}
              name="status"
              render={({ field }) => (
                <label className="flex w-fit cursor-pointer items-center gap-2 text-sm">
                  <Checkbox checked={field.value === 'active'} onCheckedChange={(checked) => field.onChange(checked ? 'active' : 'inactive')} data-testid="rule-active-checkbox" />
                  Rule is active
                </label>
              )}
            />
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)} data-testid="rule-form-cancel-button">
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending} data-testid="rule-form-submit-button">
                {editing ? 'Save changes' : 'Create rule'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Delete "${deleting?.name ?? 'rule'}"?`}
        description="The trigger event will no longer dispatch notifications for this rule."
        confirmLabel="Delete rule"
        destructive
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
      />
    </div>
  );
}

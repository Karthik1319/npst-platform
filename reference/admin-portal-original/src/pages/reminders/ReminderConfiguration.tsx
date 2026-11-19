import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Bell, CalendarClock, Clock, Pencil, Plus, Power, Save, Search, ShieldAlert, Trash2 } from 'lucide-react';
import { applicationService } from '@/services/adminService';
import { reminderService } from '@/services/reminderService';
import { masterDataService } from '@/services/masterDataService';
import { uid } from '@/services/storage';
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
import { formatDate } from '@/utils/format';
import {
  CHANNEL_KEYS,
  CHANNEL_LABELS,
  FREQUENCY_LABELS,
  PRIORITY_LABELS,
  RECIPIENT_OPTIONS,
  TRIGGER_LABELS,
} from '@/lib/labels';
import type { ChannelKey, ReminderFrequency, ReminderPolicy, ScheduleStep, TriggerEvent } from '@/types';

const SCHEDULE_RECIPIENTS = ['Employee', 'Approver', 'Reporting Manager', 'Department Head', 'Administrator'];

const policySchema = z.object({
  name: z.string().min(2, 'Reminder name is required'),
  code: z.string().min(2, 'Reminder code is required'),
  reason: z.string().min(2, 'Select a reason'),
  appId: z.string().min(1, 'Select an application'),
  description: z.string().min(10, 'Provide a short description'),
  triggerEvent: z.enum(['employee-onboarding', 'approval-pending', 'task-due', 'payment-received', 'document-expiring', 'deal-stage-change', 'course-due']),
  triggerDate: z.string().min(8, 'Pick a trigger date'),
  frequency: z.enum(['one-time', 'daily', 'weekly', 'monthly', 'custom']),
  customDays: z.number().min(1, 'Custom interval must be at least 1 day'),
  firstReminderAfter: z.number().min(0, 'Cannot be negative'),
  repeatInterval: z.number().min(0, 'Cannot be negative'),
  maxCount: z.number().min(1, 'At least one reminder'),
  recipient: z.string().min(1, 'Select a recipient'),
  channels: z.array(z.enum(['inapp', 'email', 'sms', 'push'])).min(1, 'Pick at least one channel'),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  status: z.enum(['active', 'inactive']),
});

type PolicyFormValues = z.infer<typeof policySchema>;

const STEP_ICONS = { initial: Bell, reminder: Clock, escalation: ShieldAlert } as const;

function defaultSchedule(values: PolicyFormValues): ScheduleStep[] {
  const first = values.firstReminderAfter;
  const repeat = Math.max(values.repeatInterval, 1);
  const recipient = RECIPIENT_OPTIONS.find((r) => r.value === values.recipient)?.label ?? 'Employee';
  return [
    { id: uid(), day: 0, label: 'Initial notification', type: 'initial', recipient, channels: values.channels },
    { id: uid(), day: first, label: 'First reminder', type: 'reminder', recipient, channels: values.channels },
    { id: uid(), day: first + repeat, label: 'Second reminder', type: 'reminder', recipient, channels: values.channels },
    { id: uid(), day: first + repeat * 2, label: 'Escalate to Reporting Manager', type: 'escalation', recipient: 'Reporting Manager', channels: ['email'] },
  ];
}

export default function ReminderConfiguration() {
  const queryClient = useQueryClient();
  const { data: policies = [] } = useQuery({ queryKey: ['reminder-policies'], queryFn: () => reminderService.listPolicies() });
  const { data: apps = [] } = useQuery({ queryKey: ['apps'], queryFn: () => applicationService.list() });
  const { data: codeMasters = [] } = useQuery({ queryKey: ['reminder-code-masters'], queryFn: () => masterDataService.listReminderCodes() });

  const [search, setSearch] = useState('');
  const [selectedAppId, setSelectedAppId] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ReminderPolicy | null>(null);
  const [deleting, setDeleting] = useState<ReminderPolicy | null>(null);
  const [selectedPolicyId, setSelectedPolicyId] = useState<string>('');
  const [steps, setSteps] = useState<ScheduleStep[]>([]);
  const [newCodeOpen, setNewCodeOpen] = useState(false);
  const [newReasonOpen, setNewReasonOpen] = useState(false);
  const [newCode, setNewCode] = useState({ code: '', name: '', category: '', description: '' });
  const [newReason, setNewReason] = useState({ name: '', code: '', description: '' });

  const appName = useMemo(() => new Map(apps.map((a) => [a.id, a.name])), [apps]);

  const form = useForm<PolicyFormValues>({
    resolver: zodResolver(policySchema),
    defaultValues: {
      name: '',
      code: '',
      reason: '',
      appId: '',
      description: '',
      triggerEvent: 'approval-pending',
      triggerDate: format(new Date(), 'yyyy-MM-dd'),
      frequency: 'daily',
      customDays: 2,
      firstReminderAfter: 1,
      repeatInterval: 1,
      maxCount: 3,
      recipient: 'approver',
      channels: ['inapp', 'email'],
      priority: 'medium',
      status: 'active',
    },
  });

  const selectedPolicy = policies.find((p) => p.id === selectedPolicyId) ?? policies[0];

  useEffect(() => {
    if (selectedPolicy) {
      setSteps(selectedPolicy.schedule.map((s) => ({ ...s })));
      setSelectedPolicyId(selectedPolicy.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPolicy?.id]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!selectedAppId) return [];
    const scoped = policies.filter((policy) => policy.appId === selectedAppId);
    if (!q) return scoped;
    return scoped.filter(
      (p) => p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q) || FREQUENCY_LABELS[p.frequency].toLowerCase().includes(q),
    );
  }, [policies, search, selectedAppId]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['reminder-policies'] });
    queryClient.invalidateQueries({ queryKey: ['search-index'] });
    queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
  };

  const openCreate = () => {
    setEditing(null);
    form.reset({
      name: '',
      code: '',
      appId: selectedAppId,
      description: '',
      triggerEvent: 'approval-pending',
      triggerDate: format(new Date(), 'yyyy-MM-dd'),
      frequency: 'daily',
      customDays: 2,
      firstReminderAfter: 1,
      repeatInterval: 1,
      maxCount: 3,
      recipient: 'approver',
      channels: ['inapp', 'email'],
      priority: 'medium',
      status: 'active',
    });
    setFormOpen(true);
  };

  const openEdit = (policy: ReminderPolicy) => {
    setEditing(policy);
    form.reset({
      name: policy.name,
      code: policy.code,
      reason: codeMasters.find((item) => item.code === policy.code)?.reasons[0] ?? '',
      appId: policy.appId,
      description: policy.description,
      triggerEvent: policy.triggerEvent,
      triggerDate: format(new Date(policy.triggerDate), 'yyyy-MM-dd'),
      frequency: policy.frequency,
      customDays: policy.customDays ?? 2,
      firstReminderAfter: policy.firstReminderAfter,
      repeatInterval: policy.repeatInterval,
      maxCount: policy.maxCount,
      recipient: policy.recipient,
      channels: policy.channels,
      priority: policy.priority,
      status: policy.status,
    });
    setFormOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: (values: PolicyFormValues) => {
      const payload = {
        ...values,
        triggerDate: new Date(`${values.triggerDate}T00:00:00Z`).toISOString(),
      };
      if (editing) return Promise.resolve(reminderService.updatePolicy(editing.id, payload));
      return Promise.resolve(reminderService.createPolicy({ ...payload, schedule: defaultSchedule(values) }));
    },
    onSuccess: (policy) => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: ['reminder-instances'] });
      toast.success(editing ? 'Reminder policy updated' : 'Reminder policy created');
      setFormOpen(false);
      if (policy) setSelectedPolicyId(policy.id);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (policy: ReminderPolicy) =>
      Promise.resolve(reminderService.updatePolicy(policy.id, { status: policy.status === 'active' ? 'inactive' : 'active' })),
    onSuccess: (updated) => {
      invalidate();
      toast.success(`Policy ${updated?.status === 'active' ? 'enabled' : 'disabled'}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => Promise.resolve(reminderService.removePolicy(id)),
    onSuccess: () => {
      invalidate();
      toast.success('Reminder policy deleted');
      setDeleting(null);
    },
  });

  const saveScheduleMutation = useMutation({
    mutationFn: ({ policyId, schedule }: { policyId: string; schedule: ScheduleStep[] }) =>
      Promise.resolve(reminderService.updatePolicy(policyId, { schedule })),
    onSuccess: () => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: ['reminder-instances'] });
      toast.success('Reminder schedule saved');
    },
  });

  const createCodeMutation = useMutation({
    mutationFn: () => Promise.resolve(masterDataService.createReminderCode({
      appId: form.getValues('appId'),
      code: newCode.code.trim(),
      name: newCode.name.trim(),
      category: newCode.category.trim(),
      description: newCode.description.trim(),
      reasons: [],
      status: 'active',
    })),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['reminder-code-masters'] });
      form.setValue('code', created.code);
      form.setValue('name', created.name);
      form.setValue('description', created.description);
      form.setValue('reason', '');
      setNewCodeOpen(false);
      toast.success('Reminder code created');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const createReasonMutation = useMutation({
    mutationFn: () => {
      const code = codeMasters.find((item) => item.code === form.getValues('code'));
      if (!code) throw new Error('Select a reminder code first');
      return Promise.resolve(masterDataService.addReminderReason(code.id, newReason.name, newReason.code));
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['reminder-code-masters'] });
      if (updated) form.setValue('reason', newReason.name.trim());
      setNewReasonOpen(false);
      toast.success('Reminder reason created');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const frequency = form.watch('frequency');
  const sortedSteps = [...steps].sort((a, b) => a.day - b.day);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reminder Configuration"
        description="Configure centralized reminder policies — frequency, intervals, recipients, channels and escalation ladders."
        testId="reminder-config-title"
        actions={
          <Button onClick={openCreate} disabled={!selectedAppId} data-testid="add-reminder-policy-button">
            <Plus className="size-4" /> Create Reminder Policy
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="w-full max-w-sm">
          <Label htmlFor="reminders-application">Select Application</Label>
          <Select value={selectedAppId} onValueChange={(value) => { setSelectedAppId(value); setSearch(''); }}>
            <SelectTrigger id="reminders-application" data-testid="reminders-application-select"><SelectValue>{selectedAppId ? appName.get(selectedAppId) : 'Select an application'}</SelectValue></SelectTrigger>
            <SelectContent>{apps.map((app) => <SelectItem key={app.id} value={app.id}>{app.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search policies…" className="pl-9" data-testid="reminder-policy-search-input" />
        </div>
      </div>

      {!selectedAppId ? (
        <EmptyState title="Select an application" description="Please select an application to view its reminder policies." />
      ) : filtered.length === 0 ? (
        <EmptyState title="No reminder policies found" description="Create a policy to start chasing approvals and deadlines automatically." />
      ) : (
        <Card className="shadow-sm">
          <CardContent className="p-0">
            <Table data-testid="reminder-policies-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Policy</TableHead>
                  <TableHead>Application</TableHead>
                  <TableHead className="hidden md:table-cell">Frequency</TableHead>
                  <TableHead className="hidden lg:table-cell">Max</TableHead>
                  <TableHead className="hidden lg:table-cell">Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((policy) => (
                  <TableRow key={policy.id}>
                    <TableCell>
                      <p className="font-medium text-foreground">{policy.name}</p>
                      <p className="font-mono text-xs text-muted-foreground">{policy.code}</p>
                    </TableCell>
                    <TableCell>{appName.get(policy.appId) ?? policy.appId}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
                        {FREQUENCY_LABELS[policy.frequency]}
                        {policy.frequency === 'custom' ? ` (every ${policy.customDays}d)` : ''}
                      </span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">{policy.maxCount}x</TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <StatusBadge value={policy.priority} label={PRIORITY_LABELS[policy.priority]} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge value={policy.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={<Button variant="ghost" size="icon-sm" aria-label={`${policy.name} actions`} data-testid={`reminder-policy-actions-${policy.id}`} />}
                        >
                          <Pencil className="size-4 rotate-90" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem onClick={() => openEdit(policy)} data-testid={`reminder-policy-edit-${policy.id}`}>
                            <Pencil className="size-4" /> Edit policy
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedPolicyId(policy.id);
                              document.getElementById('reminder-schedule-section')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            data-testid={`reminder-policy-schedule-${policy.id}`}
                          >
                            <CalendarClock className="size-4" /> Edit schedule
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleMutation.mutate(policy)} data-testid={`reminder-policy-toggle-${policy.id}`}>
                            <Power className="size-4" /> {policy.status === 'active' ? 'Disable' : 'Enable'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem variant="destructive" onClick={() => setDeleting(policy)} data-testid={`reminder-policy-delete-${policy.id}`}>
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

      {/* Visual scheduling editor */}
      <Card className="shadow-sm" id="reminder-schedule-section">
        <CardContent className="space-y-4 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-heading text-base font-semibold" data-testid="reminder-schedule-title">
                Visual Reminder Scheduling
              </p>
              <p className="text-xs text-muted-foreground">Modify the day offsets, labels and recipients of each step in the chase sequence.</p>
            </div>
            <div className="flex items-center gap-2">
              <Select value={selectedPolicy?.id ?? ''} onValueChange={setSelectedPolicyId}>
                <SelectTrigger className="w-56" data-testid="reminder-schedule-policy-select">
                  <SelectValue>{selectedPolicy?.name ?? 'Select a policy'}</SelectValue>
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
                size="sm"
                onClick={() => selectedPolicy && saveScheduleMutation.mutate({ policyId: selectedPolicy.id, schedule: steps })}
                disabled={saveScheduleMutation.isPending || !selectedPolicy}
                data-testid="reminder-schedule-save-button"
              >
                <Save className="size-4" /> Save Schedule
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-4 overflow-x-auto pb-2 md:flex-row md:items-stretch" data-testid="reminder-schedule-timeline">
            {sortedSteps.map((step, index) => {
              const Icon = STEP_ICONS[step.type];
              return (
                <div key={step.id} className="flex items-stretch gap-0">
                  <div className="w-60 shrink-0 space-y-3 rounded-xl border border-border bg-card p-3.5 shadow-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={
                          step.type === 'escalation'
                            ? 'flex items-center gap-1.5 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/20'
                            : step.type === 'initial'
                              ? 'flex items-center gap-1.5 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-600/20'
                              : 'flex items-center gap-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 ring-1 ring-inset ring-slate-500/20'
                        }
                      >
                        <Icon className="size-3" />
                        {step.type === 'escalation' ? 'Escalation' : step.type === 'initial' ? 'Initial' : 'Reminder'}
                      </span>
                      {steps.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          className="text-red-600 hover:bg-red-50"
                          aria-label="Remove step"
                          onClick={() => setSteps((current) => current.filter((s) => s.id !== step.id))}
                          data-testid={`reminder-schedule-remove-${step.id}`}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Day</span>
                      <Input
                        type="number"
                        min={0}
                        value={step.day}
                        onChange={(e) =>
                          setSteps((current) => current.map((s) => (s.id === step.id ? { ...s, day: Math.max(0, Number(e.target.value)) } : s)))
                        }
                        className="h-8 w-20"
                        data-testid={`reminder-schedule-day-${index}`}
                      />
                    </div>
                    <Input
                      value={step.label}
                      onChange={(e) => setSteps((current) => current.map((s) => (s.id === step.id ? { ...s, label: e.target.value } : s)))}
                      className="h-8"
                      aria-label="Step label"
                      data-testid={`reminder-schedule-label-${index}`}
                    />
                    <Select
                      value={step.recipient}
                      onValueChange={(value) => setSteps((current) => current.map((s) => (s.id === step.id ? { ...s, recipient: value } : s)))}
                    >
                      <SelectTrigger size="sm" data-testid={`reminder-schedule-recipient-${index}`}>
                        <SelectValue>{step.recipient}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {SCHEDULE_RECIPIENTS.map((recipient) => (
                          <SelectItem key={recipient} value={recipient}>
                            {recipient}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {index < sortedSteps.length - 1 && <div className="hidden w-10 self-center md:block" aria-hidden="true"><div className="h-px w-full bg-border" /></div>}
                </div>
              );
            })}
            <button
              type="button"
              onClick={() =>
                setSteps((current) => {
                  const lastDay = current.reduce((max, s) => Math.max(max, s.day), 0);
                  return [
                    ...current,
                    { id: uid(), day: lastDay + 2, label: 'Additional reminder', type: 'reminder', recipient: 'Employee', channels: ['inapp' as ChannelKey] },
                  ];
                })
              }
              className="grid w-full place-items-center rounded-xl border border-dashed border-border p-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/60 md:w-40"
              data-testid="reminder-schedule-add-step-button"
            >
              <span className="flex flex-col items-center gap-1.5">
                <Plus className="size-5" />
                Add step
              </span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Create / edit dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="reminder-policy-modal">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${editing.name}` : 'Create Reminder Policy'}</DialogTitle>
            <DialogDescription>
              Example: an approval pending in NPST Finance — Day 0 initial notification, Day 1 first reminder, Day 3 second, Day 5 escalate.
            </DialogDescription>
          </DialogHeader>
          <form id="reminder-policy-form" onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))} className="reminder-policy-form" data-testid="reminder-policy-form">
            <div className="reminder-modal-body space-y-4">
            <div className="reminder-form-grid">
              <div className="space-y-1.5">
                <Label htmlFor="rem-name">Reminder name</Label>
                <Input id="rem-name" placeholder="e.g. Pending Approval Follow-up" {...form.register('name')} data-testid="reminder-name-input" />
                {form.formState.errors.name && <p className="text-xs font-medium text-red-600">{form.formState.errors.name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Reminder code</Label>
                <Controller control={form.control} name="code" render={({ field }) => (
                  <Select value={field.value} onValueChange={(value) => {
                    field.onChange(value);
                    if (value === '__create__') {
                      setNewCode({ code: '', name: '', category: '', description: '' });
                      setNewCodeOpen(true);
                      return;
                    }
                    const selected = codeMasters.find((item) => item.code === value);
                    if (selected) {
                      form.setValue('name', selected.name);
                      form.setValue('description', selected.description);
                      form.setValue('reason', selected.reasons[0] ?? '');
                    }
                  }}>
                    <SelectTrigger data-testid="reminder-code-select"><SelectValue>{field.value || 'Select a code…'}</SelectValue></SelectTrigger>
                    <SelectContent>
                      {codeMasters.filter((item) => item.appId === form.getValues('appId') && item.status === 'active').map((item) => <SelectItem key={item.id} value={item.code}>{item.code}</SelectItem>)}
                      <SelectItem value="__create__">+ Create New Reminder Code</SelectItem>
                    </SelectContent>
                  </Select>
                )} />
                {form.formState.errors.code && <p className="text-xs font-medium text-red-600">{form.formState.errors.code.message}</p>}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rem-description">Description</Label>
              <Textarea id="rem-description" rows={2} placeholder="What does this policy chase?" {...form.register('description')} data-testid="reminder-description-input" />
              {form.formState.errors.description && <p className="text-xs font-medium text-red-600">{form.formState.errors.description.message}</p>}
            </div>
            <div className="reminder-form-grid">
              <Controller
                control={form.control}
                name="appId"
                render={({ field }) => (
                  <div className="space-y-1.5">
                    <Label>Application</Label>
                    <Select value={field.value} onValueChange={(value) => {
                      field.onChange(value);
                      form.setValue('code', '');
                      form.setValue('reason', '');
                    }}>
                      <SelectTrigger data-testid="reminder-app-select">
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
                    <Select value={field.value} onValueChange={(value) => {
                      if (value === '__create_reason__') {
                        setNewReason({ name: '', code: '', description: '' });
                        setNewReasonOpen(true);
                        return;
                      }
                      field.onChange(value);
                    }}>
                      <SelectTrigger data-testid="reminder-trigger-select">
                        <SelectValue>{TRIGGER_LABELS[field.value]}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(TRIGGER_LABELS) as TriggerEvent[]).map((key) => (
                          <SelectItem key={key} value={key}>
                            {TRIGGER_LABELS[key]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              />
              <div className="space-y-1.5">
                <Label htmlFor="rem-trigger-date">Trigger date</Label>
                <Input id="rem-trigger-date" type="date" {...form.register('triggerDate')} data-testid="reminder-trigger-date-input" />
                {form.formState.errors.triggerDate && <p className="text-xs font-medium text-red-600">{form.formState.errors.triggerDate.message}</p>}
              </div>
            </div>
            <div className="reminder-form-grid">
              <Controller
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <div className="space-y-1.5">
                    <Label>Frequency</Label>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger data-testid="reminder-frequency-select">
                        <SelectValue>{FREQUENCY_LABELS[field.value]}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(FREQUENCY_LABELS) as ReminderFrequency[]).map((key) => (
                          <SelectItem key={key} value={key}>
                            {FREQUENCY_LABELS[key]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              />
              {frequency === 'custom' && (
                <Controller
                  control={form.control}
                  name="customDays"
                  render={({ field }) => (
                    <div className="space-y-1.5">
                      <Label htmlFor="rem-custom">Every (days)</Label>
                      <Input
                        id="rem-custom"
                        type="number"
                        min={1}
                        value={field.value}
                        onChange={(e) => field.onChange(Math.max(1, Number(e.target.value)))}
                        data-testid="reminder-custom-days-input"
                      />
                      {form.formState.errors.customDays && <p className="text-xs font-medium text-red-600">{form.formState.errors.customDays.message}</p>}
                    </div>
                  )}
                />
              )}
              <Controller
                control={form.control}
                name="firstReminderAfter"
                render={({ field }) => (
                  <div className="space-y-1.5">
                    <Label htmlFor="rem-first">First reminder after (days)</Label>
                    <Input
                      id="rem-first"
                      type="number"
                      min={0}
                      value={field.value}
                      onChange={(e) => field.onChange(Math.max(0, Number(e.target.value)))}
                      data-testid="reminder-first-after-input"
                    />
                    {form.formState.errors.firstReminderAfter && <p className="text-xs font-medium text-red-600">{form.formState.errors.firstReminderAfter.message}</p>}
                  </div>
                )}
              />
              <Controller
                control={form.control}
                name="repeatInterval"
                render={({ field }) => (
                  <div className="space-y-1.5">
                    <Label htmlFor="rem-repeat">Repeat interval (days)</Label>
                    <Input
                      id="rem-repeat"
                      type="number"
                      min={0}
                      value={field.value}
                      onChange={(e) => field.onChange(Math.max(0, Number(e.target.value)))}
                      data-testid="reminder-repeat-input"
                    />
                    {form.formState.errors.repeatInterval && <p className="text-xs font-medium text-red-600">{form.formState.errors.repeatInterval.message}</p>}
                  </div>
                )}
              />
              <Controller
                control={form.control}
                name="maxCount"
                render={({ field }) => (
                  <div className="space-y-1.5">
                    <Label htmlFor="rem-max">Max reminders</Label>
                    <Input
                      id="rem-max"
                      type="number"
                      min={1}
                      value={field.value}
                      onChange={(e) => field.onChange(Math.max(1, Number(e.target.value)))}
                      data-testid="reminder-max-count-input"
                    />
                    {form.formState.errors.maxCount && <p className="text-xs font-medium text-red-600">{form.formState.errors.maxCount.message}</p>}
                  </div>
                )}
              />
            </div>
            <div className="reminder-form-grid">
              <Controller
                control={form.control}
                name="recipient"
                render={({ field }) => (
                  <div className="space-y-1.5">
                    <Label>Recipient</Label>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger data-testid="reminder-recipient-select">
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
              <Controller control={form.control} name="reason" render={({ field }) => {
                    const selectedCode = codeMasters.find((item) => item.code === form.getValues('code'));
                    return (
                      <div className="space-y-1.5">
                        <Label>Reason</Label>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger data-testid="reminder-reason-select"><SelectValue>{field.value || 'Select a reason…'}</SelectValue></SelectTrigger>
                          <SelectContent>
                            {(selectedCode?.reasons ?? []).map((reason) => <SelectItem key={reason} value={reason}>{reason}</SelectItem>)}
                            {selectedCode && <SelectItem value="__create_reason__">+ Add New Reason</SelectItem>}
                          </SelectContent>
                        </Select>
                        {selectedCode && <button type="button" className="text-xs font-medium text-primary hover:underline" onClick={() => setNewReasonOpen(true)}>+ Add New Reason</button>}
                        {form.formState.errors.reason && <p className="text-xs font-medium text-red-600">{form.formState.errors.reason.message}</p>}
                      </div>
                    );
                }} />
              <Controller
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <div className="space-y-1.5">
                    <Label>Priority</Label>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger data-testid="reminder-priority-select">
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
              <Controller
                control={form.control}
                name="status"
                render={({ field }) => (
                  <div className="flex items-end pb-1">
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <Checkbox checked={field.value === 'active'} onCheckedChange={(checked) => field.onChange(checked ? 'active' : 'inactive')} data-testid="reminder-active-checkbox" />
                      Policy is active
                    </label>
                  </div>
                )}
              />
            </div>
            <Controller
              control={form.control}
              name="channels"
              render={({ field }) => (
                <div className="space-y-1.5">
                  <Label>Notification channels</Label>
                  <div className="flex flex-wrap gap-x-5 gap-y-2">
                    {CHANNEL_KEYS.map((key) => (
                      <label key={key} className="flex cursor-pointer items-center gap-2 text-sm">
                        <Checkbox
                          checked={field.value.includes(key)}
                          onCheckedChange={(checked) => field.onChange(checked ? [...field.value, key] : field.value.filter((c) => c !== key))}
                          data-testid={`reminder-channel-${key}`}
                        />
                        {CHANNEL_LABELS[key]}
                      </label>
                    ))}
                  </div>
                  {form.formState.errors.channels && <p className="text-xs font-medium text-red-600">{form.formState.errors.channels.message}</p>}
                </div>
              )}
            />
            </div>
            <DialogFooter className="shrink-0 gap-2 border-t bg-background pt-4">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)} data-testid="reminder-form-cancel-button">
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending} data-testid="reminder-form-submit-button">
                {editing ? 'Save changes' : 'Create policy'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={newCodeOpen} onOpenChange={setNewCodeOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Create New Reminder Code</DialogTitle><DialogDescription>Application: {appName.get(form.getValues('appId')) ?? 'Select an application first'}</DialogDescription></DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5"><Label>Reminder code</Label><Input inputMode="numeric" value={newCode.code} onChange={(e) => setNewCode((v) => ({ ...v, code: e.target.value.replace(/\D/g, '') }))} placeholder="2001" /></div>
            <div className="space-y-1.5"><Label>Reminder name</Label><Input value={newCode.name} onChange={(e) => setNewCode((v) => ({ ...v, name: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Category</Label><Input value={newCode.category} onChange={(e) => setNewCode((v) => ({ ...v, category: e.target.value }))} /></div>
            <div className="space-y-1.5 sm:col-span-2"><Label>Description</Label><Textarea value={newCode.description} onChange={(e) => setNewCode((v) => ({ ...v, description: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setNewCodeOpen(false)}>Cancel</Button><Button onClick={() => createCodeMutation.mutate()} disabled={createCodeMutation.isPending || !form.getValues('appId') || !newCode.code || !newCode.name || !newCode.category || !newCode.description}>Create code</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={newReasonOpen} onOpenChange={setNewReasonOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add New Reason</DialogTitle><DialogDescription>Reason for {form.getValues('code') || 'the selected reminder code'}.</DialogDescription></DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-1.5"><Label>Reason name</Label><Input value={newReason.name} onChange={(e) => setNewReason((v) => ({ ...v, name: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Reason code</Label><Input value={newReason.code} onChange={(e) => setNewReason((v) => ({ ...v, code: e.target.value.toUpperCase().replace(/\s+/g, '_') }))} placeholder="DOCUMENT_NOT_SUBMITTED" /></div>
            <div className="space-y-1.5"><Label>Description</Label><Textarea value={newReason.description} onChange={(e) => setNewReason((v) => ({ ...v, description: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setNewReasonOpen(false)}>Cancel</Button><Button onClick={() => createReasonMutation.mutate()} disabled={createReasonMutation.isPending || !newReason.name.trim() || !newReason.code.trim() || !form.getValues('code')}>Create reason</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Delete "${deleting?.name ?? 'policy'}"?`}
        description="Scheduled instances under this policy will stop chasing. History entries are kept."
        confirmLabel="Delete policy"
        destructive
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
      />
    </div>
  );
}

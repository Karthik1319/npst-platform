import { useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { addDays, format } from 'date-fns';
import { Copy, Eye, Pencil, Plus, Power, Search, Trash2 } from 'lucide-react';
import { applicationService } from '@/services/adminService';
import { notificationService } from '@/services/notificationService';
import { masterDataService } from '@/services/masterDataService';
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
  CATEGORY_LABELS,
  CHANNEL_ICONS,
  CHANNEL_LABELS,
  PRIORITY_LABELS,
  TEMPLATE_VARIABLES,
} from '@/lib/labels';
import type { NotificationTemplate } from '@/types';

const templateSchema = z.object({
  name: z.string().min(2, 'Template name is required'),
  code: z.string().min(2, 'Template code is required'),
  appId: z.string().min(1, 'Select an application'),
  category: z.enum(['welcome', 'reminder', 'approval', 'alert', 'announcement']),
  channels: z.array(z.enum(['inapp', 'email', 'sms', 'push'])).min(1, 'Select at least one channel'),
  channel: z.enum(['inapp', 'email', 'sms', 'push']),
  subject: z.string().min(3, 'Subject is required'),
  body: z.string().min(10, 'Message body is required'),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  status: z.enum(['active', 'inactive']),
});

type TemplateFormValues = z.infer<typeof templateSchema>;

const SAMPLE_VARS: Record<string, string> = {
  employeeName: 'Priya Sharma',
  applicationName: 'Keka HR',
  dueDate: format(addDays(new Date(), 7), 'dd MMM yyyy'),
  taskName: 'Q3 report submission',
  managerName: 'Rohit Kulkarni',
  amount: '₹42,500',
};

const renderWithVars = (text: string) =>
  text.replace(/\{\{\s*[\w.]+\s*\}\}/g, (m) => {
    const key = m.replace(/\{\{|\}\}|\s/g, '');
    return SAMPLE_VARS[key] ?? m;
  });

export default function Templates() {
  const queryClient = useQueryClient();
  const { data: templates = [] } = useQuery({ queryKey: ['notification-templates'], queryFn: () => notificationService.listTemplates() });
  const { data: apps = [] } = useQuery({ queryKey: ['apps'], queryFn: () => applicationService.list() });
  const { data: codeMasters = [] } = useQuery({ queryKey: ['notification-code-masters'], queryFn: () => masterDataService.listNotificationCodes() });

  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<NotificationTemplate | null>(null);
  const [deleting, setDeleting] = useState<NotificationTemplate | null>(null);
  const [previewing, setPreviewing] = useState<NotificationTemplate | null>(null);
  const [newCodeOpen, setNewCodeOpen] = useState(false);
  const [newCode, setNewCode] = useState({ appId: '', code: '', name: '', category: 'announcement', description: '' });
  const [newCodeError, setNewCodeError] = useState('');
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const appName = useMemo(() => new Map(apps.map((a) => [a.id, a.name])), [apps]);

  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: { name: '', code: '', appId: '', category: 'announcement', channel: 'inapp', channels: ['inapp'], subject: '', body: '', priority: 'medium', status: 'active' },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return templates;
    return templates.filter(
      (t) => t.name.toLowerCase().includes(q) || t.code.toLowerCase().includes(q) || t.subject.toLowerCase().includes(q),
    );
  }, [templates, search]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['notification-templates'] });
    queryClient.invalidateQueries({ queryKey: ['search-index'] });
    queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
  };

  const openCreate = () => {
    setEditing(null);
    form.reset({ name: '', code: '', appId: '', category: 'announcement', channel: 'inapp', channels: ['inapp'], subject: '', body: '', priority: 'medium', status: 'active' });
    setFormOpen(true);
  };

  const openEdit = (template: NotificationTemplate) => {
    setEditing(template);
    form.reset({
      name: template.name,
      code: template.code,
      appId: template.appId,
      category: template.category,
      channel: template.channel,
      channels: template.channels ?? [template.channel],
      subject: template.subject,
      body: template.body,
      priority: template.priority,
      status: template.status,
    });
    setFormOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: (values: TemplateFormValues) => {
      const duplicate = templates.some((template) => template.code.toLowerCase() === values.code.trim().toLowerCase() && template.appId === values.appId && template.id !== editing?.id);
      if (duplicate) throw new Error('Template code must be unique within the selected application');
      const payload = { ...values, code: values.code.trim(), channel: values.channels[0] };
      return editing
        ? Promise.resolve(notificationService.updateTemplate(editing.id, payload))
        : Promise.resolve(notificationService.createTemplate(payload));
    },
    onSuccess: () => {
      invalidate();
      toast.success(editing ? 'Template updated' : 'Template created');
      setFormOpen(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const createCodeMutation = useMutation({
    mutationFn: () => {
      const code = newCode.code.trim();
      if (!/^\d+$/.test(code)) throw new Error('Template code must contain numbers only');
      return Promise.resolve(masterDataService.createNotificationCode({ ...newCode, code, status: 'active' }));
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['notification-code-masters'] });
      form.setValue('appId', created.appId);
      form.setValue('code', created.code);
      form.setValue('name', created.name);
      setNewCodeOpen(false);
      toast.success('Notification code created');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: string) => Promise.resolve(notificationService.duplicateTemplate(id)),
    onSuccess: () => {
      invalidate();
      toast.success('Template duplicated');
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (template: NotificationTemplate) =>
      Promise.resolve(notificationService.updateTemplate(template.id, { status: template.status === 'active' ? 'inactive' : 'active' })),
    onSuccess: (updated) => {
      invalidate();
      toast.success(`Template ${updated?.status === 'active' ? 'activated' : 'deactivated'}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => Promise.resolve(notificationService.removeTemplate(id)),
    onSuccess: () => {
      invalidate();
      toast.success('Template deleted');
      setDeleting(null);
    },
  });

  const insertVariable = (variable: string) => {
    const current = form.getValues('body');
    const el = bodyRef.current;
    if (!el) {
      form.setValue('body', `${current}${variable}`, { shouldValidate: true });
      return;
    }
    const start = el.selectionStart ?? current.length;
    const end = el.selectionEnd ?? start;
    const next = `${current.slice(0, start)}${variable}${current.slice(end)}`;
    form.setValue('body', next, { shouldValidate: true });
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = start + variable.length;
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notification Templates"
        description="Reusable message templates with dynamic variables, routed to any channel for any application."
        testId="templates-title"
        actions={
          <Button onClick={openCreate} data-testid="add-template-button">
            <Plus className="size-4" /> Create Template
          </Button>
        }
      />

      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search templates…" className="pl-9" data-testid="template-search-input" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No templates found" description="Create your first template or adjust the search." />
      ) : (
        <Card className="shadow-sm">
          <CardContent className="p-0">
            <Table data-testid="templates-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Template</TableHead>
                  <TableHead>Application</TableHead>
                  <TableHead className="hidden lg:table-cell">Category</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead className="hidden md:table-cell">Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden xl:table-cell">Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((template) => {
                  const channels = template.channels ?? [template.channel];
                  return (
                    <TableRow key={template.id}>
                      <TableCell>
                        <p className="font-medium text-foreground">{template.name}</p>
                        <p className="font-mono text-xs text-muted-foreground">{template.code}</p>
                      </TableCell>
                      <TableCell>{appName.get(template.appId) ?? template.appId}</TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">{CATEGORY_LABELS[template.category]}</TableCell>
                      <TableCell>
                        <span className="flex flex-wrap items-center gap-1.5 text-sm">
                          {channels.map((channel) => {
                            const Icon = CHANNEL_ICONS[channel];
                            return <span key={channel} className="flex items-center gap-1"><Icon className="size-3.5 text-blue-600" /> {CHANNEL_LABELS[channel]}</span>;
                          })}
                        </span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <StatusBadge value={template.priority} label={PRIORITY_LABELS[template.priority]} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge value={template.status} />
                      </TableCell>
                      <TableCell className="hidden xl:table-cell whitespace-nowrap text-muted-foreground">{formatDate(template.updatedAt)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={<Button variant="ghost" size="icon-sm" aria-label={`${template.name} actions`} data-testid={`template-actions-${template.id}`} />}
                          >
                            <Pencil className="size-4 rotate-90" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => openEdit(template)} data-testid={`template-edit-${template.id}`}>
                              <Pencil className="size-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setPreviewing(template)} data-testid={`template-preview-${template.id}`}>
                              <Eye className="size-4" /> Preview
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => duplicateMutation.mutate(template.id)} data-testid={`template-duplicate-${template.id}`}>
                              <Copy className="size-4" /> Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleMutation.mutate(template)} data-testid={`template-toggle-${template.id}`}>
                              <Power className="size-4" /> {template.status === 'active' ? 'Deactivate' : 'Activate'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem variant="destructive" onClick={() => setDeleting(template)} data-testid={`template-delete-${template.id}`}>
                              <Trash2 className="size-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Create / edit dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="notification-template-modal">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${editing.name}` : 'Create Notification Template'}</DialogTitle>
            <DialogDescription>Variables like {'{{employeeName}}'} are substituted when the notification is dispatched.</DialogDescription>
          </DialogHeader>
          <form id="notification-template-form" onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))} className="notification-template-form" data-testid="template-form">
            <div className="notification-template-body space-y-4">
            <h3 className="border-b pb-2 text-sm font-semibold">Template Identification</h3>
            <div className="notification-form-grid">
              <Controller
                control={form.control}
                name="appId"
                render={({ field }) => (
                  <div className="space-y-1.5">
                    <Label>Application</Label>
                    <Select value={field.value} onValueChange={(value) => {
                      field.onChange(value);
                      form.setValue('code', '');
                      form.setValue('name', '');
                    }}>
                      <SelectTrigger data-testid="template-app-select"><SelectValue>{field.value ? appName.get(field.value) : 'Select…'}</SelectValue></SelectTrigger>
                      <SelectContent>{apps.map((app) => <SelectItem key={app.id} value={app.id}>{app.name}</SelectItem>)}</SelectContent>
                    </Select>
                    {form.formState.errors.appId && <p className="text-xs font-medium text-red-600">{form.formState.errors.appId.message}</p>}
                  </div>
                )}
              />
              <Controller
                control={form.control}
                name="category"
                render={({ field }) => (
                  <div className="space-y-1.5">
                    <Label>Category</Label>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger data-testid="template-category-select"><SelectValue>{CATEGORY_LABELS[field.value]}</SelectValue></SelectTrigger>
                      <SelectContent>{(Object.keys(CATEGORY_LABELS) as (keyof typeof CATEGORY_LABELS)[]).map((key) => <SelectItem key={key} value={key}>{CATEGORY_LABELS[key]}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                )}
              />
            </div>
            <div className="notification-form-grid">
              <div className="space-y-1.5">
                <Label htmlFor="tpl-name">Template name</Label>
                <Input id="tpl-name" placeholder="e.g. Keka — Leave Reminder" {...form.register('name')} data-testid="template-name-input" />
                {form.formState.errors.name && <p className="text-xs font-medium text-red-600">{form.formState.errors.name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Template code</Label>
                <div className="flex gap-2">
                  <Controller control={form.control} name="code" render={({ field }) => (
                    <Select value={field.value} onValueChange={(value) => {
                      field.onChange(value);
                      const selected = codeMasters.find((item) => item.code === value);
                      if (selected) {
                        form.setValue('name', selected.name);
                        form.setValue('category', selected.category === 'Approvals' ? 'approval' : selected.category === 'Onboarding' ? 'welcome' : 'announcement');
                      }
                    }}>
                      <SelectTrigger className="min-w-0 flex-1" data-testid="template-code-select"><SelectValue>{field.value || 'Select a code…'}</SelectValue></SelectTrigger>
                      <SelectContent>{codeMasters.filter((item) => item.appId === form.getValues('appId') && item.status === 'active').map((item) => <SelectItem key={item.id} value={item.code}>{item.code}</SelectItem>)}</SelectContent>
                    </Select>
                  )} />
                  <Button type="button" variant="outline" size="icon" title="Copy template code" onClick={() => navigator.clipboard.writeText(form.getValues('code'))} data-testid="template-code-copy"><Copy className="size-4" /></Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => { setNewCode({ ...newCode, appId: form.getValues('appId') }); setNewCodeOpen(true); }}>+ New</Button>
                </div>
                {form.formState.errors.code && <p className="text-xs font-medium text-red-600">{form.formState.errors.code.message}</p>}
              </div>
            </div>
            <h3 className="border-b pb-2 text-sm font-semibold">Notification Configuration</h3>
            <div className="notification-form-grid">
              <Controller control={form.control} name="channels" render={({ field }) => (
                <div className="space-y-1.5">
                  <Label>Delivery channels</Label>
                  <div className="grid grid-cols-2 gap-2 rounded-lg border border-border p-3">
                    {(Object.keys(CHANNEL_LABELS) as (keyof typeof CHANNEL_LABELS)[]).map((key) => (
                      <label key={key} className="flex items-center gap-2 text-sm">
                        <Checkbox checked={field.value.includes(key)} onCheckedChange={(checked) => field.onChange(checked ? [...field.value, key] : field.value.filter((value) => value !== key))} />
                        {CHANNEL_LABELS[key]}
                      </label>
                    ))}
                  </div>
                  {form.formState.errors.channels && <p className="text-xs font-medium text-red-600">{form.formState.errors.channels.message}</p>}
                </div>
              )} />
              <Controller
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <div className="space-y-1.5">
                    <Label>Priority</Label>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger data-testid="template-priority-select">
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
            <div className="space-y-1.5">
              <Label htmlFor="tpl-subject">Subject</Label>
              <Input id="tpl-subject" placeholder="Welcome to {{applicationName}}, {{employeeName}}!" {...form.register('subject')} data-testid="template-subject-input" />
              {form.formState.errors.subject && <p className="text-xs font-medium text-red-600">{form.formState.errors.subject.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tpl-body">Message body</Label>
              <div className="flex flex-wrap gap-1.5 pb-1">
                {TEMPLATE_VARIABLES.map((variable) => (
                  <button
                    key={variable}
                    type="button"
                    onClick={() => insertVariable(variable)}
                    className="rounded-full bg-blue-50 px-2.5 py-0.5 font-mono text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20 transition-colors hover:bg-blue-100"
                    data-testid={`template-variable-${variable.replace(/\{\{|\}\}/g, '')}`}
                  >
                    {variable}
                  </button>
                ))}
              </div>
              <Controller
                control={form.control}
                name="body"
                render={({ field }) => (
                  <Textarea
                    id="tpl-body"
                    rows={5}
                    ref={(el) => {
                      bodyRef.current = el;
                      field.ref?.(el);
                    }}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="Hi {{employeeName}}, …"
                    data-testid="template-body-textarea"
                  />
                )}
              />
              {form.formState.errors.body && <p className="text-xs font-medium text-red-600">{form.formState.errors.body.message}</p>}
            </div>
            <Controller
              control={form.control}
              name="status"
              render={({ field }) => (
                <label className="flex w-fit cursor-pointer items-center gap-2 text-sm">
                  <Checkbox checked={field.value === 'active'} onCheckedChange={(checked) => field.onChange(checked ? 'active' : 'inactive')} data-testid="template-active-checkbox" />
                  Template is active
                </label>
              )}
            />
            </div>
            <DialogFooter className="shrink-0 gap-2 border-t bg-background pt-4">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)} data-testid="template-form-cancel-button">
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending} data-testid="template-form-submit-button">
                {editing ? 'Save changes' : 'Create template'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Preview dialog */}
      <Dialog open={previewing !== null} onOpenChange={(open) => !open && setPreviewing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Template preview</DialogTitle>
            <DialogDescription>Sample data is substituted for the dynamic variables.</DialogDescription>
          </DialogHeader>
          {previewing && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 font-medium">
                  {(() => {
                    const Icon = CHANNEL_ICONS[previewing.channel];
                    return <Icon className="size-3.5 text-blue-600" />;
                  })()}
                  {CHANNEL_LABELS[previewing.channel]}
                </span>
                <StatusBadge value={previewing.priority} label={PRIORITY_LABELS[previewing.priority]} />
                <StatusBadge value={previewing.status} />
              </div>
              <div className="rounded-xl border border-border p-4 shadow-sm">
                <p className="font-heading text-sm font-bold">{renderWithVars(previewing.subject)}</p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{renderWithVars(previewing.body)}</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Variables detected: <span className="font-mono">{previewing.variables.join(', ') || 'none'}</span>
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={newCodeOpen} onOpenChange={setNewCodeOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Notification Code</DialogTitle>
            <DialogDescription>Create a reusable code master first, then configure its message definition.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-1.5"><Label>Application</Label><Select value={newCode.appId} onValueChange={(appId) => setNewCode((current) => ({ ...current, appId }))}><SelectTrigger><SelectValue>{apps.find((app) => app.id === newCode.appId)?.name ?? 'Select…'}</SelectValue></SelectTrigger><SelectContent>{apps.map((app) => <SelectItem key={app.id} value={app.id}>{app.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Template code</Label>
                <Input
                  inputMode="numeric"
                  value={newCode.code}
                  onChange={(event) => {
                    const value = event.target.value;
                    setNewCodeError(value && !/^\d+$/.test(value.trim()) ? 'Template code must contain numbers only.' : '');
                    setNewCode((current) => ({ ...current, code: value.replace(/\D/g, '') }));
                  }}
                  placeholder="1001"
                />
                {newCodeError && <p className="text-xs font-medium text-red-600">{newCodeError}</p>}
              </div>
              <div className="space-y-1.5"><Label>Template name</Label><Input value={newCode.name} onChange={(event) => setNewCode((current) => ({ ...current, name: event.target.value }))} /></div>
            </div>
            <div className="space-y-1.5"><Label>Description</Label><Textarea value={newCode.description} onChange={(event) => setNewCode((current) => ({ ...current, description: event.target.value }))} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setNewCodeOpen(false)}>Cancel</Button><Button onClick={() => createCodeMutation.mutate()} disabled={createCodeMutation.isPending || !newCode.appId || !newCode.code || !newCode.name}>Create code</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Delete "${deleting?.name ?? 'template'}"?`}
        description="Rules referencing this template will keep their last rendered message, but new dispatches will fail until re-pointed."
        confirmLabel="Delete template"
        destructive
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
      />
    </div>
  );
}

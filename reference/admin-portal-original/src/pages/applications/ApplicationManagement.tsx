import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Bell,
  ExternalLink,
  Eye,
  LayoutGrid,
  List,
  Palette,
  Pencil,
  Plus,
  Power,
  Search,
  Trash2,
} from 'lucide-react';
import { applicationService } from '@/services/adminService';
import { brandingService } from '@/services/brandingService';
import { adminNotificationService, adminRoles } from '@/services/adminNotificationService';
import { useAuth } from '@/context/AuthContext';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { AppAvatar } from '@/components/common/AppAvatar';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { ColorPicker } from '@/components/branding/ColorPicker';
import { Button, buttonVariants } from '@/components/ui/button';
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
import { formatDate, timeAgo } from '@/utils/format';
import { BRANDING_STATUS_LABELS, INTEGRATION_LABELS, NOTIF_INTEGRATION_LABELS } from '@/lib/labels';
import type { NpstApplication } from '@/types';

const appSchema = z.object({
  name: z.string().min(2, 'Application name is required'),
  code: z.string().min(2, 'Application code is required'),
  url: z.string().url('Enter a valid URL (https://…)'),
  description: z.string().min(10, 'Provide a short description (10+ characters)'),
  color: z.string().min(4, 'Pick a brand color'),
  status: z.enum(['active', 'inactive', 'pending']),
  applyBasicTheme: z.boolean(),
});

type AppFormValues = z.infer<typeof appSchema>;

export default function ApplicationManagement() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: apps = [] } = useQuery({ queryKey: ['apps'], queryFn: () => applicationService.list() });
  const { data: approvalRequests = [] } = useQuery({ queryKey: ['branding-approvals'], queryFn: () => brandingService.listApprovalRequests() });
  const canDelete = user?.role === 'Super Admin';

  const [view, setView] = useState<'grid' | 'table'>('grid');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | NpstApplication['status']>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<NpstApplication | null>(null);
  const [viewing, setViewing] = useState<NpstApplication | null>(null);
  const [deleting, setDeleting] = useState<NpstApplication | null>(null);

  const form = useForm<AppFormValues>({
    resolver: zodResolver(appSchema),
    defaultValues: { name: '', code: '', url: 'https://', description: '', color: '#2563EB', status: 'active', applyBasicTheme: true },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return apps.filter((a) => {
      if (statusFilter !== 'all' && a.status !== statusFilter) return false;
      return !q || a.name.toLowerCase().includes(q) || a.code.toLowerCase().includes(q) || a.description.toLowerCase().includes(q);
    });
  }, [apps, search, statusFilter]);

  const openCreate = () => {
    setEditing(null);
    form.reset({ name: '', code: '', url: 'https://', description: '', color: '#2563EB', status: 'active', applyBasicTheme: true });
    setFormOpen(true);
  };

  const openEdit = (app: NpstApplication) => {
    setEditing(app);
    form.reset({
      name: app.name,
      code: app.code,
      url: app.url,
      description: app.description,
      color: app.color,
      status: app.status,
      applyBasicTheme: false,
    });
    setFormOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async (values: AppFormValues) => {
      const { applyBasicTheme, ...applicationValues } = values;
      const payload = { ...applicationValues, registrationDate: editing?.registrationDate ?? new Date().toISOString(), lastUpdated: new Date().toISOString() };
      return editing
        ? Promise.resolve(applicationService.update(editing.id, payload))
        : Promise.resolve(
            applicationService.create({
              ...payload,
              brandingStatus: 'not-configured',
              notificationStatus: 'not-integrated',
            }),
          ).then(async (created) => {
            if (applyBasicTheme && created) brandingService.applyBasicTheme(created.id);
            return created;
          });
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['apps'] });
      queryClient.invalidateQueries({ queryKey: ['search-index'] });
      adminNotificationService.create({
        title: editing ? 'Application configuration updated' : 'New application registered',
        description: editing ? 'An application configuration was updated.' : 'A new application was registered.',
        roles: adminRoles,
      });
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
      toast.success(editing ? 'Application updated' : 'Application added successfully');
      setFormOpen(false);
      if (!editing && created) {
        if (form.getValues('applyBasicTheme')) {
          toast.success('Application created with the basic theme');
        } else {
          navigate(`/branding/configure/${created.id}`);
        }
      }
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (app: NpstApplication) =>
      Promise.resolve(
        applicationService.update(app.id, { status: app.status === 'active' ? 'inactive' : 'active', lastUpdated: new Date().toISOString() }),
      ),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['apps'] });
      toast.success(`${updated?.name} integration ${updated?.status === 'active' ? 'enabled' : 'disabled'}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (app: NpstApplication) => {
      if (approvalRequests.some((request) => request.appId === app.id && request.status === 'pending')) {
        throw new Error('This application has a pending branding approval request. Resolve it before deletion.');
      }
      return Promise.resolve(applicationService.deactivate(app.id));
    },
    onSuccess: (deleted) => {
      queryClient.invalidateQueries({ queryKey: ['apps'] });
      queryClient.invalidateQueries({ queryKey: ['search-index'] });
      queryClient.invalidateQueries({ queryKey: ['branding-configs'] });
      toast.success(`${deleted.name} was deleted`);
      setDeleting(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Register and manage the internal applications connected to NPST Shared Services."
        testId="dashboard-title"
        actions={
          <Button onClick={openCreate} data-testid="add-application-button">
            <Plus className="size-4" /> Add Application
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, code or description…"
            className="pl-9"
            data-testid="application-search-input"
          />
        </div>
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}>
          <SelectTrigger className="w-full sm:w-40" data-testid="application-status-filter"><SelectValue>{statusFilter === 'all' ? 'All statuses' : statusFilter}</SelectValue></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
          <Button variant={view === 'grid' ? 'secondary' : 'ghost'} size="sm" onClick={() => setView('grid')} data-testid="applications-grid-view-button">
            <LayoutGrid className="size-4" /> Grid
          </Button>
          <Button variant={view === 'table' ? 'secondary' : 'ghost'} size="sm" onClick={() => setView('table')} data-testid="applications-table-view-button">
            <List className="size-4" /> Table
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No applications found" description="Adjust your search or add a new application to get started." />
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3" data-testid="applications-grid">
          {filtered.map((app) => (
            <Card key={app.id} className="shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
              <CardContent className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <AppAvatar name={app.name} color={app.color} className="size-11" />
                    <div>
                      <p className="font-heading font-bold text-foreground">{app.name}</p>
                      <p className="font-mono text-xs text-muted-foreground">{app.code}</p>
                    </div>
                  </div>
                  <AppActionsMenu
                    app={app}
                    onView={() => setViewing(app)}
                    onEdit={() => openEdit(app)}
                    onToggle={() => toggleMutation.mutate(app)}
                    onDelete={canDelete ? () => setDeleting(app) : undefined}
                  />
                </div>
                <p className="line-clamp-2 min-h-10 text-sm text-muted-foreground">{app.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  <StatusBadge value={app.status} label={INTEGRATION_LABELS[app.status]} />
                  <StatusBadge value={app.brandingStatus} label={BRANDING_STATUS_LABELS[app.brandingStatus]} />
                  <StatusBadge value={app.notificationStatus} label={NOTIF_INTEGRATION_LABELS[app.notificationStatus]} />
                </div>
                <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                  <span>Updated {timeAgo(app.lastUpdated)}</span>
                  <a href={app.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 font-medium text-blue-600 hover:underline">
                    {app.url.replace(/^https?:\/\//, '')} <ExternalLink className="size-3" />
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="shadow-sm" >
          <CardContent className="p-0">
            <Table data-testid="applications-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Application</TableHead>
                  <TableHead className="hidden md:table-cell">URL</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Branding</TableHead>
                  <TableHead className="hidden lg:table-cell">Notifications</TableHead>
                  <TableHead className="hidden sm:table-cell">Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <AppAvatar name={app.name} color={app.color} className="size-9" />
                        <div>
                          <p className="font-medium text-foreground">{app.name}</p>
                          <p className="font-mono text-xs text-muted-foreground">{app.code}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <a href={app.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {app.url.replace(/^https?:\/\//, '')}
                      </a>
                    </TableCell>
                    <TableCell>
                      <StatusBadge value={app.status} label={INTEGRATION_LABELS[app.status]} />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <StatusBadge value={app.brandingStatus} label={BRANDING_STATUS_LABELS[app.brandingStatus]} />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <StatusBadge value={app.notificationStatus} label={NOTIF_INTEGRATION_LABELS[app.notificationStatus]} />
                    </TableCell>
                    <TableCell className="hidden sm:table-cell whitespace-nowrap text-muted-foreground">{formatDate(app.lastUpdated)}</TableCell>
                    <TableCell className="text-right">
                      <AppActionsMenu
                        app={app}
                        onView={() => setViewing(app)}
                        onEdit={() => openEdit(app)}
                        onToggle={() => toggleMutation.mutate(app)}
                        onDelete={canDelete ? () => setDeleting(app) : undefined}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Add / Edit dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${editing.name}` : 'Add New Application'}</DialogTitle>
            <DialogDescription>
              Register an internal application so it can consume branding, notification and reminder services.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))}
            className="grid gap-4"
            data-testid="application-form"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="app-name">Application name</Label>
                <Input id="app-name" placeholder="e.g. NPST Sales CRM" {...form.register('name')} data-testid="application-name-input" />
                {form.formState.errors.name && <p className="text-xs font-medium text-red-600">{form.formState.errors.name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="app-code">Application code</Label>
                <Input id="app-code" placeholder="e.g. NPST-CRM" {...form.register('code')} data-testid="application-code-input" />
                {form.formState.errors.code && <p className="text-xs font-medium text-red-600">{form.formState.errors.code.message}</p>}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="app-url">Application URL</Label>
              <Input id="app-url" placeholder="https://app.npst.com" {...form.register('url')} data-testid="application-url-input" />
              {form.formState.errors.url && <p className="text-xs font-medium text-red-600">{form.formState.errors.url.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="app-description">Description</Label>
              <Textarea
                id="app-description"
                rows={3}
                placeholder="What does this application do, and which shared services does it consume?"
                {...form.register('description')}
                data-testid="application-description-input"
              />
              {form.formState.errors.description && (
                <p className="text-xs font-medium text-red-600">{form.formState.errors.description.message}</p>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Controller
                control={form.control}
                name="color"
                render={({ field }) => (
                  <ColorPicker label="Brand color" value={field.value} onChange={field.onChange} testId="application-color" />
                )}
              />
              <div className="space-y-1.5">
                <Label>Integration status</Label>
                <Controller
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger data-testid="application-status-select">
                        <SelectValue>{field.value ? INTEGRATION_LABELS[field.value] : ''}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="inactive">Disabled</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              {!editing && (
                <Controller
                  control={form.control}
                  name="applyBasicTheme"
                  render={({ field }) => (
                    <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-border bg-muted/30 p-3">
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} data-testid="application-basic-theme-checkbox" />
                      <span>
                        <span className="block text-sm font-medium text-foreground">Apply Basic Theme</span>
                        <span className="block text-xs text-muted-foreground">Automatically apply the default NPST basic theme to this application.</span>
                      </span>
                    </label>
                  )}
                />
              )}
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)} data-testid="application-form-cancel-button">
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending} data-testid="application-form-submit-button">
                {editing ? 'Save changes' : 'Add application'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Details dialog */}
      <Dialog open={viewing !== null} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent className="max-w-lg">
          {viewing && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <AppAvatar name={viewing.name} color={viewing.color} className="size-12" />
                  <div>
                    <DialogTitle className="text-left">{viewing.name}</DialogTitle>
                    <DialogDescription className="font-mono">{viewing.code}</DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <p className="text-muted-foreground">{viewing.description}</p>
                <div className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-muted/40 p-4">
                  <Detail label="Integration status" value={<StatusBadge value={viewing.status} label={INTEGRATION_LABELS[viewing.status]} />} />
                  <Detail label="Branding" value={<StatusBadge value={viewing.brandingStatus} label={BRANDING_STATUS_LABELS[viewing.brandingStatus]} />} />
                  <Detail label="Notifications" value={<StatusBadge value={viewing.notificationStatus} label={NOTIF_INTEGRATION_LABELS[viewing.notificationStatus]} />} />
                  <Detail label="URL" value={<a href={viewing.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{viewing.url}</a>} />
                  <Detail label="Registration date" value={formatDate(viewing.registrationDate ?? viewing.lastUpdated)} />
                  <Detail label="Last updated" value={formatDate(viewing.lastUpdated)} />
                </div>
                <div className="flex gap-2">
                  <Link className={buttonVariants({ variant: 'outline', size: 'sm' })} to={`/branding/configure/${viewing.id}`} data-testid="application-detail-branding-link">
                    <Palette className="size-4" /> Configure Branding
                  </Link>
                  <Link className={buttonVariants({ variant: 'outline', size: 'sm' })} to="/notifications/templates" data-testid="application-detail-notifications-link">
                    <Bell className="size-4" /> Manage Notifications
                  </Link>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Delete ${deleting?.name ?? 'application'}?`}
        description={`Are you sure you want to delete ${deleting?.name ?? 'this application'}? This action will remove the application from the Shared Services platform and may affect its associated configurations.\n\nApplication code: ${deleting?.code ?? '—'}\n\nHistorical configurations and audit records will be preserved.`}
        confirmLabel="Delete application"
        destructive
        onConfirm={() => deleting && deleteMutation.mutate(deleting)}
      />
    </div>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="mt-1 text-sm">{value}</div>
    </div>
  );
}

function AppActionsMenu({
  app,
  onView,
  onEdit,
  onToggle,
  onDelete,
}: {
  app: NpstApplication;
  onView: () => void;
  onEdit: () => void;
  onToggle: () => void;
  onDelete?: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon-sm" aria-label={`${app.name} actions`} data-testid={`application-actions-${app.id}`}>
            <Pencil className="size-4 rotate-90" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onClick={onView} data-testid={`application-view-${app.id}`}>
          <Eye className="size-4" /> View details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onEdit} data-testid={`application-edit-${app.id}`}>
          <Pencil className="size-4" /> Edit application
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link to={`/branding/configure/${app.id}`} data-testid={`application-branding-${app.id}`} />}>
          <Palette className="size-4" /> Configure branding
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onToggle} data-testid={`application-toggle-${app.id}`}>
          <Power className="size-4" /> {app.status === 'active' ? 'Disable integration' : 'Enable integration'}
        </DropdownMenuItem>
        {onDelete && (
          <DropdownMenuItem variant="destructive" onClick={onDelete} data-testid={`application-delete-${app.id}`}>
            <Trash2 className="size-4" /> Delete Application
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

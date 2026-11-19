import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { KeyRound, Pencil, Plus, Power, Search, Trash2, UserPlus } from 'lucide-react';
import { applicationService, userService } from '@/services/adminService';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { formatDate, initialsOf, timeAgo } from '@/utils/format';
import type { User, UserRole } from '@/types';

const ROLES: UserRole[] = ['Super Admin', 'Admin', 'Maker', 'Checker', 'Application Admin', 'Employee'];

const ROLE_TONES: Record<UserRole, string> = {
  'Super Admin': 'bg-blue-50 text-blue-700 ring-blue-600/20',
  Admin: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  Maker: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
  Checker: 'bg-violet-50 text-violet-700 ring-violet-600/20',
  'Application Admin': 'bg-amber-50 text-amber-700 ring-amber-600/20',
  Employee: 'bg-slate-100 text-slate-600 ring-slate-500/20',
};

const userSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Enter a valid email address'),
  phone: z.string().regex(/^\+?[0-9\s-]{10,15}$/, 'Enter a valid phone number').or(z.literal('')),
  role: z.enum(['Super Admin', 'Admin', 'Maker', 'Checker', 'Application Admin', 'Employee']),
  apps: z.array(z.string()).min(1, 'Assign at least one application'),
  status: z.enum(['active', 'inactive']),
});

type UserFormValues = z.infer<typeof userSchema>;

export default function UserManagement() {
  const queryClient = useQueryClient();
  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: () => userService.list() });
  const { data: apps = [] } = useQuery({ queryKey: ['apps'], queryFn: () => applicationService.list() });

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [deleting, setDeleting] = useState<User | null>(null);

  const appName = useMemo(() => new Map(apps.map((a) => [a.id, a.name])), [apps]);

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: { name: '', email: '', phone: '', role: 'Application Admin', apps: [], status: 'active' },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((user) => {
      if (roleFilter !== 'all' && user.role !== roleFilter) return false;
      if (q && !user.name.toLowerCase().includes(q) && !user.email.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [users, search, roleFilter]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['users'] });
    queryClient.invalidateQueries({ queryKey: ['search-index'] });
    queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
  };

  const openCreate = () => {
    setEditing(null);
    form.reset({ name: '', email: '', phone: '', role: 'Application Admin', apps: [], status: 'active' });
    setFormOpen(true);
  };

  const openEdit = (user: User) => {
    setEditing(user);
    form.reset({ name: user.name, email: user.email, phone: user.phone ?? '', role: user.role, apps: user.apps, status: user.status });
    setFormOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: (values: UserFormValues) =>
      editing ? Promise.resolve(userService.update(editing.id, values)) : Promise.resolve(userService.create(values)),
    onSuccess: () => {
      invalidate();
      toast.success(editing ? 'User updated' : 'User added');
      setFormOpen(false);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (user: User) =>
      Promise.resolve(userService.update(user.id, { status: user.status === 'active' ? 'inactive' : 'active' })),
    onSuccess: (updated) => {
      invalidate();
      toast.success(`${updated?.name} ${updated?.status === 'active' ? 'activated' : 'deactivated'}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => Promise.resolve(userService.remove(id)),
    onSuccess: () => {
      invalidate();
      toast.success('User deleted');
      setDeleting(null);
    },
  });

  const resetPassword = (user: User) => {
    toast.success(`Password reset link sent to ${user.email}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description="Manage user access and editable user information across connected applications."
        testId="employees-title"
        actions={
          <Button onClick={openCreate} data-testid="add-user-button">
            <UserPlus className="size-4" /> Add User
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users…" className="pl-9" data-testid="user-search-input" />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-48" data-testid="user-role-filter">
            <SelectValue>{roleFilter === 'all' ? 'All roles' : roleFilter}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            {ROLES.map((role) => (
              <SelectItem key={role} value={role}>
                {role}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No users found" description="Add a user or relax the filters." />
      ) : (
        <Card className="shadow-sm">
          <CardContent className="p-0">
            <Table data-testid="users-table">
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="hidden lg:table-cell">Application Access</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Last Login</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                          {initialsOf(user.name)}
                        </span>
                        <div>
                          <p className="font-medium text-foreground">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{user.phone ?? '—'}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${ROLE_TONES[user.role]}`}>
                        {user.role}
                      </span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {user.apps.slice(0, 2).map((appId) => (
                          <span key={appId} className="rounded-md bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
                            {appName.get(appId) ?? appId}
                          </span>
                        ))}
                        {user.apps.length > 2 && (
                          <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">+{user.apps.length - 2}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge value={user.status} />
                    </TableCell>
                    <TableCell className="hidden md:table-cell whitespace-nowrap text-muted-foreground">
                      {user.lastLogin ? timeAgo(user.lastLogin) : 'Never'}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={<Button variant="ghost" size="icon-sm" aria-label={`${user.name} actions`} data-testid={`user-actions-${user.id}`} />}
                        >
                          <Pencil className="size-4 rotate-90" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          <DropdownMenuItem onClick={() => openEdit(user)} data-testid={`user-edit-${user.id}`}>
                            <Pencil className="size-4" /> Edit user
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => resetPassword(user)} data-testid={`user-reset-password-${user.id}`}>
                            <KeyRound className="size-4" /> Send password reset
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleMutation.mutate(user)} data-testid={`user-toggle-${user.id}`}>
                            <Power className="size-4" /> {user.status === 'active' ? 'Deactivate' : 'Activate'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem variant="destructive" onClick={() => setDeleting(user)} data-testid={`user-delete-${user.id}`}>
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${editing.name}` : 'Add User'}</DialogTitle>
            <DialogDescription>Assign a role and application access. Roles control which modules the user can administer.</DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))} className="grid gap-4" data-testid="user-form">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="user-name">Full name</Label>
                <Input id="user-name" placeholder="e.g. Priya Nair" {...form.register('name')} data-testid="user-name-input" />
                {form.formState.errors.name && <p className="text-xs font-medium text-red-600">{form.formState.errors.name.message}</p>}
              </div>
            <div className="space-y-1.5">
              <Label htmlFor="user-phone">Phone number</Label>
              <Input id="user-phone" type="tel" placeholder="+91 98765 43210" {...form.register('phone')} data-testid="employee-phone-input" />
              {form.formState.errors.phone && <p className="text-xs font-medium text-red-600">{form.formState.errors.phone.message}</p>}
            </div>
              <div className="space-y-1.5">
                <Label htmlFor="user-email">Email</Label>
                <Input id="user-email" type="email" placeholder="name@npst.com" {...form.register('email')} data-testid="user-email-input" />
                {form.formState.errors.email && <p className="text-xs font-medium text-red-600">{form.formState.errors.email.message}</p>}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Controller
                control={form.control}
                name="role"
                render={({ field }) => (
                  <div className="space-y-1.5">
                    <Label>Role</Label>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger data-testid="user-role-select">
                        <SelectValue>{field.value}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map((role) => (
                          <SelectItem key={role} value={role}>
                            {role}
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
                  <div className="flex items-end pb-1.5">
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <Checkbox checked={field.value === 'active'} onCheckedChange={(checked) => field.onChange(checked ? 'active' : 'inactive')} data-testid="user-active-checkbox" />
                      User is active
                    </label>
                  </div>
                )}
              />
            </div>
            <Controller
              control={form.control}
              name="apps"
              render={({ field }) => (
                <div className="space-y-1.5">
                  <Label>Application access</Label>
                  <div className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-muted/40 p-3.5">
                    {apps.map((app) => (
                      <label key={app.id} className="flex cursor-pointer items-center gap-2 text-sm">
                        <Checkbox
                          checked={field.value.includes(app.id)}
                          onCheckedChange={(checked) =>
                            field.onChange(checked ? [...field.value, app.id] : field.value.filter((id) => id !== app.id))
                          }
                          data-testid={`user-app-${app.id}`}
                        />
                        {app.name}
                      </label>
                    ))}
                  </div>
                  {form.formState.errors.apps && <p className="text-xs font-medium text-red-600">{form.formState.errors.apps.message}</p>}
                </div>
              )}
            />
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)} data-testid="user-form-cancel-button">
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending} data-testid="user-form-submit-button">
                {editing ? 'Save changes' : 'Add user'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Delete ${deleting?.name ?? 'user'}?`}
        description="The user loses portal access immediately. Audit entries are retained."
        confirmLabel="Delete user"
        destructive
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
      />
    </div>
  );
}

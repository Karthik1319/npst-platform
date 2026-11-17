import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from '@/lib/toast';
import {
  KeyRound,
  Pencil,
  Power,
  Search,
  Trash2,
  UserPlus,
} from '@/components/icons';
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
import { initialsOf, timeAgo } from '@/utils/format';
import type { User, UserRole } from '@/types';
import styles from './UserManagement.module.css';

const ROLES: UserRole[] = [
  'Super Admin',
  'Admin',
  'Application Admin',
  'Employee',
];

const ROLE_TONES: Record<UserRole, string> = {
  'Super Admin': styles.SuperAdmin,
  Admin: styles.Admin,
  'Application Admin': styles.ApplicationAdmin,
  Employee: styles.Employee,
};

const userSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Enter a valid email address'),
  phone: z
    .string()
    .regex(/^\+?[0-9\s-]{10,15}$/, 'Enter a valid phone number')
    .or(z.literal('')),
  role: z.enum(['Super Admin', 'Admin', 'Application Admin', 'Employee']),
  apps: z.array(z.string()).min(1, 'Assign at least one application'),
  status: z.enum(['active', 'inactive']),
});

type UserFormValues = z.infer<typeof userSchema>;

export default function UserManagement() {
  const queryClient = useQueryClient();
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.list(),
  });
  const { data: apps = [] } = useQuery({
    queryKey: ['apps'],
    queryFn: () => applicationService.list(),
  });

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [deleting, setDeleting] = useState<User | null>(null);

  const appName = useMemo(
    () => new Map(apps.map((a) => [a.id, a.name])),
    [apps],
  );

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      role: 'Application Admin',
      apps: [],
      status: 'active',
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((user) => {
      if (roleFilter !== 'all' && user.role !== roleFilter) return false;
      if (
        q &&
        !user.name.toLowerCase().includes(q) &&
        !user.email.toLowerCase().includes(q)
      )
        return false;
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
    form.reset({
      name: '',
      email: '',
      phone: '',
      role: 'Application Admin',
      apps: [],
      status: 'active',
    });
    setFormOpen(true);
  };

  const openEdit = (user: User) => {
    setEditing(user);
    form.reset({
      name: user.name,
      email: user.email,
      phone: user.phone ?? '',
      role: user.role,
      apps: user.apps,
      status: user.status,
    });
    setFormOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: (values: UserFormValues) =>
      editing
        ? Promise.resolve(userService.update(editing.id, values))
        : Promise.resolve(userService.create(values)),
    onSuccess: () => {
      invalidate();
      toast.success(editing ? 'User updated' : 'User added');
      setFormOpen(false);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (user: User) =>
      Promise.resolve(
        userService.update(user.id, {
          status: user.status === 'active' ? 'inactive' : 'active',
        }),
      ),
    onSuccess: (updated) => {
      invalidate();
      toast.success(
        `${updated?.name} ${updated?.status === 'active' ? 'activated' : 'deactivated'}`,
      );
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
    <div className={styles.div}>
      <PageHeader
        title="Employee Management"
        description="Manage employee access and editable employee information across connected applications."
        testId="employees-title"
        actions={
          <Button onClick={openCreate} data-testid="add-user-button">
            <UserPlus className={`${styles.userPlus} npst-sized`} /> Add User
          </Button>
        }
      />

      <div className={styles.div2}>
        <div className={styles.div3}>
          <Search className={`${styles.search} npst-sized`} />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users…"
            className={styles.input}
            data-testid="user-search-input"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger
            className={styles.selectTrigger}
            data-testid="user-role-filter"
          >
            <SelectValue>
              {roleFilter === 'all' ? 'All roles' : roleFilter}
            </SelectValue>
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
        <EmptyState
          title="No users found"
          description="Add a user or relax the filters."
        />
      ) : (
        <Card className={styles.card}>
          <CardContent className={styles.cardContent}>
            <Table data-testid="users-table">
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className={styles.tableHead}>
                    Application Access
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className={styles.tableHead2}>
                    Last Login
                  </TableHead>
                  <TableHead className={styles.tableHead3}>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className={styles.div4}>
                        <span className={`${styles.span} npst-sized`}>
                          {initialsOf(user.name)}
                        </span>
                        <div>
                          <p className={styles.p}>{user.name}</p>
                          <p className={styles.p2}>{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className={styles.tableHead2}>
                      {user.phone ?? '—'}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`${styles.span2} ${ROLE_TONES[user.role]}`}
                      >
                        {user.role}
                      </span>
                    </TableCell>
                    <TableCell className={styles.tableHead}>
                      <div className={styles.div5}>
                        {user.apps.slice(0, 2).map((appId) => (
                          <span key={appId} className={styles.span3}>
                            {appName.get(appId) ?? appId}
                          </span>
                        ))}
                        {user.apps.length > 2 && (
                          <span className={styles.span3}>
                            +{user.apps.length - 2}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge value={user.status} />
                    </TableCell>
                    <TableCell className={styles.tableCell}>
                      {user.lastLogin ? timeAgo(user.lastLogin) : 'Never'}
                    </TableCell>
                    <TableCell className={styles.tableHead3}>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`${user.name} actions`}
                              data-testid={`user-actions-${user.id}`}
                            />
                          }
                        >
                          <Pencil className={`${styles.pencil} npst-sized`} />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className={styles.dropdownMenuContent}
                        >
                          <DropdownMenuItem
                            onClick={() => openEdit(user)}
                            data-testid={`user-edit-${user.id}`}
                          >
                            <Pencil
                              className={`${styles.userPlus} npst-sized`}
                            />{' '}
                            Edit user
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => resetPassword(user)}
                            data-testid={`user-reset-password-${user.id}`}
                          >
                            <KeyRound
                              className={`${styles.userPlus} npst-sized`}
                            />{' '}
                            Send password reset
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => toggleMutation.mutate(user)}
                            data-testid={`user-toggle-${user.id}`}
                          >
                            <Power
                              className={`${styles.userPlus} npst-sized`}
                            />{' '}
                            {user.status === 'active'
                              ? 'Deactivate'
                              : 'Activate'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setDeleting(user)}
                            data-testid={`user-delete-${user.id}`}
                          >
                            <Trash2
                              className={`${styles.userPlus} npst-sized`}
                            />{' '}
                            Delete
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
        <DialogContent className={styles.dialogContent}>
          <DialogHeader>
            <DialogTitle>
              {editing ? `Edit ${editing.name}` : 'Add User'}
            </DialogTitle>
            <DialogDescription>
              Assign a role and application access. Roles control which modules
              the user can administer.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit((values) =>
              saveMutation.mutate(values),
            )}
            className={styles.form}
            data-testid="user-form"
          >
            <div className={styles.div6}>
              <div className={styles.div7}>
                <Label htmlFor="user-name">Full name</Label>
                <Input
                  id="user-name"
                  placeholder="e.g. Priya Nair"
                  {...form.register('name')}
                  data-testid="user-name-input"
                />
                {form.formState.errors.name && (
                  <p className={styles.p3}>
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>
              <div className={styles.div7}>
                <Label htmlFor="user-phone">Phone number</Label>
                <Input
                  id="user-phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  {...form.register('phone')}
                  data-testid="employee-phone-input"
                />
                {form.formState.errors.phone && (
                  <p className={styles.p3}>
                    {form.formState.errors.phone.message}
                  </p>
                )}
              </div>
              <div className={styles.div7}>
                <Label htmlFor="user-email">Email</Label>
                <Input
                  id="user-email"
                  type="email"
                  placeholder="name@npst.com"
                  {...form.register('email')}
                  data-testid="user-email-input"
                />
                {form.formState.errors.email && (
                  <p className={styles.p3}>
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>
            </div>
            <div className={styles.div6}>
              <Controller
                control={form.control}
                name="role"
                render={({ field }) => (
                  <div className={styles.div7}>
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
                  <div className={styles.div8}>
                    <label className={styles.label}>
                      <Checkbox
                        checked={field.value === 'active'}
                        onCheckedChange={(checked) =>
                          field.onChange(checked ? 'active' : 'inactive')
                        }
                        data-testid="user-active-checkbox"
                      />
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
                <div className={styles.div7}>
                  <Label>Application access</Label>
                  <div className={styles.div9}>
                    {apps.map((app) => (
                      <label key={app.id} className={styles.label}>
                        <Checkbox
                          checked={field.value.includes(app.id)}
                          onCheckedChange={(checked) =>
                            field.onChange(
                              checked
                                ? [...field.value, app.id]
                                : field.value.filter((id) => id !== app.id),
                            )
                          }
                          data-testid={`user-app-${app.id}`}
                        />
                        {app.name}
                      </label>
                    ))}
                  </div>
                  {form.formState.errors.apps && (
                    <p className={styles.p3}>
                      {form.formState.errors.apps.message}
                    </p>
                  )}
                </div>
              )}
            />
            <DialogFooter className={styles.dialogFooter}>
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormOpen(false)}
                data-testid="user-form-cancel-button"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saveMutation.isPending}
                data-testid="user-form-submit-button"
              >
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

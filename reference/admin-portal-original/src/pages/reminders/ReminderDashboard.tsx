import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { addDays, format, isSameDay } from 'date-fns';
import { AlarmClock, ArrowRight, CheckCircle2, Clock, Timer, XCircle } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from '@/lib/recharts';
import { applicationService } from '@/services/adminService';
import { reminderService } from '@/services/reminderService';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDate, formatNumber } from '@/utils/format';
import { FREQUENCY_LABELS } from '@/lib/labels';

const tooltipStyle = { borderRadius: 10, border: '1px solid #E2E8F0', fontSize: 12, boxShadow: '0 4px 14px rgba(15,23,42,0.10)' };

export default function ReminderDashboard() {
  const { data: instances = [] } = useQuery({ queryKey: ['reminder-instances'], queryFn: () => reminderService.listInstances() });
  const { data: policies = [] } = useQuery({ queryKey: ['reminder-policies'], queryFn: () => reminderService.listPolicies() });
  const { data: apps = [] } = useQuery({ queryKey: ['apps'], queryFn: () => applicationService.list() });

  const appName = useMemo(() => new Map(apps.map((a) => [a.id, a.name])), [apps]);

  const stats = useMemo(
    () => ({
      total: instances.length,
      activePolicies: policies.filter((p) => p.status === 'active').length,
      pending: instances.filter((r) => r.status === 'pending').length,
      completed: instances.filter((r) => r.status === 'completed').length,
      overdue: instances.filter((r) => r.status === 'overdue').length,
    }),
    [instances, policies],
  );

  const split = useMemo(
    () => [
      { name: 'Completed', value: stats.completed, fill: '#16A34A' },
      { name: 'Pending', value: stats.pending, fill: '#D97706' },
      { name: 'Overdue', value: stats.overdue, fill: '#DC2626' },
    ],
    [stats],
  );

  const next7 = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => addDays(new Date(), i)).map((day) => ({
        day: format(day, 'EEE d'),
        reminders: instances.filter((r) => r.status !== 'completed' && isSameDay(new Date(r.nextReminderDate), day)).length,
      })),
    [instances],
  );

  const upcoming = useMemo(
    () =>
      instances
        .filter((r) => r.status !== 'completed')
        .sort((a, b) => new Date(a.nextReminderDate).getTime() - new Date(b.nextReminderDate).getTime())
        .slice(0, 6),
    [instances],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reminder Management"
        description="Centralized reminder policies, schedules and escalations chasing approvals and deadlines across NPST applications."
        testId="reminders-title"
        actions={
          <Link to="/reminders/configuration" className="text-sm font-medium text-blue-600 hover:underline" data-testid="reminders-manage-policies-link">
            Manage policies <ArrowRight className="inline size-3.5" />
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
        <StatCard label="Total Reminders" value={formatNumber(stats.total)} icon={AlarmClock} tone="blue" foot="All instances" testId="reminder-stat-total" />
        <StatCard label="Active Policies" value={stats.activePolicies} icon={Timer} tone="sky" foot={`${policies.length} configured`} testId="reminder-stat-active" />
        <StatCard label="Pending" value={stats.pending} icon={Clock} tone="amber" foot="Awaiting completion" testId="reminder-stat-pending" />
        <StatCard label="Completed" value={stats.completed} icon={CheckCircle2} tone="green" foot="Fully processed" testId="reminder-stat-completed" />
        <StatCard label="Overdue" value={stats.overdue} icon={XCircle} tone="red" foot="Escalated or stalled" testId="reminder-stat-overdue" />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="font-heading text-base">Reminder Completion</CardTitle>
            <CardDescription>Completed vs pending vs overdue instances</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={split} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3} strokeWidth={0}>
                  {split.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="font-heading text-base">Upcoming Schedule — Next 7 Days</CardTitle>
            <CardDescription>Reminders due per day</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={next7} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(37, 99, 235, 0.05)' }} />
                <Bar dataKey="reminders" name="Reminders due" fill="#2563EB" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-base">Upcoming Reminders</CardTitle>
          <CardDescription>Next reminders firing across the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <Table data-testid="reminder-upcoming-table">
            <TableHeader>
              <TableRow>
                <TableHead>Reminder</TableHead>
                <TableHead>Application</TableHead>
                <TableHead className="hidden md:table-cell">Recipient</TableHead>
                <TableHead>Next Reminder</TableHead>
                <TableHead className="hidden sm:table-cell">Escalation</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {upcoming.map((instance) => (
                <TableRow key={instance.id}>
                  <TableCell className="font-medium">{instance.policyName}</TableCell>
                  <TableCell>{appName.get(instance.appId) ?? instance.appId}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">{instance.recipient}</TableCell>
                  <TableCell className="whitespace-nowrap">{formatDate(instance.nextReminderDate)}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {instance.escalationLevel > 0 ? (
                      <span className="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/20">
                        L{instance.escalationLevel}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge value={instance.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

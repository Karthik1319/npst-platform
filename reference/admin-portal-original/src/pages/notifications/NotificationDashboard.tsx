import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { isSameDay, format, subDays } from 'date-fns';
import { ArrowRight, Bell, BellRing, CheckCircle2, Clock, XCircle } from 'lucide-react';
import {
  Area,
  AreaChart,
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
import { notificationService } from '@/services/notificationService';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { timeAgo } from '@/utils/format';
import { CHANNEL_LABELS, CHANNEL_KEYS, DELIVERY_LABELS } from '@/lib/labels';

const CHART_COLORS = ['#2563EB', '#38BDF8', '#16A34A', '#D97706'];
const tooltipStyle = { borderRadius: 10, border: '1px solid #E2E8F0', fontSize: 12, boxShadow: '0 4px 14px rgba(15,23,42,0.10)' };

export default function NotificationDashboard() {
  const { data: logs = [] } = useQuery({ queryKey: ['notification-logs'], queryFn: () => notificationService.listLogs() });
  const { data: apps = [] } = useQuery({ queryKey: ['apps'], queryFn: () => applicationService.list() });

  const stats = useMemo(
    () => ({
      total: logs.length,
      delivered: logs.filter((l) => l.status === 'delivered').length,
      failed: logs.filter((l) => l.status === 'failed').length,
      pending: logs.filter((l) => l.status === 'pending').length,
    }),
    [logs],
  );

  const week = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => subDays(new Date(), 6 - i)).map((day) => {
        const dayLogs = logs.filter((l) => isSameDay(new Date(l.sentAt), day));
        return {
          day: format(day, 'EEE'),
          delivered: dayLogs.filter((l) => l.status === 'delivered').length,
          failed: dayLogs.filter((l) => l.status === 'failed').length,
        };
      }),
    [logs],
  );

  const byChannel = useMemo(
    () => CHANNEL_KEYS.map((key) => ({ name: CHANNEL_LABELS[key], value: logs.filter((l) => l.channel === key).length })),
    [logs],
  );

  const byApp = useMemo(
    () => apps.map((app) => ({ name: app.name, notifications: logs.filter((l) => l.appId === app.id).length })),
    [apps, logs],
  );

  const recent = logs.slice(0, 6);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notification Management"
        description="Centralized templates, channels, rules and delivery history for every integrated application."
        testId="notifications-title"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Notifications" value={stats.total} icon={Bell} tone="blue" foot="All time" testId="notif-stat-total" />
        <StatCard
          label="Successfully Delivered"
          value={stats.delivered}
          icon={CheckCircle2}
          tone="green"
          foot={stats.total > 0 ? `${Math.round((stats.delivered / stats.total) * 100)}% delivery rate` : '—'}
          testId="notif-stat-delivered"
        />
        <StatCard label="Failed" value={stats.failed} icon={XCircle} tone="red" foot="Retryable via rules" testId="notif-stat-failed" />
        <StatCard label="Pending" value={stats.pending} icon={Clock} tone="amber" foot="Queued in send windows" testId="notif-stat-pending" />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="font-heading text-base">Delivery Trend</CardTitle>
            <CardDescription>Delivered vs failed notifications, last 7 days</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={week} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="deliveredFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#2563EB" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="delivered" name="Delivered" stroke="#2563EB" strokeWidth={2.5} fill="url(#deliveredFill)" />
                <Area type="monotone" dataKey="failed" name="Failed" stroke="#DC2626" strokeWidth={2} fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="font-heading text-base">Channel-wise Distribution</CardTitle>
            <CardDescription>Volume share across in-app, email, SMS and push</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byChannel} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3} strokeWidth={0}>
                  {byChannel.map((entry, i) => (
                    <Cell key={entry.name} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-heading text-base">Application-wise Notification Volume</CardTitle>
            <CardDescription>Notifications consumed per integrated application</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byApp} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(37, 99, 235, 0.05)' }} />
                <Bar dataKey="notifications" name="Notifications" fill="#2563EB" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 font-heading text-base">
              <BellRing className="size-4 text-blue-600" /> Recent Deliveries
            </CardTitle>
            <CardDescription>Latest notifications dispatched through shared services</CardDescription>
          </div>
          <Link to="/notifications/history" className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline" data-testid="notif-dashboard-view-history">
            View all <ArrowRight className="size-3.5" />
          </Link>
        </CardHeader>
        <CardContent>
          <Table data-testid="notif-recent-table">
            <TableHeader>
              <TableRow>
                <TableHead>Template</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead className="hidden md:table-cell">Channel</TableHead>
                <TableHead className="hidden sm:table-cell">Sent</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recent.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="max-w-64 truncate font-medium">{log.templateName}</TableCell>
                  <TableCell className="text-muted-foreground">{log.recipient}</TableCell>
                  <TableCell className="hidden md:table-cell">{CHANNEL_LABELS[log.channel]}</TableCell>
                  <TableCell className="hidden sm:table-cell whitespace-nowrap text-muted-foreground">{timeAgo(log.sentAt)}</TableCell>
                  <TableCell>
                    <StatusBadge value={log.status} label={DELIVERY_LABELS[log.status]} />
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

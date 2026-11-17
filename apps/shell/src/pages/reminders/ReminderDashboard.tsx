import { useMemo } from 'react';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { addDays, format, isSameDay } from 'date-fns';
import {
  AlarmClock,
  ArrowRight,
  CheckCircle2,
  Clock,
  Timer,
  XCircle,
} from '@/components/icons';
import { BarChart } from '@/components/charts/BarChart';
import { DonutChart } from '@/components/charts/DonutChart';
import { applicationService } from '@/services/adminService';
import { reminderService } from '@/services/reminderService';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { StatusBadge } from '@/components/common/StatusBadge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDate, formatNumber } from '@/utils/format';
import styles from './ReminderDashboard.module.css';

export default function ReminderDashboard() {
  const { data: instances = [] } = useQuery({
    queryKey: ['reminder-instances'],
    queryFn: () => reminderService.listInstances(),
  });
  const { data: policies = [] } = useQuery({
    queryKey: ['reminder-policies'],
    queryFn: () => reminderService.listPolicies(),
  });
  const { data: apps = [] } = useQuery({
    queryKey: ['apps'],
    queryFn: () => applicationService.list(),
  });

  const appName = useMemo(
    () => new Map(apps.map((a) => [a.id, a.name])),
    [apps],
  );

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
      {
        name: 'Completed',
        value: stats.completed,
        className: styles.completed,
      },
      { name: 'Pending', value: stats.pending, className: styles.pending },
      { name: 'Overdue', value: stats.overdue, className: styles.overdue },
    ],
    [stats],
  );

  const next7 = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => addDays(new Date(), i)).map(
        (day) => ({
          label: format(day, 'EEE d'),
          value: instances.filter(
            (r) =>
              r.status !== 'completed' &&
              isSameDay(new Date(r.nextReminderDate), day),
          ).length,
        }),
      ),
    [instances],
  );

  const upcoming = useMemo(
    () =>
      instances
        .filter((r) => r.status !== 'completed')
        .sort(
          (a, b) =>
            new Date(a.nextReminderDate).getTime() -
            new Date(b.nextReminderDate).getTime(),
        )
        .slice(0, 6),
    [instances],
  );

  return (
    <div className={styles.div}>
      <PageHeader
        title="Reminder Management"
        description="Centralized reminder policies, schedules and escalations chasing approvals and deadlines across NPST applications."
        testId="reminders-title"
        actions={
          <Link
            to="/reminders/configuration"
            className={styles.link}
            data-testid="reminders-manage-policies-link"
          >
            Manage policies{' '}
            <ArrowRight className={`${styles.arrowRight} npst-sized`} />
          </Link>
        }
      />

      <div className={styles.div2}>
        <StatCard
          label="Total Reminders"
          value={formatNumber(stats.total)}
          icon={AlarmClock}
          tone="blue"
          foot="All instances"
          testId="reminder-stat-total"
        />
        <StatCard
          label="Active Policies"
          value={stats.activePolicies}
          icon={Timer}
          tone="sky"
          foot={`${policies.length} configured`}
          testId="reminder-stat-active"
        />
        <StatCard
          label="Pending"
          value={stats.pending}
          icon={Clock}
          tone="amber"
          foot="Awaiting completion"
          testId="reminder-stat-pending"
        />
        <StatCard
          label="Completed"
          value={stats.completed}
          icon={CheckCircle2}
          tone="green"
          foot="Fully processed"
          testId="reminder-stat-completed"
        />
        <StatCard
          label="Overdue"
          value={stats.overdue}
          icon={XCircle}
          tone="red"
          foot="Escalated or stalled"
          testId="reminder-stat-overdue"
        />
      </div>

      <div className={styles.div3}>
        <Card className={styles.card}>
          <CardHeader>
            <CardTitle className={styles.cardTitle}>
              Reminder Completion
            </CardTitle>
            <CardDescription>
              Completed vs pending vs overdue instances
            </CardDescription>
          </CardHeader>
          <CardContent className={styles.cardContent}>
            {/* In-house chart (the original used a chart library). */}
            <DonutChart
              label="Reminder completion"
              data={split}
              innerRadius={55}
              outerRadius={85}
              paddingAngle={3}
            />
          </CardContent>
        </Card>

        <Card className={styles.card}>
          <CardHeader>
            <CardTitle className={styles.cardTitle}>
              Upcoming Schedule — Next 7 Days
            </CardTitle>
            <CardDescription>Reminders due per day</CardDescription>
          </CardHeader>
          <CardContent className={styles.cardContent}>
            <BarChart
              label="Reminders due per day"
              data={next7}
              seriesName="Reminders due"
              barClassName={styles.due}
              margin={{ top: 4, right: 8, left: -18, bottom: 0 }}
              xTickFontSize={11}
              yTickFontSize={12}
            />
          </CardContent>
        </Card>
      </div>

      <Card className={styles.card}>
        <CardHeader>
          <CardTitle className={styles.cardTitle}>Upcoming Reminders</CardTitle>
          <CardDescription>
            Next reminders firing across the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table data-testid="reminder-upcoming-table">
            <TableHeader>
              <TableRow>
                <TableHead>Reminder</TableHead>
                <TableHead>Application</TableHead>
                <TableHead className={styles.tableHead}>Recipient</TableHead>
                <TableHead>Next Reminder</TableHead>
                <TableHead className={styles.tableHead2}>Escalation</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {upcoming.map((instance) => (
                <TableRow key={instance.id}>
                  <TableCell className={styles.tableCell}>
                    {instance.policyName}
                  </TableCell>
                  <TableCell>
                    {appName.get(instance.appId) ?? instance.appId}
                  </TableCell>
                  <TableCell className={styles.tableCell2}>
                    {instance.recipient}
                  </TableCell>
                  <TableCell className={styles.tableCell3}>
                    {formatDate(instance.nextReminderDate)}
                  </TableCell>
                  <TableCell className={styles.tableHead2}>
                    {instance.escalationLevel > 0 ? (
                      <span className={styles.span}>
                        L{instance.escalationLevel}
                      </span>
                    ) : (
                      <span className={styles.span2}>—</span>
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

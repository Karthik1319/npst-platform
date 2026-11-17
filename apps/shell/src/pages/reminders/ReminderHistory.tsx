import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/lib/toast';
import { CheckCircle2, Search, Send } from '@/components/icons';
import { applicationService } from '@/services/adminService';
import { reminderService } from '@/services/reminderService';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDate } from '@/utils/format';
import type { ReminderStatus } from '@/types';
import styles from './ReminderHistory.module.css';

type StatusTab = 'all' | ReminderStatus;

const TABS: { key: StatusTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'completed', label: 'Completed' },
  { key: 'overdue', label: 'Overdue' },
];

export default function ReminderHistory() {
  const queryClient = useQueryClient();
  const { data: instances = [] } = useQuery({
    queryKey: ['reminder-instances'],
    queryFn: () => reminderService.listInstances(),
  });
  const { data: apps = [] } = useQuery({
    queryKey: ['apps'],
    queryFn: () => applicationService.list(),
  });

  const [tab, setTab] = useState<StatusTab>('all');
  const [search, setSearch] = useState('');

  const appName = useMemo(
    () => new Map(apps.map((a) => [a.id, a.name])),
    [apps],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return instances.filter((instance) => {
      if (tab !== 'all' && instance.status !== tab) return false;
      if (
        q &&
        !instance.recipient.toLowerCase().includes(q) &&
        !instance.policyName.toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [instances, tab, search]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['reminder-instances'] });
    queryClient.invalidateQueries({ queryKey: ['notification-logs'] });
    queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
  };

  const completeMutation = useMutation({
    mutationFn: (id: string) =>
      Promise.resolve(reminderService.completeInstance(id)),
    onSuccess: () => {
      invalidate();
      toast.success('Reminder marked as completed');
    },
  });

  const sendNowMutation = useMutation({
    mutationFn: (id: string) => Promise.resolve(reminderService.sendNow(id)),
    onSuccess: () => {
      invalidate();
      toast.success('Reminder dispatched — logged in notification history');
    },
  });

  return (
    <div className={styles.div}>
      <PageHeader
        title="Reminder History"
        description="Every scheduled reminder instance with its chase progress, escalation level and delivery status."
        testId="reminder-history-title"
      />

      <Card className={styles.card}>
        <CardContent className={styles.cardContent}>
          <div className={styles.div2}>
            <div className={styles.div3} data-testid="reminder-history-tabs">
              {TABS.map((item) => {
                const count =
                  item.key === 'all'
                    ? instances.length
                    : instances.filter((r) => r.status === item.key).length;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setTab(item.key)}
                    className={
                      tab === item.key ? styles.button : styles.button2
                    }
                    data-testid={`reminder-history-tab-${item.key}`}
                  >
                    {item.label}{' '}
                    <span
                      className={tab === item.key ? styles.span : styles.span2}
                    >
                      ({count})
                    </span>
                  </button>
                );
              })}
            </div>
            <div className={styles.div4}>
              <Search className={`${styles.search} npst-sized`} />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search recipient or reminder…"
                className={styles.input}
                data-testid="reminder-history-search-input"
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              title="No reminders found"
              description="Adjust the filters or search to see reminder history."
            />
          ) : (
            <Table data-testid="reminder-history-table">
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Reminder</TableHead>
                  <TableHead className={styles.tableHead}>
                    Application
                  </TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead className={styles.tableHead2}>Scheduled</TableHead>
                  <TableHead>Next Reminder</TableHead>
                  <TableHead className={styles.tableHead3}>
                    Escalation
                  </TableHead>
                  <TableHead className={styles.tableHead2}>Sent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className={styles.tableHead4}>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((instance) => (
                  <TableRow key={instance.id}>
                    <TableCell className={styles.tableCell}>
                      {instance.id.replace(/^rmd-/, 'R-')}
                    </TableCell>
                    <TableCell className={styles.tableCell2}>
                      {instance.policyName}
                    </TableCell>
                    <TableCell className={styles.tableHead}>
                      {appName.get(instance.appId) ?? instance.appId}
                    </TableCell>
                    <TableCell className={styles.tableCell3}>
                      {instance.recipient}
                    </TableCell>
                    <TableCell className={styles.tableCell4}>
                      {formatDate(instance.scheduledDate)}
                    </TableCell>
                    <TableCell className={styles.tableCell5}>
                      {formatDate(instance.nextReminderDate)}
                    </TableCell>
                    <TableCell className={styles.tableHead3}>
                      {instance.escalationLevel > 0 ? (
                        <span className={styles.span3}>
                          L{instance.escalationLevel}
                        </span>
                      ) : (
                        <span className={styles.tableCell3}>—</span>
                      )}
                    </TableCell>
                    <TableCell className={styles.tableCell6}>
                      {instance.sentCount}/{instance.maxCount}
                    </TableCell>
                    <TableCell>
                      <StatusBadge value={instance.status} />
                    </TableCell>
                    <TableCell className={styles.tableHead4}>
                      <div className={styles.div5}>
                        {instance.status !== 'completed' && (
                          <>
                            <Button
                              variant="outline"
                              size="icon-sm"
                              aria-label="Mark completed"
                              title="Mark completed"
                              onClick={() =>
                                completeMutation.mutate(instance.id)
                              }
                              data-testid={`reminder-history-complete-${instance.id}`}
                            >
                              <CheckCircle2
                                className={`${styles.checkCircle2} npst-sized`}
                              />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon-sm"
                              aria-label="Send now"
                              title="Send now"
                              onClick={() =>
                                sendNowMutation.mutate(instance.id)
                              }
                              data-testid={`reminder-history-send-${instance.id}`}
                            >
                              <Send className={`${styles.send} npst-sized`} />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

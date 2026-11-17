import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CheckCircle2, Search, Send } from 'lucide-react';
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

type StatusTab = 'all' | ReminderStatus;

const TABS: { key: StatusTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'completed', label: 'Completed' },
  { key: 'overdue', label: 'Overdue' },
];

export default function ReminderHistory() {
  const queryClient = useQueryClient();
  const { data: instances = [] } = useQuery({ queryKey: ['reminder-instances'], queryFn: () => reminderService.listInstances() });
  const { data: apps = [] } = useQuery({ queryKey: ['apps'], queryFn: () => applicationService.list() });

  const [tab, setTab] = useState<StatusTab>('all');
  const [search, setSearch] = useState('');

  const appName = useMemo(() => new Map(apps.map((a) => [a.id, a.name])), [apps]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return instances.filter((instance) => {
      if (tab !== 'all' && instance.status !== tab) return false;
      if (q && !instance.recipient.toLowerCase().includes(q) && !instance.policyName.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [instances, tab, search]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['reminder-instances'] });
    queryClient.invalidateQueries({ queryKey: ['notification-logs'] });
    queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
  };

  const completeMutation = useMutation({
    mutationFn: (id: string) => Promise.resolve(reminderService.completeInstance(id)),
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
    <div className="space-y-6">
      <PageHeader
        title="Reminder History"
        description="Every scheduled reminder instance with its chase progress, escalation level and delivery status."
        testId="reminder-history-title"
      />

      <Card className="shadow-sm">
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-1.5" data-testid="reminder-history-tabs">
              {TABS.map((item) => {
                const count = item.key === 'all' ? instances.length : instances.filter((r) => r.status === item.key).length;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setTab(item.key)}
                    className={
                      tab === item.key
                        ? 'rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white'
                        : 'rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted'
                    }
                    data-testid={`reminder-history-tab-${item.key}`}
                  >
                    {item.label} <span className={tab === item.key ? 'text-white/80' : 'text-muted-foreground/60'}>({count})</span>
                  </button>
                );
              })}
            </div>
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search recipient or reminder…" className="pl-9" data-testid="reminder-history-search-input" />
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState title="No reminders found" description="Adjust the filters or search to see reminder history." />
          ) : (
            <Table data-testid="reminder-history-table">
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Reminder</TableHead>
                  <TableHead className="hidden md:table-cell">Application</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead className="hidden lg:table-cell">Scheduled</TableHead>
                  <TableHead>Next Reminder</TableHead>
                  <TableHead className="hidden sm:table-cell">Escalation</TableHead>
                  <TableHead className="hidden lg:table-cell">Sent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((instance) => (
                  <TableRow key={instance.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">{instance.id.replace(/^rmd-/, 'R-')}</TableCell>
                    <TableCell className="font-medium">{instance.policyName}</TableCell>
                    <TableCell className="hidden md:table-cell">{appName.get(instance.appId) ?? instance.appId}</TableCell>
                    <TableCell className="text-muted-foreground">{instance.recipient}</TableCell>
                    <TableCell className="hidden lg:table-cell whitespace-nowrap text-muted-foreground">{formatDate(instance.scheduledDate)}</TableCell>
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
                    <TableCell className="hidden lg:table-cell text-muted-foreground">
                      {instance.sentCount}/{instance.maxCount}
                    </TableCell>
                    <TableCell>
                      <StatusBadge value={instance.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1.5">
                        {instance.status !== 'completed' && (
                          <>
                            <Button
                              variant="outline"
                              size="icon-sm"
                              aria-label="Mark completed"
                              title="Mark completed"
                              onClick={() => completeMutation.mutate(instance.id)}
                              data-testid={`reminder-history-complete-${instance.id}`}
                            >
                              <CheckCircle2 className="size-4 text-emerald-600" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon-sm"
                              aria-label="Send now"
                              title="Send now"
                              onClick={() => sendNowMutation.mutate(instance.id)}
                              data-testid={`reminder-history-send-${instance.id}`}
                            >
                              <Send className="size-4 text-blue-600" />
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

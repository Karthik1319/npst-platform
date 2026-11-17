import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Eye, Search } from 'lucide-react';
import { applicationService } from '@/services/adminService';
import { notificationService } from '@/services/notificationService';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { formatDateTime } from '@/utils/format';
import { CHANNEL_LABELS, CHANNEL_KEYS, DELIVERY_LABELS, PRIORITY_LABELS } from '@/lib/labels';
import type { NotificationLog } from '@/types';

const PAGE_SIZE = 8;

export default function NotificationHistory() {
  const { data: logs = [] } = useQuery({ queryKey: ['notification-logs'], queryFn: () => notificationService.listLogs() });
  const { data: apps = [] } = useQuery({ queryKey: ['apps'], queryFn: () => applicationService.list() });

  const [search, setSearch] = useState('');
  const [appFilter, setAppFilter] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [viewing, setViewing] = useState<NotificationLog | null>(null);

  const appName = useMemo(() => new Map(apps.map((a) => [a.id, a.name])), [apps]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return logs.filter((log) => {
      if (q && !log.recipient.toLowerCase().includes(q) && !log.templateName.toLowerCase().includes(q)) return false;
      if (appFilter !== 'all' && log.appId !== appFilter) return false;
      if (channelFilter !== 'all' && log.channel !== channelFilter) return false;
      if (statusFilter !== 'all' && log.status !== statusFilter) return false;
      if (priorityFilter !== 'all' && log.priority !== priorityFilter) return false;
      return true;
    });
  }, [logs, search, appFilter, channelFilter, statusFilter, priorityFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notification History"
        description="Full delivery log across every channel and application, with search, filters and pagination."
        testId="notification-history-title"
      />

      <Card className="shadow-sm">
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative w-full lg:max-w-xs">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search recipient or template…"
                className="pl-9"
                data-testid="notif-history-search-input"
              />
            </div>
            <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-4">
              <Select value={appFilter} onValueChange={(v) => { setAppFilter(v); setPage(1); }}>
                <SelectTrigger data-testid="notif-history-app-filter"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All apps</SelectItem>
                  {apps.map((app) => (
                    <SelectItem key={app.id} value={app.id}>{app.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={channelFilter} onValueChange={(v) => { setChannelFilter(v); setPage(1); }}>
                <SelectTrigger data-testid="notif-history-channel-filter"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All channels</SelectItem>
                  {CHANNEL_KEYS.map((key) => (
                    <SelectItem key={key} value={key}>{CHANNEL_LABELS[key]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                <SelectTrigger data-testid="notif-history-status-filter"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {(Object.keys(DELIVERY_LABELS) as (keyof typeof DELIVERY_LABELS)[]).map((key) => (
                    <SelectItem key={key} value={key}>{DELIVERY_LABELS[key]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={(v) => { setPriorityFilter(v); setPage(1); }}>
                <SelectTrigger data-testid="notif-history-priority-filter"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All priorities</SelectItem>
                  {(Object.keys(PRIORITY_LABELS) as (keyof typeof PRIORITY_LABELS)[]).map((key) => (
                    <SelectItem key={key} value={key}>{PRIORITY_LABELS[key]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {pageRows.length === 0 ? (
            <EmptyState title="No notifications match" description="Loosen the filters or clear the search to see delivery history." />
          ) : (
            <Table data-testid="notif-history-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Application</TableHead>
                  <TableHead className="hidden lg:table-cell">Template</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead className="hidden md:table-cell">Sent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Priority</TableHead>
                  <TableHead className="text-right">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">{log.recipient}</TableCell>
                    <TableCell>{appName.get(log.appId) ?? log.appId}</TableCell>
                    <TableCell className="hidden lg:table-cell max-w-52 truncate text-muted-foreground">{log.templateName}</TableCell>
                    <TableCell>{CHANNEL_LABELS[log.channel]}</TableCell>
                    <TableCell className="hidden md:table-cell whitespace-nowrap text-muted-foreground">{formatDateTime(log.sentAt)}</TableCell>
                    <TableCell>
                      <StatusBadge value={log.status} label={DELIVERY_LABELS[log.status]} />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <StatusBadge value={log.priority} label={PRIORITY_LABELS[log.priority]} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="icon-sm" aria-label="View notification" onClick={() => setViewing(log)} data-testid={`notif-history-view-${log.id}`}>
                        <Eye className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <div className="flex items-center justify-between border-t border-border pt-3 text-sm text-muted-foreground">
            <span data-testid="notif-history-count">
              Showing {pageRows.length} of {filtered.length} notifications
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon-sm" onClick={() => setPage(Math.max(1, currentPage - 1))} disabled={currentPage <= 1} data-testid="notif-history-prev-page">
                <ChevronLeft className="size-4" />
              </Button>
              <span className="text-xs font-medium">
                Page {currentPage} of {totalPages}
              </span>
              <Button variant="outline" size="icon-sm" onClick={() => setPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage >= totalPages} data-testid="notif-history-next-page">
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={viewing !== null} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{viewing?.templateName}</DialogTitle>
            <DialogDescription>Delivery record {viewing?.id.slice(0, 8)}…</DialogDescription>
          </DialogHeader>
          {viewing && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-muted/40 p-4">
                <Detail label="Recipient" value={viewing.recipient} />
                <Detail label="Application" value={appName.get(viewing.appId) ?? viewing.appId} />
                <Detail label="Channel" value={CHANNEL_LABELS[viewing.channel]} />
                <Detail label="Priority" value={PRIORITY_LABELS[viewing.priority]} />
                <Detail label="Sent at" value={formatDateTime(viewing.sentAt)} />
                <Detail label="Status" value={<StatusBadge value={viewing.status} label={DELIVERY_LABELS[viewing.status]} />} />
              </div>
              <div className="rounded-xl border border-border p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Message</p>
                <p className="mt-1.5 text-sm text-muted-foreground">{viewing.message}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
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

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format, isAfter, subDays } from 'date-fns';
import { Download, Search } from 'lucide-react';
import { applicationService } from '@/services/adminService';
import { auditService } from '@/services/auditService';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
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
import { MODULES } from '@/lib/labels';

export default function AuditLogs() {
  const { data: audit = [] } = useQuery({ queryKey: ['audit-logs'], queryFn: () => auditService.list() });
  const { data: apps = [] } = useQuery({ queryKey: ['apps'], queryFn: () => applicationService.list() });

  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [appFilter, setAppFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [period, setPeriod] = useState('all');

  const appName = useMemo(() => new Map(apps.map((a) => [a.id, a.name])), [apps]);

  const filtered = useMemo(() => {
    const cutoff = period === '7' ? subDays(new Date(), 7) : period === '30' ? subDays(new Date(), 30) : null;
    const q = search.trim().toLowerCase();
    return audit.filter((entry) => {
      if (moduleFilter !== 'all' && entry.module !== moduleFilter) return false;
      if (appFilter !== 'all' && entry.appId !== appFilter) return false;
      if (statusFilter !== 'all' && entry.status !== statusFilter) return false;
      if (cutoff && !isAfter(new Date(entry.timestamp), cutoff)) return false;
      if (q && !entry.user.toLowerCase().includes(q) && !entry.action.toLowerCase().includes(q) && !entry.ip.includes(q)) return false;
      return true;
    });
  }, [audit, search, moduleFilter, appFilter, statusFilter, period]);

  const exportCsv = () => {
    const header = ['ID', 'User', 'Module', 'Action', 'Application', 'Timestamp', 'IP Address', 'Status'];
    const rows = filtered.map((entry) => [
      entry.id,
      entry.user,
      entry.module,
      entry.action,
      appName.get(entry.appId) ?? entry.appId,
      entry.timestamp,
      entry.ip,
      entry.status,
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `npst-audit-logs-${format(new Date(), 'yyyyMMdd-HHmm')}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filtered.length} audit entries`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Logs"
        description="Every administrative action across branding, notifications, reminders, users and applications."
        testId="audit-title"
        actions={
          <Button variant="outline" onClick={exportCsv} data-testid="audit-export-button">
            <Download className="size-4" /> Export CSV
          </Button>
        }
      />

      <Card className="shadow-sm">
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <div className="relative w-full xl:max-w-xs">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search user, action or IP…" className="pl-9" data-testid="audit-search-input" />
            </div>
            <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-4">
              <Select value={moduleFilter} onValueChange={setModuleFilter}>
                <SelectTrigger data-testid="audit-module-filter"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All modules</SelectItem>
                  {MODULES.map((module) => (
                    <SelectItem key={module} value={module}>
                      {module}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={appFilter} onValueChange={setAppFilter}>
                <SelectTrigger data-testid="audit-app-filter"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All applications</SelectItem>
                  {apps.map((app) => (
                    <SelectItem key={app.id} value={app.id}>
                      {app.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger data-testid="audit-status-filter"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger data-testid="audit-period-filter"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All time</SelectItem>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Table data-testid="audit-table">
            <TableHeader>
              <TableRow>
                <TableHead className="hidden xl:table-cell">ID</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Module</TableHead>
                <TableHead>Action</TableHead>
                <TableHead className="hidden lg:table-cell">Application</TableHead>
                <TableHead className="hidden md:table-cell">Timestamp</TableHead>
                <TableHead className="hidden xl:table-cell">IP Address</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="hidden xl:table-cell font-mono text-xs text-muted-foreground">{entry.id.replace(/^aud-/, 'A-')}</TableCell>
                  <TableCell className="whitespace-nowrap font-medium">{entry.user}</TableCell>
                  <TableCell>
                    <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{entry.module}</span>
                  </TableCell>
                  <TableCell className="max-w-72 truncate">{entry.action}</TableCell>
                  <TableCell className="hidden lg:table-cell">{appName.get(entry.appId) ?? entry.appId}</TableCell>
                  <TableCell className="hidden md:table-cell whitespace-nowrap text-muted-foreground">{formatDateTime(entry.timestamp)}</TableCell>
                  <TableCell className="hidden xl:table-cell font-mono text-xs text-muted-foreground">{entry.ip}</TableCell>
                  <TableCell>
                    <StatusBadge value={entry.status} label={entry.status === 'success' ? 'Success' : 'Failed'} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <p className="border-t border-border pt-3 text-xs text-muted-foreground" data-testid="audit-count">
            {filtered.length} of {audit.length} entries
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

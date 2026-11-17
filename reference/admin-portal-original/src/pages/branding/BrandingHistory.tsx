import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Eye, RotateCcw } from 'lucide-react';
import { applicationService } from '@/services/adminService';
import { brandingService } from '@/services/brandingService';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { BrandingPreview } from '@/components/branding/BrandingPreview';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDateTime } from '@/utils/format';
import type { BrandingVersion } from '@/types';

export default function BrandingHistory() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [appFilter, setAppFilter] = useState(searchParams.get('appId') ?? 'all');
  const [previewing, setPreviewing] = useState<BrandingVersion | null>(null);
  const [restoring, setRestoring] = useState<BrandingVersion | null>(null);

  const { data: apps = [] } = useQuery({ queryKey: ['apps'], queryFn: () => applicationService.list() });
  const { data: versions = [] } = useQuery({ queryKey: ['branding-versions'], queryFn: () => brandingService.listVersions() });

  const appName = useMemo(() => new Map(apps.map((a) => [a.id, a.name])), [apps]);
  const filtered = useMemo(
    () =>
      versions
        .filter((v) => appFilter === 'all' || v.appId === appFilter)
        .sort((a, b) => new Date(b.modifiedDate).getTime() - new Date(a.modifiedDate).getTime()),
    [versions, appFilter],
  );

  const restoreMutation = useMutation({
    mutationFn: (version: BrandingVersion) => Promise.resolve(brandingService.restoreVersion(version.appId, version.id)),
    onSuccess: (config) => {
      queryClient.invalidateQueries({ queryKey: ['branding-configs'] });
      queryClient.invalidateQueries({ queryKey: ['branding-config', config.appId] });
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
      toast.success('Version restored as draft');
      setRestoring(null);
      navigate(`/branding/configure/${config.appId}`);
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Branding Version History"
        description="Every published branding configuration, with preview and restore back to any previous version."
        testId="branding-history-title"
        actions={
          <Select value={appFilter} onValueChange={setAppFilter}>
            <SelectTrigger className="w-48" data-testid="branding-history-app-filter">
              <SelectValue>{appFilter === 'all' ? 'All applications' : appName.get(appFilter) ?? appFilter}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All applications</SelectItem>
              {apps.map((app) => (
                <SelectItem key={app.id} value={app.id}>
                  {app.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <Card className="shadow-sm">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="p-6">
              <EmptyState title="No versions yet" description="Publish a theme from the branding editor and it will appear here." />
            </div>
          ) : (
            <Table data-testid="branding-history-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Version</TableHead>
                  <TableHead>Application</TableHead>
                  <TableHead className="hidden md:table-cell">Modified By</TableHead>
                  <TableHead>Modified Date</TableHead>
                  <TableHead className="hidden lg:table-cell">Published By</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((version) => (
                  <TableRow key={version.id}>
                    <TableCell>
                      <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs font-semibold">v{version.version}</span>
                    </TableCell>
                    <TableCell className="font-medium">{appName.get(version.appId) ?? version.appId}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">{version.modifiedBy}</TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{formatDateTime(version.modifiedDate)}</TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">{version.publishedBy}</TableCell>
                    <TableCell>
                      <StatusBadge value={version.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1.5">
                        <Button variant="outline" size="icon-sm" aria-label="Preview version" onClick={() => setPreviewing(version)} data-testid={`branding-history-preview-${version.id}`}>
                          <Eye className="size-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon-sm"
                          aria-label="Restore version"
                          onClick={() => setRestoring(version)}
                          data-testid={`branding-history-restore-${version.id}`}
                        >
                          <RotateCcw className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={previewing !== null} onOpenChange={(open) => !open && setPreviewing(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {previewing ? `${appName.get(previewing.appId) ?? ''} — version ${previewing.version}` : ''}
            </DialogTitle>
            <DialogDescription>Snapshot of the theme as published on {previewing ? formatDateTime(previewing.modifiedDate) : ''}.</DialogDescription>
          </DialogHeader>
          {previewing && <BrandingPreview style={previewing.style} appName={appName.get(previewing.appId) ?? 'Application'} />}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={restoring !== null}
        onOpenChange={(open) => !open && setRestoring(null)}
        title={restoring ? `Restore version ${restoring.version}?` : 'Restore version?'}
        description="The selected version will be copied back into the branding editor as a draft. Nothing goes live until you publish again."
        confirmLabel="Restore as draft"
        onConfirm={() => restoring && restoreMutation.mutate(restoring)}
      />
    </div>
  );
}

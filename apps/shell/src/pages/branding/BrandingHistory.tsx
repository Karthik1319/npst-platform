import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/lib/toast';
import { Eye, RotateCcw } from '@/components/icons';
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
import styles from './BrandingHistory.module.css';

export default function BrandingHistory() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [appFilter, setAppFilter] = useState(
    searchParams.get('appId') ?? 'all',
  );
  const [previewing, setPreviewing] = useState<BrandingVersion | null>(null);
  const [restoring, setRestoring] = useState<BrandingVersion | null>(null);

  const { data: apps = [] } = useQuery({
    queryKey: ['apps'],
    queryFn: () => applicationService.list(),
  });
  const { data: versions = [] } = useQuery({
    queryKey: ['branding-versions'],
    queryFn: () => brandingService.listVersions(),
  });

  const appName = useMemo(
    () => new Map(apps.map((a) => [a.id, a.name])),
    [apps],
  );
  const filtered = useMemo(
    () =>
      versions
        .filter((v) => appFilter === 'all' || v.appId === appFilter)
        .sort(
          (a, b) =>
            new Date(b.modifiedDate).getTime() -
            new Date(a.modifiedDate).getTime(),
        ),
    [versions, appFilter],
  );

  const restoreMutation = useMutation({
    mutationFn: (version: BrandingVersion) =>
      Promise.resolve(
        brandingService.restoreVersion(version.appId, version.id),
      ),
    onSuccess: (config) => {
      queryClient.invalidateQueries({ queryKey: ['branding-configs'] });
      queryClient.invalidateQueries({
        queryKey: ['branding-config', config.appId],
      });
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
      toast.success('Version restored as draft');
      setRestoring(null);
      navigate(`/branding/configure/${config.appId}`);
    },
  });

  return (
    <div className={styles.div}>
      <PageHeader
        title="Branding Version History"
        description="Every published branding configuration, with preview and restore back to any previous version."
        testId="branding-history-title"
        actions={
          <Select value={appFilter} onValueChange={setAppFilter}>
            <SelectTrigger
              className={styles.selectTrigger}
              data-testid="branding-history-app-filter"
            >
              <SelectValue>
                {appFilter === 'all'
                  ? 'All applications'
                  : (appName.get(appFilter) ?? appFilter)}
              </SelectValue>
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

      <Card className={styles.card}>
        <CardContent className={styles.cardContent}>
          {filtered.length === 0 ? (
            <div className={styles.div2}>
              <EmptyState
                title="No versions yet"
                description="Publish a theme from the branding editor and it will appear here."
              />
            </div>
          ) : (
            <Table data-testid="branding-history-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Version</TableHead>
                  <TableHead>Application</TableHead>
                  <TableHead className={styles.tableHead}>
                    Modified By
                  </TableHead>
                  <TableHead>Modified Date</TableHead>
                  <TableHead className={styles.tableHead2}>
                    Published By
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className={styles.tableHead3}>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((version) => (
                  <TableRow key={version.id}>
                    <TableCell>
                      <span className={styles.span}>v{version.version}</span>
                    </TableCell>
                    <TableCell className={styles.tableCell}>
                      {appName.get(version.appId) ?? version.appId}
                    </TableCell>
                    <TableCell className={styles.tableCell2}>
                      {version.modifiedBy}
                    </TableCell>
                    <TableCell className={styles.tableCell3}>
                      {formatDateTime(version.modifiedDate)}
                    </TableCell>
                    <TableCell className={styles.tableCell4}>
                      {version.publishedBy}
                    </TableCell>
                    <TableCell>
                      <StatusBadge value={version.status} />
                    </TableCell>
                    <TableCell>
                      <div className={styles.div3}>
                        <Button
                          variant="outline"
                          size="icon-sm"
                          aria-label="Preview version"
                          onClick={() => setPreviewing(version)}
                          data-testid={`branding-history-preview-${version.id}`}
                        >
                          <Eye className={`${styles.eye} npst-sized`} />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon-sm"
                          aria-label="Restore version"
                          onClick={() => setRestoring(version)}
                          data-testid={`branding-history-restore-${version.id}`}
                        >
                          <RotateCcw className={`${styles.eye} npst-sized`} />
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

      <Dialog
        open={previewing !== null}
        onOpenChange={(open) => !open && setPreviewing(null)}
      >
        <DialogContent className={styles.dialogContent}>
          <DialogHeader>
            <DialogTitle>
              {previewing
                ? `${appName.get(previewing.appId) ?? ''} — version ${previewing.version}`
                : ''}
            </DialogTitle>
            <DialogDescription>
              Snapshot of the theme as published on{' '}
              {previewing ? formatDateTime(previewing.modifiedDate) : ''}.
            </DialogDescription>
          </DialogHeader>
          {previewing && (
            <BrandingPreview
              draft={previewing.style}
              appName={appName.get(previewing.appId) ?? 'Application'}
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={restoring !== null}
        onOpenChange={(open) => !open && setRestoring(null)}
        title={
          restoring
            ? `Restore version ${restoring.version}?`
            : 'Restore version?'
        }
        description="The selected version will be copied back into the branding editor as a draft. Nothing goes live until you publish again."
        confirmLabel="Restore as draft"
        onConfirm={() => restoring && restoreMutation.mutate(restoring)}
      />
    </div>
  );
}

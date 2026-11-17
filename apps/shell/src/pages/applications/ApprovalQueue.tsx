import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router';
import { toast } from '@/lib/toast';
import { CheckCircle2, Eye, XCircle } from '@/components/icons';
import { applicationService } from '@/services/adminService';
import { brandingService } from '@/services/brandingService';
import { useAuth } from '@/context/AuthContext';
import { BrandingPreview } from '@/components/branding/BrandingPreview';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDateTime } from '@/utils/format';
import type { BrandingApprovalRequest } from '@/types';
import styles from './ApprovalQueue.module.css';

export default function ApprovalQueue() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [params] = useSearchParams();
  const { data: requests = [] } = useQuery({
    queryKey: ['branding-approvals'],
    queryFn: () => brandingService.listApprovalRequests(),
  });
  const { data: apps = [] } = useQuery({
    queryKey: ['apps'],
    queryFn: () => applicationService.list(),
  });
  const [selected, setSelected] = useState<BrandingApprovalRequest | null>(
    null,
  );
  const [comments, setComments] = useState('');
  const appNames = useMemo(
    () => new Map(apps.map((app) => [app.id, app.name])),
    [apps],
  );
  const pending = requests.filter((request) => request.status === 'pending');

  const review = useMutation({
    mutationFn: ({
      request,
      action,
    }: {
      request: BrandingApprovalRequest;
      action: 'approve' | 'reject';
    }) =>
      action === 'approve'
        ? Promise.resolve(brandingService.approveRequest(request.id, comments))
        : Promise.resolve(brandingService.rejectRequest(request.id, comments)),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['branding-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['branding-configs'] });
      queryClient.invalidateQueries({ queryKey: ['branding-versions'] });
      queryClient.invalidateQueries({ queryKey: ['apps'] });
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
      toast.success(
        variables.action === 'approve'
          ? 'Branding request approved'
          : 'Branding request rejected',
      );
      setSelected(null);
      setComments('');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const requestedId = params.get('requestId');
  const openRequest = (request: BrandingApprovalRequest) => {
    setSelected(request);
    setComments('');
  };

  if (user?.role === 'Employee') {
    return (
      <Card>
        <CardContent className={styles.cardContent}>
          You do not have permission to review approval requests.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={styles.div}>
      <PageHeader
        title="Approval Queue"
        description="Review and decide pending UI branding and theme change requests."
        testId="approval-queue-title"
      />
      <Card className={styles.card}>
        <CardContent className={styles.cardContent2}>
          <Table data-testid="approval-queue-table">
            <TableHeader>
              <TableRow>
                <TableHead>Request ID</TableHead>
                <TableHead>Application</TableHead>
                <TableHead>Request Type</TableHead>
                <TableHead>Requested By</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className={styles.tableHead}>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pending.map((request) => (
                <TableRow
                  key={request.id}
                  className={
                    request.id === requestedId ? styles.tableRow : undefined
                  }
                >
                  <TableCell className={styles.tableCell}>
                    {request.id.slice(0, 12)}
                  </TableCell>
                  <TableCell className={styles.tableCell2}>
                    {appNames.get(request.appId) ?? request.appId}
                  </TableCell>
                  <TableCell>UI Branding</TableCell>
                  <TableCell>{request.requestedBy}</TableCell>
                  <TableCell className={styles.tableCell3}>
                    {formatDateTime(request.submittedAt)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge value={request.status} />
                  </TableCell>
                  <TableCell className={styles.tableHead}>
                    <Button
                      size="sm"
                      onClick={() => openRequest(request)}
                      data-testid={`approval-review-${request.id}`}
                    >
                      <Eye className={`${styles.eye} npst-sized`} /> Review
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {pending.length === 0 && (
            <p className={styles.p}>No pending approval requests.</p>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={selected !== null}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        <DialogContent className="branding-review-modal">
          <DialogHeader>
            <DialogTitle>Review branding request</DialogTitle>
            <DialogDescription>
              {selected &&
                `${appNames.get(selected.appId) ?? selected.appId} · requested by ${selected.requestedBy}`}
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="branding-review-body">
              <div className="branding-comparison">
                <div className={styles.div2}>
                  <p className={styles.p2}>Previous configuration</p>
                  <BrandingPreview
                    draft={selected.previousStyle}
                    appName={appNames.get(selected.appId) ?? 'Current theme'}
                    logo={selected.previousAssets.logo}
                  />
                </div>
                <div className={styles.div2}>
                  <p className={styles.p2}>Proposed configuration</p>
                  <BrandingPreview
                    draft={selected.proposedStyle}
                    appName={appNames.get(selected.appId) ?? 'Proposed theme'}
                    logo={selected.proposedAssets.logo}
                  />
                </div>
              </div>
              <Textarea
                className={styles.textarea}
                value={comments}
                onChange={(event) => setComments(event.target.value)}
                placeholder="Add checker comments or rejection reason…"
                data-testid="approval-comments-input"
              />
            </div>
          )}
          <DialogFooter className={styles.dialogFooter}>
            <Button variant="outline" onClick={() => setSelected(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                selected &&
                review.mutate({ request: selected, action: 'reject' })
              }
              disabled={review.isPending}
            >
              <XCircle className={`${styles.eye} npst-sized`} /> Reject
            </Button>
            <Button
              onClick={() =>
                selected &&
                review.mutate({ request: selected, action: 'approve' })
              }
              disabled={review.isPending}
            >
              <CheckCircle2 className={`${styles.eye} npst-sized`} /> Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

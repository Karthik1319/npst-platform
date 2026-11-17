import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { CheckCircle2, Eye, XCircle } from 'lucide-react';
import { applicationService } from '@/services/adminService';
import { brandingService } from '@/services/brandingService';
import { useAuth } from '@/context/AuthContext';
import { BrandingPreview } from '@/components/branding/BrandingPreview';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDateTime } from '@/utils/format';
import type { BrandingApprovalRequest } from '@/types';

export default function ApprovalQueue() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [params] = useSearchParams();
  const { data: requests = [] } = useQuery({ queryKey: ['branding-approvals'], queryFn: () => brandingService.listApprovalRequests() });
  const { data: apps = [] } = useQuery({ queryKey: ['apps'], queryFn: () => applicationService.list() });
  const [selected, setSelected] = useState<BrandingApprovalRequest | null>(null);
  const [comments, setComments] = useState('');
  const appNames = useMemo(() => new Map(apps.map((app) => [app.id, app.name])), [apps]);
  const pending = requests.filter((request) => request.status === 'pending');

  const review = useMutation({
    mutationFn: ({ request, action }: { request: BrandingApprovalRequest; action: 'approve' | 'reject' }) =>
      action === 'approve' ? Promise.resolve(brandingService.approveRequest(request.id, comments)) : Promise.resolve(brandingService.rejectRequest(request.id, comments)),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['branding-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['branding-configs'] });
      queryClient.invalidateQueries({ queryKey: ['branding-versions'] });
      queryClient.invalidateQueries({ queryKey: ['apps'] });
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
      toast.success(variables.action === 'approve' ? 'Branding request approved' : 'Branding request rejected');
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
    return <Card><CardContent className="p-6 text-sm text-muted-foreground">You do not have permission to review approval requests.</CardContent></Card>;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Approval Queue" description="Review and decide pending UI branding and theme change requests." testId="approval-queue-title" />
      <Card className="shadow-sm">
        <CardContent className="p-0">
          <Table data-testid="approval-queue-table">
            <TableHeader><TableRow><TableHead>Request ID</TableHead><TableHead>Application</TableHead><TableHead>Request Type</TableHead><TableHead>Requested By</TableHead><TableHead>Submitted</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
            <TableBody>
              {pending.map((request) => (
                <TableRow key={request.id} className={request.id === requestedId ? 'bg-blue-50/50' : undefined}>
                  <TableCell className="font-mono text-xs">{request.id.slice(0, 12)}</TableCell>
                  <TableCell className="font-medium">{appNames.get(request.appId) ?? request.appId}</TableCell>
                  <TableCell>UI Branding</TableCell>
                  <TableCell>{request.requestedBy}</TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{formatDateTime(request.submittedAt)}</TableCell>
                  <TableCell><StatusBadge value={request.status} /></TableCell>
                  <TableCell className="text-right"><Button size="sm" onClick={() => openRequest(request)} data-testid={`approval-review-${request.id}`}><Eye className="size-4" /> Review</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {pending.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">No pending approval requests.</p>}
        </CardContent>
      </Card>

      <Dialog open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="branding-review-modal">
          <DialogHeader>
            <DialogTitle>Review branding request</DialogTitle>
            <DialogDescription>{selected && `${appNames.get(selected.appId) ?? selected.appId} · requested by ${selected.requestedBy}`}</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="branding-review-body">
              <div className="branding-comparison">
                <div className="min-w-0 space-y-2"><p className="text-sm font-semibold">Previous configuration</p><BrandingPreview style={selected.previousStyle} appName={appNames.get(selected.appId) ?? 'Current theme'} logo={selected.previousAssets.logo} /></div>
                <div className="min-w-0 space-y-2"><p className="text-sm font-semibold">Proposed configuration</p><BrandingPreview style={selected.proposedStyle} appName={appNames.get(selected.appId) ?? 'Proposed theme'} logo={selected.proposedAssets.logo} /></div>
              </div>
              <Textarea className="mt-4 shrink-0" value={comments} onChange={(event) => setComments(event.target.value)} placeholder="Add checker comments or rejection reason…" data-testid="approval-comments-input" />
            </div>
          )}
          <DialogFooter className="shrink-0">
            <Button variant="outline" onClick={() => setSelected(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => selected && review.mutate({ request: selected, action: 'reject' })} disabled={review.isPending}><XCircle className="size-4" /> Reject</Button>
            <Button onClick={() => selected && review.mutate({ request: selected, action: 'approve' })} disabled={review.isPending}><CheckCircle2 className="size-4" /> Approve</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

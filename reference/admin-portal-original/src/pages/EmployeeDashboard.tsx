import { Bell, CircleHelp, UserRound } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  return (
    <div className="space-y-6">
      <PageHeader title={`Welcome, ${user?.name ?? 'Employee'}`} description="Your NPST Shared Services workspace." testId="employee-dashboard-title" />
      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="space-y-3 p-5"><UserRound className="size-5 text-primary" /><p className="font-semibold">My Profile</p><p className="text-sm text-muted-foreground">{user?.email}</p><Button variant="outline" size="sm">View profile</Button></CardContent></Card>
        <Card><CardContent className="space-y-3 p-5"><Bell className="size-5 text-primary" /><p className="font-semibold">My Notifications</p><p className="text-sm text-muted-foreground">View your latest service updates.</p><Button variant="outline" size="sm">View notifications</Button></CardContent></Card>
        <Card><CardContent className="space-y-3 p-5"><CircleHelp className="size-5 text-primary" /><p className="font-semibold">Help &amp; Support</p><p className="text-sm text-muted-foreground">Contact the NPST support team.</p><Button variant="outline" size="sm">Get help</Button></CardContent></Card>
      </div>
    </div>
  );
}

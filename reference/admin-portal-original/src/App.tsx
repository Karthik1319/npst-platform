import { Routes, Route, Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import ApprovalQueue from '@/pages/applications/ApprovalQueue';
import BrandingDashboard from '@/pages/branding/BrandingDashboard';
import BrandingEditor from '@/pages/branding/BrandingEditor';
import BrandingHistory from '@/pages/branding/BrandingHistory';
import Templates from '@/pages/notifications/Templates';
import NotificationChannels from '@/pages/notifications/NotificationChannels';
import ReminderDashboard from '@/pages/reminders/ReminderDashboard';
import ReminderConfiguration from '@/pages/reminders/ReminderConfiguration';
import EscalationManagement from '@/pages/reminders/EscalationManagement';
import ReminderHistory from '@/pages/reminders/ReminderHistory';
import UserManagement from '@/pages/users/UserManagement';
import AuditLogs from '@/pages/audit/AuditLogs';
import Settings from '@/pages/settings/Settings';
import AISummary from '@/pages/AISummary';
import EmployeeDashboard from '@/pages/EmployeeDashboard';

function RequireAuth({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function GuestRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function RoleRoute({ roles, children }: { roles: string[]; children: ReactNode }) {
  const { user } = useAuth();
  if (!user || !roles.includes(user.role)) return <Navigate to={user?.role === 'Employee' ? '/employee' : '/'} replace />;
  return <>{children}</>;
}

// One <Route> per page in src/pages; BrowserRouter already wraps this in main.tsx.
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
      <Route element={<RequireAuth><RoleRoute roles={['Super Admin', 'Admin', 'Maker', 'Checker', 'Application Admin']}><AppLayout /></RoleRoute></RequireAuth>}>
        <Route index element={<Dashboard />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="applications" element={<Navigate to="/" replace />} />
        <Route path="applications/approval-queue" element={<ApprovalQueue />} />
        <Route path="branding" element={<BrandingDashboard />} />
        <Route path="branding/configure/:appId" element={<BrandingEditor />} />
        <Route path="branding/history" element={<BrandingHistory />} />
        <Route path="notifications" element={<Navigate to="/notifications/templates" replace />} />
        <Route path="notifications/templates" element={<Templates />} />
        <Route path="notifications/channels" element={<NotificationChannels />} />
        <Route path="reminders" element={<ReminderDashboard />} />
        <Route path="reminders/configuration" element={<ReminderConfiguration />} />
        <Route path="reminders/escalations" element={<EscalationManagement />} />
        <Route path="reminders/history" element={<ReminderHistory />} />
        <Route path="ai-summary" element={<AISummary />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="audit-logs" element={<AuditLogs />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
      <Route element={<RequireAuth><RoleRoute roles={['Employee']}><AppLayout /></RoleRoute></RequireAuth>}>
        <Route path="employee" element={<EmployeeDashboard />} />
      </Route>
    </Routes>
  );
}

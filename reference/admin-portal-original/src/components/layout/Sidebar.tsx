import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Bell,
  ChevronDown,
  Clock,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  Palette,
  ScrollText,
  Settings,
  Users,
  LifeBuoy,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AppLogo } from '@/components/common/AppLogo';
import { initialsOf } from '@/utils/format';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export interface NavChild {
  label: string;
  path: string;
}

interface NavItem {
  label: string;
  icon: LucideIcon;
  path: string;
  children?: NavChild[];
}

export const NAV_SECTIONS: { section: string; items: NavItem[] }[] = [
  {
    section: 'Application Management',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
      { label: 'Approval Queue', icon: Bell, path: '/applications/approval-queue' },
    ],
  },
  {
    section: 'Shared Services',
    items: [
      {
        label: 'UI Branding',
        icon: Palette,
        path: '/branding',
        children: [
          { label: 'Branding Dashboard', path: '/branding' },
          { label: 'Version History', path: '/branding/history' },
        ],
      },
      {
        label: 'Notification Management',
        icon: Bell,
        path: '/notifications/templates',
        children: [
          { label: 'Notification Templates', path: '/notifications/templates' },
          { label: 'Notification Channels', path: '/notifications/channels' },
        ],
      },
      {
        label: 'Reminders',
        icon: Clock,
        path: '/reminders',
        children: [
          { label: 'Configuration', path: '/reminders/configuration' },
          { label: 'Escalations', path: '/reminders/escalations' },
        ],
      },
    ],
  },
  {
    section: 'Administration',
    items: [
      { label: 'Employee Management', icon: Users, path: '/users' },
      { label: 'Audit Logs', icon: ScrollText, path: '/audit-logs' },
      { label: 'Settings', icon: Settings, path: '/settings' },
    ],
  },
];

const testIdOf = (label: string) => label.toLowerCase().replace(/\s+/g, '-');

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
  onNavigate?: () => void;
}

export default function Sidebar({ collapsed = false, onToggle, onNavigate }: SidebarProps) {
  const { user } = useAuth();
  const location = useLocation();
  const [manual, setManual] = useState<Record<string, boolean>>({});
  const [supportOpen, setSupportOpen] = useState(false);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const pathMatches = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname === path || location.pathname.startsWith(`${path}/`);
  const childPathMatches = (path: string) => location.pathname === path;

  const isItemActive = (item: NavItem) =>
    item.children
      ? item.children.some((c) => childPathMatches(c.path)) || pathMatches(item.path)
      : pathMatches(item.path);

  const itemButtonClass = (active: boolean) =>
    cn(
      'relative flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition-colors duration-150',
      collapsed && 'justify-center px-0',
      active
        ? 'bg-sidebar-accent font-semibold text-sidebar-accent-foreground'
        : 'text-sidebar-foreground/85 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
    );

  return (
    <aside className="flex h-full flex-col border-r border-sidebar-border bg-sidebar">
      <div className={cn('flex min-h-16 shrink-0 items-center border-b border-sidebar-border px-4 py-2', collapsed && 'justify-center px-0')}>
        <NavLink to="/" onClick={onNavigate} className="rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-sky-400" data-testid="sidebar-logo-link">
          <div className={cn('flex flex-col', collapsed && 'items-center')}>
            <AppLogo collapsed={collapsed} />
            {!collapsed && (
              <div className="mt-1 text-[10px] leading-tight text-sidebar-foreground/65">
                <p>{now.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                <p>{now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            )}
          </div>
        </NavLink>
      </div>

      {onToggle && (
        <div className={cn('flex shrink-0 px-3 pt-3', collapsed && 'justify-center px-0')}>
          <button
            type="button"
            onClick={onToggle}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            data-testid="sidebar-collapse-button"
            className={cn(
              'grid size-8 place-items-center rounded-lg text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
              collapsed && 'w-full',
            )}
          >
            {collapsed ? <PanelLeftOpen className="size-[18px]" /> : <PanelLeftClose className="size-[18px]" />}
          </button>
        </div>
      )}

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4" data-testid="sidebar-nav">
        {NAV_SECTIONS.map((section) => (
          <div key={section.section}>
            {!collapsed && (
              <p className="px-2.5 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-sidebar-foreground/50">
                {section.section}
              </p>
            )}
            {collapsed && <div className="mx-auto mb-2 h-px w-6 bg-sidebar-border" />}
            <ul className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isItemActive(item);
                const parentActive = !item.children && active;
                const groupOpen = manual[item.label] ?? (item.children?.some((c) => childPathMatches(c.path)) ?? false);
                const testId = `nav-${testIdOf(item.label)}`;

                if (item.children && !collapsed) {
                  return (
                    <li key={item.label}>
                      <button
                        type="button"
                        onClick={() => setManual((m) => ({ ...m, [item.label]: !groupOpen }))}
                        className={itemButtonClass(parentActive)}
                        data-testid={`nav-group-${testIdOf(item.label)}`}
                        aria-expanded={groupOpen}
                      >
                        {parentActive && <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-sky-400" />}
                        <Icon className="size-[18px] shrink-0" />
                        <span className="flex-1 text-left">{item.label}</span>
                        <ChevronDown className={cn('size-4 shrink-0 opacity-60 transition-transform duration-200', groupOpen && 'rotate-180')} />
                      </button>
                      {groupOpen && (
                        <ul className="mt-1 space-y-0.5 pl-10">
                          {item.children.map((child) => {
                            const childActive = childPathMatches(child.path);
                            return (
                              <li key={child.path}>
                                <NavLink
                                  to={child.path}
                                  onClick={onNavigate}
                                  className={cn(
                                    'block rounded-md px-2.5 py-1.5 text-[13px] transition-colors',
                                    childActive
                                      ? 'font-semibold text-sidebar-accent-foreground'
                                      : 'text-sidebar-foreground/70 hover:text-sidebar-foreground',
                                  )}
                                  data-testid={`nav-${testIdOf(child.label)}`}
                                >
                                  {child.label}
                                </NavLink>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </li>
                  );
                }

                return (
                  <li key={item.label}>
                    <NavLink
                      to={item.path}
                      onClick={onNavigate}
                      title={collapsed ? item.label : undefined}
                      className={itemButtonClass(active)}
                      data-testid={testId}
                    >
                      {active && <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-sky-400" />}
                      <Icon className="size-[18px] shrink-0" />
                      {!collapsed && <span>{item.label}</span>}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <button
          type="button"
          onClick={() => setSupportOpen(true)}
          title={collapsed ? 'Help & Support' : undefined}
          className={cn(itemButtonClass(false), 'mb-3')}
          data-testid="sidebar-help-support"
        >
          <LifeBuoy className="size-[18px] shrink-0" />
          {!collapsed && <span>Help &amp; Support</span>}
        </button>
        <div className={cn('flex items-center gap-2.5', collapsed && 'justify-center')}>
          <div className="grid size-8 shrink-0 place-items-center rounded-full bg-blue-500/20 text-[11px] font-bold text-sky-300">
            {initialsOf(user?.name ?? 'NP')}
          </div>
          {!collapsed && (
            <div className="min-w-0 leading-tight">
              <p className="truncate text-xs font-semibold text-sidebar-foreground">{user?.name ?? 'Super Admin'}</p>
              <p className="truncate text-[10px] text-sidebar-foreground/60">{user?.role ?? 'Super Admin'}</p>
            </div>
          )}
        </div>
      </div>
      <Dialog open={supportOpen} onOpenChange={setSupportOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>How can we help you?</DialogTitle>
            <DialogDescription>Contact the NPST support team for help with the Shared Services Admin Portal.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 rounded-lg border border-border bg-muted/40 p-4 text-sm">
            <a className="block font-medium text-primary hover:underline" href="mailto:support@npst.com">support@npst.com</a>
            <a className="block text-muted-foreground hover:text-foreground" href="tel:+919876543210">+91 98765 43210</a>
          </div>
        </DialogContent>
      </Dialog>
    </aside>
  );
}

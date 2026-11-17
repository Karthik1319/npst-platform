import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router';
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
  LayoutGrid,
  type LucideIcon,
} from '@/components/icons';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { usePlatform } from '@/platform/PlatformContext';
import { AppLogo } from '@/components/common/AppLogo';
import { initialsOf } from '@/utils/format';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import styles from './Sidebar.module.css';

export interface NavChild {
  label: string;
  path: string;
}

interface NavItem {
  label: string;
  icon: LucideIcon;
  path: string;
  children?: NavChild[];
  /** RBAC: shown only when `platform.permissions.can(action, resource)` (UI only). */
  permission?: readonly [action: string, resource: string];
}

export const NAV_SECTIONS: { section: string; items: NavItem[] }[] = [
  {
    section: 'Application Management',
    items: [
      {
        label: 'Dashboard',
        icon: LayoutDashboard,
        path: '/',
        permission: ['view', 'applications'],
      },
      {
        label: 'Approval Queue',
        icon: Bell,
        path: '/applications/approval-queue',
        permission: ['view', 'applications'],
      },
    ],
  },
  {
    section: 'Shared Services',
    items: [
      {
        label: 'UI Branding',
        icon: Palette,
        path: '/branding',
        permission: ['manage', 'branding'],
        children: [
          { label: 'Branding Dashboard', path: '/branding' },
          { label: 'Version History', path: '/branding/history' },
        ],
      },
      {
        label: 'Notification Management',
        icon: Bell,
        path: '/notifications/templates',
        permission: ['manage', 'notifications'],
        children: [
          { label: 'Notification Templates', path: '/notifications/templates' },
          { label: 'Notification Channels', path: '/notifications/channels' },
        ],
      },
      {
        label: 'Reminders',
        icon: Clock,
        path: '/reminders',
        permission: ['manage', 'reminders'],
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
      {
        label: 'Employee Management',
        icon: Users,
        path: '/users',
        permission: ['manage', 'employees'],
      },
      {
        label: 'Audit Logs',
        icon: ScrollText,
        path: '/audit-logs',
        permission: ['view', 'audit-logs'],
      },
      {
        label: 'Settings',
        icon: Settings,
        path: '/settings',
        permission: ['manage', 'settings'],
      },
    ],
  },
];

const testIdOf = (label: string) => label.toLowerCase().replace(/\s+/g, '-');

/** Title of the navigation section that lists the user's applications (MFEs). */
export const APPLICATIONS_SECTION = 'Applications';

/**
 * The navigation for the signed-in user: the Admin Portal sections their role
 * may use, then their applications (`platform.apps.allowed()`). Hiding is UI
 * only; every page and API checks permissions again.
 */
export function useNavSections(): { section: string; items: NavItem[] }[] {
  const platform = usePlatform();
  const { data: apps = [] } = useQuery({
    queryKey: ['portal-apps', platform.user.id],
    queryFn: () => platform.apps.allowed(),
  });
  const sections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter(
      (item) =>
        !item.permission || platform.permissions.can(...item.permission),
    ),
  })).filter((section) => section.items.length > 0);
  if (apps.length === 0) return sections;
  return [
    ...sections,
    {
      section: APPLICATIONS_SECTION,
      items: apps.map((app) => ({
        label: app.name,
        icon: LayoutGrid,
        path: app.path,
      })),
    },
  ];
}

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
  onNavigate?: () => void;
}

export default function Sidebar({
  collapsed = false,
  onToggle,
  onNavigate,
}: SidebarProps) {
  const { user } = useAuth();
  const navSections = useNavSections();
  const location = useLocation();
  const [manual, setManual] = useState<Record<string, boolean>>({});
  const [supportOpen, setSupportOpen] = useState(false);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const pathMatches = (path: string) =>
    path === '/'
      ? location.pathname === '/'
      : location.pathname === path || location.pathname.startsWith(`${path}/`);
  const childPathMatches = (path: string) => location.pathname === path;

  const isItemActive = (item: NavItem) =>
    item.children
      ? item.children.some((c) => childPathMatches(c.path)) ||
        pathMatches(item.path)
      : pathMatches(item.path);

  const itemButtonClass = (active: boolean) =>
    cn(
      styles.itemButtonClass,
      collapsed && styles.itemButtonClass2,
      active ? styles.itemButtonClass3 : styles.itemButtonClass4,
    );

  return (
    <aside className={styles.aside}>
      <div className={cn(styles.div, collapsed && styles.itemButtonClass2)}>
        <NavLink
          to="/"
          onClick={onNavigate}
          className={styles.navLink}
          data-testid="sidebar-logo-link"
        >
          <div className={cn(styles.div2, collapsed && styles.div3)}>
            <AppLogo collapsed={collapsed} />
            {!collapsed && (
              <div className={styles.div4}>
                <p>
                  {now.toLocaleDateString(undefined, {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
                <p>
                  {now.toLocaleTimeString(undefined, {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            )}
          </div>
        </NavLink>
      </div>

      {onToggle && (
        <div className={cn(styles.div5, collapsed && styles.itemButtonClass2)}>
          <button
            type="button"
            onClick={onToggle}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            data-testid="sidebar-collapse-button"
            className={cn(
              `${styles.button} npst-sized`,
              collapsed && styles.button2,
            )}
          >
            {collapsed ? (
              <PanelLeftOpen className={`${styles.panelLeftOpen} npst-sized`} />
            ) : (
              <PanelLeftClose
                className={`${styles.panelLeftOpen} npst-sized`}
              />
            )}
          </button>
        </div>
      )}

      <nav className={styles.nav} data-testid="sidebar-nav">
        {navSections.map((section) => (
          <div key={section.section}>
            {!collapsed && <p className={styles.p}>{section.section}</p>}
            {collapsed && <div className={styles.div6} />}
            <ul className={styles.ul}>
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isItemActive(item);
                const parentActive = !item.children && active;
                const groupOpen =
                  manual[item.label] ??
                  item.children?.some((c) => childPathMatches(c.path)) ??
                  false;
                const testId = `nav-${testIdOf(item.label)}`;

                if (item.children && !collapsed) {
                  return (
                    <li key={item.label}>
                      <button
                        type="button"
                        onClick={() =>
                          setManual((m) => ({ ...m, [item.label]: !groupOpen }))
                        }
                        className={itemButtonClass(parentActive)}
                        data-testid={`nav-group-${testIdOf(item.label)}`}
                        aria-expanded={groupOpen}
                      >
                        {parentActive && <span className={styles.span} />}
                        <Icon className={`${styles.icon} npst-sized`} />
                        <span className={styles.span2}>{item.label}</span>
                        <ChevronDown
                          className={cn(
                            `${styles.chevronDown} npst-sized`,
                            groupOpen && styles.chevronDown2,
                          )}
                        />
                      </button>
                      {groupOpen && (
                        <ul className={styles.ul2}>
                          {item.children.map((child) => {
                            const childActive = childPathMatches(child.path);
                            return (
                              <li key={child.path}>
                                <NavLink
                                  to={child.path}
                                  onClick={onNavigate}
                                  className={cn(
                                    styles.navLink2,
                                    childActive
                                      ? styles.navLink3
                                      : styles.navLink4,
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
                      {active && <span className={styles.span} />}
                      <Icon className={`${styles.icon} npst-sized`} />
                      {!collapsed && <span>{item.label}</span>}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className={styles.div7}>
        <button
          type="button"
          onClick={() => setSupportOpen(true)}
          title={collapsed ? 'Help & Support' : undefined}
          className={cn(itemButtonClass(false), styles.button3)}
          data-testid="sidebar-help-support"
        >
          <LifeBuoy className={`${styles.icon} npst-sized`} />
          {!collapsed && <span>Help &amp; Support</span>}
        </button>
        <div className={cn(styles.div8, collapsed && styles.div9)}>
          <div className={`${styles.div10} npst-sized`}>
            {initialsOf(user?.name ?? 'NP')}
          </div>
          {!collapsed && (
            <div className={styles.div11}>
              <p className={styles.p2}>{user?.name ?? 'Super Admin'}</p>
              <p className={styles.p3}>{user?.role ?? 'Super Admin'}</p>
            </div>
          )}
        </div>
      </div>
      <Dialog open={supportOpen} onOpenChange={setSupportOpen}>
        <DialogContent className={styles.dialogContent}>
          <DialogHeader>
            <DialogTitle>How can we help you?</DialogTitle>
            <DialogDescription>
              Contact the NPST support team for help with the Shared Services
              Admin Portal.
            </DialogDescription>
          </DialogHeader>
          <div className={styles.div12}>
            <a className={styles.a} href="mailto:support@npst.com">
              support@npst.com
            </a>
            <a className={styles.a2} href="tel:+919876543210">
              +91 98765 43210
            </a>
          </div>
        </DialogContent>
      </Dialog>
    </aside>
  );
}

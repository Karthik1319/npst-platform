import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/lib/toast';
import {
  Bell,
  Accessibility,
  Contrast,
  BookOpen,
  ChevronRight,
  Clock,
  FileText,
  HelpCircle,
  LifeBuoy,
  LogOut,
  Menu,
  Palette,
  Search,
  Settings,
  Users,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sun,
  Moon,
  Sparkles,
  ArrowUp,
  X,
} from '@/components/icons';
import { applicationService, userService } from '@/services/adminService';
import { notificationService } from '@/services/notificationService';
import { reminderService } from '@/services/reminderService';
import { STORAGE_KEYS } from '@/services/storage';
import { useAuth } from '@/context/AuthContext';
import {
  APPLICATIONS_SECTION,
  NAV_SECTIONS,
} from '@/components/layout/Sidebar';
import { usePlatform } from '@/platform/PlatformContext';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { timeAgo, initialsOf } from '@/utils/format';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import styles from './Topbar.module.css';

interface SearchResult {
  id: string;
  label: string;
  module: string;
  path: string;
  icon: typeof Search;
}

export default function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [askAiOpen, setAskAiOpen] = useState(false);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiMessage, setAiMessage] = useState('');
  const [accessibility, setAccessibility] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem(STORAGE_KEYS.accessibility) ??
          '{"zoom":1,"highContrast":false,"theme":"light"}',
      ) as { zoom: number; highContrast: boolean; theme: 'light' | 'dark' };
    } catch {
      return { zoom: 1, highContrast: false, theme: 'light' as const };
    }
  });

  const queryClient = useQueryClient();
  const platform = usePlatform();
  const { data: catalogue = [] } = useQuery({
    queryKey: ['portal-catalogue'],
    queryFn: () => platform.apps.catalogue(),
  });
  // The bell shows the platform's inbox (Notification Service): administrative
  // notifications and messages from the applications.
  const { data: adminNotifications = [] } = useQuery({
    queryKey: ['admin-notifications'],
    queryFn: () => platform.inbox.list(),
  });
  const refreshInbox = () =>
    queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
  useEffect(
    () =>
      platform.inbox.subscribe(
        () =>
          void queryClient.invalidateQueries({
            queryKey: ['admin-notifications'],
          }),
      ),
    [platform, queryClient],
  );
  const { data: searchIndex } = useQuery({
    queryKey: ['search-index'],
    queryFn: () => ({
      apps: applicationService.list(),
      templates: notificationService.listTemplates(),
      rules: notificationService.listRules(),
      policies: reminderService.listPolicies(),
      users: userService.list(),
    }),
  });

  const unread = adminNotifications.filter(
    (notification) => !notification.read,
  ).length;

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEYS.accessibility,
      JSON.stringify(accessibility),
    );
    document.documentElement.classList.toggle(
      'dark',
      accessibility.theme === 'dark',
    );
    document.documentElement.classList.toggle(
      'high-contrast',
      accessibility.highContrast,
    );
    // Zoom: a CSS variable read by the base styles (html font-size).
    document.documentElement.style.setProperty(
      '--npst-zoom',
      String(accessibility.zoom),
    );
  }, [accessibility]);

  const updateAccessibility = (patch: Partial<typeof accessibility>) =>
    setAccessibility((current) => ({ ...current, ...patch }));

  // Breadcrumbs (cheap to compute on each render).
  const crumbs = (() => {
    const path = location.pathname;
    if (path.startsWith('/branding/configure/'))
      return ['Shared Services', 'UI Branding', 'Configure Branding'];
    // An application opened inside the portal: "Applications > <name>".
    const app = catalogue.find(
      (candidate) =>
        path === candidate.path || path.startsWith(`${candidate.path}/`),
    );
    if (app) return [APPLICATIONS_SECTION, app.name];
    for (const section of NAV_SECTIONS) {
      for (const item of section.items) {
        if (path === item.path) return [section.section, item.label];
        for (const child of item.children ?? []) {
          if (path === child.path || path.startsWith(`${child.path}/`))
            return [section.section, item.label, child.label];
        }
      }
    }
    return ['NPST Shared Services'];
  })();

  const results = useMemo<SearchResult[]>(() => {
    const q = query.trim().toLowerCase();
    if (!searchIndex || q.length < 2) return [];
    const match = (text: string) => text.toLowerCase().includes(q);
    const out: SearchResult[] = [];
    searchIndex.apps
      .filter((a) => match(a.name))
      .forEach((a) =>
        out.push({
          id: `app-${a.id}`,
          label: a.name,
          module: 'Application',
          path: '/applications',
          icon: Palette,
        }),
      );
    searchIndex.templates
      .filter((t) => match(t.name))
      .forEach((t) =>
        out.push({
          id: `tpl-${t.id}`,
          label: t.name,
          module: 'Template',
          path: '/notifications/templates',
          icon: FileText,
        }),
      );
    searchIndex.rules
      .filter((r) => match(r.name))
      .forEach((r) =>
        out.push({
          id: `rule-${r.id}`,
          label: r.name,
          module: 'Rule',
          path: '/notifications/rules',
          icon: Bell,
        }),
      );
    searchIndex.policies
      .filter((p) => match(p.name))
      .forEach((p) =>
        out.push({
          id: `pol-${p.id}`,
          label: p.name,
          module: 'Reminder',
          path: '/reminders/configuration',
          icon: Clock,
        }),
      );
    searchIndex.users
      .filter((u) => match(u.name) || match(u.email))
      .forEach((u) =>
        out.push({
          id: `usr-${u.id}`,
          label: u.name,
          module: 'User',
          path: '/users',
          icon: Users,
        }),
      );
    return out.slice(0, 10);
  }, [query, searchIndex]);

  const handleLogout = () => {
    logout();
    toast.success('Signed out of the portal');
    navigate('/login', { replace: true });
  };

  return (
    <header className={styles.header}>
      <div className={styles.div}>
        <Button
          variant="ghost"
          size="icon"
          className={styles.button}
          onClick={onMenuClick}
          data-testid="topbar-mobile-menu-button"
          aria-label="Open navigation"
        >
          <Menu className={`${styles.menu} npst-sized`} />
        </Button>
        <nav className={styles.nav} data-testid="breadcrumb-nav">
          {crumbs.map((crumb, i) => (
            <span key={crumb} className={styles.span}>
              {i > 0 && (
                <ChevronRight className={`${styles.chevronRight} npst-sized`} />
              )}
              <span
                className={cn(
                  styles.span2,
                  i === crumbs.length - 1 ? styles.span3 : styles.span4,
                )}
              >
                {crumb}
              </span>
            </span>
          ))}
        </nav>
      </div>

      <div className={styles.div2}>
        {/* Global search */}
        <Popover open={searchOpen} onOpenChange={setSearchOpen}>
          <PopoverTrigger
            render={
              <button
                type="button"
                data-testid="global-search-trigger"
                className={styles.button2}
              >
                <Search className={`${styles.search} npst-sized`} />
                <span className={styles.span5}>Search portal…</span>
              </button>
            }
          />
          <PopoverContent align="end" className={styles.popoverContent}>
            <div className={styles.div3}>
              <Input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search applications, templates, rules, users…"
                data-testid="global-search-input"
              />
            </div>
            <div className={styles.div4}>
              {query.trim().length < 2 ? (
                <p className={styles.p}>
                  Type at least 2 characters to search.
                </p>
              ) : results.length === 0 ? (
                <p className={styles.p}>No matches found.</p>
              ) : (
                results.map((result) => (
                  <button
                    key={result.id}
                    type="button"
                    onClick={() => {
                      navigate(result.path);
                      setSearchOpen(false);
                      setQuery('');
                    }}
                    className={styles.button3}
                    data-testid={`search-result-${result.id}`}
                  >
                    <result.icon
                      className={`${styles.resulticon} npst-sized`}
                    />
                    <span className={styles.span6}>
                      <span className={styles.span7}>{result.label}</span>
                      <span className={styles.span8}>{result.module}</span>
                    </span>
                    <ChevronRight
                      className={`${styles.chevronRight2} npst-sized`}
                    />
                  </button>
                ))
              )}
            </div>
          </PopoverContent>
        </Popover>

        <Button
          variant="ghost"
          size="sm"
          title="Ask AI"
          aria-label="Ask AI"
          onClick={() => setAskAiOpen(true)}
          data-testid="topbar-ask-ai-button"
        >
          <Sparkles className={`${styles.sparkles} npst-sized`} />
          <span className={styles.span9}>Ask AI</span>
        </Button>

        {/* Administrative notifications */}
        <Popover>
          <PopoverTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className={styles.button4}
                data-testid="topbar-notifications-button"
                aria-label="Notifications"
              >
                <Bell className={`${styles.sparkles} npst-sized`} />
                {unread > 0 && (
                  <span className={`${styles.span10} npst-sized`}>
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </Button>
            }
          />
          <PopoverContent align="end" className={styles.popoverContent}>
            <div className={styles.div5}>
              <p className={styles.p2}>Admin notifications</p>
              {unread > 0 && (
                <button
                  type="button"
                  className={styles.button5}
                  onClick={() =>
                    void platform.inbox.markAllRead().then(refreshInbox)
                  }
                >
                  Mark all read
                </button>
              )}
            </div>
            <div className={styles.div6}>
              {adminNotifications.length === 0 && (
                <p className={styles.p3}>No administrative notifications.</p>
              )}
              {adminNotifications.slice(0, 8).map((notification) => (
                <Link
                  key={notification.id}
                  to={notification.link ?? '/'}
                  onClick={() =>
                    void platform.inbox
                      .markRead(notification.id)
                      .then(refreshInbox)
                  }
                  className={cn(
                    styles.link,
                    !notification.read && styles.link2,
                  )}
                >
                  <p className={styles.p4}>{notification.title}</p>
                  <p className={styles.p5}>{notification.description}</p>
                  <p className={styles.p6}>{timeAgo(notification.createdAt)}</p>
                </Link>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Personal accessibility controls */}
        <Popover>
          <PopoverTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                aria-label="Accessibility options"
                data-testid="topbar-accessibility-button"
              >
                <Accessibility className={`${styles.sparkles} npst-sized`} />
              </Button>
            }
          />
          <PopoverContent align="end" className={styles.popoverContent2}>
            <p className={styles.p2}>Accessibility</p>
            <div className={styles.div7}>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  updateAccessibility({
                    zoom: Math.min(1.25, accessibility.zoom + 0.1),
                  })
                }
              >
                <ZoomIn className={`${styles.search} npst-sized`} /> Zoom in
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  updateAccessibility({
                    zoom: Math.max(0.8, accessibility.zoom - 0.1),
                  })
                }
              >
                <ZoomOut className={`${styles.search} npst-sized`} /> Zoom out
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateAccessibility({ zoom: 1 })}
              >
                <RotateCcw className={`${styles.search} npst-sized`} /> Reset
                zoom
              </Button>
              <Button
                variant={accessibility.highContrast ? 'secondary' : 'outline'}
                size="sm"
                onClick={() =>
                  updateAccessibility({
                    highContrast: !accessibility.highContrast,
                  })
                }
              >
                <Contrast className={`${styles.search} npst-sized`} /> Contrast
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateAccessibility({ theme: 'light' })}
              >
                <Sun className={`${styles.search} npst-sized`} /> Light
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateAccessibility({ theme: 'dark' })}
              >
                <Moon className={`${styles.search} npst-sized`} /> Dark
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Help */}
        <Popover>
          <PopoverTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                data-testid="topbar-help-button"
                aria-label="Help"
              />
            }
          >
            <HelpCircle className={`${styles.sparkles} npst-sized`} />
          </PopoverTrigger>
          <PopoverContent align="end" className={styles.popoverContent3}>
            <p className={styles.p2}>Help &amp; Support</p>
            <p className={styles.p7}>Resources for Super Admins.</p>
            <div className={styles.div8}>
              <button
                type="button"
                onClick={() =>
                  toast.info('Opening the NPST Shared Services documentation…')
                }
                className={styles.button6}
                data-testid="help-documentation-button"
              >
                <BookOpen className={`${styles.bookOpen} npst-sized`} />{' '}
                Documentation
              </button>
              <a
                href="mailto:support@npst.com"
                className={styles.button6}
                data-testid="help-support-link"
              >
                <LifeBuoy className={`${styles.bookOpen} npst-sized`} /> Contact
                support
              </a>
              <div className={styles.div9}>
                <span className={styles.span11}>
                  <Search className={`${styles.bookOpen} npst-sized`} /> Global
                  search
                </span>
                <kbd className={styles.kbd}>⌘K</kbd>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Profile menu */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                data-testid="topbar-profile-button"
                className={styles.button7}
              >
                <span className={`${styles.span12} npst-sized`}>
                  {initialsOf(user?.name ?? 'SA')}
                </span>
                <span className={styles.span13}>
                  <span className={styles.span14}>
                    {user?.name ?? 'Super Admin'}
                  </span>
                  <span className={styles.span15}>
                    {user?.role ?? 'Super Admin'}
                  </span>
                </span>
                <ChevronRight
                  className={`${styles.chevronRight3} npst-sized`}
                />
              </button>
            }
          />
          <DropdownMenuContent
            align="end"
            className={styles.dropdownMenuContent}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                <span className={styles.span16}>{user?.name}</span>
                <span className={styles.span17}>{user?.email}</span>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              render={
                <Link to="/settings" data-testid="profile-settings-item" />
              }
            >
              <Settings className={`${styles.search} npst-sized`} /> Portal
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={handleLogout}
              data-testid="logout-button"
            >
              <LogOut className={`${styles.search} npst-sized`} /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Dialog open={askAiOpen} onOpenChange={setAskAiOpen}>
        <DialogContent className={styles.dialogContent}>
          <DialogHeader>
            <div className={styles.div10}>
              <div>
                <DialogTitle>Ask AI</DialogTitle>
                <DialogDescription className={styles.dialogDescription}>
                  Hello, {user?.name ?? 'there'}! How can I help you today?
                </DialogDescription>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Close Ask AI"
                onClick={() => setAskAiOpen(false)}
              >
                <X className={`${styles.search} npst-sized`} />
              </Button>
            </div>
          </DialogHeader>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (!aiQuestion.trim()) return;
              setAiMessage(
                'AI integration is not configured yet. Please integrate an AI model to enable intelligent responses.',
              );
            }}
            className={styles.form}
          >
            <Input
              value={aiQuestion}
              onChange={(event) => setAiQuestion(event.target.value)}
              placeholder="Ask me anything about NPST Shared Services..."
              data-testid="ask-ai-input"
            />
            {aiMessage && (
              <p className={styles.p8} role="status">
                {aiMessage}
              </p>
            )}
            <DialogFooter>
              <Button
                type="submit"
                disabled={!aiQuestion.trim()}
                data-testid="ask-ai-submit"
              >
                <ArrowUp className={`${styles.search} npst-sized`} /> Send
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </header>
  );
}

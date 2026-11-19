import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
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
} from 'lucide-react';
import { applicationService, userService } from '@/services/adminService';
import { notificationService } from '@/services/notificationService';
import { adminNotificationService } from '@/services/adminNotificationService';
import { reminderService } from '@/services/reminderService';
import { STORAGE_KEYS } from '@/services/storage';
import { useAuth } from '@/context/AuthContext';
import { NAV_SECTIONS } from '@/components/layout/Sidebar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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
    try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.accessibility) ?? '{"zoom":1,"highContrast":false,"theme":"light"}') as { zoom: number; highContrast: boolean; theme: 'light' | 'dark' }; } catch { return { zoom: 1, highContrast: false, theme: 'light' as const }; }
  });

  const queryClient = useQueryClient();
  const { data: adminNotifications = [] } = useQuery({ queryKey: ['admin-notifications'], queryFn: () => adminNotificationService.list() });
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

  const unread = adminNotifications.filter((notification) => !notification.read).length;

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.accessibility, JSON.stringify(accessibility));
    document.documentElement.classList.toggle('dark', accessibility.theme === 'dark');
    document.documentElement.classList.toggle('high-contrast', accessibility.highContrast);
    document.documentElement.style.fontSize = `${accessibility.zoom}em`;
  }, [accessibility]);

  const updateAccessibility = (patch: Partial<typeof accessibility>) => setAccessibility((current) => ({ ...current, ...patch }));

  const crumbs = useMemo(() => {
    const path = location.pathname;
    if (path.startsWith('/branding/configure/')) return ['Shared Services', 'UI Branding', 'Configure Branding'];
    for (const section of NAV_SECTIONS) {
      for (const item of section.items) {
        if (path === item.path) return [section.section, item.label];
        for (const child of item.children ?? []) {
          if (path === child.path || path.startsWith(`${child.path}/`)) return [section.section, item.label, child.label];
        }
      }
    }
    return ['NPST Shared Services'];
  }, [location.pathname]);

  const results = useMemo<SearchResult[]>(() => {
    const q = query.trim().toLowerCase();
    if (!searchIndex || q.length < 2) return [];
    const match = (text: string) => text.toLowerCase().includes(q);
    const out: SearchResult[] = [];
    searchIndex.apps.filter((a) => match(a.name)).forEach((a) => out.push({ id: `app-${a.id}`, label: a.name, module: 'Application', path: '/applications', icon: Palette }));
    searchIndex.templates.filter((t) => match(t.name)).forEach((t) => out.push({ id: `tpl-${t.id}`, label: t.name, module: 'Template', path: '/notifications/templates', icon: FileText }));
    searchIndex.rules.filter((r) => match(r.name)).forEach((r) => out.push({ id: `rule-${r.id}`, label: r.name, module: 'Rule', path: '/notifications/rules', icon: Bell }));
    searchIndex.policies.filter((p) => match(p.name)).forEach((p) => out.push({ id: `pol-${p.id}`, label: p.name, module: 'Reminder', path: '/reminders/configuration', icon: Clock }));
    searchIndex.users.filter((u) => match(u.name) || match(u.email)).forEach((u) => out.push({ id: `usr-${u.id}`, label: u.name, module: 'User', path: '/users', icon: Users }));
    return out.slice(0, 10);
  }, [query, searchIndex]);

  const handleLogout = () => {
    logout();
    toast.success('Signed out of the portal');
    navigate('/login', { replace: true });
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-background/95 px-4 text-foreground backdrop-blur sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMenuClick}
          data-testid="topbar-mobile-menu-button"
          aria-label="Open navigation"
        >
          <Menu className="size-5" />
        </Button>
        <nav className="flex min-w-0 items-center gap-1.5 text-sm" data-testid="breadcrumb-nav">
          {crumbs.map((crumb, i) => (
            <span key={crumb} className="flex min-w-0 items-center gap-1.5">
              {i > 0 && <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/60" />}
              <span
                className={cn(
                  'truncate',
                  i === crumbs.length - 1 ? 'font-semibold text-foreground' : 'text-muted-foreground',
                )}
              >
                {crumb}
              </span>
            </span>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Global search */}
        <Popover open={searchOpen} onOpenChange={setSearchOpen}>
          <PopoverTrigger
            render={
              <button
                type="button"
                data-testid="global-search-trigger"
                className="hidden h-9 w-56 items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted md:flex lg:w-72"
              >
                <Search className="size-4" />
                <span className="flex-1 text-left">Search portal…</span>
              </button>
            }
          />
          <PopoverContent align="end" className="w-[22rem] p-0">
            <div className="border-b border-border p-3">
              <Input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search applications, templates, rules, users…"
                data-testid="global-search-input"
              />
            </div>
            <div className="max-h-80 overflow-y-auto p-2">
              {query.trim().length < 2 ? (
                <p className="px-2 py-6 text-center text-xs text-muted-foreground">Type at least 2 characters to search.</p>
              ) : results.length === 0 ? (
                <p className="px-2 py-6 text-center text-xs text-muted-foreground">No matches found.</p>
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
                    className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-muted"
                    data-testid={`search-result-${result.id}`}
                  >
                    <result.icon className="size-4 shrink-0 text-blue-600" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">{result.label}</span>
                      <span className="block text-xs text-muted-foreground">{result.module}</span>
                    </span>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground/60" />
                  </button>
                ))
              )}
            </div>
          </PopoverContent>
        </Popover>

        <Button variant="ghost" size="sm" title="Ask AI" aria-label="Ask AI" onClick={() => setAskAiOpen(true)} data-testid="topbar-ask-ai-button">
          <Sparkles className="size-[18px]" />
          <span className="hidden lg:inline">Ask AI</span>
        </Button>

        {/* Administrative notifications */}
        <Popover>
          <PopoverTrigger
            render={
              <Button variant="ghost" size="icon" className="relative" data-testid="topbar-notifications-button" aria-label="Notifications">
                <Bell className="size-[18px]" />
                {unread > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </Button>
            }
          />
          <PopoverContent align="end" className="w-[22rem] p-0">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="font-heading text-sm font-semibold">Admin notifications</p>
              {unread > 0 && <button type="button" className="text-xs font-medium text-blue-600 hover:underline" onClick={() => { adminNotificationService.markAllRead(); queryClient.invalidateQueries({ queryKey: ['admin-notifications'] }); }}>Mark all read</button>}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {adminNotifications.length === 0 && <p className="px-4 py-6 text-center text-xs text-muted-foreground">No administrative notifications.</p>}
              {adminNotifications.slice(0, 8).map((notification) => (
                <Link key={notification.id} to={notification.path ?? '/'} onClick={() => { adminNotificationService.markRead(notification.id); queryClient.invalidateQueries({ queryKey: ['admin-notifications'] }); }} className={cn('block border-b border-border/60 px-4 py-3 text-foreground last:border-0 hover:bg-muted', !notification.read && 'bg-accent')}>
                  <p className="text-sm font-medium text-foreground">{notification.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{notification.description}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">{timeAgo(notification.timestamp)}</p>
                </Link>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Personal accessibility controls */}
        <Popover>
          <PopoverTrigger render={<Button variant="ghost" size="icon" aria-label="Accessibility options" data-testid="topbar-accessibility-button"><Accessibility className="size-[18px]" /></Button>} />
          <PopoverContent align="end" className="w-56">
            <p className="font-heading text-sm font-semibold">Accessibility</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" onClick={() => updateAccessibility({ zoom: Math.min(1.25, accessibility.zoom + 0.1) })}><ZoomIn className="size-4" /> Zoom in</Button>
              <Button variant="outline" size="sm" onClick={() => updateAccessibility({ zoom: Math.max(0.8, accessibility.zoom - 0.1) })}><ZoomOut className="size-4" /> Zoom out</Button>
              <Button variant="outline" size="sm" onClick={() => updateAccessibility({ zoom: 1 })}><RotateCcw className="size-4" /> Reset zoom</Button>
              <Button variant={accessibility.highContrast ? 'secondary' : 'outline'} size="sm" onClick={() => updateAccessibility({ highContrast: !accessibility.highContrast })}><Contrast className="size-4" /> Contrast</Button>
              <Button variant="outline" size="sm" onClick={() => updateAccessibility({ theme: 'light' })}><Sun className="size-4" /> Light</Button>
              <Button variant="outline" size="sm" onClick={() => updateAccessibility({ theme: 'dark' })}><Moon className="size-4" /> Dark</Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Help */}
        <Popover>
          <PopoverTrigger render={<Button variant="ghost" size="icon" data-testid="topbar-help-button" aria-label="Help" />}>
            <HelpCircle className="size-[18px]" />
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72">
            <p className="font-heading text-sm font-semibold">Help &amp; Support</p>
            <p className="mt-1 text-xs text-muted-foreground">Resources for Super Admins.</p>
            <div className="mt-3 space-y-1.5">
              <button
                type="button"
                onClick={() => toast.info('Opening the NPST Shared Services documentation…')}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-muted"
                data-testid="help-documentation-button"
              >
                <BookOpen className="size-4 text-blue-600" /> Documentation
              </button>
              <a
                href="mailto:support@npst.com"
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-muted"
                data-testid="help-support-link"
              >
                <LifeBuoy className="size-4 text-blue-600" /> Contact support
              </a>
              <div className="flex items-center justify-between rounded-lg px-2.5 py-2 text-sm">
                <span className="flex items-center gap-2.5 text-muted-foreground">
                  <Search className="size-4 text-blue-600" /> Global search
                </span>
                <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-semibold">⌘K</kbd>
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
                className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 transition-colors hover:bg-muted"
              >
                <span className="grid size-8 place-items-center rounded-full bg-blue-600 text-xs font-bold text-white">
                  {initialsOf(user?.name ?? 'SA')}
                </span>
                <span className="hidden text-left leading-tight lg:block">
                  <span className="block text-xs font-semibold text-foreground">{user?.name ?? 'Super Admin'}</span>
                  <span className="block text-[10px] text-muted-foreground">{user?.role ?? 'Super Admin'}</span>
                </span>
                <ChevronRight className="hidden size-3.5 rotate-90 text-muted-foreground lg:block" />
              </button>
            }
          />
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                <span className="block text-sm font-semibold">{user?.name}</span>
                <span className="block text-xs font-normal text-muted-foreground">{user?.email}</span>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link to="/settings" data-testid="profile-settings-item" />}>
              <Settings className="size-4" /> Portal Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={handleLogout} data-testid="logout-button">
              <LogOut className="size-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Dialog open={askAiOpen} onOpenChange={setAskAiOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <DialogTitle>Ask AI</DialogTitle>
                <DialogDescription className="mt-1">Hello, {user?.name ?? 'there'}! How can I help you today?</DialogDescription>
              </div>
              <Button variant="ghost" size="icon-sm" aria-label="Close Ask AI" onClick={() => setAskAiOpen(false)}><X className="size-4" /></Button>
            </div>
          </DialogHeader>
          <form onSubmit={(event) => {
            event.preventDefault();
            if (!aiQuestion.trim()) return;
            setAiMessage('AI integration is not configured yet. Please integrate an AI model to enable intelligent responses.');
          }} className="space-y-3">
            <Input value={aiQuestion} onChange={(event) => setAiQuestion(event.target.value)} placeholder="Ask me anything about NPST Shared Services..." data-testid="ask-ai-input" />
            {aiMessage && <p className="rounded-lg border border-border bg-muted p-3 text-sm text-muted-foreground" role="status">{aiMessage}</p>}
            <DialogFooter>
              <Button type="submit" disabled={!aiQuestion.trim()} data-testid="ask-ai-submit"><ArrowUp className="size-4" /> Send</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </header>
  );
}

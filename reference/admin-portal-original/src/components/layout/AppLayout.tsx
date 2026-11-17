import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { readFlag, writeFlag, STORAGE_KEYS } from '@/services/storage';
import { cn } from '@/lib/utils';

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(() => readFlag(STORAGE_KEYS.sidebarCollapsed));
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const toggleCollapsed = () =>
    setCollapsed((current) => {
      const next = !current;
      writeFlag(STORAGE_KEYS.sidebarCollapsed, next);
      return next;
    });

  return (
    <div className="min-h-svh bg-background">
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-40 hidden md:block transition-all duration-300',
          collapsed ? 'w-[76px]' : 'w-64',
        )}
      >
        <Sidebar collapsed={collapsed} onToggle={toggleCollapsed} />
      </div>

      <div className={cn('flex min-h-svh flex-col transition-all duration-300', collapsed ? 'md:pl-[76px]' : 'md:pl-64')}>
        <Topbar onMenuClick={() => setMobileOpen(true)} />
        <main className="mx-auto w-full max-w-[1440px] flex-1 p-4 sm:p-6 lg:p-8">
          <div key={location.pathname} className="animate-in fade-in duration-200">
            <Outlet />
          </div>
        </main>
        <footer className="border-t border-border px-6 py-4 text-xs text-muted-foreground">
          © {new Date().getFullYear()} NPST Technologies · Shared Services Admin Portal
        </footer>
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 bg-sidebar p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <Sidebar onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}

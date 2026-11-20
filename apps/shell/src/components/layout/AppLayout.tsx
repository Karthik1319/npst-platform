import { useState } from 'react';
import { Outlet, useLocation } from 'react-router';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { readFlag, writeFlag, STORAGE_KEYS } from '@/services/storage';
import { cn } from '@/lib/utils';
import styles from './AppLayout.module.css';

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(() =>
    readFlag(STORAGE_KEYS.sidebarCollapsed),
  );
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const toggleCollapsed = () =>
    setCollapsed((current) => {
      const next = !current;
      writeFlag(STORAGE_KEYS.sidebarCollapsed, next);
      return next;
    });

  return (
    <div className={styles.div}>
      <div className={cn(styles.div2, collapsed ? styles.div3 : styles.div4)}>
        <Sidebar collapsed={collapsed} onToggle={toggleCollapsed} />
      </div>

      <div className={cn(styles.div5, collapsed ? styles.div6 : styles.div7)}>
        <Topbar onMenuClick={() => setMobileOpen(true)} />
        <main className={styles.main}>
          <div key={location.pathname} className={styles.div8}>
            <Outlet />
          </div>
        </main>
        <footer className={styles.footer}>
          © {new Date().getFullYear()} NPST Technologies · Shared Services
        </footer>
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className={styles.sheetContent}>
          <SheetTitle className={styles.sheetTitle}>Navigation</SheetTitle>
          <Sidebar onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}

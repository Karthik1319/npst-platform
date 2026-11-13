import type { PortalApp } from '@npst/shared-contracts';
import { Outlet } from 'react-router';
import { ToastHost } from '@/components/ToastHost';
import { Header } from '@/layout/Header';
import { LeftNav } from '@/layout/LeftNav';
import styles from './Layout.module.css';

interface LayoutProps {
  apps: readonly PortalApp[];
}

/** Portal frame: header on top, nav on the left, routed page in the middle. */
export function Layout({ apps }: LayoutProps) {
  return (
    <div className={styles.layout}>
      <Header />
      <LeftNav apps={apps} />
      <main className={styles.content}>
        <Outlet />
      </main>
      <ToastHost />
    </div>
  );
}

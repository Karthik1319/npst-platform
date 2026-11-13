import { Outlet } from 'react-router';
import { Header } from '@/layout/Header';
import { LeftNav } from '@/layout/LeftNav';
import styles from './Layout.module.css';

/** Portal frame: header on top, nav on the left, routed page in the middle. */
export function Layout() {
  return (
    <div className={styles.layout}>
      <Header />
      <LeftNav />
      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  );
}

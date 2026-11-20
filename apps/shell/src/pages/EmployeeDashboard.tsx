import { Bell, CircleHelp, UserRound } from '@/components/icons';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import styles from './EmployeeDashboard.module.css';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  return (
    <div className={styles.div}>
      <PageHeader
        title={`Welcome, ${user?.name ?? 'Employee'}`}
        description="Your NPST Shared Services workspace."
        testId="employee-dashboard-title"
      />
      <div className={styles.div2}>
        <Card>
          <CardContent className={styles.cardContent}>
            <UserRound className={`${styles.userRound} npst-sized`} />
            <p className={styles.p}>My Profile</p>
            <p className={styles.p2}>{user?.email}</p>
            <Button variant="outline" size="sm">
              View profile
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardContent className={styles.cardContent}>
            <Bell className={`${styles.userRound} npst-sized`} />
            <p className={styles.p}>My Notifications</p>
            <p className={styles.p2}>View your latest service updates.</p>
            <Button variant="outline" size="sm">
              View notifications
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardContent className={styles.cardContent}>
            <CircleHelp className={`${styles.userRound} npst-sized`} />
            <p className={styles.p}>Help &amp; Support</p>
            <p className={styles.p2}>Contact the NPST support team.</p>
            <Button variant="outline" size="sm">
              Get help
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

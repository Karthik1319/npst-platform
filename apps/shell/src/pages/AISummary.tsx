import { Sparkles } from '@/components/icons';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/common/PageHeader';
import styles from './AISummary.module.css';

export default function AISummary() {
  return (
    <div className={styles.div}>
      <PageHeader
        title="AI Summary"
        description="A future workspace for intelligent portal summaries."
        testId="ai-summary-title"
      />
      <Card className={styles.card}>
        <CardContent className={styles.cardContent}>
          <div className={`${styles.div2} npst-sized`}>
            <Sparkles className={`${styles.sparkles} npst-sized`} />
          </div>
          <div>
            <h2 className={styles.h2}>AI Summary</h2>
            <p className={styles.p}>In progress...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

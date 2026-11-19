import { Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/common/PageHeader';

export default function AISummary() {
  return (
    <div className="space-y-6">
      <PageHeader title="AI Summary" description="A future workspace for intelligent portal summaries." testId="ai-summary-title" />
      <Card className="shadow-sm">
        <CardContent className="flex min-h-72 flex-col items-center justify-center gap-4 text-center">
          <div className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Sparkles className="size-7" />
          </div>
          <div>
            <h2 className="font-heading text-lg font-semibold text-foreground">AI Summary</h2>
            <p className="mt-1 text-sm text-muted-foreground">In progress...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

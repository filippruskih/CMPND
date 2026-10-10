import { FlaskConical } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { InsightsTabs } from "@/components/insights/insights-tabs";
import { ExperimentCard } from "@/components/experiments/experiment-card";
import { getAllExperiments } from "@/lib/growth-experiments";

export const dynamic = "force-dynamic";

export default async function ExperimentsPage() {
  const experiments = await getAllExperiments();
  const hasAnyData = experiments.some((e) => e.sampleSize > 0);

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        icon={FlaskConical}
        color="magenta"
        title="Growth experiments"
        description="Preset breakdowns across your entire history, not just new content - no creator-declared hypotheses to set up, and no minimum sample size, so low-confidence groups are still shown with their real count rather than hidden."
      />

      <InsightsTabs active="experiments" />

      {!hasAnyData ? (
        <EmptyState
          icon={FlaskConical}
          color="magenta"
          title="Not enough data yet"
          description="Sync some reels or posts first - these breakdowns need posted content with engagement data."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {experiments.map((experiment) => (
            <ExperimentCard key={experiment.title} experiment={experiment} />
          ))}
        </div>
      )}
    </div>
  );
}

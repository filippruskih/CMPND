import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricLineChart } from "@/components/metric-line-chart";
import { FeedbackPanel } from "@/components/reels/feedback-panel";
import { ReelPerformanceCard } from "@/components/reels/reel-performance-card";
import { RetentionHypothesisCard } from "@/components/reels/retention-hypothesis-card";
import { SeriesAssign } from "@/components/reels/series-assign";
import { BackLink } from "@/components/back-link";
import { getReelDetail } from "@/lib/stats";
import { getFeedbackLoop } from "@/lib/feedback";
import { getAllSeries } from "@/lib/series";
import { formatLabel } from "@/lib/content/classify";
import { formatCompactNumber, formatDate, formatPercent, formatSecondsFromMs } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ReelDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const reel = await getReelDetail(id);
  if (!reel) notFound();

  const insight = reel.latestInsight;
  const viewsHistory = reel.insights
    .filter((s) => s.views != null)
    .map((s) => ({ date: s.capturedAt.toISOString(), value: s.views! }))
    .reverse();
  const topics: string[] = reel.topicTags ? JSON.parse(reel.topicTags) : [];
  const feedback = await getFeedbackLoop(id);
  const allSeries = await getAllSeries();

  return (
    <div className="flex flex-1 flex-col gap-4">
      <BackLink href="/reels" label="Reels" />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        {reel.thumbnailUrl && (
          <div className="relative h-48 w-32 shrink-0 overflow-hidden rounded-md bg-muted">
            <Image src={reel.thumbnailUrl} alt="" fill sizes="128px" className="object-cover" />
          </div>
        )}
        <div className="flex flex-1 flex-col gap-2">
          <p className="text-sm text-muted-foreground">{formatDate(reel.postedAt)}</p>
          <p className="max-w-2xl text-base">{reel.caption ?? "No caption"}</p>
          {(reel.format || topics.length > 0) && (
            <div className="flex flex-wrap gap-2">
              {reel.format && <Badge variant="secondary">{formatLabel(reel.format)}</Badge>}
              {topics.map((topic) => (
                <Badge key={topic} variant="outline">
                  {topic}
                </Badge>
              ))}
            </div>
          )}
          <Button variant="outline" size="sm" asChild className="w-fit">
            <Link href={reel.permalink} target="_blank" rel="noreferrer">
              View on Instagram <ExternalLink />
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Series:</span>
            <SeriesAssign
              reelId={reel.id}
              currentSeriesId={reel.seriesId}
              seriesOptions={allSeries.map((s) => ({ id: s.id, name: s.name }))}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Metric label="Plays" value={insight?.views} />
        <Metric label="Reach" value={insight?.reach} />
        <Metric label="Likes" value={insight?.likes} />
        <Metric label="Comments" value={insight?.comments} />
        <Metric label="Shares" value={insight?.shares} />
        <Metric label="Saves" value={insight?.saved} />
        <Metric
          label="Engagement"
          value={insight?.engagementRate}
          format={(v) => formatPercent(v)}
        />
        <Metric
          label="Avg watch time"
          value={insight?.avgWatchTimeMs}
          format={(v) => formatSecondsFromMs(v)}
        />
        <Metric
          label="Reel length"
          value={reel.durationMs}
          format={(v) => formatSecondsFromMs(v)}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Avg watch time is Instagram&apos;s closest available proxy for audience retention - the
        API doesn&apos;t expose a full second-by-second retention curve, only this and the
        in-app Insights screen do.
        {insight?.avgWatchTimeMs != null && reel.durationMs != null && reel.durationMs > 0
          ? ` Against this reel's ${formatSecondsFromMs(reel.durationMs)} length, that's roughly ${formatPercent(
              Math.min(1, insight.avgWatchTimeMs / reel.durationMs)
            )} watched on average.`
          : ""}
      </p>

      {viewsHistory.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Plays over time</CardTitle>
          </CardHeader>
          <CardContent>
            <MetricLineChart data={viewsHistory} dataKey="views" label="Plays" height={200} />
          </CardContent>
        </Card>
      )}

      <ReelPerformanceCard
        reelId={reel.id}
        initialAnalysis={reel.performanceAnalysis}
        initialAnalyzedAt={reel.performanceAnalysisAt?.toISOString() ?? null}
      />

      <RetentionHypothesisCard
        reelId={reel.id}
        initialAnalysis={reel.retentionHypothesis}
        initialAnalyzedAt={reel.retentionHypothesisAt?.toISOString() ?? null}
        canRun={reel.durationMs != null && insight?.avgWatchTimeMs != null}
      />

      {feedback && <FeedbackPanel feedback={feedback} />}
    </div>
  );
}

function Metric({
  label,
  value,
  format = (v: number) => formatCompactNumber(v),
}: {
  label: string;
  value: number | null | undefined;
  format?: (value: number) => string;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-xl font-semibold">{value != null ? format(value) : "-"}</p>
      </CardContent>
    </Card>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCompactNumber, formatPercent, formatSecondsFromMs, formatSignedPercent } from "@/lib/format";
import type { FeedbackLoopResult } from "@/lib/feedback";

function DeltaCell({ value, baseline }: { value: number | null; baseline: number | null }) {
  if (value == null || baseline == null || baseline === 0) {
    return <span className="text-muted-foreground">-</span>;
  }
  const delta = (value - baseline) / baseline;
  return (
    <span className={delta >= 0 ? "text-delta-good" : "text-destructive"}>
      {formatSignedPercent(delta)}
    </span>
  );
}

export function FeedbackPanel({ feedback }: { feedback: FeedbackLoopResult }) {
  const insight = feedback.reel.latestInsight;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Feedback loop</CardTitle>
        <p className="text-sm text-muted-foreground">
          How this reel compares to your history and (once tracked) competitor content.
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Baseline</TableHead>
                <TableHead className="text-right">Sample</TableHead>
                <TableHead className="text-right">Plays vs baseline</TableHead>
                <TableHead className="text-right">Engagement vs baseline</TableHead>
                <TableHead className="text-right">Baseline avg watch</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {feedback.baselines.map((baseline) => (
                <TableRow key={baseline.key}>
                  <TableCell className="whitespace-normal">{baseline.label}</TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {baseline.available ? baseline.sampleSize : "-"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {!baseline.available ? (
                      <span className="text-muted-foreground">Coming soon</span>
                    ) : baseline.sampleSize === 0 ? (
                      <span className="text-muted-foreground">Not enough data</span>
                    ) : (
                      <DeltaCell value={insight?.views ?? null} baseline={baseline.avgViews} />
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {!baseline.available || baseline.sampleSize === 0 ? (
                      <span className="text-muted-foreground">-</span>
                    ) : (
                      <DeltaCell
                        value={insight?.engagementRate ?? null}
                        baseline={baseline.avgEngagementRate}
                      />
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {baseline.avgWatchTimeMs != null
                      ? formatSecondsFromMs(baseline.avgWatchTimeMs)
                      : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          This reel: {insight?.views != null ? formatCompactNumber(insight.views) : "-"} plays,{" "}
          {insight?.engagementRate != null ? formatPercent(insight.engagementRate) : "-"}{" "}
          engagement
          {feedback.reel.durationMs != null && (
            <>
              , {formatSecondsFromMs(feedback.reel.durationMs)} long
              {insight?.avgWatchTimeMs != null &&
                ` (avg watch ${formatSecondsFromMs(insight.avgWatchTimeMs)})`}
            </>
          )}
          .
        </p>
      </CardContent>
    </Card>
  );
}

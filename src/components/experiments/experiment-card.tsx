import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ExperimentResult } from "@/lib/growth-experiments";
import { formatPercent } from "@/lib/format";

export function ExperimentCard({ experiment }: { experiment: ExperimentResult }) {
  const ranked = [...experiment.groups]
    .filter((g) => g.count > 0)
    .sort((a, b) => (b.avgEngagementRate ?? 0) - (a.avgEngagementRate ?? 0));
  const maxRate = Math.max(...ranked.map((g) => g.avgEngagementRate ?? 0), 0.0001);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{experiment.title}</CardTitle>
        <p className="text-sm text-muted-foreground">{experiment.description}</p>
      </CardHeader>
      <CardContent className="flex flex-col gap-3.5">
        {ranked.length === 0 ? (
          <p className="text-sm text-muted-foreground">No data yet.</p>
        ) : (
          ranked.map((group) => {
            const rate = group.avgEngagementRate ?? 0;
            const widthPct = Math.max(4, (rate / maxRate) * 100);
            // Sorted best-first upstream - just the top format keeps this
            // readable at a glance instead of a row of badges per group.
            const topFormat = group.byFormat[0];

            return (
              <div key={group.key} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="font-medium">{group.label}</span>
                  <span className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {group.count} item{group.count === 1 ? "" : "s"}
                    </span>
                    <span className="w-14 text-right font-semibold tabular-nums">
                      {group.avgEngagementRate != null ? formatPercent(group.avgEngagementRate) : "-"}
                    </span>
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
                {topFormat && (
                  <p className="text-xs text-muted-foreground">
                    Best format:{" "}
                    <Badge variant="secondary" className="font-normal">
                      {topFormat.label}
                    </Badge>{" "}
                    {topFormat.avgEngagementRate != null ? formatPercent(topFormat.avgEngagementRate) : "-"} ·{" "}
                    {topFormat.count} item{topFormat.count === 1 ? "" : "s"}
                  </p>
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ExperimentResult } from "@/lib/growth-experiments";
import { formatPercent } from "@/lib/format";

const BAR_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

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
      <CardContent className="flex flex-col gap-4">
        {ranked.length === 0 ? (
          <p className="text-sm text-muted-foreground">No data yet.</p>
        ) : (
          ranked.map((group, i) => {
            const rate = group.avgEngagementRate ?? 0;
            const widthPct = Math.max(4, (rate / maxRate) * 100);
            const color = BAR_COLORS[i % BAR_COLORS.length];

            return (
              <div key={group.key} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{group.label}</span>
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Badge variant="outline" className="font-normal">
                      {group.count} item{group.count === 1 ? "" : "s"}
                    </Badge>
                    <span className="w-14 text-right font-semibold text-foreground tabular-nums">
                      {group.avgEngagementRate != null ? formatPercent(group.avgEngagementRate) : "-"}
                    </span>
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${widthPct}%`, background: color }}
                  />
                </div>
                {group.byFormat.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {group.byFormat.map((f) => (
                      <Badge key={f.format} variant="secondary" className="font-normal">
                        {f.label}: {f.avgEngagementRate != null ? formatPercent(f.avgEngagementRate) : "-"} ({f.count})
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

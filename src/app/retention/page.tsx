import Link from "next/link";
import { Activity, Ruler, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconBadge } from "@/components/icon-badge";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { MetricLineChart } from "@/components/metric-line-chart";
import { BackLink } from "@/components/back-link";
import { MoreToolsMenu } from "@/components/insights/more-tools-menu";
import { getRetentionOverview, type RetentionLeaderboardItem } from "@/lib/retention";
import { formatCompactNumber, formatPercent } from "@/lib/format";
import { formatLabel } from "@/lib/content/classify";

export const dynamic = "force-dynamic";

function LeaderboardRow({ item }: { item: RetentionLeaderboardItem }) {
  return (
    <Link
      href={`/reels/${item.id}`}
      className="flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-sm transition-colors hover:bg-muted/60"
    >
      <span className="line-clamp-1 flex-1">{item.caption ?? "No caption"}</span>
      <span className="shrink-0 text-xs text-muted-foreground">
        {item.views != null ? `${formatCompactNumber(item.views)} plays` : ""}
      </span>
      <span className="w-14 shrink-0 text-right font-medium tabular-nums">
        {formatPercent(item.retentionRate)}
      </span>
    </Link>
  );
}

export default async function RetentionPage() {
  const overview = await getRetentionOverview();

  return (
    <div className="flex flex-1 flex-col gap-4">
      <BackLink href="/insights" label="Insights" />
      <PageHeader
        icon={Activity}
        color="aqua"
        title="Retention"
        description="Instagram doesn't expose a per-second retention curve via the API - only average watch time per reel. Everything here is built from that one real number, across your whole account."
        action={<MoreToolsMenu />}
      />

      {!overview ? (
        <EmptyState
          icon={Activity}
          color="aqua"
          title="Not enough data yet"
          description="Needs at least 5 reels with both a synced length and an average watch time."
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardContent className="flex flex-col gap-1">
                <p className="text-sm text-muted-foreground">Average retention</p>
                <p className="text-3xl font-semibold tracking-tight">{formatPercent(overview.overallAvgRetention)}</p>
                <p className="text-xs text-muted-foreground">
                  Across {overview.sampleSize} reels with both length and watch-time data
                </p>
              </CardContent>
            </Card>
            {overview.reachCorrelation && (
              <Card>
                <CardContent className="flex flex-col gap-1">
                  <p className="text-sm text-muted-foreground">Retention vs. reach</p>
                  {overview.reachCorrelation.highRetentionAvgReach != null &&
                  overview.reachCorrelation.lowRetentionAvgReach != null &&
                  overview.reachCorrelation.lowRetentionAvgReach > 0 ? (
                    <>
                      <p className="text-3xl font-semibold tracking-tight">
                        {(
                          overview.reachCorrelation.highRetentionAvgReach /
                          overview.reachCorrelation.lowRetentionAvgReach
                        ).toFixed(1)}
                        x
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Your top-half-retention reels average this much more reach than your
                        bottom half
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">Not enough reach data yet.</p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <IconBadge icon={TrendingUp} color="orange" size="sm" />
                Retention over time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MetricLineChart data={overview.trend} dataKey="retention" label="Retention" height={220} percent />
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Best retained</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-1">
                {overview.top.map((item) => (
                  <LeaderboardRow key={item.id} item={item} />
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Worst retained</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-1">
                {overview.bottom.map((item) => (
                  <LeaderboardRow key={item.id} item={item} />
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <IconBadge icon={Activity} color="yellow" size="sm" />
                  Retention by format
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {overview.byFormat.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No classified reels yet.</p>
                ) : (
                  overview.byFormat.map((f) => (
                    <div key={f.key} className="flex items-center justify-between text-sm">
                      <span>{formatLabel(f.key)}</span>
                      <span className="text-muted-foreground">
                        {formatPercent(f.avgRetention)} · {f.count} reel{f.count === 1 ? "" : "s"}
                      </span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <IconBadge icon={Ruler} color="magenta" size="sm" />
                  Retention by length
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {overview.byLength.map((l) => (
                  <div key={l.key} className="flex items-center justify-between text-sm">
                    <span>{l.label}</span>
                    <span className="text-muted-foreground">
                      {formatPercent(l.avgRetention)} · {l.count} reel{l.count === 1 ? "" : "s"}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

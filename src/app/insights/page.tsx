import { CalendarClock, Dna, Film, Image as ImageIcon, Scale, TrendingUp, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconBadge } from "@/components/icon-badge";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { MetricLineChart } from "@/components/metric-line-chart";
import { ExportButton } from "@/components/export-button";
import { BestPracticesCard } from "@/components/insights/best-practices-card";
import { MoreToolsMenu } from "@/components/insights/more-tools-menu";
import {
  getBestDayToPost,
  getContentMixComparison,
  getEngagementTrend,
  getPostingConsistency,
} from "@/lib/insights";
import { getLatestContentDna } from "@/lib/content-dna";
import { formatLabel } from "@/lib/content/classify";
import { formatCompactNumber, formatDate, formatPercent } from "@/lib/format";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function InsightsPage() {
  const [consistency, bestDays, trend, mix, dnaProfile, bestPractices] = await Promise.all([
    getPostingConsistency(),
    getBestDayToPost(),
    getEngagementTrend(),
    getContentMixComparison(),
    getLatestContentDna(),
    db.bestPractice.findMany({ where: { status: "open" }, orderBy: { createdAt: "desc" } }),
  ]);

  const hasAnyData = consistency.daysSinceLastPost != null;

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        icon={TrendingUp}
        color="aqua"
        title="Insights"
        description="Deterministic growth signals derived from your history - posting cadence, timing, and trend, not AI narrative."
        action={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <MoreToolsMenu />
            <ExportButton />
          </div>
        }
      />

      <BestPracticesCard items={bestPractices} />

      {!hasAnyData ? (
        <Card>
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            Sync some Reels or Posts first - these cards need real history to compute anything
            useful.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <IconBadge icon={CalendarClock} color="blue" size="sm" />
                Posting consistency
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-3xl font-semibold tracking-tight">{consistency.last7Days}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">last 7 days</p>
                </div>
                <div>
                  <p className="text-3xl font-semibold tracking-tight">{consistency.last30Days}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">last 30 days</p>
                </div>
                <div>
                  <p className="text-3xl font-semibold tracking-tight">
                    {consistency.daysSinceLastPost ?? "-"}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">days since last post</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <IconBadge icon={TrendingUp} color="orange" size="sm" />
                Best day to post
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!bestDays ? (
                <p className="text-sm text-muted-foreground">
                  Not enough data yet - need at least 5 posted items with insights.
                </p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {bestDays.map((d, i) => (
                    <div
                      key={d.day}
                      className={
                        i === 0
                          ? "flex items-center justify-between gap-2 rounded-lg bg-[color-mix(in_oklab,var(--chart-2)_12%,transparent)] px-2.5 py-1.5 text-sm"
                          : "flex items-center justify-between gap-2 px-2.5 py-1.5 text-sm"
                      }
                    >
                      <span className="flex items-center gap-1.5">
                        {i === 0 && <Trophy className="size-3.5 text-[var(--chart-2)]" />}
                        <span className={i === 0 ? "font-semibold" : "text-muted-foreground"}>{d.day}</span>
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatPercent(d.avgEngagementRate)} avg · {d.count} item
                        {d.count === 1 ? "" : "s"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <IconBadge icon={TrendingUp} color="aqua" size="sm" />
                Engagement trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              {trend.length > 1 ? (
                <MetricLineChart
                  data={trend}
                  dataKey="engagement"
                  label="Engagement rate"
                  height={220}
                  percent
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Appears once you have a few posted items with engagement data.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <IconBadge icon={Scale} color="magenta" size="sm" />
                Content mix - Reels vs. Posts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2 rounded-xl bg-muted/50 p-4">
                  <div className="flex items-center gap-2">
                    <Film className="size-4 text-muted-foreground" />
                    <span className="font-medium">Reels</span>
                    <Badge variant="secondary">{mix.reels.count}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Avg reach:{" "}
                    <span className="font-medium text-foreground">
                      {mix.reels.avgReach != null ? formatCompactNumber(mix.reels.avgReach) : "-"}
                    </span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Avg engagement:{" "}
                    <span className="font-medium text-foreground">
                      {mix.reels.avgEngagementRate != null
                        ? formatPercent(mix.reels.avgEngagementRate)
                        : "-"}
                    </span>
                  </p>
                </div>
                <div className="flex flex-col gap-2 rounded-xl bg-muted/50 p-4">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="size-4 text-muted-foreground" />
                    <span className="font-medium">Posts</span>
                    <Badge variant="secondary">{mix.posts.count}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Avg reach:{" "}
                    <span className="font-medium text-foreground">
                      {mix.posts.avgReach != null ? formatCompactNumber(mix.posts.avgReach) : "-"}
                    </span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Avg engagement:{" "}
                    <span className="font-medium text-foreground">
                      {mix.posts.avgEngagementRate != null
                        ? formatPercent(mix.posts.avgEngagementRate)
                        : "-"}
                    </span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="mt-6 border-t border-foreground/[0.06] pt-8">
        <PageHeader
          icon={Dna}
          color="aqua"
          title="Content DNA"
          description="The recurring hooks, topics, tone, and formats that make your best reels work."
        />
        <div className="mt-4">
          {!dnaProfile ? (
            <EmptyState
              icon={Dna}
              color="aqua"
              title="Not enough history yet"
              description="Your Content DNA profile is built by the Analytics agent from your top-performing reels over time. It'll appear here once you have at least 5 reels synced and have run the Analytics agent."
            />
          ) : (
            <div className="flex flex-col gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Profile</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Generated {formatDate(dnaProfile.generatedAt)} by the Analytics agent
                  </p>
                </CardHeader>
                <CardContent>
                  <p className="max-w-3xl text-pretty whitespace-pre-wrap text-sm leading-relaxed">
                    {dnaProfile.narrative}
                  </p>
                </CardContent>
              </Card>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Formats that outperform</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2">
                    {dnaProfile.topFormats.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Not enough data yet.</p>
                    ) : (
                      dnaProfile.topFormats.map((f) => (
                        <div key={f.key} className="flex items-center justify-between text-sm">
                          <Badge variant="secondary">{formatLabel(f.key)}</Badge>
                          <span className="text-muted-foreground">
                            {formatCompactNumber(f.avgViews)} avg plays · {f.count} reels
                          </span>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Topics that outperform</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2">
                    {dnaProfile.topTopics.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Not enough data yet.</p>
                    ) : (
                      dnaProfile.topTopics.map((t) => (
                        <div key={t.key} className="flex items-center justify-between text-sm">
                          <Badge variant="outline">{t.key}</Badge>
                          <span className="text-muted-foreground">
                            {formatCompactNumber(t.avgViews)} avg plays · {t.count} reels
                          </span>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

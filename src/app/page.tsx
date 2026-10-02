import { LayoutDashboard, Play, Sparkles, TrendingUp, Users, Zap } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { StatTile } from "@/components/stat-tile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FollowerGrowthChart } from "@/components/overview/follower-growth-chart";
import { TopReelCard } from "@/components/overview/top-reel-card";
import { SuggestionCard } from "@/components/overview/suggestion-card";
import { IdeaBatchCard } from "@/components/overview/idea-batch-card";
import { db } from "@/lib/db";
import { getOverviewStats } from "@/lib/stats";
import { getActiveSuggestions } from "@/lib/suggestions";
import { getLatestIdeaBatch } from "@/lib/idea-batch";
import { formatCompactNumber, formatPercent } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const [stats, suggestions, account, ideaBatch] = await Promise.all([
    getOverviewStats(),
    getActiveSuggestions(),
    db.account.findFirst(),
    getLatestIdeaBatch(),
  ]);
  const hasData = stats.followerCount != null || stats.reelCount > 0;

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div
        className="relative overflow-hidden rounded-2xl px-6 py-7 text-white shadow-sm sm:px-8"
        style={{ background: "linear-gradient(120deg, oklch(0.24 0.015 279), oklch(0.145 0.012 279))" }}
      >
        <Sparkles className="pointer-events-none absolute -top-6 right-6 size-32 text-white/10" />
        <div
          className="pointer-events-none absolute -bottom-16 -left-10 size-48 rounded-full blur-3xl"
          style={{ background: "color-mix(in oklab, var(--primary) 35%, transparent)" }}
        />
        <p className="relative text-sm font-medium text-white/75">
          {new Date().toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
        <h1 className="relative mt-1 text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
          {account ? `Welcome back, @${account.username}` : "Welcome to CMPND"}
        </h1>
        <p className="relative mt-1.5 max-w-xl text-sm text-white/80 text-pretty">
          Followers, plays, top reel, and engagement at a glance.
        </p>
      </div>

      {!hasData ? (
        <EmptyState
          icon={LayoutDashboard}
          title="Not connected to Instagram yet"
          description="Head to Profile to connect your Instagram Business account and run your first sync. Once data is in, this page will show your growth chart, average plays per reel, top reel, and average engagement."
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile
              label="Followers"
              icon={Users}
              color="blue"
              value={stats.followerCount != null ? formatCompactNumber(stats.followerCount) : "-"}
              delta={stats.followerDelta}
            />
            <StatTile
              label="Avg plays / reel"
              icon={Play}
              color="orange"
              value={stats.avgPlays != null ? formatCompactNumber(stats.avgPlays) : "-"}
            />
            <StatTile
              label="Total plays"
              icon={TrendingUp}
              color="aqua"
              value={stats.totalPlays != null ? formatCompactNumber(stats.totalPlays) : "-"}
            />
            <StatTile
              label="Avg engagement"
              icon={Zap}
              color="yellow"
              value={
                stats.avgEngagementRate != null ? formatPercent(stats.avgEngagementRate) : "-"
              }
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Follower growth</CardTitle>
              </CardHeader>
              <CardContent>
                {stats.followerHistory.length > 1 ? (
                  <FollowerGrowthChart data={stats.followerHistory} />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Growth chart appears after a second sync gives us a data point to compare
                    against.
                  </p>
                )}
              </CardContent>
            </Card>

            <div className="flex flex-col gap-4">
              <SuggestionCard
                suggestions={suggestions.map((s) => ({
                  id: s.id,
                  date: s.date.toISOString(),
                  type: s.type,
                  hook: s.hook,
                  script: s.script,
                  concept: s.concept,
                  caption: s.caption,
                }))}
              />
              {stats.topReel && <TopReelCard reel={stats.topReel} />}
            </div>
          </div>

          {ideaBatch && (
            <IdeaBatchCard
              nicheIdeas={ideaBatch.nicheIdeas}
              freshIdeas={ideaBatch.freshIdeas}
              generatedAt={ideaBatch.generatedAt.toISOString()}
            />
          )}
        </>
      )}
    </div>
  );
}

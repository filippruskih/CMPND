import { db } from "@/lib/db";
import type { Reel, ReelInsightSnapshot } from "@/generated/prisma/client";

export type ReelWithLatestInsight = Reel & { latestInsight: ReelInsightSnapshot | null };

// Every reel paired with its most recent insight snapshot. Snapshots are
// stored historically (one per sync), so "current" stats means the latest
// row per reel, computed in JS rather than a SQL window function — fine at
// personal-account scale.
export async function getReelsWithLatestInsights(): Promise<ReelWithLatestInsight[]> {
  const reels = await db.reel.findMany({
    orderBy: { postedAt: "desc" },
    include: { insights: { orderBy: { capturedAt: "desc" }, take: 1 } },
  });

  return reels.map((reel) => ({
    ...reel,
    latestInsight: reel.insights[0] ?? null,
  }));
}

const REELS_PAGE_SIZE = 10;

export async function getReelsPage(page: number): Promise<{
  reels: ReelWithLatestInsight[];
  totalCount: number;
  pageSize: number;
}> {
  const totalCount = await db.reel.count();
  const reels = await db.reel.findMany({
    orderBy: { postedAt: "desc" },
    skip: (page - 1) * REELS_PAGE_SIZE,
    take: REELS_PAGE_SIZE,
    include: { insights: { orderBy: { capturedAt: "desc" }, take: 1 } },
  });

  return {
    reels: reels.map((reel) => ({ ...reel, latestInsight: reel.insights[0] ?? null })),
    totalCount,
    pageSize: REELS_PAGE_SIZE,
  };
}

export async function getReelDetail(id: string) {
  const reel = await db.reel.findUnique({
    where: { id },
    include: { insights: { orderBy: { capturedAt: "desc" } } },
  });
  if (!reel) return null;

  return {
    ...reel,
    latestInsight: reel.insights[0] ?? null,
  };
}

export interface OverviewStats {
  followerCount: number | null;
  followerDelta: number | null;
  followerHistory: { date: string; followers: number }[];
  avgPlays: number | null;
  totalPlays: number | null;
  avgEngagementRate: number | null;
  topReel: ReelWithLatestInsight | null;
  reelCount: number;
  newFollows: number | null;
  newUnfollows: number | null;
}

export async function getOverviewStats(): Promise<OverviewStats> {
  const [recentSnapshotsDesc, reels] = await Promise.all([
    // Capped rather than fetching the whole history - only used for the
    // latest/previous delta and a recent-trend chart, so a bounded window
    // is correct, not just faster, and won't keep growing as sync accrues
    // more daily rows over time.
    db.followerSnapshot.findMany({ orderBy: { capturedAt: "desc" }, take: 180 }),
    getReelsWithLatestInsights(),
  ]);
  const followerSnapshots = [...recentSnapshotsDesc].reverse();

  const latestSnapshot = followerSnapshots.at(-1) ?? null;
  const previousSnapshot =
    followerSnapshots.length > 1 ? followerSnapshots.at(-2)! : null;

  const withViews = reels.filter((r) => typeof r.latestInsight?.views === "number");
  const withEngagement = reels.filter(
    (r) => typeof r.latestInsight?.engagementRate === "number"
  );

  const totalPlays = withViews.reduce((sum, r) => sum + (r.latestInsight!.views ?? 0), 0);
  const avgPlays = withViews.length > 0 ? totalPlays / withViews.length : null;
  const avgEngagementRate =
    withEngagement.length > 0
      ? withEngagement.reduce((sum, r) => sum + (r.latestInsight!.engagementRate ?? 0), 0) /
        withEngagement.length
      : null;

  const topReel =
    withViews.length > 0
      ? withViews.reduce((top, r) =>
          (r.latestInsight!.views ?? 0) > (top.latestInsight!.views ?? 0) ? r : top
        )
      : null;

  return {
    followerCount: latestSnapshot?.followerCount ?? null,
    followerDelta:
      latestSnapshot && previousSnapshot
        ? latestSnapshot.followerCount - previousSnapshot.followerCount
        : null,
    followerHistory: followerSnapshots.map((s) => ({
      date: s.capturedAt.toISOString(),
      followers: s.followerCount,
    })),
    avgPlays,
    totalPlays: withViews.length > 0 ? totalPlays : null,
    avgEngagementRate,
    topReel,
    reelCount: reels.length,
    newFollows: latestSnapshot?.newFollows ?? null,
    newUnfollows: latestSnapshot?.newUnfollows ?? null,
  };
}

// Chronological plays-per-reel across the whole account - what "Total
// plays" on Overview actually drills into when clicked, since the stat
// itself is a sum rather than something with its own time series.
export async function getPlaysOverTime(): Promise<{ date: string; value: number }[]> {
  const reels = await getReelsWithLatestInsights();
  return reels
    .filter((r) => r.latestInsight?.views != null)
    .sort((a, b) => a.postedAt.getTime() - b.postedAt.getTime())
    .map((r) => ({ date: r.postedAt.toISOString(), value: r.latestInsight!.views! }));
}

export async function getTopReels(limit = 10): Promise<ReelWithLatestInsight[]> {
  const reels = await getReelsWithLatestInsights();
  return [...reels]
    .filter((r) => r.latestInsight?.views != null)
    .sort((a, b) => (b.latestInsight!.views ?? 0) - (a.latestInsight!.views ?? 0))
    .slice(0, limit);
}

import { getReelsWithLatestInsights, type ReelWithLatestInsight } from "@/lib/stats";
import { formatLabel } from "@/lib/content/classify";

const MIN_REELS_FOR_RETENTION = 5;

type ReelWithRetention = ReelWithLatestInsight & { retentionRate: number };

export interface RetentionTrendPoint {
  date: string;
  value: number;
}

export interface RetentionLeaderboardItem {
  id: string;
  caption: string | null;
  retentionRate: number;
  views: number | null;
  format: string | null;
}

export interface GroupRetention {
  key: string;
  label: string;
  avgRetention: number;
  count: number;
}

export interface RetentionOverview {
  sampleSize: number;
  overallAvgRetention: number;
  trend: RetentionTrendPoint[];
  top: RetentionLeaderboardItem[];
  bottom: RetentionLeaderboardItem[];
  byFormat: GroupRetention[];
  byLength: GroupRetention[];
  reachCorrelation: {
    highRetentionAvgReach: number | null;
    lowRetentionAvgReach: number | null;
    highRetentionCount: number;
    lowRetentionCount: number;
  } | null;
}

function average(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function lengthBucket(durationMs: number): { key: string; label: string } {
  const seconds = durationMs / 1000;
  if (seconds < 15) return { key: "under15", label: "Under 15s" };
  if (seconds < 30) return { key: "15to30", label: "15-30s" };
  if (seconds < 60) return { key: "30to60", label: "30-60s" };
  if (seconds < 90) return { key: "60to90", label: "60-90s" };
  return { key: "over90", label: "90s+" };
}

function groupByRetention(
  reels: ReelWithRetention[],
  keyOf: (r: ReelWithRetention) => { key: string; label: string } | null
): GroupRetention[] {
  const buckets = new Map<string, { label: string; rates: number[] }>();
  for (const r of reels) {
    const group = keyOf(r);
    if (!group) continue;
    if (!buckets.has(group.key)) buckets.set(group.key, { label: group.label, rates: [] });
    buckets.get(group.key)!.rates.push(r.retentionRate);
  }

  return Array.from(buckets.entries())
    .map(([key, { label, rates }]) => ({
      key,
      label,
      avgRetention: average(rates),
      count: rates.length,
    }))
    .sort((a, b) => b.avgRetention - a.avgRetention);
}

function toLeaderboardItem(r: ReelWithRetention): RetentionLeaderboardItem {
  return {
    id: r.id,
    caption: r.caption,
    retentionRate: r.retentionRate,
    views: r.latestInsight?.views ?? null,
    format: r.format,
  };
}

// Instagram's Graph API exposes only one retention-adjacent number per
// reel - ig_reels_avg_watch_time (average watch time across all viewers).
// There's no per-second retention curve available via the API at all
// (only Instagram's own in-app Insights screen shows that, visually, to
// the account owner) - everything here is built from that one real number
// plus each reel's own length, computed across the whole account instead
// of shown one reel at a time.
export async function getRetentionOverview(): Promise<RetentionOverview | null> {
  const reels = await getReelsWithLatestInsights();

  const withRetention: ReelWithRetention[] = reels
    .filter((r) => r.durationMs && r.durationMs > 0 && r.latestInsight?.avgWatchTimeMs != null)
    .map((r) => ({
      ...r,
      retentionRate: Math.min(1, r.latestInsight!.avgWatchTimeMs! / r.durationMs!),
    }));

  if (withRetention.length < MIN_REELS_FOR_RETENTION) return null;

  const overallAvgRetention = average(withRetention.map((r) => r.retentionRate));

  const trend = [...withRetention]
    .sort((a, b) => a.postedAt.getTime() - b.postedAt.getTime())
    .map((r) => ({ date: r.postedAt.toISOString(), value: r.retentionRate }));

  const ranked = [...withRetention].sort((a, b) => b.retentionRate - a.retentionRate);
  const top = ranked.slice(0, 5).map(toLeaderboardItem);
  const bottom = ranked
    .slice(-5)
    .reverse()
    .map(toLeaderboardItem);

  const byFormat = groupByRetention(withRetention, (r) =>
    r.format ? { key: r.format, label: formatLabel(r.format) } : null
  );
  const LENGTH_ORDER = ["under15", "15to30", "30to60", "60to90", "over90"];
  const byLength = groupByRetention(withRetention, (r) => lengthBucket(r.durationMs!)).sort(
    (a, b) => LENGTH_ORDER.indexOf(a.key) - LENGTH_ORDER.indexOf(b.key)
  );

  let reachCorrelation = null;
  const withReach = withRetention.filter((r) => r.latestInsight?.reach != null);
  if (withReach.length >= MIN_REELS_FOR_RETENTION) {
    const medianRate = [...withReach].sort((a, b) => a.retentionRate - b.retentionRate)[
      Math.floor(withReach.length / 2)
    ].retentionRate;
    const high = withReach.filter((r) => r.retentionRate >= medianRate);
    const low = withReach.filter((r) => r.retentionRate < medianRate);
    reachCorrelation = {
      highRetentionAvgReach: high.length > 0 ? average(high.map((r) => r.latestInsight!.reach!)) : null,
      lowRetentionAvgReach: low.length > 0 ? average(low.map((r) => r.latestInsight!.reach!)) : null,
      highRetentionCount: high.length,
      lowRetentionCount: low.length,
    };
  }

  return {
    sampleSize: withRetention.length,
    overallAvgRetention,
    trend,
    top,
    bottom,
    byFormat,
    byLength,
    reachCorrelation,
  };
}

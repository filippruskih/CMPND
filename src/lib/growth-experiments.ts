import { getReelsWithLatestInsights } from "@/lib/stats";
import { getPostsWithLatestInsights } from "@/lib/posts";
import { formatLabel } from "@/lib/content/classify";

// Preset, retroactive breakdowns over every reel and post ever synced -
// not creator-declared hypotheses tagged going forward. No minimum
// sample size is enforced anywhere here (the request was explicitly "do
// not set a limit") - every group's real count is shown instead, so low
// confidence is visible rather than hidden.

interface CombinedItem {
  postedAt: Date;
  engagementRate: number | null;
  views: number | null;
  reach: number | null;
  format: string | null; // null for posts - only reels are classified by format
}

async function getCombinedItems(): Promise<CombinedItem[]> {
  const [reels, posts] = await Promise.all([getReelsWithLatestInsights(), getPostsWithLatestInsights()]);

  const fromReels: CombinedItem[] = reels.map((r) => ({
    postedAt: r.postedAt,
    engagementRate: r.latestInsight?.engagementRate ?? null,
    views: r.latestInsight?.views ?? null,
    reach: r.latestInsight?.reach ?? null,
    format: r.format,
  }));
  const fromPosts: CombinedItem[] = posts.map((p) => ({
    postedAt: p.postedAt,
    engagementRate: p.latestInsight?.engagementRate ?? null,
    views: p.latestInsight?.views ?? null,
    reach: p.latestInsight?.reach ?? null,
    format: null,
  }));

  return [...fromReels, ...fromPosts];
}

export interface FormatBreakdown {
  format: string;
  label: string;
  count: number;
  avgEngagementRate: number | null;
}

export interface ExperimentGroup {
  key: string;
  label: string;
  count: number;
  avgEngagementRate: number | null;
  avgViews: number | null;
  avgReach: number | null;
  byFormat: FormatBreakdown[];
}

export interface ExperimentResult {
  title: string;
  description: string;
  sampleSize: number;
  groups: ExperimentGroup[];
}

function average(values: (number | null)[]): number | null {
  const nums = values.filter((v): v is number => v != null);
  if (nums.length === 0) return null;
  return nums.reduce((sum, v) => sum + v, 0) / nums.length;
}

function byFormatBreakdown(items: CombinedItem[]): FormatBreakdown[] {
  const buckets = new Map<string, CombinedItem[]>();
  for (const item of items) {
    if (!item.format) continue;
    if (!buckets.has(item.format)) buckets.set(item.format, []);
    buckets.get(item.format)!.push(item);
  }
  return Array.from(buckets.entries())
    .map(([format, group]) => ({
      format,
      label: formatLabel(format),
      count: group.length,
      avgEngagementRate: average(group.map((i) => i.engagementRate)),
    }))
    .sort((a, b) => (b.avgEngagementRate ?? 0) - (a.avgEngagementRate ?? 0));
}

function buildGroups(
  items: CombinedItem[],
  keyOf: (item: CombinedItem) => { key: string; label: string },
  order: string[]
): ExperimentGroup[] {
  const buckets = new Map<string, { label: string; items: CombinedItem[] }>();
  for (const item of items) {
    const { key, label } = keyOf(item);
    if (!buckets.has(key)) buckets.set(key, { label, items: [] });
    buckets.get(key)!.items.push(item);
  }

  const groups = Array.from(buckets.entries()).map(([key, { label, items: group }]) => ({
    key,
    label,
    count: group.length,
    avgEngagementRate: average(group.map((i) => i.engagementRate)),
    avgViews: average(group.map((i) => i.views)),
    avgReach: average(group.map((i) => i.reach)),
    byFormat: byFormatBreakdown(group),
  }));

  return groups.sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));
}

const TIME_OF_DAY_ORDER = ["morning", "midday", "evening", "night"];

function timeOfDayBucket(hour: number): { key: string; label: string } {
  if (hour >= 7 && hour < 12) return { key: "morning", label: "Morning (7am-12pm)" };
  if (hour >= 12 && hour < 16) return { key: "midday", label: "Midday (12-4pm)" };
  if (hour >= 16 && hour < 21) return { key: "evening", label: "Evening (4-9pm)" };
  return { key: "night", label: "Night (9pm-7am)" };
}

const DAY_OF_WEEK_ORDER = ["0", "1", "2", "3", "4", "5", "6"];
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const WEEK_OF_MONTH_ORDER = ["1", "2", "3", "4", "5"];

function weekOfMonthBucket(dayOfMonth: number): { key: string; label: string } {
  const week = Math.min(5, Math.ceil(dayOfMonth / 7));
  const label = week === 5 ? "Week 5 (29-31)" : `Week ${week} (${(week - 1) * 7 + 1}-${week * 7})`;
  return { key: String(week), label };
}

export async function getTimeOfDayExperiment(): Promise<ExperimentResult> {
  const items = await getCombinedItems();
  return {
    title: "Time of day",
    description: "Every reel and post, grouped by the hour it was posted (your local time as recorded by Instagram).",
    sampleSize: items.length,
    groups: buildGroups(items, (i) => timeOfDayBucket(i.postedAt.getUTCHours()), TIME_OF_DAY_ORDER),
  };
}

export async function getDayOfWeekExperiment(): Promise<ExperimentResult> {
  const items = await getCombinedItems();
  return {
    title: "Day of week",
    description: "Every reel and post, grouped by which day of the week it was posted.",
    sampleSize: items.length,
    groups: buildGroups(
      items,
      (i) => ({ key: String(i.postedAt.getUTCDay()), label: DAY_NAMES[i.postedAt.getUTCDay()] }),
      DAY_OF_WEEK_ORDER
    ),
  };
}

export async function getWeekOfMonthExperiment(): Promise<ExperimentResult> {
  const items = await getCombinedItems();
  return {
    title: "Week of month",
    description: "Every reel and post, grouped by which week of the month it fell in.",
    sampleSize: items.length,
    groups: buildGroups(items, (i) => weekOfMonthBucket(i.postedAt.getUTCDate()), WEEK_OF_MONTH_ORDER),
  };
}

export async function getAllExperiments(): Promise<ExperimentResult[]> {
  return Promise.all([getTimeOfDayExperiment(), getDayOfWeekExperiment(), getWeekOfMonthExperiment()]);
}

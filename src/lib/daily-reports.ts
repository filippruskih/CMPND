import { db } from "@/lib/db";

export interface DailyReportStats {
  followerCount: number | null;
  followerDelta: number | null;
  avgPlays: number | null;
  avgEngagementRate: number | null;
  postsLast7Days: number;
  postsLast30Days: number;
  activeSuggestions: number;
  openBestPractices: number;
  competitorCount: number;
  followerHistory: { date: string; followers: number }[];
}

export interface DailyReportView {
  id: string;
  date: Date;
  summary: string;
  stats: DailyReportStats;
  emailSentAt: Date | null;
  emailError: string | null;
}

const EMPTY_STATS: DailyReportStats = {
  followerCount: null,
  followerDelta: null,
  avgPlays: null,
  avgEngagementRate: null,
  postsLast7Days: 0,
  postsLast30Days: 0,
  activeSuggestions: 0,
  openBestPractices: 0,
  competitorCount: 0,
  followerHistory: [],
};

function toView(report: {
  id: string;
  date: Date;
  summary: string;
  statsJson: string;
  emailSentAt: Date | null;
  emailError: string | null;
}): DailyReportView {
  // Defensive: a report generated before statsJson's shape changed from a
  // flat string array to this structured object would otherwise parse
  // into something with none of these fields, and .followerHistory.map
  // would throw on a page that's supposed to list many reports at once.
  let parsed: unknown;
  try {
    parsed = JSON.parse(report.statsJson);
  } catch {
    parsed = null;
  }
  const stats: DailyReportStats =
    parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? { ...EMPTY_STATS, ...(parsed as Partial<DailyReportStats>) }
      : EMPTY_STATS;

  return {
    id: report.id,
    date: report.date,
    summary: report.summary,
    stats,
    emailSentAt: report.emailSentAt,
    emailError: report.emailError,
  };
}

export async function getRecentDailyReports(limit = 14): Promise<DailyReportView[]> {
  const reports = await db.dailyReport.findMany({ orderBy: { date: "desc" }, take: limit });
  return reports.map(toView);
}

export async function getLatestDailyReport(): Promise<DailyReportView | null> {
  const report = await db.dailyReport.findFirst({ orderBy: { date: "desc" } });
  return report ? toView(report) : null;
}

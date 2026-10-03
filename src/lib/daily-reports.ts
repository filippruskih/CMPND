import { db } from "@/lib/db";

export interface DailyReportView {
  id: string;
  date: Date;
  summary: string;
  statsLines: string[];
  emailSentAt: Date | null;
  emailError: string | null;
}

function toView(report: {
  id: string;
  date: Date;
  summary: string;
  statsJson: string;
  emailSentAt: Date | null;
  emailError: string | null;
}): DailyReportView {
  return {
    id: report.id,
    date: report.date,
    summary: report.summary,
    statsLines: JSON.parse(report.statsJson) as string[],
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

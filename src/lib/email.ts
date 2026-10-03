import { Resend } from "resend";
import { formatCompactNumber, formatDate, formatPercent, formatSignedCompactNumber } from "@/lib/format";
import type { DailyReportStats } from "@/lib/daily-reports";

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.REPORT_EMAIL_TO);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Email clients have notoriously poor CSS support (no flexbox/grid in
// several major ones), so stat "tiles" here are a table - the one layout
// primitive that reliably renders the same everywhere.
function statBox(label: string, value: string, accent: string): string {
  return `
    <td style="padding: 4px;" width="50%">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: ${accent}1a; border: 1px solid ${accent}33; border-radius: 10px;">
        <tr>
          <td style="padding: 12px 14px;">
            <div style="font-size: 12px; color: #6b7280;">${escapeHtml(label)}</div>
            <div style="font-size: 20px; font-weight: 600; color: #111827;">${escapeHtml(value)}</div>
          </td>
        </tr>
      </table>
    </td>`;
}

function buildStatBoxes(stats: DailyReportStats): string {
  const boxes: string[] = [];
  if (stats.followerCount != null) {
    boxes.push(
      statBox(
        "Followers",
        `${formatCompactNumber(stats.followerCount)}${
          stats.followerDelta != null ? ` (${formatSignedCompactNumber(stats.followerDelta)})` : ""
        }`,
        "#574ede"
      )
    );
  }
  if (stats.avgEngagementRate != null) {
    boxes.push(statBox("Avg engagement", formatPercent(stats.avgEngagementRate), "#e87ba4"));
  }
  if (stats.avgPlays != null) {
    boxes.push(statBox("Avg plays / reel", formatCompactNumber(stats.avgPlays), "#eda100"));
  }
  boxes.push(statBox("Posted this week", String(stats.postsLast7Days), "#1baf7a"));

  const rows: string[] = [];
  for (let i = 0; i < boxes.length; i += 2) {
    rows.push(`<tr>${boxes[i]}${boxes[i + 1] ?? '<td width="50%"></td>'}</tr>`);
  }
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows.join("")}</table>`;
}

export async function sendDailyReportEmail(report: {
  date: Date;
  summary: string;
  stats: DailyReportStats;
}): Promise<void> {
  if (!isEmailConfigured()) {
    throw new Error("Email not configured - set RESEND_API_KEY and REPORT_EMAIL_TO.");
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = process.env.REPORT_FROM_EMAIL || "CMPND <onboarding@resend.dev>";
  const to = process.env.REPORT_EMAIL_TO!;
  const dateLabel = formatDate(report.date);

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 560px; margin: 0 auto; color: #1a1a1a;">
      <div style="background: linear-gradient(135deg, #574ede, #e87ba4); border-radius: 14px; padding: 20px 22px; margin-bottom: 16px;">
        <div style="color: rgba(255,255,255,0.8); font-size: 13px;">Your daily report</div>
        <div style="color: #fff; font-size: 20px; font-weight: 600;">${escapeHtml(dateLabel)}</div>
      </div>
      ${buildStatBoxes(report.stats)}
      <div style="margin-top: 16px; padding: 16px 18px; background: #f7f7fa; border-radius: 10px; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">
        ${escapeHtml(report.summary)}
      </div>
    </div>
  `;

  const textStatLines = [
    report.stats.followerCount != null
      ? `Followers: ${formatCompactNumber(report.stats.followerCount)}`
      : null,
    report.stats.avgEngagementRate != null
      ? `Avg engagement: ${formatPercent(report.stats.avgEngagementRate)}`
      : null,
    report.stats.avgPlays != null ? `Avg plays per reel: ${formatCompactNumber(report.stats.avgPlays)}` : null,
    `Posted this week: ${report.stats.postsLast7Days}`,
  ].filter((l): l is string => l != null);

  const text = `Your daily report - ${dateLabel}\n\n${textStatLines.join("\n")}\n\n${report.summary}`;

  const { error } = await resend.emails.send({
    from,
    to,
    subject: `Your daily report - ${dateLabel}`,
    html,
    text,
  });

  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }
}

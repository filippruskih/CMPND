import { Resend } from "resend";
import { formatDate } from "@/lib/format";

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.REPORT_EMAIL_TO);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function sendDailyReportEmail(report: {
  date: Date;
  summary: string;
  statsLines: string[];
}): Promise<void> {
  if (!isEmailConfigured()) {
    throw new Error("Email not configured - set RESEND_API_KEY and REPORT_EMAIL_TO.");
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = process.env.REPORT_FROM_EMAIL || "CMPND <onboarding@resend.dev>";
  const to = process.env.REPORT_EMAIL_TO!;
  const dateLabel = formatDate(report.date);

  const html = `
    <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; color: #1a1a1a;">
      <h1 style="font-size: 18px;">Your daily report - ${dateLabel}</h1>
      <ul style="padding-left: 20px; font-size: 14px; line-height: 1.6;">
        ${report.statsLines.map((line) => `<li>${escapeHtml(line)}</li>`).join("\n")}
      </ul>
      <p style="font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${escapeHtml(report.summary)}</p>
    </div>
  `;

  const text = `Your daily report - ${dateLabel}\n\n${report.statsLines.join("\n")}\n\n${report.summary}`;

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

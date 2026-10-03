import { db } from "@/lib/db";
import {
  anthropic,
  requireAnthropicKey,
  AGENT_MODEL,
  NO_EM_DASH_INSTRUCTION,
  NO_MARKDOWN_INSTRUCTION,
} from "@/lib/anthropic";
import { getOverviewStats } from "@/lib/stats";
import { getPostingConsistency } from "@/lib/insights";
import { getActiveSuggestions } from "@/lib/suggestions";
import { getLatestIdeaBatch } from "@/lib/idea-batch";
import { isEmailConfigured, sendDailyReportEmail } from "@/lib/email";
import { formatCompactNumber, formatPercent, formatSignedCompactNumber } from "@/lib/format";
import type { AgentContext } from "@/lib/agents/registry";
import type { DailyReportStats } from "@/lib/daily-reports";

const FOLLOWER_SPARKLINE_POINTS = 14;

// Runs last in the daily pipeline (see registry.ts hours) so it can
// synthesize what sync/analytics/trend/idea/planning already produced
// that day into one dated briefing, rather than running its own
// analysis from scratch.
export async function runDailyReportAgent(ctx: AgentContext): Promise<string> {
  await ctx.log("Gathering today's numbers…");

  const [stats, consistency, suggestions, ideaBatch, trendRun, openBestPractices, competitorCount] =
    await Promise.all([
      getOverviewStats(),
      getPostingConsistency(),
      getActiveSuggestions(),
      getLatestIdeaBatch(),
      db.agentRun.findFirst({
        where: { agent: { key: "trend" }, status: "succeeded" },
        orderBy: { startedAt: "desc" },
      }),
      db.bestPractice.count({ where: { status: "open" } }),
      db.competitor.count(),
    ]);

  // Frozen at generation time rather than re-derived when a report is
  // viewed later, so an old report keeps showing the numbers (and the
  // sparkline) as they were that day, even as history keeps accruing.
  const reportStats: DailyReportStats = {
    followerCount: stats.followerCount,
    followerDelta: stats.followerDelta,
    avgPlays: stats.avgPlays,
    avgEngagementRate: stats.avgEngagementRate,
    postsLast7Days: consistency.last7Days,
    postsLast30Days: consistency.last30Days,
    activeSuggestions: suggestions.length,
    openBestPractices,
    competitorCount,
    followerHistory: stats.followerHistory.slice(-FOLLOWER_SPARKLINE_POINTS),
  };

  // Keep the text facts fed to Claude in plain, readable lines - same
  // content as reportStats, just phrased as sentences instead of a
  // structured object.
  const factLines: string[] = [];
  if (reportStats.followerCount != null) {
    factLines.push(
      `Followers: ${formatCompactNumber(reportStats.followerCount)}${
        reportStats.followerDelta != null ? ` (${formatSignedCompactNumber(reportStats.followerDelta)})` : ""
      }`
    );
  }
  if (reportStats.avgPlays != null) factLines.push(`Avg plays per reel: ${formatCompactNumber(reportStats.avgPlays)}`);
  if (reportStats.avgEngagementRate != null)
    factLines.push(`Avg engagement: ${formatPercent(reportStats.avgEngagementRate)}`);
  factLines.push(
    `Posted ${reportStats.postsLast7Days} times in the last 7 days, ${reportStats.postsLast30Days} in the last 30`
  );
  if (reportStats.activeSuggestions > 0) factLines.push(`${reportStats.activeSuggestions} active suggestion(s) waiting for you`);
  if (reportStats.openBestPractices > 0) factLines.push(`${reportStats.openBestPractices} open "worth doing" recommendation(s)`);
  if (reportStats.competitorCount > 0) factLines.push(`Tracking ${reportStats.competitorCount} competitor(s)`);

  requireAnthropicKey();
  await ctx.log("Writing today's briefing…");

  const response = await anthropic.messages.create({
    model: AGENT_MODEL,
    max_tokens: 500,
    thinking: { type: "disabled" },
    messages: [
      {
        role: "user",
        content: `Write a short daily briefing (3-5 sentences) for a content creator, covering today's numbers and what's new. Write it like a quick morning update from an assistant, not a formal report. The numbers themselves will be shown separately as stat tiles above this text, so don't just restate them as a list - focus on what they mean and what's new today instead. Reference the concrete facts given - never invent a number not present here.

Today's numbers:
${factLines.join("\n") || "(no data yet)"}

${trendRun?.outputSummary ? `Today's trend research:\n${trendRun.outputSummary}\n` : ""}
${
  ideaBatch
    ? `New reel ideas today - from their niche: ${ideaBatch.nicheIdeas.map((i) => i.concept).join("; ")}. New territory: ${ideaBatch.freshIdeas.map((i) => i.concept).join("; ")}.\n`
    : ""
}
${
  suggestions[0]
    ? `Today's top suggestion: ${suggestions[0].type === "post" ? suggestions[0].concept : suggestions[0].hook}\n`
    : ""
}
${NO_EM_DASH_INSTRUCTION}
${NO_MARKDOWN_INSTRUCTION}`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  const summary = textBlock && textBlock.type === "text" ? textBlock.text.trim() : "";

  const report = await db.dailyReport.create({
    data: {
      summary: summary || "No briefing generated.",
      statsJson: JSON.stringify(reportStats),
      sourceAgentRunId: ctx.runId,
    },
  });

  if (isEmailConfigured()) {
    await ctx.log("Emailing today's report…");
    try {
      await sendDailyReportEmail({ date: report.date, summary: report.summary, stats: reportStats });
      await db.dailyReport.update({ where: { id: report.id }, data: { emailSentAt: new Date() } });
      await ctx.log("Report emailed.");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await db.dailyReport.update({ where: { id: report.id }, data: { emailError: message } });
      await ctx.log(`Email failed: ${message}`, "warn");
    }
  } else {
    await ctx.log("Email not configured (RESEND_API_KEY/REPORT_EMAIL_TO) - report saved in-app only.");
  }

  return summary || "Daily report generated.";
}

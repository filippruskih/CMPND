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

  const statsLines: string[] = [];
  if (stats.followerCount != null) {
    statsLines.push(
      `Followers: ${formatCompactNumber(stats.followerCount)}${
        stats.followerDelta != null ? ` (${formatSignedCompactNumber(stats.followerDelta)})` : ""
      }`
    );
  }
  if (stats.avgPlays != null) statsLines.push(`Avg plays per reel: ${formatCompactNumber(stats.avgPlays)}`);
  if (stats.avgEngagementRate != null)
    statsLines.push(`Avg engagement: ${formatPercent(stats.avgEngagementRate)}`);
  statsLines.push(
    `Posted ${consistency.last7Days} times in the last 7 days, ${consistency.last30Days} in the last 30`
  );
  if (suggestions.length > 0) statsLines.push(`${suggestions.length} active suggestion(s) waiting for you`);
  if (openBestPractices > 0) statsLines.push(`${openBestPractices} open "worth doing" recommendation(s)`);
  if (competitorCount > 0) statsLines.push(`Tracking ${competitorCount} competitor(s)`);

  requireAnthropicKey();
  await ctx.log("Writing today's briefing…");

  const response = await anthropic.messages.create({
    model: AGENT_MODEL,
    max_tokens: 500,
    thinking: { type: "disabled" },
    messages: [
      {
        role: "user",
        content: `Write a short daily briefing (3-5 sentences) for a content creator, covering today's numbers and what's new. Write it like a quick morning update from an assistant, not a formal report. Reference the concrete facts given - never invent a number not present here.

Today's numbers:
${statsLines.join("\n") || "(no data yet)"}

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
      statsJson: JSON.stringify(statsLines),
      sourceAgentRunId: ctx.runId,
    },
  });

  if (isEmailConfigured()) {
    await ctx.log("Emailing today's report…");
    try {
      await sendDailyReportEmail({ date: report.date, summary: report.summary, statsLines });
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

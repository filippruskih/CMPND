import { anthropic, requireAnthropicKey, CLASSIFY_MODEL, NO_EM_DASH_INSTRUCTION } from "@/lib/anthropic";
import { getOverviewStats, getReelsWithLatestInsights } from "@/lib/stats";
import { getContentMixComparison } from "@/lib/insights";
import { formatCompactNumber, formatPercent } from "@/lib/format";
import type { AgentContext } from "@/lib/agents/registry";
import { AgentSkip } from "@/lib/agents/errors";
import { updateContentDna } from "@/lib/agents/tasks/content-dna";
import { updateBestPractices } from "@/lib/agents/tasks/best-practices";

interface Anomaly {
  caption: string;
  direction: "outperforming" | "underperforming";
  views: number;
  baselineViews: number;
}

// Anomaly detection is plain arithmetic, not something an LLM should be
// asked to eyeball — the model's job is turning already-computed facts into
// a short narrative, not computing the facts themselves.
function findAnomalies(reels: Awaited<ReturnType<typeof getReelsWithLatestInsights>>): Anomaly[] {
  const withViews = reels.filter((r) => typeof r.latestInsight?.views === "number");
  if (withViews.length < 4) return [];

  const recent = withViews.slice(0, 3);
  const baseline = withViews.slice(3);
  const baselineAvg =
    baseline.reduce((sum, r) => sum + (r.latestInsight!.views ?? 0), 0) / baseline.length;
  if (baselineAvg === 0) return [];

  const anomalies: Anomaly[] = [];
  for (const reel of recent) {
    const views = reel.latestInsight!.views ?? 0;
    if (views > baselineAvg * 1.5) {
      anomalies.push({
        caption: reel.caption ?? "(no caption)",
        direction: "outperforming",
        views,
        baselineViews: baselineAvg,
      });
    } else if (views < baselineAvg * 0.5) {
      anomalies.push({
        caption: reel.caption ?? "(no caption)",
        direction: "underperforming",
        views,
        baselineViews: baselineAvg,
      });
    }
  }
  return anomalies;
}

export async function runAnalyticsAgent(ctx: AgentContext): Promise<string> {
  await ctx.log("Pulling latest reel, post, and follower stats…");
  const stats = await getOverviewStats();
  const mix = await getContentMixComparison();

  if (stats.reelCount === 0 && mix.posts.count === 0) {
    await ctx.log("No reels or posts synced yet - connect Instagram and run a sync first.", "warn");
    throw new AgentSkip("Skipped: no data to analyze yet");
  }

  const reels = await getReelsWithLatestInsights();
  const anomalies = findAnomalies(reels);

  await ctx.log(
    `Baseline: ${stats.reelCount} reels (avg ${
      stats.avgPlays != null ? formatCompactNumber(stats.avgPlays) : "-"
    } plays, ${
      stats.avgEngagementRate != null ? formatPercent(stats.avgEngagementRate) : "-"
    } engagement), ${mix.posts.count} posts (avg ${
      mix.posts.avgEngagementRate != null ? formatPercent(mix.posts.avgEngagementRate) : "-"
    } engagement).`
  );

  if (anomalies.length > 0) {
    for (const a of anomalies) {
      await ctx.log(
        `${a.direction === "outperforming" ? "📈" : "📉"} "${a.caption.slice(0, 60)}" - ${formatCompactNumber(
          a.views
        )} plays vs a ${formatCompactNumber(a.baselineViews)} baseline.`,
        a.direction === "underperforming" ? "warn" : "info"
      );
    }
  } else {
    await ctx.log("No standout anomalies in your last 3 reels vs your baseline.");
  }

  requireAnthropicKey();
  await ctx.log("Asking Claude to summarize what's notable…");

  const facts = {
    reels: {
      count: stats.reelCount,
      followerCount: stats.followerCount,
      followerDelta: stats.followerDelta,
      avgPlays: stats.avgPlays,
      avgEngagementRate: stats.avgEngagementRate,
      topReelCaption: stats.topReel?.caption ?? null,
      topReelViews: stats.topReel?.latestInsight?.views ?? null,
      anomalies,
    },
    posts: {
      count: mix.posts.count,
      avgReach: mix.posts.avgReach,
      avgEngagementRate: mix.posts.avgEngagementRate,
    },
  };

  const response = await anthropic.messages.create({
    model: CLASSIFY_MODEL,
    max_tokens: 400,
    messages: [
      {
        role: "user",
        content: `You are the analytics agent for a personal Instagram dashboard that tracks both Reels and regular feed Posts. Given these already-computed facts (JSON), write a concise 3-5 sentence summary a creator can read in a glance, covering both content types where there's data for them. Reference the concrete numbers given - do not invent numbers not present in the data. Call out anomalies plainly if there are any, and note which content type (Reels or Posts) is performing better if both have enough data to compare.\n\nFacts:\n${JSON.stringify(facts, null, 2)}\n\n${NO_EM_DASH_INSTRUCTION}`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  const summary = textBlock && textBlock.type === "text" ? textBlock.text.trim() : "";
  await ctx.log("Summary ready.");

  await updateContentDna(ctx, ctx.runId);
  await updateBestPractices(ctx, ctx.runId);

  return summary || "Analysis complete.";
}

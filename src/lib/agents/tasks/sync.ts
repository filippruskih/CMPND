import { runInstagramSync } from "@/lib/instagram/sync";
import { syncAllCompetitors } from "@/lib/instagram/competitor-sync";
import type { AgentContext } from "@/lib/agents/registry";
import { AgentSkip } from "@/lib/agents/errors";

// Runs before the other agents (see registry.ts schedules) so Analytics,
// Trend, Idea, and Planning all work from fresh data instead of whatever
// was last manually synced. The Profile page's "Sync now" button still
// works independently for on-demand refreshes.
export async function runSyncAgent(ctx: AgentContext): Promise<string> {
  await ctx.log("Pulling latest reels, posts, and follower count from Instagram…");

  let summary: string;
  try {
    const result = await runInstagramSync();
    await ctx.log(
      `Synced @${result.username}: ${result.reelsSynced} reels, ${result.postsSynced} posts, ${result.followerCount} followers.`
    );
    summary = `Synced ${result.reelsSynced} reels and ${result.postsSynced} posts for @${result.username}.`;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("No Instagram account connected")) {
      throw new AgentSkip("Skipped: no Instagram account connected yet");
    }
    throw error;
  }

  await ctx.log("Syncing tracked competitors…");
  const competitorResult = await syncAllCompetitors();
  if (competitorResult.synced + competitorResult.failed > 0) {
    await ctx.log(
      `Competitors: ${competitorResult.synced} synced, ${competitorResult.failed} failed.`,
      competitorResult.failed > 0 ? "warn" : "info"
    );
    summary += ` Competitors: ${competitorResult.synced} synced${competitorResult.failed > 0 ? `, ${competitorResult.failed} failed` : ""}.`;
  }

  return summary;
}

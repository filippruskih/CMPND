import { runInstagramSync } from "@/lib/instagram/sync";
import type { AgentContext } from "@/lib/agents/registry";
import { AgentSkip } from "@/lib/agents/errors";

// Runs before the other agents (see registry.ts schedules) so Analytics,
// Trend, Idea, and Planning all work from fresh data instead of whatever
// was last manually synced. The Profile page's "Sync now" button still
// works independently for on-demand refreshes.
export async function runSyncAgent(ctx: AgentContext): Promise<string> {
  await ctx.log("Pulling latest reels, posts, and follower count from Instagram…");

  try {
    const result = await runInstagramSync();
    await ctx.log(
      `Synced @${result.username}: ${result.reelsSynced} reels, ${result.postsSynced} posts, ${result.followerCount} followers.`
    );
    return `Synced ${result.reelsSynced} reels and ${result.postsSynced} posts for @${result.username}.`;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("No Instagram account connected")) {
      throw new AgentSkip("Skipped: no Instagram account connected yet");
    }
    throw error;
  }
}

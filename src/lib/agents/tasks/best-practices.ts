import { db } from "@/lib/db";
import {
  anthropic,
  requireAnthropicKey,
  AGENT_MODEL,
  NO_EM_DASH_INSTRUCTION,
  NO_MARKDOWN_INSTRUCTION,
} from "@/lib/anthropic";
import { getReelsWithLatestInsights } from "@/lib/stats";
import { getPostsWithLatestInsights } from "@/lib/posts";
import { getLatestContentDna } from "@/lib/content-dna";
import type { AgentContext } from "@/lib/agents/registry";

const MIN_ITEMS_FOR_BEST_PRACTICES = 5;
const MAX_OPEN_AT_ONCE = 6;
const MAX_NEW_PER_RUN = 2;

const BEST_PRACTICE_SCHEMA = {
  type: "object",
  properties: {
    recommendations: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "A short, specific, imperative action - e.g. 'Start every reel with an on-screen question'",
          },
          description: {
            type: "string",
            description: "1-2 sentences explaining why, referencing the creator's actual data/history",
          },
        },
        required: ["title", "description"],
        additionalProperties: false,
      },
    },
  },
  required: ["recommendations"],
  additionalProperties: false,
};

// Runs as a step of the Analytics agent, alongside Content DNA - but
// unlike Content DNA (a narrative that gets fully replaced each run),
// these are durable action items that persist until the creator marks
// them done or dismisses them. The model is told what's already open or
// resolved so it only ever proposes genuinely new ones, and is capped so
// the list never floods past something a creator could realistically act
// on.
export async function updateBestPractices(ctx: AgentContext, sourceAgentRunId: string) {
  const [reels, posts, dna, existing] = await Promise.all([
    getReelsWithLatestInsights(),
    getPostsWithLatestInsights(),
    getLatestContentDna(),
    db.bestPractice.findMany({ orderBy: { createdAt: "desc" }, take: 30 }),
  ]);

  if (reels.length + posts.length < MIN_ITEMS_FOR_BEST_PRACTICES) {
    await ctx.log(
      `Skipping best-practice scan - need at least ${MIN_ITEMS_FOR_BEST_PRACTICES} reels/posts, have ${reels.length + posts.length}.`
    );
    return;
  }

  const openCount = existing.filter((b) => b.status === "open").length;
  if (openCount >= MAX_OPEN_AT_ONCE) {
    await ctx.log(`Already ${openCount} open best-practice items - skipping until some are resolved.`);
    return;
  }

  requireAnthropicKey();
  await ctx.log("Scanning your content for durable best-practice recommendations…");

  const reelLines = reels
    .slice(0, 30)
    .map(
      (r) =>
        `- Reel: "${r.caption ?? "(no caption)"}" - ${r.latestInsight?.views ?? "?"} plays, ${
          r.latestInsight?.avgWatchTimeMs != null && r.durationMs != null
            ? `${Math.round((r.latestInsight.avgWatchTimeMs / r.durationMs) * 100)}% avg watched`
            : "watch data n/a"
        }${r.format ? `, format: ${r.format}` : ""}`
    )
    .join("\n");
  const postLines = posts
    .slice(0, 20)
    .map((p) => `- Post (${p.mediaType}): "${p.caption ?? "(no caption)"}" - ${p.latestInsight?.reach ?? "?"} reach`)
    .join("\n");

  const response = await anthropic.messages.create({
    model: AGENT_MODEL,
    max_tokens: 800,
    thinking: { type: "disabled" },
    output_config: { format: { type: "json_schema", schema: BEST_PRACTICE_SCHEMA } },
    messages: [
      {
        role: "user",
        content: `You are reviewing a content creator's full Instagram history to find durable, high-conviction best-practice recommendations - things you are genuinely confident they should change or start doing, based on patterns in their own data, that they are not already doing consistently.

${dna ? `Their Content DNA:\n${dna.narrative}\n` : ""}
Their reels:
${reelLines || "(none)"}

Their posts:
${postLines || "(none)"}

Recommendations already open (don't repeat these, even reworded):
${existing.filter((b) => b.status === "open").map((b) => `- ${b.title}`).join("\n") || "(none)"}

Recommendations already resolved (also don't repeat unless genuinely new evidence contradicts them):
${existing.filter((b) => b.status !== "open").map((b) => `- ${b.title}`).join("\n") || "(none)"}

Only propose a recommendation if you are highly confident it's correct and actionable based on the actual data above - not generic social-media advice. It's completely fine to return zero if nothing new and well-supported stands out. Return at most ${MAX_NEW_PER_RUN}.

${NO_EM_DASH_INSTRUCTION}
${NO_MARKDOWN_INSTRUCTION}`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    await ctx.log("Best-practice scan returned no text content.", "warn");
    return;
  }

  const parsed = JSON.parse(textBlock.text) as {
    recommendations: { title: string; description: string }[];
  };
  const recommendations = parsed.recommendations.slice(0, MAX_NEW_PER_RUN);

  if (recommendations.length === 0) {
    await ctx.log("No new best-practice recommendations this run.");
    return;
  }

  await db.bestPractice.createMany({
    data: recommendations.map((r) => ({
      title: r.title,
      description: r.description,
      sourceAgentRunId,
      status: "open",
    })),
  });

  await ctx.log(`${recommendations.length} new best-practice recommendation(s) added.`);
}

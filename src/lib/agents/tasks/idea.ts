import { db } from "@/lib/db";
import { anthropic, requireAnthropicKey, AGENT_MODEL, NO_EM_DASH_INSTRUCTION } from "@/lib/anthropic";
import { getAgentSettings, parseExcludedTopics } from "@/lib/agent-settings";
import type { AgentContext } from "@/lib/agents/registry";
import { AgentSkip } from "@/lib/agents/errors";

async function getLatestAgentOutput(key: string): Promise<string | null> {
  const run = await db.agentRun.findFirst({
    where: { agent: { key }, status: "succeeded" },
    orderBy: { startedAt: "desc" },
  });
  return run?.outputSummary ?? null;
}

async function getRecentCaptions(): Promise<string[]> {
  const reels = await db.reel.findMany({
    orderBy: { postedAt: "desc" },
    take: 10,
    select: { caption: true },
  });
  return reels.map((r) => r.caption).filter((c): c is string => !!c);
}

interface IdeaItem {
  concept: string;
  why: string;
}

const IDEA_SCHEMA = {
  type: "object",
  properties: {
    nicheIdeas: {
      type: "array",
      description: "Ideas that build on this creator's existing niche/Content DNA - refining what already works",
      items: {
        type: "object",
        properties: {
          concept: { type: "string", description: "A one-line concept for the reel" },
          why: { type: "string", description: "Why this fits their established niche and what's worked before" },
        },
        required: ["concept", "why"],
        additionalProperties: false,
      },
    },
    freshIdeas: {
      type: "array",
      description: "Ideas exploring a new but related topic or angle currently trending in their niche, which they haven't covered yet",
      items: {
        type: "object",
        properties: {
          concept: { type: "string", description: "A one-line concept for the reel" },
          why: { type: "string", description: "Why this trending topic/angle is worth trying even though it's new territory" },
        },
        required: ["concept", "why"],
        additionalProperties: false,
      },
    },
  },
  required: ["nicheIdeas", "freshIdeas"],
  additionalProperties: false,
};

function formatIdeaList(label: string, items: IdeaItem[]): string {
  if (items.length === 0) return "";
  return `${label}:\n${items.map((i) => `- ${i.concept} - ${i.why}`).join("\n")}\n`;
}

export async function runIdeaAgent(ctx: AgentContext): Promise<string> {
  await ctx.log("Reading the latest trend research…");
  const trends = await getLatestAgentOutput("trend");

  if (!trends) {
    await ctx.log(
      "No trend research available yet - run the Trend agent first for grounded ideas.",
      "warn"
    );
    throw new AgentSkip("Skipped: no trend research to build on yet");
  }

  const dnaProfile = await db.contentDnaProfile.findFirst({ orderBy: { generatedAt: "desc" } });
  const dna = dnaProfile?.narrative ?? null;
  const recentCaptions = await getRecentCaptions();
  const settings = await getAgentSettings();
  const excludedTopics = parseExcludedTopics(settings.excludedTopics);

  requireAnthropicKey();
  await ctx.log("Generating video ideas, split into niche and fresh-territory buckets…");

  const response = await anthropic.messages.create({
    model: AGENT_MODEL,
    max_tokens: 1000,
    thinking: { type: "disabled" },
    output_config: { format: { type: "json_schema", schema: IDEA_SCHEMA } },
    messages: [
      {
        role: "user",
        content: `You are the idea-generation agent for a creator's Instagram Reels dashboard.

Current trend research:
${trends}

${dna ? `This creator's Content DNA (what has historically worked for them):\n${dna}\n` : ""}
Reels they've already posted recently (don't repeat these):
${recentCaptions.map((c) => `- ${c}`).join("\n") || "(none yet)"}

${
  excludedTopics.length > 0
    ? `This creator never wants to see ideas about the following - do not suggest anything touching these, even tangentially:\n${excludedTopics.map((t) => `- ${t}`).join("\n")}\n`
    : ""
}Generate two distinct sets of concrete, specific video ideas for their next reel:
1. "nicheIdeas" (2 ideas) - building on this creator's existing niche and what has already worked for them.
2. "freshIdeas" (2 ideas) - genuinely new topics or angles that are currently trending in their niche right now (from the trend research above) which they have not covered yet, to help them expand their range.

Keep each idea concise. Ground every idea in the trend research and/or Content DNA given, not generic advice.

${NO_EM_DASH_INSTRUCTION}`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Idea response had no text content");
  }
  const parsed = JSON.parse(textBlock.text) as { nicheIdeas: IdeaItem[]; freshIdeas: IdeaItem[] };

  await db.ideaBatch.create({
    data: {
      nicheIdeasJson: JSON.stringify(parsed.nicheIdeas),
      freshIdeasJson: JSON.stringify(parsed.freshIdeas),
      sourceAgentRunId: ctx.runId,
    },
  });

  const summary =
    formatIdeaList("Within your niche", parsed.nicheIdeas) +
    formatIdeaList("New territory", parsed.freshIdeas);

  await ctx.log("Ideas ready.");

  return summary.trim() || "No ideas generated.";
}

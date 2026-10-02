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
  await ctx.log("Generating video ideas…");

  const response = await anthropic.messages.create({
    model: AGENT_MODEL,
    max_tokens: 800,
    thinking: { type: "disabled" },
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
}Generate 3 concrete, specific video ideas for their next reel, grounded in the trend research above and (if given) their Content DNA. Aim for a mix, not three variations of the same thing: about 2 ideas that build on this creator's existing niche and what has already worked for them, and at least 1 idea that explores a new but related topic or angle they haven't covered yet, to help them expand their range. Label each idea as either "within your niche" or "new territory". For each idea give: a one-line concept, and why it fits both the trend and their niche (or why the stretch is worth trying). Keep it under 300 words total.

${NO_EM_DASH_INSTRUCTION}`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  const ideas = textBlock && textBlock.type === "text" ? textBlock.text.trim() : "";
  await ctx.log("Ideas ready.");

  return ideas || "No ideas generated.";
}

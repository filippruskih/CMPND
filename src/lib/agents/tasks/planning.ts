import { db } from "@/lib/db";
import { anthropic, requireAnthropicKey, AGENT_MODEL, NO_EM_DASH_INSTRUCTION } from "@/lib/anthropic";
import { getAgentSettings, parseExcludedTopics } from "@/lib/agent-settings";
import type { AgentContext } from "@/lib/agents/registry";
import { AgentSkip } from "@/lib/agents/errors";

const RECENT_CAPTIONS_FOR_NICHE = 10;

const PLAN_SCHEMA = {
  type: "object",
  properties: {
    plans: {
      type: "array",
      // Claude's structured-output schema only allows minItems/maxItems of
      // 0 or 1 on arrays (anything else, e.g. requiring exactly 3, is
      // rejected as invalid_request_error) - "exactly 3" is enforced via
      // the prompt instead, with defensive slicing below.
      items: {
        type: "object",
        properties: {
          hook: {
            type: "string",
            description: "A punchy opening line for the reel, spoken in the first 1-2 seconds",
          },
          script: {
            type: "string",
            description: "A concise beat-by-beat script or outline for the full reel",
          },
        },
        required: ["hook", "script"],
        additionalProperties: false,
      },
    },
    post: {
      type: "object",
      description: "One picture/carousel post idea, separate from the reel plans",
      properties: {
        concept: {
          type: "string",
          description: "What to shoot/post - a single photo or carousel concept",
        },
        caption: {
          type: "string",
          description: "A ready-to-post Instagram caption for this post",
        },
      },
      required: ["concept", "caption"],
      additionalProperties: false,
    },
    story: {
      type: "object",
      description:
        "One Instagram Story idea, deliberately outside this creator's main content niche - general lifestyle or fitness themed instead, to diversify their stories",
      properties: {
        concept: {
          type: "string",
          description: "What to post as a story - a single frame/moment idea, not a multi-scene script",
        },
        caption: {
          type: "string",
          description: "Suggested on-screen text or caption overlay for the story",
        },
      },
      required: ["concept", "caption"],
      additionalProperties: false,
    },
  },
  required: ["plans", "post", "story"],
  additionalProperties: false,
};

async function getRecentCaptions(): Promise<string[]> {
  const reels = await db.reel.findMany({
    orderBy: { postedAt: "desc" },
    take: RECENT_CAPTIONS_FOR_NICHE,
    select: { caption: true },
  });
  return reels.map((r) => r.caption).filter((c): c is string => !!c);
}

export async function runPlanningAgent(ctx: AgentContext): Promise<string> {
  await ctx.log("Reading the latest ideas…");
  const ideaRun = await db.agentRun.findFirst({
    where: { agent: { key: "idea" }, status: "succeeded" },
    orderBy: { startedAt: "desc" },
  });

  if (!ideaRun?.outputSummary) {
    await ctx.log("No ideas available yet - run the Idea agent first.", "warn");
    throw new AgentSkip("Skipped: no ideas to plan from yet");
  }

  const [settings, recentCaptions] = await Promise.all([getAgentSettings(), getRecentCaptions()]);
  const excludedTopics = parseExcludedTopics(settings.excludedTopics);

  requireAnthropicKey();
  await ctx.log("Turning today's ideas into 3 ready-to-film hook + script options, a post, and a story idea…");

  const response = await anthropic.messages.create({
    model: AGENT_MODEL,
    max_tokens: 2000,
    thinking: { type: "disabled" },
    output_config: { format: { type: "json_schema", schema: PLAN_SCHEMA } },
    messages: [
      {
        role: "user",
        content: `Here are candidate video ideas for a creator's next Instagram Reel:\n\n${ideaRun.outputSummary}\n\nPick exactly 3 of the strongest, most distinct ideas from these candidates (or close variations of them) and turn each into its own concrete, ready-to-film hook and script for today. The "plans" array in your response must contain exactly 3 items - not fewer, not more. Give the creator genuine variety to choose from - not three versions of the same idea.\n\nSeparately, also suggest one picture or carousel post idea for today (not a reel) - grounded in the same trends/niche context, but a concept suited to a still photo or a short carousel rather than video. Give a concrete concept and a ready-to-post caption.\n\nHere are captions from this creator's recent reels, to infer their main content niche:\n${recentCaptions.map((c) => `- ${c}`).join("\n") || "(none yet)"}\n\nSeparately from the above, also suggest one Instagram Story idea for today that is deliberately NOT about that inferred niche - keep it general lifestyle or fitness content instead (not tied to their specific industry/work content), to give their stories some variety outside their main pillar. A story is a single moment/frame, not a multi-scene script - keep the concept short.\n\n${
          excludedTopics.length > 0
            ? `This creator never wants content about the following - do not suggest anything touching these, even tangentially, for the reel/post ideas:\n${excludedTopics.map((t) => `- ${t}`).join("\n")}\n\n`
            : ""
        }${NO_EM_DASH_INSTRUCTION}`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Planning response had no text content");
  }
  const parsed = JSON.parse(textBlock.text) as {
    plans: { hook: string; script: string }[];
    post: { concept: string; caption: string };
    story: { concept: string; caption: string };
  };
  const plans = parsed.plans.slice(0, 3);

  if (plans.length === 0) {
    throw new Error("Planning response had no plans");
  }

  await db.suggestion.createMany({
    data: plans.map((plan) => ({
      type: "reel",
      hook: plan.hook,
      script: plan.script,
      sourceAgentRunId: ideaRun.id,
      status: "new",
    })),
  });

  if (parsed.post?.concept && parsed.post?.caption) {
    await db.suggestion.create({
      data: {
        type: "post",
        concept: parsed.post.concept,
        caption: parsed.post.caption,
        sourceAgentRunId: ideaRun.id,
        status: "new",
      },
    });
  }

  if (parsed.story?.concept && parsed.story?.caption) {
    await db.suggestion.create({
      data: {
        type: "story",
        concept: parsed.story.concept,
        caption: parsed.story.caption,
        sourceAgentRunId: ideaRun.id,
        status: "new",
      },
    });
  }

  await ctx.log(`${plans.length} reel options ready, plus a post and a story idea. Starting with: "${plans[0].hook}"`);

  return `${plans.length} hook/script options ready, plus a post and a story idea - starting with: "${plans[0].hook}"`;
}

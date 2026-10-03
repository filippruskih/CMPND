import { db } from "@/lib/db";
import { anthropic, requireAnthropicKey, AGENT_MODEL, NO_EM_DASH_INSTRUCTION } from "@/lib/anthropic";

const RECENT_CAPTIONS_FOR_NICHE = 15;

const DISCOVER_SCHEMA = {
  type: "object",
  properties: {
    accounts: {
      type: "array",
      items: {
        type: "object",
        properties: {
          username: {
            type: "string",
            description: "The account's Instagram handle, without the @ symbol",
          },
          reason: {
            type: "string",
            description: "One short sentence on why this account is relevant to track",
          },
        },
        required: ["username", "reason"],
        additionalProperties: false,
      },
    },
  },
  required: ["accounts"],
  additionalProperties: false,
};

export interface SuggestedAccount {
  username: string;
  reason: string;
}

async function getNicheContext(): Promise<string | null> {
  const reels = await db.reel.findMany({
    orderBy: { postedAt: "desc" },
    take: RECENT_CAPTIONS_FOR_NICHE,
    select: { caption: true, topicTags: true },
  });
  const captions = reels.map((r) => r.caption).filter((c): c is string => !!c);
  if (captions.length === 0) return null;
  return captions.map((c) => `- ${c}`).join("\n");
}

// Claude's web search can hallucinate or surface inactive/private handles,
// so this deliberately returns suggestions for the user to review and
// one-click "Track" rather than auto-adding anything to the Competitor
// table directly.
export async function discoverNicheAccounts(): Promise<SuggestedAccount[]> {
  const nicheContext = await getNicheContext();
  if (!nicheContext) {
    throw new Error("No reels synced yet - can't infer a niche to search for similar accounts.");
  }

  const existing = await db.competitor.findMany({ select: { username: true } });
  const excludeUsernames = existing.map((c) => c.username.toLowerCase());

  requireAnthropicKey();

  const response = await anthropic.messages.create({
    model: AGENT_MODEL,
    max_tokens: 1200,
    thinking: { type: "disabled" },
    tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 5 }],
    output_config: { format: { type: "json_schema", schema: DISCOVER_SCHEMA } },
    messages: [
      {
        role: "user",
        content: `Here are captions from this creator's recent Instagram Reels:\n\n${nicheContext}\n\nBased on this, infer their content niche, then search the web for real, currently-active public Instagram accounts (Business or Creator accounts, not private) in the same or an adjacent niche that would be useful to benchmark against. Prioritize accounts with a similar size/stage, not just the biggest names. Return up to 6 accounts, each with just their Instagram username and a one-sentence reason.${
          excludeUsernames.length > 0
            ? ` Don't suggest any of these, already tracked: ${excludeUsernames.join(", ")}.`
            : ""
        }\n\n${NO_EM_DASH_INSTRUCTION}`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") return [];

  const parsed = JSON.parse(textBlock.text) as { accounts: SuggestedAccount[] };
  return parsed.accounts
    .filter((a) => a.username && !excludeUsernames.includes(a.username.toLowerCase()))
    .slice(0, 6);
}

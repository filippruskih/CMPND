import { db } from "@/lib/db";
import {
  anthropic,
  requireAnthropicKey,
  AGENT_MODEL,
  NO_EM_DASH_INSTRUCTION,
  NO_MARKDOWN_INSTRUCTION,
} from "@/lib/anthropic";
import { getFeedbackLoop } from "@/lib/feedback";
import { getLatestContentDna } from "@/lib/content-dna";
import { formatLabel } from "@/lib/content/classify";
import { formatCompactNumber, formatPercent, formatSecondsFromMs } from "@/lib/format";

function describeBaseline(baseline: {
  label: string;
  sampleSize: number;
  available: boolean;
  avgViews: number | null;
  avgEngagementRate: number | null;
  avgWatchTimeMs: number | null;
}): string | null {
  if (!baseline.available || baseline.sampleSize === 0) return null;
  const parts: string[] = [];
  if (baseline.avgViews != null) parts.push(`${formatCompactNumber(baseline.avgViews)} avg plays`);
  if (baseline.avgEngagementRate != null)
    parts.push(`${formatPercent(baseline.avgEngagementRate)} avg engagement`);
  if (baseline.avgWatchTimeMs != null)
    parts.push(`${formatSecondsFromMs(baseline.avgWatchTimeMs)} avg watch time`);
  if (parts.length === 0) return null;
  return `${baseline.label} (${baseline.sampleSize} reels): ${parts.join(", ")}`;
}

// User-triggered (the reel detail page's "Run analysis" / "Regenerate"
// button), not scheduled - re-runnable since more insight snapshots
// accrue over time and the answer can change.
export async function analyzeReelPerformance(reelId: string): Promise<string> {
  const [feedback, dna] = await Promise.all([getFeedbackLoop(reelId), getLatestContentDna()]);
  if (!feedback) throw new Error("Reel not found");

  const { reel, baselines } = feedback;
  const insight = reel.latestInsight;
  const topics: string[] = reel.topicTags ? (JSON.parse(reel.topicTags) as string[]) : [];

  const baselineLines = baselines.map(describeBaseline).filter((l): l is string => l != null);

  requireAnthropicKey();

  const response = await anthropic.messages.create({
    model: AGENT_MODEL,
    max_tokens: 700,
    thinking: { type: "disabled" },
    messages: [
      {
        role: "user",
        content: `You are explaining why one specific Instagram Reel performed the way it did, for the creator who posted it.

This reel:
- Caption: "${reel.caption ?? "(no caption)"}"
- Format: ${reel.format ? formatLabel(reel.format) : "unclassified"}
- Topics: ${topics.length > 0 ? topics.join(", ") : "none tagged"}
- Length: ${reel.durationMs != null ? formatSecondsFromMs(reel.durationMs) : "unknown"}
- Plays: ${insight?.views != null ? formatCompactNumber(insight.views) : "unknown"}
- Engagement rate: ${insight?.engagementRate != null ? formatPercent(insight.engagementRate) : "unknown"}
- Avg watch time: ${insight?.avgWatchTimeMs != null ? formatSecondsFromMs(insight.avgWatchTimeMs) : "unknown"}

How it compares to this creator's own history:
${baselineLines.join("\n") || "(not enough history yet for any baseline)"}

${dna ? `This creator's Content DNA (what has historically worked for them):\n${dna.narrative}\n` : ""}
Write a concise, specific explanation (3-5 sentences) of why this reel over- or under-performed relative to the baselines above. Reference the actual numbers given - never invent a number that isn't in the data above. If it outperformed, say what likely drove that and whether it's repeatable. If it underperformed, say what specifically to change next time. If there isn't enough comparison data to say anything meaningful, say so plainly instead of guessing.

${NO_EM_DASH_INSTRUCTION}
${NO_MARKDOWN_INSTRUCTION}`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  const analysis = textBlock && textBlock.type === "text" ? textBlock.text.trim() : "";
  if (!analysis) throw new Error("Analysis response had no text content");

  await db.reel.update({
    where: { id: reelId },
    data: { performanceAnalysis: analysis, performanceAnalysisAt: new Date() },
  });

  return analysis;
}

import { db } from "@/lib/db";
import {
  anthropic,
  requireAnthropicKey,
  AGENT_MODEL,
  NO_EM_DASH_INSTRUCTION,
  NO_MARKDOWN_INSTRUCTION,
} from "@/lib/anthropic";
import { getMediaVideoUrl } from "@/lib/instagram/client";
import { extractFrames } from "@/lib/video/frames";
import { formatPercent, formatSecondsFromMs } from "@/lib/format";
import type Anthropic from "@anthropic-ai/sdk";

// User-triggered, re-runnable. Explicitly a hypothesis: Instagram's Graph
// API exposes no per-second retention curve for a reel, only the single
// average-watch-time number already synced - this infers a *likely*
// drop-off pattern from the reel's actual frames plus that one real
// number, it does not read measured per-second data because no such data
// is available to any API caller, including the account owner.
export async function analyzeRetentionDropoff(reelId: string): Promise<string> {
  const reel = await db.reel.findUnique({
    where: { id: reelId },
    include: { insights: { orderBy: { capturedAt: "desc" }, take: 1 } },
  });
  if (!reel) throw new Error("Reel not found");

  const avgWatchTimeMs = reel.insights[0]?.avgWatchTimeMs;
  if (!reel.durationMs || !avgWatchTimeMs) {
    throw new Error(
      "Needs both a synced reel length and an average watch time first - run a sync if this reel is recent."
    );
  }

  const account = await db.account.findFirst();
  if (!account) throw new Error("No Instagram account connected.");

  const videoUrl = await getMediaVideoUrl(account.accessToken, reel.igMediaId);
  if (!videoUrl) {
    throw new Error("Could not fetch this reel's video from Instagram - it may have been deleted.");
  }

  const frames = await extractFrames(videoUrl);
  if (frames.length === 0) throw new Error("Couldn't extract any frames from this video.");

  const retentionRate = Math.min(1, avgWatchTimeMs / reel.durationMs);

  requireAnthropicKey();

  const imageBlocks: Anthropic.ContentBlockParam[] = frames.flatMap((frame) => [
    { type: "text", text: `Frame at ~${frame.timestampSeconds}s:` },
    { type: "image", source: { type: "base64", media_type: "image/jpeg", data: frame.base64 } },
  ]);

  const response = await anthropic.messages.create({
    model: AGENT_MODEL,
    max_tokens: 700,
    thinking: { type: "disabled" },
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `The following are ${frames.length} evenly-spaced frames sampled from an Instagram Reel this creator already posted, in chronological order, covering its full ${formatSecondsFromMs(reel.durationMs)} length. There is no audio/transcript - analyze the visuals only.

Real measured data: viewers watched an average of ${formatSecondsFromMs(avgWatchTimeMs)} of this reel - ${formatPercent(retentionRate)} of its total length. Instagram does not expose a per-second retention curve to anyone, including the account owner, so there is no measured data on exactly where within the reel viewers stopped watching - only this one aggregate average.`,
          },
          ...imageBlocks,
          {
            type: "text",
            text: `Based on the visual pacing, structure, and content shown in these frames, hypothesize where in the reel viewers most likely dropped off and why, reasoning from the ${formatPercent(retentionRate)} average retention figure and typical short-form video attention patterns (e.g. a weak opening, a slow middle section, a payoff that comes too late). Reference specific frames/timestamps. Be explicit that this is a hypothesis inferred from the visuals and the one real number given, not measured per-second data - do not present it as if it were. End with one concrete, specific change that would most likely improve retention next time.

${NO_EM_DASH_INSTRUCTION}
${NO_MARKDOWN_INSTRUCTION}`,
          },
        ],
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  const analysis = textBlock && textBlock.type === "text" ? textBlock.text.trim() : "";
  if (!analysis) throw new Error("Analysis response had no text content");

  await db.reel.update({
    where: { id: reelId },
    data: { retentionHypothesis: analysis, retentionHypothesisAt: new Date() },
  });

  return analysis;
}

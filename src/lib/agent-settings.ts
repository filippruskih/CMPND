import { db } from "@/lib/db";

// Single-row settings, same pattern as Account - created lazily on first
// read rather than via a seed script.
export async function getAgentSettings() {
  const existing = await db.agentSettings.findFirst();
  if (existing) return existing;
  return db.agentSettings.create({ data: {} });
}

export function parseExcludedTopics(excludedTopics: string | null): string[] {
  if (!excludedTopics) return [];
  return excludedTopics
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

import { db } from "@/lib/db";
import { getBusinessDiscovery } from "./client";

export interface CompetitorSyncResult {
  username: string;
  mediaSynced: number;
}

// Syncs one tracked competitor via Business Discovery, using the
// connected account's own access token (the query is made *as* that
// account looking *at* the competitor's public data - see client.ts).
// Errors are recorded on the row rather than thrown, so one bad username
// doesn't stop the rest of the batch (see syncAllCompetitors).
export async function syncCompetitor(competitorId: string): Promise<CompetitorSyncResult> {
  const [competitor, account] = await Promise.all([
    db.competitor.findUniqueOrThrow({ where: { id: competitorId } }),
    db.account.findFirst(),
  ]);

  if (!account) {
    throw new Error("No Instagram account connected - can't query Business Discovery without one.");
  }

  const discovery = await getBusinessDiscovery(account.accessToken, account.igUserId, competitor.username);
  if (!discovery) {
    throw new Error(`@${competitor.username} isn't a public Business/Creator account, or doesn't exist.`);
  }

  await db.$transaction([
    db.competitor.update({
      where: { id: competitorId },
      data: {
        followersCount: discovery.followersCount,
        mediaCount: discovery.mediaCount,
        lastSyncedAt: new Date(),
        lastSyncError: null,
      },
    }),
    db.competitorSnapshot.create({
      data: {
        competitorId,
        followersCount: discovery.followersCount,
        mediaCount: discovery.mediaCount,
      },
    }),
  ]);

  for (const item of discovery.media) {
    await db.competitorMedia.upsert({
      where: { igMediaId: item.igMediaId },
      create: {
        competitorId,
        igMediaId: item.igMediaId,
        mediaType: item.mediaType,
        mediaProductType: item.mediaProductType,
        caption: item.caption,
        permalink: item.permalink,
        thumbnailUrl: item.thumbnailUrl,
        postedAt: new Date(item.timestamp),
        likeCount: item.likeCount,
        commentsCount: item.commentsCount,
      },
      update: {
        caption: item.caption,
        thumbnailUrl: item.thumbnailUrl,
        likeCount: item.likeCount,
        commentsCount: item.commentsCount,
      },
    });
  }

  return { username: discovery.username, mediaSynced: discovery.media.length };
}

export async function syncAllCompetitors(): Promise<{ synced: number; failed: number }> {
  const competitors = await db.competitor.findMany({ select: { id: true, username: true } });
  let synced = 0;
  let failed = 0;

  for (const competitor of competitors) {
    try {
      await syncCompetitor(competitor.id);
      synced++;
    } catch (error) {
      failed++;
      const message = error instanceof Error ? error.message : String(error);
      await db.competitor.update({
        where: { id: competitor.id },
        data: { lastSyncError: message },
      });
    }
  }

  return { synced, failed };
}

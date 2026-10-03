import { db } from "@/lib/db";

export async function getCompetitors() {
  return db.competitor.findMany({ orderBy: { createdAt: "asc" } });
}

export async function getCompetitorDetail(id: string) {
  const competitor = await db.competitor.findUnique({
    where: { id },
    include: {
      media: { orderBy: { postedAt: "desc" } },
      snapshots: { orderBy: { capturedAt: "asc" } },
    },
  });
  if (!competitor) return null;

  // Likes+comments-per-follower is the standard proxy for "engagement
  // rate" on public accounts where reach isn't visible to anyone but the
  // owner - not directly comparable to this app's own reach-based
  // engagement rate, so it's always labeled distinctly in the UI.
  const mediaWithProxyRate = competitor.media.map((m) => ({
    ...m,
    proxyEngagementRate:
      competitor.followersCount && (m.likeCount != null || m.commentsCount != null)
        ? ((m.likeCount ?? 0) + (m.commentsCount ?? 0)) / competitor.followersCount
        : null,
  }));

  return { ...competitor, media: mediaWithProxyRate };
}

import { IG_GRAPH_BASE } from "./config";

async function igFetch(path: string, accessToken: string, params: Record<string, string> = {}) {
  const url = new URL(`${IG_GRAPH_BASE}${path}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  url.searchParams.set("access_token", accessToken);

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`Instagram API error on ${path}: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

export interface InstagramProfile {
  id: string;
  username: string;
  accountType: string | null;
  mediaCount: number;
  followersCount: number;
  followsCount: number;
}

export async function getProfile(accessToken: string): Promise<InstagramProfile> {
  const json = await igFetch("/me", accessToken, {
    fields: "id,username,account_type,media_count,followers_count,follows_count",
  });
  return {
    id: json.id,
    username: json.username,
    accountType: json.account_type ?? null,
    mediaCount: json.media_count ?? 0,
    followersCount: json.followers_count ?? 0,
    followsCount: json.follows_count ?? 0,
  };
}

export interface InstagramMedia {
  id: string;
  mediaType: string;
  mediaProductType: string | null;
  permalink: string;
  caption: string | null;
  timestamp: string;
  thumbnailUrl: string | null;
  // The raw video/image file - only used transiently during sync (e.g. to
  // probe a reel's duration), never persisted, since Instagram's media_url
  // is a short-lived signed URL that goes stale.
  mediaUrl: string | null;
}

// The /media edge has no server-side filter by content type, so we page
// through recent media once and let the caller split by
// media_product_type (REELS vs FEED) — one paginated fetch serves both
// content types instead of two separate walks.
export async function getRecentMedia(
  accessToken: string,
  igUserId: string,
  limit = 50
): Promise<InstagramMedia[]> {
  const media: InstagramMedia[] = [];
  let after: string | undefined;

  while (media.length < limit) {
    const json = await igFetch(`/${igUserId}/media`, accessToken, {
      // thumbnail_url is only populated for VIDEO/REELS media — photos and
      // carousels return it empty, so media_url is the fallback image
      // source for those (confirmed against real account data).
      fields:
        "id,media_type,media_product_type,permalink,caption,timestamp,thumbnail_url,media_url",
      limit: "25",
      ...(after ? { after } : {}),
    });

    const items: InstagramMedia[] = (json.data ?? []).map(
      (item: {
        id: string;
        media_type: string;
        media_product_type: string | null;
        permalink: string;
        caption: string | null;
        timestamp: string;
        thumbnail_url: string | null;
        media_url: string | null;
      }) => ({
        id: item.id,
        mediaType: item.media_type,
        mediaProductType: item.media_product_type ?? null,
        permalink: item.permalink,
        caption: item.caption ?? null,
        timestamp: item.timestamp,
        thumbnailUrl: item.thumbnail_url ?? item.media_url ?? null,
        mediaUrl: item.media_url ?? null,
      })
    );

    media.push(...items);

    after = json.paging?.cursors?.after;
    if (!after || items.length === 0) break;
  }

  return media.slice(0, limit);
}

const REEL_INSIGHT_METRICS = [
  "views",
  "likes",
  "comments",
  "shares",
  "saved",
  "reach",
  "total_interactions",
  "ig_reels_avg_watch_time",
];

export interface ReelInsights {
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  saved: number | null;
  reach: number | null;
  totalInteractions: number | null;
  avgWatchTimeMs: number | null;
}

export async function getReelInsights(
  accessToken: string,
  mediaId: string
): Promise<ReelInsights> {
  const json = await igFetch(`/${mediaId}/insights`, accessToken, {
    metric: REEL_INSIGHT_METRICS.join(","),
  });

  const values: Record<string, number> = {};
  for (const entry of json.data ?? []) {
    const value = entry.values?.[0]?.value ?? entry.total_value?.value;
    if (typeof value === "number") values[entry.name] = value;
  }

  return {
    views: values.views ?? null,
    likes: values.likes ?? null,
    comments: values.comments ?? null,
    shares: values.shares ?? null,
    saved: values.saved ?? null,
    reach: values.reach ?? null,
    totalInteractions: values.total_interactions ?? null,
    avgWatchTimeMs: values.ig_reels_avg_watch_time ?? null,
  };
}

// Verified live against a real Feed post: reach/likes/comments/saved/
// shares/total_interactions/views are all supported for FEED media.
// `impressions` is confirmed dead (Meta rejects it) and the Reels-only
// watch-time/skip-rate metrics don't apply here.
const POST_INSIGHT_METRICS = [
  "views",
  "likes",
  "comments",
  "shares",
  "saved",
  "reach",
  "total_interactions",
];

export interface PostInsights {
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  saved: number | null;
  reach: number | null;
  totalInteractions: number | null;
}

export async function getPostInsights(accessToken: string, mediaId: string): Promise<PostInsights> {
  const json = await igFetch(`/${mediaId}/insights`, accessToken, {
    metric: POST_INSIGHT_METRICS.join(","),
  });

  const values: Record<string, number> = {};
  for (const entry of json.data ?? []) {
    const value = entry.values?.[0]?.value ?? entry.total_value?.value;
    if (typeof value === "number") values[entry.name] = value;
  }

  return {
    views: values.views ?? null,
    likes: values.likes ?? null,
    comments: values.comments ?? null,
    shares: values.shares ?? null,
    saved: values.saved ?? null,
    reach: values.reach ?? null,
    totalInteractions: values.total_interactions ?? null,
  };
}

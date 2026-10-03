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

// The follows_and_unfollows metric is only returned once an account has 100+
// followers, and its availability on Instagram-Login apps (vs the older
// Facebook-Page-linked Graph API) hasn't been confirmed by hitting a real
// account yet - callers must treat a failure here as "data unavailable", not
// a sync-breaking error.
export interface FollowsAndUnfollows {
  follows: number;
  unfollows: number;
}

export async function getFollowsAndUnfollows(
  accessToken: string,
  igUserId: string,
  since: Date,
  until: Date
): Promise<FollowsAndUnfollows | null> {
  const json = await igFetch(`/${igUserId}/insights`, accessToken, {
    metric: "follows_and_unfollows",
    period: "day",
    metric_type: "total_value",
    breakdown: "follow_type",
    since: String(Math.floor(since.getTime() / 1000)),
    until: String(Math.floor(until.getTime() / 1000)),
  });

  const results = json.data?.[0]?.total_value?.breakdowns?.[0]?.results;
  if (!Array.isArray(results)) return null;

  let follows = 0;
  let unfollows = 0;
  for (const r of results) {
    const type = r.dimension_values?.[0];
    const value = typeof r.value === "number" ? r.value : 0;
    if (type === "FOLLOWER") follows += value;
    else if (type === "NON_FOLLOWER") unfollows += value;
  }
  return { follows, unfollows };
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

export interface BusinessDiscoveryMedia {
  igMediaId: string;
  mediaType: string | null;
  mediaProductType: string | null;
  caption: string | null;
  permalink: string;
  thumbnailUrl: string | null;
  timestamp: string;
  likeCount: number | null;
  commentsCount: number | null;
}

export interface BusinessDiscoveryResult {
  username: string;
  followersCount: number | null;
  mediaCount: number | null;
  media: BusinessDiscoveryMedia[];
}

// "Business Discovery" - the only ToS-compliant way to see another
// public Business/Creator account's data through the Graph API: it only
// exposes public-facing fields (follower count, posts, likes, comments),
// never reach/views/saves/watch-time, since those require the other
// account's own access token, not ours. Requires `myIgUserId` (your own
// connected account) because the query is made *as* your account looking
// *at* theirs, not a generic lookup.
export async function getBusinessDiscovery(
  accessToken: string,
  myIgUserId: string,
  targetUsername: string
): Promise<BusinessDiscoveryResult | null> {
  const mediaFields =
    "caption,like_count,comments_count,media_type,media_product_type,permalink,thumbnail_url,timestamp";
  const json = await igFetch(`/${myIgUserId}`, accessToken, {
    fields: `business_discovery.username(${targetUsername}){username,followers_count,media_count,media.limit(25){${mediaFields}}}`,
  });

  const discovery = json.business_discovery;
  if (!discovery) return null;

  const media: BusinessDiscoveryMedia[] = (discovery.media?.data ?? []).map(
    (item: {
      id: string;
      media_type: string | null;
      media_product_type: string | null;
      caption: string | null;
      permalink: string;
      thumbnail_url: string | null;
      timestamp: string;
      like_count: number | null;
      comments_count: number | null;
    }) => ({
      igMediaId: item.id,
      mediaType: item.media_type ?? null,
      mediaProductType: item.media_product_type ?? null,
      caption: item.caption ?? null,
      permalink: item.permalink,
      thumbnailUrl: item.thumbnail_url ?? null,
      timestamp: item.timestamp,
      likeCount: item.like_count ?? null,
      commentsCount: item.comments_count ?? null,
    })
  );

  return {
    username: discovery.username,
    followersCount: discovery.followers_count ?? null,
    mediaCount: discovery.media_count ?? null,
    media,
  };
}

// media_url is a short-lived signed URL that goes stale, so it's never
// persisted (see InstagramMedia) - this re-fetches a fresh one for a
// media item that was already synced, e.g. to extract frames from an
// already-posted reel for the retention-hypothesis analysis.
export async function getMediaVideoUrl(accessToken: string, mediaId: string): Promise<string | null> {
  const json = await igFetch(`/${mediaId}`, accessToken, { fields: "media_url" });
  return json.media_url ?? null;
}

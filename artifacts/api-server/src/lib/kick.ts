import { ApifyClient } from "apify-client";
import { logger } from "./logger";

export interface KickChannelData {
  username: string;
  displayName: string;
  profilePictureUrl: string | null;
  bannerUrl: string | null;
  bio: string | null;
  category: string | null;
  followers: number;
  isLive: boolean;
  viewers: number;
  streamTitle: string | null;
}

const ACTOR_ID = "nsKvwON2gtX9xQf05";
const TTL_MS = 60_000;

const cache = new Map<string, { fetchedAt: number; data: KickChannelData | null }>();

function getTokens(): string[] {
  const pool = (process.env.APIFY_API_TOKENS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const single = process.env.APIFY_API_TOKEN?.trim();
  if (single) pool.push(single);
  return Array.from(new Set(pool));
}

let tokenIdx = 0;
function nextClient(): { client: ApifyClient; token: string } | null {
  const tokens = getTokens();
  if (tokens.length === 0) {
    logger.warn("No Apify tokens configured — Kick data unavailable");
    return null;
  }
  const token = tokens[tokenIdx % tokens.length];
  tokenIdx++;
  return { client: new ApifyClient({ token }), token };
}

interface ApifyChannelItem {
  username?: string;
  slug?: string;
  channelName?: string;
  displayName?: string;
  user?: { username?: string; bio?: string | null; profile_pic?: string | null };
  bio?: string | null;
  profile_pic?: string | null;
  profilePictureUrl?: string | null;
  bannerImage?: string | null;
  banner_image?: { url?: string } | null;
  followersCount?: number;
  followers_count?: number;
  followers?: number;
  isLive?: boolean;
  is_live?: boolean;
  live?: boolean;
  viewerCount?: number;
  viewer_count?: number;
  viewers?: number;
  sessionTitle?: string | null;
  session_title?: string | null;
  streamTitle?: string | null;
  category?: string | null;
  categoryName?: string | null;
  livestream?: {
    is_live?: boolean;
    session_title?: string | null;
    viewer_count?: number;
    categories?: { name?: string }[];
  } | null;
}

function normalize(item: ApifyChannelItem, fallbackUsername: string): KickChannelData {
  const username =
    item.slug ?? item.username ?? item.channelName ?? item.user?.username ?? fallbackUsername;
  const livestream = item.livestream ?? null;
  const isLive =
    item.isLive ??
    item.is_live ??
    item.live ??
    livestream?.is_live ??
    false;
  const viewers =
    item.viewerCount ??
    item.viewer_count ??
    item.viewers ??
    livestream?.viewer_count ??
    0;
  const streamTitle =
    item.sessionTitle ??
    item.session_title ??
    item.streamTitle ??
    livestream?.session_title ??
    null;
  const category =
    item.category ??
    item.categoryName ??
    livestream?.categories?.[0]?.name ??
    null;
  const profilePic =
    item.profilePictureUrl ??
    item.profile_pic ??
    item.user?.profile_pic ??
    null;
  const banner =
    (typeof item.bannerImage === "string" ? item.bannerImage : null) ??
    item.banner_image?.url ??
    null;
  const bio = item.bio ?? item.user?.bio ?? null;
  const displayName = item.displayName ?? item.user?.username ?? username;
  const followers =
    item.followersCount ?? item.followers_count ?? item.followers ?? 0;

  return {
    username,
    displayName,
    profilePictureUrl: profilePic,
    bannerUrl: banner,
    bio,
    category,
    followers,
    isLive: !!isLive,
    viewers,
    streamTitle,
  };
}

export async function fetchKickChannels(
  usernames: string[],
): Promise<Map<string, KickChannelData>> {
  const result = new Map<string, KickChannelData>();
  if (usernames.length === 0) return result;

  const lower = usernames.map((u) => u.toLowerCase());
  const now = Date.now();
  const stale: string[] = [];
  for (const u of lower) {
    const c = cache.get(u);
    if (c && now - c.fetchedAt < TTL_MS) {
      if (c.data) result.set(u, c.data);
    } else {
      stale.push(u);
    }
  }
  if (stale.length === 0) return result;

  const tokens = getTokens();
  if (tokens.length === 0) {
    for (const u of stale) cache.set(u, { fetchedAt: now, data: null });
    return result;
  }

  let lastErr: unknown = null;
  let succeeded = false;
  for (let attempt = 0; attempt < tokens.length && !succeeded; attempt++) {
    const next = nextClient();
    if (!next) break;
    try {
      const run = await next.client.actor(ACTOR_ID).call({
        mode: "channel_details",
        channelNames: stale,
        maxResults: 50,
        videoType: "videos",
        sortBy: "viewers",
        minViewers: 0,
      });
      const { items } = await next.client.dataset(run.defaultDatasetId).listItems();
      const found = new Set<string>();
      for (const raw of items as ApifyChannelItem[]) {
        const data = normalize(raw, stale[0] ?? "");
        const key = data.username.toLowerCase();
        cache.set(key, { fetchedAt: Date.now(), data });
        result.set(key, data);
        found.add(key);
      }
      for (const u of stale) {
        if (!found.has(u)) {
          cache.set(u, { fetchedAt: Date.now(), data: null });
        }
      }
      succeeded = true;
    } catch (err) {
      lastErr = err;
      logger.warn({ err, attempt }, "Apify token failed, trying next");
    }
  }
  if (!succeeded) {
    logger.warn({ err: lastErr, usernames: stale }, "All Apify tokens failed");
    for (const u of stale) cache.set(u, { fetchedAt: now, data: null });
  }

  return result;
}

export async function fetchKickChannel(
  username: string,
): Promise<KickChannelData | null> {
  const map = await fetchKickChannels([username]);
  return map.get(username.toLowerCase()) ?? null;
}

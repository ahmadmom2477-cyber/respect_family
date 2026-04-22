import { eq, inArray } from "drizzle-orm";
import { db, streamersTable } from "@workspace/db";
import { fetchKickChannels } from "./kick";
import { logger } from "./logger";

const STALE_MS = 5 * 60_000;

type StreamerRow = typeof streamersTable.$inferSelect;

const inFlight = new Set<number>();

async function applyRefresh(stale: StreamerRow[]): Promise<StreamerRow[]> {
  if (stale.length === 0) return [];
  const dataMap = await fetchKickChannels(stale.map((r) => r.username));
  const updates: StreamerRow[] = [];
  for (const r of stale) {
    const data = dataMap.get(r.username.toLowerCase());
    if (!data) {
      await db
        .update(streamersTable)
        .set({ lastSyncedAt: new Date() })
        .where(eq(streamersTable.id, r.id));
      updates.push({ ...r, lastSyncedAt: new Date() });
      continue;
    }
    const update = {
      displayName: data.displayName || r.displayName,
      profilePictureUrl: data.profilePictureUrl ?? r.profilePictureUrl,
      bannerUrl: data.bannerUrl ?? r.bannerUrl,
      bio: data.bio ?? r.bio,
      category: data.category ?? r.category,
      followers: data.followers || r.followers,
      isLive: data.isLive,
      viewers: data.viewers,
      streamTitle: data.streamTitle,
      lastSyncedAt: new Date(),
    };
    const [updated] = await db
      .update(streamersTable)
      .set(update)
      .where(eq(streamersTable.id, r.id))
      .returning();
    updates.push(updated ?? { ...r, ...update });
  }
  return updates;
}

/**
 * Non-blocking refresh: returns rows immediately. If any are stale, kicks off
 * a background refresh so the next request gets fresh data.
 */
export function refreshIfStale(rows: StreamerRow[]): StreamerRow[] {
  const now = Date.now();
  const stale = rows.filter((r) => {
    if (inFlight.has(r.id)) return false;
    const last = r.lastSyncedAt ? r.lastSyncedAt.getTime() : 0;
    return now - last > STALE_MS;
  });
  if (stale.length > 0) {
    for (const r of stale) inFlight.add(r.id);
    applyRefresh(stale)
      .catch((err) => logger.warn({ err }, "background refresh failed"))
      .finally(() => {
        for (const r of stale) inFlight.delete(r.id);
      });
  }
  return rows;
}

/**
 * Blocking refresh — used only when the caller really needs fresh data
 * (e.g. detail page on first cold load when row has no data yet).
 */
export async function refreshIfStaleBlocking(
  rows: StreamerRow[],
): Promise<StreamerRow[]> {
  const now = Date.now();
  const stale = rows.filter((r) => {
    const last = r.lastSyncedAt ? r.lastSyncedAt.getTime() : 0;
    return now - last > STALE_MS;
  });
  if (stale.length === 0) return rows;
  const updates = await applyRefresh(stale);
  const updatedById = new Map(updates.map((r) => [r.id, r]));
  return rows.map((r) => updatedById.get(r.id) ?? r);
}

export async function refreshOne(username: string): Promise<StreamerRow | null> {
  const [row] = await db
    .select()
    .from(streamersTable)
    .where(eq(streamersTable.username, username));
  if (!row) return null;
  // For detail page: only block if we've never synced this row before;
  // otherwise serve cached data and refresh in the background.
  if (!row.lastSyncedAt) {
    const [refreshed] = await refreshIfStaleBlocking([row]);
    return refreshed ?? row;
  }
  refreshIfStale([row]);
  return row;
}

export async function refreshUsernames(usernames: string[]): Promise<StreamerRow[]> {
  if (usernames.length === 0) return [];
  const rows = await db
    .select()
    .from(streamersTable)
    .where(inArray(streamersTable.username, usernames));
  return refreshIfStale(rows);
}

export function streamerToDto(row: StreamerRow) {
  return {
    id: row.id,
    username: row.username,
    displayName: row.displayName,
    profilePictureUrl: row.profilePictureUrl,
    bannerUrl: row.bannerUrl,
    channelUrl: `https://kick.com/${row.username}`,
    isLive: row.isLive,
    followers: row.followers,
    viewers: row.viewers,
    streamTitle: row.streamTitle,
    category: row.category,
    bio: row.bio,
    promoted: row.promoted,
    addedAt: row.addedAt,
    lastSyncedAt: row.lastSyncedAt,
  };
}

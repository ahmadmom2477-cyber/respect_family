import { StreamerModel, type Streamer } from "@workspace/db";
import { fetchKickChannels } from "./kick";
import { logger } from "./logger";

const STALE_MS = 5 * 60_000;

export type StreamerRow = {
  id: number;
  username: string;
  displayName: string;
  profilePictureUrl: string | null;
  bannerUrl: string | null;
  bio: string | null;
  category: string | null;
  isLive: boolean;
  followers: number;
  viewers: number;
  streamTitle: string | null;
  promoted: boolean;
  addedAt: Date;
  lastSyncedAt: Date | null;
};

function toRow(doc: any): StreamerRow {
  return {
    id: doc.id,
    username: doc.username,
    displayName: doc.displayName,
    profilePictureUrl: doc.profilePictureUrl ?? null,
    bannerUrl: doc.bannerUrl ?? null,
    bio: doc.bio ?? null,
    category: doc.category ?? null,
    isLive: !!doc.isLive,
    followers: doc.followers ?? 0,
    viewers: doc.viewers ?? 0,
    streamTitle: doc.streamTitle ?? null,
    promoted: !!doc.promoted,
    addedAt: doc.addedAt instanceof Date ? doc.addedAt : new Date(doc.addedAt),
    lastSyncedAt: doc.lastSyncedAt
      ? doc.lastSyncedAt instanceof Date
        ? doc.lastSyncedAt
        : new Date(doc.lastSyncedAt)
      : null,
  };
}

export function docsToRows(docs: any[]): StreamerRow[] {
  return docs.map(toRow);
}

const inFlight = new Set<number>();

async function applyRefresh(stale: StreamerRow[]): Promise<StreamerRow[]> {
  if (stale.length === 0) return [];
  const dataMap = await fetchKickChannels(stale.map((r) => r.username));
  const updates: StreamerRow[] = [];
  for (const r of stale) {
    const data = dataMap.get(r.username.toLowerCase());
    if (!data) {
      await StreamerModel.updateOne(
        { id: r.id },
        { $set: { lastSyncedAt: new Date() } },
      );
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
    const updated = await StreamerModel.findOneAndUpdate(
      { id: r.id },
      { $set: update },
      { new: true },
    ).lean();
    updates.push(updated ? toRow(updated) : { ...r, ...update });
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
  const doc = await StreamerModel.findOne({ username }).lean();
  if (!doc) return null;
  const row = toRow(doc);
  if (!row.lastSyncedAt) {
    const [refreshed] = await refreshIfStaleBlocking([row]);
    return refreshed ?? row;
  }
  refreshIfStale([row]);
  return row;
}

export async function refreshUsernames(usernames: string[]): Promise<StreamerRow[]> {
  if (usernames.length === 0) return [];
  const docs = await StreamerModel.find({ username: { $in: usernames } }).lean();
  return refreshIfStale(docsToRows(docs));
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

// Backward-compat export name used by older callers
export type { StreamerRow as StreamerRowType };
export { type Streamer };

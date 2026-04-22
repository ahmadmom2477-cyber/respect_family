import { Router, type IRouter } from "express";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db, favoritesTable, streamersTable } from "@workspace/db";
import { AddFavoriteBody } from "@workspace/api-zod";
import { getAuth } from "@clerk/express";
import { refreshIfStale, streamerToDto } from "../lib/streamerSync";

const router: IRouter = Router();

const MAX_FAVORITES = 50;

function requireUser(req: Parameters<Parameters<IRouter["get"]>[1]>[0]) {
  const auth = getAuth(req);
  return auth?.userId ?? null;
}

router.get("/favorites", async (req, res) => {
  const userId = requireUser(req);
  if (!userId) {
    res.status(401).json({ error: "Sign in required" });
    return;
  }
  const favs = await db
    .select()
    .from(favoritesTable)
    .where(eq(favoritesTable.userId, userId))
    .orderBy(desc(favoritesTable.addedAt));

  if (favs.length === 0) {
    res.json([]);
    return;
  }

  let streamers = await db
    .select()
    .from(streamersTable)
    .where(
      inArray(
        streamersTable.username,
        favs.map((f) => f.username),
      ),
    );
  streamers = await refreshIfStale(streamers);
  const byUsername = new Map(streamers.map((s) => [s.username, s]));

  const items = favs
    .map((f) => {
      const s = byUsername.get(f.username);
      if (!s) {
        return {
          id: 0,
          username: f.username,
          displayName: f.username,
          profilePictureUrl: null,
          bannerUrl: null,
          channelUrl: `https://kick.com/${f.username}`,
          isLive: false,
          followers: 0,
          viewers: 0,
          streamTitle: null,
          category: null,
          bio: null,
          promoted: false,
          addedAt: f.addedAt,
          lastSyncedAt: null,
        };
      }
      return { ...streamerToDto(s), addedAt: f.addedAt };
    })
    .sort((a, b) => {
      if (a.isLive !== b.isLive) return a.isLive ? -1 : 1;
      return b.viewers - a.viewers;
    });
  res.json(items);
});

router.post("/favorites", async (req, res) => {
  const userId = requireUser(req);
  if (!userId) {
    res.status(401).json({ error: "Sign in required" });
    return;
  }
  const parsed = AddFavoriteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  const username = parsed.data.username.toLowerCase().trim();
  const count = await db
    .select()
    .from(favoritesTable)
    .where(eq(favoritesTable.userId, userId));
  if (count.length >= MAX_FAVORITES) {
    res.status(400).json({ error: `Favorite limit (${MAX_FAVORITES}) reached` });
    return;
  }
  await db
    .insert(favoritesTable)
    .values({ userId, username })
    .onConflictDoNothing();
  res.status(201).json({ username, addedAt: new Date() });
});

router.delete("/favorites/:username", async (req, res) => {
  const userId = requireUser(req);
  if (!userId) {
    res.status(401).json({ error: "Sign in required" });
    return;
  }
  const username = req.params.username.toLowerCase();
  await db
    .delete(favoritesTable)
    .where(
      and(
        eq(favoritesTable.userId, userId),
        eq(favoritesTable.username, username),
      ),
    );
  res.status(204).end();
});

export default router;

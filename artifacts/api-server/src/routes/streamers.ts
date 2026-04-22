import { Router, type IRouter } from "express";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import { db, streamersTable } from "@workspace/db";
import { CreateStreamerBody } from "@workspace/api-zod";
import { fetchKickChannel } from "../lib/kick";
import { isAdmin } from "../lib/admin";
import {
  refreshIfStale,
  refreshOne,
  streamerToDto,
} from "../lib/streamerSync";

const router: IRouter = Router();

router.get("/streamers", async (req, res) => {
  const search = typeof req.query.search === "string" ? req.query.search : null;
  const live =
    req.query.live === "true"
      ? true
      : req.query.live === "false"
        ? false
        : null;

  const conditions = [];
  if (search) {
    conditions.push(
      or(
        ilike(streamersTable.username, `%${search}%`),
        ilike(streamersTable.displayName, `%${search}%`),
      ),
    );
  }
  const where = conditions.length ? and(...conditions) : undefined;

  let rows = await db
    .select()
    .from(streamersTable)
    .where(where)
    .orderBy(desc(streamersTable.promoted), desc(streamersTable.viewers));

  rows = await refreshIfStale(rows);
  if (live !== null) {
    rows = rows.filter((r) => r.isLive === live);
  }
  rows.sort((a, b) => {
    if (a.promoted !== b.promoted) return a.promoted ? -1 : 1;
    if (a.isLive !== b.isLive) return a.isLive ? -1 : 1;
    return b.viewers - a.viewers;
  });
  res.json(rows.map(streamerToDto));
});

router.get("/streamers/:username", async (req, res) => {
  const username = req.params.username.toLowerCase();
  const row = await refreshOne(username);
  if (!row) {
    res.status(404).json({ error: "Streamer not found" });
    return;
  }
  res.json(streamerToDto(row));
});

router.post("/streamers", async (req, res) => {
  if (!await isAdmin(req)) {
    res.status(403).json({ error: "Admin only" });
    return;
  }
  const parsed = CreateStreamerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body", details: parsed.error.issues });
    return;
  }
  const username = parsed.data.username.toLowerCase().trim();
  const existing = await db
    .select()
    .from(streamersTable)
    .where(eq(streamersTable.username, username));
  if (existing.length > 0) {
    res.status(409).json({ error: "Streamer already exists" });
    return;
  }
  const kick = await fetchKickChannel(username);
  const [row] = await db
    .insert(streamersTable)
    .values({
      username,
      displayName: kick?.displayName ?? username,
      profilePictureUrl: kick?.profilePictureUrl ?? null,
      bannerUrl: kick?.bannerUrl ?? null,
      bio: kick?.bio ?? null,
      category: kick?.category ?? null,
      followers: kick?.followers ?? 0,
      isLive: kick?.isLive ?? false,
      viewers: kick?.viewers ?? 0,
      streamTitle: kick?.streamTitle ?? null,
      promoted: parsed.data.promoted ?? false,
      lastSyncedAt: kick ? new Date() : null,
    })
    .returning();
  res.status(201).json(streamerToDto(row));
});

router.delete("/streamers/:username", async (req, res) => {
  if (!await isAdmin(req)) {
    res.status(403).json({ error: "Admin only" });
    return;
  }
  const username = req.params.username.toLowerCase();
  const result = await db
    .delete(streamersTable)
    .where(eq(streamersTable.username, username))
    .returning();
  if (result.length === 0) {
    res.status(404).json({ error: "Streamer not found" });
    return;
  }
  res.status(204).end();
});

export default router;

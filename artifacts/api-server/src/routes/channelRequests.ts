import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db, channelRequestsTable, streamersTable } from "@workspace/db";
import {
  CreateChannelRequestBody,
  UpdateChannelRequestBody,
} from "@workspace/api-zod";
import { getAuth } from "@clerk/express";
import { isAdmin } from "../lib/admin";
import { fetchKickChannel } from "../lib/kick";

const router: IRouter = Router();

router.get("/channel-requests", async (req, res) => {
  if (!await isAdmin(req)) {
    res.status(403).json({ error: "Admin only" });
    return;
  }
  const status = typeof req.query.status === "string" ? req.query.status : null;
  const rows = await db
    .select()
    .from(channelRequestsTable)
    .where(status ? eq(channelRequestsTable.status, status) : undefined)
    .orderBy(desc(channelRequestsTable.createdAt));
  res.json(rows);
});

router.post("/channel-requests", async (req, res) => {
  const parsed = CreateChannelRequestBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body", details: parsed.error.issues });
    return;
  }
  const auth = getAuth(req);
  const username = parsed.data.username.toLowerCase().trim();
  const [row] = await db
    .insert(channelRequestsTable)
    .values({
      username,
      submitterName: parsed.data.submitterName ?? null,
      submitterEmail: parsed.data.submitterEmail ?? null,
      submitterUserId: auth?.userId ?? null,
      note: parsed.data.note ?? null,
    })
    .returning();
  res.status(201).json(row);
});

router.patch("/channel-requests/:id", async (req, res) => {
  if (!await isAdmin(req)) {
    res.status(403).json({ error: "Admin only" });
    return;
  }
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const parsed = UpdateChannelRequestBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body", details: parsed.error.issues });
    return;
  }
  const status = parsed.data.status;
  const [updated] = await db
    .update(channelRequestsTable)
    .set({ status, decidedAt: new Date() })
    .where(eq(channelRequestsTable.id, id))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Request not found" });
    return;
  }
  if (status === "approved") {
    const existing = await db
      .select()
      .from(streamersTable)
      .where(eq(streamersTable.username, updated.username));
    if (existing.length === 0) {
      const kick = await fetchKickChannel(updated.username);
      await db.insert(streamersTable).values({
        username: updated.username,
        displayName: kick?.displayName ?? updated.username,
        profilePictureUrl: kick?.profilePictureUrl ?? null,
        bannerUrl: kick?.bannerUrl ?? null,
        bio: kick?.bio ?? null,
        category: kick?.category ?? null,
        followers: kick?.followers ?? 0,
        isLive: kick?.isLive ?? false,
        viewers: kick?.viewers ?? 0,
        streamTitle: kick?.streamTitle ?? null,
        lastSyncedAt: kick ? new Date() : null,
      });
    }
  }
  res.json(updated);
});

export default router;

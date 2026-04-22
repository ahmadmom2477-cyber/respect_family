import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db, streamersTable, channelRequestsTable } from "@workspace/db";
import { refreshIfStale, streamerToDto } from "../lib/streamerSync";

const router: IRouter = Router();

router.get("/stats", async (_req, res) => {
  let streamers = await db.select().from(streamersTable);
  streamers = await refreshIfStale(streamers);
  const liveStreamers = streamers
    .filter((s) => s.isLive)
    .sort((a, b) => b.viewers - a.viewers);
  const totalViewers = liveStreamers.reduce((sum, s) => sum + s.viewers, 0);
  const totalFollowers = streamers.reduce((sum, s) => sum + s.followers, 0);
  const pending = await db
    .select()
    .from(channelRequestsTable)
    .where(eq(channelRequestsTable.status, "pending"));
  res.json({
    totalChannels: streamers.length,
    liveNow: liveStreamers.length,
    totalViewers,
    totalFollowers,
    pendingRequests: pending.length,
    topLive: liveStreamers.slice(0, 6).map(streamerToDto),
  });
});

export default router;

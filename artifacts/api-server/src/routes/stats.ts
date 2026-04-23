import { Router, type IRouter } from "express";
import { ChannelRequestModel, StreamerModel } from "@workspace/db";
import { docsToRows, refreshIfStale, streamerToDto } from "../lib/streamerSync";

const router: IRouter = Router();

router.get("/stats", async (_req, res) => {
  const docs = await StreamerModel.find().lean();
  let streamers = docsToRows(docs);
  streamers = refreshIfStale(streamers);
  const liveStreamers = streamers
    .filter((s) => s.isLive)
    .sort((a, b) => b.viewers - a.viewers);
  const totalViewers = liveStreamers.reduce((sum, s) => sum + s.viewers, 0);
  const totalFollowers = streamers.reduce((sum, s) => sum + s.followers, 0);
  const pendingCount = await ChannelRequestModel.countDocuments({
    status: "pending",
  });
  res.json({
    totalChannels: streamers.length,
    liveNow: liveStreamers.length,
    totalViewers,
    totalFollowers,
    pendingRequests: pendingCount,
    topLive: liveStreamers.slice(0, 6).map(streamerToDto),
  });
});

export default router;

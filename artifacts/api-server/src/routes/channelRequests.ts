import { Router, type IRouter } from "express";
import { ChannelRequestModel, StreamerModel } from "@workspace/db";
import {
  CreateChannelRequestBody,
  UpdateChannelRequestBody,
} from "@workspace/api-zod";
import { getAuth } from "@clerk/express";
import { isAdmin } from "../lib/admin";
import { fetchKickChannel } from "../lib/kick";

const router: IRouter = Router();

function toDto(doc: any) {
  return {
    id: doc.id,
    username: doc.username,
    submitterName: doc.submitterName ?? null,
    submitterEmail: doc.submitterEmail ?? null,
    submitterUserId: doc.submitterUserId ?? null,
    note: doc.note ?? null,
    status: doc.status,
    createdAt: doc.createdAt,
    decidedAt: doc.decidedAt ?? null,
  };
}

router.get("/channel-requests", async (req, res) => {
  if (!(await isAdmin(req))) {
    res.status(403).json({ error: "Admin only" });
    return;
  }
  const status = typeof req.query.status === "string" ? req.query.status : null;
  const filter = status ? { status } : {};
  const docs = await ChannelRequestModel.find(filter)
    .sort({ createdAt: -1 })
    .lean();
  res.json(docs.map(toDto));
});

router.post("/channel-requests", async (req, res) => {
  const parsed = CreateChannelRequestBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body", details: parsed.error.issues });
    return;
  }
  const auth = getAuth(req);
  const username = parsed.data.username.toLowerCase().trim();
  const created = await ChannelRequestModel.create({
    username,
    submitterName: parsed.data.submitterName ?? null,
    submitterEmail: parsed.data.submitterEmail ?? null,
    submitterUserId: auth?.userId ?? null,
    note: parsed.data.note ?? null,
  });
  res.status(201).json(toDto(created.toObject()));
});

router.patch("/channel-requests/:id", async (req, res) => {
  if (!(await isAdmin(req))) {
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
  const updated = await ChannelRequestModel.findOneAndUpdate(
    { id },
    { $set: { status, decidedAt: new Date() } },
    { new: true },
  ).lean();
  if (!updated) {
    res.status(404).json({ error: "Request not found" });
    return;
  }
  if (status === "approved") {
    const existing = await StreamerModel.findOne({ username: updated.username }).lean();
    if (!existing) {
      const kick = await fetchKickChannel(updated.username);
      await StreamerModel.create({
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
  res.json(toDto(updated));
});

export default router;

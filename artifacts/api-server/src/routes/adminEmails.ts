import { Router, type IRouter } from "express";
import { AdminEmailModel } from "@workspace/db";
import { getUserId, isAdmin } from "../lib/admin";

const router: IRouter = Router();

router.get("/admin-emails", async (req, res) => {
  if (!(await isAdmin(req))) {
    res.status(403).json({ error: "Admin only" });
    return;
  }
  const rows = await AdminEmailModel.find().lean();
  res.json(
    rows.map((r: any) => ({
      id: r.id,
      email: r.email,
      addedAt: r.addedAt,
      addedBy: r.addedBy ?? null,
    })),
  );
});

router.post("/admin-emails", async (req, res) => {
  if (!(await isAdmin(req))) {
    res.status(403).json({ error: "Admin only" });
    return;
  }
  const email = String(req.body?.email ?? "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    res.status(400).json({ error: "Invalid email" });
    return;
  }
  const userId = getUserId(req);
  try {
    const existing = await AdminEmailModel.findOne({ email }).lean();
    if (existing) {
      res.status(200).json({
        id: existing.id,
        email: existing.email,
        addedAt: existing.addedAt,
        addedBy: existing.addedBy ?? null,
      });
      return;
    }
    const created = await AdminEmailModel.create({
      email,
      addedBy: userId ?? "admin",
    });
    res.status(201).json({
      id: created.id,
      email: created.email,
      addedAt: created.addedAt,
      addedBy: created.addedBy ?? null,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to add" });
  }
});

router.delete("/admin-emails/:email", async (req, res) => {
  if (!(await isAdmin(req))) {
    res.status(403).json({ error: "Admin only" });
    return;
  }
  const email = req.params.email.toLowerCase();
  if (email === "3x51hb@gmail.com") {
    res.status(400).json({ error: "Cannot remove primary admin" });
    return;
  }
  await AdminEmailModel.deleteOne({ email });
  res.status(204).end();
});

export default router;

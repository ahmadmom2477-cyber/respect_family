import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, adminEmailsTable } from "@workspace/db";
import { getUserId, isAdmin } from "../lib/admin";

const router: IRouter = Router();

router.get("/admin-emails", async (req, res) => {
  if (!(await isAdmin(req))) {
    res.status(403).json({ error: "Admin only" });
    return;
  }
  const rows = await db.select().from(adminEmailsTable);
  res.json(
    rows.map((r) => ({
      id: r.id,
      email: r.email,
      addedAt: r.addedAt,
      addedBy: r.addedBy,
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
    const [row] = await db
      .insert(adminEmailsTable)
      .values({ email, addedBy: userId ?? "admin" })
      .onConflictDoNothing()
      .returning();
    if (!row) {
      const [existing] = await db
        .select()
        .from(adminEmailsTable)
        .where(eq(adminEmailsTable.email, email));
      res.status(200).json(existing);
      return;
    }
    res.status(201).json(row);
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
  await db.delete(adminEmailsTable).where(eq(adminEmailsTable.email, email));
  res.status(204).end();
});

export default router;

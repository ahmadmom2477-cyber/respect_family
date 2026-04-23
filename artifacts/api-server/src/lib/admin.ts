import type { Request } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import { AdminEmailModel } from "@workspace/db";
import { logger } from "./logger";

export function getUserId(req: Request): string | null {
  const auth = getAuth(req);
  return auth?.userId ?? null;
}

function parseList(env: string | undefined): string[] {
  return (env ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

const SEED_EMAIL = "3x51hb@gmail.com";
let seeded = false;
async function ensureSeed() {
  if (seeded) return;
  try {
    await AdminEmailModel.updateOne(
      { email: SEED_EMAIL },
      { $setOnInsert: { email: SEED_EMAIL, addedBy: "seed", addedAt: new Date() } },
      { upsert: true },
    );
    const envEmails = parseList(process.env.ADMIN_EMAILS);
    for (const email of envEmails) {
      await AdminEmailModel.updateOne(
        { email },
        { $setOnInsert: { email, addedBy: "env", addedAt: new Date() } },
        { upsert: true },
      );
    }
    seeded = true;
  } catch (err) {
    logger.warn({ err }, "admin email seed failed");
  }
}

export async function getAdminEmails(): Promise<string[]> {
  await ensureSeed();
  const rows = await AdminEmailModel.find().lean();
  return rows.map((r: { email: string }) => r.email.toLowerCase());
}

async function getUserEmails(userId: string): Promise<string[]> {
  try {
    const user = await clerkClient.users.getUser(userId);
    return (user.emailAddresses ?? []).map((e) =>
      e.emailAddress.toLowerCase(),
    );
  } catch (err) {
    logger.warn({ err, userId }, "could not fetch clerk user emails");
    return [];
  }
}

export async function isAdmin(req: Request): Promise<boolean> {
  const userId = getUserId(req);
  if (!userId) return false;

  const allowedIds = parseList(process.env.ADMIN_USER_IDS);
  if (allowedIds.includes(userId.toLowerCase())) return true;

  const allowedEmails = await getAdminEmails();
  if (allowedEmails.length === 0) return false;

  const emails = await getUserEmails(userId);
  return emails.some((e) => allowedEmails.includes(e));
}

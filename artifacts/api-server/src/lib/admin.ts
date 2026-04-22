import type { Request } from "express";
import { getAuth, clerkClient } from "@clerk/express";
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

export async function isAdmin(req: Request): Promise<boolean> {
  const userId = getUserId(req);
  if (!userId) return false;

  const allowedIds = parseList(process.env.ADMIN_USER_IDS);
  if (allowedIds.includes(userId.toLowerCase())) return true;

  const allowedEmails = parseList(process.env.ADMIN_EMAILS);
  if (allowedEmails.length > 0) {
    try {
      const user = await clerkClient.users.getUser(userId);
      const emails = (user.emailAddresses ?? []).map((e) =>
        e.emailAddress.toLowerCase(),
      );
      const match = emails.some((e) => allowedEmails.includes(e));
      logger.info(
        { userId, emails, allowedEmails, match },
        "admin email check",
      );
      if (match) return true;
    } catch (err) {
      logger.warn({ err, userId }, "admin email check failed");
    }
  }
  return false;
}

import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, favoritesTable } from "@workspace/db";
import { GetMeResponse } from "@workspace/api-zod";
import { getAuth, clerkClient } from "@clerk/express";
import { isAdmin } from "../lib/admin";

const router: IRouter = Router();

router.get("/me", async (req, res) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  const auth = getAuth(req);
  const userId = auth?.userId ?? null;
  if (!userId) {
    res.json(
      GetMeResponse.parse({ signedIn: false, isAdmin: false, favoriteCount: 0 }),
    );
    return;
  }
  const [user, favs] = await Promise.all([
    clerkClient.users.getUser(userId).catch(() => null),
    db.select().from(favoritesTable).where(eq(favoritesTable.userId, userId)),
  ]);
  res.json(
    GetMeResponse.parse({
      signedIn: true,
      userId,
      email: user?.emailAddresses?.[0]?.emailAddress ?? null,
      firstName: user?.firstName ?? null,
      imageUrl: user?.imageUrl ?? null,
      isAdmin: await isAdmin(req),
      favoriteCount: favs.length,
    }),
  );
});

export default router;

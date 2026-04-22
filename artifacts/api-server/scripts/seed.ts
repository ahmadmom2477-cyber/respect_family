import { db, streamersTable } from "@workspace/db";
import { fetchKickChannel } from "../src/lib/kick";
import { eq } from "drizzle-orm";

const usernames = [
  "adin_ross",
  "trainwreckstv",
  "kaicenat",
  "amouranth",
  "xqc",
  "n3on",
];

async function main() {
  for (const username of usernames) {
    const existing = await db
      .select()
      .from(streamersTable)
      .where(eq(streamersTable.username, username));
    if (existing.length > 0) {
      console.log(`skip ${username} (exists)`);
      continue;
    }
    const kick = await fetchKickChannel(username);
    await db.insert(streamersTable).values({
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
      lastSyncedAt: kick ? new Date() : null,
    });
    console.log(
      `seeded ${username} live=${kick?.isLive ?? false} viewers=${kick?.viewers ?? 0}`,
    );
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

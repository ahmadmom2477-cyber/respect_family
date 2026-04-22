import { pgTable, text, serial, boolean, integer, timestamp, index } from "drizzle-orm/pg-core";

export const streamersTable = pgTable(
  "streamers",
  {
    id: serial("id").primaryKey(),
    username: text("username").notNull().unique(),
    displayName: text("display_name").notNull(),
    profilePictureUrl: text("profile_picture_url"),
    bannerUrl: text("banner_url"),
    bio: text("bio"),
    category: text("category"),
    isLive: boolean("is_live").notNull().default(false),
    followers: integer("followers").notNull().default(0),
    viewers: integer("viewers").notNull().default(0),
    streamTitle: text("stream_title"),
    promoted: boolean("promoted").notNull().default(false),
    addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
    lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
  },
  (t) => ({
    usernameIdx: index("streamers_username_idx").on(t.username),
  }),
);

export type Streamer = typeof streamersTable.$inferSelect;

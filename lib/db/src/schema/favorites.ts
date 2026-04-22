import { pgTable, text, timestamp, primaryKey } from "drizzle-orm/pg-core";

export const favoritesTable = pgTable(
  "favorites",
  {
    userId: text("user_id").notNull(),
    username: text("username").notNull(),
    addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.username] }),
  }),
);

export type Favorite = typeof favoritesTable.$inferSelect;

import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";

export const channelRequestsTable = pgTable("channel_requests", {
  id: serial("id").primaryKey(),
  username: text("username").notNull(),
  submitterName: text("submitter_name"),
  submitterEmail: text("submitter_email"),
  submitterUserId: text("submitter_user_id"),
  note: text("note"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  decidedAt: timestamp("decided_at", { withTimezone: true }),
});

export type ChannelRequest = typeof channelRequestsTable.$inferSelect;

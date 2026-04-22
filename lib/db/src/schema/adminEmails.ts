import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";

export const adminEmailsTable = pgTable("admin_emails", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
  addedBy: text("added_by"),
});

export type AdminEmail = typeof adminEmailsTable.$inferSelect;

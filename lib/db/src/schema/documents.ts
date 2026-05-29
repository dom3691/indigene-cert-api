import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const documentsTable = pgTable("documents", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  fileName: text("file_name").notNull(),
  sizeKb: integer("size_kb"),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Document = typeof documentsTable.$inferSelect;
export type InsertDocument = typeof documentsTable.$inferInsert;

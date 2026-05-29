import { pgTable, serial, text, integer } from "drizzle-orm/pg-core";

export const wardsTable = pgTable("wards", {
  id: serial("id").primaryKey(),
  lgaId: integer("lga_id").notNull(),
  name: text("name").notNull(),
});

export type Ward = typeof wardsTable.$inferSelect;
export type InsertWard = typeof wardsTable.$inferInsert;

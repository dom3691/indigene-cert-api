import { pgTable, serial, text, integer } from "drizzle-orm/pg-core";

export const lgasTable = pgTable("lgas", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  name: text("name").notNull(),
  code: text("code"),
});

export type Lga = typeof lgasTable.$inferSelect;
export type InsertLga = typeof lgasTable.$inferInsert;

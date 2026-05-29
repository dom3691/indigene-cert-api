import { pgTable, serial, text, numeric, timestamp } from "drizzle-orm/pg-core";

export const tenantsTable = pgTable("tenants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull(),
  slug: text("slug").notNull(),
  certificatePrefix: text("certificate_prefix").notNull(),
  fee: numeric("fee", { precision: 12, scale: 2 }).notNull().default("0"),
  currency: text("currency").notNull().default("NGN"),
  status: text("status").notNull().default("active"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  address: text("address"),
  capital: text("capital"),
  logoUrl: text("logo_url"),
  primaryColor: text("primary_color"),
  tagline: text("tagline"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Tenant = typeof tenantsTable.$inferSelect;
export type InsertTenant = typeof tenantsTable.$inferInsert;

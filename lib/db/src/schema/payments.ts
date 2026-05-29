import { pgTable, serial, text, integer, numeric, timestamp } from "drizzle-orm/pg-core";

export const paymentsTable = pgTable("payments", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").notNull(),
  tenantId: integer("tenant_id").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull().default("0"),
  currency: text("currency").notNull().default("NGN"),
  reference: text("reference").notNull(),
  gateway: text("gateway"),
  status: text("status").notNull().default("success"),
  payerName: text("payer_name"),
  receiptNumber: text("receipt_number"),
  paidAt: timestamp("paid_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Payment = typeof paymentsTable.$inferSelect;
export type InsertPayment = typeof paymentsTable.$inferInsert;

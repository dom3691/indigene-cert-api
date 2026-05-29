import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const auditLogsTable = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id"),
  actorName: text("actor_name").notNull(),
  actorRole: text("actor_role"),
  action: text("action").notNull(),
  recordType: text("record_type"),
  recordId: text("record_id"),
  outcome: text("outcome"),
  detail: text("detail"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type AuditLog = typeof auditLogsTable.$inferSelect;
export type InsertAuditLog = typeof auditLogsTable.$inferInsert;

import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const certificatesTable = pgTable("certificates", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").notNull(),
  tenantId: integer("tenant_id").notNull(),
  certificateNumber: text("certificate_number").notNull(),
  applicantDisplayName: text("applicant_display_name").notNull(),
  lgaName: text("lga_name"),
  wardName: text("ward_name"),
  stateOfOrigin: text("state_of_origin"),
  issueDate: timestamp("issue_date", { withTimezone: true }).notNull().defaultNow(),
  status: text("status").notNull().default("valid"),
  issuedById: integer("issued_by_id"),
  issuedByName: text("issued_by_name"),
  revokedReason: text("revoked_reason"),
});

export type Certificate = typeof certificatesTable.$inferSelect;
export type InsertCertificate = typeof certificatesTable.$inferInsert;

import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const applicationsTable = pgTable("applications", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  applicantId: integer("applicant_id").notNull(),
  firstName: text("first_name"),
  middleName: text("middle_name"),
  lastName: text("last_name"),
  gender: text("gender"),
  dateOfBirth: text("date_of_birth"),
  nin: text("nin"),
  email: text("email"),
  phone: text("phone"),
  residentialAddress: text("residential_address"),
  stateOfOrigin: text("state_of_origin"),
  lgaId: integer("lga_id"),
  wardId: integer("ward_id"),
  fatherName: text("father_name"),
  motherName: text("mother_name"),
  community: text("community"),
  status: text("status").notNull().default("draft"),
  rejectionReason: text("rejection_reason"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  reviewedById: integer("reviewed_by_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type Application = typeof applicationsTable.$inferSelect;
export type InsertApplication = typeof applicationsTable.$inferInsert;

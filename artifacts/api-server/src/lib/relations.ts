import { inArray, eq } from "drizzle-orm";
import {
  db,
  tenantsTable,
  lgasTable,
  wardsTable,
  usersTable,
  documentsTable,
  paymentsTable,
  certificatesTable,
  type Application,
} from "@workspace/db";
import { mapApplication, fullName, type ApplicationRelations } from "./serialize";

export async function buildApplicationDtos(apps: Application[]) {
  if (apps.length === 0) return [];
  const ids = apps.map((a) => a.id);

  const tenants = await db.select().from(tenantsTable);
  const lgas = await db.select().from(lgasTable);
  const wards = await db.select().from(wardsTable);
  const users = await db.select().from(usersTable);
  const documents = await db
    .select()
    .from(documentsTable)
    .where(inArray(documentsTable.applicationId, ids));
  const payments = await db
    .select()
    .from(paymentsTable)
    .where(inArray(paymentsTable.applicationId, ids));
  const certificates = await db
    .select()
    .from(certificatesTable)
    .where(inArray(certificatesTable.applicationId, ids));

  const tenantNames = new Map(tenants.map((t) => [t.id, t.name]));
  const lgaNames = new Map(lgas.map((l) => [l.id, l.name]));
  const wardNames = new Map(wards.map((w) => [w.id, w.name]));
  const userNames = new Map(users.map((u) => [u.id, u.name]));

  return apps.map((a) => {
    const rel: ApplicationRelations = {
      tenantName: tenantNames.get(a.tenantId) ?? null,
      applicantName:
        fullName(a.firstName, a.middleName, a.lastName) ||
        userNames.get(a.applicantId) ||
        "Applicant",
      lgaName: a.lgaId != null ? lgaNames.get(a.lgaId) ?? null : null,
      wardName: a.wardId != null ? wardNames.get(a.wardId) ?? null : null,
      reviewedByName: a.reviewedById != null ? userNames.get(a.reviewedById) ?? null : null,
      documents: documents.filter((d) => d.applicationId === a.id),
      payment: payments.find((p) => p.applicationId === a.id) ?? null,
      certificate: certificates.find((c) => c.applicationId === a.id) ?? null,
    };
    return mapApplication(a, rel);
  });
}

export async function buildApplicationDto(app: Application) {
  const [dto] = await buildApplicationDtos([app]);
  return dto;
}

export async function applicantDisplayName(app: Application): Promise<string> {
  const name = fullName(app.firstName, app.middleName, app.lastName);
  if (name) return name;
  const [u] = await db.select().from(usersTable).where(eq(usersTable.id, app.applicantId));
  return u?.name ?? "Applicant";
}

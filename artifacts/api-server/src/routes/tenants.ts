import { Router, type IRouter } from "express";
import { eq, inArray, desc } from "drizzle-orm";
import {
  db,
  tenantsTable,
  lgasTable,
  wardsTable,
  usersTable,
  applicationsTable,
  certificatesTable,
  paymentsTable,
  auditLogsTable,
} from "@workspace/db";
import {
  ListTenantsResponse,
  CreateTenantBody,
  GetTenantParams,
  GetTenantResponse,
  UpdateTenantParams,
  UpdateTenantBody,
  UpdateTenantResponse,
  ListLgasParams,
  ListLgasResponse,
  CreateLgaParams,
  CreateLgaBody,
  CreateWardParams,
  CreateWardBody,
  ListOfficersParams,
  ListOfficersResponse,
  CreateOfficerParams,
  CreateOfficerBody,
  GetTenantDashboardParams,
  GetTenantDashboardResponse,
} from "@workspace/api-zod";
import {
  mapTenant,
  mapLga,
  mapWard,
  mapOfficer,
  mapApplication,
  mapAuditLog,
  num,
  fullName,
} from "../lib/serialize";
import { recordAudit } from "../lib/audit";

const router: IRouter = Router();

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

router.get("/tenants", async (req, res): Promise<void> => {
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const rows = status
    ? await db.select().from(tenantsTable).where(eq(tenantsTable.status, status))
    : await db.select().from(tenantsTable);
  rows.sort((a, b) => a.name.localeCompare(b.name));
  res.json(ListTenantsResponse.parse(rows.map(mapTenant)));
});

router.post("/tenants", async (req, res): Promise<void> => {
  const parsed = CreateTenantBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const d = parsed.data;
  const [row] = await db
    .insert(tenantsTable)
    .values({
      name: d.name,
      code: d.code,
      slug: slugify(d.name),
      certificatePrefix: d.certificatePrefix,
      fee: String(d.fee),
      currency: d.currency ?? "NGN",
      contactEmail: d.contactEmail ?? null,
      contactPhone: d.contactPhone ?? null,
      address: d.address ?? null,
      capital: d.capital ?? null,
      primaryColor: d.primaryColor ?? null,
      tagline: d.tagline ?? null,
    })
    .returning();
  await recordAudit({
    tenantId: row.id,
    actorName: "Platform Super Admin",
    actorRole: "super_admin",
    action: "Created tenant",
    recordType: "tenant",
    recordId: row.id,
    outcome: "success",
    detail: `Onboarded ${row.name}`,
  });
  res.status(201).json(GetTenantResponse.parse(mapTenant(row)));
});

router.get("/tenants/:tenantId", async (req, res): Promise<void> => {
  const params = GetTenantParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [row] = await db
    .select()
    .from(tenantsTable)
    .where(eq(tenantsTable.id, params.data.tenantId));
  if (!row) {
    res.status(404).json({ error: "Tenant not found" });
    return;
  }
  res.json(GetTenantResponse.parse(mapTenant(row)));
});

router.patch("/tenants/:tenantId", async (req, res): Promise<void> => {
  const params = UpdateTenantParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateTenantBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const d = parsed.data;
  const update: Record<string, unknown> = {};
  if (d.name !== undefined) update.name = d.name;
  if (d.certificatePrefix !== undefined) update.certificatePrefix = d.certificatePrefix;
  if (d.fee !== undefined) update.fee = String(d.fee);
  if (d.currency !== undefined) update.currency = d.currency;
  if (d.status !== undefined) update.status = d.status;
  if (d.contactEmail !== undefined) update.contactEmail = d.contactEmail;
  if (d.contactPhone !== undefined) update.contactPhone = d.contactPhone;
  if (d.address !== undefined) update.address = d.address;
  if (d.capital !== undefined) update.capital = d.capital;
  if (d.primaryColor !== undefined) update.primaryColor = d.primaryColor;
  if (d.tagline !== undefined) update.tagline = d.tagline;

  const [row] = await db
    .update(tenantsTable)
    .set(update)
    .where(eq(tenantsTable.id, params.data.tenantId))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Tenant not found" });
    return;
  }
  await recordAudit({
    tenantId: row.id,
    actorName: "Administrator",
    actorRole: "tenant_admin",
    action: d.status ? `Set tenant status to ${d.status}` : "Updated tenant settings",
    recordType: "tenant",
    recordId: row.id,
    outcome: "success",
    detail: `Updated ${row.name}`,
  });
  res.json(UpdateTenantResponse.parse(mapTenant(row)));
});

// Geography
router.get("/tenants/:tenantId/lgas", async (req, res): Promise<void> => {
  const params = ListLgasParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const lgas = await db
    .select()
    .from(lgasTable)
    .where(eq(lgasTable.tenantId, params.data.tenantId));
  const lgaIds = lgas.map((l) => l.id);
  const wards =
    lgaIds.length > 0
      ? await db.select().from(wardsTable).where(inArray(wardsTable.lgaId, lgaIds))
      : [];
  lgas.sort((a, b) => a.name.localeCompare(b.name));
  const data = lgas.map((l) =>
    mapLga(
      l,
      wards.filter((w) => w.lgaId === l.id).sort((a, b) => a.name.localeCompare(b.name)),
    ),
  );
  res.json(ListLgasResponse.parse(data));
});

router.post("/tenants/:tenantId/lgas", async (req, res): Promise<void> => {
  const params = CreateLgaParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = CreateLgaBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db
    .insert(lgasTable)
    .values({
      tenantId: params.data.tenantId,
      name: parsed.data.name,
      code: parsed.data.code ?? null,
    })
    .returning();
  await recordAudit({
    tenantId: params.data.tenantId,
    actorName: "Administrator",
    actorRole: "tenant_admin",
    action: "Added LGA",
    recordType: "lga",
    recordId: row.id,
    outcome: "success",
    detail: `Added ${row.name}`,
  });
  res.status(201).json(mapLga(row, []));
});

router.post("/lgas/:lgaId/wards", async (req, res): Promise<void> => {
  const params = CreateWardParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = CreateWardBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db
    .insert(wardsTable)
    .values({ lgaId: params.data.lgaId, name: parsed.data.name })
    .returning();
  res.status(201).json(mapWard(row));
});

// Officers
router.get("/tenants/:tenantId/officers", async (req, res): Promise<void> => {
  const params = ListOfficersParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const officers = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.tenantId, params.data.tenantId));
  const filtered = officers.filter((o) => o.role === "officer" || o.role === "tenant_admin");
  const reviewed = await db
    .select()
    .from(applicationsTable)
    .where(eq(applicationsTable.tenantId, params.data.tenantId));
  const counts = new Map<number, number>();
  for (const a of reviewed) {
    if (a.reviewedById != null) {
      counts.set(a.reviewedById, (counts.get(a.reviewedById) ?? 0) + 1);
    }
  }
  filtered.sort((a, b) => a.name.localeCompare(b.name));
  const data = filtered.map((o) => mapOfficer(o, counts.get(o.id) ?? 0));
  res.json(ListOfficersResponse.parse(data));
});

router.post("/tenants/:tenantId/officers", async (req, res): Promise<void> => {
  const params = CreateOfficerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = CreateOfficerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db
    .insert(usersTable)
    .values({
      name: parsed.data.name,
      email: parsed.data.email,
      role: parsed.data.role ?? "officer",
      tenantId: params.data.tenantId,
      status: "active",
    })
    .returning();
  await recordAudit({
    tenantId: params.data.tenantId,
    actorName: "Administrator",
    actorRole: "tenant_admin",
    action: "Added officer",
    recordType: "user",
    recordId: row.id,
    outcome: "success",
    detail: `Granted ${row.role} access to ${row.name}`,
  });
  res.status(201).json(mapOfficer(row, 0));
});

// Dashboard
router.get("/tenants/:tenantId/dashboard", async (req, res): Promise<void> => {
  const params = GetTenantDashboardParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const tenantId = params.data.tenantId;
  const [tenant] = await db.select().from(tenantsTable).where(eq(tenantsTable.id, tenantId));
  if (!tenant) {
    res.status(404).json({ error: "Tenant not found" });
    return;
  }
  const apps = await db
    .select()
    .from(applicationsTable)
    .where(eq(applicationsTable.tenantId, tenantId));
  const certs = await db
    .select()
    .from(certificatesTable)
    .where(eq(certificatesTable.tenantId, tenantId));
  const payments = await db
    .select()
    .from(paymentsTable)
    .where(eq(paymentsTable.tenantId, tenantId));
  const lgas = await db.select().from(lgasTable).where(eq(lgasTable.tenantId, tenantId));
  const users = await db.select().from(usersTable).where(eq(usersTable.tenantId, tenantId));
  const lgaNames = new Map(lgas.map((l) => [l.id, l.name]));
  const userNames = new Map(users.map((u) => [u.id, u.name]));

  const successfulPayments = payments.filter((p) => p.status === "success");
  const totalRevenue = successfulPayments.reduce((sum, p) => sum + num(p.amount), 0);

  const statusOrder = [
    "draft",
    "awaiting_payment",
    "paid",
    "under_review",
    "issued",
    "rejected",
    "revoked",
  ];
  const statusMap = new Map<string, number>();
  for (const a of apps) statusMap.set(a.status, (statusMap.get(a.status) ?? 0) + 1);
  const statusBreakdown = statusOrder
    .filter((s) => statusMap.has(s))
    .map((s) => ({ status: s, count: statusMap.get(s) ?? 0 }));

  const lgaMap = new Map<string, number>();
  for (const a of apps) {
    const nm = a.lgaId != null ? lgaNames.get(a.lgaId) ?? "Unassigned" : "Unassigned";
    lgaMap.set(nm, (lgaMap.get(nm) ?? 0) + 1);
  }
  const lgaBreakdown = [...lgaMap.entries()]
    .map(([lgaName, count]) => ({ lgaName, count }))
    .sort((a, b) => b.count - a.count);

  const now = new Date();
  const monthlyTrend: { month: string; applications: number; certificates: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleString("en-US", { month: "short" });
    const inMonth = (ts: Date | null) =>
      ts != null &&
      ts.getFullYear() === d.getFullYear() &&
      ts.getMonth() === d.getMonth();
    monthlyTrend.push({
      month: label,
      applications: apps.filter((a) => inMonth(a.createdAt)).length,
      certificates: certs.filter((c) => inMonth(c.issueDate)).length,
    });
  }

  const pendingReview = apps.filter(
    (a) => a.status === "paid" || a.status === "under_review",
  ).length;
  const issuedCertificates = certs.filter((c) => c.status === "valid").length;
  const rejectedApplications = apps.filter((a) => a.status === "rejected").length;

  const docsByApp = new Map<number, never[]>();
  const sortedApps = [...apps].sort(
    (a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0),
  );
  const recentApplications = sortedApps.slice(0, 6).map((a) =>
    mapApplication(a, {
      tenantName: tenant.name,
      applicantName: fullName(a.firstName, a.middleName, a.lastName) || "Applicant",
      lgaName: a.lgaId != null ? lgaNames.get(a.lgaId) ?? null : null,
      wardName: null,
      reviewedByName: a.reviewedById != null ? userNames.get(a.reviewedById) ?? null : null,
      documents: docsByApp.get(a.id) ?? [],
      payment: null,
      certificate: null,
    }),
  );

  const auditRows = await db
    .select()
    .from(auditLogsTable)
    .where(eq(auditLogsTable.tenantId, tenantId))
    .orderBy(desc(auditLogsTable.createdAt))
    .limit(8);
  const recentActivity = auditRows.map((r) => mapAuditLog(r, tenant.name));

  const data = {
    tenantId,
    tenantName: tenant.name,
    totalApplications: apps.length,
    pendingReview,
    issuedCertificates,
    rejectedApplications,
    totalRevenue,
    successfulPayments: successfulPayments.length,
    statusBreakdown,
    lgaBreakdown,
    monthlyTrend,
    recentApplications,
    recentActivity,
  };
  res.json(GetTenantDashboardResponse.parse(data));
});

export default router;

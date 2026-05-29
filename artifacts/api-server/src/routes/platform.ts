import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import {
  db,
  tenantsTable,
  applicationsTable,
  certificatesTable,
  paymentsTable,
  auditLogsTable,
  notificationsTable,
} from "@workspace/db";
import {
  GetPlatformOverviewResponse,
  ListAuditLogsResponse,
  ListNotificationsResponse,
  MarkNotificationReadParams,
  MarkNotificationReadResponse,
} from "@workspace/api-zod";
import { mapAuditLog, mapNotification, num } from "../lib/serialize";

const router: IRouter = Router();

router.get("/platform/overview", async (_req, res): Promise<void> => {
  const tenants = await db.select().from(tenantsTable);
  const apps = await db.select().from(applicationsTable);
  const certs = await db.select().from(certificatesTable);
  const payments = await db.select().from(paymentsTable);

  const successful = payments.filter((p) => p.status === "success");
  const totalRevenue = successful.reduce((sum, p) => sum + num(p.amount), 0);

  const tenantStats = tenants
    .map((t) => {
      const tApps = apps.filter((a) => a.tenantId === t.id);
      const tCerts = certs.filter((c) => c.tenantId === t.id && c.status === "valid");
      const tRevenue = successful
        .filter((p) => p.tenantId === t.id)
        .reduce((sum, p) => sum + num(p.amount), 0);
      return {
        tenantId: t.id,
        tenantName: t.name,
        status: t.status,
        applications: tApps.length,
        certificates: tCerts.length,
        revenue: tRevenue,
      };
    })
    .sort((a, b) => b.applications - a.applications);

  const tenantNames = new Map(tenants.map((t) => [t.id, t.name]));
  const auditRows = await db
    .select()
    .from(auditLogsTable)
    .orderBy(desc(auditLogsTable.createdAt))
    .limit(10);
  const recentActivity = auditRows.map((r) =>
    mapAuditLog(r, r.tenantId != null ? tenantNames.get(r.tenantId) ?? null : null),
  );

  const data = {
    totalTenants: tenants.length,
    activeTenants: tenants.filter((t) => t.status === "active").length,
    suspendedTenants: tenants.filter((t) => t.status === "suspended").length,
    totalApplications: apps.length,
    totalCertificates: certs.filter((c) => c.status === "valid").length,
    totalRevenue,
    tenants: tenantStats,
    recentActivity,
  };
  res.json(GetPlatformOverviewResponse.parse(data));
});

router.get("/audit-logs", async (req, res): Promise<void> => {
  const tenantId = typeof req.query.tenantId === "string" ? Number(req.query.tenantId) : undefined;
  const limit = typeof req.query.limit === "string" ? Number(req.query.limit) : 50;
  const tenants = await db.select().from(tenantsTable);
  const tenantNames = new Map(tenants.map((t) => [t.id, t.name]));

  const rows = tenantId
    ? await db
        .select()
        .from(auditLogsTable)
        .where(eq(auditLogsTable.tenantId, tenantId))
        .orderBy(desc(auditLogsTable.createdAt))
        .limit(limit)
    : await db
        .select()
        .from(auditLogsTable)
        .orderBy(desc(auditLogsTable.createdAt))
        .limit(limit);

  const data = rows.map((r) =>
    mapAuditLog(r, r.tenantId != null ? tenantNames.get(r.tenantId) ?? null : null),
  );
  res.json(ListAuditLogsResponse.parse(data));
});

router.get("/notifications", async (req, res): Promise<void> => {
  const userId = typeof req.query.userId === "string" ? Number(req.query.userId) : NaN;
  if (Number.isNaN(userId)) {
    res.status(400).json({ error: "userId is required" });
    return;
  }
  const rows = await db
    .select()
    .from(notificationsTable)
    .where(eq(notificationsTable.userId, userId))
    .orderBy(desc(notificationsTable.createdAt));
  res.json(ListNotificationsResponse.parse(rows.map(mapNotification)));
});

router.post("/notifications/:notificationId/read", async (req, res): Promise<void> => {
  const params = MarkNotificationReadParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [row] = await db
    .update(notificationsTable)
    .set({ read: true })
    .where(eq(notificationsTable.id, params.data.notificationId))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Notification not found" });
    return;
  }
  res.json(MarkNotificationReadResponse.parse(mapNotification(row)));
});

export default router;

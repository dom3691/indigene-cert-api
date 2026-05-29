import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import {
  db,
  certificatesTable,
  tenantsTable,
  applicationsTable,
  notificationsTable,
} from "@workspace/db";
import {
  GetCertificateParams,
  GetCertificateResponse,
  RevokeCertificateParams,
  RevokeCertificateBody,
  RevokeCertificateResponse,
  VerifyCertificateParams,
  VerifyCertificateResponse,
} from "@workspace/api-zod";
import { mapCertificate, iso } from "../lib/serialize";
import { recordAudit } from "../lib/audit";

const router: IRouter = Router();

router.get("/certificates/:certificateId", async (req, res): Promise<void> => {
  const params = GetCertificateParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [row] = await db
    .select()
    .from(certificatesTable)
    .where(eq(certificatesTable.id, params.data.certificateId));
  if (!row) {
    res.status(404).json({ error: "Certificate not found" });
    return;
  }
  const [tenant] = await db.select().from(tenantsTable).where(eq(tenantsTable.id, row.tenantId));
  res.json(GetCertificateResponse.parse(mapCertificate(row, tenant?.name ?? null)));
});

router.post("/certificates/:certificateId/revoke", async (req, res): Promise<void> => {
  const params = RevokeCertificateParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = RevokeCertificateBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db
    .update(certificatesTable)
    .set({ status: "revoked", revokedReason: parsed.data.reason })
    .where(eq(certificatesTable.id, params.data.certificateId))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Certificate not found" });
    return;
  }
  await db
    .update(applicationsTable)
    .set({ status: "revoked" })
    .where(eq(applicationsTable.id, row.applicationId));

  const [app] = await db
    .select()
    .from(applicationsTable)
    .where(eq(applicationsTable.id, row.applicationId));
  if (app) {
    await db.insert(notificationsTable).values({
      userId: app.applicantId,
      applicationId: app.id,
      type: "revoked",
      title: "Certificate revoked",
      message: `Certificate ${row.certificateNumber} has been revoked. ${parsed.data.reason}`,
    });
  }
  const [tenant] = await db.select().from(tenantsTable).where(eq(tenantsTable.id, row.tenantId));
  await recordAudit({
    tenantId: row.tenantId,
    actorName: "Issuing Officer",
    actorRole: "officer",
    action: "Revoked certificate",
    recordType: "certificate",
    recordId: row.certificateNumber,
    outcome: "revoked",
    detail: parsed.data.reason,
  });
  res.json(RevokeCertificateResponse.parse(mapCertificate(row, tenant?.name ?? null)));
});

router.get("/verify/:certificateNumber", async (req, res): Promise<void> => {
  const params = VerifyCertificateParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [row] = await db
    .select()
    .from(certificatesTable)
    .where(eq(certificatesTable.certificateNumber, params.data.certificateNumber));

  if (!row) {
    res.json(
      VerifyCertificateResponse.parse({
        found: false,
        status: "not_found",
        result: "No certificate matches this number. It may be invalid or fraudulent.",
        certificateNumber: params.data.certificateNumber,
      }),
    );
    return;
  }
  const [tenant] = await db.select().from(tenantsTable).where(eq(tenantsTable.id, row.tenantId));
  const isValid = row.status === "valid";
  res.json(
    VerifyCertificateResponse.parse({
      found: true,
      status: row.status,
      result: isValid
        ? "This is a genuine, valid indigene certificate."
        : "This certificate has been revoked and is no longer valid.",
      certificateNumber: row.certificateNumber,
      applicantDisplayName: row.applicantDisplayName,
      tenantName: tenant?.name ?? null,
      lgaName: row.lgaName,
      stateOfOrigin: row.stateOfOrigin,
      issueDate: iso(row.issueDate),
    }),
  );
});

export default router;

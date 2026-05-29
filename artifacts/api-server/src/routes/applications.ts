import { Router, type IRouter } from "express";
import { eq, desc, and, type SQL } from "drizzle-orm";
import {
  db,
  applicationsTable,
  documentsTable,
  paymentsTable,
  certificatesTable,
  tenantsTable,
  usersTable,
  notificationsTable,
} from "@workspace/db";
import {
  ListApplicationsResponse,
  CreateApplicationBody,
  GetApplicationParams,
  GetApplicationResponse,
  UpdateApplicationParams,
  UpdateApplicationBody,
  UpdateApplicationResponse,
  AddDocumentParams,
  AddDocumentBody,
  PayApplicationParams,
  PayApplicationBody,
  PayApplicationResponse,
  ApproveApplicationParams,
  ApproveApplicationBody,
  ApproveApplicationResponse,
  RejectApplicationParams,
  RejectApplicationBody,
  RejectApplicationResponse,
} from "@workspace/api-zod";
import { mapDocument, num } from "../lib/serialize";
import { buildApplicationDto, buildApplicationDtos, applicantDisplayName } from "../lib/relations";
import { recordAudit } from "../lib/audit";

const router: IRouter = Router();

const APPLICATION_STATUSES = [
  "draft",
  "awaiting_payment",
  "paid",
  "under_review",
  "issued",
  "rejected",
  "revoked",
] as const;

function ref(prefix: string): string {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 9000 + 1000)}`;
}

router.get("/applications", async (req, res): Promise<void> => {
  const conds: SQL[] = [];
  const q = req.query;
  if (typeof q.applicantId === "string")
    conds.push(eq(applicationsTable.applicantId, Number(q.applicantId)));
  if (typeof q.tenantId === "string")
    conds.push(eq(applicationsTable.tenantId, Number(q.tenantId)));
  if (typeof q.status === "string") conds.push(eq(applicationsTable.status, q.status));
  if (typeof q.lgaId === "string") conds.push(eq(applicationsTable.lgaId, Number(q.lgaId)));
  if (typeof q.officerId === "string")
    conds.push(eq(applicationsTable.reviewedById, Number(q.officerId)));

  const rows = await db
    .select()
    .from(applicationsTable)
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(desc(applicationsTable.createdAt));

  let dtos = await buildApplicationDtos(rows);

  if (typeof q.search === "string" && q.search.trim()) {
    const term = q.search.trim().toLowerCase();
    dtos = dtos.filter(
      (d) =>
        d.applicantName.toLowerCase().includes(term) ||
        (d.nin ?? "").toLowerCase().includes(term) ||
        (d.email ?? "").toLowerCase().includes(term) ||
        (d.certificate?.certificateNumber ?? "").toLowerCase().includes(term),
    );
  }
  res.json(ListApplicationsResponse.parse(dtos));
});

router.post("/applications", async (req, res): Promise<void> => {
  const parsed = CreateApplicationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const d = parsed.data;
  const [row] = await db
    .insert(applicationsTable)
    .values({
      tenantId: d.tenantId,
      applicantId: d.applicantId,
      firstName: d.firstName ?? null,
      middleName: d.middleName ?? null,
      lastName: d.lastName ?? null,
      gender: d.gender ?? null,
      dateOfBirth: d.dateOfBirth ?? null,
      nin: d.nin ?? null,
      email: d.email ?? null,
      phone: d.phone ?? null,
      residentialAddress: d.residentialAddress ?? null,
      stateOfOrigin: d.stateOfOrigin ?? null,
      lgaId: d.lgaId ?? null,
      wardId: d.wardId ?? null,
      fatherName: d.fatherName ?? null,
      motherName: d.motherName ?? null,
      community: d.community ?? null,
      status: "draft",
    })
    .returning();
  const dto = await buildApplicationDto(row);
  res.status(201).json(GetApplicationResponse.parse(dto));
});

router.get("/applications/:applicationId", async (req, res): Promise<void> => {
  const params = GetApplicationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [row] = await db
    .select()
    .from(applicationsTable)
    .where(eq(applicationsTable.id, params.data.applicationId));
  if (!row) {
    res.status(404).json({ error: "Application not found" });
    return;
  }
  const dto = await buildApplicationDto(row);
  res.json(GetApplicationResponse.parse(dto));
});

router.patch("/applications/:applicationId", async (req, res): Promise<void> => {
  const params = UpdateApplicationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateApplicationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const d = parsed.data;

  const [current] = await db
    .select()
    .from(applicationsTable)
    .where(eq(applicationsTable.id, params.data.applicationId));
  if (!current) {
    res.status(404).json({ error: "Application not found" });
    return;
  }

  if (d.status !== undefined) {
    if (!APPLICATION_STATUSES.includes(d.status as (typeof APPLICATION_STATUSES)[number])) {
      res.status(400).json({ error: `Invalid status: ${d.status}` });
      return;
    }
    // The self-service endpoint may only submit a draft for payment.
    // Officer-driven transitions (approve/reject) and payment use dedicated endpoints.
    const isSubmit = current.status === "draft" && d.status === "awaiting_payment";
    const isNoop = d.status === current.status;
    if (!isSubmit && !isNoop) {
      res.status(409).json({
        error: `Cannot change status from ${current.status} to ${d.status} via this endpoint`,
      });
      return;
    }
  }

  // Applicant details may only be edited while the application is still a draft.
  const editsDetails = Object.keys(d).some((k) => k !== "status" && d[k as keyof typeof d] !== undefined);
  if (editsDetails && current.status !== "draft") {
    res.status(409).json({ error: "Application details can only be edited while in draft" });
    return;
  }

  const update: Record<string, unknown> = {};
  for (const key of [
    "firstName",
    "middleName",
    "lastName",
    "gender",
    "dateOfBirth",
    "nin",
    "email",
    "phone",
    "residentialAddress",
    "stateOfOrigin",
    "lgaId",
    "wardId",
    "fatherName",
    "motherName",
    "community",
    "status",
  ] as const) {
    if (d[key] !== undefined) update[key] = d[key];
  }
  if (d.status === "awaiting_payment") {
    update.submittedAt = new Date();
  }

  const [row] = await db
    .update(applicationsTable)
    .set(update)
    .where(eq(applicationsTable.id, params.data.applicationId))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Application not found" });
    return;
  }
  if (d.status === "awaiting_payment") {
    await recordAudit({
      tenantId: row.tenantId,
      actorName: await applicantDisplayName(row),
      actorRole: "applicant",
      action: "Submitted application",
      recordType: "application",
      recordId: row.id,
      outcome: "success",
      detail: "Application submitted, awaiting payment",
    });
  }
  const dto = await buildApplicationDto(row);
  res.json(UpdateApplicationResponse.parse(dto));
});

router.post("/applications/:applicationId/documents", async (req, res): Promise<void> => {
  const params = AddDocumentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = AddDocumentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db
    .insert(documentsTable)
    .values({
      applicationId: params.data.applicationId,
      name: parsed.data.name,
      type: parsed.data.type,
      fileName: parsed.data.fileName,
      sizeKb: parsed.data.sizeKb ?? null,
    })
    .returning();
  res.status(201).json(mapDocument(row));
});

router.post("/applications/:applicationId/pay", async (req, res): Promise<void> => {
  const params = PayApplicationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = PayApplicationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [app] = await db
    .select()
    .from(applicationsTable)
    .where(eq(applicationsTable.id, params.data.applicationId));
  if (!app) {
    res.status(404).json({ error: "Application not found" });
    return;
  }
  if (app.status !== "awaiting_payment") {
    res.status(409).json({
      error: `Payment is only allowed while awaiting payment (current status: ${app.status})`,
    });
    return;
  }
  const [tenant] = await db.select().from(tenantsTable).where(eq(tenantsTable.id, app.tenantId));
  const fee = tenant ? num(tenant.fee) : 0;
  const currency = tenant?.currency ?? "NGN";

  const existing = await db
    .select()
    .from(paymentsTable)
    .where(eq(paymentsTable.applicationId, app.id));
  if (existing.length === 0) {
    await db.insert(paymentsTable).values({
      applicationId: app.id,
      tenantId: app.tenantId,
      amount: String(fee),
      currency,
      reference: ref("PAY"),
      gateway: parsed.data.method ?? "Card",
      status: "success",
      payerName: parsed.data.payerName,
      receiptNumber: ref("RCPT"),
    });
  }
  const [row] = await db
    .update(applicationsTable)
    .set({ status: "paid" })
    .where(eq(applicationsTable.id, app.id))
    .returning();
  await recordAudit({
    tenantId: app.tenantId,
    actorName: parsed.data.payerName,
    actorRole: "applicant",
    action: "Paid application fee",
    recordType: "payment",
    recordId: app.id,
    outcome: "success",
    detail: `${currency} ${fee.toLocaleString()} received`,
  });
  const dto = await buildApplicationDto(row);
  res.json(PayApplicationResponse.parse(dto));
});

router.post("/applications/:applicationId/approve", async (req, res): Promise<void> => {
  const params = ApproveApplicationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = ApproveApplicationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [app] = await db
    .select()
    .from(applicationsTable)
    .where(eq(applicationsTable.id, params.data.applicationId));
  if (!app) {
    res.status(404).json({ error: "Application not found" });
    return;
  }
  if (app.status !== "paid" && app.status !== "under_review" && app.status !== "revoked") {
    res.status(409).json({
      error: `Only paid, under-review, or revoked applications can be approved (current status: ${app.status})`,
    });
    return;
  }
  const [tenant] = await db.select().from(tenantsTable).where(eq(tenantsTable.id, app.tenantId));
  const [officer] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, parsed.data.officerId));
  if (!officer || officer.tenantId !== app.tenantId || officer.role !== "officer") {
    res.status(403).json({ error: "Officer is not authorized to issue for this tenant" });
    return;
  }

  let lgaName: string | null = null;
  let wardName: string | null = null;
  if (app.lgaId != null) {
    const { lgasTable } = await import("@workspace/db");
    const [lga] = await db.select().from(lgasTable).where(eq(lgasTable.id, app.lgaId));
    lgaName = lga?.name ?? null;
  }
  if (app.wardId != null) {
    const { wardsTable } = await import("@workspace/db");
    const [ward] = await db.select().from(wardsTable).where(eq(wardsTable.id, app.wardId));
    wardName = ward?.name ?? null;
  }

  const displayName = await applicantDisplayName(app);
  const reviewedAt = new Date();

  let [cert] = await db
    .select()
    .from(certificatesTable)
    .where(eq(certificatesTable.applicationId, app.id));
  if (!cert) {
    const prefix = tenant?.certificatePrefix ?? "CERT";
    const year = reviewedAt.getFullYear();
    const serial = String(app.id).padStart(5, "0");
    const certificateNumber = `${prefix}/${year}/${serial}`;
    [cert] = await db
      .insert(certificatesTable)
      .values({
        applicationId: app.id,
        tenantId: app.tenantId,
        certificateNumber,
        applicantDisplayName: displayName,
        lgaName,
        wardName,
        stateOfOrigin: app.stateOfOrigin ?? tenant?.name ?? null,
        status: "valid",
        issuedById: officer?.id ?? null,
        issuedByName: officer?.name ?? null,
      })
      .returning();
  } else if (cert.status !== "valid") {
    // Re-approving a previously revoked application restores its certificate.
    [cert] = await db
      .update(certificatesTable)
      .set({
        status: "valid",
        revokedReason: null,
        issuedById: officer?.id ?? null,
        issuedByName: officer?.name ?? null,
      })
      .where(eq(certificatesTable.id, cert.id))
      .returning();
  }

  const [row] = await db
    .update(applicationsTable)
    .set({
      status: "issued",
      reviewedById: parsed.data.officerId,
      reviewedAt,
      rejectionReason: null,
    })
    .where(eq(applicationsTable.id, app.id))
    .returning();

  await db.insert(notificationsTable).values({
    userId: app.applicantId,
    applicationId: app.id,
    type: "approved",
    title: "Certificate issued",
    message: `Your indigene certificate ${cert.certificateNumber} has been issued.`,
  });
  await recordAudit({
    tenantId: app.tenantId,
    actorName: officer?.name ?? "Issuing Officer",
    actorRole: "officer",
    action: "Approved application",
    recordType: "certificate",
    recordId: cert.certificateNumber,
    outcome: "issued",
    detail: `Issued certificate to ${displayName}`,
  });

  const dto = await buildApplicationDto(row);
  res.json(ApproveApplicationResponse.parse(dto));
});

router.post("/applications/:applicationId/reject", async (req, res): Promise<void> => {
  const params = RejectApplicationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = RejectApplicationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [app] = await db
    .select()
    .from(applicationsTable)
    .where(eq(applicationsTable.id, params.data.applicationId));
  if (!app) {
    res.status(404).json({ error: "Application not found" });
    return;
  }
  if (app.status !== "paid" && app.status !== "under_review") {
    res.status(409).json({
      error: `Only paid applications under review can be rejected (current status: ${app.status})`,
    });
    return;
  }
  const [officer] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, parsed.data.officerId));
  if (!officer || officer.tenantId !== app.tenantId || officer.role !== "officer") {
    res.status(403).json({ error: "Officer is not authorized to review for this tenant" });
    return;
  }
  const [row] = await db
    .update(applicationsTable)
    .set({
      status: "rejected",
      reviewedById: parsed.data.officerId,
      reviewedAt: new Date(),
      rejectionReason: parsed.data.reason,
    })
    .where(eq(applicationsTable.id, app.id))
    .returning();

  await db.insert(notificationsTable).values({
    userId: app.applicantId,
    applicationId: app.id,
    type: "rejected",
    title: "Application rejected",
    message: parsed.data.reason,
  });
  await recordAudit({
    tenantId: app.tenantId,
    actorName: officer?.name ?? "Issuing Officer",
    actorRole: "officer",
    action: "Rejected application",
    recordType: "application",
    recordId: app.id,
    outcome: "rejected",
    detail: parsed.data.reason,
  });

  const dto = await buildApplicationDto(row);
  res.json(RejectApplicationResponse.parse(dto));
});

export default router;

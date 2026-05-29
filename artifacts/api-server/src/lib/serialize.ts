import type {
  Tenant,
  Lga,
  Ward,
  User,
  Application,
  Document,
  Payment,
  Certificate,
  AuditLog,
  Notification,
} from "@workspace/db";

export function iso(d: Date | string | null | undefined): string | null {
  if (d == null) return null;
  return d instanceof Date ? d.toISOString() : new Date(d).toISOString();
}

export function num(v: string | number | null | undefined): number {
  if (v == null) return 0;
  return typeof v === "number" ? v : Number(v);
}

export function verificationUrl(certificateNumber: string): string {
  return `/verify?cert=${encodeURIComponent(certificateNumber)}`;
}

export function fullName(
  first?: string | null,
  middle?: string | null,
  last?: string | null,
): string {
  return [first, middle, last].filter(Boolean).join(" ").trim();
}

export function mapTenant(row: Tenant) {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    slug: row.slug,
    certificatePrefix: row.certificatePrefix,
    fee: num(row.fee),
    currency: row.currency,
    status: row.status,
    contactEmail: row.contactEmail,
    contactPhone: row.contactPhone,
    address: row.address,
    capital: row.capital,
    logoUrl: row.logoUrl,
    primaryColor: row.primaryColor,
    tagline: row.tagline,
    createdAt: iso(row.createdAt),
  };
}

export function mapWard(row: Ward) {
  return { id: row.id, lgaId: row.lgaId, name: row.name };
}

export function mapLga(row: Lga, wards: Ward[]) {
  return {
    id: row.id,
    tenantId: row.tenantId,
    name: row.name,
    code: row.code,
    wards: wards.map(mapWard),
  };
}

export function mapAccount(row: User, tenantName: string | null) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    tenantId: row.tenantId,
    tenantName,
  };
}

export function mapOfficer(row: User, reviewedCount: number) {
  return {
    id: row.id,
    tenantId: row.tenantId ?? 0,
    name: row.name,
    email: row.email,
    role: row.role,
    status: row.status,
    reviewedCount,
    createdAt: iso(row.createdAt),
  };
}

export function mapDocument(row: Document) {
  return {
    id: row.id,
    applicationId: row.applicationId,
    name: row.name,
    type: row.type,
    fileName: row.fileName,
    sizeKb: row.sizeKb,
    uploadedAt: iso(row.uploadedAt),
  };
}

export function mapPayment(row: Payment) {
  return {
    id: row.id,
    applicationId: row.applicationId,
    tenantId: row.tenantId,
    amount: num(row.amount),
    currency: row.currency,
    reference: row.reference,
    gateway: row.gateway,
    status: row.status,
    payerName: row.payerName,
    receiptNumber: row.receiptNumber,
    paidAt: iso(row.paidAt),
  };
}

export function mapCertificate(row: Certificate, tenantName: string | null) {
  return {
    id: row.id,
    applicationId: row.applicationId,
    tenantId: row.tenantId,
    tenantName,
    certificateNumber: row.certificateNumber,
    applicantDisplayName: row.applicantDisplayName,
    lgaName: row.lgaName,
    wardName: row.wardName,
    stateOfOrigin: row.stateOfOrigin,
    issueDate: iso(row.issueDate) ?? new Date().toISOString(),
    status: row.status,
    verificationUrl: verificationUrl(row.certificateNumber),
    issuedByName: row.issuedByName,
    revokedReason: row.revokedReason,
  };
}

export interface ApplicationRelations {
  tenantName: string | null;
  applicantName: string;
  lgaName: string | null;
  wardName: string | null;
  reviewedByName: string | null;
  documents: Document[];
  payment: Payment | null;
  certificate: Certificate | null;
}

export function mapApplication(row: Application, rel: ApplicationRelations) {
  return {
    id: row.id,
    tenantId: row.tenantId,
    tenantName: rel.tenantName,
    applicantId: row.applicantId,
    applicantName: rel.applicantName,
    firstName: row.firstName,
    middleName: row.middleName,
    lastName: row.lastName,
    gender: row.gender,
    dateOfBirth: row.dateOfBirth,
    nin: row.nin,
    email: row.email,
    phone: row.phone,
    residentialAddress: row.residentialAddress,
    stateOfOrigin: row.stateOfOrigin,
    lgaId: row.lgaId,
    lgaName: rel.lgaName,
    wardId: row.wardId,
    wardName: rel.wardName,
    fatherName: row.fatherName,
    motherName: row.motherName,
    community: row.community,
    status: row.status,
    rejectionReason: row.rejectionReason,
    submittedAt: iso(row.submittedAt),
    reviewedAt: iso(row.reviewedAt),
    reviewedById: row.reviewedById,
    reviewedByName: rel.reviewedByName,
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
    documents: rel.documents.map(mapDocument),
    payment: rel.payment ? mapPayment(rel.payment) : null,
    certificate: rel.certificate ? mapCertificate(rel.certificate, rel.tenantName) : null,
  };
}

export function mapAuditLog(row: AuditLog, tenantName: string | null) {
  return {
    id: row.id,
    tenantId: row.tenantId,
    tenantName,
    actorName: row.actorName,
    actorRole: row.actorRole,
    action: row.action,
    recordType: row.recordType,
    recordId: row.recordId,
    outcome: row.outcome,
    detail: row.detail,
    createdAt: iso(row.createdAt) ?? new Date().toISOString(),
  };
}

export function mapNotification(row: Notification) {
  return {
    id: row.id,
    userId: row.userId,
    applicationId: row.applicationId,
    type: row.type,
    title: row.title,
    message: row.message,
    read: row.read,
    createdAt: iso(row.createdAt) ?? new Date().toISOString(),
  };
}

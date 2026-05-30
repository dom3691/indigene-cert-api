// TypeScript interfaces for all DTOs in the Indigene Certificate System API.
// Field names match the API contract (camelCase) exactly.

export type Role = 'super_admin' | 'tenant_admin' | 'officer' | 'applicant';

export interface Account {
  id: number;
  name: string;
  email: string;
  role: string;
  tenantId?: number | null;
  tenantName?: string | null;
}

export interface Tenant {
  id: number;
  name: string;
  code: string;
  slug: string;
  certificatePrefix: string;
  fee: number;
  currency: string;
  status: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
  address?: string | null;
  capital?: string | null;
  logoUrl?: string | null;
  primaryColor?: string | null;
  tagline?: string | null;
  createdAt?: string | null;
}

export interface TenantInput {
  name: string;
  code: string;
  certificatePrefix: string;
  fee: number;
  currency?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  capital?: string;
  primaryColor?: string;
  tagline?: string;
}

export interface TenantUpdate {
  name?: string;
  certificatePrefix?: string;
  fee?: number;
  currency?: string;
  status?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  capital?: string;
  primaryColor?: string;
  tagline?: string;
}

export interface Ward {
  id: number;
  lgaId: number;
  name: string;
}

export interface Lga {
  id: number;
  tenantId: number;
  name: string;
  code?: string | null;
  wards?: Ward[];
}

export interface LgaInput {
  name: string;
  code?: string;
}

export interface WardInput {
  name: string;
}

export interface Officer {
  id: number;
  tenantId: number;
  name: string;
  email: string;
  role: string;
  status: string;
  reviewedCount?: number | null;
  createdAt?: string | null;
}

export interface OfficerInput {
  name: string;
  email: string;
  role?: string;
}

export interface Document {
  id: number;
  applicationId: number;
  name: string;
  type: string;
  fileName: string;
  sizeKb?: number | null;
  uploadedAt?: string | null;
}

export interface DocumentInput {
  name: string;
  type: string;
  fileName: string;
  sizeKb?: number;
}

export interface Payment {
  id: number;
  applicationId: number;
  tenantId: number;
  amount: number;
  currency: string;
  reference: string;
  gateway?: string | null;
  status: string;
  payerName?: string | null;
  receiptNumber?: string | null;
  paidAt?: string | null;
}

export interface PaymentInput {
  payerName: string;
  method?: string;
}

export interface Certificate {
  id: number;
  applicationId: number;
  tenantId: number;
  tenantName?: string | null;
  certificateNumber: string;
  applicantDisplayName: string;
  lgaName?: string | null;
  wardName?: string | null;
  stateOfOrigin?: string | null;
  issueDate: string;
  status: string;
  verificationUrl: string;
  issuedByName?: string | null;
  revokedReason?: string | null;
}

export interface RevokeInput {
  reason: string;
}

export interface Application {
  id: number;
  tenantId: number;
  tenantName?: string | null;
  applicantId: number;
  applicantName: string;
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  nin?: string | null;
  email?: string | null;
  phone?: string | null;
  residentialAddress?: string | null;
  stateOfOrigin?: string | null;
  lgaId?: number | null;
  lgaName?: string | null;
  wardId?: number | null;
  wardName?: string | null;
  fatherName?: string | null;
  motherName?: string | null;
  community?: string | null;
  status: string;
  rejectionReason?: string | null;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  reviewedById?: number | null;
  reviewedByName?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  documents?: Document[];
  payment?: Payment | null;
  certificate?: Certificate | null;
}

export interface ApplicationInput {
  tenantId: number;
  applicantId: number;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  gender?: string;
  dateOfBirth?: string;
  nin?: string;
  email?: string;
  phone?: string;
  residentialAddress?: string;
  stateOfOrigin?: string;
  lgaId?: number;
  wardId?: number;
  fatherName?: string;
  motherName?: string;
  community?: string;
}

export interface ApplicationUpdate {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  gender?: string;
  dateOfBirth?: string;
  nin?: string;
  email?: string;
  phone?: string;
  residentialAddress?: string;
  stateOfOrigin?: string;
  lgaId?: number;
  wardId?: number;
  fatherName?: string;
  motherName?: string;
  community?: string;
  status?: string;
}

export interface ApprovalInput {
  officerId: number;
  note?: string;
}

export interface RejectionInput {
  officerId: number;
  reason: string;
}

export interface VerificationResult {
  found: boolean;
  status: string;
  result: string;
  certificateNumber?: string | null;
  applicantDisplayName?: string | null;
  tenantName?: string | null;
  lgaName?: string | null;
  stateOfOrigin?: string | null;
  issueDate?: string | null;
}

export interface StatusCount {
  status: string;
  count: number;
}

export interface LgaCount {
  lgaName: string;
  count: number;
}

export interface TrendPoint {
  month: string;
  applications: number;
  certificates: number;
}

export interface AuditLog {
  id: number;
  tenantId?: number | null;
  tenantName?: string | null;
  actorName: string;
  actorRole?: string | null;
  action: string;
  recordType?: string | null;
  recordId?: string | null;
  outcome?: string | null;
  detail?: string | null;
  createdAt: string;
}

export interface TenantDashboard {
  tenantId: number;
  tenantName?: string | null;
  totalApplications: number;
  pendingReview: number;
  issuedCertificates: number;
  rejectedApplications: number;
  totalRevenue: number;
  successfulPayments?: number;
  statusBreakdown?: StatusCount[];
  lgaBreakdown?: LgaCount[];
  monthlyTrend?: TrendPoint[];
  recentApplications?: Application[];
  recentActivity?: AuditLog[];
}

export interface TenantStat {
  tenantId: number;
  tenantName: string;
  status: string;
  applications: number;
  certificates: number;
  revenue: number;
}

export interface PlatformOverview {
  totalTenants: number;
  activeTenants: number;
  suspendedTenants: number;
  totalApplications: number;
  totalCertificates: number;
  totalRevenue: number;
  tenants?: TenantStat[];
  recentActivity?: AuditLog[];
}

export interface Notification {
  id: number;
  userId: number;
  applicationId?: number | null;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface ListApplicationsParams {
  applicantId?: number;
  tenantId?: number;
  status?: string;
  lgaId?: number;
  officerId?: number;
  search?: string;
}

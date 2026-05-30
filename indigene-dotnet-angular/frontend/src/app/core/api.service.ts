import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  Account,
  Application,
  ApplicationInput,
  ApplicationUpdate,
  ApprovalInput,
  AuditLog,
  Certificate,
  Document,
  DocumentInput,
  Lga,
  LgaInput,
  ListApplicationsParams,
  Notification,
  Officer,
  OfficerInput,
  PaymentInput,
  PlatformOverview,
  RejectionInput,
  RevokeInput,
  Tenant,
  TenantDashboard,
  TenantInput,
  TenantUpdate,
  VerificationResult,
  Ward,
  WardInput,
} from './models';

/**
 * Single typed gateway for every endpoint in the Indigene Certificate API.
 * Base path is "/api" (proxied to the backend in dev via proxy.conf.json).
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api';

  // ---- Health ----
  health(): Observable<{ status: string }> {
    return this.http.get<{ status: string }>(`${this.base}/healthz`);
  }

  // ---- Accounts (demo auth) ----
  getAccounts(): Observable<Account[]> {
    return this.http.get<Account[]>(`${this.base}/accounts`);
  }

  // ---- Tenants ----
  getTenants(status?: string): Observable<Tenant[]> {
    let params = new HttpParams();
    if (status) {
      params = params.set('status', status);
    }
    return this.http.get<Tenant[]>(`${this.base}/tenants`, { params });
  }

  createTenant(body: TenantInput): Observable<Tenant> {
    return this.http.post<Tenant>(`${this.base}/tenants`, body);
  }

  getTenant(id: number): Observable<Tenant> {
    return this.http.get<Tenant>(`${this.base}/tenants/${id}`);
  }

  updateTenant(id: number, body: TenantUpdate): Observable<Tenant> {
    return this.http.patch<Tenant>(`${this.base}/tenants/${id}`, body);
  }

  // ---- Geography ----
  getLgas(tenantId: number): Observable<Lga[]> {
    return this.http.get<Lga[]>(`${this.base}/tenants/${tenantId}/lgas`);
  }

  createLga(tenantId: number, body: LgaInput): Observable<Lga> {
    return this.http.post<Lga>(`${this.base}/tenants/${tenantId}/lgas`, body);
  }

  createWard(lgaId: number, body: WardInput): Observable<Ward> {
    return this.http.post<Ward>(`${this.base}/lgas/${lgaId}/wards`, body);
  }

  // ---- Officers (staff) ----
  getOfficers(tenantId: number): Observable<Officer[]> {
    return this.http.get<Officer[]>(`${this.base}/tenants/${tenantId}/officers`);
  }

  createOfficer(tenantId: number, body: OfficerInput): Observable<Officer> {
    return this.http.post<Officer>(
      `${this.base}/tenants/${tenantId}/officers`,
      body,
    );
  }

  // ---- Applications ----
  getApplications(filters: ListApplicationsParams = {}): Observable<Application[]> {
    let params = new HttpParams();
    if (filters.applicantId != null) {
      params = params.set('applicantId', filters.applicantId);
    }
    if (filters.tenantId != null) {
      params = params.set('tenantId', filters.tenantId);
    }
    if (filters.status) {
      params = params.set('status', filters.status);
    }
    if (filters.lgaId != null) {
      params = params.set('lgaId', filters.lgaId);
    }
    if (filters.officerId != null) {
      params = params.set('officerId', filters.officerId);
    }
    if (filters.search) {
      params = params.set('search', filters.search);
    }
    return this.http.get<Application[]>(`${this.base}/applications`, { params });
  }

  createApplication(body: ApplicationInput): Observable<Application> {
    return this.http.post<Application>(`${this.base}/applications`, body);
  }

  getApplication(id: number): Observable<Application> {
    return this.http.get<Application>(`${this.base}/applications/${id}`);
  }

  updateApplication(id: number, body: ApplicationUpdate): Observable<Application> {
    return this.http.patch<Application>(`${this.base}/applications/${id}`, body);
  }

  addDocument(applicationId: number, body: DocumentInput): Observable<Document> {
    return this.http.post<Document>(
      `${this.base}/applications/${applicationId}/documents`,
      body,
    );
  }

  payApplication(applicationId: number, body: PaymentInput): Observable<Application> {
    return this.http.post<Application>(
      `${this.base}/applications/${applicationId}/pay`,
      body,
    );
  }

  approveApplication(
    applicationId: number,
    body: ApprovalInput,
  ): Observable<Application> {
    return this.http.post<Application>(
      `${this.base}/applications/${applicationId}/approve`,
      body,
    );
  }

  rejectApplication(
    applicationId: number,
    body: RejectionInput,
  ): Observable<Application> {
    return this.http.post<Application>(
      `${this.base}/applications/${applicationId}/reject`,
      body,
    );
  }

  // ---- Certificates & verification ----
  getCertificate(id: number): Observable<Certificate> {
    return this.http.get<Certificate>(`${this.base}/certificates/${id}`);
  }

  revokeCertificate(id: number, body: RevokeInput): Observable<Certificate> {
    return this.http.post<Certificate>(
      `${this.base}/certificates/${id}/revoke`,
      body,
    );
  }

  verify(certificateNumber: string): Observable<VerificationResult> {
    // The backend exposes verify as a catch-all route ({*certificateNumber}), so the
    // slashes in a number like "LAG/2026/00001" must be sent literally. We trim and
    // encode only unsafe characters within each segment (cert numbers are otherwise
    // URL-safe: PREFIX/YEAR/digits), preserving the slashes as path separators.
    const path = certificateNumber
      .trim()
      .split('/')
      .map((segment) => encodeURIComponent(segment))
      .join('/');
    return this.http.get<VerificationResult>(`${this.base}/verify/${path}`);
  }

  // ---- Dashboard / platform / audit / notifications ----
  getTenantDashboard(tenantId: number): Observable<TenantDashboard> {
    return this.http.get<TenantDashboard>(
      `${this.base}/tenants/${tenantId}/dashboard`,
    );
  }

  getPlatformOverview(): Observable<PlatformOverview> {
    return this.http.get<PlatformOverview>(`${this.base}/platform/overview`);
  }

  getAuditLogs(tenantId?: number, limit?: number): Observable<AuditLog[]> {
    let params = new HttpParams();
    if (tenantId != null) {
      params = params.set('tenantId', tenantId);
    }
    if (limit != null) {
      params = params.set('limit', limit);
    }
    return this.http.get<AuditLog[]>(`${this.base}/audit-logs`, { params });
  }

  getNotifications(userId: number): Observable<Notification[]> {
    const params = new HttpParams().set('userId', userId);
    return this.http.get<Notification[]>(`${this.base}/notifications`, { params });
  }

  markNotificationRead(id: number): Observable<Notification> {
    return this.http.post<Notification>(
      `${this.base}/notifications/${id}/read`,
      {},
    );
  }
}

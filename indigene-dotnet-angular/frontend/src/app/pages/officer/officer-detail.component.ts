import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { QRCodeComponent } from 'angularx-qrcode';

import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { Application } from '../../core/models';
import { StatusBadgeComponent } from '../../shared/status-badge.component';

@Component({
  selector: 'app-officer-detail',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    RouterLink,
    QRCodeComponent,
    StatusBadgeComponent,
  ],
  template: `
    @if (loading()) {
      <p class="muted">Loading application...</p>
    } @else if (!app()) {
      <div class="empty">Application not found.</div>
    } @else {
      @if (app(); as a) {
        <div class="detail">
          <div class="row between" style="margin-bottom:1.25rem;">
            <div class="row">
              <a routerLink="/officer" class="btn ghost sm">&larr; Back</a>
              <div>
                <div class="row">
                  <h1 style="margin:0;">Review Application #{{ a.id }}</h1>
                  <app-status-badge [status]="a.status" />
                </div>
                <p class="muted" style="margin:0;">Applicant: {{ a.applicantName }}</p>
              </div>
            </div>

            @if (a.status === 'paid' || a.status === 'under_review') {
              <div class="row">
                <button class="btn danger" (click)="rejectOpen.set(true)">Reject</button>
                <button class="btn" (click)="approveOpen.set(true)">Approve &amp; Issue</button>
              </div>
            }
          </div>

          @if (a.status === 'rejected' && a.rejectionReason) {
            <div class="alert error">
              <strong>Application Rejected</strong>
              <p class="text-sm" style="margin:0.35rem 0 0;">{{ a.rejectionReason }}</p>
              <p class="text-xs" style="margin:0.5rem 0 0; opacity:0.8;">
                Reviewed by {{ a.reviewedByName || 'Officer' }}
                @if (a.reviewedAt) { on {{ a.reviewedAt | date: 'mediumDate' }} }
              </p>
            </div>
          }

          @if (a.status === 'issued') {
            <div class="alert success">
              <strong>Certificate Issued</strong>
              <p class="text-sm" style="margin:0.35rem 0 0;">
                Application was approved and a certificate was generated.
              </p>
            </div>
          }

          <div class="grid grid-2">
            <div class="card">
              <div class="card-header"><div class="card-title">Applicant Profile</div></div>
              <div class="card-body">
                <div class="grid grid-2">
                  <div class="kv"><span class="k">Full Name</span><span class="v">{{ a.firstName }} {{ a.middleName }} {{ a.lastName }}</span></div>
                  <div class="kv"><span class="k">Gender</span><span class="v">{{ a.gender }}</span></div>
                  <div class="kv"><span class="k">Date of Birth</span><span class="v">{{ a.dateOfBirth }}</span></div>
                  <div class="kv"><span class="k">NIN</span><span class="v mono">{{ a.nin }}</span></div>
                  <div class="kv"><span class="k">Email</span><span class="v">{{ a.email }}</span></div>
                  <div class="kv"><span class="k">Phone</span><span class="v">{{ a.phone }}</span></div>
                  <div class="kv" style="grid-column:1 / -1;"><span class="k">Address</span><span class="v">{{ a.residentialAddress }}</span></div>
                </div>
              </div>
            </div>

            <div class="card">
              <div class="card-header"><div class="card-title">Claim of Origin</div></div>
              <div class="card-body">
                <div class="grid grid-2">
                  <div class="kv"><span class="k">State</span><span class="v">{{ a.stateOfOrigin }}</span></div>
                  <div class="kv"><span class="k">LGA</span><span class="v">{{ a.lgaName }}</span></div>
                  <div class="kv"><span class="k">Ward</span><span class="v">{{ a.wardName }}</span></div>
                  <div class="kv"><span class="k">Community</span><span class="v">{{ a.community }}</span></div>
                  <div class="kv" style="grid-column:1 / -1;"><span class="k">Father's Name</span><span class="v">{{ a.fatherName }}</span></div>
                  <div class="kv" style="grid-column:1 / -1;"><span class="k">Mother's Name</span><span class="v">{{ a.motherName }}</span></div>
                </div>
              </div>
            </div>
          </div>

          <div class="card" style="margin-top:1.25rem;">
            <div class="card-header row between">
              <div class="card-title">Supporting Documents</div>
              <span class="badge draft">{{ a.documents?.length || 0 }} Files</span>
            </div>
            <div class="card-body">
              @if (a.documents && a.documents.length > 0) {
                <div class="grid grid-3">
                  @for (doc of a.documents; track doc.id) {
                    <div class="card card-pad">
                      <div class="row between">
                        <span class="badge draft">{{ doc.type.replace('_', ' ') }}</span>
                      </div>
                      <div class="doc-name" style="margin-top:0.5rem;">{{ doc.name }}</div>
                      <div class="muted text-xs">{{ doc.fileName }} &middot; {{ doc.sizeKb }}KB</div>
                    </div>
                  }
                </div>
              } @else {
                <div class="empty">No supporting documents attached.</div>
              }
            </div>
          </div>

          <!-- Issued certificate + revoke -->
          @if (a.status === 'issued' && a.certificate; as cert) {
            <div class="card" style="margin-top:1.25rem;">
              <div class="card-header row between">
                <div class="card-title">Issued Certificate</div>
                @if (cert.status === 'valid') {
                  <button class="btn danger sm" (click)="revokeOpen.set(true)">Revoke Certificate</button>
                }
              </div>
              <div class="card-body">
                <div class="row between wrap">
                  <div class="stack" style="gap:0.5rem;">
                    <div class="kv"><span class="k">Certificate Number</span><span class="v mono">{{ cert.certificateNumber }}</span></div>
                    <div class="kv"><span class="k">Holder</span><span class="v">{{ cert.applicantDisplayName }}</span></div>
                    <div class="kv"><span class="k">Issued By</span><span class="v">{{ cert.issuedByName }}</span></div>
                    <div class="kv"><span class="k">Status</span><app-status-badge [status]="cert.status" /></div>
                    @if (cert.revokedReason) {
                      <div class="kv"><span class="k">Revoked Reason</span><span class="v">{{ cert.revokedReason }}</span></div>
                    }
                  </div>
                  <div class="cert-qr">
                    <qrcode [qrdata]="cert.verificationUrl" [width]="120" [errorCorrectionLevel]="'H'"></qrcode>
                    <span class="text-xs muted">Scan to verify</span>
                  </div>
                </div>
              </div>
            </div>
          }
        </div>
      }
    }

    <!-- Reject modal -->
    @if (rejectOpen()) {
      <div class="modal-backdrop" (click)="rejectOpen.set(false)">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="card-header"><div class="card-title">Reject Application</div></div>
          <div class="card-body">
            <p class="muted text-sm">
              Provide a reason for rejecting this application. It will be visible to the applicant.
            </p>
            <textarea [(ngModel)]="rejectReason" rows="4" placeholder="e.g. The birth certificate is illegible..."></textarea>
          </div>
          <div class="card-footer">
            <button class="btn secondary" (click)="rejectOpen.set(false)">Cancel</button>
            <button class="btn danger" (click)="reject()" [disabled]="!rejectReason.trim() || busy()">
              {{ busy() ? 'Rejecting...' : 'Confirm Rejection' }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Approve modal -->
    @if (approveOpen()) {
      <div class="modal-backdrop" (click)="approveOpen.set(false)">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="card-header"><div class="card-title">Approve Application</div></div>
          <div class="card-body">
            <p class="muted text-sm">
              Approving will immediately generate a verifiable indigene certificate.
            </p>
            @if (app(); as a) {
              <div class="alert info" style="margin-top:0.5rem;">
                <div class="kv"><span class="k">Origin</span><span class="v">{{ a.lgaName }} LGA, {{ a.wardName }} Ward</span></div>
                <div class="kv" style="margin-top:0.5rem;"><span class="k">Issuing Officer</span><span class="v">{{ officerName }}</span></div>
              </div>
            }
          </div>
          <div class="card-footer">
            <button class="btn secondary" (click)="approveOpen.set(false)">Cancel</button>
            <button class="btn" (click)="approve()" [disabled]="busy()">
              {{ busy() ? 'Processing...' : 'Approve & Generate Certificate' }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Revoke modal -->
    @if (revokeOpen()) {
      <div class="modal-backdrop" (click)="revokeOpen.set(false)">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="card-header"><div class="card-title">Revoke Certificate</div></div>
          <div class="card-body">
            <p class="muted text-sm">Provide a reason for revoking this certificate.</p>
            <textarea [(ngModel)]="revokeReason" rows="4" placeholder="Reason for revocation..."></textarea>
          </div>
          <div class="card-footer">
            <button class="btn secondary" (click)="revokeOpen.set(false)">Cancel</button>
            <button class="btn danger" (click)="revoke()" [disabled]="!revokeReason.trim() || busy()">
              {{ busy() ? 'Revoking...' : 'Confirm Revocation' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .detail {
        max-width: 980px;
        margin: 0 auto;
      }
      .doc-name {
        font-weight: 600;
        font-size: 0.875rem;
      }
      .cert-qr {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.35rem;
      }
    `,
  ],
})
export class OfficerDetailComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  readonly app = signal<Application | null>(null);
  readonly loading = signal(true);
  readonly busy = signal(false);

  readonly rejectOpen = signal(false);
  readonly approveOpen = signal(false);
  readonly revokeOpen = signal(false);

  rejectReason = '';
  revokeReason = '';

  private appId = 0;

  get officerName(): string {
    return this.auth.currentUser()?.name ?? '';
  }

  ngOnInit(): void {
    this.appId = Number(this.route.snapshot.paramMap.get('id'));
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.api.getApplication(this.appId).subscribe({
      next: (app) => {
        this.app.set(app);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  approve(): void {
    const officerId = this.auth.currentUser()?.id;
    if (!officerId) {
      return;
    }
    this.busy.set(true);
    this.api.approveApplication(this.appId, { officerId }).subscribe({
      next: () => {
        this.approveOpen.set(false);
        this.busy.set(false);
        this.load();
      },
      error: () => this.busy.set(false),
    });
  }

  reject(): void {
    const officerId = this.auth.currentUser()?.id;
    if (!officerId || !this.rejectReason.trim()) {
      return;
    }
    this.busy.set(true);
    this.api
      .rejectApplication(this.appId, { officerId, reason: this.rejectReason.trim() })
      .subscribe({
        next: () => {
          this.rejectOpen.set(false);
          this.busy.set(false);
          this.load();
        },
        error: () => this.busy.set(false),
      });
  }

  revoke(): void {
    const cert = this.app()?.certificate;
    if (!cert || !this.revokeReason.trim()) {
      return;
    }
    this.busy.set(true);
    this.api
      .revokeCertificate(cert.id, { reason: this.revokeReason.trim() })
      .subscribe({
        next: () => {
          this.revokeOpen.set(false);
          this.busy.set(false);
          this.load();
        },
        error: () => this.busy.set(false),
      });
  }
}

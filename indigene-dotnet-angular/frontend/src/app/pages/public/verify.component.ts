import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { ApiService } from '../../core/api.service';
import { VerificationResult } from '../../core/models';

@Component({
  selector: 'app-verify',
  standalone: true,
  imports: [FormsModule, DatePipe, RouterLink],
  template: `
    <div class="verify">
      <header class="verify-header">
        <a routerLink="/" class="brand">
          <span class="brand-mark">IC</span>
          <span>Indigene Certificate Portal</span>
        </a>
        <a routerLink="/signin" class="btn secondary sm">Sign in</a>
      </header>

      <div class="verify-body">
        <div class="card card-body" style="max-width:560px; margin:0 auto;">
          <h1>Verify a Certificate</h1>
          <p class="muted">
            Enter the certificate number exactly as printed (e.g.
            <span class="mono">LAG/2026/00001</span>) to check its authenticity.
          </p>

          <form (ngSubmit)="verify()">
            <div class="field">
              <label for="cert">Certificate Number</label>
              <input
                id="cert"
                name="cert"
                [(ngModel)]="certNumber"
                placeholder="LAG/2026/00001"
                required
              />
            </div>
            <button type="submit" class="btn block" [disabled]="loading()">
              {{ loading() ? 'Verifying...' : 'Verify Certificate' }}
            </button>
          </form>

          @if (result(); as r) {
            <div
              class="alert result"
              [class.success]="r.found && r.status === 'valid'"
              [class.error]="!r.found || r.status === 'revoked'"
            >
              <div class="result-head">
                @if (r.found && r.status === 'valid') {
                  <span class="badge valid">Valid</span>
                } @else if (r.found && r.status === 'revoked') {
                  <span class="badge revoked">Revoked</span>
                } @else {
                  <span class="badge rejected">Not Found</span>
                }
              </div>
              <p class="result-text">{{ r.result }}</p>

              @if (r.found) {
                <hr class="divider" />
                <div class="grid grid-2">
                  <div class="kv">
                    <span class="k">Holder</span>
                    <span class="v">{{ r.applicantDisplayName }}</span>
                  </div>
                  <div class="kv">
                    <span class="k">Issuing State</span>
                    <span class="v">{{ r.tenantName }}</span>
                  </div>
                  <div class="kv">
                    <span class="k">Local Government Area</span>
                    <span class="v">{{ r.lgaName || '—' }}</span>
                  </div>
                  <div class="kv">
                    <span class="k">State of Origin</span>
                    <span class="v">{{ r.stateOfOrigin || '—' }}</span>
                  </div>
                  <div class="kv">
                    <span class="k">Issue Date</span>
                    <span class="v">{{
                      r.issueDate ? (r.issueDate | date: 'mediumDate') : '—'
                    }}</span>
                  </div>
                  <div class="kv">
                    <span class="k">Certificate Number</span>
                    <span class="v mono">{{ r.certificateNumber }}</span>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .verify {
        min-height: 100vh;
      }
      .verify-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1rem 1.75rem;
        background: #fff;
        border-bottom: 1px solid var(--border);
      }
      .brand {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        font-weight: 800;
        color: var(--primary);
      }
      .brand-mark {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 34px;
        height: 34px;
        border-radius: 8px;
        background: var(--primary);
        color: #fff;
        font-size: 0.85rem;
      }
      .verify-body {
        padding: 3rem 1.5rem;
      }
      .result {
        margin-top: 1.5rem;
      }
      .result-text {
        font-weight: 600;
        margin-top: 0.5rem;
      }
    `,
  ],
})
export class VerifyComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);

  certNumber = '';
  readonly result = signal<VerificationResult | null>(null);
  readonly loading = signal(false);

  ngOnInit(): void {
    const cert = this.route.snapshot.queryParamMap.get('cert');
    if (cert) {
      this.certNumber = cert;
      this.verify();
    }
  }

  verify(): void {
    const value = this.certNumber.trim();
    if (!value) {
      return;
    }
    this.loading.set(true);
    this.api.verify(value).subscribe({
      next: (res) => {
        this.result.set(res);
        this.loading.set(false);
      },
      error: () => {
        this.result.set({
          found: false,
          status: 'not_found',
          result:
            'No certificate matches this number. It may be invalid or fraudulent.',
          certificateNumber: value,
        });
        this.loading.set(false);
      },
    });
  }
}

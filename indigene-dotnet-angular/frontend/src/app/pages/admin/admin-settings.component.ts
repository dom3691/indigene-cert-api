import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { Tenant } from '../../core/models';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="stack" style="max-width:680px;">
      <div>
        <h1>Settings</h1>
        <p class="muted">Update your state's certificate issuance settings.</p>
      </div>

      @if (loading()) {
        <p class="muted">Loading settings...</p>
      } @else if (tenant(); as t) {
        @if (saved()) {
          <div class="alert success">Settings saved successfully.</div>
        }
        <div class="card">
          <div class="card-body">
            <div class="grid grid-2">
              <div class="field">
                <label>State Name</label>
                <input [(ngModel)]="form.name" />
              </div>
              <div class="field">
                <label>Capital</label>
                <input [(ngModel)]="form.capital" />
              </div>
              <div class="field" style="grid-column:1 / -1;">
                <label>Tagline</label>
                <input [(ngModel)]="form.tagline" />
              </div>
              <div class="field">
                <label>Certificate Prefix</label>
                <input [(ngModel)]="form.certificatePrefix" />
              </div>
              <div class="field">
                <label>Fee ({{ t.currency }})</label>
                <input type="number" [(ngModel)]="form.fee" />
              </div>
              <div class="field">
                <label>Contact Email</label>
                <input type="email" [(ngModel)]="form.contactEmail" />
              </div>
              <div class="field">
                <label>Contact Phone</label>
                <input [(ngModel)]="form.contactPhone" />
              </div>
              <div class="field" style="grid-column:1 / -1;">
                <label>Address</label>
                <input [(ngModel)]="form.address" />
              </div>
            </div>
          </div>
          <div class="card-footer">
            <span></span>
            <button class="btn" (click)="save()" [disabled]="busy()">
              {{ busy() ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
        </div>
      }
    </div>
  `,
})
export class AdminSettingsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);

  readonly tenant = signal<Tenant | null>(null);
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly saved = signal(false);

  form = {
    name: '',
    capital: '',
    tagline: '',
    certificatePrefix: '',
    fee: 0,
    contactEmail: '',
    contactPhone: '',
    address: '',
  };

  private tenantId = 0;

  ngOnInit(): void {
    this.tenantId = this.auth.currentUser()?.tenantId ?? 0;
    if (!this.tenantId) {
      this.loading.set(false);
      return;
    }
    this.api.getTenant(this.tenantId).subscribe({
      next: (t) => {
        this.tenant.set(t);
        this.form = {
          name: t.name,
          capital: t.capital ?? '',
          tagline: t.tagline ?? '',
          certificatePrefix: t.certificatePrefix,
          fee: t.fee,
          contactEmail: t.contactEmail ?? '',
          contactPhone: t.contactPhone ?? '',
          address: t.address ?? '',
        };
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  save(): void {
    this.busy.set(true);
    this.saved.set(false);
    this.api
      .updateTenant(this.tenantId, {
        name: this.form.name,
        capital: this.form.capital,
        tagline: this.form.tagline,
        certificatePrefix: this.form.certificatePrefix,
        fee: Number(this.form.fee),
        contactEmail: this.form.contactEmail,
        contactPhone: this.form.contactPhone,
        address: this.form.address,
      })
      .subscribe({
        next: (t) => {
          this.tenant.set(t);
          this.busy.set(false);
          this.saved.set(true);
        },
        error: () => this.busy.set(false),
      });
  }
}

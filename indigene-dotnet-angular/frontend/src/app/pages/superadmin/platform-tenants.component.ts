import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ApiService } from '../../core/api.service';
import { Tenant } from '../../core/models';

@Component({
  selector: 'app-platform-tenants',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="stack">
      <div class="row between">
        <div>
          <h1>Tenants</h1>
          <p class="muted">Onboard and manage states on the platform.</p>
        </div>
        <button class="btn" (click)="addOpen.set(true)">New Tenant</button>
      </div>

      <div class="card">
        @if (loading()) {
          <div class="card-pad muted">Loading tenants...</div>
        } @else if (tenants().length === 0) {
          <div class="empty">No tenants yet.</div>
        } @else {
          <table class="table">
            <thead>
              <tr><th>State</th><th>Code</th><th>Prefix</th><th>Fee</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              @for (t of tenants(); track t.id) {
                <tr>
                  <td>{{ t.name }}</td>
                  <td>{{ t.code }}</td>
                  <td class="mono">{{ t.certificatePrefix }}</td>
                  <td>{{ t.currency }} {{ t.fee | number }}</td>
                  <td><span class="badge {{ t.status }}">{{ t.status }}</span></td>
                  <td style="text-align:right;">
                    @if (t.status === 'active') {
                      <button class="btn danger sm" (click)="toggleStatus(t)" [disabled]="busy()">Suspend</button>
                    } @else {
                      <button class="btn sm" (click)="toggleStatus(t)" [disabled]="busy()">Activate</button>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>
    </div>

    @if (addOpen()) {
      <div class="modal-backdrop" (click)="addOpen.set(false)">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="card-header"><div class="card-title">Onboard New State</div></div>
          <div class="card-body">
            <div class="field">
              <label>State Name</label>
              <input [(ngModel)]="form.name" placeholder="e.g. Oyo State" />
            </div>
            <div class="grid grid-2">
              <div class="field">
                <label>Code</label>
                <input [(ngModel)]="form.code" placeholder="e.g. OY" />
              </div>
              <div class="field">
                <label>Certificate Prefix</label>
                <input [(ngModel)]="form.certificatePrefix" placeholder="e.g. OYO" />
              </div>
            </div>
            <div class="field">
              <label>Fee (NGN)</label>
              <input type="number" [(ngModel)]="form.fee" />
            </div>
          </div>
          <div class="card-footer">
            <button class="btn secondary" (click)="addOpen.set(false)">Cancel</button>
            <button class="btn" (click)="create()" [disabled]="!isValid() || busy()">
              {{ busy() ? 'Saving...' : 'Create Tenant' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class PlatformTenantsComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly tenants = signal<Tenant[]>([]);
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly addOpen = signal(false);

  form = {
    name: '',
    code: '',
    certificatePrefix: '',
    fee: 0,
  };

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.api.getTenants().subscribe({
      next: (t) => {
        this.tenants.set(t);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  isValid(): boolean {
    return !!(this.form.name && this.form.code && this.form.certificatePrefix);
  }

  create(): void {
    if (!this.isValid()) {
      return;
    }
    this.busy.set(true);
    this.api
      .createTenant({
        name: this.form.name,
        code: this.form.code,
        certificatePrefix: this.form.certificatePrefix,
        fee: Number(this.form.fee),
      })
      .subscribe({
        next: () => {
          this.form = { name: '', code: '', certificatePrefix: '', fee: 0 };
          this.addOpen.set(false);
          this.busy.set(false);
          this.load();
        },
        error: () => this.busy.set(false),
      });
  }

  toggleStatus(t: Tenant): void {
    const status = t.status === 'active' ? 'suspended' : 'active';
    this.busy.set(true);
    this.api.updateTenant(t.id, { status }).subscribe({
      next: () => {
        this.busy.set(false);
        this.load();
      },
      error: () => this.busy.set(false),
    });
  }
}

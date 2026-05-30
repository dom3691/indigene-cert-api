import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { Lga, Tenant, Ward } from '../../core/models';

@Component({
  selector: 'app-apply-new',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="wizard">
      <div class="row" style="margin-bottom:1rem;">
        <a routerLink="/apply" class="btn ghost sm">&larr; Back</a>
        <div>
          <h1>New Application</h1>
          <p class="muted">Complete the form to apply for your indigene certificate.</p>
        </div>
      </div>

      <div class="steps">
        @for (s of [1, 2, 3]; track s) {
          <div class="step-dot" [class.active]="step() >= s">{{ s }}</div>
        }
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-title">
            @switch (step()) {
              @case (1) { Basic Information }
              @case (2) { Origin Details }
              @case (3) { Review &amp; Submit }
            }
          </div>
        </div>

        <div class="card-body">
          @if (error()) {
            <div class="alert error" style="margin-bottom:1rem;">{{ error() }}</div>
          }

          @if (step() === 1) {
            <div class="grid grid-2">
              <div class="field">
                <label>First Name</label>
                <input [(ngModel)]="form.firstName" name="firstName" />
              </div>
              <div class="field">
                <label>Last Name</label>
                <input [(ngModel)]="form.lastName" name="lastName" />
              </div>
              <div class="field">
                <label>Middle Name (optional)</label>
                <input [(ngModel)]="form.middleName" name="middleName" />
              </div>
              <div class="field">
                <label>Gender</label>
                <select [(ngModel)]="form.gender" name="gender">
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div class="field">
                <label>Date of Birth</label>
                <input type="date" [(ngModel)]="form.dateOfBirth" name="dob" />
              </div>
              <div class="field">
                <label>NIN (National Identity Number)</label>
                <input [(ngModel)]="form.nin" name="nin" />
              </div>
              <div class="field">
                <label>Email</label>
                <input type="email" [(ngModel)]="form.email" name="email" />
              </div>
              <div class="field">
                <label>Phone Number</label>
                <input [(ngModel)]="form.phone" name="phone" />
              </div>
            </div>
            <div class="field">
              <label>Current Residential Address</label>
              <input [(ngModel)]="form.residentialAddress" name="address" />
            </div>
          }

          @if (step() === 2) {
            <div class="field">
              <label>Applying to State</label>
              <select [(ngModel)]="form.tenantId" name="tenantId" (ngModelChange)="onTenantChange($event)">
                <option value="">Select state</option>
                @for (t of tenants(); track t.id) {
                  <option [value]="t.id">{{ t.name }}</option>
                }
              </select>
            </div>
            <div class="grid grid-2">
              <div class="field">
                <label>Local Government Area (LGA)</label>
                <select [(ngModel)]="form.lgaId" name="lgaId" (ngModelChange)="onLgaChange()" [disabled]="!form.tenantId">
                  <option value="">Select LGA</option>
                  @for (l of lgas(); track l.id) {
                    <option [value]="l.id">{{ l.name }}</option>
                  }
                </select>
              </div>
              <div class="field">
                <label>Ward</label>
                <select [(ngModel)]="form.wardId" name="wardId" [disabled]="!form.lgaId">
                  <option value="">Select ward</option>
                  @for (w of wards(); track w.id) {
                    <option [value]="w.id">{{ w.name }}</option>
                  }
                </select>
              </div>
            </div>
            <div class="field">
              <label>Hometown / Community</label>
              <input [(ngModel)]="form.community" name="community" />
            </div>
            <div class="grid grid-2">
              <div class="field">
                <label>Father's Full Name</label>
                <input [(ngModel)]="form.fatherName" name="fatherName" />
              </div>
              <div class="field">
                <label>Mother's Full Name</label>
                <input [(ngModel)]="form.motherName" name="motherName" />
              </div>
            </div>
          }

          @if (step() === 3) {
            <div class="grid grid-2 review">
              <div class="kv"><span class="k">Full Name</span><span class="v">{{ form.firstName }} {{ form.middleName }} {{ form.lastName }}</span></div>
              <div class="kv"><span class="k">NIN</span><span class="v">{{ form.nin }}</span></div>
              <div class="kv"><span class="k">Contact</span><span class="v">{{ form.email }} &middot; {{ form.phone }}</span></div>
              <div class="kv"><span class="k">Applying To</span><span class="v">{{ form.stateOfOrigin }} State</span></div>
              <div class="kv"><span class="k">Origin</span><span class="v">{{ selectedLgaName() }} LGA &middot; {{ selectedWardName() }} Ward</span></div>
              <div class="kv"><span class="k">Parents</span><span class="v">F: {{ form.fatherName }} &middot; M: {{ form.motherName }}</span></div>
            </div>
            <div class="alert info" style="margin-top:1rem;">
              Saving this form creates a draft application. You will be able to
              upload supporting documents and make payment on the next screen
              before final submission.
            </div>
          }
        </div>

        <div class="card-footer">
          <button type="button" class="btn secondary" (click)="prev()" [disabled]="step() === 1 || saving()">
            Back
          </button>
          @if (step() < 3) {
            <button type="button" class="btn" (click)="next()" [disabled]="!canContinue()">
              Continue
            </button>
          } @else {
            <button type="button" class="btn" (click)="submit()" [disabled]="saving()">
              {{ saving() ? 'Saving...' : 'Save Draft & Continue' }}
            </button>
          }
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .wizard {
        max-width: 760px;
        margin: 0 auto;
      }
      .review .v {
        font-weight: 600;
      }
    `,
  ],
})
export class ApplyNewComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly step = signal(1);
  readonly saving = signal(false);
  readonly error = signal('');

  readonly tenants = signal<Tenant[]>([]);
  readonly lgas = signal<Lga[]>([]);
  readonly wards = signal<Ward[]>([]);

  form = {
    tenantId: '',
    firstName: '',
    middleName: '',
    lastName: '',
    gender: '',
    dateOfBirth: '',
    nin: '',
    email: '',
    phone: '',
    residentialAddress: '',
    stateOfOrigin: '',
    lgaId: '',
    wardId: '',
    fatherName: '',
    motherName: '',
    community: '',
  };

  ngOnInit(): void {
    const user = this.auth.currentUser();
    if (user?.email) {
      this.form.email = user.email;
    }
    this.api.getTenants('active').subscribe((t) => this.tenants.set(t));
  }

  onTenantChange(value: string): void {
    const tenant = this.tenants().find((t) => t.id.toString() === value);
    this.form.stateOfOrigin = tenant ? tenant.name : '';
    this.form.lgaId = '';
    this.form.wardId = '';
    this.lgas.set([]);
    this.wards.set([]);
    if (tenant) {
      this.api.getLgas(tenant.id).subscribe((lgas) => this.lgas.set(lgas));
    }
  }

  onLgaChange(): void {
    this.form.wardId = '';
    const lga = this.lgas().find((l) => l.id.toString() === this.form.lgaId);
    this.wards.set(lga?.wards ?? []);
  }

  selectedLgaName(): string {
    return this.lgas().find((l) => l.id.toString() === this.form.lgaId)?.name ?? '';
  }

  selectedWardName(): string {
    return this.wards().find((w) => w.id.toString() === this.form.wardId)?.name ?? '';
  }

  canContinue(): boolean {
    if (this.step() === 1) {
      return !!(this.form.firstName && this.form.lastName && this.form.nin);
    }
    if (this.step() === 2) {
      return !!(this.form.tenantId && this.form.lgaId && this.form.wardId);
    }
    return true;
  }

  next(): void {
    if (this.canContinue()) {
      this.step.update((s) => Math.min(3, s + 1));
    }
  }

  prev(): void {
    this.step.update((s) => Math.max(1, s - 1));
  }

  submit(): void {
    const user = this.auth.currentUser();
    if (!user) {
      return;
    }
    this.saving.set(true);
    this.error.set('');
    this.api
      .createApplication({
        tenantId: Number(this.form.tenantId),
        applicantId: user.id,
        firstName: this.form.firstName,
        middleName: this.form.middleName,
        lastName: this.form.lastName,
        gender: this.form.gender,
        dateOfBirth: this.form.dateOfBirth,
        nin: this.form.nin,
        email: this.form.email,
        phone: this.form.phone,
        residentialAddress: this.form.residentialAddress,
        stateOfOrigin: this.form.stateOfOrigin,
        lgaId: Number(this.form.lgaId),
        wardId: Number(this.form.wardId),
        fatherName: this.form.fatherName,
        motherName: this.form.motherName,
        community: this.form.community,
      })
      .subscribe({
        next: (app) => {
          this.router.navigate(['/apply', app.id]);
        },
        error: () => {
          this.error.set('Failed to create application. Please try again.');
          this.saving.set(false);
        },
      });
  }
}

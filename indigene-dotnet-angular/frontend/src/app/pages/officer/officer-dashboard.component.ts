import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { Application, Lga, ListApplicationsParams } from '../../core/models';
import { StatusBadgeComponent } from '../../shared/status-badge.component';

@Component({
  selector: 'app-officer-dashboard',
  standalone: true,
  imports: [DatePipe, FormsModule, StatusBadgeComponent],
  template: `
    <div class="stack">
      <div>
        <h1>Review Queue</h1>
        <p class="muted">Applications submitted to your state for review.</p>
      </div>

      <div class="card card-pad">
        <div class="grid grid-3">
          <div class="field" style="margin:0;">
            <label>Search</label>
            <input [(ngModel)]="search" placeholder="Name, NIN, email, certificate" (keyup.enter)="load()" />
          </div>
          <div class="field" style="margin:0;">
            <label>Status</label>
            <select [(ngModel)]="status" (ngModelChange)="load()">
              <option value="">All statuses</option>
              <option value="paid">Paid</option>
              <option value="under_review">Under Review</option>
              <option value="issued">Issued</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div class="field" style="margin:0;">
            <label>LGA</label>
            <select [(ngModel)]="lgaId" (ngModelChange)="load()">
              <option value="">All LGAs</option>
              @for (l of lgas(); track l.id) {
                <option [value]="l.id">{{ l.name }}</option>
              }
            </select>
          </div>
        </div>
        <div style="margin-top:0.75rem;">
          <button class="btn sm" (click)="load()">Apply Filters</button>
        </div>
      </div>

      <div class="card">
        @if (loading()) {
          <div class="card-pad muted">Loading queue...</div>
        } @else if (applications().length === 0) {
          <div class="empty">No applications match the current filters.</div>
        } @else {
          <table class="table">
            <thead>
              <tr>
                <th>Applicant</th>
                <th>NIN</th>
                <th>LGA</th>
                <th>Status</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              @for (app of applications(); track app.id) {
                <tr class="clickable" (click)="open(app.id)">
                  <td>{{ app.applicantName }}</td>
                  <td class="mono">{{ app.nin }}</td>
                  <td>{{ app.lgaName }}</td>
                  <td><app-status-badge [status]="app.status" /></td>
                  <td>{{ app.submittedAt ? (app.submittedAt | date: 'mediumDate') : '—' }}</td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>
    </div>
  `,
})
export class OfficerDashboardComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly applications = signal<Application[]>([]);
  readonly lgas = signal<Lga[]>([]);
  readonly loading = signal(true);

  search = '';
  status = '';
  lgaId = '';

  private tenantId = 0;

  ngOnInit(): void {
    this.tenantId = this.auth.currentUser()?.tenantId ?? 0;
    if (this.tenantId) {
      this.api.getLgas(this.tenantId).subscribe((l) => this.lgas.set(l));
    }
    this.load();
  }

  load(): void {
    this.loading.set(true);
    const filters: ListApplicationsParams = { tenantId: this.tenantId };
    if (this.status) {
      filters.status = this.status;
    }
    if (this.lgaId) {
      filters.lgaId = Number(this.lgaId);
    }
    if (this.search.trim()) {
      filters.search = this.search.trim();
    }
    this.api.getApplications(filters).subscribe({
      next: (apps) => {
        this.applications.set(apps);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  open(id: number): void {
    this.router.navigate(['/officer', id]);
  }
}

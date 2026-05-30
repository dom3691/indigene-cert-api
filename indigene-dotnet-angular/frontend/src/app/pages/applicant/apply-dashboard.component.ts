import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';

import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { Application } from '../../core/models';
import { StatusBadgeComponent } from '../../shared/status-badge.component';

@Component({
  selector: 'app-apply-dashboard',
  standalone: true,
  imports: [DatePipe, RouterLink, StatusBadgeComponent],
  template: `
    <div class="stack">
      <div class="row between">
        <div>
          <h1>My Applications</h1>
          <p class="muted">Track and manage your indigene certificate applications.</p>
        </div>
        <a routerLink="/apply/new" class="btn">New Application</a>
      </div>

      @if (loading()) {
        <p class="muted">Loading applications...</p>
      } @else if (applications().length === 0) {
        <div class="empty">
          <p>You have not started any applications yet.</p>
          <a routerLink="/apply/new" class="btn">Start your first application</a>
        </div>
      } @else {
        <div class="grid grid-3">
          @for (app of applications(); track app.id) {
            <a [routerLink]="['/apply', app.id]" class="card card-pad app-card">
              <div class="row between">
                <span class="state">{{ app.tenantName }} State</span>
                <app-status-badge [status]="app.status" />
              </div>
              <div class="kv" style="margin-top:0.75rem;">
                <span class="k">Local Government Area</span>
                <span class="v">{{ app.lgaName || 'Not selected' }}</span>
              </div>
              <div class="kv" style="margin-top:0.5rem;">
                <span class="k">Application</span>
                <span class="v">#{{ app.id }}</span>
              </div>
              <div class="created muted text-xs">
                Created {{ app.createdAt ? (app.createdAt | date: 'mediumDate') : '—' }}
              </div>
            </a>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      .app-card {
        text-decoration: none;
        color: inherit;
        display: block;
      }
      .app-card:hover {
        text-decoration: none;
        border-color: var(--primary);
        box-shadow: var(--shadow-md);
      }
      .state {
        font-weight: 700;
      }
      .created {
        margin-top: 0.75rem;
      }
    `,
  ],
})
export class ApplyDashboardComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);

  readonly applications = signal<Application[]>([]);
  readonly loading = signal(true);

  ngOnInit(): void {
    const user = this.auth.currentUser();
    if (!user) {
      this.loading.set(false);
      return;
    }
    this.api.getApplications({ applicantId: user.id }).subscribe({
      next: (apps) => {
        this.applications.set(apps);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}

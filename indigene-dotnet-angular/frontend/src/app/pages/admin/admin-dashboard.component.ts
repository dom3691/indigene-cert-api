import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';

import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { TenantDashboard } from '../../core/models';
import { StatusBadgeComponent } from '../../shared/status-badge.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [DatePipe, StatusBadgeComponent],
  template: `
    <div class="stack">
      <div>
        <h1>Dashboard</h1>
        <p class="muted">Overview of indigene certificate activity for your state.</p>
      </div>

      @if (loading()) {
        <p class="muted">Loading dashboard...</p>
      } @else if (data(); as d) {
        <div class="grid grid-4">
          <div class="kpi">
            <div class="kpi-label">Total Applications</div>
            <div class="kpi-value">{{ d.totalApplications }}</div>
          </div>
          <div class="kpi">
            <div class="kpi-label">Pending Review</div>
            <div class="kpi-value">{{ d.pendingReview }}</div>
          </div>
          <div class="kpi">
            <div class="kpi-label">Issued Certificates</div>
            <div class="kpi-value">{{ d.issuedCertificates }}</div>
          </div>
          <div class="kpi">
            <div class="kpi-label">Total Revenue</div>
            <div class="kpi-value">NGN {{ d.totalRevenue | number }}</div>
          </div>
        </div>

        <div class="grid grid-2">
          <div class="card">
            <div class="card-header"><div class="card-title">Status Breakdown</div></div>
            <div class="card-body">
              @for (s of d.statusBreakdown || []; track s.status) {
                <div class="bar-row">
                  <span class="badge {{ s.status }}">{{ s.status.replace('_', ' ') }}</span>
                  <div class="bar-track">
                    <div class="bar-fill" [style.width.%]="pct(s.count, maxStatus(d))"></div>
                  </div>
                  <span class="bar-count">{{ s.count }}</span>
                </div>
              }
            </div>
          </div>

          <div class="card">
            <div class="card-header"><div class="card-title">Applications by LGA</div></div>
            <div class="card-body">
              @if ((d.lgaBreakdown || []).length === 0) {
                <div class="empty">No data yet.</div>
              }
              @for (l of d.lgaBreakdown || []; track l.lgaName) {
                <div class="bar-row">
                  <span class="text-sm">{{ l.lgaName }}</span>
                  <div class="bar-track">
                    <div class="bar-fill" [style.width.%]="pct(l.count, maxLga(d))"></div>
                  </div>
                  <span class="bar-count">{{ l.count }}</span>
                </div>
              }
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header"><div class="card-title">Monthly Trend (last 6 months)</div></div>
          <div class="card-body">
            <div class="trend">
              @for (t of d.monthlyTrend || []; track t.month) {
                <div class="trend-col">
                  <div class="trend-bars">
                    <div class="trend-bar apps" [style.height.%]="pct(t.applications, maxTrend(d))" title="Applications"></div>
                    <div class="trend-bar certs" [style.height.%]="pct(t.certificates, maxTrend(d))" title="Certificates"></div>
                  </div>
                  <div class="trend-label">{{ t.month }}</div>
                </div>
              }
            </div>
            <div class="legend">
              <span><i class="dot apps"></i> Applications</span>
              <span><i class="dot certs"></i> Certificates</span>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header"><div class="card-title">Recent Activity</div></div>
          <div class="card-body">
            @if ((d.recentActivity || []).length === 0) {
              <div class="empty">No recent activity.</div>
            }
            @for (log of d.recentActivity || []; track log.id) {
              <div class="activity-row">
                <div>
                  <div class="act-action">{{ log.action }}</div>
                  <div class="muted text-xs">{{ log.detail }}</div>
                </div>
                <div class="muted text-xs">{{ log.createdAt | date: 'short' }}</div>
              </div>
            }
          </div>
        </div>

        <div class="card">
          <div class="card-header"><div class="card-title">Recent Applications</div></div>
          <div class="card-body">
            @if ((d.recentApplications || []).length === 0) {
              <div class="empty">No applications yet.</div>
            } @else {
              <table class="table">
                <thead>
                  <tr><th>Applicant</th><th>LGA</th><th>Status</th><th>Created</th></tr>
                </thead>
                <tbody>
                  @for (app of d.recentApplications || []; track app.id) {
                    <tr>
                      <td>{{ app.applicantName }}</td>
                      <td>{{ app.lgaName }}</td>
                      <td><app-status-badge [status]="app.status" /></td>
                      <td>{{ app.createdAt ? (app.createdAt | date: 'mediumDate') : '—' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .trend {
        display: flex;
        align-items: flex-end;
        gap: 1rem;
        height: 180px;
        padding: 0.5rem 0;
      }
      .trend-col {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        height: 100%;
        justify-content: flex-end;
      }
      .trend-bars {
        display: flex;
        align-items: flex-end;
        gap: 4px;
        height: 100%;
      }
      .trend-bar {
        width: 16px;
        border-radius: 4px 4px 0 0;
        min-height: 2px;
      }
      .trend-bar.apps {
        background: var(--primary);
      }
      .trend-bar.certs {
        background: #93c5b3;
      }
      .trend-label {
        font-size: 0.7rem;
        color: var(--muted);
        margin-top: 0.35rem;
      }
      .legend {
        display: flex;
        gap: 1.25rem;
        font-size: 0.75rem;
        color: var(--muted);
        margin-top: 0.75rem;
      }
      .legend .dot {
        display: inline-block;
        width: 10px;
        height: 10px;
        border-radius: 3px;
        margin-right: 0.35rem;
      }
      .legend .dot.apps {
        background: var(--primary);
      }
      .legend .dot.certs {
        background: #93c5b3;
      }
      .activity-row,
      .act-row {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        padding: 0.6rem 0;
        border-bottom: 1px solid var(--border);
      }
      .activity-row:last-child {
        border-bottom: none;
      }
      .act-action {
        font-weight: 600;
        font-size: 0.875rem;
      }
    `,
  ],
})
export class AdminDashboardComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);

  readonly data = signal<TenantDashboard | null>(null);
  readonly loading = signal(true);

  ngOnInit(): void {
    const tenantId = this.auth.currentUser()?.tenantId;
    if (!tenantId) {
      this.loading.set(false);
      return;
    }
    this.api.getTenantDashboard(tenantId).subscribe({
      next: (d) => {
        this.data.set(d);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  pct(value: number, max: number): number {
    return max > 0 ? Math.round((value / max) * 100) : 0;
  }

  maxStatus(d: TenantDashboard): number {
    return Math.max(1, ...(d.statusBreakdown || []).map((s) => s.count));
  }

  maxLga(d: TenantDashboard): number {
    return Math.max(1, ...(d.lgaBreakdown || []).map((l) => l.count));
  }

  maxTrend(d: TenantDashboard): number {
    const points = d.monthlyTrend || [];
    return Math.max(
      1,
      ...points.map((t) => Math.max(t.applications, t.certificates)),
    );
  }
}

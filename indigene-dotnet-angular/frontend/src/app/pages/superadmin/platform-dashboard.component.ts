import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';

import { ApiService } from '../../core/api.service';
import { PlatformOverview } from '../../core/models';

@Component({
  selector: 'app-platform-dashboard',
  standalone: true,
  imports: [DatePipe],
  template: `
    <div class="stack">
      <div>
        <h1>Platform Overview</h1>
        <p class="muted">Activity across all states on the platform.</p>
      </div>

      @if (loading()) {
        <p class="muted">Loading overview...</p>
      } @else if (data(); as d) {
        <div class="grid grid-4">
          <div class="kpi">
            <div class="kpi-label">States (Tenants)</div>
            <div class="kpi-value">{{ d.totalTenants }}</div>
            <div class="muted text-xs">
              {{ d.activeTenants }} active &middot; {{ d.suspendedTenants }} suspended
            </div>
          </div>
          <div class="kpi">
            <div class="kpi-label">Applications</div>
            <div class="kpi-value">{{ d.totalApplications }}</div>
          </div>
          <div class="kpi">
            <div class="kpi-label">Certificates Issued</div>
            <div class="kpi-value">{{ d.totalCertificates }}</div>
          </div>
          <div class="kpi">
            <div class="kpi-label">Total Revenue</div>
            <div class="kpi-value">NGN {{ d.totalRevenue | number }}</div>
          </div>
        </div>

        <div class="card">
          <div class="card-header"><div class="card-title">Applications by State</div></div>
          <div class="card-body">
            @if ((d.tenants || []).length === 0) {
              <div class="empty">No tenant data yet.</div>
            }
            @for (t of d.tenants || []; track t.tenantId) {
              <div class="bar-row">
                <span class="text-sm">{{ t.tenantName }}</span>
                <div class="bar-track">
                  <div class="bar-fill" [style.width.%]="pct(t.applications, maxApps(d))"></div>
                </div>
                <span class="bar-count">{{ t.applications }}</span>
              </div>
            }
          </div>
        </div>

        <div class="card">
          <div class="card-header"><div class="card-title">State Comparison</div></div>
          <div class="card-body">
            <table class="table">
              <thead>
                <tr><th>State</th><th>Status</th><th>Applications</th><th>Certificates</th><th>Revenue</th></tr>
              </thead>
              <tbody>
                @for (t of d.tenants || []; track t.tenantId) {
                  <tr>
                    <td>{{ t.tenantName }}</td>
                    <td><span class="badge {{ t.status }}">{{ t.status }}</span></td>
                    <td>{{ t.applications }}</td>
                    <td>{{ t.certificates }}</td>
                    <td>NGN {{ t.revenue | number }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <div class="card">
          <div class="card-header"><div class="card-title">Recent Activity</div></div>
          <div class="card-body">
            @if ((d.recentActivity || []).length === 0) {
              <div class="empty">No recent activity.</div>
            }
            @for (log of d.recentActivity || []; track log.id) {
              <div class="act-row">
                <div>
                  <div class="act-action">{{ log.action }}</div>
                  <div class="muted text-xs">{{ log.actorName }} &middot; {{ log.detail }}</div>
                </div>
                <div class="muted text-xs">{{ log.createdAt | date: 'short' }}</div>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .act-row {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        padding: 0.6rem 0;
        border-bottom: 1px solid var(--border);
      }
      .act-row:last-child {
        border-bottom: none;
      }
      .act-action {
        font-weight: 600;
        font-size: 0.875rem;
      }
    `,
  ],
})
export class PlatformDashboardComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly data = signal<PlatformOverview | null>(null);
  readonly loading = signal(true);

  ngOnInit(): void {
    this.api.getPlatformOverview().subscribe({
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

  maxApps(d: PlatformOverview): number {
    return Math.max(1, ...(d.tenants || []).map((t) => t.applications));
  }
}

import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';

import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { AuditLog } from '../../core/models';

@Component({
  selector: 'app-admin-audit',
  standalone: true,
  imports: [DatePipe],
  template: `
    <div class="stack">
      <div>
        <h1>Audit Log</h1>
        <p class="muted">A record of actions taken across your state's operations.</p>
      </div>

      <div class="card">
        @if (loading()) {
          <div class="card-pad muted">Loading audit log...</div>
        } @else if (logs().length === 0) {
          <div class="empty">No audit entries yet.</div>
        } @else {
          <table class="table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Actor</th>
                <th>Action</th>
                <th>Outcome</th>
                <th>Detail</th>
              </tr>
            </thead>
            <tbody>
              @for (log of logs(); track log.id) {
                <tr>
                  <td class="text-xs">{{ log.createdAt | date: 'medium' }}</td>
                  <td>
                    <div>{{ log.actorName }}</div>
                    <div class="muted text-xs">{{ (log.actorRole || '').replace('_', ' ') }}</div>
                  </td>
                  <td>{{ log.action }}</td>
                  <td>
                    @if (log.outcome) {
                      <span class="badge {{ outcomeClass(log.outcome) }}">{{ log.outcome }}</span>
                    }
                  </td>
                  <td class="text-sm">{{ log.detail }}</td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>
    </div>
  `,
})
export class AdminAuditComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);

  readonly logs = signal<AuditLog[]>([]);
  readonly loading = signal(true);

  ngOnInit(): void {
    const tenantId = this.auth.currentUser()?.tenantId;
    if (!tenantId) {
      this.loading.set(false);
      return;
    }
    this.api.getAuditLogs(tenantId).subscribe({
      next: (logs) => {
        this.logs.set(logs);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  outcomeClass(outcome: string): string {
    switch (outcome) {
      case 'issued':
      case 'success':
        return 'issued';
      case 'rejected':
      case 'revoked':
        return 'rejected';
      default:
        return 'draft';
    }
  }
}

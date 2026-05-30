import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { Officer } from '../../core/models';

@Component({
  selector: 'app-admin-officers',
  standalone: true,
  imports: [DatePipe, FormsModule],
  template: `
    <div class="stack">
      <div class="row between">
        <div>
          <h1>Officers</h1>
          <p class="muted">Manage staff who review applications and issue certificates.</p>
        </div>
        <button class="btn" (click)="addOpen.set(true)">Add Staff</button>
      </div>

      <div class="card">
        @if (loading()) {
          <div class="card-pad muted">Loading staff...</div>
        } @else if (officers().length === 0) {
          <div class="empty">No staff added yet.</div>
        } @else {
          <table class="table">
            <thead>
              <tr><th>Name</th><th>Email</th><th>Role</th><th>Reviewed</th><th>Status</th><th>Joined</th></tr>
            </thead>
            <tbody>
              @for (o of officers(); track o.id) {
                <tr>
                  <td>{{ o.name }}</td>
                  <td>{{ o.email }}</td>
                  <td><span class="badge draft">{{ o.role.replace('_', ' ') }}</span></td>
                  <td>{{ o.reviewedCount || 0 }}</td>
                  <td><span class="badge {{ o.status }}">{{ o.status }}</span></td>
                  <td>{{ o.createdAt ? (o.createdAt | date: 'mediumDate') : '—' }}</td>
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
          <div class="card-header"><div class="card-title">Add Staff Member</div></div>
          <div class="card-body">
            <div class="field">
              <label>Full Name</label>
              <input [(ngModel)]="name" />
            </div>
            <div class="field">
              <label>Email</label>
              <input type="email" [(ngModel)]="email" />
            </div>
            <div class="field">
              <label>Role</label>
              <select [(ngModel)]="role">
                <option value="officer">Officer</option>
                <option value="tenant_admin">Tenant Admin</option>
              </select>
            </div>
          </div>
          <div class="card-footer">
            <button class="btn secondary" (click)="addOpen.set(false)">Cancel</button>
            <button class="btn" (click)="add()" [disabled]="!name || !email || busy()">
              {{ busy() ? 'Saving...' : 'Add Staff' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class AdminOfficersComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);

  readonly officers = signal<Officer[]>([]);
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly addOpen = signal(false);

  name = '';
  email = '';
  role = 'officer';

  private tenantId = 0;

  ngOnInit(): void {
    this.tenantId = this.auth.currentUser()?.tenantId ?? 0;
    this.load();
  }

  private load(): void {
    if (!this.tenantId) {
      this.loading.set(false);
      return;
    }
    this.loading.set(true);
    this.api.getOfficers(this.tenantId).subscribe({
      next: (o) => {
        this.officers.set(o);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  add(): void {
    if (!this.name || !this.email) {
      return;
    }
    this.busy.set(true);
    this.api
      .createOfficer(this.tenantId, {
        name: this.name,
        email: this.email,
        role: this.role,
      })
      .subscribe({
        next: () => {
          this.name = '';
          this.email = '';
          this.role = 'officer';
          this.addOpen.set(false);
          this.busy.set(false);
          this.load();
        },
        error: () => this.busy.set(false),
      });
  }
}

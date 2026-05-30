import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { Account } from '../../core/models';

interface RoleGroup {
  role: string;
  label: string;
  accounts: Account[];
}

@Component({
  selector: 'app-sign-in',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="signin">
      <div class="signin-card card">
        <div class="card-body">
          <a routerLink="/" class="brand">
            <span class="brand-mark">IC</span>
            <span>Indigene Certificate Portal</span>
          </a>
          <h1>Demo Sign In</h1>
          <p class="muted">
            This is a demonstration account switcher. Select an account below to
            explore the portal in that role.
          </p>

          @if (loading()) {
            <p class="muted">Loading demo accounts...</p>
          }
          @if (error()) {
            <div class="alert error">{{ error() }}</div>
          }

          @for (group of groups(); track group.role) {
            <section class="group">
              <h3 class="group-title">{{ group.label }}</h3>
              <div class="account-list">
                @for (acc of group.accounts; track acc.id) {
                  <button
                    type="button"
                    class="account-btn"
                    (click)="select(acc)"
                  >
                    <div>
                      <div class="acc-name">{{ acc.name }}</div>
                      <div class="acc-email muted text-sm">{{ acc.email }}</div>
                    </div>
                    @if (acc.tenantName) {
                      <span class="badge active">{{ acc.tenantName }}</span>
                    }
                  </button>
                }
              </div>
            </section>
          }
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .signin {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1.5rem;
      }
      .signin-card {
        width: 100%;
        max-width: 540px;
      }
      .brand {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        font-weight: 800;
        color: var(--primary);
        margin-bottom: 1rem;
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
      .group {
        margin-top: 1.5rem;
      }
      .group-title {
        text-transform: uppercase;
        font-size: 0.75rem;
        letter-spacing: 0.05em;
        color: var(--muted);
        margin-bottom: 0.5rem;
      }
      .account-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .account-btn {
        width: 100%;
        text-align: left;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        padding: 0.75rem 0.9rem;
        border: 1px solid var(--border);
        border-radius: var(--radius-sm);
        background: #fff;
        cursor: pointer;
      }
      .account-btn:hover {
        border-color: var(--primary);
        background: var(--primary-light);
      }
      .acc-name {
        font-weight: 600;
      }
    `,
  ],
})
export class SignInComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);

  readonly groups = signal<RoleGroup[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');

  private readonly roleLabels: Record<string, string> = {
    super_admin: 'Platform Super Admin',
    tenant_admin: 'State Administrators',
    officer: 'Issuing Officers',
    applicant: 'Applicants',
  };

  private readonly order = ['super_admin', 'tenant_admin', 'officer', 'applicant'];

  ngOnInit(): void {
    this.api.getAccounts().subscribe({
      next: (accounts) => {
        const groups: RoleGroup[] = [];
        for (const role of this.order) {
          const list = accounts.filter((a) => a.role === role);
          if (list.length) {
            groups.push({
              role,
              label: this.roleLabels[role] ?? role,
              accounts: list,
            });
          }
        }
        this.groups.set(groups);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load demo accounts. Is the backend running?');
        this.loading.set(false);
      },
    });
  }

  select(account: Account): void {
    this.auth.signInAs(account);
  }
}

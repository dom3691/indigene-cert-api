import { Injectable, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { inject } from '@angular/core';

import { Account } from './models';

const STORAGE_KEY = 'indigene_auth_user';

/**
 * Demo authentication. There is NO real SSO: the user picks a demo account
 * (from GET /api/accounts) which is persisted to localStorage.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly router = inject(Router);

  private readonly _currentUser = signal<Account | null>(this.readStored());
  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this._currentUser() !== null);

  private readStored(): Account | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Account) : null;
    } catch {
      return null;
    }
  }

  signInAs(account: Account): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(account));
    this._currentUser.set(account);
    this.router.navigateByUrl(this.homePathForRole(account.role));
  }

  signOut(): void {
    localStorage.removeItem(STORAGE_KEY);
    this._currentUser.set(null);
    this.router.navigateByUrl('/signin');
  }

  /** Landing route for a role after sign-in. */
  homePathForRole(role: string): string {
    switch (role) {
      case 'officer':
        return '/officer';
      case 'tenant_admin':
        return '/admin';
      case 'super_admin':
        return '/platform';
      case 'applicant':
      default:
        return '/apply';
    }
  }
}

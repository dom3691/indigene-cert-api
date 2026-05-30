import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '../core/auth.service';

interface NavItem {
  label: string;
  href: string;
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app-shell.component.html',
  styleUrls: ['./app-shell.component.css'],
})
export class AppShellComponent {
  private readonly auth = inject(AuthService);

  readonly user = this.auth.currentUser;

  readonly navItems = computed<NavItem[]>(() => {
    const role = this.user()?.role;
    switch (role) {
      case 'applicant':
        return [{ label: 'My Applications', href: '/apply' }];
      case 'officer':
        return [{ label: 'Review Queue', href: '/officer' }];
      case 'tenant_admin':
        return [
          { label: 'Dashboard', href: '/admin' },
          { label: 'Settings', href: '/admin/settings' },
          { label: 'Geography', href: '/admin/geography' },
          { label: 'Officers', href: '/admin/officers' },
          { label: 'Audit Log', href: '/admin/audit' },
        ];
      case 'super_admin':
        return [
          { label: 'Platform Overview', href: '/platform' },
          { label: 'Tenants', href: '/platform/tenants' },
        ];
      default:
        return [];
    }
  });

  roleLabel(role: string | undefined): string {
    return (role || '').replace(/_/g, ' ');
  }

  signOut(): void {
    this.auth.signOut();
  }
}

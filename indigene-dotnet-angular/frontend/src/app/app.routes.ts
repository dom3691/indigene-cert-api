import { Routes } from '@angular/router';

import { authGuard } from './core/auth.guard';
import { AppShellComponent } from './layout/app-shell.component';

export const routes: Routes = [
  // ---- Public routes (no shell) ----
  {
    path: '',
    loadComponent: () =>
      import('./pages/public/landing.component').then((m) => m.LandingComponent),
  },
  {
    path: 'signin',
    loadComponent: () =>
      import('./pages/public/sign-in.component').then((m) => m.SignInComponent),
  },
  {
    path: 'verify',
    loadComponent: () =>
      import('./pages/public/verify.component').then((m) => m.VerifyComponent),
  },

  // ---- Authenticated routes (wrapped in AppShell) ----
  {
    path: '',
    component: AppShellComponent,
    canActivate: [authGuard],
    children: [
      // applicant
      {
        path: 'apply',
        loadComponent: () =>
          import('./pages/applicant/apply-dashboard.component').then(
            (m) => m.ApplyDashboardComponent,
          ),
      },
      {
        path: 'apply/new',
        loadComponent: () =>
          import('./pages/applicant/apply-new.component').then(
            (m) => m.ApplyNewComponent,
          ),
      },
      {
        path: 'apply/:id',
        loadComponent: () =>
          import('./pages/applicant/apply-detail.component').then(
            (m) => m.ApplyDetailComponent,
          ),
      },

      // officer
      {
        path: 'officer',
        loadComponent: () =>
          import('./pages/officer/officer-dashboard.component').then(
            (m) => m.OfficerDashboardComponent,
          ),
      },
      {
        path: 'officer/:id',
        loadComponent: () =>
          import('./pages/officer/officer-detail.component').then(
            (m) => m.OfficerDetailComponent,
          ),
      },

      // tenant_admin
      {
        path: 'admin',
        loadComponent: () =>
          import('./pages/admin/admin-dashboard.component').then(
            (m) => m.AdminDashboardComponent,
          ),
      },
      {
        path: 'admin/settings',
        loadComponent: () =>
          import('./pages/admin/admin-settings.component').then(
            (m) => m.AdminSettingsComponent,
          ),
      },
      {
        path: 'admin/geography',
        loadComponent: () =>
          import('./pages/admin/admin-geography.component').then(
            (m) => m.AdminGeographyComponent,
          ),
      },
      {
        path: 'admin/officers',
        loadComponent: () =>
          import('./pages/admin/admin-officers.component').then(
            (m) => m.AdminOfficersComponent,
          ),
      },
      {
        path: 'admin/audit',
        loadComponent: () =>
          import('./pages/admin/admin-audit.component').then(
            (m) => m.AdminAuditComponent,
          ),
      },

      // super_admin
      {
        path: 'platform',
        loadComponent: () =>
          import('./pages/superadmin/platform-dashboard.component').then(
            (m) => m.PlatformDashboardComponent,
          ),
      },
      {
        path: 'platform/tenants',
        loadComponent: () =>
          import('./pages/superadmin/platform-tenants.component').then(
            (m) => m.PlatformTenantsComponent,
          ),
      },
    ],
  },

  // ---- Wildcard ----
  {
    path: '**',
    loadComponent: () =>
      import('./pages/public/not-found.component').then(
        (m) => m.NotFoundComponent,
      ),
  },
];

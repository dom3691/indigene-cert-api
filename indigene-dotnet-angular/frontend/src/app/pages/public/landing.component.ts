import { Component, inject } from '@angular/core';
import { RouterLink, Router } from '@angular/router';

import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="landing">
      <header class="landing-header">
        <div class="brand">
          <span class="brand-mark">IC</span>
          <span>Indigene Certificate Portal</span>
        </div>
        <nav class="row">
          <a routerLink="/verify" class="btn ghost sm">Verify a Certificate</a>
          <a routerLink="/signin" class="btn secondary sm">Sign in</a>
        </nav>
      </header>

      <section class="hero">
        <span class="eyebrow">Government of Nigeria &middot; State Indigene Services</span>
        <h1>Apply for and verify indigene certificates online</h1>
        <p class="lead">
          A secure, trustworthy way for state governments to issue digital
          indigene certificates. Apply online, pay the processing fee, and
          receive a verifiable certificate with a unique number and QR code.
        </p>
        <div class="row wrap cta">
          <button type="button" class="btn" (click)="startApplication()">
            Start Application
          </button>
          <a routerLink="/verify" class="btn secondary">Verify a Certificate</a>
        </div>
      </section>

      <section class="features container">
        <div class="card card-pad">
          <h3>Apply online</h3>
          <p class="muted">
            Complete a guided multi-step application with your biodata and origin
            details, then upload supporting documents.
          </p>
        </div>
        <div class="card card-pad">
          <h3>Pay securely</h3>
          <p class="muted">
            Pay the state processing fee and submit your application for officer
            review.
          </p>
        </div>
        <div class="card card-pad">
          <h3>Verify instantly</h3>
          <p class="muted">
            Anyone can confirm a certificate's authenticity using its unique
            number &mdash; no account required.
          </p>
        </div>
      </section>
    </div>
  `,
  styles: [
    `
      .landing {
        min-height: 100vh;
      }
      .landing-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1rem 1.75rem;
        background: #fff;
        border-bottom: 1px solid var(--border);
      }
      .brand {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        font-weight: 800;
        color: var(--primary);
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
      .hero {
        max-width: 760px;
        margin: 0 auto;
        text-align: center;
        padding: 4rem 1.5rem 2.5rem;
      }
      .eyebrow {
        color: var(--primary);
        font-weight: 700;
        font-size: 0.8rem;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }
      .hero h1 {
        font-size: 2.4rem;
        margin: 1rem 0;
      }
      .lead {
        font-size: 1.05rem;
        color: var(--muted);
      }
      .cta {
        justify-content: center;
        margin-top: 1.75rem;
      }
      .features {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1.25rem;
        padding: 1rem 1.5rem 4rem;
      }
      @media (max-width: 760px) {
        .features {
          grid-template-columns: 1fr;
        }
        .hero h1 {
          font-size: 1.8rem;
        }
      }
    `,
  ],
})
export class LandingComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  startApplication(): void {
    const user = this.auth.currentUser();
    if (user) {
      this.router.navigateByUrl('/apply');
    } else {
      this.router.navigateByUrl('/signin');
    }
  }
}

import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="wrap">
      <div class="card card-pad" style="text-align:center; max-width:420px;">
        <h1>Page Not Found</h1>
        <p class="muted">
          The page you are looking for does not exist or has been moved.
        </p>
        <a routerLink="/" class="btn">Back to Home</a>
      </div>
    </div>
  `,
  styles: [
    `
      .wrap {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1.5rem;
      }
    `,
  ],
})
export class NotFoundComponent {}

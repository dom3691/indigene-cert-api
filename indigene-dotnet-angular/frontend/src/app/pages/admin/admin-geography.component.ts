import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { Lga } from '../../core/models';

@Component({
  selector: 'app-admin-geography',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="stack">
      <div class="row between">
        <div>
          <h1>Geography</h1>
          <p class="muted">Manage the local government areas and wards for your state.</p>
        </div>
        <button class="btn" (click)="addLgaOpen.set(true)">Add LGA</button>
      </div>

      @if (loading()) {
        <p class="muted">Loading geography...</p>
      } @else if (lgas().length === 0) {
        <div class="empty">No LGAs configured yet.</div>
      } @else {
        <div class="stack">
          @for (lga of lgas(); track lga.id) {
            <div class="card">
              <div class="card-header row between clickable" (click)="toggle(lga.id)">
                <div>
                  <div class="card-title">{{ lga.name }}</div>
                  <div class="muted text-xs">{{ lga.wards?.length || 0 }} wards</div>
                </div>
                <span class="muted">{{ expanded() === lga.id ? '−' : '+' }}</span>
              </div>
              @if (expanded() === lga.id) {
                <div class="card-body">
                  @if (lga.wards && lga.wards.length > 0) {
                    <ul class="ward-list">
                      @for (ward of lga.wards; track ward.id) {
                        <li>{{ ward.name }}</li>
                      }
                    </ul>
                  } @else {
                    <p class="muted text-sm">No wards yet.</p>
                  }
                  <div class="row" style="margin-top:0.75rem;">
                    <input [(ngModel)]="newWardName[lga.id]" placeholder="New ward name" />
                    <button class="btn sm" (click)="addWard(lga.id)" [disabled]="!newWardName[lga.id]">
                      Add Ward
                    </button>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      }
    </div>

    @if (addLgaOpen()) {
      <div class="modal-backdrop" (click)="addLgaOpen.set(false)">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="card-header"><div class="card-title">Add Local Government Area</div></div>
          <div class="card-body">
            <div class="field">
              <label>LGA Name</label>
              <input [(ngModel)]="newLgaName" placeholder="e.g. Ikeja" />
            </div>
            <div class="field">
              <label>Code (optional)</label>
              <input [(ngModel)]="newLgaCode" placeholder="e.g. IKJ" />
            </div>
          </div>
          <div class="card-footer">
            <button class="btn secondary" (click)="addLgaOpen.set(false)">Cancel</button>
            <button class="btn" (click)="addLga()" [disabled]="!newLgaName || busy()">
              {{ busy() ? 'Saving...' : 'Add LGA' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .ward-list {
        margin: 0;
        padding-left: 1.1rem;
        columns: 2;
      }
      .ward-list li {
        margin-bottom: 0.25rem;
      }
    `,
  ],
})
export class AdminGeographyComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);

  readonly lgas = signal<Lga[]>([]);
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly expanded = signal<number | null>(null);
  readonly addLgaOpen = signal(false);

  newLgaName = '';
  newLgaCode = '';
  newWardName: Record<number, string> = {};

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
    this.api.getLgas(this.tenantId).subscribe({
      next: (lgas) => {
        this.lgas.set(lgas);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  toggle(id: number): void {
    this.expanded.set(this.expanded() === id ? null : id);
  }

  addLga(): void {
    if (!this.newLgaName) {
      return;
    }
    this.busy.set(true);
    this.api
      .createLga(this.tenantId, {
        name: this.newLgaName,
        code: this.newLgaCode || undefined,
      })
      .subscribe({
        next: () => {
          this.newLgaName = '';
          this.newLgaCode = '';
          this.addLgaOpen.set(false);
          this.busy.set(false);
          this.load();
        },
        error: () => this.busy.set(false),
      });
  }

  addWard(lgaId: number): void {
    const name = this.newWardName[lgaId];
    if (!name) {
      return;
    }
    this.api.createWard(lgaId, { name }).subscribe({
      next: () => {
        this.newWardName[lgaId] = '';
        this.load();
      },
    });
  }
}

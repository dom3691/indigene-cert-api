import { Component, Input } from '@angular/core';

/** Color-coded status pill. Class name maps to the status value in styles.css. */
@Component({
  selector: 'app-status-badge',
  standalone: true,
  template: `<span class="badge {{ status }}">{{ label }}</span>`,
})
export class StatusBadgeComponent {
  @Input() status = 'draft';

  get label(): string {
    return (this.status || '').replace(/_/g, ' ');
  }
}

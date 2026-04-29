import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { DashboardStatusTotal } from './dashboard.models';

@Component({
  selector: 'app-status-distribution',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="panel">
      <h3>Status distribution</h3>
      @if (items.length === 0) {
        <p class="empty">No status data available.</p>
      } @else {
        <ul class="rows">
          @for (item of items; track item.status) {
            <li class="row">
              <div class="label-line">
                <span>{{ item.status }}</span>
                <strong>{{ item.count }}</strong>
              </div>
              <div class="bar-bg" aria-hidden="true">
                <div class="bar-fill" [style.width.%]="percentage(item.count)"></div>
              </div>
            </li>
          }
        </ul>
      }
    </section>
  `,
  styles: `
    .panel { border: 1px solid #e5e7eb; border-radius: 10px; padding: 0.75rem; background: #fff; }
    .panel h3 { margin: 0 0 0.5rem; }
    .empty { margin: 0; color: #64748b; }
    .rows { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.5rem; }
    .row { display: grid; gap: 0.25rem; }
    .label-line { display: flex; justify-content: space-between; align-items: center; font-size: 0.9rem; }
    .bar-bg { height: 8px; border-radius: 999px; background: #e2e8f0; overflow: hidden; }
    .bar-fill { height: 100%; background: #2563eb; }
  `
})
export class StatusDistributionComponent {
  @Input() items: DashboardStatusTotal[] = [];

  percentage(count: number): number {
    const max = Math.max(1, ...this.items.map((item) => item.count));
    return Math.round((count / max) * 100);
  }
}

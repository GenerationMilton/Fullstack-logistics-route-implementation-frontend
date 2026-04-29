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
                <span class="label">{{ item.status }}</span>
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
    .panel { border: 1px solid #e5e7eb; border-radius: 12px; padding: 0.9rem; background: #fff; box-shadow: 0 2px 10px rgba(15, 23, 42, 0.05); font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; }
    .panel h3 { margin: 0 0 0.65rem; }
    .empty { margin: 0; color: #64748b; }
    .rows { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.65rem; }
    .row { display: grid; gap: 0.25rem; }
    .label-line { display: flex; justify-content: space-between; align-items: center; font-size: 0.9rem; color: #334155; }
    .label { text-transform: capitalize; }
    .bar-bg { height: 10px; border-radius: 999px; background: #e2e8f0; overflow: hidden; }
    .bar-fill { height: 100%; background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%); }
  `
})
export class StatusDistributionComponent {
  @Input() items: DashboardStatusTotal[] = [];

  percentage(count: number): number {
    const max = Math.max(1, ...this.items.map((item) => item.count));
    return Math.round((count / max) * 100);
  }
}

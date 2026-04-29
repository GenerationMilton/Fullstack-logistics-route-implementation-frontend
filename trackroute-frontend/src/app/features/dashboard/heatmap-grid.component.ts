import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { DashboardHeatmapItem } from './dashboard.models';

@Component({
  selector: 'app-heatmap-grid',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="panel">
      <h3>Active routes heatmap by region</h3>
      @if (items.length === 0) {
        <p class="empty">No regional activity available.</p>
      } @else {
        <div class="grid">
          @for (item of items; track item.region) {
            <article class="cell" [style.background]="cellColor(item.count)">
              <span class="region">{{ item.region }}</span>
              <strong class="count">{{ item.count }}</strong>
            </article>
          }
        </div>
      }
    </section>
  `,
  styles: `
    .panel { border: 1px solid #e5e7eb; border-radius: 12px; padding: 0.9rem; background: #fff; box-shadow: 0 2px 10px rgba(15, 23, 42, 0.05); font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; }
    .panel h3 { margin: 0 0 0.65rem; }
    .empty { margin: 0; color: #64748b; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 0.6rem; }
    .cell { border-radius: 10px; padding: 0.65rem; border: 1px solid rgba(191, 219, 254, 0.9); display: grid; gap: 0.25rem; box-shadow: inset 0 0 0 1px rgba(255,255,255,0.35); }
    .region { font-size: 0.84rem; color: #0f172a; font-weight: 600; }
    .count { font-size: 1.05rem; color: #0f172a; }
  `
})
export class HeatmapGridComponent {
  @Input() items: DashboardHeatmapItem[] = [];

  cellColor(count: number): string {
    const max = Math.max(1, ...this.items.map((item) => item.count));
    const intensity = Math.max(0.2, count / max);
    return `linear-gradient(135deg, rgba(191,219,254,0.6), rgba(59,130,246,${intensity.toFixed(2)}))`;
  }
}

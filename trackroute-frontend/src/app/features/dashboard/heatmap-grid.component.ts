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
    .panel { border: 1px solid #e5e7eb; border-radius: 10px; padding: 0.75rem; background: #fff; }
    .panel h3 { margin: 0 0 0.5rem; }
    .empty { margin: 0; color: #64748b; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 0.5rem; }
    .cell { border-radius: 8px; padding: 0.6rem; border: 1px solid #dbeafe; display: grid; gap: 0.2rem; }
    .region { font-size: 0.85rem; color: #1e293b; }
    .count { font-size: 1rem; color: #0f172a; }
  `
})
export class HeatmapGridComponent {
  @Input() items: DashboardHeatmapItem[] = [];

  cellColor(count: number): string {
    const max = Math.max(1, ...this.items.map((item) => item.count));
    const intensity = Math.max(0.15, count / max);
    return `rgba(59, 130, 246, ${intensity.toFixed(2)})`;
  }
}

import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  DashboardHeatmapItem,
  DashboardStatusTotal,
  DashboardSummaryResponse,
  DashboardTopRoute
} from './dashboard.models';
import { DashboardService } from './dashboard.service';

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="dashboard-wrap">
      <h2>Dashboard</h2>
      <p class="hint">
        Aggregated data endpoint: <code>/api/v1/dashboard/summary?from=&to=</code>
      </p>

      <form class="filters" [formGroup]="form" (ngSubmit)="loadSummary()">
        <label>
          From
          <input type="date" formControlName="from" />
        </label>
        <label>
          To
          <input type="date" formControlName="to" />
        </label>
        <button type="submit" [disabled]="form.invalid || loading()">
          {{ loading() ? 'Loading...' : 'Apply range' }}
        </button>
      </form>

      @if (summary()) {
        <div class="grid">
          <article class="panel">
            <h3>Total routes by status</h3>
            <ul>
              @for (item of totalsByStatus(); track item.status) {
                <li>{{ item.status }}: {{ item.count }}</li>
              }
            </ul>
          </article>

          <article class="panel">
            <h3>Top 5 expensive routes</h3>
            <ul>
              @for (route of topExpensiveRoutes(); track route.id) {
                <li>
                  #{{ route.id }} - {{ route.originCity }} -> {{ route.destinationCity }}:
                  {{ route.costUsd | number: '1.2-2' }} USD
                </li>
              }
            </ul>
          </article>

          <article class="panel">
            <h3>Active routes heatmap by region</h3>
            <ul>
              @for (region of heatmapByRegion(); track region.region) {
                <li>{{ region.region }}: {{ region.count }}</li>
              }
            </ul>
          </article>
        </div>
      }
    </section>
  `,
  styles: `
    .dashboard-wrap { display: grid; gap: 0.75rem; }
    .hint { color: #475569; margin: 0; }
    .filters { display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: end; }
    label { display: grid; gap: 0.25rem; font-size: 0.9rem; }
    input { border: 1px solid #d1d5db; border-radius: 8px; padding: 0.4rem 0.5rem; }
    button { border: 1px solid #d1d5db; background: #fff; border-radius: 8px; padding: 0.45rem 0.65rem; cursor: pointer; }
    button:disabled { opacity: .6; cursor: not-allowed; }
    .grid { display: grid; gap: 0.75rem; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); }
    .panel { border: 1px solid #e5e7eb; border-radius: 10px; padding: 0.75rem; background: #fff; }
    .panel h3 { margin: 0 0 0.5rem; }
    .panel ul { margin: 0; padding-left: 1.1rem; }
    code { background: #f1f5f9; border-radius: 5px; padding: 0.1rem 0.3rem; }
  `
})
export class DashboardHomeComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dashboardService = inject(DashboardService);

  readonly loading = signal(false);
  readonly summary = signal<DashboardSummaryResponse | null>(null);
  readonly totalsByStatus = signal<DashboardStatusTotal[]>([]);
  readonly topExpensiveRoutes = signal<DashboardTopRoute[]>([]);
  readonly heatmapByRegion = signal<DashboardHeatmapItem[]>([]);

  readonly form = this.fb.nonNullable.group({
    from: ['', Validators.required],
    to: ['', Validators.required]
  });

  ngOnInit(): void {
    const now = new Date();
    const to = this.toDateInput(now);
    const fromDate = new Date(now);
    fromDate.setDate(fromDate.getDate() - 30);
    const from = this.toDateInput(fromDate);
    this.form.setValue({ from, to });
    this.loadSummary();
  }

  loadSummary(): void {
    if (this.form.invalid) return;

    const { from, to } = this.form.getRawValue();
    const fromIso = `${from}T00:00:00Z`;
    const toIso = `${to}T23:59:59Z`;

    this.loading.set(true);
    this.dashboardService.getSummary(fromIso, toIso).subscribe({
      next: (response) => {
        this.summary.set(response);
        this.totalsByStatus.set(response.totalsByStatus ?? []);
        this.topExpensiveRoutes.set(response.topExpensiveRoutes ?? []);
        this.heatmapByRegion.set(response.activeHeatmapByRegion ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.summary.set(null);
        this.totalsByStatus.set([]);
        this.topExpensiveRoutes.set([]);
        this.heatmapByRegion.set([]);
        this.loading.set(false);
      }
    });
  }

  private toDateInput(value: Date): string {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

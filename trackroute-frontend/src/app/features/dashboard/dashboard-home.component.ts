import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RoutesCacheService } from '../../core/services/routes-cache.service';
import {
  DashboardHeatmapItem,
  DashboardStatusTotal,
  DashboardTopRoute
} from './dashboard.models';
import { DashboardService } from './dashboard.service';
import { DashboardStateService } from './dashboard-state.service';
import { StatusDistributionComponent } from './status-distribution.component';
import { HeatmapGridComponent } from './heatmap-grid.component';

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    StatusDistributionComponent,
    HeatmapGridComponent
  ],
  template: `
    <section class="dashboard-wrap">
      <header class="page-head">
        <h2>Dashboard</h2>
        <p>Business indicators for routes and operation status.</p>
      </header>

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
      @if (rangeError()) {
        <p class="error">{{ rangeError() }}</p>
      }

      @if (summary()) {
        <div class="grid">
          <app-status-distribution [items]="totalsByStatus()" />

          <article class="panel">
            <h3>Top 5 expensive routes</h3>
            <ul class="top-list">
              @for (route of topExpensiveRoutes(); track route.id) {
                <li>
                  <span class="route-meta">#{{ route.id }} {{ route.originCity }} -> {{ route.destinationCity }}</span>
                  <strong class="route-cost">{{ route.costUsd | number: '1.2-2' }} USD</strong>
                </li>
              }
            </ul>
          </article>

          <app-heatmap-grid [items]="heatmapByRegion()" />
        </div>
      } @else if (!loading()) {
        <article class="empty-state">
          <h3>No routes data yet</h3>
          <p>
            Import routes first, then return to Dashboard. Cached imported data is
            used when backend aggregates are unavailable.
          </p>
        </article>
      }
    </section>
  `,
  styles: `
    .dashboard-wrap { display: grid; gap: 0.9rem; font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; }
    .page-head { border: 1px solid #dbeafe; background: linear-gradient(180deg, #ffffff 0%, #f0f9ff 100%); border-radius: 12px; padding: 1rem 1.1rem; }
    .page-head h2 { margin: 0; font-size: 1.4rem; font-weight: 700; letter-spacing: -0.01em; }
    .page-head p { margin: 0.25rem 0 0; color: #475569; font-size: 0.95rem; }
    .error { color: #b91c1c; margin: 0; }
    .filters { display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: end; border: 1px solid #e2e8f0; border-radius: 12px; padding: 0.85rem; background: #fff; }
    label { display: grid; gap: 0.25rem; font-size: 0.92rem; font-weight: 500; }
    input { border: 1px solid #d1d5db; border-radius: 8px; padding: 0.45rem 0.55rem; }
    button { border: 1px solid #2563eb; background: #2563eb; color: #fff; border-radius: 8px; padding: 0.45rem 0.65rem; cursor: pointer; font-weight: 600; }
    button:disabled { opacity: .6; cursor: not-allowed; }
    .grid { display: grid; gap: 0.85rem; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); }
    .panel { border: 1px solid #e5e7eb; border-radius: 12px; padding: 0.9rem; background: #fff; box-shadow: 0 2px 10px rgba(15, 23, 42, 0.05); }
    .panel h3 { margin: 0 0 0.5rem; }
    .top-list { margin: 0; padding: 0; list-style: none; display: grid; gap: 0.55rem; }
    .top-list li { display: grid; gap: 0.2rem; padding: 0.45rem 0.5rem; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc; }
    .route-meta { color: #334155; font-size: 0.88rem; }
    .route-cost { color: #0f172a; font-size: 0.9rem; }
    .empty-state { border: 1px dashed #cbd5e1; background: #f8fafc; border-radius: 12px; padding: 1rem; }
    .empty-state h3 { margin: 0; }
    .empty-state p { margin: 0.35rem 0 0; color: #475569; }
  `
})
export class DashboardHomeComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dashboardService = inject(DashboardService);
  private readonly dashboardState = inject(DashboardStateService);
  private readonly routesCache = inject(RoutesCacheService);

  readonly loading = toSignal(this.dashboardState.loading$, { initialValue: false });
  readonly summary = toSignal(this.dashboardState.summary$, { initialValue: null });
  readonly rangeError = signal('');
  readonly totalsByStatus = computed<DashboardStatusTotal[]>(
    () => this.summary()?.totalsByStatus ?? []
  );
  readonly topExpensiveRoutes = computed<DashboardTopRoute[]>(
    () => this.summary()?.topExpensiveRoutes ?? []
  );
  readonly heatmapByRegion = computed<DashboardHeatmapItem[]>(
    () => this.summary()?.activeHeatmapByRegion ?? []
  );

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
    if (from > to) {
      this.rangeError.set('Invalid range: "from" must be before or equal to "to".');
      return;
    }
    this.rangeError.set('');
    const fromIso = `${from}T00:00:00Z`;
    const toIso = `${to}T23:59:59Z`;

    this.dashboardState.setLoading(true);
    this.dashboardService.getSummary(fromIso, toIso).subscribe({
      next: (response) => {
        const hasData =
          (response.totalsByStatus?.length ?? 0) > 0 ||
          (response.topExpensiveRoutes?.length ?? 0) > 0 ||
          (response.activeHeatmapByRegion?.length ?? 0) > 0;
        if (hasData) {
          this.dashboardState.setSummary(response);
        } else {
          this.dashboardState.setSummary(
            this.routesCache.buildDashboardSummary(fromIso, toIso)
          );
        }
        this.dashboardState.setLoading(false);
      },
      error: () => {
        this.dashboardState.setSummary(
          this.routesCache.buildDashboardSummary(fromIso, toIso)
        );
        this.dashboardState.setLoading(false);
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

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
        @if (usingCache()) {
          <span class="cache-badge">Using cached data</span>
        }
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
            <ul>
              @for (route of topExpensiveRoutes(); track route.id) {
                <li>
                  #{{ route.id }} - {{ route.originCity }} -> {{ route.destinationCity }}:
                  {{ route.costUsd | number: '1.2-2' }} USD
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
    .dashboard-wrap { display: grid; gap: 0.9rem; }
    .page-head { border: 1px solid #e2e8f0; background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%); border-radius: 12px; padding: 0.9rem 1rem; }
    .page-head h2 { margin: 0; }
    .page-head p { margin: 0.25rem 0 0; color: #475569; }
    .cache-badge { display: inline-block; margin-top: 0.5rem; width: fit-content; background: #fff7ed; color: #9a3412; border: 1px solid #fdba74; border-radius: 999px; padding: 0.2rem 0.6rem; font-size: 0.78rem; font-weight: 700; }
    .error { color: #b91c1c; margin: 0; }
    .filters { display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: end; border: 1px solid #e2e8f0; border-radius: 12px; padding: 0.75rem; background: #fff; }
    label { display: grid; gap: 0.25rem; font-size: 0.9rem; }
    input { border: 1px solid #d1d5db; border-radius: 8px; padding: 0.4rem 0.5rem; }
    button { border: 1px solid #2563eb; background: #2563eb; color: #fff; border-radius: 8px; padding: 0.45rem 0.65rem; cursor: pointer; font-weight: 600; }
    button:disabled { opacity: .6; cursor: not-allowed; }
    .grid { display: grid; gap: 0.75rem; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); }
    .panel { border: 1px solid #e5e7eb; border-radius: 10px; padding: 0.75rem; background: #fff; }
    .panel h3 { margin: 0 0 0.5rem; }
    .panel ul { margin: 0; padding-left: 1.1rem; }
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
  readonly usingCache = signal(false);
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
          this.usingCache.set(false);
          this.dashboardState.setSummary(response);
        } else {
          this.usingCache.set(true);
          this.dashboardState.setSummary(
            this.routesCache.buildDashboardSummary(fromIso, toIso)
          );
        }
        this.dashboardState.setLoading(false);
      },
      error: () => {
        this.usingCache.set(true);
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

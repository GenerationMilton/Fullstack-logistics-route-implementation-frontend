import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RoutesCacheService } from '../../core/services/routes-cache.service';
import { MonitoringService } from './monitoring.service';
import { MonitoringStateService } from './monitoring-state.service';

@Component({
  selector: 'app-monitoring-home',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="monitoring-wrap">
      <header class="page-head">
        <h2>Monitoring</h2>
        <p>Live tracking of active routes with auto-refresh every 30 seconds.</p>
        @if (usingCache()) {
          <span class="cache-badge">Using cached data</span>
        }
      </header>

      @if (loading()) {
        <article class="empty-state">
          <h3>Loading tracking information...</h3>
          <p>Please wait while active route telemetry is loaded.</p>
        </article>
      } @else if (tracks().length === 0) {
        <article class="empty-state">
          <h3>No active routes available</h3>
          <p>
            Import routes and ensure status is <strong>ACTIVA</strong>. Cached
            imported data is used as fallback when live tracking is unavailable.
          </p>
        </article>
      } @else {
        <div class="cards">
          @for (track of tracks(); track track.routeId) {
            <article class="card">
              <h3>Route {{ track.routeId }}</h3>
              <p><strong>Last location:</strong> {{ track.lastLocation }}</p>
              <p><strong>Progress:</strong> {{ track.progressPercent }}%</p>
              <p><strong>ETA:</strong> {{ track.etaMinutes }} min</p>
              <p><strong>Timestamp:</strong> {{ track.timestamp }}</p>
            </article>
          }
        </div>
      }
    </section>
  `,
  styles: `
    .monitoring-wrap { display: grid; gap: 0.9rem; }
    .page-head { border: 1px solid #e2e8f0; background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%); border-radius: 12px; padding: 0.9rem 1rem; }
    .page-head h2 { margin: 0; }
    .page-head p { margin: 0.25rem 0 0; color: #475569; }
    .cache-badge { display: inline-block; margin-top: 0.5rem; width: fit-content; background: #fff7ed; color: #9a3412; border: 1px solid #fdba74; border-radius: 999px; padding: 0.2rem 0.6rem; font-size: 0.78rem; font-weight: 700; }
    .cards { display: grid; gap: 0.75rem; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); }
    .card { border: 1px solid #e5e7eb; border-radius: 10px; padding: 0.75rem; background: #fff; box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04); }
    .card h3 { margin: 0 0 0.5rem; }
    .card p { margin: 0.2rem 0; }
    .empty-state { border: 1px dashed #cbd5e1; background: #f8fafc; border-radius: 12px; padding: 1rem; }
    .empty-state h3 { margin: 0; }
    .empty-state p { margin: 0.35rem 0 0; color: #475569; }
  `
})
export class MonitoringHomeComponent implements OnInit {
  private readonly monitoringService = inject(MonitoringService);
  private readonly monitoringState = inject(MonitoringStateService);
  private readonly routesCache = inject(RoutesCacheService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = toSignal(this.monitoringState.loading$, { initialValue: true });
  readonly tracks = toSignal(this.monitoringState.tracks$, { initialValue: [] });
  readonly usingCache = signal(false);

  ngOnInit(): void {
    timer(0, 30000)
      .pipe(
        switchMap(() => this.monitoringService.getActiveTracks()),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (data) => {
          const fallback = data.length === 0;
          const tracks = fallback ? this.routesCache.buildMonitoringTracks() : data;
          this.usingCache.set(fallback);
          this.monitoringState.setTracks(tracks);
          this.monitoringState.setLoading(false);
        },
        error: () => {
          this.usingCache.set(true);
          this.monitoringState.setTracks(this.routesCache.buildMonitoringTracks());
          this.monitoringState.setLoading(false);
        }
      });
  }
}

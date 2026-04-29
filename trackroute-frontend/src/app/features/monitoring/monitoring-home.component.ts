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
            <article class="card" [class]="progressClass(track.progressPercent)">
              <div class="card-head">
                <h3>Route #{{ track.routeId }}</h3>
                <span class="progress-pill">{{ track.progressPercent }}%</span>
              </div>
              <p><strong>Last location:</strong> {{ track.lastLocation }}</p>
              <p><strong>ETA:</strong> {{ track.etaMinutes }} min</p>
              <p><strong>Updated:</strong> {{ formatTimestamp(track.timestamp) }}</p>
              <div class="progress-bar" aria-hidden="true">
                <div class="progress-fill" [style.width.%]="track.progressPercent"></div>
              </div>
            </article>
          }
        </div>
      }
    </section>
  `,
  styles: `
    .monitoring-wrap { display: grid; gap: 1rem; }
    .page-head { border: 1px solid #dbeafe; background: linear-gradient(180deg, #ffffff 0%, #f0f9ff 100%); border-radius: 12px; padding: 0.95rem 1.1rem; }
    .page-head h2 { margin: 0; }
    .page-head p { margin: 0.25rem 0 0; color: #475569; font-size: 0.95rem; }
    .cards { display: grid; gap: 0.75rem; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); }
    .card { border-radius: 12px; padding: 0.85rem; background: #fff; box-shadow: 0 4px 14px rgba(15, 23, 42, 0.06); border: 1px solid #e5e7eb; display: grid; gap: 0.4rem; }
    .card-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem; }
    .card h3 { margin: 0; font-size: 1rem; }
    .card p { margin: 0.08rem 0; color: #334155; font-size: 0.88rem; }
    .progress-pill { font-size: 0.78rem; font-weight: 700; border-radius: 999px; padding: 0.18rem 0.55rem; background: #e2e8f0; color: #0f172a; }
    .progress-bar { margin-top: 0.35rem; height: 8px; border-radius: 999px; background: rgba(15, 23, 42, 0.08); overflow: hidden; }
    .progress-fill { height: 100%; background: #3b82f6; }
    .progress-low { border-color: #fca5a5; background: linear-gradient(180deg, #fff 0%, #fef2f2 100%); }
    .progress-low .progress-pill { background: #fee2e2; color: #991b1b; }
    .progress-low .progress-fill { background: #ef4444; }
    .progress-mid { border-color: #fcd34d; background: linear-gradient(180deg, #fff 0%, #fffbeb 100%); }
    .progress-mid .progress-pill { background: #fef3c7; color: #92400e; }
    .progress-mid .progress-fill { background: #f59e0b; }
    .progress-high { border-color: #86efac; background: linear-gradient(180deg, #fff 0%, #f0fdf4 100%); }
    .progress-high .progress-pill { background: #dcfce7; color: #166534; }
    .progress-high .progress-fill { background: #22c55e; }
    .progress-complete { border-color: #93c5fd; background: linear-gradient(180deg, #fff 0%, #eff6ff 100%); }
    .progress-complete .progress-pill { background: #dbeafe; color: #1d4ed8; }
    .progress-complete .progress-fill { background: #2563eb; }
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

  progressClass(progress: number): string {
    if (progress <= 20) return 'progress-low';
    if (progress <= 60) return 'progress-mid';
    if (progress <= 80) return 'progress-high';
    return 'progress-complete';
  }

  formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return timestamp;
    return new Intl.DateTimeFormat(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  }
}

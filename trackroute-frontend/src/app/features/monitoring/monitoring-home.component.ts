import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActiveRouteTrack } from './monitoring.models';
import { MonitoringService } from './monitoring.service';

@Component({
  selector: 'app-monitoring-home',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="monitoring-wrap">
      <h2>Monitoring</h2>
      <p class="hint">Auto-refresh every 30 seconds from <code>/api/v1/routes/active/track</code>.</p>

      @if (loading()) {
        <p>Loading active routes...</p>
      } @else if (tracks().length === 0) {
        <p>No active routes at this moment.</p>
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
    .monitoring-wrap { display: grid; gap: 0.75rem; }
    .hint { color: #475569; margin: 0; }
    .cards { display: grid; gap: 0.75rem; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); }
    .card { border: 1px solid #e5e7eb; border-radius: 10px; padding: 0.75rem; background: #fff; }
    .card h3 { margin: 0 0 0.5rem; }
    .card p { margin: 0.2rem 0; }
    code { background: #f1f5f9; border-radius: 5px; padding: 0.1rem 0.3rem; }
  `
})
export class MonitoringHomeComponent implements OnInit {
  private readonly monitoringService = inject(MonitoringService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly tracks = signal<ActiveRouteTrack[]>([]);

  ngOnInit(): void {
    timer(0, 30000)
      .pipe(
        switchMap(() => this.monitoringService.getActiveTracks()),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (data) => {
          this.tracks.set(data);
          this.loading.set(false);
        },
        error: () => {
          this.tracks.set([]);
          this.loading.set(false);
        }
      });
  }
}

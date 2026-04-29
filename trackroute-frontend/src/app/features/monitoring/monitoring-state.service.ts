import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ActiveRouteTrack } from './monitoring.models';

@Injectable({ providedIn: 'root' })
export class MonitoringStateService {
  private readonly tracksSubject = new BehaviorSubject<ActiveRouteTrack[]>([]);
  private readonly loadingSubject = new BehaviorSubject<boolean>(true);

  readonly tracks$ = this.tracksSubject.asObservable();
  readonly loading$ = this.loadingSubject.asObservable();

  setTracks(tracks: ActiveRouteTrack[]): void {
    this.tracksSubject.next(tracks);
  }

  setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }
}

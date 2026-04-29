import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { ActiveRouteTrack, ActiveTrackApiResponse } from './monitoring.models';

@Injectable({ providedIn: 'root' })
export class MonitoringService {
  private readonly api = inject(ApiService);

  getActiveTracks(): Observable<ActiveRouteTrack[]> {
    return this.api
      .get<ActiveRouteTrack[] | ActiveTrackApiResponse>('/api/v1/routes/active/track')
      .pipe(
        map((response) => {
          if (Array.isArray(response)) return response;
          return response.data ?? [];
        })
      );
  }
}

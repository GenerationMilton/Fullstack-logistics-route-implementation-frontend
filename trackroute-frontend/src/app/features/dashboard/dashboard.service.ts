import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { DashboardSummaryResponse } from './dashboard.models';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly api = inject(ApiService);

  getSummary(from: string, to: string): Observable<DashboardSummaryResponse> {
    return this.api.get<DashboardSummaryResponse>('/api/v1/dashboard/summary', {
      from,
      to
    });
  }
}

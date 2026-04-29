import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { RoutesListResponse } from './routes.models';

export interface RoutesQuery {
  page: number;
  limit: number;
  origin?: string;
  destination?: string;
  vehicle?: string;
  status?: string;
  carrier?: string;
  sort?: string;
}

@Injectable({ providedIn: 'root' })
export class RoutesService {
  private readonly api = inject(ApiService);

  list(query: RoutesQuery): Observable<RoutesListResponse> {
    return this.api.get<RoutesListResponse>('/api/v1/routes', {
      page: query.page,
      limit: query.limit,
      origin: query.origin,
      destination: query.destination,
      vehicle: query.vehicle,
      status: query.status,
      carrier: query.carrier,
      sort: query.sort
    });
  }
}

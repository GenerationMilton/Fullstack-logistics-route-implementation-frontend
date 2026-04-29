import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import {
  ImportSummary,
  RouteItem,
  RoutesListResponse,
  RouteUpsertPayload
} from './routes.models';

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

  getById(id: string): Observable<RouteItem> {
    return this.api.get<RouteItem>(`/api/v1/routes/${id}`);
  }

  create(payload: RouteUpsertPayload): Observable<RouteItem> {
    return this.api.post<RouteItem, RouteUpsertPayload>('/api/v1/routes', payload);
  }

  update(id: string, payload: RouteUpsertPayload): Observable<RouteItem> {
    return this.api.put<RouteItem, RouteUpsertPayload>(`/api/v1/routes/${id}`, payload);
  }

  disable(id: string): Observable<unknown> {
    return this.api.patch<unknown>(`/api/v1/routes/${id}/disable`);
  }

  importCsv(file: File): Observable<ImportSummary> {
    const formData = new FormData();
    formData.append('file', file);
    return this.api.post<ImportSummary, FormData>('/api/v1/routes/import', formData);
  }
}

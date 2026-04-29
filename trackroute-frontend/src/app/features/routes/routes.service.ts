import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
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
    return this.api
      .get<RoutesListResponse | { total: number; limit: number; data: unknown[] }>(
        '/api/v1/routes',
        {
          page: query.page,
          limit: query.limit,
          origin: query.origin,
          destination: query.destination,
          vehicle: query.vehicle,
          status: query.status,
          carrier: query.carrier,
          sort: query.sort
        }
      )
      .pipe(
        map((response) => ({
          total: response.total ?? 0,
          limit: response.limit ?? query.limit,
          data: (response.data ?? []).map((item) => this.normalizeRoute(item))
        }))
      );
  }

  getById(id: string): Observable<RouteItem> {
    return this.api
      .get<unknown>(`/api/v1/routes/${id}`)
      .pipe(map((item) => this.normalizeRoute(item)));
  }

  create(payload: RouteUpsertPayload): Observable<RouteItem> {
    return this.api
      .post<unknown, RouteUpsertPayload>('/api/v1/routes', payload)
      .pipe(map((item) => this.normalizeRoute(item)));
  }

  update(id: string, payload: RouteUpsertPayload): Observable<RouteItem> {
    return this.api
      .put<unknown, RouteUpsertPayload>(`/api/v1/routes/${id}`, payload)
      .pipe(map((item) => this.normalizeRoute(item)));
  }

  disable(id: string): Observable<unknown> {
    return this.api.patch<unknown>(`/api/v1/routes/${id}/disable`);
  }

  importCsv(file: File): Observable<ImportSummary> {
    const formData = new FormData();
    formData.append('file', file);
    return this.api.post<ImportSummary, FormData>('/api/v1/routes/import', formData);
  }

  private normalizeRoute(raw: unknown): RouteItem {
    const data = (raw ?? {}) as Record<string, unknown>;
    const carrierObject = (data['carrier'] ?? null) as
      | { name?: string; id?: number | string }
      | null;

    return {
      id: String(data['id'] ?? ''),
      originCity: String(data['originCity'] ?? data['origin_city'] ?? ''),
      destinationCity: String(data['destinationCity'] ?? data['destination_city'] ?? ''),
      distanceKm: Number(data['distanceKm'] ?? data['distance_km'] ?? 0),
      estimatedTimeHours: Number(
        data['estimatedTimeHours'] ?? data['estimated_time_hours'] ?? 0
      ),
      vehicleType: String(data['vehicleType'] ?? data['vehicle_type'] ?? ''),
      carrierName: String(
        data['carrierName'] ??
          data['carrier_name'] ??
          carrierObject?.name ??
          data['carrier'] ??
          ''
      ),
      costUsd: Number(data['costUsd'] ?? data['cost_usd'] ?? 0),
      status: String(data['status'] ?? ''),
      createdAt: String(data['createdAt'] ?? data['created_at'] ?? '')
    };
  }
}

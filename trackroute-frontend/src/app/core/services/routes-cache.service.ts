import { Injectable } from '@angular/core';
import { DashboardSummaryResponse } from '../../features/dashboard/dashboard.models';
import { ActiveRouteTrack } from '../../features/monitoring/monitoring.models';

export interface CachedRouteRecord {
  id: string;
  origin_city: string;
  destination_city: string;
  distance_km: number;
  estimated_time_hours: number;
  vehicle_type: string;
  carrier: string;
  cost_usd: number;
  status: string;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class RoutesCacheService {
  private readonly storageKey = 'trackroute.cached.routes.v1';
  private memoryCache: CachedRouteRecord[] = [];

  setFromCsv(headers: string[], rows: string[][]): void {
    if (headers.length === 0 || rows.length === 0) return;

    const normalizedHeaders = headers.map((h) => h.trim().toLowerCase());
    const records = rows
      .map((row) => this.toRecord(normalizedHeaders, row))
      .filter((row): row is CachedRouteRecord => row !== null);

    this.memoryCache = records;
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(records));
    } catch {
      // If storage quota is exceeded, keep only in-memory cache.
    }
  }

  getAll(): CachedRouteRecord[] {
    if (this.memoryCache.length > 0) return this.memoryCache;

    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as CachedRouteRecord[];
      this.memoryCache = Array.isArray(parsed) ? parsed : [];
      return this.memoryCache;
    } catch {
      return [];
    }
  }

  buildDashboardSummary(fromIso: string, toIso: string): DashboardSummaryResponse | null {
    const from = new Date(fromIso).getTime();
    const to = new Date(toIso).getTime();
    const data = this.getAll().filter((route) => {
      const createdAt = new Date(route.created_at).getTime();
      return Number.isFinite(createdAt) && createdAt >= from && createdAt <= to;
    });

    if (data.length === 0) return null;

    const totalsByStatusMap = new Map<string, number>();
    const regionMap = new Map<string, number>();

    for (const route of data) {
      totalsByStatusMap.set(route.status, (totalsByStatusMap.get(route.status) ?? 0) + 1);
      const region = this.cityToRegion(route.destination_city);
      regionMap.set(region, (regionMap.get(region) ?? 0) + 1);
    }

    const topExpensiveRoutes = [...data]
      .sort((a, b) => b.cost_usd - a.cost_usd)
      .slice(0, 5)
      .map((route) => ({
        id: route.id,
        originCity: route.origin_city,
        destinationCity: route.destination_city,
        costUsd: route.cost_usd
      }));

    return {
      range: { from: fromIso, to: toIso },
      totalsByStatus: [...totalsByStatusMap.entries()].map(([status, count]) => ({
        status,
        count
      })),
      topExpensiveRoutes,
      activeHeatmapByRegion: [...regionMap.entries()].map(([region, count]) => ({
        region,
        count
      }))
    };
  }

  buildMonitoringTracks(limit = 20): ActiveRouteTrack[] {
    const now = new Date().toISOString();
    return this.getAll()
      .filter((route) => route.status === 'ACTIVA')
      .slice(0, limit)
      .map((route, index) => ({
        routeId: route.id,
        lastLocation: route.destination_city,
        progressPercent: Math.min(95, 25 + ((index * 11) % 70)),
        etaMinutes: Math.max(5, Math.round(route.estimated_time_hours * 60 * 0.35)),
        timestamp: now
      }));
  }

  private toRecord(headers: string[], row: string[]): CachedRouteRecord | null {
    const values: Record<string, string> = {};
    headers.forEach((header, index) => {
      values[header] = String(row[index] ?? '').trim();
    });

    if (!values['id']) return null;

    return {
      id: values['id'],
      origin_city: values['origin_city'] ?? '',
      destination_city: values['destination_city'] ?? '',
      distance_km: Number(values['distance_km'] ?? 0),
      estimated_time_hours: Number(values['estimated_time_hours'] ?? 0),
      vehicle_type: values['vehicle_type'] ?? '',
      carrier: values['carrier'] ?? '',
      cost_usd: Number(values['cost_usd'] ?? 0),
      status: values['status'] ?? '',
      created_at: values['created_at'] ?? ''
    };
  }

  private cityToRegion(city: string): string {
    const key = city.toLowerCase();
    if (['bogota', 'medellin', 'manizales', 'pereira', 'ibague', 'tunja', 'bucaramanga', 'cucuta'].includes(key)) return 'Andina';
    if (['barranquilla', 'cartagena', 'santa marta', 'valledupar', 'riohacha', 'monteria', 'sincelejo'].includes(key)) return 'Caribe';
    if (['cali', 'buenaventura', 'pasto', 'tumaco'].includes(key)) return 'Pacifica';
    if (['yopal', 'villavicencio', 'san jose del guaviare'].includes(key)) return 'Orinoquia';
    if (['mocoa', 'florencia', 'leticia'].includes(key)) return 'Amazonia';
    return 'Andina';
  }
}

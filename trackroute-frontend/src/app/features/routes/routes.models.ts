export interface RouteItem {
  id: string;
  originCity: string;
  destinationCity: string;
  vehicleType: string;
  carrierName: string;
  status: string;
  distanceKm: number;
  estimatedTimeHours: number;
  costUsd: number;
  createdAt?: string;
}

export interface RoutesListResponse {
  total: number;
  limit: number;
  data: RouteItem[];
}

export interface RouteUpsertPayload {
  originCity: string;
  destinationCity: string;
  distanceKm: number;
  estimatedTimeHours: number;
  vehicleType: string;
  carrierName: string;
  costUsd: number;
  status: string;
}

export interface ImportSummary {
  imported: number;
  failed: number;
  errors: string[];
}

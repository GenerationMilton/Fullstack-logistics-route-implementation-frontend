export interface RouteItem {
  id: string;
  origin_city: string;
  destination_city: string;
  vehicle_type: string;
  carrier: string;
  status: string;
  distance_km: number;
  estimated_time_hours: number;
  cost_usd: number;
}

export interface RoutesListResponse {
  total: number;
  limit: number;
  data: RouteItem[];
}

export interface RouteUpsertPayload {
  origin_city: string;
  destination_city: string;
  distance_km: number;
  estimated_time_hours: number;
  vehicle_type: string;
  carrier: string;
  cost_usd: number;
  status: string;
}

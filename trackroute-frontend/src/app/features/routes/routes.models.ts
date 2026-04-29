export interface RouteItem {
  id: string;
  origin_city: string;
  destination_city: string;
  vehicle_type: string;
  carrier: string;
  status: string;
  distance_km: number;
  cost_usd: number;
}

export interface RoutesListResponse {
  total: number;
  limit: number;
  data: RouteItem[];
}

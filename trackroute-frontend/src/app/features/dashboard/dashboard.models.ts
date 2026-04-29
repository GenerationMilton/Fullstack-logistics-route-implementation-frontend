export interface DashboardStatusTotal {
  status: string;
  count: number;
}

export interface DashboardTopRoute {
  id: number | string;
  originCity: string;
  destinationCity: string;
  costUsd: number;
}

export interface DashboardHeatmapItem {
  region: string;
  count: number;
}

export interface DashboardSummaryResponse {
  range: { from: string; to: string };
  totalsByStatus: DashboardStatusTotal[];
  topExpensiveRoutes: DashboardTopRoute[];
  activeHeatmapByRegion: DashboardHeatmapItem[];
}

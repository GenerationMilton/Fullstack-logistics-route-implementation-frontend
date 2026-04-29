export interface ActiveRouteTrack {
  routeId: string;
  lastLocation: string;
  progressPercent: number;
  etaMinutes: number;
  timestamp: string;
}

export interface ActiveTrackApiResponse {
  data?: ActiveRouteTrack[];
}

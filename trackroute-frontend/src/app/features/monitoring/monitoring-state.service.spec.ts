import { MonitoringStateService } from './monitoring-state.service';

describe('MonitoringStateService', () => {
  it('should update tracks and loading streams', () => {
    const service = new MonitoringStateService();
    let latestLoading = true;
    let latestTracksLength = 0;

    service.loading$.subscribe((value) => (latestLoading = value));
    service.tracks$.subscribe((value) => (latestTracksLength = value.length));

    service.setLoading(false);
    service.setTracks([
      { routeId: 'r1', lastLocation: 'Bogota', progressPercent: 10, etaMinutes: 80, timestamp: '2026-01-01' }
    ]);

    expect(latestLoading).toBe(false);
    expect(latestTracksLength).toBe(1);
  });
});

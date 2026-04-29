import { DashboardStateService } from './dashboard-state.service';

describe('DashboardStateService', () => {
  it('should update summary and loading streams', () => {
    const service = new DashboardStateService();
    let latestLoading = false;
    let latestSummary: unknown = null;

    service.loading$.subscribe((value) => (latestLoading = value));
    service.summary$.subscribe((value) => (latestSummary = value));

    const summary = {
      range: { from: '2026-01-01', to: '2026-01-31' },
      totalsByStatus: [],
      topExpensiveRoutes: [],
      activeHeatmapByRegion: []
    };

    service.setLoading(true);
    service.setSummary(summary);

    expect(latestLoading).toBe(true);
    expect(latestSummary).toEqual(summary);
  });
});

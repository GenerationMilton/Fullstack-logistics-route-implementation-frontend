import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let apiSpy: { get: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    apiSpy = { get: vi.fn() };
    TestBed.configureTestingModule({
      providers: [DashboardService, { provide: ApiService, useValue: apiSpy }]
    });
    service = TestBed.inject(DashboardService);
  });

  it('should call summary endpoint with from/to params', () => {
    apiSpy.get.mockReturnValue(of({}));
    service.getSummary('2026-01-01T00:00:00Z', '2026-01-31T23:59:59Z').subscribe();

    expect(apiSpy.get).toHaveBeenCalledWith('/api/v1/dashboard/summary', {
      from: '2026-01-01T00:00:00Z',
      to: '2026-01-31T23:59:59Z'
    });
  });
});

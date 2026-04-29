import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { MonitoringService } from './monitoring.service';

describe('MonitoringService', () => {
  let service: MonitoringService;
  let apiSpy: { get: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    apiSpy = { get: vi.fn() };
    TestBed.configureTestingModule({
      providers: [MonitoringService, { provide: ApiService, useValue: apiSpy }]
    });
    service = TestBed.inject(MonitoringService);
  });

  it('should return array response as-is', () => {
    const data = [{ routeId: 'r1', lastLocation: 'Bogota', progressPercent: 20, etaMinutes: 35, timestamp: '2026-01-01' }];
    apiSpy.get.mockReturnValue(of(data));

    service.getActiveTracks().subscribe((result) => {
      expect(result).toEqual(data);
    });
  });

  it('should map object response with data property', () => {
    const data = [{ routeId: 'r2', lastLocation: 'Cali', progressPercent: 50, etaMinutes: 15, timestamp: '2026-01-01' }];
    apiSpy.get.mockReturnValue(of({ data }));

    service.getActiveTracks().subscribe((result) => {
      expect(result).toEqual(data);
    });
  });
});

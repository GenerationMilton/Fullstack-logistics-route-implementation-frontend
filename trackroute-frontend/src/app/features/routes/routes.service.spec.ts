import { of } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { ApiService } from '../../core/services/api.service';
import { RoutesService } from './routes.service';

describe('RoutesService', () => {
  let service: RoutesService;
  let apiSpy: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    patch: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    apiSpy = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn()
    };
    TestBed.configureTestingModule({
      providers: [
        RoutesService,
        { provide: ApiService, useValue: apiSpy }
      ]
    });
    service = TestBed.inject(RoutesService);
  });

  it('should call list endpoint with query params', () => {
    apiSpy.get.mockReturnValue(of({ total: 0, limit: 20, data: [] }));
    service.list({ page: 1, limit: 20, origin: 'Bogota', sort: 'distance_km:asc' }).subscribe();

    expect(apiSpy.get).toHaveBeenCalledWith('/api/v1/routes', expect.objectContaining({
      page: 1,
      limit: 20,
      origin: 'Bogota'
    }));
  });

  it('should call disable endpoint', () => {
    apiSpy.patch.mockReturnValue(of({}));
    service.disable('abc-1').subscribe();
    expect(apiSpy.patch).toHaveBeenCalledWith('/api/v1/routes/abc-1/disable');
  });

  it('should call getById endpoint', () => {
    apiSpy.get.mockReturnValue(of({ id: 'r-1' }));
    service.getById('r-1').subscribe();
    expect(apiSpy.get).toHaveBeenCalledWith('/api/v1/routes/r-1');
  });

  it('should call create endpoint with payload', () => {
    apiSpy.post.mockReturnValue(of({ id: 'r-2' }));
    const payload = {
      originCity: 'Bogota',
      destinationCity: 'Cali',
      distanceKm: 460,
      estimatedTimeHours: 9,
      vehicleType: 'TRACTOMULA',
      carrierName: 'TCC',
      costUsd: 385,
      status: 'ACTIVA'
    };
    service.create(payload).subscribe();
    expect(apiSpy.post).toHaveBeenCalledWith('/api/v1/routes', payload);
  });

  it('should call update endpoint with payload', () => {
    apiSpy.put.mockReturnValue(of({ id: 'r-3' }));
    const payload = {
      originCity: 'Medellin',
      destinationCity: 'Cartagena',
      distanceKm: 700,
      estimatedTimeHours: 13,
      vehicleType: 'CAMION',
      carrierName: 'Servientrega',
      costUsd: 520,
      status: 'ACTIVA'
    };
    service.update('r-3', payload).subscribe();
    expect(apiSpy.put).toHaveBeenCalledWith('/api/v1/routes/r-3', payload);
  });

  it('should upload file to import endpoint', () => {
    apiSpy.post.mockReturnValue(of({ imported: 10, failed: 0, errors: [] }));
    const file = new File(['id,origin_city\n1,Bogota'], 'routes.csv', { type: 'text/csv' });
    service.importCsv(file).subscribe();

    expect(apiSpy.post).toHaveBeenCalled();
    const [url, formData] = apiSpy.post.mock.calls[0];
    expect(url).toBe('/api/v1/routes/import');
    expect(formData instanceof FormData).toBe(true);
  });
});

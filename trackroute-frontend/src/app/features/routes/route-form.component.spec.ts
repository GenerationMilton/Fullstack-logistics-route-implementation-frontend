import { of } from 'rxjs';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { RouteFormComponent } from './route-form.component';
import { RoutesService } from './routes.service';

describe('RouteFormComponent', () => {
  let fixture: ComponentFixture<RouteFormComponent>;
  let component: RouteFormComponent;
  let routesServiceSpy: {
    getById: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  let routerSpy: {
    navigate: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    routesServiceSpy = {
      getById: vi.fn(),
      create: vi.fn(),
      update: vi.fn()
    };
    routerSpy = { navigate: vi.fn() };

    routesServiceSpy.create.mockReturnValue(of({} as never));
    routesServiceSpy.getById.mockReturnValue(
      of({
        id: '1',
        originCity: 'Bogota',
        destinationCity: 'Cali',
        distanceKm: 500,
        estimatedTimeHours: 10,
        vehicleType: 'CAMION',
        carrierName: 'TCC',
        status: 'ACTIVA',
        costUsd: 200
      })
    );

    await TestBed.configureTestingModule({
      imports: [RouteFormComponent],
      providers: [
        { provide: RoutesService, useValue: routesServiceSpy },
        { provide: Router, useValue: routerSpy },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({}) } }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RouteFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create route when submitting valid create form', () => {
    component.form.setValue({
      originCity: 'Bogota',
      destinationCity: 'Medellin',
      distanceKm: 420,
      estimatedTimeHours: 8.5,
      vehicleType: 'CAMION',
      carrierName: 'TCC',
      costUsd: 300,
      status: 'ACTIVA'
    });

    component.submit();

    expect(routesServiceSpy.create).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/routes']);
  });
});

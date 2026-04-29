import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatusDistributionComponent } from './status-distribution.component';

describe('StatusDistributionComponent', () => {
  let fixture: ComponentFixture<StatusDistributionComponent>;
  let component: StatusDistributionComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatusDistributionComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(StatusDistributionComponent);
    component = fixture.componentInstance;
  });

  it('should calculate percentage based on max count', () => {
    component.items = [
      { status: 'ACTIVA', count: 50 },
      { status: 'INACTIVA', count: 25 }
    ];
    expect(component.percentage(25)).toBe(50);
  });

  it('should render rows when items exist', () => {
    component.items = [{ status: 'ACTIVA', count: 10 }];
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('ACTIVA');
    expect(element.textContent).toContain('10');
  });
});

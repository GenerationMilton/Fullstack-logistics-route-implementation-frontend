import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HeatmapGridComponent } from './heatmap-grid.component';

describe('HeatmapGridComponent', () => {
  let fixture: ComponentFixture<HeatmapGridComponent>;
  let component: HeatmapGridComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeatmapGridComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(HeatmapGridComponent);
    component = fixture.componentInstance;
  });

  it('should generate stronger color for higher counts', () => {
    component.items = [
      { region: 'Andina', count: 20 },
      { region: 'Caribe', count: 10 }
    ];

    const low = component.cellColor(10);
    const high = component.cellColor(20);
    expect(low).not.toBe(high);
  });

  it('should render region cells', () => {
    component.items = [{ region: 'Andina', count: 7 }];
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Andina');
    expect(element.textContent).toContain('7');
  });
});

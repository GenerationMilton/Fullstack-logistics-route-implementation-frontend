import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ServerTableComponent } from './server-table.component';

describe('ServerTableComponent', () => {
  let fixture: ComponentFixture<ServerTableComponent>;
  let component: ServerTableComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServerTableComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ServerTableComponent);
    component = fixture.componentInstance;
    component.columns = [{ key: 'origin_city', label: 'Origin', sortable: true }];
    component.rows = [{ id: '1', origin_city: 'Bogota' }];
    fixture.detectChanges();
    fixture.componentRef.setInput('filterFields', [{ key: 'origin', label: 'Origin' }]);
    fixture.detectChanges();
  });

  it('should emit filter change with debounce', async () => {
    const emitSpy = vi.spyOn(component.filterChange, 'emit');
    component.filtersForm.controls['origin'].setValue('Medellin');
    await new Promise((resolve) => setTimeout(resolve, 320));
    expect(emitSpy).toHaveBeenCalledWith(expect.objectContaining({ origin: 'Medellin' }));
  });

  it('should toggle sorting direction', () => {
    const emitSpy = vi.spyOn(component.sortChange, 'emit');
    component.toggleSort('origin_city');
    component.toggleSort('origin_city');
    expect(emitSpy).toHaveBeenCalledWith({ key: 'origin_city', direction: 'desc' });
  });

  it('should return sort indicators correctly', () => {
    expect(component.sortIndicator('origin_city')).toBe('');
    component.toggleSort('origin_city');
    expect(component.sortIndicator('origin_city')).toBe('↑');
    component.toggleSort('origin_city');
    expect(component.sortIndicator('origin_city')).toBe('↓');
    expect(component.sortIndicator('other')).toBe('');
  });

  it('should emit previous and next page events respecting boundaries', () => {
    const pageSpy = vi.spyOn(component.pageChange, 'emit');
    component.total = 100;
    component.pageSize = 20;
    component.page = 2;

    component.previousPage();
    component.nextPage();
    expect(pageSpy).toHaveBeenCalledWith({ page: 1, limit: 20 });
    expect(pageSpy).toHaveBeenCalledWith({ page: 3, limit: 20 });

    pageSpy.mockClear();
    component.page = 1;
    component.previousPage();
    expect(pageSpy).not.toHaveBeenCalled();

    component.page = component.totalPages;
    component.nextPage();
    expect(pageSpy).not.toHaveBeenCalled();
  });

  it('should compute totalPages with floor of 1', () => {
    component.total = 0;
    component.pageSize = 20;
    expect(component.totalPages).toBe(1);

    component.total = 41;
    expect(component.totalPages).toBe(3);
  });

  it('should toggle row selection and emit selected ids', () => {
    const selectionSpy = vi.spyOn(component.selectionChange, 'emit');
    const row = { id: 'r-1', origin_city: 'Bogota' };

    expect(component.isSelected(row)).toBe(false);
    component.toggleRowSelection(row);
    expect(component.isSelected(row)).toBe(true);
    expect(selectionSpy).toHaveBeenCalledWith(['r-1']);

    component.toggleRowSelection(row);
    expect(component.isSelected(row)).toBe(false);
    expect(selectionSpy).toHaveBeenLastCalledWith([]);
  });

  it('should ignore selection toggles for rows without id', () => {
    const selectionSpy = vi.spyOn(component.selectionChange, 'emit');
    component.toggleRowSelection({ origin_city: 'NoId' });
    expect(selectionSpy).not.toHaveBeenCalled();
  });

  it('should rebuild filters when filterFields changes and ignore unrelated changes', () => {
    const rebuildSpy = vi.spyOn(
      component as unknown as { rebuildFilters: () => void },
      'rebuildFilters'
    );
    component.ngOnChanges({ filterFields: {} as never });
    expect(rebuildSpy).toHaveBeenCalledTimes(1);

    rebuildSpy.mockClear();
    component.ngOnChanges({ loading: {} as never });
    expect(rebuildSpy).not.toHaveBeenCalled();
  });
});

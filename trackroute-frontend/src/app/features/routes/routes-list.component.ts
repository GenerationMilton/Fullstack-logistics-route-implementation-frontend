import { Component, OnInit, inject, signal } from '@angular/core';
import { ServerTableComponent } from '../../shared/table/server-table.component';
import {
  PageChangeEvent,
  SortChangeEvent,
  TableColumn,
  TableFilterField
} from '../../shared/table/table.models';
import { RoutesQuery, RoutesService } from './routes.service';
import { RouteItem } from './routes.models';

@Component({
  selector: 'app-routes-list',
  standalone: true,
  imports: [ServerTableComponent],
  template: `
    <section>
      <h2>Routes</h2>
      <app-server-table
        [columns]="columns"
        [filterFields]="filterFields"
        [rows]="rows()"
        [total]="total()"
        [page]="query().page"
        [pageSize]="query().limit"
        [loading]="loading()"
        [serverSide]="true"
        (pageChange)="onPageChange($event)"
        (sortChange)="onSortChange($event)"
        (filterChange)="onFilterChange($event)"
      />
    </section>
  `
})
export class RoutesListComponent implements OnInit {
  private readonly routesService = inject(RoutesService);

  readonly loading = signal(false);
  readonly rows = signal<Record<string, unknown>[]>([]);
  readonly total = signal(0);
  readonly query = signal<RoutesQuery>({
    page: 1,
    limit: 20
  });

  readonly columns: TableColumn[] = [
    { key: 'origin_city', label: 'Origin', sortable: true },
    { key: 'destination_city', label: 'Destination', sortable: true },
    { key: 'vehicle_type', label: 'Vehicle', sortable: true },
    { key: 'carrier', label: 'Carrier', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'distance_km', label: 'Distance (km)', sortable: true }
  ];

  readonly filterFields: TableFilterField[] = [
    { key: 'origin', label: 'Origin' },
    { key: 'destination', label: 'Destination' },
    { key: 'vehicle', label: 'Vehicle' },
    { key: 'status', label: 'Status' },
    { key: 'carrier', label: 'Carrier' }
  ];

  ngOnInit(): void {
    this.fetch();
  }

  onPageChange(event: PageChangeEvent): void {
    this.query.update((q) => ({ ...q, page: event.page, limit: event.limit }));
    this.fetch();
  }

  onSortChange(event: SortChangeEvent): void {
    this.query.update((q) => ({ ...q, page: 1, sort: `${event.key}:${event.direction}` }));
    this.fetch();
  }

  onFilterChange(filters: Record<string, string>): void {
    this.query.update((q) => ({ ...q, page: 1, ...filters }));
    this.fetch();
  }

  private fetch(): void {
    this.loading.set(true);
    this.routesService.list(this.query()).subscribe({
      next: (response) => {
        this.rows.set(this.mapRows(response.data));
        this.total.set(response.total);
        this.loading.set(false);
      },
      error: () => {
        this.rows.set([]);
        this.total.set(0);
        this.loading.set(false);
      }
    });
  }

  private mapRows(items: RouteItem[]): Record<string, unknown>[] {
    return items.map((item) => ({
      id: item.id,
      origin_city: item.origin_city,
      destination_city: item.destination_city,
      vehicle_type: item.vehicle_type,
      carrier: item.carrier,
      status: item.status,
      distance_km: item.distance_km
    }));
  }
}

import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
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
  imports: [CommonModule, ServerTableComponent],
  template: `
    <section>
      <h2>Routes</h2>
      <div class="actions">
        @if (canWrite()) {
          <button type="button" (click)="goToCreate()">Create route</button>
        }
        <button
          type="button"
          (click)="disableSelected()"
          [disabled]="selectedIds().length === 0 || disablingSelection() || !canWrite()"
        >
          Disable selected ({{ selectedIds().length }})
        </button>
      </div>
      <app-server-table
        [columns]="columns"
        [filterFields]="filterFields"
        [rows]="rows()"
        [total]="total()"
        [page]="query().page"
        [pageSize]="query().limit"
        [loading]="loading()"
        [serverSide]="true"
        [selectable]="canWrite()"
        [actionsEnabled]="canWrite()"
        (pageChange)="onPageChange($event)"
        (sortChange)="onSortChange($event)"
        (filterChange)="onFilterChange($event)"
        (rowAction)="onRowAction($event)"
        (selectionChange)="selectedIds.set($event)"
      />
    </section>
  `,
  styles: `
    .actions { display: flex; gap: 0.5rem; margin-bottom: 0.75rem; }
    .actions button { border: 1px solid #d1d5db; background: #fff; border-radius: 8px; padding: 0.4rem 0.65rem; cursor: pointer; }
    .actions button:disabled { opacity: .6; cursor: not-allowed; }
  `
})
export class RoutesListComponent implements OnInit {
  private readonly routesService = inject(RoutesService);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  readonly loading = signal(false);
  readonly disablingSelection = signal(false);
  readonly rows = signal<Record<string, unknown>[]>([]);
  readonly total = signal(0);
  readonly selectedIds = signal<string[]>([]);
  readonly canWrite = computed(() => this.authService.getUser()?.role === 'ADMIN');
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

  onRowAction(event: { action: string; row: Record<string, unknown> }): void {
    const id = String(event.row['id'] ?? '');
    if (!id) return;

    if (event.action === 'edit') {
      if (!this.canWrite()) return;
      this.router.navigate(['/routes', id, 'edit']);
      return;
    }

    if (event.action === 'disable') {
      if (!this.canWrite()) return;
      this.routesService.disable(id).subscribe({
        next: () => this.fetch()
      });
    }
  }

  goToCreate(): void {
    this.router.navigate(['/routes/new']);
  }

  disableSelected(): void {
    if (!this.canWrite()) return;
    const ids = this.selectedIds();
    if (ids.length === 0) return;

    this.disablingSelection.set(true);
    let pending = ids.length;

    for (const id of ids) {
      this.routesService.disable(id).subscribe({
        complete: () => {
          pending -= 1;
          if (pending === 0) {
            this.disablingSelection.set(false);
            this.selectedIds.set([]);
            this.fetch();
          }
        },
        error: () => {
          pending -= 1;
          if (pending === 0) {
            this.disablingSelection.set(false);
            this.fetch();
          }
        }
      });
    }
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

import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { RoutesCacheService } from '../../core/services/routes-cache.service';
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
    <section class="routes-wrap">
      <header class="page-head">
        <h2>Routes</h2>
        <p>Manage route records, filters, and actions.</p>
      </header>
      <div class="actions">
        @if (canWrite()) {
          <button type="button" class="primary" (click)="goToCreate()">Create route</button>
          <button type="button" class="ghost" (click)="goToImport()">Import CSV</button>
        }
        <button
          type="button"
          class="ghost"
          (click)="disableSelected()"
          [disabled]="selectedIds().length === 0 || disablingSelection() || !canWrite()"
        >
          Disable selected ({{ selectedIds().length }})
        </button>
      </div>
      @if (usingFallback()) {
        <p class="fallback-info">Showing fallback data (cached or sample) because API returned no routes.</p>
      }
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
    .routes-wrap { display: grid; gap: 0.8rem; font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; }
    .page-head { border: 1px solid #e2e8f0; background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%); border-radius: 12px; padding: 0.9rem 1rem; }
    .page-head h2 { margin: 0; font-size: 1.4rem; font-weight: 700; letter-spacing: -0.01em; }
    .page-head p { margin: 0.25rem 0 0; color: #475569; font-size: 0.95rem; }
    .actions { display: flex; gap: 0.5rem; margin-bottom: 0.2rem; }
    .actions button { border-radius: 8px; padding: 0.42rem 0.7rem; cursor: pointer; font-weight: 600; }
    .actions .primary { border: 1px solid #2563eb; background: #2563eb; color: #fff; }
    .actions .ghost { border: 1px solid #cbd5e1; background: #fff; color: #334155; }
    .actions button:disabled { opacity: .6; cursor: not-allowed; }
    .fallback-info { margin: 0; color: #9a3412; background: #fff7ed; border: 1px solid #fdba74; border-radius: 8px; padding: 0.45rem 0.6rem; font-size: 0.9rem; font-weight: 500; }
  `
})
export class RoutesListComponent implements OnInit {
  private readonly routesService = inject(RoutesService);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly routesCache = inject(RoutesCacheService);

  readonly loading = signal(false);
  readonly disablingSelection = signal(false);
  readonly rows = signal<Record<string, unknown>[]>([]);
  readonly total = signal(0);
  readonly selectedIds = signal<string[]>([]);
  readonly usingFallback = signal(false);
  readonly canWrite = computed(() => this.authService.getUser()?.role === 'ADMIN');
  readonly query = signal<RoutesQuery>({
    page: 1,
    limit: 20
  });

  readonly columns: TableColumn[] = [
    { key: 'originCity', label: 'Origin', sortable: true },
    { key: 'destinationCity', label: 'Destination', sortable: true },
    { key: 'vehicleType', label: 'Vehicle', sortable: true },
    { key: 'carrierName', label: 'Carrier', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'distanceKm', label: 'Distance (km)', sortable: true }
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

  goToImport(): void {
    this.router.navigate(['/routes/import']);
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
        const items = response.data ?? [];
        if (items.length > 0) {
          this.usingFallback.set(false);
          this.rows.set(this.mapRows(items));
          this.total.set(response.total);
        } else {
          this.applyFallbackData();
        }
        this.loading.set(false);
      },
      error: () => {
        this.applyFallbackData();
        this.loading.set(false);
      }
    });
  }

  private applyFallbackData(): void {
    const cached = this.routesCache.getAll();
    if (cached.length > 0) {
      this.usingFallback.set(true);
      this.rows.set(
        cached.slice(0, this.query().limit).map((item) => ({
          id: item.id,
          originCity: item.origin_city,
          destinationCity: item.destination_city,
          vehicleType: item.vehicle_type,
          carrierName: item.carrier,
          status: item.status,
          distanceKm: item.distance_km
        }))
      );
      this.total.set(cached.length);
      return;
    }

    this.usingFallback.set(true);
    const sample: RouteItem[] = [
      {
        id: 'sample-1',
        originCity: 'Bogota',
        destinationCity: 'Medellin',
        vehicleType: 'CAMION',
        carrierName: 'Servientrega',
        status: 'ACTIVA',
        distanceKm: 415.8,
        estimatedTimeHours: 8.5,
        costUsd: 320
      },
      {
        id: 'sample-2',
        originCity: 'Cali',
        destinationCity: 'Barranquilla',
        vehicleType: 'TRACTOMULA',
        carrierName: 'Coordinadora',
        status: 'EN MANTENIMIENTO',
        distanceKm: 1050,
        estimatedTimeHours: 18,
        costUsd: 480
      }
    ];
    this.rows.set(this.mapRows(sample));
    this.total.set(sample.length);
  }

  private mapRows(items: RouteItem[]): Record<string, unknown>[] {
    return items.map((item) => ({
      id: item.id,
      originCity: item.originCity,
      destinationCity: item.destinationCity,
      vehicleType: item.vehicleType,
      carrierName: item.carrierName,
      status: item.status,
      distanceKm: item.distanceKm
    }));
  }
}

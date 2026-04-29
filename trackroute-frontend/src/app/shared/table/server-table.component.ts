import { CommonModule } from '@angular/common';
import { Component, DestroyRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  PageChangeEvent,
  SortChangeEvent,
  TableColumn,
  TableFilterField
} from './table.models';

type SortDirection = 'asc' | 'desc';
type FilterFormShape = Record<string, FormControl<string>>;

@Component({
  selector: 'app-server-table',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="table-wrapper">
      <form class="filters" [formGroup]="filtersForm">
        @for (field of filterFields; track field.key) {
          <label>
            <span>{{ field.label }}</span>
            <input
              [formControlName]="field.key"
              [placeholder]="field.placeholder ?? ('Filter by ' + field.label)"
              [attr.aria-label]="'Filter by ' + field.label"
            />
          </label>
        }
      </form>

      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              @for (column of columns; track column.key) {
                <th>
                  @if (column.sortable) {
                    <button
                      type="button"
                      class="sort-btn"
                      (click)="toggleSort(column.key)"
                      [attr.aria-label]="'Sort by ' + column.label"
                    >
                      {{ column.label }}
                      <span>{{ sortIndicator(column.key) }}</span>
                    </button>
                  } @else {
                    <span>{{ column.label }}</span>
                  }
                </th>
              }
              @if (selectable) {
                <th>Select</th>
              }
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            @if (loading) {
              <tr>
                <td [attr.colspan]="columns.length + (selectable ? 2 : 1)">Loading...</td>
              </tr>
            } @else if (rows.length === 0) {
              <tr>
                <td [attr.colspan]="columns.length + (selectable ? 2 : 1)">No data found.</td>
              </tr>
            } @else {
              @for (row of rows; track row['id'] ?? $index) {
                <tr>
                  @for (column of columns; track column.key) {
                    <td>{{ row[column.key] }}</td>
                  }
                  @if (selectable) {
                    <td>
                      <input
                        type="checkbox"
                        [checked]="isSelected(row)"
                        (change)="toggleRowSelection(row)"
                        aria-label="Select row"
                      />
                    </td>
                  }
                  <td>
                    @if (actionsEnabled) {
                      <button type="button" (click)="rowAction.emit({ action: 'edit', row })">Edit</button>
                      <button type="button" (click)="rowAction.emit({ action: 'disable', row })">Disable</button>
                    } @else {
                      <span>-</span>
                    }
                  </td>
                </tr>
              }
            }
          </tbody>
        </table>
      </div>

      @if (serverSide) {
        <footer class="pagination">
          <span>Page {{ page }} of {{ totalPages }}</span>
          <div class="page-actions">
            <button type="button" (click)="previousPage()" [disabled]="page <= 1">Previous</button>
            <button type="button" (click)="nextPage()" [disabled]="page >= totalPages">Next</button>
          </div>
        </footer>
      }
    </section>
  `,
  styles: `
    .table-wrapper { display: grid; gap: 0.75rem; border: 1px solid #e2e8f0; border-radius: 12px; padding: 0.85rem; background: #fff; box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04); }
    .filters { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.75rem; }
    .filters label { display: grid; gap: 0.25rem; font-size: 0.85rem; }
    .filters input { padding: 0.5rem 0.6rem; border-radius: 8px; border: 1px solid #d1d5db; }
    .table-scroll { overflow-x: auto; border: 1px solid #e5e7eb; border-radius: 10px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 0.65rem; border-bottom: 1px solid #f1f5f9; text-align: left; }
    th { background: #f8fafc; font-weight: 700; }
    .sort-btn { display: inline-flex; align-items: center; gap: 0.25rem; border: 0; background: transparent; cursor: pointer; font-weight: 600; }
    .pagination { display: flex; justify-content: space-between; align-items: center; }
    .page-actions { display: flex; gap: 0.5rem; }
    .page-actions button { border: 1px solid #cbd5e1; background: #fff; border-radius: 8px; padding: 0.35rem 0.6rem; cursor: pointer; font-weight: 600; }
    td button { border: 1px solid #cbd5e1; background: #fff; border-radius: 6px; padding: 0.25rem 0.5rem; margin-right: 0.35rem; cursor: pointer; font-size: 0.78rem; }
  `
})
export class ServerTableComponent implements OnChanges {
  private readonly destroyRef = inject(DestroyRef);

  @Input() columns: TableColumn[] = [];
  @Input() filterFields: TableFilterField[] = [];
  @Input() rows: Record<string, unknown>[] = [];
  @Input() total = 0;
  @Input() pageSize = 20;
  @Input() page = 1;
  @Input() loading = false;
  @Input() serverSide = true;
  @Input() selectable = false;
  @Input() actionsEnabled = true;

  @Output() pageChange = new EventEmitter<PageChangeEvent>();
  @Output() sortChange = new EventEmitter<SortChangeEvent>();
  @Output() filterChange = new EventEmitter<Record<string, string>>();
  @Output() rowAction = new EventEmitter<{ action: string; row: Record<string, unknown> }>();
  @Output() selectionChange = new EventEmitter<string[]>();

  filtersForm = new FormGroup<FilterFormShape>({});
  activeSort: { key: string; direction: SortDirection } | null = null;
  selectedIds = new Set<string>();

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.total / this.pageSize));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['filterFields']) {
      this.rebuildFilters();
    }
  }

  toggleSort(key: string): void {
    if (!this.activeSort || this.activeSort.key !== key) {
      this.activeSort = { key, direction: 'asc' };
    } else {
      this.activeSort = {
        key,
        direction: this.activeSort.direction === 'asc' ? 'desc' : 'asc'
      };
    }

    this.sortChange.emit(this.activeSort);
  }

  sortIndicator(key: string): string {
    if (!this.activeSort || this.activeSort.key !== key) return '';
    return this.activeSort.direction === 'asc' ? '↑' : '↓';
  }

  previousPage(): void {
    if (this.page <= 1) return;
    this.pageChange.emit({ page: this.page - 1, limit: this.pageSize });
  }

  nextPage(): void {
    if (this.page >= this.totalPages) return;
    this.pageChange.emit({ page: this.page + 1, limit: this.pageSize });
  }

  private rebuildFilters(): void {
    const formShape: FilterFormShape = {};
    for (const field of this.filterFields) {
      formShape[field.key] = new FormControl('', { nonNullable: true });
    }

    this.filtersForm = new FormGroup(formShape);
    this.filtersForm.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        const normalized: Record<string, string> = {};
        for (const [key, val] of Object.entries(value)) {
          normalized[key] = String(val ?? '');
        }
        this.filterChange.emit(normalized);
      });
  }

  isSelected(row: Record<string, unknown>): boolean {
    const id = String(row['id'] ?? '');
    return this.selectedIds.has(id);
  }

  toggleRowSelection(row: Record<string, unknown>): void {
    const id = String(row['id'] ?? '');
    if (!id) return;

    if (this.selectedIds.has(id)) {
      this.selectedIds.delete(id);
    } else {
      this.selectedIds.add(id);
    }

    this.selectionChange.emit(Array.from(this.selectedIds));
  }
}

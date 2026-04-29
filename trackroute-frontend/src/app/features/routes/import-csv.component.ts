import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { UiFeedbackService } from '../../shared/ui/ui-feedback.service';
import { RoutesCacheService } from '../../core/services/routes-cache.service';
import { ImportSummary } from './routes.models';
import { RoutesService } from './routes.service';

@Component({
  selector: 'app-import-csv',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="import-wrap">
      <header class="hero">
        <h2>Import routes from CSV</h2>
        <p class="hint">
          Example dataset: <code>../data/routes_dataset.csv</code> (100 to 100000 rows).
        </p>
      </header>

      <section class="card uploader">
        <label class="file-label">
          <span>Select CSV file</span>
          <input type="file" accept=".csv,text/csv" (change)="onFileSelected($event)" />
        </label>

        @if (selectedFileName()) {
          <p class="selected"><strong>Selected:</strong> {{ selectedFileName() }}</p>
        }

        <div class="actions">
          <button type="button" class="btn ghost" (click)="goBack()">Back</button>
          <button type="button" class="btn primary" [disabled]="!selectedFile() || importing()" (click)="importFile()">
            {{ importing() ? 'Importing...' : 'Import CSV' }}
          </button>
        </div>
      </section>

      @if (previewHeaders().length > 0) {
        <section class="card">
          <div class="preview-head">
            @if (!isDataView()) {
              <h3>Preview (first {{ previewRows().length }} rows)</h3>
              <button type="button" class="btn ghost" [disabled]="loadingAllRows()" (click)="openDataView()">
                {{ loadingAllRows() ? 'Loading rows...' : 'View other rows' }}
              </button>
            } @else {
              <h3>Data view (rows {{ startRow() }}-{{ endRow() }} of {{ fullRows().length }})</h3>
              <button type="button" class="btn ghost" (click)="backToPreview()">Back to preview</button>
            }
          </div>

          <div class="preview-table">
            <table>
              <thead>
                <tr>
                  @for (header of previewHeaders(); track header) {
                    <th>{{ header }}</th>
                  }
                </tr>
              </thead>
              <tbody>
                @for (row of visibleRows(); track $index) {
                  <tr>
                    @for (cell of row; track $index) {
                      <td>{{ cell }}</td>
                    }
                  </tr>
                }
              </tbody>
            </table>
          </div>

          @if (isDataView()) {
            <div class="pager">
              <button type="button" class="btn ghost" (click)="prevPage()" [disabled]="currentPage() <= 1">Previous</button>
              <span>Page {{ currentPage() }} / {{ totalPages() }}</span>
              <button type="button" class="btn ghost" (click)="nextPage()" [disabled]="currentPage() >= totalPages()">Next</button>
            </div>
          }
        </section>
      }

      @if (summary()) {
        <section class="card">
          <h3>Import summary</h3>
          <p><strong>Imported:</strong> {{ summary()!.imported }}</p>
          <p><strong>Failed:</strong> {{ summary()!.failed }}</p>

          @if (summary()!.errors.length > 0) {
            <h4>Errors</h4>
            <ul class="errors">
              @for (err of summary()!.errors.slice(0, 20); track err) {
                <li>{{ err }}</li>
              }
            </ul>
          }
        </section>
      }
    </section>
  `,
  styles: `
    .import-wrap { display: grid; gap: 1rem; max-width: 1100px; margin: 0 auto; }
    .hero h2 { margin: 0; }
    .hint { color: #475569; margin: 0.25rem 0 0; }
    .card { border: 1px solid #e2e8f0; border-radius: 12px; background: #fff; padding: 1rem; box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04); }
    .uploader { display: grid; gap: 0.75rem; }
    .file-label { display: grid; gap: 0.35rem; }
    .file-label span { font-weight: 600; color: #0f172a; }
    .selected { margin: 0; color: #0f172a; }
    .actions { display: flex; gap: 0.5rem; }
    .btn { border: 1px solid #cbd5e1; border-radius: 8px; padding: 0.45rem 0.75rem; cursor: pointer; font-weight: 600; }
    .btn:disabled { opacity: .6; cursor: not-allowed; }
    .btn.ghost { background: #fff; color: #334155; }
    .btn.primary { background: #2563eb; color: #fff; border-color: #2563eb; }
    .preview-head { display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; }
    .preview-head h3 { margin: 0; }
    .preview-table { overflow-x: auto; border: 1px solid #e5e7eb; border-radius: 10px; }
    table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
    th { background: #f8fafc; font-weight: 700; }
    th, td { text-align: left; border-bottom: 1px solid #f1f5f9; padding: 0.45rem; white-space: nowrap; }
    .pager { display: flex; justify-content: space-between; align-items: center; margin-top: 0.75rem; }
    .errors { margin: 0.25rem 0 0; }
    code { background: #f1f5f9; border-radius: 5px; padding: 0.1rem 0.3rem; }
  `
})
export class ImportCsvComponent {
  private readonly routesService = inject(RoutesService);
  private readonly router = inject(Router);
  private readonly routesCache = inject(RoutesCacheService);
  private readonly uiFeedback = inject(UiFeedbackService);

  private readonly pageSize = 20;

  readonly selectedFile = signal<File | null>(null);
  readonly selectedFileName = signal('');
  readonly importing = signal(false);
  readonly loadingAllRows = signal(false);
  readonly isDataView = signal(false);
  readonly currentPage = signal(1);
  readonly summary = signal<ImportSummary | null>(null);
  readonly previewHeaders = signal<string[]>([]);
  readonly previewRows = signal<string[][]>([]);
  readonly fullRows = signal<string[][]>([]);
  readonly visibleRows = computed(() => {
    if (!this.isDataView()) return this.previewRows();
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.fullRows().slice(start, start + this.pageSize);
  });
  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.fullRows().length / this.pageSize))
  );
  readonly startRow = computed(() => {
    if (this.fullRows().length === 0) return 0;
    return (this.currentPage() - 1) * this.pageSize + 1;
  });
  readonly endRow = computed(() =>
    Math.min(this.currentPage() * this.pageSize, this.fullRows().length)
  );

  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0] ?? null;

    this.selectedFile.set(file);
    this.selectedFileName.set(file?.name ?? '');
    this.summary.set(null);
    this.loadingAllRows.set(false);
    this.isDataView.set(false);
    this.currentPage.set(1);
    this.previewHeaders.set([]);
    this.previewRows.set([]);
    this.fullRows.set([]);

    if (file) {
      this.generatePreview(file);
    }
  }

  importFile(): void {
    const file = this.selectedFile();
    if (!file) return;

    this.importing.set(true);
    this.routesService.importCsv(file).subscribe({
      next: (response) => {
        this.summary.set(response);
        this.persistImportedData(file);
        this.uiFeedback.show(
          `Dataset imported: ${response.imported} rows imported, ${response.failed} failed.`,
          'success',
          4500
        );
        this.importing.set(false);
      },
      error: () => {
        this.summary.set({
          imported: 0,
          failed: 1,
          errors: ['Import failed. Verify file format and backend availability.']
        });
        this.uiFeedback.show('Dataset import failed.', 'error');
        this.importing.set(false);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/routes']);
  }

  openDataView(): void {
    const file = this.selectedFile();
    if (!file) return;

    if (this.fullRows().length > 0) {
      this.isDataView.set(true);
      this.currentPage.set(1);
      return;
    }

    this.loadingAllRows.set(true);
    this.parseAllRows(file, () => {
      this.loadingAllRows.set(false);
      this.isDataView.set(true);
      this.currentPage.set(1);
    });
  }

  backToPreview(): void {
    this.isDataView.set(false);
    this.currentPage.set(1);
  }

  nextPage(): void {
    if (this.currentPage() >= this.totalPages()) return;
    this.currentPage.update((p) => p + 1);
  }

  prevPage(): void {
    if (this.currentPage() <= 1) return;
    this.currentPage.update((p) => p - 1);
  }

  private generatePreview(file: File): void {
    // Read only a small chunk for fast first preview.
    const chunk = file.slice(0, 128 * 1024);
    const reader = new FileReader();
    reader.onload = () => {
      const raw = String(reader.result ?? '');
      const lines = raw.split(/\r?\n/).filter((line) => line.trim().length > 0);
      if (lines.length === 0) return;

      const headers = this.parseCsvLine(lines[0]);
      const previewData = lines.slice(1, 21).map((line) => this.parseCsvLine(line));
      this.previewHeaders.set(headers);
      this.previewRows.set(previewData);
    };
    reader.readAsText(chunk);
  }

  private parseAllRows(file: File, onDone: () => void): void {
    const reader = new FileReader();
    reader.onload = () => {
      const raw = String(reader.result ?? '');
      const lines = raw.split(/\r?\n/).filter((line) => line.trim().length > 0);
      if (lines.length <= 1) {
        this.fullRows.set([]);
        onDone();
        return;
      }

      const rows = lines.slice(1).map((line) => this.parseCsvLine(line));
      this.fullRows.set(rows);
      onDone();
    };
    reader.readAsText(file);
  }

  private persistImportedData(file: File): void {
    if (this.previewHeaders().length === 0) return;

    if (this.fullRows().length > 0) {
      this.routesCache.setFromCsv(this.previewHeaders(), this.fullRows());
      return;
    }

    this.parseAllRows(file, () => {
      this.routesCache.setFromCsv(this.previewHeaders(), this.fullRows());
    });
  }

  private parseCsvLine(line: string): string[] {
    // Dataset is plain CSV without quoted commas; keep parser simple here.
    return line.split(',').map((part) => part.trim());
  }
}

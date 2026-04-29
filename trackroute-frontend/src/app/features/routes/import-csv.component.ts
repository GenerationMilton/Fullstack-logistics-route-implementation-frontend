import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ImportSummary } from './routes.models';
import { RoutesService } from './routes.service';

@Component({
  selector: 'app-import-csv',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="import-wrap">
      <h2>Import routes from CSV</h2>
      <p class="hint">
        Example dataset: <code>../data/routes_dataset.csv</code> (100 to 100000 rows).
      </p>

      <input type="file" accept=".csv,text/csv" (change)="onFileSelected($event)" />

      @if (selectedFileName()) {
        <p><strong>Selected:</strong> {{ selectedFileName() }}</p>
      }

      <div class="actions">
        <button type="button" (click)="goBack()">Back</button>
        <button type="button" [disabled]="!selectedFile() || importing()" (click)="importFile()">
          {{ importing() ? 'Importing...' : 'Import CSV' }}
        </button>
      </div>

      @if (previewHeaders().length > 0) {
        <h3>Preview (first {{ previewRows().length }} rows)</h3>
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
              @for (row of previewRows(); track $index) {
                <tr>
                  @for (cell of row; track $index) {
                    <td>{{ cell }}</td>
                  }
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      @if (summary()) {
        <h3>Import summary</h3>
        <p><strong>Imported:</strong> {{ summary()!.imported }}</p>
        <p><strong>Failed:</strong> {{ summary()!.failed }}</p>

        @if (summary()!.errors.length > 0) {
          <h4>Errors</h4>
          <ul>
            @for (err of summary()!.errors.slice(0, 20); track err) {
              <li>{{ err }}</li>
            }
          </ul>
        }
      }
    </section>
  `,
  styles: `
    .import-wrap { display: grid; gap: 0.75rem; max-width: 1100px; }
    .hint { color: #475569; margin: 0; }
    .actions { display: flex; gap: 0.5rem; }
    .actions button { border: 1px solid #d1d5db; background: #fff; border-radius: 8px; padding: 0.4rem 0.65rem; cursor: pointer; }
    .actions button:disabled { opacity: .6; cursor: not-allowed; }
    .preview-table { overflow-x: auto; border: 1px solid #e5e7eb; border-radius: 10px; }
    table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
    th, td { text-align: left; border-bottom: 1px solid #f1f5f9; padding: 0.45rem; white-space: nowrap; }
    code { background: #f1f5f9; border-radius: 5px; padding: 0.1rem 0.3rem; }
  `
})
export class ImportCsvComponent {
  private readonly routesService = inject(RoutesService);
  private readonly router = inject(Router);

  readonly selectedFile = signal<File | null>(null);
  readonly selectedFileName = signal('');
  readonly importing = signal(false);
  readonly summary = signal<ImportSummary | null>(null);
  readonly previewHeaders = signal<string[]>([]);
  readonly previewRows = signal<string[][]>([]);

  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0] ?? null;

    this.selectedFile.set(file);
    this.selectedFileName.set(file?.name ?? '');
    this.summary.set(null);
    this.previewHeaders.set([]);
    this.previewRows.set([]);

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
        this.importing.set(false);
      },
      error: () => {
        this.summary.set({
          imported: 0,
          failed: 1,
          errors: ['Import failed. Verify file format and backend availability.']
        });
        this.importing.set(false);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/routes']);
  }

  private generatePreview(file: File): void {
    // Read only a small chunk to support large files efficiently.
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

  private parseCsvLine(line: string): string[] {
    // Dataset is plain CSV without quoted commas; keep parser simple here.
    return line.split(',').map((part) => part.trim());
  }
}

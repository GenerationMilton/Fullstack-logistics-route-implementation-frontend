import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UiFeedbackService } from '../../shared/ui/ui-feedback.service';
import { RouteUpsertPayload } from './routes.models';
import { RoutesService } from './routes.service';

@Component({
  selector: 'app-route-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="form-wrap card">
      <header class="head">
        <h2>{{ isEdit() ? 'Edit route' : 'Create route' }}</h2>
        <p>Fill all required fields and save.</p>
      </header>

      <form [formGroup]="form" (ngSubmit)="submit()">
        <label>Origin city <input type="text" formControlName="originCity" /></label>
        <label>Destination city <input type="text" formControlName="destinationCity" /></label>
        <label>Distance (km) <input type="number" formControlName="distanceKm" /></label>
        <label>Estimated time (hours) <input type="number" formControlName="estimatedTimeHours" /></label>
        <label>Vehicle type <input type="text" formControlName="vehicleType" /></label>
        <label>Carrier <input type="text" formControlName="carrierName" /></label>
        <label>Cost (USD) <input type="number" formControlName="costUsd" /></label>
        <label>Status <input type="text" formControlName="status" /></label>

        <div class="actions">
          <button type="button" class="ghost" (click)="cancel()">Cancel</button>
          <button type="submit" class="primary" [disabled]="form.invalid || saving()">
            {{ saving() ? 'Saving...' : 'Save' }}
          </button>
        </div>
      </form>
      @if (errorMessage()) {
        <p class="error">{{ errorMessage() }}</p>
      }
    </section>
  `,
  styles: `
    .card { border: 1px solid #e2e8f0; border-radius: 12px; background: #fff; box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04); padding: 1rem; }
    .form-wrap { max-width: 840px; display: grid; gap: 0.85rem; font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; }
    .head h2 { margin: 0; font-size: 1.35rem; font-weight: 700; letter-spacing: -0.01em; }
    .head p { margin: 0.25rem 0 0; color: #475569; font-size: 0.95rem; }
    form { display: grid; grid-template-columns: repeat(2, minmax(220px, 1fr)); gap: 0.75rem; }
    label { display: grid; gap: 0.25rem; font-size: 0.92rem; color: #0f172a; font-weight: 500; }
    input { padding: 0.6rem; border-radius: 8px; border: 1px solid #d1d5db; }
    .actions { grid-column: 1 / -1; display: flex; justify-content: flex-end; gap: 0.5rem; }
    button { border-radius: 8px; padding: 0.45rem 0.75rem; cursor: pointer; font-weight: 600; }
    .ghost { border: 1px solid #cbd5e1; background: #fff; color: #334155; }
    .primary { border: 1px solid #2563eb; background: #2563eb; color: #fff; }
    button:disabled { opacity: .6; cursor: not-allowed; }
    .error { margin: 0; color: #b91c1c; }
  `
})
export class RouteFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly routesService = inject(RoutesService);
  private readonly uiFeedback = inject(UiFeedbackService);

  readonly saving = signal(false);
  readonly errorMessage = signal('');
  readonly isEdit = signal(false);
  private routeId: string | null = null;

  readonly form = this.fb.nonNullable.group({
    originCity: ['', [Validators.required, Validators.minLength(2)]],
    destinationCity: ['', [Validators.required, Validators.minLength(2)]],
    distanceKm: [0, [Validators.required, Validators.min(1)]],
    estimatedTimeHours: [0, [Validators.required, Validators.min(0.1)]],
    vehicleType: ['', [Validators.required]],
    carrierName: ['', [Validators.required]],
    costUsd: [0, [Validators.required, Validators.min(0)]],
    status: ['ACTIVA', [Validators.required]]
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.routeId = id;
    this.isEdit.set(true);
    this.routesService.getById(id).subscribe((routeItem) => {
      this.form.patchValue({
        originCity: routeItem.originCity,
        destinationCity: routeItem.destinationCity,
        distanceKm: routeItem.distanceKm,
        estimatedTimeHours: routeItem.estimatedTimeHours,
        vehicleType: routeItem.vehicleType,
        carrierName: routeItem.carrierName,
        costUsd: routeItem.costUsd,
        status: routeItem.status
      });
    });
  }

  submit(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.errorMessage.set('');

    const payload: RouteUpsertPayload = this.form.getRawValue();
    const request$ = this.routeId
      ? this.routesService.update(this.routeId, payload)
      : this.routesService.create(payload);

    request$.subscribe({
      next: () => {
        this.uiFeedback.show(
          this.routeId ? 'Route updated successfully.' : 'Route created successfully.',
          'success'
        );
        this.router.navigate(['/routes']);
      },
      error: () => {
        this.saving.set(false);
        this.errorMessage.set('Save failed. Please verify backend is available and payload is valid.');
        this.uiFeedback.show('Route save failed.', 'error');
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/routes']);
  }
}

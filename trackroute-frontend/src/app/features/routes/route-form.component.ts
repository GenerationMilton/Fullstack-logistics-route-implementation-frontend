import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RouteUpsertPayload } from './routes.models';
import { RoutesService } from './routes.service';

@Component({
  selector: 'app-route-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="form-wrap">
      <h2>{{ isEdit() ? 'Edit route' : 'Create route' }}</h2>

      <form [formGroup]="form" (ngSubmit)="submit()">
        <label>Origin city <input type="text" formControlName="origin_city" /></label>
        <label>Destination city <input type="text" formControlName="destination_city" /></label>
        <label>Distance (km) <input type="number" formControlName="distance_km" /></label>
        <label>Estimated time (hours) <input type="number" formControlName="estimated_time_hours" /></label>
        <label>Vehicle type <input type="text" formControlName="vehicle_type" /></label>
        <label>Carrier <input type="text" formControlName="carrier" /></label>
        <label>Cost (USD) <input type="number" formControlName="cost_usd" /></label>
        <label>Status <input type="text" formControlName="status" /></label>

        <div class="actions">
          <button type="button" (click)="cancel()">Cancel</button>
          <button type="submit" [disabled]="form.invalid || saving()">
            {{ saving() ? 'Saving...' : 'Save' }}
          </button>
        </div>
      </form>
    </section>
  `,
  styles: `
    .form-wrap { max-width: 720px; display: grid; gap: 0.75rem; }
    form { display: grid; grid-template-columns: repeat(2, minmax(180px, 1fr)); gap: 0.75rem; }
    label { display: grid; gap: 0.25rem; font-size: 0.9rem; }
    input { padding: 0.55rem; border-radius: 8px; border: 1px solid #d1d5db; }
    .actions { grid-column: 1 / -1; display: flex; justify-content: flex-end; gap: 0.5rem; }
    button { border: 1px solid #d1d5db; background: #fff; border-radius: 8px; padding: 0.4rem 0.65rem; cursor: pointer; }
  `
})
export class RouteFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly routesService = inject(RoutesService);

  readonly saving = signal(false);
  readonly isEdit = signal(false);
  private routeId: string | null = null;

  readonly form = this.fb.nonNullable.group({
    origin_city: ['', [Validators.required, Validators.minLength(2)]],
    destination_city: ['', [Validators.required, Validators.minLength(2)]],
    distance_km: [0, [Validators.required, Validators.min(1)]],
    estimated_time_hours: [0, [Validators.required, Validators.min(0.1)]],
    vehicle_type: ['', [Validators.required]],
    carrier: ['', [Validators.required]],
    cost_usd: [0, [Validators.required, Validators.min(0)]],
    status: ['ACTIVA', [Validators.required]]
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.routeId = id;
    this.isEdit.set(true);
    this.routesService.getById(id).subscribe((routeItem) => {
      this.form.patchValue({
        origin_city: routeItem.origin_city,
        destination_city: routeItem.destination_city,
        distance_km: routeItem.distance_km,
        estimated_time_hours: routeItem.estimated_time_hours,
        vehicle_type: routeItem.vehicle_type,
        carrier: routeItem.carrier,
        cost_usd: routeItem.cost_usd,
        status: routeItem.status
      });
    });
  }

  submit(): void {
    if (this.form.invalid) return;
    this.saving.set(true);

    const payload: RouteUpsertPayload = this.form.getRawValue();
    const request$ = this.routeId
      ? this.routesService.update(this.routeId, payload)
      : this.routesService.create(payload);

    request$.subscribe({
      next: () => this.router.navigate(['/routes']),
      error: () => this.saving.set(false)
    });
  }

  cancel(): void {
    this.router.navigate(['/routes']);
  }
}

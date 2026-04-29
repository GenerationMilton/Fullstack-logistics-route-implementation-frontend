import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="login-wrapper">
      <form class="login-card" [formGroup]="form" (ngSubmit)="submit()">
        <h1>TrackRoute Login</h1>
        <label>
          Username
          <input type="text" formControlName="username" />
        </label>
        <label>
          Password
          <input type="password" formControlName="password" />
        </label>
        <button type="submit" [disabled]="form.invalid || loading()">Sign in</button>
        @if (errorMessage()) {
        <p class="error">{{ errorMessage() }}</p>
        }
      </form>
    </section>
  `,
  styles: `
    .login-wrapper { min-height: 100vh; display: grid; place-items: center; background: #f5f7fa; }
    .login-card { width: min(380px, 100% - 2rem); display: grid; gap: 0.75rem; padding: 1.25rem; background: #fff; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,.08); }
    label { display: grid; gap: 0.25rem; font-size: 0.9rem; }
    input { padding: 0.65rem; border: 1px solid #d1d5db; border-radius: 8px; }
    button { padding: 0.7rem; border: 0; border-radius: 8px; background: #1d4ed8; color: #fff; cursor: pointer; }
    button:disabled { opacity: .6; cursor: not-allowed; }
    .error { color: #b91c1c; margin: 0; font-size: 0.9rem; }
  `
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly loading = signal(false);
  readonly errorMessage = signal('');

  readonly form = this.fb.nonNullable.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]]
  });

  submit(): void {
    if (this.form.invalid) return;

    this.loading.set(true);
    this.errorMessage.set('');

    this.authService.login(this.form.getRawValue()).subscribe({
      next: () => {
        const redirectTo =
          this.route.snapshot.queryParamMap.get('redirectTo') ?? '/dashboard';
        this.router.navigateByUrl(redirectTo);
      },
      error: () => {
        this.errorMessage.set('Invalid credentials.');
        this.loading.set(false);
      }
    });
  }
}

import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UiFeedbackService } from '../../shared/ui/ui-feedback.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <header class="top-nav">
      <div class="brand">
        <div class="brand-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" role="img">
            <path d="M3 6h10v8h-2.2a2.8 2.8 0 0 0-5.6 0H3V6Zm11 2h3.6l2.4 3v3h-1.2a2.8 2.8 0 0 0-5.6 0H12V8h2Zm-6.8 9.2a1.2 1.2 0 1 1 0-2.4 1.2 1.2 0 0 1 0 2.4Zm8 0a1.2 1.2 0 1 1 0-2.4 1.2 1.2 0 0 1 0 2.4Z"/>
          </svg>
        </div>
        <div class="brand-text">
          <strong>LogisColombia S.A.S</strong>
          <span>Tracking & Shipping Operations</span>
        </div>
      </div>
      <nav>
        <a routerLink="/dashboard" routerLinkActive="active">Dashboard</a>
        <a routerLink="/monitoring" routerLinkActive="active">Monitoring</a>
        <a routerLink="/routes" routerLinkActive="active">Routes</a>
      </nav>
      <div class="right">
        <span>{{ userLabel() }}</span>
        <button type="button" (click)="logout()">Logout</button>
      </div>
    </header>
    @if (feedback()) {
      <div class="toast" [class.success]="feedback()!.type === 'success'" [class.error]="feedback()!.type === 'error'">
        <span>{{ feedback()!.text }}</span>
        <button type="button" (click)="clearFeedback()">x</button>
      </div>
    }
    <main class="content">
      <router-outlet />
    </main>
  `,
  styles: `
    .top-nav { min-height: 68px; display: flex; align-items: center; gap: 1.2rem; padding: 0.55rem 1rem; border-bottom: 1px solid #e5e7eb; background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%); }
    .brand { display: flex; align-items: center; gap: 0.65rem; min-width: 260px; }
    .brand-icon { width: 38px; height: 38px; border-radius: 10px; display: grid; place-items: center; background: #eff6ff; border: 1px solid #bfdbfe; }
    .brand-icon svg { width: 22px; height: 22px; fill: #1d4ed8; }
    .brand-text { display: grid; line-height: 1.15; }
    .brand-text strong { font-size: 0.95rem; color: #0f172a; letter-spacing: -0.01em; }
    .brand-text span { font-size: 0.74rem; color: #64748b; }
    nav { display: flex; gap: 1rem; margin-left: 0.5rem; }
    nav a { text-decoration: none; color: #374151; }
    nav a.active { color: #1d4ed8; font-weight: 600; }
    .right { margin-left: auto; display: flex; align-items: center; gap: .75rem; font-size: 0.88rem; color: #334155; }
    button { border: 1px solid #d1d5db; background: #fff; border-radius: 8px; padding: .35rem .6rem; cursor: pointer; }
    .toast { margin: .75rem 1rem 0; border: 1px solid #bfdbfe; background: #eff6ff; color: #1e3a8a; border-radius: 10px; padding: .55rem .7rem; display: flex; justify-content: space-between; align-items: center; }
    .toast.success { border-color: #86efac; background: #f0fdf4; color: #166534; }
    .toast.error { border-color: #fecaca; background: #fef2f2; color: #991b1b; }
    .toast button { border: 0; background: transparent; color: inherit; font-weight: 700; padding: 0; }
    .content { padding: 1rem; }
  `
})
export class ShellComponent {
  private readonly authService = inject(AuthService);
  private readonly uiFeedback = inject(UiFeedbackService);

  readonly userLabel = computed(
    () => `${this.authService.getUser()?.username ?? 'unknown'} (${this.authService.getUser()?.role ?? '-'})`
  );
  readonly feedback = this.uiFeedback.message;

  logout(): void {
    this.authService.logout();
  }

  clearFeedback(): void {
    this.uiFeedback.clear();
  }
}

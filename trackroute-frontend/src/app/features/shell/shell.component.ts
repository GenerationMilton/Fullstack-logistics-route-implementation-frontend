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
      <div class="brand">TrackRoute</div>
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
    .top-nav { height: 60px; display: flex; align-items: center; gap: 1rem; padding: 0 1rem; border-bottom: 1px solid #e5e7eb; }
    .brand { font-weight: 700; }
    nav { display: flex; gap: 0.8rem; }
    nav a { text-decoration: none; color: #374151; }
    nav a.active { color: #1d4ed8; font-weight: 600; }
    .right { margin-left: auto; display: flex; align-items: center; gap: .75rem; }
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

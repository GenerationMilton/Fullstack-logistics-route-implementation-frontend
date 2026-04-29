import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

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
    .content { padding: 1rem; }
  `
})
export class ShellComponent {
  private readonly authService = inject(AuthService);

  readonly userLabel = computed(
    () => `${this.authService.getUser()?.username ?? 'unknown'} (${this.authService.getUser()?.role ?? '-'})`
  );

  logout(): void {
    this.authService.logout();
  }
}

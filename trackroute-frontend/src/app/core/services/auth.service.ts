import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import {
  AuthUser,
  LoginRequest,
  LoginResponse,
  UserRole
} from '../models/auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly tokenStorageKey = 'trackroute.auth.token';
  private readonly tokenSignal = signal<string | null>(null);
  private readonly userSignal = signal<AuthUser | null>(null);

  readonly token = computed(() => this.tokenSignal());
  readonly user = computed(() => this.userSignal());
  readonly isAuthenticated = computed(() => Boolean(this.userSignal()));

  constructor() {
    const persistedToken = localStorage.getItem(this.tokenStorageKey);
    if (!persistedToken) return;

    this.setSession(persistedToken);
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>('/api/v1/auth/login', credentials)
      .pipe(tap(({ token }) => this.setSession(token)));
  }

  logout(): void {
    this.tokenSignal.set(null);
    this.userSignal.set(null);
    localStorage.removeItem(this.tokenStorageKey);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return this.tokenSignal();
  }

  getUser(): AuthUser | null {
    return this.userSignal();
  }

  hasRole(roles: UserRole[]): boolean {
    const role = this.userSignal()?.role;
    return Boolean(role && roles.includes(role));
  }

  private setSession(token: string): void {
    const decoded = this.decodeToken(token);
    if (!decoded || this.isExpired(decoded.exp)) {
      this.logout();
      return;
    }

    this.tokenSignal.set(token);
    this.userSignal.set(decoded);
    localStorage.setItem(this.tokenStorageKey, token);
  }

  private decodeToken(token: string): AuthUser | null {
    try {
      const payload = token.split('.')[1];
      if (!payload) return null;

      const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
      const decodedPayload = JSON.parse(atob(normalized)) as Partial<AuthUser>;

      const username = decodedPayload.username ?? decodedPayload.sub ?? 'unknown';
      const role = decodedPayload.role as UserRole | undefined;
      if (!role || (role !== 'ADMIN' && role !== 'OPERATOR')) return null;

      return {
        sub: decodedPayload.sub,
        username,
        role,
        exp: decodedPayload.exp
      };
    } catch {
      return null;
    }
  }

  private isExpired(exp?: number): boolean {
    if (!exp) return false;
    const now = Math.floor(Date.now() / 1000);
    return now >= exp;
  }
}

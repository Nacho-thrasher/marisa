import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.model';
import { LoginResponse, Usuario } from '../models/auth.model';

const TOKEN_KEY = 'marisa_token';
const REFRESH_KEY = 'marisa_refresh';
const USER_KEY = 'marisa_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private base = environment.apiUrl;

  private readonly _user = signal<Usuario | null>(this.loadUser());
  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);

  login(username: string, password: string): Observable<ApiResponse<LoginResponse>> {
    return this.http
      .post<ApiResponse<LoginResponse>>(`${this.base}/auth/login`, { username, password })
      .pipe(tap((res) => this.persistSession(res.data)));
  }

  logout(): void {
    this.http.post(`${this.base}/auth/logout`, {}).subscribe({
      next: () => this.clearSession(),
      error: () => this.clearSession(),
    });
  }

  get token(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  get refreshToken(): string | null {
    return localStorage.getItem(REFRESH_KEY);
  }

  /** ¿El usuario tiene el permiso "modulo:accion"? ADMIN siempre. */
  hasPermission(permiso: string): boolean {
    const u = this._user();
    if (!u) return false;
    return u.permisos.includes('*') || u.permisos.includes(permiso);
  }

  hasRole(...roles: string[]): boolean {
    const u = this._user();
    return !!u && (u.rol === 'ADMIN' || roles.includes(u.rol));
  }

  clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    this._user.set(null);
    this.router.navigate(['/login']);
  }

  private persistSession(data: LoginResponse): void {
    localStorage.setItem(TOKEN_KEY, data.accessToken);
    localStorage.setItem(REFRESH_KEY, data.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    this._user.set(data.user);
  }

  private loadUser(): Usuario | null {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as Usuario) : null;
  }
}

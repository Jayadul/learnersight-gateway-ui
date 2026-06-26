import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { JwtPayload, LoginRequest, LoginResponse } from '../models/auth.model';
import { ApiEndpoints } from '../api/api-endpoints';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly _accessToken = signal<string | null>(null);
  private _refreshToken: string | null = null;

  readonly isAuthenticated = computed<boolean>(() => {
    const payload = this._decodeToken(this._accessToken());
    if (!payload) return false;
    return payload.exp > Math.floor(Date.now() / 1000);
  });

  login(req: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}${ApiEndpoints.auth.login}`, req)
      .pipe(tap((res) => this._storeTokens(res)));
  }

  logout(): void {
    this.http.post(`${environment.apiUrl}${ApiEndpoints.auth.logout}`, {}).subscribe({
      next: () => undefined,
      error: () => undefined,
    });
    this._clearTokens();
    void this.router.navigate(['/sign-in']);
  }

  refreshToken(): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}${ApiEndpoints.auth.refresh}`, {
        refreshToken: this._refreshToken,
      })
      .pipe(tap((res) => this._storeTokens(res)));
  }

  getCurrentUser(): JwtPayload | null {
    return this._decodeToken(this._accessToken());
  }

  getAccessToken(): string | null {
    return this._accessToken();
  }

  private _storeTokens(res: LoginResponse): void {
    this._accessToken.set(res.accessToken);
    this._refreshToken = res.refreshToken;
  }

  private _clearTokens(): void {
    this._accessToken.set(null);
    this._refreshToken = null;
  }

  private _decodeToken(token: string | null): JwtPayload | null {
    if (!token) return null;
    try {
      const segments = token.split('.');
      if (segments.length !== 3) return null;
      const base64 = segments[1].replace(/-/g, '+').replace(/_/g, '/');
      const json = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join(''),
      );
      return JSON.parse(json) as JwtPayload;
    } catch {
      return null;
    }
  }
}

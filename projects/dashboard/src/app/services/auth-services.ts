import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { API_URL } from 'shared';
import { LoginRequest } from '../iterface/login-request';
import { AuthResponse } from '../iterface/auth-response';

@Injectable({
  providedIn: 'root',
})
export class AuthServices {
  private readonly TOKEN_KEY = 'token';
  private readonly REFRESH_KEY = 'refreshToken';

  constructor(
    private _httpClient: HttpClient,
    @Inject(API_URL) private apiUrl: string
  ) {}

  login(body: LoginRequest, remember: boolean): Observable<AuthResponse> {
    return this._httpClient
      .post<AuthResponse>(`${this.apiUrl}/Account/login`, body)
      .pipe(
        tap((res) => this.saveTokens(res, remember))
      );
  }

  private saveTokens(res: any, remember: boolean): void {
    const token =
      res?.token ??
      res?.Token ??
      res?.accessToken ??
      res?.data?.token ??
      res?.data?.accessToken;

    const refreshToken =
      res?.refreshToken ??
      res?.RefreshToken ??
      res?.data?.refreshToken;

    if (!token) {
      console.error('Login response has no token:', res);
      return;
    }

    this.clearTokens();
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem(this.TOKEN_KEY, token);
    if (refreshToken) {
      storage.setItem(this.REFRESH_KEY, refreshToken);
    }
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY) ?? sessionStorage.getItem(this.TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_KEY) ?? sessionStorage.getItem(this.REFRESH_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  clearTokens(): void {
    [localStorage, sessionStorage].forEach((s) => {
      s.removeItem(this.TOKEN_KEY);
      s.removeItem(this.REFRESH_KEY);
    });
  }

  logout(): void {
    this.clearTokens();
  }
}

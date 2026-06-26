import { HttpContextToken, HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { BehaviorSubject, catchError, filter, switchMap, take, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';

// Shared refresh state (module-level, single instance for the whole app).
let isRefreshing = false;
const refreshSubject = new BehaviorSubject<string | null>(null);

// Marks a request that has already been retried once, so a second 401 logs out
// instead of looping forever.
const RETRIED = new HttpContextToken<boolean>(() => false);

function addToken(req: HttpRequest<unknown>, token: string | null): HttpRequest<unknown> {
  if (!token) {
    return req;
  }
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  const isAuthEndpoint =
    req.url.includes('/api/auth/login') || req.url.includes('/api/auth/refresh');

  // Never attach a token or handle 401 for the auth endpoints themselves.
  if (isAuthEndpoint) {
    return next(req);
  }

  const authReq = addToken(req, auth.getAccessToken());

  return next(authReq).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
        return throwError(() => error);
      }

      // Already retried once -> give up and log out.
      if (req.context.get(RETRIED)) {
        auth.logout();
        return throwError(() => error);
      }

      if (isRefreshing) {
        // Wait for the in-flight refresh, then retry this request once.
        return refreshSubject.pipe(
          filter((token): token is string => token !== null),
          take(1),
          switchMap((token) => {
            const retried = addToken(req.clone({ context: req.context.set(RETRIED, true) }), token);
            return next(retried);
          }),
        );
      }

      isRefreshing = true;
      refreshSubject.next(null);

      return auth.refreshToken().pipe(
        switchMap((res) => {
          isRefreshing = false;
          refreshSubject.next(res.accessToken);
          const retried = addToken(
            req.clone({ context: req.context.set(RETRIED, true) }),
            res.accessToken,
          );
          return next(retried);
        }),
        catchError((refreshError: unknown) => {
          isRefreshing = false;
          auth.logout();
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};

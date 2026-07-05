import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ApiError } from '../models/api-error.model';
import { NotificationService } from '../services/notification.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notify = inject(NotificationService);

  const isAuthEndpoint =
    req.url.includes('/api/auth/login') || req.url.includes('/api/auth/refresh');

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        const backendMessage = (error.error as ApiError | undefined)?.message;
        switch (error.status) {
          case 401:
            // Sign-in handles its own 401; auth interceptor handles the rest.
            break;
          case 403:
            notify.error("You don't have permission to do this.");
            break;
          case 400:
          case 422:
            notify.error(backendMessage ?? 'Request could not be processed.');
            break;
          case 500:
            notify.error('Server error. Please try again.');
            break;
          case 0:
            if (!isAuthEndpoint) {
              notify.error('Connection error. Check your network.');
            }
            break;
          default:
            if (backendMessage) {
              notify.error(backendMessage);
            }
        }
      }
      return throwError(() => error);
    }),
  );
};

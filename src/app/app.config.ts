import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { DATE_PIPE_DEFAULT_OPTIONS } from '@angular/common';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { routes } from './app.routes';
import { APP_UTC_OFFSET } from './core/time/app-time';
import { mockInterceptor } from './core/interceptors/mock.interceptor';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { loadingInterceptor } from './core/interceptors/loading.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimationsAsync(),
    provideHttpClient(withInterceptors([loadingInterceptor, mockInterceptor, authInterceptor, errorInterceptor])),
    // All dates display in Dhaka time (UTC+6) regardless of the browser's zone.
    { provide: DATE_PIPE_DEFAULT_OPTIONS, useValue: { timezone: APP_UTC_OFFSET } },
  ],
};

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/** Usage in routes: canActivate: [roleGuard('SuperAdmin')] */
export function roleGuard(...allowedRoles: string[]): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const user = auth.getCurrentUser();
    if (user && allowedRoles.includes(user.role)) {
      return true;
    }
    return router.createUrlTree(['/forbidden']);
  };
}

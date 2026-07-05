import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { roleGuard } from './core/auth/role.guard';
import { AuthLayoutComponent } from './layout/auth-layout/auth-layout.component';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: '',
    component: AuthLayoutComponent,
    children: [
      {
        path: 'sign-in',
        loadComponent: () =>
          import('./features/auth/sign-in/sign-in.component').then((m) => m.SignInComponent),
      },
    ],
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'logs/messages',
        loadComponent: () =>
          import('./features/message-logs/message-logs.component').then((m) => m.MessageLogsComponent),
      },
      {
        path: 'logs/dispatch',
        loadComponent: () =>
          import('./features/dispatch-logs/dispatch-logs.component').then((m) => m.DispatchLogsComponent),
      },
      {
        path: 'logs/api',
        loadComponent: () =>
          import('./features/api-logs/api-logs.component').then((m) => m.ApiLogsComponent),
      },
      {
        path: 'send',
        loadComponent: () =>
          import('./features/send-message/send-message.component').then((m) => m.SendMessageComponent),
      },
      {
        path: 'settings/gateway-simulator',
        loadComponent: () =>
          import('./features/sendtext-api/sendtext-api.component').then((m) => m.SendTextApiComponent),
        canActivate: [roleGuard('SuperAdmin')],
      },
      {
        path: 'settings/channels',
        loadComponent: () =>
          import('./features/channel-configs/channel-configs.component').then((m) => m.ChannelConfigsComponent),
        canActivate: [roleGuard('SuperAdmin')],
      },
      {
        path: 'settings/fallback',
        loadComponent: () =>
          import('./features/fallback-policies/fallback-policies.component').then((m) => m.FallbackPoliciesComponent),
        canActivate: [roleGuard('SuperAdmin')],
      },
      {
        path: 'settings/users',
        loadComponent: () =>
          import('./features/settings/admin-users/admin-users.component').then((m) => m.AdminUsersComponent),
        canActivate: [roleGuard('SuperAdmin')],
      },
      {
        path: 'forbidden',
        loadComponent: () =>
          import('./features/forbidden/forbidden.component').then((m) => m.ForbiddenComponent),
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];

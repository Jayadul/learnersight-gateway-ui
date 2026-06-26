import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { LoadingService } from '../../core/services/loading.service';
import { HasRoleDirective } from '../../shared/directives/has-role.directive';
import { environment } from '../../../environments/environment';

interface NavItem { label: string; icon: string; route: string; superAdminOnly?: boolean; }
interface NavGroup { title: string; items: NavItem[]; }

const ROUTE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/logs/messages': 'Message Logs',
  '/logs/dispatch': 'Dispatch Logs',
  '/logs/api': 'API Logs',
  '/reports/voice': 'Voice Reports',
  '/send': 'Send Message',
  '/settings/channels': 'Channel Configs',
  '/settings/fallback': 'Fallback Policies',
  '/settings/users': 'Users',
  '/forbidden': 'Access Denied',
};

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    RouterOutlet, RouterLink, RouterLinkActive,
    MatSidenavModule, MatToolbarModule, MatListModule, MatIconModule,
    MatButtonModule, MatChipsModule, MatMenuModule, MatTooltipModule,
    HasRoleDirective,
  ],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainLayoutComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly breakpoints = inject(BreakpointObserver);
  private readonly router = inject(Router);

  readonly loading = inject(LoadingService);
  readonly mockMode = environment.mock;
  readonly opened = signal(true);

  private readonly isWide = toSignal(
    this.breakpoints.observe(['(min-width: 1024px)']).pipe(map((r) => r.matches)),
    { initialValue: true },
  );
  readonly sidenavMode = computed<'side' | 'over'>(() => (this.isWide() ? 'side' : 'over'));

  readonly user = computed(() => this.auth.getCurrentUser());

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map((e) => (e as NavigationEnd).urlAfterRedirects.split('?')[0]),
    ),
    { initialValue: this.router.url.split('?')[0] },
  );

  readonly pageTitle = computed(() => ROUTE_TITLES[this.currentUrl()] ?? 'NetZeroGateway');

  readonly groups: NavGroup[] = [
    {
      title: 'Monitoring',
      items: [
        { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
        { label: 'Message Logs', icon: 'forum', route: '/logs/messages' },
        { label: 'Dispatch Logs', icon: 'send', route: '/logs/dispatch' },
        { label: 'API Logs', icon: 'receipt_long', route: '/logs/api' },
        { label: 'Voice Reports', icon: 'phone_in_talk', route: '/reports/voice' },
      ],
    },
    {
      title: 'Messaging',
      items: [{ label: 'Send Message', icon: 'send_to_mobile', route: '/send' }],
    },
    {
      title: 'Configuration',
      items: [
        { label: 'Channel Configs', icon: 'settings_input_antenna', route: '/settings/channels' },
        { label: 'Fallback Policies', icon: 'alt_route', route: '/settings/fallback' },
      ],
    },
    {
      title: 'Admin',
      items: [
        { label: 'Users', icon: 'manage_accounts', route: '/settings/users', superAdminOnly: true },
      ],
    },
  ];

  ngOnInit(): void {
    this.opened.set(this.isWide());
  }

  toggle(): void {
    this.opened.update((v) => !v);
  }

  closeIfOver(): void {
    if (this.sidenavMode() === 'over') {
      this.opened.set(false);
    }
  }

  logout(): void {
    this.auth.logout();
  }
}

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
import { BackupPreset, BackupService, backupRange } from '../../core/services/backup.service';
import { NotificationService } from '../../core/services/notification.service';
import { environment } from '../../../environments/environment';

interface NavItem { label: string; icon: string; route: string; }
interface NavGroup { title: string; items: NavItem[]; superAdminOnly?: boolean; }

const ROUTE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/logs/messages': 'Message Logs',
  '/logs/dispatch': 'Delivery Logs',
  '/logs/api': 'API Logs',
  '/send': 'Messages & Calls',
  '/settings/gateway-simulator': 'Gateway Simulator',
  '/settings/channels': 'Channels',
  '/settings/fallback': 'Fallback Rules',
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
  ],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainLayoutComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly breakpoints = inject(BreakpointObserver);
  private readonly router = inject(Router);
  private readonly backup = inject(BackupService);
  private readonly notify = inject(NotificationService);

  readonly loading = inject(LoadingService);
  readonly mockMode = environment.mock;
  readonly opened = signal(true);
  readonly downloading = signal(false);

  readonly backupPresets: ReadonlyArray<{ key: BackupPreset; label: string }> = [
    { key: 'last-week',  label: 'Last Week' },
    { key: 'last-month', label: 'Last Month' },
    { key: 'this-month', label: 'This Month' },
    { key: 'this-year',  label: 'This Year' },
    { key: 'all-time',   label: 'All Time' },
  ];

  private readonly isWide = toSignal(
    this.breakpoints.observe(['(min-width: 1024px)']).pipe(map((r) => r.matches)),
    { initialValue: true },
  );
  readonly sidenavMode = computed<'side' | 'over'>(() => (this.isWide() ? 'side' : 'over'));

  readonly user = computed(() => this.auth.getCurrentUser());
  readonly userInitial = computed(() => this.user()?.name?.charAt(0).toUpperCase() ?? '?');

  /** Backend sends the role as a compact enum name (e.g. "SuperAdmin"). */
  roleLabel(role: string): string {
    return role === 'SuperAdmin' ? 'Super Admin' : role;
  }

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
        { label: 'Delivery Logs', icon: 'send', route: '/logs/dispatch' },
        { label: 'API Logs', icon: 'receipt_long', route: '/logs/api' },
      ],
    },
    {
      title: 'Messaging',
      items: [{ label: 'Messages & Calls', icon: 'send_to_mobile', route: '/send' }],
    },
    {
      title: 'Configuration',
      superAdminOnly: true,
      items: [
        { label: 'Channels', icon: 'settings_input_antenna', route: '/settings/channels' },
        { label: 'Fallback Rules', icon: 'alt_route', route: '/settings/fallback' },
      ],
    },
    {
      title: 'Administration',
      superAdminOnly: true,
      items: [
        { label: 'Users', icon: 'manage_accounts', route: '/settings/users' },
        { label: 'Gateway Simulator', icon: 'integration_instructions', route: '/settings/gateway-simulator' },
      ],
    },
  ];

  /** Groups the signed-in user is allowed to see (hides SuperAdmin-only groups entirely). */
  readonly visibleGroups = computed(() =>
    this.groups.filter((g) => !g.superAdminOnly || this.user()?.role === 'SuperAdmin'),
  );

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

  downloadBackup(preset: BackupPreset): void {
    this.downloading.set(true);
    this.backup.download(backupRange(preset)).subscribe({
      next: (blob) => {
        this.downloading.set(false);
        const stamp = new Date().toISOString().slice(0, 10);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `netzero-backup-${preset}-${stamp}.xlsx`;
        a.click();
        URL.revokeObjectURL(url);
        this.notify.success('Backup downloaded');
      },
      error: () => this.downloading.set(false),
    });
  }
}

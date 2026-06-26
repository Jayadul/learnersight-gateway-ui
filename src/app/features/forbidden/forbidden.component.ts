import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-forbidden',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="forbidden-page">
      <mat-icon class="icon">lock</mat-icon>
      <h1>Access Denied</h1>
      <p>You don't have permission to view this page.</p>
      <a mat-flat-button color="primary" routerLink="/dashboard">Back to Dashboard</a>
    </div>
  `,
  styles: [`
    .forbidden-page {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      min-height: 60vh; gap: 16px; text-align: center;
    }
    .icon { font-size: 64px; width: 64px; height: 64px; color: var(--nzg-error); }
    h1 { margin: 0; font-size: 28px; color: var(--nzg-text); }
    p { margin: 0; color: var(--nzg-text-muted); }
  `],
})
export class ForbiddenComponent {}

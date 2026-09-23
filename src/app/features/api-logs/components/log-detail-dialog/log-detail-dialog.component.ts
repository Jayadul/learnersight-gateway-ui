import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { environment } from '../../../../../environments/environment';
import { ApiEndpoints } from '../../../../core/api/api-endpoints';
import { ApiLogDto } from '../../../../core/models/api-log.model';
import { CopyButtonComponent } from '../../../../shared/components/copy-button/copy-button.component';

@Component({
  selector: 'app-log-detail-dialog',
  standalone: true,
  imports: [DatePipe, MatDialogModule, MatButtonModule, CopyButtonComponent],
  templateUrl: './log-detail-dialog.component.html',
  styleUrl: './log-detail-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogDetailDialogComponent {
  readonly log = inject<ApiLogDto>(MAT_DIALOG_DATA);
  readonly curl = this.buildCurl(this.log);

  pretty(value: string): string {
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return value;
    }
  }

  /**
   * Reconstructs the full request as a copyable curl command. ApiLog does not store the
   * HTTP method or content type directly, so the shape of the already-masked rawBody
   * tells them apart: a leading "?" is the GET query string (ApiLoggingMiddleware stores
   * QueryString.Value verbatim, "?" included); a leading "{" is a JSON POST body;
   * anything else is the form-urlencoded POST body. apikey/secretkey stay masked as
   * "***" here — rawBody was already masked before it was ever stored, so there is no
   * unmasked version to reconstruct even if wanted.
   */
  private buildCurl(log: ApiLogDto): string {
    const url = `${environment.apiUrl || window.location.origin}${ApiEndpoints.sendText}`;
    const raw = log.rawBody ?? '';

    if (raw.startsWith('?')) {
      return `curl "${url}${raw}"`;
    }
    if (raw.trimStart().startsWith('{')) {
      return [
        `curl -X POST "${url}" \\`,
        `  -H "Content-Type: application/json" \\`,
        `  -d '${raw}'`,
      ].join('\n');
    }
    return [
      `curl -X POST "${url}" \\`,
      `  -H "Content-Type: application/x-www-form-urlencoded" \\`,
      `  -d '${raw}'`,
    ].join('\n');
  }
}

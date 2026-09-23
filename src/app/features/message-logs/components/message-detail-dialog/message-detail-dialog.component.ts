import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { ChannelTypePipe } from '../../../../shared/pipes/channel-type.pipe';
import { DispatchJobRecipientDto, ResendAttemptDto } from '../../../../core/models/dispatch-job-recipient.model';
import { ResendService } from '../../../../core/services/resend.service';

/**
 * Simplified for the merged, per-recipient Message Logs page (hotfix batch 3): the row
 * passed in already is one recipient's own record, so there is no batch left to search
 * through and no separate detail call to make — the whole modal renders from the row.
 * <p>
 * Hotfix batch 4, task 2a: resend now updates this same row in place instead of creating
 * a new one, so an earlier attempt's own outcome would otherwise be lost — a History
 * section fetches it separately, since most rows have none and it would be wasted on
 * every list load.
 */
@Component({
  selector: 'app-message-detail-dialog',
  standalone: true,
  imports: [DatePipe, MatDialogModule, MatButtonModule, MatExpansionModule, StatusBadgeComponent, ChannelTypePipe],
  templateUrl: './message-detail-dialog.component.html',
  styleUrl: './message-detail-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessageDetailDialogComponent {
  private readonly resendService = inject(ResendService);
  readonly row = inject<DispatchJobRecipientDto>(MAT_DIALOG_DATA);

  readonly attempts = signal<ResendAttemptDto[]>([]);
  readonly loadingAttempts = signal(true);

  constructor() {
    this.resendService.getAttemptHistory(this.row.id).subscribe({
      next: (attempts) => { this.attempts.set(attempts); this.loadingAttempts.set(false); },
      error: () => this.loadingAttempts.set(false),
    });
  }

  prettyResponse(raw: string | null): string {
    if (!raw) return 'Not available yet.';
    try {
      return JSON.stringify(JSON.parse(raw), null, 2);
    } catch {
      return raw;
    }
  }
}

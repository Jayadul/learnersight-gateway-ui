import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { ChannelTypePipe } from '../../../../shared/pipes/channel-type.pipe';
import { DispatchJobRecipientDto } from '../../../../core/models/dispatch-job-recipient.model';

/**
 * Simplified for the merged, per-recipient Message Logs page (hotfix batch 3): the row
 * passed in already is one recipient's own record, so there is no batch left to search
 * through and no separate detail call to make — the whole modal renders from the row.
 */
@Component({
  selector: 'app-message-detail-dialog',
  standalone: true,
  imports: [DatePipe, MatDialogModule, MatButtonModule, StatusBadgeComponent, ChannelTypePipe],
  templateUrl: './message-detail-dialog.component.html',
  styleUrl: './message-detail-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessageDetailDialogComponent {
  readonly row = inject<DispatchJobRecipientDto>(MAT_DIALOG_DATA);

  prettyResponse(raw: string | null): string {
    if (!raw) return 'Not available yet.';
    try {
      return JSON.stringify(JSON.parse(raw), null, 2);
    } catch {
      return raw;
    }
  }
}

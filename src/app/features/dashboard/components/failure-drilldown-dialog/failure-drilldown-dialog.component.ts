import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MessageLogsService } from '../../../message-logs/message-logs.service';
import { DispatchJobRecipientDto } from '../../../../core/models/dispatch-job-recipient.model';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { ChannelTypePipe } from '../../../../shared/pipes/channel-type.pipe';
import { FailureDrilldownRequest } from '../failure-reasons-chart/failure-reasons-chart.component';

/**
 * The log records behind one dashboard failure-reasons bar (hotfix batch 3, task 8) —
 * re-queries the same per-recipient Message Logs endpoint with an exact failureReason
 * match, rather than the dashboard carrying its own copy of the matching rows.
 */
@Component({
  selector: 'app-failure-drilldown-dialog',
  standalone: true,
  imports: [DatePipe, MatDialogModule, MatButtonModule, StatusBadgeComponent, ChannelTypePipe],
  templateUrl: './failure-drilldown-dialog.component.html',
  styleUrl: './failure-drilldown-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FailureDrilldownDialogComponent {
  private readonly service = inject(MessageLogsService);
  readonly data = inject<FailureDrilldownRequest>(MAT_DIALOG_DATA);

  readonly rows = signal<DispatchJobRecipientDto[]>([]);
  readonly totalCount = signal(0);
  readonly loading = signal(true);

  constructor() {
    this.service.getPaged({
      failureReason: this.data.reason,
      channelType: this.data.channelType,
      page: 1,
      pageSize: 25,
    }).subscribe({
      next: (res) => {
        this.rows.set(res.items);
        this.totalCount.set(res.totalCount);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}

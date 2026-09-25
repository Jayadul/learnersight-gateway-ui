import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { DispatchJobRecipientDto } from '../../../../core/models/dispatch-job-recipient.model';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { ChannelTypePipe } from '../../../../shared/pipes/channel-type.pipe';

/**
 * The latest ten individual sends, one line per recipient, from the same data as Message Logs
 * (hotfix batch 6). It used to list one line per request, so a batch of 900 numbers read as a
 * single entry that matched nothing on the Message Logs page.
 */
@Component({
  selector: 'app-recent-activity',
  standalone: true,
  imports: [DatePipe, MatCardModule, MatListModule, MatChipsModule, StatusBadgeComponent, ChannelTypePipe],
  templateUrl: './recent-activity.component.html',
  styleUrl: './recent-activity.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecentActivityComponent {
  readonly items = input.required<DispatchJobRecipientDto[]>();
}

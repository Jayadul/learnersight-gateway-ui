import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MessageRequestDetailDto } from '../../../../core/models/message-request.model';
import { DispatchJobDto } from '../../../../core/models/dispatch-job.model';
import { ColumnDef, DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { ChannelTypePipe } from '../../../../shared/pipes/channel-type.pipe';
import { MessageStatusPipe } from '../../../../shared/pipes/message-status.pipe';

@Component({
  selector: 'app-message-detail-drawer',
  standalone: true,
  imports: [
    DatePipe, MatIconModule, MatButtonModule, MatChipsModule, DataTableComponent,
    StatusBadgeComponent, ChannelTypePipe, MessageStatusPipe,
  ],
  templateUrl: './message-detail-drawer.component.html',
  styleUrl: './message-detail-drawer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessageDetailDrawerComponent {
  readonly detail = input<MessageRequestDetailDto | null>(null);
  readonly loading = input(false);

  readonly jobColumns: ColumnDef<DispatchJobDto>[] = [
    { key: 'channelType', header: 'Channel', value: (r) => new ChannelTypePipe().transform(r.channelType) },
    { key: 'toNumber', header: 'Number' },
    { key: 'status', header: 'Status', type: 'badge', badgeType: 'job' },
    { key: 'providerMessageId', header: 'Provider ID', value: (r) => r.providerMessageId ?? '—' },
    { key: 'sentAt', header: 'Sent At', type: 'datetime' },
    { key: 'isFallback', header: 'Fallback', type: 'custom' },
  ];
}

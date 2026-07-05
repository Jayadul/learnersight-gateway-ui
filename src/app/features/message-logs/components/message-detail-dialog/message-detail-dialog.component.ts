import { ChangeDetectionStrategy, Component, ElementRef, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MessageLogsService } from '../../message-logs.service';
import { MessageRequestDetailDto } from '../../../../core/models/message-request.model';
import { DispatchJobDto } from '../../../../core/models/dispatch-job.model';
import { ColumnDef, ColumnDefDirective, DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { ChannelTypePipe } from '../../../../shared/pipes/channel-type.pipe';
import { ChannelNamePipe } from '../../../../shared/pipes/channel-name.pipe';

@Component({
  selector: 'app-message-detail-dialog',
  standalone: true,
  imports: [
    DatePipe, MatDialogModule, MatButtonModule, MatChipsModule,
    DataTableComponent, ColumnDefDirective, StatusBadgeComponent, ChannelNamePipe,
  ],
  templateUrl: './message-detail-dialog.component.html',
  styleUrl: './message-detail-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessageDetailDialogComponent {
  private readonly service = inject(MessageLogsService);
  private readonly data = inject<{ id: string }>(MAT_DIALOG_DATA);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly detail = signal<MessageRequestDetailDto | null>(null);
  readonly loading = signal(true);

  readonly jobColumns: ColumnDef<DispatchJobDto>[] = [
    { key: 'channelType', header: 'Channel', value: (r) => new ChannelTypePipe().transform(r.channelType) },
    { key: 'toNumber', header: 'Number' },
    { key: 'status', header: 'Status', type: 'badge', badgeType: 'job' },
    { key: 'providerMessageId', header: 'Provider ID', value: (r) => r.providerMessageId ?? '—' },
    { key: 'sentAt', header: 'Sent At', type: 'datetime' },
    { key: 'isFallback', header: 'Fallback', type: 'custom' },
  ];

  constructor() {
    this.service.getDetail(this.data.id).subscribe({
      next: (d) => {
        this.detail.set(d);
        this.loading.set(false);
        // Content renders after the dialog is already open — force the view back to the top.
        setTimeout(() => this.host.nativeElement.querySelector('mat-dialog-content')?.scrollTo({ top: 0 }));
      },
      error: () => this.loading.set(false),
    });
  }
}

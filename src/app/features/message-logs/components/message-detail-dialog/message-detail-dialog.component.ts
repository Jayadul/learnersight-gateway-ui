import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MessageLogsService } from '../../message-logs.service';
import { MessageRequestDetailDto } from '../../../../core/models/message-request.model';
import { DispatchJobDto } from '../../../../core/models/dispatch-job.model';
import { ColumnDef, ColumnDefDirective, DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { ChannelTypePipe } from '../../../../shared/pipes/channel-type.pipe';
import { ChannelNamePipe } from '../../../../shared/pipes/channel-name.pipe';
import { DispatchJobRecipientDto } from '../../../../core/models/dispatch-job-recipient.model';
import { DeliveryStatus } from '../../../../core/models/enums';
import { ResendService } from '../../../../core/services/resend.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ConfirmService } from '../../../../shared/components/confirm-dialog/confirm.service';

@Component({
  selector: 'app-message-detail-dialog',
  standalone: true,
  imports: [
    DatePipe, MatDialogModule, MatButtonModule, MatChipsModule, MatIconModule,
    MatCheckboxModule, MatTooltipModule,
    DataTableComponent, ColumnDefDirective, StatusBadgeComponent, ChannelNamePipe,
    ChannelTypePipe,
  ],
  templateUrl: './message-detail-dialog.component.html',
  styleUrl: './message-detail-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessageDetailDialogComponent {
  private readonly service = inject(MessageLogsService);
  private readonly data = inject<{ id: string }>(MAT_DIALOG_DATA);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly resendService = inject(ResendService);
  private readonly notify = inject(NotificationService);
  private readonly confirm = inject(ConfirmService);

  readonly detail = signal<MessageRequestDetailDto | null>(null);
  readonly loading = signal(true);

  readonly jobColumns: ColumnDef<DispatchJobDto>[] = [
    // Name and type together: with several gateways live per type, the type alone does
    // not say which one delivered — or which one failed.
    { key: 'channelType', header: 'Channel', value: (r) => this.channelCell(r) },
    { key: 'toNumber', header: 'Number' },
    { key: 'status', header: 'Status', type: 'badge', badgeType: 'job' },
    { key: 'providerMessageId', header: 'Provider ID', value: (r) => r.providerMessageId ?? '—' },
    { key: 'sentAt', header: 'Sent At', type: 'datetime' },
    { key: 'isFallback', header: 'Fallback', type: 'custom' },
  ];

  readonly DeliveryStatus = DeliveryStatus;

  /** Recipients ticked for a resend, across every job in this request. */
  private readonly selected = signal<Set<string>>(new Set());
  readonly resending = signal(false);

  readonly selectedCount = computed(() => this.selected().size);

  /** Rows exist only for messages sent since Release 3 — older ones show job level only. */
  hasAnyRecipients(detail: MessageRequestDetailDto): boolean {
    return detail.jobs.some((j) => (j.recipients?.length ?? 0) > 0);
  }

  deliveryLabel(status: DeliveryStatus): string {
    switch (status) {
      case DeliveryStatus.Delivered: return 'Delivered';
      case DeliveryStatus.Failed: return 'Failed';
      // "Pending" reads as stuck; the provider simply has not answered yet.
      case DeliveryStatus.Pending: return 'Awaiting status';
      // Not the same as failed: the provider gave no usable answer, or offers none.
      default: return 'Unknown';
    }
  }

  /** Only a failed recipient can be resent; a delivered one must not be re-billed. */
  isResendable(row: DispatchJobRecipientDto): boolean {
    return row.deliveryStatus === DeliveryStatus.Failed;
  }

  isSelected(id: string): boolean {
    return this.selected().has(id);
  }

  toggle(id: string): void {
    this.selected.update((set) => {
      const next = new Set(set);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }

  /**
   * Resends the ticked recipients on the channel each was originally sent through.
   * Choosing a different channel is done from the dispatch log, where the whole
   * selection shares one channel; here a selection can span several.
   */
  resendSelected(): void {
    const ids = [...this.selected()];
    if (ids.length === 0) return;

    this.confirm.confirm({
      title: 'Resend failed recipients?',
      // States the count and the cost: a resend spends the client's provider credit.
      message: `${ids.length} recipient${ids.length === 1 ? '' : 's'} will be sent again `
        + 'through the same gateway that failed. Each one costs a new message.',
      confirmLabel: 'Resend',
    }).subscribe((ok) => {
      if (ok) this.doResend(ids);
    });
  }

  private doResend(ids: string[]): void {
    this.resending.set(true);
    this.resendService.resend({ recipientIds: ids }).subscribe({
      next: (result) => {
        this.resending.set(false);
        this.selected.set(new Set());
        if (result.resent > 0) {
          this.notify.success(
            `Resent ${result.resent} of ${result.requested}.`
            + (result.failed > 0 ? ` ${result.failed} failed again.` : ''));
        } else {
          this.notify.error(
            `Nothing was resent. ${result.outcomes[0]?.reason ?? 'See the delivery log.'}`);
        }
        // The retries are new rows, so the view has to come from the server again.
        this.reload();
      },
      error: () => {
        this.resending.set(false);
        this.notify.error('The resend could not be started.');
      },
    });
  }

  private reload(): void {
    this.loading.set(true);
    this.service.getDetail(this.data.id).subscribe({
      next: (d) => { this.detail.set(d); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  private channelCell(job: DispatchJobDto): string {
    const type = new ChannelTypePipe().transform(job.channelType);
    return job.channelLabel ? `${job.channelLabel} (${type})` : type;
  }

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

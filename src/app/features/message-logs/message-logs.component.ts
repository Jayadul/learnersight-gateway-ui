import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MessageLogsService } from './message-logs.service';
import { DispatchJobRecipientDto } from '../../core/models/dispatch-job-recipient.model';
import { ChannelOptionDto } from '../../core/models/channel-config.model';
import { DeliveryStatus } from '../../core/models/enums';
import { ListState } from '../../core/state/list-state';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { FilterBarComponent, FilterControl } from '../../shared/components/filter-bar/filter-bar.component';
import { ColumnDef, ColumnDefDirective, DataTableComponent, RowAction } from '../../shared/components/data-table/data-table.component';
import { MessageDetailDialogComponent } from './components/message-detail-dialog/message-detail-dialog.component';
import { ResendDialogComponent, ResendDialogResult } from './components/resend-dialog/resend-dialog.component';
import { ChannelOptionsService } from '../../core/services/channel-options.service';
import { ChannelTypePipe } from '../../shared/pipes/channel-type.pipe';
import { ResendService } from '../../core/services/resend.service';
import { NotificationService } from '../../core/services/notification.service';

type Row = DispatchJobRecipientDto;

@Component({
  selector: 'app-message-logs',
  standalone: true,
  imports: [
    MatCheckboxModule, MatButtonModule, MatIconModule,
    PageHeaderComponent, FilterBarComponent, DataTableComponent, ColumnDefDirective,
  ],
  templateUrl: './message-logs.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessageLogsComponent implements OnInit {
  private readonly service = inject(MessageLogsService);
  private readonly channelsService = inject(ChannelOptionsService);
  private readonly resendService = inject(ResendService);
  private readonly notify = inject(NotificationService);
  private readonly dialog = inject(MatDialog);

  readonly state = new ListState<Row>((p) => this.service.getPaged(p), 'createdAt');

  /**
   * A signal because the gateway options arrive from the API. The keys never change, so
   * the filter bar's form — built once from those keys — stays valid when the array is
   * replaced with the loaded options.
   */
  readonly filters = signal<FilterControl[]>(this.buildFilters([]));

  readonly columns: ColumnDef<Row>[] = [
    { key: 'select', header: '', type: 'custom', width: '44px' },
    // Position within the current page, not an id — a plain row counter to refer to.
    { key: 'serial', header: '#', width: '56px', value: (r) => this.serialOf(r) },
    { key: 'recipient', header: 'Recipient' },
    { key: 'channel', header: 'Channel', value: (r) => this.channelCell(r) },
    // Truncated in the cell; the shared table shows the rest on hover.
    { key: 'messageContent', header: 'Content', truncate: 60 },
    { key: 'deliveryStatus', header: 'Status', type: 'badge', badgeType: 'delivery' },
    { key: 'sentAt', header: 'Sent At', type: 'datetime', sortable: true },
  ];

  readonly rowActions: RowAction<Row>[] = [
    { action: 'view', icon: 'visibility', tooltip: 'View details', color: 'primary' },
  ];

  /** Recipients ticked for a resend. Only Failed/Fallback rows offer the checkbox. */
  private readonly selected = signal<Set<string>>(new Set());
  readonly resending = signal(false);
  readonly selectedCount = computed(() => this.selected().size);

  /** 1-based within the page, continuing the count across pages. */
  private serialOf(row: Row): number {
    return this.state.pageIndex() * this.state.pageSize()
         + this.state.data().indexOf(row) + 1;
  }

  private channelCell(row: Row): string {
    const type = new ChannelTypePipe().transform(row.channelType);
    return row.channelLabel ? `${row.channelLabel} (${type})` : type;
  }

  private buildFilters(channels: ChannelOptionDto[]): FilterControl[] {
    return [
      { kind: 'dateRange', keyFrom: 'dateFrom', keyTo: 'dateTo', label: 'Date Range' },
      { kind: 'text', key: 'recipient', label: 'Phone', placeholder: '8801700000001' },
      {
        kind: 'select', key: 'deliveryStatus', label: 'Status',
        options: [
          { label: 'All', value: null },
          { label: 'In Progress', value: DeliveryStatus.Pending },
          { label: 'Delivered', value: DeliveryStatus.Delivered },
          { label: 'Failed', value: DeliveryStatus.Failed },
          { label: 'Delivered (Backup Channel)', value: DeliveryStatus.Fallback },
          { label: 'Status Unknown', value: DeliveryStatus.Unknown },
        ],
      },
      {
        // By gateway rather than by type: with several gateways live per type, "WhatsApp"
        // no longer identifies where a message actually went.
        kind: 'select', key: 'channelConfigId', label: 'Gateway',
        options: [
          { label: 'All', value: null },
          ...channels.map((c) => ({
            label: `${c.label} (${new ChannelTypePipe().transform(c.channelType)})`,
            value: c.id,
          })),
        ],
      },
    ];
  }

  constructor() {
    // Inactive gateways included: they may still appear in historical messages.
    this.channelsService.getAll().subscribe((all) => this.filters.set(this.buildFilters(all)));
  }

  ngOnInit(): void {
    this.state.load();
  }

  onAction(e: { action: string; row: Row }): void {
    if (e.action === 'view') {
      this.openDetail(e.row);
    }
  }

  openDetail(row: Row): void {
    // autoFocus 'dialog': keep focus on the container so the browser doesn't
    // scroll the Close button (bottom) into view when the dialog opens.
    this.dialog.open(MessageDetailDialogComponent, {
      data: row, width: '880px', maxWidth: '95vw', autoFocus: 'dialog',
    });
  }

  /** Only a failed or fallback-rescued recipient can be resent. */
  isResendable(row: Row): boolean {
    return row.deliveryStatus === DeliveryStatus.Failed
        || row.deliveryStatus === DeliveryStatus.Fallback;
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

  resendSelected(): void {
    const ids = [...this.selected()];
    if (ids.length === 0) return;

    const selectedRows = this.state.data().filter((r) => ids.includes(r.id));
    this.dialog.open<ResendDialogComponent, unknown, ResendDialogResult>(ResendDialogComponent, {
      data: { recipients: selectedRows }, width: '480px', maxWidth: '95vw',
    }).afterClosed().subscribe((result) => {
      if (result) this.doResend(ids, result.channelConfigId);
    });
  }

  private doResend(ids: string[], channelConfigId?: string): void {
    this.resending.set(true);
    this.resendService.resend({ recipientIds: ids, channelConfigId }).subscribe({
      next: (result) => {
        this.resending.set(false);
        this.selected.set(new Set());
        if (result.resent > 0) {
          this.notify.success(
            `Resent ${result.resent} of ${result.requested}.`
            + (result.failed > 0 ? ` ${result.failed} failed again.` : ''));
        } else {
          this.notify.error(
            `Nothing was resent. ${result.outcomes[0]?.reason ?? 'See the log for details.'}`);
        }
        // Rows are updated in place, not replaced, but the new channel/status/content
        // still has to come from the server.
        this.state.load();
      },
      error: () => {
        this.resending.set(false);
        this.notify.error('The resend could not be started.');
      },
    });
  }
}

import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MessageLogsService } from './message-logs.service';
import { MessageRequestDto } from '../../core/models/message-request.model';
import { ChannelConfigDto } from '../../core/models/channel-config.model';
import { MessageStatus } from '../../core/models/enums';
import { ListState } from '../../core/state/list-state';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { FilterBarComponent, FilterControl } from '../../shared/components/filter-bar/filter-bar.component';
import { ColumnDef, DataTableComponent, RowAction } from '../../shared/components/data-table/data-table.component';
import { MessageDetailDialogComponent } from './components/message-detail-dialog/message-detail-dialog.component';
import { channelNameLabel } from '../../shared/pipes/channel-name.pipe';
import { ChannelConfigsService } from '../channel-configs/channel-configs.service';
import { ChannelTypePipe } from '../../shared/pipes/channel-type.pipe';

type Row = MessageRequestDto;

@Component({
  selector: 'app-message-logs',
  standalone: true,
  imports: [PageHeaderComponent, FilterBarComponent, DataTableComponent],
  templateUrl: './message-logs.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessageLogsComponent implements OnInit {
  private readonly service = inject(MessageLogsService);
  private readonly channelsService = inject(ChannelConfigsService);
  private readonly dialog = inject(MatDialog);

  readonly state = new ListState<Row>((p) => this.service.getPaged(p), 'receivedAt');

  /**
   * A signal because the gateway options arrive from the API. The keys never change, so
   * the filter bar's form — built once from those keys — stays valid when the array is
   * replaced with the loaded options.
   */
  readonly filters = signal<FilterControl[]>(this.buildFilters([]));

  readonly columns: ColumnDef<Row>[] = [
    // Position within the current page, not an id — a plain row counter to refer to.
    { key: 'serial', header: '#', width: '56px', value: (r) => this.serialOf(r) },
    { key: 'receivedAt', header: 'Time', type: 'datetime', sortable: true },
    { key: 'toUser', header: 'To' },
    { key: 'parsedChannels', header: 'Channels', type: 'chips', value: (r) => r.parsedChannels.map(channelNameLabel) },
    // Truncated in the cell; the shared table shows the rest on hover.
    { key: 'rawMessageContent', header: 'Content', truncate: 60 },
    { key: 'overallStatus', header: 'Status', type: 'badge', badgeType: 'message' },
  ];

  /** 1-based within the page, continuing the count across pages. */
  private serialOf(row: Row): number {
    return this.state.pageIndex() * this.state.pageSize()
         + this.state.data().indexOf(row) + 1;
  }

  private buildFilters(channels: ChannelConfigDto[]): FilterControl[] {
    return [
      { kind: 'dateRange', keyFrom: 'dateFrom', keyTo: 'dateTo', label: 'Date Range' },
      { kind: 'text', key: 'toUser', label: 'Phone', placeholder: '8801700000001' },
      {
        kind: 'select', key: 'status', label: 'Status',
        options: [
          { label: 'All', value: null },
          { label: 'Pending', value: MessageStatus.Pending },
          { label: 'Partial Success', value: MessageStatus.PartialSuccess },
          { label: 'Success', value: MessageStatus.Success },
          { label: 'Failed', value: MessageStatus.Failed },
          { label: 'Delivered via Fallback', value: MessageStatus.Fallback },
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

  readonly rowActions: RowAction<Row>[] = [
    { action: 'view', icon: 'visibility', tooltip: 'View details', color: 'primary' },
  ];

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
      data: { id: row.id }, width: '880px', maxWidth: '95vw', autoFocus: 'dialog',
    });
  }
}

import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MessageLogsService } from './message-logs.service';
import { MessageRequestDto } from '../../core/models/message-request.model';
import { MessageStatus } from '../../core/models/enums';
import { ListState } from '../../core/state/list-state';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { FilterBarComponent, FilterControl } from '../../shared/components/filter-bar/filter-bar.component';
import { ColumnDef, DataTableComponent, RowAction } from '../../shared/components/data-table/data-table.component';
import { MessageDetailDialogComponent } from './components/message-detail-dialog/message-detail-dialog.component';
import { channelNameLabel } from '../../shared/pipes/channel-name.pipe';

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
  private readonly dialog = inject(MatDialog);

  readonly state = new ListState<Row>((p) => this.service.getPaged(p), 'receivedAt');

  readonly filters: FilterControl[] = [
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
      ],
    },
  ];

  readonly columns: ColumnDef<Row>[] = [
    { key: 'receivedAt', header: 'Time', type: 'datetime', sortable: true },
    { key: 'toUser', header: 'To' },
    { key: 'parsedChannels', header: 'Channels', type: 'chips', value: (r) => r.parsedChannels.map(channelNameLabel) },
    { key: 'overallStatus', header: 'Status', type: 'badge', badgeType: 'message' },
  ];

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
    this.dialog.open(MessageDetailDialogComponent, { data: { id: row.id }, width: '880px', maxWidth: '95vw' });
  }
}

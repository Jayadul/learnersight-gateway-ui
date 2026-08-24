import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { ApiLogsService } from './api-logs.service';
import { ApiLogDto } from '../../core/models/api-log.model';
import { ListState } from '../../core/state/list-state';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { FilterBarComponent, FilterControl } from '../../shared/components/filter-bar/filter-bar.component';
import { ColumnDef, DataTableComponent, RowAction } from '../../shared/components/data-table/data-table.component';
import { LogDetailDialogComponent } from './components/log-detail-dialog/log-detail-dialog.component';
import { channelNameLabel } from '../../shared/pipes/channel-name.pipe';

type Row = ApiLogDto;

@Component({
  selector: 'app-api-logs',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, PageHeaderComponent, FilterBarComponent, DataTableComponent],
  templateUrl: './api-logs.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApiLogsComponent implements OnInit {
  private readonly service = inject(ApiLogsService);
  private readonly dialog = inject(MatDialog);
  readonly state = new ListState<Row>((p) => this.service.getPaged(p), 'requestedAt');

  readonly filters: FilterControl[] = [
    { kind: 'dateRange', keyFrom: 'dateFrom', keyTo: 'dateTo', label: 'Date Range' },
    {
      kind: 'select', key: 'responseStatus', label: 'HTTP Status',
      options: [
        { label: 'All', value: null },
        { label: '200 OK', value: 200 },
        { label: '400 Bad Request', value: 400 },
        { label: '401 Unauthorized', value: 401 },
        { label: '500 Server Error', value: 500 },
      ],
    },
    {
      // Filters the snapshot of what the request asked for. A request naming several
      // channels matches each of them.
      kind: 'select', key: 'channel', label: 'Channel',
      options: [
        { label: 'All', value: null },
        { label: 'SMS', value: 'SMS' },
        { label: 'WhatsApp', value: 'WP' },
        { label: 'Voice', value: 'Voice' },
      ],
    },
    { kind: 'text', key: 'callerIp', label: 'Caller IP', placeholder: '192.168.1.1' },
  ];

  readonly columns: ColumnDef<Row>[] = [
    { key: 'requestedAt', header: 'Time', type: 'datetime', sortable: true },
    { key: 'toUser', header: 'To', value: (r) => r.toUser ?? '—' },
    // What the tags asked for. Blank when the request was rejected before parsing.
    { key: 'requestedChannels', header: 'Channels', value: (r) => this.channelsCell(r) },
    { key: 'responseStatus', header: 'Status', type: 'chip' },
    { key: 'durationMs', header: 'Duration (ms)', sortable: true },
    { key: 'callerIp', header: 'Caller IP' },
  ];

  readonly rowActions: RowAction<Row>[] = [
    { action: 'view', icon: 'visibility', tooltip: 'View details', color: 'primary' },
  ];

  private channelsCell(row: Row): string {
    if (!row.requestedChannels) return '—';
    return row.requestedChannels
      .split(',')
      .map((c) => channelNameLabel(c.trim()))
      .join(', ');
  }

  ngOnInit(): void {
    this.state.load();
  }

  onAction(e: { action: string; row: Row }): void {
    if (e.action === 'view') {
      this.dialog.open(LogDetailDialogComponent, { data: e.row, width: '880px', maxWidth: '95vw' });
    }
  }
}

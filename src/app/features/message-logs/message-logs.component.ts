import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MessageLogsService } from './message-logs.service';
import { MessageRequestDetailDto, MessageRequestDto } from '../../core/models/message-request.model';
import { MessageStatus } from '../../core/models/enums';
import { ListState } from '../../core/state/list-state';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { FilterBarComponent, FilterControl } from '../../shared/components/filter-bar/filter-bar.component';
import { ColumnDef, DataTableComponent, RowAction } from '../../shared/components/data-table/data-table.component';
import { MessageDetailDrawerComponent } from './components/message-detail-drawer/message-detail-drawer.component';

type Row = MessageRequestDto;

@Component({
  selector: 'app-message-logs',
  standalone: true,
  imports: [
    MatSidenavModule, PageHeaderComponent, FilterBarComponent, DataTableComponent, MessageDetailDrawerComponent,
  ],
  templateUrl: './message-logs.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessageLogsComponent implements OnInit {
  private readonly service = inject(MessageLogsService);

  readonly state = new ListState<Row>((p) => this.service.getPaged(p), 'receivedAt');

  readonly drawerOpen = signal(false);
  readonly selectedDetail = signal<MessageRequestDetailDto | null>(null);
  readonly detailLoading = signal(false);

  readonly filters: FilterControl[] = [
    { kind: 'dateRange', keyFrom: 'dateFrom', keyTo: 'dateTo', label: 'Date range' },
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
    { key: 'parsedChannels', header: 'Channels', type: 'chips' },
    { key: 'overallStatus', header: 'Status', type: 'badge', badgeType: 'message' },
  ];

  readonly rowActions: RowAction<Row>[] = [
    { action: 'view', icon: 'visibility', tooltip: 'View detail', color: 'primary' },
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
    this.drawerOpen.set(true);
    this.detailLoading.set(true);
    this.selectedDetail.set(null);
    this.service.getDetail(row.id).subscribe({
      next: (d) => {
        this.selectedDetail.set(d);
        this.detailLoading.set(false);
      },
      error: () => this.detailLoading.set(false),
    });
  }
}

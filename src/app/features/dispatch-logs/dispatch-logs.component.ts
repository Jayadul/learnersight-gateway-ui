import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { DispatchLogsService } from './dispatch-logs.service';
import { DispatchJobDto } from '../../core/models/dispatch-job.model';
import { ChannelType, JobStatus } from '../../core/models/enums';
import { ListState } from '../../core/state/list-state';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { FilterBarComponent, FilterControl } from '../../shared/components/filter-bar/filter-bar.component';
import { ColumnDef, ColumnDefDirective, DataTableComponent } from '../../shared/components/data-table/data-table.component';
import { ChannelTypePipe } from '../../shared/pipes/channel-type.pipe';

type Row = DispatchJobDto;

@Component({
  selector: 'app-dispatch-logs',
  standalone: true,
  imports: [MatChipsModule, PageHeaderComponent, FilterBarComponent, DataTableComponent, ColumnDefDirective],
  templateUrl: './dispatch-logs.component.html',
  styleUrl: './dispatch-logs.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DispatchLogsComponent implements OnInit {
  private readonly service = inject(DispatchLogsService);
  readonly state = new ListState<Row>((p) => this.service.getPaged(p), 'createdAt');

  readonly filters: FilterControl[] = [
    { kind: 'dateRange', keyFrom: 'dateFrom', keyTo: 'dateTo', label: 'Date Range' },
    {
      kind: 'select', key: 'channelType', label: 'Channel',
      options: [
        { label: 'All', value: null },
        { label: 'SMS', value: ChannelType.SMS },
        { label: 'WhatsApp', value: ChannelType.WP },
        { label: 'Voice', value: ChannelType.Voice },
      ],
    },
    {
      kind: 'select', key: 'status', label: 'Status',
      options: [
        { label: 'All', value: null },
        { label: 'Pending', value: JobStatus.Pending },
        { label: 'Sent', value: JobStatus.Sent },
        { label: 'Failed', value: JobStatus.Failed },
      ],
    },
    { kind: 'text', key: 'toNumber', label: 'Number', placeholder: '8801700000001' },
  ];

  readonly columns: ColumnDef<Row>[] = [
    { key: 'createdAt', header: 'Time', type: 'datetime', sortable: true },
    { key: 'channelType', header: 'Channel', value: (r) => new ChannelTypePipe().transform(r.channelType) },
    // Which gateway, not just which kind — several of a type may be active at once.
    { key: 'channelLabel', header: 'Sent Via', value: (r) => r.channelLabel ?? '—' },
    { key: 'toNumber', header: 'Number' },
    { key: 'status', header: 'Status', type: 'badge', badgeType: 'job' },
    // Truncated in the cell, full reply on hover — provider errors are the one thing
    // worth reading in full here, and they run long.
    { key: 'providerRawResponse', header: 'Provider Reply', truncate: 60, value: (r) => r.providerRawResponse ?? '—' },
    { key: 'failureReason', header: 'Failure Reason', truncate: 40, value: (r) => r.failureReason ?? '—' },
    { key: 'isFallback', header: 'Fallback', type: 'custom', width: '90px' },
    { key: 'sentAt', header: 'Sent At', type: 'datetime' },
  ];

  ngOnInit(): void {
    this.state.load();
  }
}

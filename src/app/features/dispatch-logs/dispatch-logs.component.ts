import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { DispatchLogsService } from './dispatch-logs.service';
import { DispatchJobDto } from '../../core/models/dispatch-job.model';
import { ChannelType, JobStatus } from '../../core/models/enums';
import { ListState } from '../../core/state/list-state';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { FilterBarComponent, FilterControl } from '../../shared/components/filter-bar/filter-bar.component';
import { ColumnDef, DataTableComponent } from '../../shared/components/data-table/data-table.component';
import { ChannelTypePipe } from '../../shared/pipes/channel-type.pipe';

type Row = DispatchJobDto;

@Component({
  selector: 'app-dispatch-logs',
  standalone: true,
  imports: [MatChipsModule, PageHeaderComponent, FilterBarComponent, DataTableComponent],
  templateUrl: './dispatch-logs.component.html',
  styleUrl: './dispatch-logs.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DispatchLogsComponent implements OnInit {
  private readonly service = inject(DispatchLogsService);
  readonly state = new ListState<Row>((p) => this.service.getPaged(p), 'createdAt');

  readonly filters: FilterControl[] = [
    { kind: 'dateRange', keyFrom: 'dateFrom', keyTo: 'dateTo', label: 'Date range' },
    {
      kind: 'select', key: 'channelType', label: 'Channel',
      options: [
        { label: 'All', value: null },
        { label: 'SMS', value: ChannelType.SMS },
        { label: 'WhatsApp Text', value: ChannelType.WP_Text },
        { label: 'WhatsApp Media', value: ChannelType.WP_Media },
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
    { key: 'toNumber', header: 'Number' },
    { key: 'status', header: 'Status', type: 'badge', badgeType: 'job' },
    { key: 'providerRawResponse', header: 'Provider Response', truncate: 60, value: (r) => r.providerRawResponse ?? '—' },
    { key: 'isFallback', header: 'Fallback', type: 'custom', width: '90px' },
    { key: 'sentAt', header: 'Sent At', type: 'datetime' },
  ];

  ngOnInit(): void {
    this.state.load();
  }
}

import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { NgApexchartsModule } from 'ng-apexcharts';
import type { ApexAxisChartSeries, ApexChart, ApexXAxis, ApexDataLabels, ApexLegend, ApexPlotOptions } from 'ng-apexcharts';
import { ChannelBreakdownDto } from '../../../../core/models/dashboard.model';

@Component({
  selector: 'app-channel-breakdown-chart',
  standalone: true,
  imports: [MatCardModule, NgApexchartsModule],
  templateUrl: './channel-breakdown-chart.component.html',
  styleUrl: './channel-breakdown-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChannelBreakdownChartComponent {
  readonly breakdown = input.required<ChannelBreakdownDto[]>();

  readonly series = computed<ApexAxisChartSeries>(() => [
    { name: 'Sent', data: this.breakdown().map((b) => b.sentCount) },
    { name: 'Failed', data: this.breakdown().map((b) => b.failedCount) },
  ]);
  readonly chart: ApexChart = { type: 'bar', height: 300, stacked: true, toolbar: { show: false }, fontFamily: 'Roboto, sans-serif' };
  readonly plotOptions: ApexPlotOptions = { bar: { horizontal: false, columnWidth: '45%', borderRadius: 4 } };
  readonly dataLabels: ApexDataLabels = { enabled: false };
  readonly legend: ApexLegend = { position: 'top' };
  readonly colors = ['#16a34a', '#dc2626'];
  readonly xaxis = computed<ApexXAxis>(() => ({ categories: this.breakdown().map((b) => b.channelType) }));
}

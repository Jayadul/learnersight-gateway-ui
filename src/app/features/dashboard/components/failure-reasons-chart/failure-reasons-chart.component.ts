import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { NgApexchartsModule } from 'ng-apexcharts';
import type { ApexAxisChartSeries, ApexChart, ApexXAxis, ApexDataLabels, ApexPlotOptions } from 'ng-apexcharts';
import { FailureReasonDto } from '../../../../core/models/dashboard.model';

@Component({
  selector: 'app-failure-reasons-chart',
  standalone: true,
  imports: [MatCardModule, NgApexchartsModule],
  templateUrl: './failure-reasons-chart.component.html',
  styleUrl: './failure-reasons-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FailureReasonsChartComponent {
  readonly reasons = input.required<FailureReasonDto[]>();

  readonly series = computed<ApexAxisChartSeries>(() => [
    { name: 'Failures', data: this.reasons().map((r) => r.count) },
  ]);
  readonly chart: ApexChart = { type: 'bar', height: 300, toolbar: { show: false }, fontFamily: 'Roboto, sans-serif' };
  readonly plotOptions: ApexPlotOptions = { bar: { horizontal: true, borderRadius: 4 } };
  readonly dataLabels: ApexDataLabels = { enabled: true };
  readonly colors = ['#dc2626'];
  readonly xaxis = computed<ApexXAxis>(() => ({ categories: this.reasons().map((r) => r.reason) }));
}

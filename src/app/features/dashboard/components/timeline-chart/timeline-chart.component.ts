import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { NgApexchartsModule } from 'ng-apexcharts';
import type { ApexAxisChartSeries, ApexChart, ApexXAxis, ApexDataLabels, ApexStroke, ApexFill } from 'ng-apexcharts';
import { TimelinePointDto } from '../../../../core/models/dashboard.model';

@Component({
  selector: 'app-timeline-chart',
  standalone: true,
  imports: [MatCardModule, NgApexchartsModule],
  templateUrl: './timeline-chart.component.html',
  styleUrl: './timeline-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimelineChartComponent {
  readonly points = input.required<TimelinePointDto[]>();

  readonly series = computed<ApexAxisChartSeries>(() => [
    { name: 'Messages', data: this.points().map((p) => p.count) },
  ]);
  readonly chart: ApexChart = { type: 'area', height: 300, toolbar: { show: false }, fontFamily: 'Roboto, sans-serif' };
  readonly dataLabels: ApexDataLabels = { enabled: false };
  readonly stroke: ApexStroke = { curve: 'smooth', width: 3 };
  readonly fill: ApexFill = { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05 } };
  readonly colors = ['#2563eb'];
  readonly xaxis = computed<ApexXAxis>(() => ({
    categories: this.points().map((p) => new Date(p.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })),
  }));
}

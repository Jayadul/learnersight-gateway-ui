import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { forkJoin, interval } from 'rxjs';
import { DashboardService } from './dashboard.service';
import { MessageLogsService } from '../message-logs/message-logs.service';
import {
  ChannelBreakdownDto, DashboardSummaryDto, FailureReasonDto, TimelinePointDto,
} from '../../core/models/dashboard.model';
import { MessageRequestDto } from '../../core/models/message-request.model';
import { ChannelBalanceDto } from '../../core/models/channel-balance.model';
import { ChannelBalancesService } from '../../core/services/channel-balances.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { SummaryCardsComponent } from './components/summary-cards/summary-cards.component';
import { TimelineChartComponent } from './components/timeline-chart/timeline-chart.component';
import { ChannelBreakdownChartComponent } from './components/channel-breakdown-chart/channel-breakdown-chart.component';
import { FailureReasonsChartComponent } from './components/failure-reasons-chart/failure-reasons-chart.component';
import { RecentActivityComponent } from './components/recent-activity/recent-activity.component';
import { ChannelBalancesComponent } from './components/channel-balances/channel-balances.component';

const REFRESH_INTERVAL = 15 * 60; // seconds — auto-refresh every 15 minutes

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    MatButtonModule, MatIconModule, MatTooltipModule,
    PageHeaderComponent, SummaryCardsComponent, TimelineChartComponent,
    ChannelBreakdownChartComponent, FailureReasonsChartComponent, RecentActivityComponent,
    ChannelBalancesComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  private readonly messageLogsService = inject(MessageLogsService);
  private readonly balancesService = inject(ChannelBalancesService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly summary = signal<DashboardSummaryDto | null>(null);
  readonly skeletonCardCount = Array.from({ length: 7 }, (_, i) => i);
  readonly timeline = signal<TimelinePointDto[]>([]);
  readonly breakdown = signal<ChannelBreakdownDto[]>([]);
  readonly failureReasons = signal<FailureReasonDto[]>([]);
  readonly recent = signal<MessageRequestDto[]>([]);
  readonly balances = signal<ChannelBalanceDto[]>([]);
  readonly countdown = signal(REFRESH_INTERVAL);
  readonly countdownLabel = computed(() => {
    const s = this.countdown();
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  });

  refreshNow(): void {
    this.countdown.set(REFRESH_INTERVAL);
    this.fetchAll();
  }

  ngOnInit(): void {
    this.fetchAll();

    interval(1000).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      const next = this.countdown() - 1;
      if (next <= 0) {
        this.countdown.set(REFRESH_INTERVAL);
        this.fetchAll();
      } else {
        this.countdown.set(next);
      }
    });
  }

  private fetchAll(): void {
    this.loading.set(true);
    forkJoin({
      summary: this.dashboardService.getSummary(),
      timeline: this.dashboardService.getTimeline(7),
      breakdown: this.dashboardService.getChannelBreakdown(),
      failureReasons: this.dashboardService.getFailureReasons(5),
      recent: this.messageLogsService.getPaged({ page: 1, pageSize: 10, sortBy: 'receivedAt', sortDir: 'desc' }),
      // Cached figures only — this read never calls a provider, so a slow vendor
      // cannot hold up the dashboard. A background job keeps them current.
      balances: this.balancesService.getAll(),
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.summary.set(res.summary);
        this.timeline.set(res.timeline);
        this.breakdown.set(res.breakdown);
        this.failureReasons.set(res.failureReasons);
        this.recent.set(res.recent.items);
        this.balances.set(res.balances);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}

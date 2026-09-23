import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FailureReasonDto } from '../../../../core/models/dashboard.model';
import { channelNameLabel } from '../../../../shared/pipes/channel-name.pipe';
import { ChannelType } from '../../../../core/models/enums';

export interface FailureDrilldownRequest {
  readonly reason: string;
  /** Set when a specific channel pill was clicked rather than the row itself. */
  readonly channelType?: ChannelType;
}

@Component({
  selector: 'app-failure-reasons-chart',
  standalone: true,
  imports: [MatCardModule, MatTooltipModule],
  templateUrl: './failure-reasons-chart.component.html',
  styleUrl: './failure-reasons-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FailureReasonsChartComponent {
  readonly reasons = input.required<FailureReasonDto[]>();
  /** Drill into the log records behind one reason (optionally narrowed to one channel). */
  readonly drilldown = output<FailureDrilldownRequest>();

  /**
   * A ranked list rather than a bar chart. Failure reasons are raw provider messages —
   * long, and unreadable as axis labels — and each one now carries a per-channel split,
   * which a single bar cannot show. The bar is drawn as a width so the ranking still
   * reads at a glance.
   */
  readonly rows = computed(() => {
    const worst = Math.max(...this.reasons().map((r) => r.count), 1);

    return this.reasons().map((r) => ({
      reason: r.reason,
      count: r.count,
      widthPercent: (r.count / worst) * 100,
      channels: r.byChannel.map((c) => ({
        // The gateway name when there is one: with several live per type, "WhatsApp"
        // alone does not say which provider is failing.
        label: c.channelLabel ?? channelNameLabel(c.channelType),
        type: channelNameLabel(c.channelType),
        // Backend serializes ChannelType as its enum NAME here ("SMS", "WP", "Voice"),
        // unlike the numeric wire format used everywhere else — converted back for the
        // drill-down query, which filters on the numeric ChannelType like every other page.
        channelType: ChannelType[c.channelType as keyof typeof ChannelType] as ChannelType | undefined,
        count: c.count,
      })),
    }));
  });

  onReasonClick(reason: string): void {
    this.drilldown.emit({ reason });
  }

  onChannelClick(event: MouseEvent, reason: string, channelType: ChannelType | undefined): void {
    event.stopPropagation();
    this.drilldown.emit({ reason, channelType });
  }
}

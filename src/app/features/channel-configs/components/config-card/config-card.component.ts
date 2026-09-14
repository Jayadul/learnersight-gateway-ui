import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ChannelConfigDto } from '../../../../core/models/channel-config.model';
import { ChannelBalanceDto } from '../../../../core/models/channel-balance.model';
import { ChannelType } from '../../../../core/models/enums';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-config-card',
  standalone: true,
  imports: [
    DatePipe, DecimalPipe, MatCardModule, MatButtonModule, MatIconModule, MatChipsModule,
    MatTooltipModule, StatusBadgeComponent,
  ],
  templateUrl: './config-card.component.html',
  styleUrl: './config-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfigCardComponent {
  readonly config = input.required<ChannelConfigDto>();
  /** Null for a provider that reports no balance — Voice and WaTrend have none. */
  readonly balance = input<ChannelBalanceDto | null>(null);
  readonly edit = output<ChannelConfigDto>();
  readonly activate = output<ChannelConfigDto>();
  readonly deactivate = output<ChannelConfigDto>();
  readonly setDefault = output<ChannelConfigDto>();
  readonly delete = output<ChannelConfigDto>();
  readonly syncStatus = output<ChannelConfigDto>();

  /**
   * Whether this channel's provider offers a delivery status lookup. A provider can
   * accept messages and report a balance while having no status endpoint, so the action
   * is hidden rather than shown and then refused.
   */
  readonly canSyncStatus = input(false);

  /** Shows the exact tag that routes to this channel, so the slug is self-explanatory. */
  readonly tagExample = computed(() => {
    const prefix =
      this.config().channelType === ChannelType.SMS ? 'sms'
      : this.config().channelType === ChannelType.WP ? 'wp'
      : 'call';
    // Voice tags carry a campaign id, not message text — showing "your message" there
    // would document a payload the provider never reads.
    const body = prefix === 'call' ? 'your-campaign-id' : 'your message';
    return `Send to this channel with [${prefix}:${this.config().labelSlug}::${body}]`;
  });

  /** A figure exists to show, whether or not the last refresh succeeded. */
  readonly hasBalance = computed(() => this.balance()?.available != null);
}

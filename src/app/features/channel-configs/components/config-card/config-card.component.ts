import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ChannelConfigDto } from '../../../../core/models/channel-config.model';
import { ChannelType } from '../../../../core/models/enums';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-config-card',
  standalone: true,
  imports: [
    DatePipe, MatCardModule, MatButtonModule, MatIconModule, MatChipsModule,
    MatTooltipModule, StatusBadgeComponent,
  ],
  templateUrl: './config-card.component.html',
  styleUrl: './config-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfigCardComponent {
  readonly config = input.required<ChannelConfigDto>();
  readonly edit = output<ChannelConfigDto>();
  readonly activate = output<ChannelConfigDto>();
  readonly deactivate = output<ChannelConfigDto>();
  readonly setDefault = output<ChannelConfigDto>();
  readonly delete = output<ChannelConfigDto>();

  /** Shows the exact tag that routes to this channel, so the slug is self-explanatory. */
  readonly tagExample = computed(() => {
    const prefix =
      this.config().channelType === ChannelType.SMS ? 'sms'
      : this.config().channelType === ChannelType.WP ? 'wp'
      : 'call';
    return `Send to this channel with [${prefix}_label:${this.config().labelSlug}::your message]`;
  });
}

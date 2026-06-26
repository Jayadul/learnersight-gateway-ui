import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { ChannelConfigDto } from '../../../../core/models/channel-config.model';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-config-card',
  standalone: true,
  imports: [DatePipe, MatCardModule, MatButtonModule, MatIconModule, MatChipsModule, StatusBadgeComponent],
  templateUrl: './config-card.component.html',
  styleUrl: './config-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfigCardComponent {
  readonly config = input.required<ChannelConfigDto>();
  readonly edit = output<ChannelConfigDto>();
  readonly activate = output<ChannelConfigDto>();
  readonly delete = output<ChannelConfigDto>();
}

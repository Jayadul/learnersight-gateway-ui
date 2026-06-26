import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MessageRequestDto } from '../../../../core/models/message-request.model';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-recent-activity',
  standalone: true,
  imports: [DatePipe, MatCardModule, MatListModule, MatChipsModule, StatusBadgeComponent],
  templateUrl: './recent-activity.component.html',
  styleUrl: './recent-activity.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecentActivityComponent {
  readonly items = input.required<MessageRequestDto[]>();
}

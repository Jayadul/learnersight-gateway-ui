import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { DashboardSummaryDto } from '../../../../core/models/dashboard.model';

interface Card { label: string; value: string | number; icon: string; accent: string; }

@Component({
  selector: 'app-summary-cards',
  standalone: true,
  imports: [MatCardModule, MatIconModule],
  templateUrl: './summary-cards.component.html',
  styleUrl: './summary-cards.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SummaryCardsComponent {
  readonly summary = input.required<DashboardSummaryDto>();

  readonly cards = computed<Card[]>(() => {
    const s = this.summary();
    return [
      { label: "Today's Requests", value: s.totalToday, icon: 'today', accent: '#2563eb' },
      { label: 'This Week', value: s.totalWeek, icon: 'date_range', accent: '#0891b2' },
      { label: 'SMS Sent', value: s.smsSentToday, icon: 'sms', accent: '#16a34a' },
      { label: 'WP Sent', value: s.wpSentToday, icon: 'chat', accent: '#22c55e' },
      { label: 'Voice Sent', value: s.voiceSentToday, icon: 'call', accent: '#8b5cf6' },
      { label: 'Failed Today', value: s.failedToday, icon: 'error_outline', accent: '#dc2626' },
      { label: 'Success Rate', value: s.successRatePercent + '%', icon: 'trending_up', accent: '#16a34a' },
    ];
  });
}

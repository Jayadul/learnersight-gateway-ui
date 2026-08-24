import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { JobStatus, MessageStatus } from '../../../core/models/enums';
import { MessageStatusPipe } from '../../pipes/message-status.pipe';

type BadgeType = 'message' | 'job' | 'call';
type BadgeColor = 'green' | 'red' | 'orange' | 'amber' | 'grey';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [MatChipsModule],
  template: `<mat-chip class="badge badge-{{ color() }}" [disableRipple]="true">{{ label() }}</mat-chip>`,
  styleUrl: './status-badge.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusBadgeComponent {
  readonly status = input.required<string | number>();
  readonly type = input<BadgeType>('message');

  readonly label = computed<string>(() => {
    const s = this.status();
    const t = this.type();
    if (typeof s === 'string') {
      return s;
    }
    if (t === 'job') {
      return JobStatus[s] ?? 'Unknown';
    }
    // The pipe owns the wording, so the badge cannot drift from the rest of the UI —
    // the raw enum name renders as "PartialSuccess", one word.
    return new MessageStatusPipe().transform(s);
  });

  readonly color = computed<BadgeColor>(() => {
    const s = this.status();
    const t = this.type();

    if (typeof s === 'string') {
      const upper = s.toUpperCase();
      if (t === 'call') {
        return upper === 'CALL SUCCESS' ? 'green' : 'red';
      }
      if (upper.includes('SUCCESS') || upper === 'SENT') return 'green';
      if (upper.includes('FAIL')) return 'red';
      if (upper.includes('PENDING')) return 'orange';
      if (upper.includes('PARTIAL')) return 'amber';
      return 'grey';
    }

    if (t === 'job') {
      switch (s as JobStatus) {
        case JobStatus.Sent: return 'green';
        case JobStatus.Failed: return 'red';
        case JobStatus.Pending: return 'orange';
        default: return 'grey';
      }
    }
    switch (s as MessageStatus) {
      case MessageStatus.Success: return 'green';
      case MessageStatus.Failed: return 'red';
      case MessageStatus.Pending: return 'orange';
      // Delivered, but a channel had to fail first — amber alongside Partial Success
      // rather than green, which would hide that something needs looking at.
      case MessageStatus.Fallback: return 'amber';
      case MessageStatus.PartialSuccess: return 'amber';
      default: return 'grey';
    }
  });
}

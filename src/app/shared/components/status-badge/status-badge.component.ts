import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DeliveryStatus, JobStatus, MessageStatus } from '../../../core/models/enums';
import { MessageStatusPipe } from '../../pipes/message-status.pipe';

type BadgeType = 'message' | 'job' | 'call' | 'delivery';
type BadgeColor = 'green' | 'red' | 'orange' | 'amber' | 'grey';

/**
 * Message Logs' own per-recipient status wording (hotfix batch 4, task 5) — the client
 * found "Awaiting Status" ambiguous (stuck? still processing?) and "Fallback" read as
 * dev jargon. Every label reads as a plain outcome, not a raw enum name.
 */
function deliveryStatusLabel(status: DeliveryStatus): string {
  switch (status) {
    case DeliveryStatus.Pending: return 'In Progress';
    case DeliveryStatus.Delivered: return 'Delivered';
    case DeliveryStatus.Failed: return 'Failed';
    // Delivered, but only because the primary channel failed first — says so plainly
    // rather than naming the mechanism ("Fallback").
    case DeliveryStatus.Fallback: return 'Delivered (Backup Channel)';
    // The provider gave no usable answer, or offers none — plainly "not known", never
    // styled or worded like an error.
    default: return 'Status Unknown';
  }
}

/**
 * Plain explanations for the statuses that can read as broken (hotfix batch 6). WhatsApp rows
 * never sit In Progress: they resolve from the send response. SMS and Voice do, until the
 * provider's own delivery report is synced.
 */
function deliveryStatusHint(status: DeliveryStatus): string {
  switch (status) {
    case DeliveryStatus.Pending:
      return 'Sent to the provider. Updates after the next sync.';
    case DeliveryStatus.Fallback:
      return 'The first channel failed and the backup channel delivered it.';
    case DeliveryStatus.Delivered:
    case DeliveryStatus.Failed:
      return '';
    default:
      return 'The provider gave no clear answer for this message.';
  }
}

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [MatChipsModule, MatTooltipModule],
  template: `<mat-chip class="badge badge-{{ color() }}" [disableRipple]="true"
    [matTooltip]="tooltip()" [matTooltipDisabled]="!tooltip()">{{ label() }}</mat-chip>`,
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
    if (t === 'delivery') {
      return deliveryStatusLabel(s as DeliveryStatus);
    }
    // The pipe owns the wording, so the badge cannot drift from the rest of the UI —
    // the raw enum name renders as "PartialSuccess", one word.
    return new MessageStatusPipe().transform(s);
  });

  readonly tooltip = computed<string>(() => {
    const s = this.status();
    return this.type() === 'delivery' && typeof s === 'number'
      ? deliveryStatusHint(s as DeliveryStatus)
      : '';
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
    if (t === 'delivery') {
      switch (s as DeliveryStatus) {
        case DeliveryStatus.Delivered: return 'green';
        case DeliveryStatus.Failed: return 'red';
        case DeliveryStatus.Pending: return 'orange';
        // Delivered, but only because the primary channel failed first — amber rather
        // than green, so something worth a look does not read as fully fine.
        case DeliveryStatus.Fallback: return 'amber';
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

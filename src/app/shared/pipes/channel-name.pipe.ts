import { Pipe, PipeTransform } from '@angular/core';

/** Maps backend channel-name strings (e.g. "WP_Text") to customer-friendly labels. */
export function channelNameLabel(value: string): string {
  switch (value) {
    case 'SMS': return 'SMS';
    case 'WP_Text': return 'WhatsApp Text';
    case 'WP_Media': return 'WhatsApp Media';
    case 'Voice': return 'Voice Call';
    default: return value;
  }
}

@Pipe({ name: 'channelName', standalone: true })
export class ChannelNamePipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    return value ? channelNameLabel(value) : '';
  }
}

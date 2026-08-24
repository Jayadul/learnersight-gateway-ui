import { Pipe, PipeTransform } from '@angular/core';
import { ChannelType } from '../../core/models/enums';

@Pipe({ name: 'channelType', standalone: true })
export class ChannelTypePipe implements PipeTransform {
  transform(value: ChannelType | number | null | undefined): string {
    switch (value) {
      case ChannelType.SMS: return 'SMS';
      case ChannelType.WP: return 'WhatsApp';
      case ChannelType.Voice: return 'Voice Call';
      default: return 'Unknown';
    }
  }
}

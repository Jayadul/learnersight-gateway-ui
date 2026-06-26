import { Pipe, PipeTransform } from '@angular/core';
import { ChannelType } from '../../core/models/enums';

@Pipe({ name: 'channelType', standalone: true })
export class ChannelTypePipe implements PipeTransform {
  transform(value: ChannelType | number | null | undefined): string {
    switch (value) {
      case ChannelType.SMS: return 'SMS';
      case ChannelType.WP_Text: return 'WhatsApp Text';
      case ChannelType.WP_Media: return 'WhatsApp Media';
      case ChannelType.Voice: return 'Voice Call';
      default: return 'Unknown';
    }
  }
}

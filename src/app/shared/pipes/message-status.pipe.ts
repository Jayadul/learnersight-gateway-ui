import { Pipe, PipeTransform } from '@angular/core';
import { MessageStatus } from '../../core/models/enums';

@Pipe({ name: 'messageStatus', standalone: true })
export class MessageStatusPipe implements PipeTransform {
  transform(value: MessageStatus | number | null | undefined): string {
    switch (value) {
      case MessageStatus.Pending: return 'Pending';
      case MessageStatus.PartialSuccess: return 'Partial Success';
      case MessageStatus.Success: return 'Success';
      case MessageStatus.Failed: return 'Failed';
      case MessageStatus.Fallback: return 'Delivered via Fallback';
      default: return 'Unknown';
    }
  }
}

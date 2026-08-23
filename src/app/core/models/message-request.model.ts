import { MessageSource, MessageStatus } from './enums';
import { DispatchJobDto } from './dispatch-job.model';

export interface MessageRequestDto {
  readonly id: string;
  readonly toUser: string;
  readonly parsedChannels: string[];
  readonly overallStatus: MessageStatus;
  readonly receivedAt: string;
  readonly source: MessageSource;
  /** The sender tagged more than one delivery, so fallback rules are skipped. */
  readonly isMultiChannel: boolean;
  readonly createdAt: string;
}
export interface MessageRequestDetailDto extends MessageRequestDto {
  readonly jobs: DispatchJobDto[];
}

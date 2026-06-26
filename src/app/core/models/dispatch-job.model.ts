import { ChannelType, JobStatus } from './enums';

export interface DispatchJobDto {
  readonly id: string;
  readonly channelType: ChannelType;
  readonly toNumber: string;
  readonly messageContent: string;
  readonly status: JobStatus;
  readonly providerMessageId?: string;
  readonly providerRawResponse?: string;
  readonly failureReason?: string;
  readonly sentAt?: string;
  readonly isFallback: boolean;
  readonly fallbackFromJobId?: string;
  readonly createdAt: string;
}

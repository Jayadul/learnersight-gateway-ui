import { ChannelType, JobStatus } from './enums';

export interface DispatchJobDto {
  readonly id: string;
  readonly channelType: ChannelType;
  /** Name of the gateway that sent it — several of a type may be active. */
  readonly channelLabel?: string;
  readonly toNumber: string;
  readonly messageContent: string;
  readonly status: JobStatus;
  readonly providerMessageId?: string;
  readonly providerRawResponse?: string;
  readonly failureReason?: string;
  readonly sentAt?: string;
  /** Campaign dialled, on voice jobs only. */
  readonly campaignId?: string;
  readonly isFallback: boolean;
  readonly fallbackFromJobId?: string;
  readonly createdAt: string;
}

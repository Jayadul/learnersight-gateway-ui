import { ChannelType, JobStatus } from './enums';
import { DispatchJobRecipientDto } from './dispatch-job-recipient.model';

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
  /**
   * Per-recipient outcomes. Populated on the detail view only — a batched job can
   * carry hundreds of rows the list view has no reason to load.
   */
  readonly recipients?: readonly DispatchJobRecipientDto[];
}

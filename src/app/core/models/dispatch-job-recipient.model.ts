import { DeliveryStatus } from './enums';

/**
 * One recipient's outcome within a dispatch job. Sits alongside the job's own status
 * rather than replacing it: the job records what the provider answered when the message
 * was handed over, this records what happened to this number afterwards, and the two
 * can legitimately disagree.
 */
export interface DispatchJobRecipientDto {
  readonly id: string;
  readonly dispatchJobId: string;
  readonly recipient: string;
  /** Provider-side id for this recipient; null when the provider returns none. */
  readonly providerReferenceId: string | null;
  readonly deliveryStatus: DeliveryStatus;
  readonly lastCheckedAt: string | null;
  readonly createdAt: string;
}

/** Retries specific recipients, optionally through another channel of the same type. */
export interface ResendRequest {
  readonly recipientIds: string[];
  /** Omit to retry on the channel that failed. */
  readonly channelConfigId?: string;
}

export interface ResendResultDto {
  readonly requested: number;
  readonly resent: number;
  readonly failed: number;
  readonly skipped: number;
  readonly outcomes: readonly ResendRecipientOutcome[];
}

export interface ResendRecipientOutcome {
  readonly recipientId: string;
  readonly recipient: string;
  readonly sent: boolean;
  readonly newRecipientId: string | null;
  readonly reason: string | null;
}

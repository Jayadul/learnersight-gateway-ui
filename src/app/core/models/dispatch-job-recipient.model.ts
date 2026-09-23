import { ChannelType, DeliveryStatus } from './enums';

/**
 * One recipient's outcome within a dispatch job. Sits alongside the job's own status
 * rather than replacing it: the job records what the provider answered when the message
 * was handed over, this records what happened to this number afterwards, and the two
 * can legitimately disagree.
 *
 * Since hotfix batch 3 this is also the row shape for the merged, per-recipient Message
 * Logs page (GET /api/dispatch-jobs/recipients) — it carries channel/content/date so the
 * page and its detail view need no second call.
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

  readonly channelType: ChannelType;
  readonly channelLabel: string | null;
  readonly messageContent: string;
  /** Campaign dialled, on voice jobs only. */
  readonly campaignId: string | null;
  readonly sentAt: string | null;
  readonly isFallback: boolean;
  /** The row this one was created to retry, when it came from a resend. */
  readonly resentFromRecipientId: string | null;
  /**
   * The exact raw provider response for this recipient's own send — its own synced
   * response once available, falling back to the job-level response written at dispatch
   * time so this is never blank just because a status sync hasn't run yet.
   */
  readonly rawProviderResponse: string | null;
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
  /** Whether a send was actually attempted, vs. skipped before any provider call. */
  readonly attempted: boolean;
  readonly reason: string | null;
}

/**
 * One resend attempt's own record (hotfix batch 4) — the recipient row itself is now
 * updated in place on every attempt, so this is where an earlier try's own outcome is
 * recovered.
 */
export interface ResendAttemptDto {
  readonly id: string;
  readonly deliveryStatus: DeliveryStatus;
  readonly providerReferenceId: string | null;
  readonly rawResponse: string | null;
  readonly channelLabel: string | null;
  readonly attemptedAt: string;
}

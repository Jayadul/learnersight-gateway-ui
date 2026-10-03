import { ChannelType } from './enums';

export interface FallbackPolicyDto {
  readonly id: string;
  readonly name: string;
  readonly triggerChannel: ChannelType;
  readonly fallbackChannel: ChannelType;
  /** Null = any channel of the trigger type. */
  readonly triggerChannelConfigId?: string | null;
  /** Null = the fallback type's default channel. */
  readonly fallbackChannelConfigId?: string | null;
  /** Required for a rule that falls back to a different channel type. */
  readonly allowCrossChannel: boolean;
  /** Resolved names so the list need not look the ids up again. */
  readonly triggerChannelLabel?: string | null;
  readonly fallbackChannelLabel?: string | null;
  readonly isActive: boolean;
  /**
   * Read-only, derived from triggerChannelConfigId being null (hotfix batch 9, Task 9) —
   * it used to be an admin-set toggle ("Apply this rule to all channels") independent of
   * scoping, defaulted off, which silently hid a correctly-scoped active policy from
   * fallback resolution. Not sent on create/update any more.
   */
  readonly isGlobal: boolean;
  readonly description?: string;
  readonly createdAt: string;
}
export interface CreateFallbackPolicyRequest {
  readonly name: string;
  readonly triggerChannel: ChannelType;
  readonly fallbackChannel: ChannelType;
  readonly triggerChannelConfigId?: string | null;
  readonly fallbackChannelConfigId?: string | null;
  readonly allowCrossChannel: boolean;
  readonly description?: string;
}
export interface UpdateFallbackPolicyRequest extends CreateFallbackPolicyRequest {
  readonly isActive: boolean;
}

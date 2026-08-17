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
  readonly isGlobal: boolean;
  readonly description?: string;
}
export interface UpdateFallbackPolicyRequest extends CreateFallbackPolicyRequest {
  readonly isActive: boolean;
}

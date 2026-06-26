import { ChannelType } from './enums';

export interface FallbackPolicyDto {
  readonly id: string;
  readonly name: string;
  readonly triggerChannel: ChannelType;
  readonly fallbackChannel: ChannelType;
  readonly isActive: boolean;
  readonly isGlobal: boolean;
  readonly description?: string;
  readonly createdAt: string;
}
export interface CreateFallbackPolicyRequest {
  readonly name: string;
  readonly triggerChannel: ChannelType;
  readonly fallbackChannel: ChannelType;
  readonly isGlobal: boolean;
  readonly description?: string;
}
export interface UpdateFallbackPolicyRequest extends CreateFallbackPolicyRequest {
  readonly isActive: boolean;
}

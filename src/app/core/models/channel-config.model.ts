import { ChannelType } from './enums';

export interface ChannelConfigDto {
  readonly id: string;
  readonly channelType: ChannelType;
  readonly providerName: string;
  readonly label: string;
  /** Tag-safe identifier for labelled sends, e.g. [sms_label:revemain::text]. */
  readonly labelSlug: string;
  readonly isActive: boolean;
  /** Exactly one channel per type is the default; untagged sends resolve here. */
  readonly isDefault: boolean;
  readonly configFields: Readonly<Record<string, string>>;
  readonly createdAt: string;
  readonly updatedAt: string;
}
export interface CreateChannelConfigRequest {
  readonly channelType: ChannelType;
  readonly providerName: string;
  readonly label: string;
  /** Optional — the backend derives one from the label when omitted. */
  readonly labelSlug?: string;
  readonly configJson: string;
}
export interface UpdateChannelConfigRequest {
  readonly providerName: string;
  readonly label: string;
  /** Optional — the backend derives one from the label when omitted. */
  readonly labelSlug?: string;
  readonly configJson: string;
}

import { ChannelType, Provider } from './enums';

/**
 * Minimal, non-sensitive channel identity — id/label/labelSlug/default only. Served from
 * `/api/manual-send/channels`, not the SuperAdmin-only ChannelConfig endpoints, so any
 * Admin-role page (Send Message's gateway picker, Message Logs' gateway filter) can read
 * it without needing SuperAdmin.
 */
export interface ChannelOptionDto {
  readonly id: string;
  readonly label: string;
  readonly labelSlug: string;
  readonly channelType: ChannelType;
  readonly isActive: boolean;
  readonly isDefault: boolean;
  /** Whether this channel has a Template API Token configured — gates "Send Template" mode. */
  readonly hasTemplateToken: boolean;
}

export interface ChannelConfigDto {
  readonly id: string;
  readonly channelType: ChannelType;
  /** Which vendor serves this channel; picks the sender at dispatch time. */
  readonly provider: Provider;
  /** Display text only. `provider` is what the backend dispatches on. */
  readonly providerName: string;
  readonly label: string;
  /** Tag-safe identifier for labelled sends, e.g. [sms:revemain::text]. */
  readonly labelSlug: string;
  readonly isActive: boolean;
  /** Exactly one channel per type is the default; untagged sends resolve here. */
  readonly isDefault: boolean;
  /** Seconds to wait before each send on this channel; 0 disables pacing. */
  readonly delaySeconds: number;
  readonly configFields: Readonly<Record<string, string>>;
  readonly createdAt: string;
  readonly updatedAt: string;
}
export interface CreateChannelConfigRequest {
  readonly channelType: ChannelType;
  readonly provider: Provider;
  readonly providerName: string;
  readonly label: string;
  /** Optional — the backend derives one from the label when omitted. */
  readonly labelSlug?: string;
  /** Seconds to wait before each send on this channel; 0 disables pacing. */
  readonly delaySeconds: number;
  readonly configJson: string;
}
export interface UpdateChannelConfigRequest {
  readonly provider: Provider;
  readonly providerName: string;
  readonly label: string;
  /** Optional — the backend derives one from the label when omitted. */
  readonly labelSlug?: string;
  /** Seconds to wait before each send on this channel; 0 disables pacing. */
  readonly delaySeconds: number;
  readonly configJson: string;
}

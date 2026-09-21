export interface ManualSendRequest {
  readonly channelType: number; // wire format: integer enum (SMS=0, WP=1, Voice=3; 2 retired)
  readonly toNumbers: string;
  readonly message?: string; // not used for Voice (campaign is pre-configured)
  /** WhatsApp only — its presence is what makes the send a media message. */
  readonly mediaUrl?: string;
  /** Which gateway of this type to send on. Omitted = the type's default channel. */
  readonly channelLabelSlug?: string;
  /** SMS only. Omitted = the channel's configured sender id. */
  readonly callerId?: string;
  /** Voice only. Omitted = the channel's configured campaign. */
  readonly campaignId?: string;
  /** Voice only. Omitted = the channel's configured lot. */
  readonly lotNumber?: string;
}
export interface ManualSendResponse {
  readonly messageRequestId: string;
  readonly status: string;
  readonly totalNumbers: number;
}

/**
 * WhatsApp Template send (hotfix batch 3) — a structured payload, not a free-text
 * message, so it is its own request shape rather than an extension of ManualSendRequest.
 */
export interface SendTemplateRequest {
  /** Must name an active WhatsApp channel with a Template API Token configured. */
  readonly channelLabelSlug: string;
  readonly toNumber: string;
  readonly templateName: string;
  /** Ordered template variable values — count varies per template. */
  readonly exampleArr: string[];
  readonly mediaUrl?: string;
  /** Omitted uses the channel's configured Template API Token; set overrides it for this send only. */
  readonly token?: string;
}

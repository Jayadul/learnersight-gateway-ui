export interface ManualSendRequest {
  readonly channelType: number; // wire format: integer enum (SMS=0, WP_Text=1, WP_Media=2, Voice=3)
  readonly toNumbers: string;
  readonly message?: string; // not used for Voice (campaign is pre-configured)
  readonly mediaUrl?: string; // WhatsApp Media only
}
export interface ManualSendResponse {
  readonly messageRequestId: string;
  readonly status: string;
  readonly totalNumbers: number;
}

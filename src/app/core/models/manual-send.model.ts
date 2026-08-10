export interface ManualSendRequest {
  readonly channelType: number; // wire format: integer enum (SMS=0, WP=1, Voice=3; 2 retired)
  readonly toNumbers: string;
  readonly message?: string; // not used for Voice (campaign is pre-configured)
  readonly mediaUrl?: string; // WhatsApp Media only
}
export interface ManualSendResponse {
  readonly messageRequestId: string;
  readonly status: string;
  readonly totalNumbers: number;
}

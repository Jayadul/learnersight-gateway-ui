export interface ManualSendRequest {
  readonly channelType: string; // wire format: "SMS" | "WP_Text" | "WP_Media" | "Voice"
  readonly toNumbers: string;
  readonly message: string;
  readonly mediaUrl?: string;
  readonly campaignId?: string;
  readonly callerID?: string;
}
export interface ManualSendResponse {
  readonly messageRequestId: string;
  readonly status: string;
  readonly totalNumbers: number;
}

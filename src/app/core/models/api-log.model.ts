export interface ApiLogDto {
  readonly id: string;
  readonly apiKey?: string;
  readonly toUser?: string;
  readonly rawBody: string;
  readonly responseBody: string;
  readonly callerIp: string;
  readonly responseStatus: number;
  readonly durationMs: number;
  readonly requestedAt: string;
  readonly messageRequestId?: string;
  /** Channel types the request's tags asked for, e.g. "SMS, WhatsApp". */
  readonly requestedChannels?: string;
  /**
   * "ACCEPTD" or "REJECTD" — the actual gateway-level outcome (hotfix batch 9, Task 12).
   * responseStatus is HTTP 200 for every /sendtext call regardless of outcome, so this is
   * what actually tells a rejected request apart from an accepted one.
   */
  readonly gatewayResult?: string;
}

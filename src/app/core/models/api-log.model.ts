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
}

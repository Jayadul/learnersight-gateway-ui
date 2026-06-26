export interface DashboardSummaryDto {
  readonly totalToday: number;
  readonly totalWeek: number;
  readonly smsSentToday: number;
  readonly wpSentToday: number;
  readonly voiceSentToday: number;
  readonly failedToday: number;
  readonly successRatePercent: number;
}
export interface TimelinePointDto { readonly date: string; readonly count: number; }
export interface ChannelBreakdownDto { readonly channelType: string; readonly sentCount: number; readonly failedCount: number; }
export interface FailureReasonDto { readonly reason: string; readonly count: number; }

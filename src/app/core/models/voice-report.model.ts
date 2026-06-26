export interface VoiceCallRecord {
  readonly callState?: string;
  readonly connectTime?: string;
  readonly destination?: string;
  readonly displayNameSent?: string;
  readonly endTime?: string;
  readonly startTime?: string;
}
export interface VoiceReportSyncRequest { readonly from: string; readonly to: string; }
export interface VoiceReportSyncResponse { readonly totalRecords: number; readonly records: VoiceCallRecord[]; }

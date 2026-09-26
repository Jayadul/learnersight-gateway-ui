import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiEndpoints } from '../api/api-endpoints';

export interface StatusSyncResultDto {
  readonly channelConfigId: string;
  readonly label: string;
  readonly success: boolean;
  /** Recipients given a final answer this run: Delivered or Failed. */
  readonly updated: number;
  /** Recipients the provider says are still in flight (sent, no delivery report yet). */
  readonly stillWaiting: number;
  /** Recipients that had no clear answer for too long and became Status Unknown. */
  readonly markedUnknown: number;
  /** Rows the provider had nothing to say about — normal for a message in flight. */
  readonly unmatched: number;
  readonly error: string | null;
  /** One run took its maximum and more recipients are still waiting. */
  readonly moreWaiting: boolean;
  readonly from: string;
  readonly to: string;
}

export interface StatusSyncRequest {
  readonly from?: string;
  readonly to?: string;
  readonly limit?: number;
}

@Injectable({ providedIn: 'root' })
export class StatusSyncService {
  private readonly http = inject(HttpClient);

  /** Channels whose provider offers a delivery status lookup. */
  getSyncableChannels(): Observable<StatusSyncResultDto[]> {
    return this.http.get<StatusSyncResultDto[]>(
      `${environment.apiUrl}${ApiEndpoints.statusSync.channels}`);
  }

  /** No dates: every recipient of the channel still waiting for a status, whenever it was sent. */
  sync(channelConfigId: string, request: StatusSyncRequest = {}): Observable<StatusSyncResultDto> {
    return this.http.post<StatusSyncResultDto>(
      `${environment.apiUrl}${ApiEndpoints.statusSync.channel}/${channelConfigId}`, request);
  }
}

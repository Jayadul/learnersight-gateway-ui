import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiEndpoints } from '../api/api-endpoints';

export interface StatusSyncResultDto {
  readonly channelConfigId: string;
  readonly label: string;
  readonly success: boolean;
  readonly updated: number;
  /** Rows the provider had nothing to say about — normal for a message in flight. */
  readonly unmatched: number;
  readonly error: string | null;
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

  /**
   * Omitting the window syncs today's whole day plus anything still waiting from earlier days.
   * Dates given are snapped to whole days (00:00:00 to 23:59:59, Dhaka) for a backfill.
   */
  sync(channelConfigId: string, request: StatusSyncRequest = {}): Observable<StatusSyncResultDto> {
    return this.http.post<StatusSyncResultDto>(
      `${environment.apiUrl}${ApiEndpoints.statusSync.channel}/${channelConfigId}`, request);
  }
}

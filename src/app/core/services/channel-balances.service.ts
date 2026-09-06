import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiEndpoints } from '../api/api-endpoints';
import { ChannelBalanceDto } from '../models/channel-balance.model';

/**
 * Cached provider balances. Lives in core rather than under the dashboard feature
 * because the channel-configs page shows the same figures on its cards.
 */
@Injectable({ providedIn: 'root' })
export class ChannelBalancesService {
  private readonly http = inject(HttpClient);

  /** Cached figures. Does not call any provider — see the backend service. */
  getAll(): Observable<ChannelBalanceDto[]> {
    return this.http.get<ChannelBalanceDto[]>(
      `${environment.apiUrl}${ApiEndpoints.channelBalances}`);
  }

  /** Reads one channel's balance from its provider now. */
  refresh(channelConfigId: string): Observable<ChannelBalanceDto> {
    return this.http.post<ChannelBalanceDto>(
      `${environment.apiUrl}${ApiEndpoints.channelBalances}/${channelConfigId}/refresh`, {});
  }
}

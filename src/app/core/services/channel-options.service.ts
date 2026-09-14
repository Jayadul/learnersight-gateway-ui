import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiEndpoints } from '../api/api-endpoints';
import { ChannelOptionDto } from '../models/channel-config.model';
import { ChannelType } from '../models/enums';

/**
 * Read-only channel identity for pages that are not SuperAdmin-restricted but still need
 * to know which gateways exist (Send Message's picker, Message Logs' gateway filter).
 * Backed by `/api/manual-send/channels`, not `ChannelConfigsService` — that resource is
 * SuperAdmin-only end to end, so an Admin-role user calling it 403s even for a plain read.
 */
@Injectable({ providedIn: 'root' })
export class ChannelOptionsService {
  private readonly http = inject(HttpClient);

  getByChannel(channelType: ChannelType): Observable<ChannelOptionDto[]> {
    const params = new HttpParams().set('channelType', channelType);
    return this.http.get<ChannelOptionDto[]>(
      `${environment.apiUrl}${ApiEndpoints.manualSendChannels}`, { params },
    );
  }

  getAll(): Observable<ChannelOptionDto[]> {
    return this.http.get<ChannelOptionDto[]>(`${environment.apiUrl}${ApiEndpoints.manualSendChannels}`);
  }
}

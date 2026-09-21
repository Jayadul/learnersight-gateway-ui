import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ManualSendRequest, ManualSendResponse, SendTemplateRequest } from '../../core/models/manual-send.model';
import { ApiEndpoints } from '../../core/api/api-endpoints';

@Injectable({ providedIn: 'root' })
export class SendMessageService {
  private readonly http = inject(HttpClient);

  send(body: ManualSendRequest): Observable<ManualSendResponse> {
    return this.http.post<ManualSendResponse>(`${environment.apiUrl}${ApiEndpoints.manualSend}`, body);
  }

  sendTemplate(body: SendTemplateRequest): Observable<ManualSendResponse> {
    return this.http.post<ManualSendResponse>(`${environment.apiUrl}${ApiEndpoints.manualSendTemplate}`, body);
  }
}

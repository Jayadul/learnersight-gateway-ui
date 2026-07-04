import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiEndpoints } from '../../core/api/api-endpoints';
import { SendTextGatewayResponse } from '../../core/models/sendtext.model';

export interface SendTextForm {
  readonly apikey: string;
  readonly secretkey: string;
  readonly callerID: string;
  readonly toUser: string;
  readonly messageContent: string;
}

@Injectable({ providedIn: 'root' })
export class SendTextApiService {
  private readonly http = inject(HttpClient);

  /** The gateway consumes application/x-www-form-urlencoded, not JSON. */
  send(form: SendTextForm): Observable<SendTextGatewayResponse> {
    const body = new HttpParams()
      .set('apikey', form.apikey)
      .set('secretkey', form.secretkey)
      .set('callerID', form.callerID)
      .set('toUser', form.toUser)
      .set('messageContent', form.messageContent);
    return this.http.post<SendTextGatewayResponse>(
      `${environment.apiUrl}${ApiEndpoints.sendText}`,
      body,
    );
  }
}

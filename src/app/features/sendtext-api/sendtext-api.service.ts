import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiEndpoints } from '../../core/api/api-endpoints';
import { BalanceLookupResponse, SendTextGatewayResponse } from '../../core/models/sendtext.model';

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

  /**
   * POST sends application/x-www-form-urlencoded; GET sends the same fields as query
   * params. Same endpoint, same orchestrator call on the backend, identical response —
   * GET exists only for integrators whose platform cannot easily do POST.
   */
  send(form: SendTextForm, verb: 'POST' | 'GET' = 'POST'): Observable<SendTextGatewayResponse> {
    const params = new HttpParams()
      .set('apikey', form.apikey)
      .set('secretkey', form.secretkey)
      .set('callerID', form.callerID)
      .set('toUser', form.toUser)
      .set('messageContent', form.messageContent);
    const url = `${environment.apiUrl}${ApiEndpoints.sendText}`;
    return verb === 'GET'
      ? this.http.get<SendTextGatewayResponse>(url, { params })
      : this.http.post<SendTextGatewayResponse>(url, params);
  }

  /** Public, unauthenticated balance lookup — GET /balance?callerID=. */
  checkBalance(label: string): Observable<BalanceLookupResponse> {
    return this.http.get<BalanceLookupResponse>(
      `${environment.apiUrl}${ApiEndpoints.balance}`,
      { params: new HttpParams().set('callerID', label) },
    );
  }
}

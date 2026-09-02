import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiEndpoints } from '../../../core/api/api-endpoints';
import {
  GatewayCredentialDto,
  UpdateGatewayCredentialRequest,
} from '../../../core/models/gateway-credential.model';

/**
 * A single row, so there is no id in the route and BaseCrudService does not fit —
 * GET and PUT both address the collection path itself.
 */
@Injectable({ providedIn: 'root' })
export class GatewayCredentialsService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}${ApiEndpoints.gatewayCredentials}`;

  get(): Observable<GatewayCredentialDto> {
    return this.http.get<GatewayCredentialDto>(this.url);
  }

  update(body: UpdateGatewayCredentialRequest): Observable<GatewayCredentialDto> {
    return this.http.put<GatewayCredentialDto>(this.url, body);
  }
}

import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiEndpoints } from '../api/api-endpoints';
import { ResendRequest, ResendResultDto } from '../models/dispatch-job-recipient.model';

/**
 * Retries individual failed recipients. Recipient-level rather than job-level: SMS and
 * Voice batch many numbers into one job, so retrying the job would send again to
 * everyone it already reached.
 */
@Injectable({ providedIn: 'root' })
export class ResendService {
  private readonly http = inject(HttpClient);

  resend(request: ResendRequest): Observable<ResendResultDto> {
    return this.http.post<ResendResultDto>(
      `${environment.apiUrl}${ApiEndpoints.resendRecipients}`, request);
  }
}

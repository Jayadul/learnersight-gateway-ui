import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { VoiceReportSyncRequest, VoiceReportSyncResponse } from '../../core/models/voice-report.model';
import { ApiEndpoints } from '../../core/api/api-endpoints';

@Injectable({ providedIn: 'root' })
export class VoiceReportsService {
  private readonly http = inject(HttpClient);

  sync(body: VoiceReportSyncRequest): Observable<VoiceReportSyncResponse> {
    return this.http.post<VoiceReportSyncResponse>(`${environment.apiUrl}${ApiEndpoints.voiceReports.sync}`, body);
  }
}

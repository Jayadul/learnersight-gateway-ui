import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ChannelBreakdownDto, DashboardSummaryDto, FailureReasonDto, TimelinePointDto } from '../../core/models/dashboard.model';
import { ApiEndpoints } from '../../core/api/api-endpoints';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);

  getSummary(): Observable<DashboardSummaryDto> {
    return this.http.get<DashboardSummaryDto>(`${environment.apiUrl}${ApiEndpoints.dashboard.summary}`);
  }
  getTimeline(days: number): Observable<TimelinePointDto[]> {
    return this.http.get<TimelinePointDto[]>(`${environment.apiUrl}${ApiEndpoints.dashboard.timeline}`, { params: { days } });
  }
  getChannelBreakdown(): Observable<ChannelBreakdownDto[]> {
    return this.http.get<ChannelBreakdownDto[]>(`${environment.apiUrl}${ApiEndpoints.dashboard.channelBreakdown}`);
  }
  getFailureReasons(top: number): Observable<FailureReasonDto[]> {
    return this.http.get<FailureReasonDto[]>(`${environment.apiUrl}${ApiEndpoints.dashboard.failureReasons}`, { params: { top } });
  }
}

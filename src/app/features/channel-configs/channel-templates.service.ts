import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiEndpoints } from '../../core/api/api-endpoints';
import {
  ChannelTemplateDto,
  CreateChannelTemplateRequest,
  UpdateChannelTemplateRequest,
} from '../../core/models/channel-config.model';

/** Templates registered on a Template channel (hotfix batch 9, Task 1) — SuperAdmin-only, nested under the channel. */
@Injectable({ providedIn: 'root' })
export class ChannelTemplatesService {
  private readonly http = inject(HttpClient);

  private urlFor(channelId: string): string {
    return `${environment.apiUrl}${ApiEndpoints.channelTemplates(channelId)}`;
  }

  list(channelId: string): Observable<ChannelTemplateDto[]> {
    return this.http.get<ChannelTemplateDto[]>(this.urlFor(channelId));
  }

  create(channelId: string, body: CreateChannelTemplateRequest): Observable<ChannelTemplateDto> {
    return this.http.post<ChannelTemplateDto>(this.urlFor(channelId), body);
  }

  update(channelId: string, templateId: string, body: UpdateChannelTemplateRequest): Observable<ChannelTemplateDto> {
    return this.http.put<ChannelTemplateDto>(`${this.urlFor(channelId)}/${templateId}`, body);
  }

  remove(channelId: string, templateId: string): Observable<void> {
    return this.http.delete<void>(`${this.urlFor(channelId)}/${templateId}`);
  }
}

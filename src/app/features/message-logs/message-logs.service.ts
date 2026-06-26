import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseCrudService } from '../../core/api/base-crud.service';
import { MessageRequestDetailDto, MessageRequestDto } from '../../core/models/message-request.model';
import { ApiEndpoints } from '../../core/api/api-endpoints';

@Injectable({ providedIn: 'root' })
export class MessageLogsService extends BaseCrudService<MessageRequestDto> {
  protected readonly resourcePath = ApiEndpoints.messageRequests;

  getDetail(id: string): Observable<MessageRequestDetailDto> {
    return this.http.get<MessageRequestDetailDto>(`${this.baseUrl}/${id}`);
  }
}

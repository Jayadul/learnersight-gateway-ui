import { Injectable } from '@angular/core';
import { BaseCrudService } from '../api/base-crud.service';
import { MessageRequestDto } from '../models/message-request.model';
import { ApiEndpoints } from '../api/api-endpoints';

/**
 * One row per gateway/manual request. Split out from MessageLogsService (hotfix batch 3),
 * which now serves the per-recipient Message Logs page — the dashboard's "recent
 * activity" widget still wants the coarser, one-row-per-request view.
 */
@Injectable({ providedIn: 'root' })
export class MessageRequestsService extends BaseCrudService<MessageRequestDto> {
  protected readonly resourcePath = ApiEndpoints.messageRequests;
}

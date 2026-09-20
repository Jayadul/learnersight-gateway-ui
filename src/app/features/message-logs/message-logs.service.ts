import { Injectable } from '@angular/core';
import { BaseCrudService } from '../../core/api/base-crud.service';
import { DispatchJobRecipientDto } from '../../core/models/dispatch-job-recipient.model';
import { ApiEndpoints } from '../../core/api/api-endpoints';

/** Per-recipient Message Logs (R3.4) — one row per dispatch_job_recipients entry. */
@Injectable({ providedIn: 'root' })
export class MessageLogsService extends BaseCrudService<DispatchJobRecipientDto> {
  protected readonly resourcePath = ApiEndpoints.dispatchJobRecipients;
}

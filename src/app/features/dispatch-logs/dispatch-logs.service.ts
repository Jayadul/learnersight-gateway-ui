import { Injectable } from '@angular/core';
import { BaseCrudService } from '../../core/api/base-crud.service';
import { DispatchJobDto } from '../../core/models/dispatch-job.model';
import { ApiEndpoints } from '../../core/api/api-endpoints';

@Injectable({ providedIn: 'root' })
export class DispatchLogsService extends BaseCrudService<DispatchJobDto> {
  protected readonly resourcePath = ApiEndpoints.dispatchLogs;
}

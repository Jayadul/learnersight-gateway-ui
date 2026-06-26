import { Injectable } from '@angular/core';
import { BaseCrudService } from '../../core/api/base-crud.service';
import { ApiLogDto } from '../../core/models/api-log.model';
import { ApiEndpoints } from '../../core/api/api-endpoints';

@Injectable({ providedIn: 'root' })
export class ApiLogsService extends BaseCrudService<ApiLogDto> {
  protected readonly resourcePath = ApiEndpoints.apiLogs;
}

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseCrudService } from '../../core/api/base-crud.service';
import { ChannelConfigDto, CreateChannelConfigRequest, UpdateChannelConfigRequest } from '../../core/models/channel-config.model';
import { ChannelType } from '../../core/models/enums';
import { ApiEndpoints } from '../../core/api/api-endpoints';

@Injectable({ providedIn: 'root' })
export class ChannelConfigsService extends BaseCrudService<ChannelConfigDto, CreateChannelConfigRequest, UpdateChannelConfigRequest> {
  protected readonly resourcePath = ApiEndpoints.channelConfigs;

  getByChannel(channelType: ChannelType): Observable<ChannelConfigDto[]> {
    return this.getAll({ channelType });
  }
  activate(id: string): Observable<void> {
    return this.patch(id, 'activate');
  }
  deactivate(id: string): Observable<void> {
    return this.patch(id, 'deactivate');
  }
  /** Promotes this channel to be its type's default, demoting the previous one. */
  setDefault(id: string): Observable<void> {
    return this.patch(id, 'set-default');
  }
}

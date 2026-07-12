import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiEndpoints } from '../../core/api/api-endpoints';
import { BaseCrudService } from '../../core/api/base-crud.service';
import { MediaFileDto } from '../../core/models/media-file.model';

@Injectable({ providedIn: 'root' })
export class MediaLibraryService extends BaseCrudService<MediaFileDto> {
  protected readonly resourcePath = ApiEndpoints.media;

  upload(file: File, customName: string | null, expiryDays: number): Observable<MediaFileDto> {
    const form = new FormData();
    form.append('file', file);
    if (customName) {
      form.append('customName', customName);
    }
    form.append('expiryDays', String(expiryDays));
    return this.http.post<MediaFileDto>(this.baseUrl, form);
  }
}

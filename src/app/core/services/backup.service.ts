import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiEndpoints } from '../api/api-endpoints';

export type BackupPreset = 'last-week' | 'last-month' | 'this-month' | 'this-year' | 'all-time';

export interface BackupRange {
  readonly from?: Date;
  readonly to?: Date;
}

/** Calendar-based ranges in the user's local time zone. */
export function backupRange(preset: BackupPreset): BackupRange {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  switch (preset) {
    case 'last-week': {
      // previous full week, Monday 00:00 → next Monday 00:00
      const daysSinceMonday = (now.getDay() + 6) % 7;
      const thisMonday = new Date(y, m, now.getDate() - daysSinceMonday);
      const lastMonday = new Date(y, m, thisMonday.getDate() - 7);
      return { from: lastMonday, to: thisMonday };
    }
    case 'last-month':
      return { from: new Date(y, m - 1, 1), to: new Date(y, m, 1) };
    case 'this-month':
      return { from: new Date(y, m, 1) };
    case 'this-year':
      return { from: new Date(y, 0, 1) };
    case 'all-time':
      return {};
  }
}

@Injectable({ providedIn: 'root' })
export class BackupService {
  private readonly http = inject(HttpClient);

  download(range: BackupRange): Observable<Blob> {
    let params = new HttpParams();
    if (range.from) {
      params = params.set('from', range.from.toISOString());
    }
    if (range.to) {
      params = params.set('to', range.to.toISOString());
    }
    return this.http.get(`${environment.apiUrl}${ApiEndpoints.backupExport}`, {
      params,
      responseType: 'blob',
    });
  }
}

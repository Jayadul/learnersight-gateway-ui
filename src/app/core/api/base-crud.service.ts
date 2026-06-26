import { HttpClient, HttpParams } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PagedResult } from '../models/paged-result.model';

/**
 * Generic typed HTTP service. Extend it and set `resourcePath` to a value
 * from ApiEndpoints:
 *
 *   class FooService extends BaseCrudService<FooDto, CreateFoo, UpdateFoo> {
 *     protected readonly resourcePath = ApiEndpoints.foos;
 *   }
 *
 * You then inherit getAll / getPaged / getById / create / update / patch / remove.
 */
export abstract class BaseCrudService<TDto, TCreate = unknown, TUpdate = unknown> {
  protected readonly http = inject(HttpClient);

  /** Full API path from ApiEndpoints, e.g. '/api/channel-configs' */
  protected abstract readonly resourcePath: string;

  protected get baseUrl(): string {
    return `${environment.apiUrl}${this.resourcePath}`;
  }

  getAll(params?: Record<string, unknown>): Observable<TDto[]> {
    return this.http.get<TDto[]>(this.baseUrl, { params: this.buildParams(params ?? {}) });
  }

  getPaged(params: Record<string, unknown>): Observable<PagedResult<TDto>> {
    return this.http.get<PagedResult<TDto>>(this.baseUrl, { params: this.buildParams(params) });
  }

  getById(id: string): Observable<TDto> {
    return this.http.get<TDto>(`${this.baseUrl}/${id}`);
  }

  create(body: TCreate): Observable<TDto> {
    return this.http.post<TDto>(this.baseUrl, body);
  }

  update(id: string, body: TUpdate): Observable<TDto> {
    return this.http.put<TDto>(`${this.baseUrl}/${id}`, body);
  }

  patch(id: string, action: string): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${id}/${action}`, {});
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  /** Build HttpParams, skipping null/undefined/'' and serializing Dates to ISO UTC. */
  protected buildParams(obj: Record<string, unknown>): HttpParams {
    let params = new HttpParams();
    for (const [key, raw] of Object.entries(obj)) {
      if (raw === null || raw === undefined || raw === '') continue;
      const value = raw instanceof Date ? raw.toISOString() : String(raw);
      params = params.set(key, value);
    }
    return params;
  }
}

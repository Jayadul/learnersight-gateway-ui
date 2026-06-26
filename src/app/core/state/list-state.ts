import { signal } from '@angular/core';
import { Observable } from 'rxjs';
import { PagedResult } from '../models/paged-result.model';

export type SortDir = 'asc' | 'desc' | '';

/**
 * Signal-based list/paging helper. One instance per list page:
 *
 *   state = new ListState<MyDto>(p => this.svc.getPaged(p), 'createdAt');
 *
 * Bind the data-table to state.data() / state.totalCount() / state.loading()
 * and forward (pageChange)->setPage, (sortChange)->setSort,
 * (filter search)->setFilters. Call state.load() once on init.
 */
export class ListState<T> {
  readonly data = signal<T[]>([]);
  readonly totalCount = signal(0);
  readonly loading = signal(false);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly sort = signal<{ active: string; direction: SortDir }>({ active: '', direction: 'desc' });
  readonly filters = signal<Record<string, unknown>>({});

  constructor(
    private readonly fetcher: (params: Record<string, unknown>) => Observable<PagedResult<T>>,
    primaryTimestampField = 'createdAt',
  ) {
    this.sort.set({ active: primaryTimestampField, direction: 'desc' });
  }

  load(): void {
    this.loading.set(true);
    const sort = this.sort();
    const params: Record<string, unknown> = {
      ...this.filters(),
      page: this.pageIndex() + 1, // backend is 1-based
      pageSize: this.pageSize(),
    };
    if (sort.active && sort.direction) {
      params['sortBy'] = sort.active;
      params['sortDir'] = sort.direction;
    }
    this.fetcher(params).subscribe({
      next: (res) => {
        this.data.set(res.items ?? []);
        this.totalCount.set(res.totalCount ?? 0);
        this.loading.set(false);
      },
      error: () => {
        this.data.set([]);
        this.totalCount.set(0);
        this.loading.set(false);
      },
    });
  }

  setPage(e: { pageIndex: number; pageSize: number }): void {
    this.pageIndex.set(e.pageIndex);
    this.pageSize.set(e.pageSize);
    this.load();
  }

  setSort(e: { active: string; direction: string }): void {
    this.sort.set({ active: e.active, direction: (e.direction as SortDir) || '' });
    this.load();
  }

  setFilters(f: Record<string, unknown>): void {
    this.filters.set(f);
    this.pageIndex.set(0);
    this.load();
  }
}

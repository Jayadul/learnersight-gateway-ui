import { ChangeDetectionStrategy, Component, computed, contentChildren, Directive, effect, inject, input, output, TemplateRef } from '@angular/core';
import { NgTemplateOutlet, DatePipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { EmptyStateComponent } from '../empty-state/empty-state.component';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';

/**
 * Generic config-driven table. Feature pages supply `columns` + data and bind
 * the (pageChange)/(sortChange)/(rowClick)/(actionClick) outputs. For a bespoke
 * cell use type:'custom' and project a template:
 *
 *   <app-data-table [columns]="cols" [data]="rows()">
 *     <ng-template appColumnDef="active" let-row>
 *       <mat-slide-toggle [checked]="row.isActive" (change)="toggle(row)" />
 *     </ng-template>
 *   </app-data-table>
 *
 * Set [serverSide]="false" to paginate/sort client-side (e.g. voice reports).
 */
export interface ColumnDef<T> {
  key: string;
  header: string;
  sortable?: boolean;
  type?: 'text' | 'date' | 'datetime' | 'chip' | 'chips' | 'badge' | 'custom';
  value?: (row: T) => unknown;
  badgeType?: 'message' | 'job' | 'call' | 'delivery';
  /** Cut the cell to this many characters; the full text stays available on hover. */
  truncate?: number;
  width?: string;
  /**
   * Render this column's header from a template named "<key>-header" (an
   * <ng-template appColumnDef="select-header">), e.g. a select-all checkbox.
   */
  customHeader?: boolean;
}

export interface RowAction<T> {
  action: string;
  icon: string;
  tooltip: string;
  color?: 'primary' | 'accent' | 'warn';
  show?: (row: T) => boolean;
}

@Directive({ selector: '[appColumnDef]', standalone: true })
export class ColumnDefDirective {
  readonly appColumnDef = input.required<string>();
  readonly tpl = inject(TemplateRef<unknown>);
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [
    NgTemplateOutlet, DatePipe, MatTableModule, MatSortModule, MatPaginatorModule, MatButtonModule,
    MatIconModule, MatTooltipModule, MatChipsModule, EmptyStateComponent, StatusBadgeComponent,
  ],
  templateUrl: './data-table.component.html',
  styleUrl: './data-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataTableComponent<T> {
  readonly columns = input.required<ColumnDef<T>[]>();
  readonly data = input<T[]>([]);
  readonly totalCount = input(0);
  readonly loading = input(false);
  readonly pageSizeOptions = input<number[]>([10, 25, 50]);
  readonly pageSize = input(10);
  readonly pageIndex = input(0);
  readonly rowActions = input<RowAction<T>[]>([]);
  readonly clickableRows = input(false);
  readonly serverSide = input(true);
  readonly emptyIcon = input('inbox');
  readonly emptyTitle = input('No records found');
  readonly emptySubtitle = input('');

  readonly pageChange = output<{ pageIndex: number; pageSize: number }>();
  readonly sortChange = output<{ active: string; direction: string }>();
  readonly rowClick = output<T>();
  readonly actionClick = output<{ action: string; row: T }>();

  private readonly customTemplates = contentChildren(ColumnDefDirective);

  // Client-side state mirrors (only used when serverSide === false).
  private clientSort: Sort = { active: '', direction: '' };
  private clientPage = { pageIndex: 0, pageSize: 10 };

  constructor() {
    effect(() => {
      this.clientPage = { pageIndex: this.pageIndex(), pageSize: this.pageSize() };
    });
  }

  readonly displayedColumns = computed<string[]>(() => {
    const cols = this.columns().map((c) => c.key);
    return this.rowActions().length ? [...cols, '__actions__'] : cols;
  });

  readonly skeletonRows = computed(() => Array.from({ length: this.pageSize() }, (_, i) => i));

  readonly viewData = computed<T[]>(() => {
    if (this.serverSide()) {
      return this.data();
    }
    let rows = [...this.data()];
    const sort = this.clientSort;
    if (sort.active && sort.direction) {
      const col = this.columns().find((c) => c.key === sort.active);
      rows.sort((a, b) => {
        const av = col?.value ? col.value(a) : (a as Record<string, unknown>)[sort.active];
        const bv = col?.value ? col.value(b) : (b as Record<string, unknown>)[sort.active];
        const cmp = String(av ?? '').localeCompare(String(bv ?? ''), undefined, { numeric: true });
        return sort.direction === 'asc' ? cmp : -cmp;
      });
    }
    const start = this.clientPage.pageIndex * this.clientPage.pageSize;
    return rows.slice(start, start + this.clientPage.pageSize);
  });

  readonly effectiveTotal = computed(() => (this.serverSide() ? this.totalCount() : this.data().length));

  templateFor(key: string): TemplateRef<unknown> | null {
    const match = this.customTemplates().find((d) => d.appColumnDef() === key);
    return match ? match.tpl : null;
  }

  cellValue(col: ColumnDef<T>, row: T): unknown {
    const raw = this.rawValue(col, row);
    if (col.truncate && typeof raw === 'string' && raw.length > col.truncate) {
      return raw.substring(0, col.truncate) + '…';
    }
    return raw;
  }

  /**
   * Full text for a cell that was cut short, empty otherwise — an unconditional tooltip
   * would pop up over every short cell repeating what is already on screen.
   */
  cellTooltip(col: ColumnDef<T>, row: T): string {
    if (!col.truncate) return '';
    const raw = this.rawValue(col, row);
    return typeof raw === 'string' && raw.length > col.truncate ? raw : '';
  }

  private rawValue(col: ColumnDef<T>, row: T): unknown {
    return col.value ? col.value(row) : (row as Record<string, unknown>)[col.key];
  }

  onPage(e: PageEvent): void {
    if (this.serverSide()) {
      this.pageChange.emit({ pageIndex: e.pageIndex, pageSize: e.pageSize });
    } else {
      this.clientPage = { pageIndex: e.pageIndex, pageSize: e.pageSize };
      this.pageChange.emit({ pageIndex: e.pageIndex, pageSize: e.pageSize });
    }
  }

  onSort(e: Sort): void {
    if (this.serverSide()) {
      this.sortChange.emit({ active: e.active, direction: e.direction });
    } else {
      this.clientSort = e;
      this.sortChange.emit({ active: e.active, direction: e.direction });
    }
  }

  onRowClick(row: T): void {
    if (this.clickableRows()) {
      this.rowClick.emit(row);
    }
  }

  visibleActions(row: T): RowAction<T>[] {
    return this.rowActions().filter((a) => (a.show ? a.show(row) : true));
  }
}

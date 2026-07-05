import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDialog } from '@angular/material/dialog';
import { FallbackPoliciesService } from './fallback-policies.service';
import { FallbackPolicyDto } from '../../core/models/fallback-policy.model';
import { NotificationService } from '../../core/services/notification.service';
import { ConfirmService } from '../../shared/components/confirm-dialog/confirm.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ColumnDef, DataTableComponent, RowAction } from '../../shared/components/data-table/data-table.component';
import { ChannelTypePipe } from '../../shared/pipes/channel-type.pipe';
import { PolicyFormDialogComponent } from './components/policy-form-dialog/policy-form-dialog.component';

type Row = FallbackPolicyDto;

@Component({
  selector: 'app-fallback-policies',
  standalone: true,
  imports: [
    MatButtonModule, MatIconModule, MatChipsModule, MatSlideToggleModule, PageHeaderComponent, DataTableComponent,
  ],
  templateUrl: './fallback-policies.component.html',
  styleUrl: './fallback-policies.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FallbackPoliciesComponent implements OnInit {
  private readonly service = inject(FallbackPoliciesService);
  private readonly dialog = inject(MatDialog);
  private readonly confirm = inject(ConfirmService);
  private readonly notify = inject(NotificationService);

  readonly loading = signal(false);
  readonly policies = signal<Row[]>([]);

  readonly columns: ColumnDef<Row>[] = [
    { key: 'name', header: 'Name', sortable: true },
    { key: 'triggerChannel', header: 'Trigger', value: (r) => new ChannelTypePipe().transform(r.triggerChannel) },
    { key: 'fallbackChannel', header: 'Fallback', value: (r) => new ChannelTypePipe().transform(r.fallbackChannel) },
    { key: 'description', header: 'Description', value: (r) => r.description ?? '—' },
    { key: 'isGlobal', header: 'Applies to All', type: 'custom' },
    { key: 'isActive', header: 'Active', type: 'custom' },
  ];

  readonly rowActions: RowAction<Row>[] = [
    { action: 'edit', icon: 'edit', tooltip: 'Edit', color: 'primary' },
    { action: 'delete', icon: 'delete', tooltip: 'Delete', color: 'warn' },
  ];

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.service.getAll().subscribe({
      next: (list) => {
        this.policies.set(list);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onAction(e: { action: string; row: Row }): void {
    if (e.action === 'edit') {
      this.openEdit(e.row);
    } else if (e.action === 'delete') {
      this.onDelete(e.row);
    }
  }

  openCreate(): void {
    const ref = this.dialog.open(PolicyFormDialogComponent, { data: {}, width: '480px' });
    ref.afterClosed().subscribe((result) => {
      if (result?.mode === 'create') {
        this.service.create(result.body).subscribe(() => {
          this.notify.success('Rule created.');
          this.load();
        });
      }
    });
  }

  openEdit(policy: Row): void {
    const ref = this.dialog.open(PolicyFormDialogComponent, { data: { policy }, width: '480px' });
    ref.afterClosed().subscribe((result) => {
      if (result?.mode === 'update') {
        this.service.update(result.id, result.body).subscribe(() => {
          this.notify.success('Rule updated.');
          this.load();
        });
      }
    });
  }

  toggleActive(policy: Row): void {
    this.service.toggleActive(policy.id).subscribe(() => {
      this.notify.success(`Rule ${policy.isActive ? 'deactivated' : 'activated'}.`);
      this.load();
    });
  }

  onDelete(policy: Row): void {
    this.confirm
      .confirm({ title: 'Delete Rule', message: `Delete "${policy.name}"? This cannot be undone.`, confirmLabel: 'Delete' })
      .subscribe((ok) => {
        if (ok) {
          this.service.remove(policy.id).subscribe(() => {
            this.notify.success('Rule deleted.');
            this.load();
          });
        }
      });
  }
}

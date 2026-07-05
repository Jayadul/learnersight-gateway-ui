import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { AdminUsersService } from './admin-users.service';
import { AdminUserDto } from '../../../core/models/admin-user.model';
import { AdminRole } from '../../../core/models/enums';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmService } from '../../../shared/components/confirm-dialog/confirm.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { ColumnDef, DataTableComponent, RowAction } from '../../../shared/components/data-table/data-table.component';
import { UserFormDialogComponent } from './components/user-form-dialog/user-form-dialog.component';

type Row = AdminUserDto;

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatChipsModule, PageHeaderComponent, DataTableComponent],
  templateUrl: './admin-users.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminUsersComponent implements OnInit {
  private readonly service = inject(AdminUsersService);
  private readonly dialog = inject(MatDialog);
  private readonly confirm = inject(ConfirmService);
  private readonly notify = inject(NotificationService);

  readonly loading = signal(false);
  readonly users = signal<Row[]>([]);

  readonly columns: ColumnDef<Row>[] = [
    { key: 'username', header: 'Username', sortable: true },
    { key: 'email', header: 'Email' },
    { key: 'role', header: 'Role', type: 'chip', value: (r) => (r.role === AdminRole.SuperAdmin ? 'Super Admin' : 'Admin') },
    { key: 'isActive', header: 'Active', type: 'badge', value: (r) => (r.isActive ? 'Active' : 'Inactive') },
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
        this.users.set(list);
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
    const ref = this.dialog.open(UserFormDialogComponent, { data: {}, width: '480px' });
    ref.afterClosed().subscribe((result) => {
      if (result?.mode === 'create') {
        this.service.create(result.body).subscribe(() => {
          this.notify.success('User created.');
          this.load();
        });
      }
    });
  }

  openEdit(user: Row): void {
    const ref = this.dialog.open(UserFormDialogComponent, { data: { user }, width: '480px' });
    ref.afterClosed().subscribe((result) => {
      if (result?.mode === 'update') {
        this.service.update(result.id, result.body).subscribe(() => {
          this.notify.success('User updated.');
          this.load();
        });
      }
    });
  }

  onDelete(user: Row): void {
    this.confirm
      .confirm({ title: 'Delete User', message: `Delete "${user.username}"? This cannot be undone.`, confirmLabel: 'Delete' })
      .subscribe((ok) => {
        if (ok) {
          this.service.remove(user.id).subscribe(() => {
            this.notify.success('User deleted.');
            this.load();
          });
        }
      });
  }
}

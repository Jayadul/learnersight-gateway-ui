import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  AdminUserDto, CreateAdminUserRequest, UpdateAdminUserRequest,
} from '../../../../../core/models/admin-user.model';
import { AdminRole } from '../../../../../core/models/enums';
import { FormFieldErrorsComponent } from '../../../../../shared/components/form-field-errors/form-field-errors.component';

export interface UserFormDialogData {
  user?: AdminUserDto;
}

@Component({
  selector: 'app-user-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatSlideToggleModule, MatButtonModule, MatIconModule, FormFieldErrorsComponent,
  ],
  templateUrl: './user-form-dialog.component.html',
  styleUrl: './user-form-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserFormDialogComponent {
  private readonly fb = inject(FormBuilder);
  readonly data = inject<UserFormDialogData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<UserFormDialogComponent>);

  readonly isEdit = !!this.data.user;
  readonly hidePassword = signal(true);

  readonly roles = [
    { label: 'Super Admin', value: AdminRole.SuperAdmin },
    { label: 'Admin', value: AdminRole.Admin },
  ];

  readonly form = this.fb.nonNullable.group({
    username: [{ value: this.data.user?.username ?? '', disabled: this.isEdit }, Validators.required],
    email: [this.data.user?.email ?? '', [Validators.required, Validators.email]],
    password: [''],
    newPassword: [''],
    role: [this.data.user?.role ?? AdminRole.Admin, Validators.required],
    isActive: [this.data.user?.isActive ?? true],
  });

  constructor() {
    if (!this.isEdit) {
      this.form.controls.password.setValidators([Validators.required, Validators.minLength(6)]);
      this.form.controls.password.updateValueAndValidity();
    }
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    if (this.isEdit) {
      const body: UpdateAdminUserRequest = {
        email: v.email,
        role: v.role,
        isActive: v.isActive,
        newPassword: v.newPassword || null,
      };
      this.dialogRef.close({ mode: 'update', id: this.data.user!.id, body });
    } else {
      const body: CreateAdminUserRequest = {
        username: v.username,
        password: v.password,
        email: v.email,
        role: v.role,
      };
      this.dialogRef.close({ mode: 'create', body });
    }
  }
}

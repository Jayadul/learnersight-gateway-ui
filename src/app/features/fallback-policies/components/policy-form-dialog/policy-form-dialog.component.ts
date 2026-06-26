import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import {
  CreateFallbackPolicyRequest, FallbackPolicyDto, UpdateFallbackPolicyRequest,
} from '../../../../core/models/fallback-policy.model';
import { ChannelType } from '../../../../core/models/enums';
import { differentChannelsValidator } from '../../../../core/forms/validators';
import { FormFieldErrorsComponent } from '../../../../shared/components/form-field-errors/form-field-errors.component';

export interface PolicyFormDialogData {
  policy?: FallbackPolicyDto;
}

@Component({
  selector: 'app-policy-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatCheckboxModule, MatButtonModule, FormFieldErrorsComponent,
  ],
  templateUrl: './policy-form-dialog.component.html',
  styleUrl: './policy-form-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PolicyFormDialogComponent {
  private readonly fb = inject(FormBuilder);
  readonly data = inject<PolicyFormDialogData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<PolicyFormDialogComponent>);

  readonly isEdit = !!this.data.policy;

  readonly channels = [
    { label: 'SMS', value: ChannelType.SMS },
    { label: 'WhatsApp Text', value: ChannelType.WP_Text },
    { label: 'WhatsApp Media', value: ChannelType.WP_Media },
    { label: 'Voice', value: ChannelType.Voice },
  ];

  readonly form = this.fb.nonNullable.group(
    {
      name: [this.data.policy?.name ?? '', Validators.required],
      triggerChannel: [this.data.policy?.triggerChannel ?? ChannelType.SMS, Validators.required],
      fallbackChannel: [this.data.policy?.fallbackChannel ?? ChannelType.WP_Text, Validators.required],
      isGlobal: [this.data.policy?.isGlobal ?? false],
      description: [this.data.policy?.description ?? ''],
    },
    { validators: differentChannelsValidator },
  );

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    if (this.isEdit) {
      const body: UpdateFallbackPolicyRequest = {
        name: v.name,
        triggerChannel: v.triggerChannel,
        fallbackChannel: v.fallbackChannel,
        isGlobal: v.isGlobal,
        description: v.description || undefined,
        isActive: this.data.policy!.isActive,
      };
      this.dialogRef.close({ mode: 'update', id: this.data.policy!.id, body });
    } else {
      const body: CreateFallbackPolicyRequest = {
        name: v.name,
        triggerChannel: v.triggerChannel,
        fallbackChannel: v.fallbackChannel,
        isGlobal: v.isGlobal,
        description: v.description || undefined,
      };
      this.dialogRef.close({ mode: 'create', body });
    }
  }
}

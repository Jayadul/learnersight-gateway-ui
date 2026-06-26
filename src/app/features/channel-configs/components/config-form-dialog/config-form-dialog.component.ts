import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ChannelConfigDto, CreateChannelConfigRequest, UpdateChannelConfigRequest } from '../../../../core/models/channel-config.model';
import { ChannelType } from '../../../../core/models/enums';
import { FormFieldErrorsComponent } from '../../../../shared/components/form-field-errors/form-field-errors.component';

export interface ConfigFormDialogData {
  channelType: ChannelType;
  config?: ChannelConfigDto;
}

interface FieldDef { key: string; label: string; password?: boolean; }

@Component({
  selector: 'app-config-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, FormFieldErrorsComponent,
  ],
  templateUrl: './config-form-dialog.component.html',
  styleUrl: './config-form-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfigFormDialogComponent {
  private readonly fb = inject(FormBuilder);
  readonly data = inject<ConfigFormDialogData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<ConfigFormDialogComponent>);

  readonly isEdit = !!this.data.config;
  readonly revealed = signal<Record<string, boolean>>({});

  readonly providerFields: FieldDef[] = this.fieldsForChannel(this.data.channelType);

  readonly form = this.buildForm();

  private fieldsForChannel(channel: ChannelType): FieldDef[] {
    switch (channel) {
      case ChannelType.SMS:
        return [
          { key: 'apikey', label: 'API Key', password: true },
          { key: 'secretkey', label: 'Secret Key', password: true },
          { key: 'callerID', label: 'Caller ID' },
          { key: 'baseUrl', label: 'Base URL' },
        ];
      case ChannelType.WP_Text:
      case ChannelType.WP_Media:
        return [
          { key: 'instance_id', label: 'Instance ID' },
          { key: 'access_token', label: 'Access Token', password: true },
          { key: 'baseUrl', label: 'Base URL' },
        ];
      case ChannelType.Voice:
        return [
          { key: 'owner', label: 'Owner' },
          { key: 'password', label: 'Password', password: true },
          { key: 'authUserId', label: 'Auth User ID' },
          { key: 'campaignId', label: 'Campaign ID' },
          { key: 'lotNumber', label: 'Lot Number' },
          { key: 'baseUrl', label: 'Base URL' },
        ];
      default:
        return [];
    }
  }

  private buildForm() {
    const group: Record<string, unknown> = {
      label: [this.data.config?.label ?? '', Validators.required],
      providerName: [this.data.config?.providerName ?? '', Validators.required],
    };
    for (const f of this.providerFields) {
      group[f.key] = [this.data.config?.configFields?.[f.key] ?? '', Validators.required];
    }
    return this.fb.group(group);
  }

  toggleReveal(key: string): void {
    this.revealed.update((r) => ({ ...r, [key]: !r[key] }));
  }

  inputType(field: FieldDef): string {
    if (!field.password) {
      return 'text';
    }
    return this.revealed()[field.key] ? 'text' : 'password';
  }

  control(key: string) {
    return this.form.get(key)!;
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.value as Record<string, string>;
    const configFields: Record<string, string> = {};
    for (const f of this.providerFields) {
      configFields[f.key] = raw[f.key];
    }
    const configJson = JSON.stringify(configFields);

    if (this.isEdit) {
      const body: UpdateChannelConfigRequest = {
        label: raw['label'],
        providerName: raw['providerName'],
        configJson,
      };
      this.dialogRef.close({ mode: 'update', id: this.data.config!.id, body });
    } else {
      const body: CreateChannelConfigRequest = {
        channelType: this.data.channelType,
        label: raw['label'],
        providerName: raw['providerName'],
        configJson,
      };
      this.dialogRef.close({ mode: 'create', body });
    }
  }
}

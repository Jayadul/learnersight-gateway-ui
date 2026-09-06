import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ChannelConfigDto, CreateChannelConfigRequest, UpdateChannelConfigRequest } from '../../../../core/models/channel-config.model';
import { ChannelType, Provider } from '../../../../core/models/enums';
import { FormFieldErrorsComponent } from '../../../../shared/components/form-field-errors/form-field-errors.component';

export interface ConfigFormDialogData {
  channelType: ChannelType;
  config?: ChannelConfigDto;
}

interface FieldDef {
  key: string;
  label: string;
  password?: boolean;
  /** Blank is allowed and means "use the system default". */
  optional?: boolean;
  hint?: string;
}

interface ProviderDef {
  value: Provider;
  label: string;
  fields: FieldDef[];
}

/** Every channel points at its provider's host; blank falls back to the system default. */
const BASE_URL: FieldDef = {
  key: 'baseUrl',
  label: 'Base URL',
  optional: true,
  hint: 'Leave empty to use the system default for this provider.',
};

/**
 * Which vendors serve each channel type, and what each one needs configured.
 * Mirrors ChannelConfigService.ProvidersFor on the backend — it lists providers that
 * have a registered sender, not every provider the enum knows about, so an admin cannot
 * save a channel that would throw on its first real message. See backend ADR 0008.
 */
const PROVIDERS: Readonly<Record<ChannelType, readonly ProviderDef[]>> = {
  [ChannelType.SMS]: [
    {
      value: Provider.Reve,
      label: 'REVE SMS',
      fields: [
        { key: 'apikey', label: 'API Key', password: true },
        { key: 'secretkey', label: 'Secret Key', password: true },
        { key: 'callerID', label: 'Caller ID' },
        BASE_URL,
      ],
    },
  ],
  [ChannelType.WP]: [
    {
      value: Provider.WaTrend,
      label: 'WaTrend',
      fields: [
        { key: 'instance_id', label: 'Instance ID' },
        { key: 'access_token', label: 'Access Token', password: true },
        BASE_URL,
      ],
    },
  ],
  [ChannelType.Voice]: [
    {
      // Spelled out in full: the WhatsApp vendor arriving in R3.1 is also NetZero-branded
      // and unrelated, and the product itself is NetZero Gateway.
      value: Provider.NetZeroVoice,
      label: 'NetZero Voice',
      fields: [
        { key: 'owner', label: 'Owner' },
        { key: 'password', label: 'Password', password: true },
        { key: 'authUserId', label: 'Auth User ID' },
        { key: 'campaignId', label: 'Campaign ID' },
        { key: 'lotNumber', label: 'Lot Number' },
        BASE_URL,
      ],
    },
  ],
};

@Component({
  selector: 'app-config-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule,
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
  /** Pacing is only meaningful for WhatsApp, which sends one job per recipient. */
  readonly isWhatsApp = this.data.channelType === ChannelType.WP;
  readonly revealed = signal<Record<string, boolean>>({});

  readonly providers = PROVIDERS[this.data.channelType] ?? [];

  /** Editing keeps the saved provider; adding starts on the type's first one. */
  readonly provider = signal<Provider>(
    this.data.config?.provider ?? this.providers[0]?.value ?? Provider.Reve,
  );

  readonly providerFields = computed<FieldDef[]>(
    () => this.providers.find((p) => p.value === this.provider())?.fields ?? [],
  );

  /** Tag prefix for this channel type, used in the worked example under the slug field. */
  readonly tagPrefix =
    this.data.channelType === ChannelType.SMS ? 'sms'
    : this.data.channelType === ChannelType.Voice ? 'call'
    : 'wp';

  /**
   * What the slug will actually be: the typed value, else the one the backend would
   * derive from the display name, else a placeholder. Mirrors ChannelConfigService.Slugify.
   */
  get slugPreview(): string {
    const typed = (this.form?.get('labelSlug')?.value as string | null)?.trim();
    if (typed) return typed;

    const derived = ((this.form?.get('label')?.value as string | null) ?? '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
    return derived || 'yourlabel';
  }

  readonly form = this.buildForm();

  private buildForm() {
    const group: Record<string, unknown> = {
      label: [this.data.config?.label ?? '', Validators.required],
      // Optional: the backend derives one from the label when left blank. The pattern
      // mirrors the server rule -- lowercase alphanumeric, no hyphens, because the
      // combined tag form splits on "-wp:".
      labelSlug: [this.data.config?.labelSlug ?? '', Validators.pattern(/^[a-z0-9]*$/)],
      providerName: [this.data.config?.providerName ?? '', Validators.required],
      // WhatsApp-only pacing; the backend rejects anything outside 0..300.
      delaySeconds: [
        this.data.config?.delaySeconds ?? 0,
        [Validators.required, Validators.min(0), Validators.max(300)],
      ],
    };
    // Every provider's fields get a control up front, so switching provider only changes
    // which are shown and validated — anything already typed survives a switch back.
    for (const p of this.providers) {
      for (const f of p.fields) {
        if (f.key in group) continue;
        group[f.key] = [
          this.data.config?.configFields?.[f.key] ?? '',
          f.optional ? [] : Validators.required,
        ];
      }
    }
    return this.fb.group(group);
  }

  onProviderChange(value: Provider): void {
    this.provider.set(value);

    // Only the selected provider's required fields should block a save; a hidden field
    // left blank from another provider must not make the form silently invalid.
    const shown = new Set(this.providerFields().filter((f) => !f.optional).map((f) => f.key));
    for (const p of this.providers) {
      for (const f of p.fields) {
        const control = this.form.get(f.key) as FormControl | null;
        if (!control) continue;
        if (shown.has(f.key)) control.addValidators(Validators.required);
        else control.removeValidators(Validators.required);
        control.updateValueAndValidity({ emitEvent: false });
      }
    }

    // Prefill the display name on a new channel so the common case needs no typing.
    if (!this.isEdit) {
      const label = this.providers.find((p) => p.value === value)?.label ?? '';
      this.form.get('providerName')?.setValue(label);
    }
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
    // Only the selected provider's keys are persisted — carrying another provider's
    // credentials along would leave dead secrets in the channel's encrypted config.
    for (const f of this.providerFields()) {
      configFields[f.key] = raw[f.key] ?? '';
    }
    const configJson = JSON.stringify(configFields);

    if (this.isEdit) {
      const body: UpdateChannelConfigRequest = {
        label: raw['label'],
        ...(raw['labelSlug']?.trim() ? { labelSlug: raw['labelSlug'].trim() } : {}),
        provider: this.provider(),
        providerName: raw['providerName'],
        delaySeconds: this.isWhatsApp ? Number(raw['delaySeconds'] ?? 0) : 0,
        configJson,
      };
      this.dialogRef.close({ mode: 'update', id: this.data.config!.id, body });
    } else {
      const body: CreateChannelConfigRequest = {
        channelType: this.data.channelType,
        ...(raw['labelSlug']?.trim() ? { labelSlug: raw['labelSlug'].trim() } : {}),
        label: raw['label'],
        provider: this.provider(),
        providerName: raw['providerName'],
        delaySeconds: this.isWhatsApp ? Number(raw['delaySeconds'] ?? 0) : 0,
        configJson,
      };
      this.dialogRef.close({ mode: 'create', body });
    }
  }
}

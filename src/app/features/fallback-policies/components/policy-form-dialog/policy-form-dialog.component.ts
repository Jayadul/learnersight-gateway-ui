import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  CreateFallbackPolicyRequest, FallbackPolicyDto, UpdateFallbackPolicyRequest,
} from '../../../../core/models/fallback-policy.model';
import { ChannelConfigDto } from '../../../../core/models/channel-config.model';
import { ChannelType, Provider } from '../../../../core/models/enums';
import { differentChannelsValidator } from '../../../../core/forms/validators';
import { ChannelConfigsService } from '../../../channel-configs/channel-configs.service';
import { ConfirmService } from '../../../../shared/components/confirm-dialog/confirm.service';
import { FormFieldErrorsComponent } from '../../../../shared/components/form-field-errors/form-field-errors.component';

export interface PolicyFormDialogData {
  policy?: FallbackPolicyDto;
}

@Component({
  selector: 'app-policy-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatSlideToggleModule, MatButtonModule, MatIconModule, FormFieldErrorsComponent,
  ],
  templateUrl: './policy-form-dialog.component.html',
  styleUrl: './policy-form-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PolicyFormDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly channelsService = inject(ChannelConfigsService);
  private readonly confirm = inject(ConfirmService);
  readonly data = inject<PolicyFormDialogData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<PolicyFormDialogComponent>);

  readonly isEdit = !!this.data.policy;

  readonly channels = [
    { label: 'SMS', value: ChannelType.SMS },
    { label: 'WhatsApp', value: ChannelType.WP },
    { label: 'Voice', value: ChannelType.Voice },
  ];

  /** Active channels of the chosen type, for each side of the rule. */
  readonly triggerOptions = signal<ChannelConfigDto[]>([]);
  readonly fallbackOptions = signal<ChannelConfigDto[]>([]);

  readonly form = this.fb.nonNullable.group(
    {
      name: [this.data.policy?.name ?? '', Validators.required],
      triggerChannel: [this.data.policy?.triggerChannel ?? ChannelType.SMS, Validators.required],
      triggerChannelConfigId: [this.data.policy?.triggerChannelConfigId ?? ''],
      // Defaults to the trigger's own type: a rule stays within a channel type unless
      // cross-channel is deliberately enabled.
      fallbackChannel: [this.data.policy?.fallbackChannel ?? ChannelType.SMS, Validators.required],
      fallbackChannelConfigId: [this.data.policy?.fallbackChannelConfigId ?? ''],
      allowCrossChannel: [this.data.policy?.allowCrossChannel ?? false],
      isGlobal: [this.data.policy?.isGlobal ?? false],
      isActive: [this.data.policy?.isActive ?? false],
      description: [this.data.policy?.description ?? ''],
    },
    { validators: differentChannelsValidator },
  );

  /** Same-type rules must name both channels, so the selects stop being optional. */
  get isSameType(): boolean {
    return this.form.controls.triggerChannel.value === this.form.controls.fallbackChannel.value;
  }

  constructor() {
    this.loadChannels('trigger', this.form.controls.triggerChannel.value);
    this.loadChannels('fallback', this.form.controls.fallbackChannel.value);
    this.applyCrossChannelLock(this.form.controls.allowCrossChannel.value);

    // Changing a type invalidates the channel chosen under the old one.
    this.form.controls.triggerChannel.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((type) => {
        this.form.controls.triggerChannelConfigId.setValue('');
        this.loadChannels('trigger', type);

        // While the rule is locked to one type, the fallback follows the trigger.
        if (!this.form.controls.allowCrossChannel.value) {
          this.form.controls.fallbackChannel.setValue(type);
        }
      });

    this.form.controls.fallbackChannel.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((type) => {
        this.form.controls.fallbackChannelConfigId.setValue('');
        this.loadChannels('fallback', type);
      });
  }

  private loadChannels(side: 'trigger' | 'fallback', type: ChannelType): void {
    this.channelsService.getByChannel(type).subscribe((all) => {
      // Only active channels can receive traffic, so only they are selectable.
      // A template channel cannot carry a retried text or media message.
      const active = all.filter((c) => c.isActive && c.provider !== Provider.NetZeroInboxTemplate);
      (side === 'trigger' ? this.triggerOptions : this.fallbackOptions).set(active);
    });
  }

  /**
   * Crossing channel types changes both the delivery format and the cost of a message,
   * so it is confirmed explicitly rather than silently toggled.
   */
  onCrossChannelToggle(enabled: boolean): void {
    if (!enabled) {
      this.applyCrossChannelLock(false);
      return;
    }

    this.confirm
      .confirm({
        title: 'Allow fallback to a different channel?',
        message:
          'This rule will retry failed messages on a different channel type. The message '
          + 'is delivered in that channel’s format and billed at its rate, which may cost '
          + 'more than the original send. Only enable this if that is intended.',
        confirmLabel: 'Allow cross-channel',
      })
      .subscribe((ok) => {
        if (!ok) this.form.controls.allowCrossChannel.setValue(false);
        this.applyCrossChannelLock(ok);
      });
  }

  /**
   * Locked, the fallback type mirrors the trigger and cannot be changed — the rule can
   * only ever pick another channel of the same type. Unlocking is what opens all three
   * types up, so an unintended cross-type rule cannot be built by accident.
   */
  private applyCrossChannelLock(crossChannelEnabled: boolean): void {
    const fallbackType = this.form.controls.fallbackChannel;

    if (crossChannelEnabled) {
      fallbackType.enable({ emitEvent: false });
      return;
    }

    fallbackType.setValue(this.form.controls.triggerChannel.value);
    fallbackType.disable({ emitEvent: false });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const shared = {
      name: v.name,
      triggerChannel: v.triggerChannel,
      fallbackChannel: v.fallbackChannel,
      // Empty select means "any / the default channel of this type" — send null, not ''.
      triggerChannelConfigId: v.triggerChannelConfigId || null,
      fallbackChannelConfigId: v.fallbackChannelConfigId || null,
      allowCrossChannel: v.allowCrossChannel,
      isGlobal: v.isGlobal,
      description: v.description || undefined,
    };

    if (this.isEdit) {
      const body: UpdateFallbackPolicyRequest = { ...shared, isActive: v.isActive };
      this.dialogRef.close({ mode: 'update', id: this.data.policy!.id, body });
    } else {
      const body: CreateFallbackPolicyRequest = shared;
      this.dialogRef.close({ mode: 'create', body });
    }
  }
}

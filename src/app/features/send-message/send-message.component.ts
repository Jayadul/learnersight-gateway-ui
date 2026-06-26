import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SendMessageService } from './send-message.service';
import { NotificationService } from '../../core/services/notification.service';
import { ChannelType } from '../../core/models/enums';
import { ManualSendRequest } from '../../core/models/manual-send.model';
import { phoneListValidator, urlValidator } from '../../core/forms/validators';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { FormFieldErrorsComponent } from '../../shared/components/form-field-errors/form-field-errors.component';

@Component({
  selector: 'app-send-message',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatCardModule, MatButtonToggleModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatDividerModule, MatProgressSpinnerModule,
    PageHeaderComponent, FormFieldErrorsComponent,
  ],
  templateUrl: './send-message.component.html',
  styleUrl: './send-message.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SendMessageComponent {
  private readonly fb      = inject(FormBuilder);
  private readonly service = inject(SendMessageService);
  private readonly notify  = inject(NotificationService);

  readonly ChannelType = ChannelType;
  readonly loading = signal(false);

  readonly form = this.fb.nonNullable.group({
    channelType: [ChannelType.SMS, Validators.required],
    toNumbers:   ['', [Validators.required, phoneListValidator]],
    message:     ['', Validators.required],
    mediaUrl:    [''],
    campaignId:  [''],
    callerID:    [''],
  });

  private readonly selectedChannel = toSignal(this.form.controls.channelType.valueChanges, {
    initialValue: this.form.controls.channelType.value,
  });
  private readonly toNumbersRaw = toSignal(this.form.controls.toNumbers.valueChanges, {
    initialValue: this.form.controls.toNumbers.value,
  });

  readonly isVoice  = computed(() => this.selectedChannel() === ChannelType.Voice);
  readonly isMedia  = computed(() => this.selectedChannel() === ChannelType.WP_Media);
  readonly isSms    = computed(() => this.selectedChannel() === ChannelType.SMS);
  readonly isWpText = computed(() => this.selectedChannel() === ChannelType.WP_Text);

  readonly parsedCount = computed(() => {
    const raw = this.toNumbersRaw() ?? '';
    return raw.split(',').map((s) => s.trim()).filter((s) => s.length > 0).length;
  });

  constructor() {
    this.form.controls.channelType.valueChanges.pipe(takeUntilDestroyed()).subscribe((channel) => {
      const media    = this.form.controls.mediaUrl;
      const campaign = this.form.controls.campaignId;

      if (channel === ChannelType.WP_Media) {
        media.setValidators([Validators.required, urlValidator]);
      } else {
        media.clearValidators();
        media.setValue('');
      }

      if (channel === ChannelType.Voice) {
        campaign.setValidators([Validators.required]);
      } else {
        campaign.clearValidators();
        campaign.setValue('');
      }

      if (channel !== ChannelType.SMS) {
        this.form.controls.callerID.setValue('');
      }

      media.updateValueAndValidity();
      campaign.updateValueAndValidity();
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const body: ManualSendRequest = {
      channelType: v.channelType,
      toNumbers:   v.toNumbers,
      message:     v.message,
      ...(v.channelType === ChannelType.WP_Media && { mediaUrl: v.mediaUrl }),
      ...(v.channelType === ChannelType.Voice    && { campaignId: v.campaignId }),
      ...(v.channelType === ChannelType.SMS && v.callerID && { callerID: v.callerID }),
    };

    this.loading.set(true);
    this.service.send(body).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.notify.success(`Message accepted — Request ID: ${res.messageRequestId}`);
        this.form.reset({ channelType: v.channelType });
      },
      error: () => this.loading.set(false),
    });
  }
}

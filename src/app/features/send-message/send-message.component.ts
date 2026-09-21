import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SendMessageService } from './send-message.service';
import { NotificationService } from '../../core/services/notification.service';
import { ChannelType } from '../../core/models/enums';
import { ChannelOptionDto } from '../../core/models/channel-config.model';
import { ChannelOptionsService } from '../../core/services/channel-options.service';
import { ManualSendRequest, SendTemplateRequest } from '../../core/models/manual-send.model';
import { phoneListValidator, urlValidator } from '../../core/forms/validators';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { FormFieldErrorsComponent } from '../../shared/components/form-field-errors/form-field-errors.component';

type WpSendMode = 'message' | 'template';

@Component({
  selector: 'app-send-message',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatCardModule, MatButtonToggleModule, MatFormFieldModule, MatInputModule,
    MatSelectModule,
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
  private readonly channelsService = inject(ChannelOptionsService);
  private readonly notify  = inject(NotificationService);

  readonly ChannelType = ChannelType;
  readonly loading = signal(false);

  /** Active channels of the selected type — several gateways may be live at once. */
  readonly channelOptions = signal<ChannelOptionDto[]>([]);

  /** WhatsApp only: plain text/media vs a Meta pre-approved template. */
  readonly sendMode = signal<WpSendMode>('message');
  /** Only channels with a Template API Token configured can serve a template send. */
  readonly templateChannelOptions = computed(() =>
    this.channelOptions().filter((c) => c.hasTemplateToken));

  readonly templateForm = this.fb.nonNullable.group({
    channelLabelSlug: ['', Validators.required],
    recipient: ['', [Validators.required, phoneListValidator]],
    templateName: ['', Validators.required],
    mediaUrl: ['', urlValidator],
    // Optional override. Blank means "use the channel's configured Template API Token" —
    // same pattern as callerId/campaignId/lotNumber on the text/voice path.
    token: [''],
  });
  /** Count varies per template, so this is a plain add/remove list, not a fixed shape. */
  readonly exampleArr = this.fb.nonNullable.array<FormControl<string>>([]);

  readonly form = this.fb.nonNullable.group({
    channelType: [ChannelType.SMS, Validators.required],
    toNumbers:   ['', [Validators.required, phoneListValidator]],
    message:     ['', Validators.required],
    mediaUrl:    [''],
    // Optional overrides. Blank means "use whatever the channel is configured with", so
    // leaving one alone can never clear a stored setting.
    channelLabelSlug: [''],
    callerId:         [''],
    campaignId:       [''],
    lotNumber:        [''],
  });

  private readonly selectedChannel = toSignal(this.form.controls.channelType.valueChanges, {
    initialValue: this.form.controls.channelType.value,
  });
  private readonly toNumbersRaw = toSignal(this.form.controls.toNumbers.valueChanges, {
    initialValue: this.form.controls.toNumbers.value,
  });

  readonly isVoice = computed(() => this.selectedChannel() === ChannelType.Voice);
  readonly isSms   = computed(() => this.selectedChannel() === ChannelType.SMS);
  readonly isWp    = computed(() => this.selectedChannel() === ChannelType.WP);
  readonly isTemplateMode = computed(() => this.isWp() && this.sendMode() === 'template');

  readonly parsedCount = computed(() => {
    const raw = this.toNumbersRaw() ?? '';
    return raw.split(',').map((s) => s.trim()).filter((s) => s.length > 0).length;
  });

  constructor() {
    this.loadChannels(this.form.controls.channelType.value);

    this.form.controls.channelType.valueChanges.pipe(takeUntilDestroyed()).subscribe((channel) => {
      this.loadChannels(channel);
      // Template mode only exists on WhatsApp — leaving it drops back to plain text/media.
      if (channel !== ChannelType.WP) this.sendMode.set('message');
      const media   = this.form.controls.mediaUrl;
      const message = this.form.controls.message;

      // Media URL — optional on WhatsApp (a URL turns the send into a media message),
      // and not offered at all on the other channels.
      if (channel === ChannelType.WP) {
        media.setValidators([urlValidator]);
      } else {
        media.clearValidators();
        media.setValue('');
      }

      // Message — required for every channel except Voice (campaign is pre-configured)
      if (channel === ChannelType.Voice) {
        message.clearValidators();
        message.setValue('');
      } else {
        message.setValidators([Validators.required]);
      }

      media.updateValueAndValidity();
      message.updateValueAndValidity();
    });
  }

  /**
   * Preselects the type's default channel rather than leaving the select blank: that is
   * where an unlabelled send goes anyway, so a blank box would misrepresent what happens.
   */
  private loadChannels(type: ChannelType): void {
    this.channelsService.getByChannel(type).subscribe((all) => {
      const active = all.filter((c) => c.isActive);
      this.channelOptions.set(active);

      const preferred = active.find((c) => c.isDefault) ?? active[0];
      this.form.controls.channelLabelSlug.setValue(preferred?.labelSlug ?? '');

      const preferredTemplate = active.find((c) => c.hasTemplateToken);
      this.templateForm.controls.channelLabelSlug.setValue(preferredTemplate?.labelSlug ?? '');
    });
  }

  addVariable(): void {
    this.exampleArr.push(this.fb.nonNullable.control('', Validators.required));
  }

  removeVariable(index: number): void {
    this.exampleArr.removeAt(index);
  }

  submit(): void {
    if (this.isTemplateMode()) {
      this.submitTemplate();
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const body: ManualSendRequest = {
      channelType: v.channelType, // numeric enum value — backend expects integer (SMS=0, WP=1, Voice=3)
      toNumbers:   v.toNumbers,
      ...(v.channelType !== ChannelType.Voice && { message: v.message }),
      // Only send mediaUrl when one was actually entered — its presence is what makes
      // the backend dispatch this as WhatsApp media rather than text.
      ...(v.channelType === ChannelType.WP && v.mediaUrl.trim() !== '' && { mediaUrl: v.mediaUrl }),
      ...(v.channelLabelSlug !== '' && { channelLabelSlug: v.channelLabelSlug }),
      ...(v.channelType === ChannelType.SMS && v.callerId.trim() !== '' && { callerId: v.callerId.trim() }),
      ...(v.channelType === ChannelType.Voice && v.campaignId.trim() !== '' && { campaignId: v.campaignId.trim() }),
      ...(v.channelType === ChannelType.Voice && v.lotNumber.trim() !== '' && { lotNumber: v.lotNumber.trim() }),
    };

    this.loading.set(true);
    this.service.send(body).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.notify.success(`Message queued. Request ID: ${res.messageRequestId}`);
        // Keep the channel the admin picked; resetting it would silently move the next
        // send back to the default gateway.
        this.form.reset({ channelType: v.channelType, channelLabelSlug: v.channelLabelSlug });
      },
      error: () => this.loading.set(false),
    });
  }

  private submitTemplate(): void {
    this.templateForm.markAllAsTouched();
    this.exampleArr.markAllAsTouched();
    if (this.templateForm.invalid || this.exampleArr.invalid) return;

    const v = this.templateForm.getRawValue();
    const body: SendTemplateRequest = {
      channelLabelSlug: v.channelLabelSlug,
      toNumber: v.recipient.trim(),
      templateName: v.templateName.trim(),
      exampleArr: this.exampleArr.controls.map((c) => c.value.trim()),
      ...(v.mediaUrl.trim() !== '' && { mediaUrl: v.mediaUrl.trim() }),
      ...(v.token.trim() !== '' && { token: v.token.trim() }),
    };

    this.loading.set(true);
    this.service.sendTemplate(body).subscribe({
      next: (res) => {
        this.loading.set(false);
        // The backend answers 200 either way for a template send (it is synchronous, not
        // queued), so success/failure is read from the status field, not the HTTP result.
        if (res.status === 'sent') {
          this.notify.success('Template sent.');
          this.templateForm.reset({ channelLabelSlug: v.channelLabelSlug });
          this.exampleArr.clear();
        } else {
          this.notify.error('The template could not be sent. Check Message Logs for the provider reply.');
        }
      },
      error: () => this.loading.set(false),
    });
  }
}

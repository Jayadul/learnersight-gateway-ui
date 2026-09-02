import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { environment } from '../../../environments/environment';
import { NotificationService } from '../../core/services/notification.service';
import { SendTextGatewayResponse } from '../../core/models/sendtext.model';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { FormFieldErrorsComponent } from '../../shared/components/form-field-errors/form-field-errors.component';
import { CopyButtonComponent } from '../../shared/components/copy-button/copy-button.component';
import { SendTextApiService } from './sendtext-api.service';
import { ChannelConfigsService } from '../channel-configs/channel-configs.service';
import { ChannelConfigDto } from '../../core/models/channel-config.model';
import { ChannelType } from '../../core/models/enums';
import { ChannelTypePipe } from '../../shared/pipes/channel-type.pipe';
import { GatewayCredentialsService } from '../settings/gateway-credentials/gateway-credentials.service';

// Demonstrates the messaging tags in one request: SMS, WhatsApp text, WhatsApp with
// media (same tag, ||url body), and the SMS+WhatsApp combo. The labels are placeholders —
// the Gateway Labels table on the page lists the real ones.
//
// No [call:…] tag on purpose: pressing Send would place a real outbound call and bill for
// it. The guide documents the voice tag; the one-click example must not fire one.
const EXAMPLE_MESSAGE =
  '[sms:revemain::Your OTP is 123456. It expires in 10 minutes.] ' +
  '[wp:waprimary::Hello, your appointment is confirmed for tomorrow at 3:00 PM.] ' +
  '[wp:waprimary::Please review the attached invoice.||https://example.com/files/invoice.pdf] ' +
  '[sms:revemain-wp:waprimary::Big sale this weekend! Visit https://example.com]';

@Component({
  selector: 'app-sendtext-api',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatDividerModule, MatProgressSpinnerModule,
    PageHeaderComponent, FormFieldErrorsComponent, CopyButtonComponent, ChannelTypePipe,
  ],
  templateUrl: './sendtext-api.component.html',
  styleUrl: './sendtext-api.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SendTextApiComponent {
  private readonly fb      = inject(FormBuilder);
  private readonly service = inject(SendTextApiService);
  private readonly notify  = inject(NotificationService);
  private readonly channels = inject(ChannelConfigsService);
  private readonly credentials = inject(GatewayCredentialsService);
  private readonly destroyRef = inject(DestroyRef);

  /** Base URL shown in the docs — the origin serving this page (nginx proxies /sendtext). */
  readonly baseUrl = environment.apiUrl || window.location.origin;

  readonly loading  = signal(false);
  readonly response = signal<SendTextGatewayResponse | null>(null);

  readonly hideSecret = signal(true);
  readonly hideApiKey = signal(true);

  /**
   * The gateways an integrator can actually name. Every tag carries a label now, so the
   * page has to show which ones exist — a guide listing only placeholder slugs would
   * document tags that reject.
   */
  readonly channelsLoading = signal(true);
  readonly labelledChannels = signal<ChannelConfigDto[]>([]);

  readonly form = this.fb.nonNullable.group({
    // pre-filled from Gateway Credentials once loaded; editable to test a rejection
    apikey:         ['', Validators.required],
    secretkey:      ['', Validators.required],
    callerID:       ['', Validators.required],
    toUser:         ['8801700000001', Validators.required],
    messageContent: [EXAMPLE_MESSAGE, Validators.required],
  });

  private readonly formValue = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });

  constructor() {
    // Pre-fill the real credentials. Before 2.1 these were an SMS channel's keys and the
    // page told you to copy them from Channels by hand; now the gateway owns them and
    // this screen is SuperAdmin-only, so there is nothing gained by making you fetch them.
    this.credentials
      .get()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (c) => {
          if (!c.isReadable) return;
          this.form.controls.apikey.setValue(c.apiKey);
          this.form.controls.secretkey.setValue(c.secretKey);
          // callerID is recorded with the request, never used to authenticate, so the
          // credential username is a sensible default rather than a meaningful one.
          if (!this.form.controls.callerID.value) {
            this.form.controls.callerID.setValue(c.username);
          }
        },
        // A missing or unreadable row just means the fields stay empty and the caller
        // types them; the page is still usable.
        error: () => undefined,
      });

    this.channels
      .getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (list) => {
          // Inactive gateways are deliberately hidden: naming one rejects the request,
          // so listing it here would advertise a tag that cannot work.
          this.labelledChannels.set(list.filter((c) => c.isActive));
          this.channelsLoading.set(false);
        },
        error: () => this.channelsLoading.set(false),
      });
  }

  /** The exact tag that routes to one gateway, ready to copy out of the table. */
  tagFor(c: ChannelConfigDto): string {
    const prefix =
      c.channelType === ChannelType.SMS ? 'sms' : c.channelType === ChannelType.WP ? 'wp' : 'call';
    const body = prefix === 'call' ? 'CAMPAIGN_ID' : 'TEXT';
    return `[${prefix}:${c.labelSlug}::${body}]`;
  }


  /** Live cURL preview that mirrors exactly what the simulator sends. */
  readonly curlPreview = computed(() => {
    const v = this.formValue();
    return [
      `curl -X POST "${this.baseUrl}/sendtext" \\`,
      `  -H "Content-Type: application/x-www-form-urlencoded" \\`,
      `  --data-urlencode "apikey=${v.apikey || 'YOUR_API_KEY'}" \\`,
      `  --data-urlencode "secretkey=${v.secretkey || 'YOUR_SECRET_KEY'}" \\`,
      `  --data-urlencode "callerID=${v.callerID || 'YOUR_CALLER_ID'}" \\`,
      `  --data-urlencode "toUser=${v.toUser ?? ''}" \\`,
      `  --data-urlencode "messageContent=${v.messageContent ?? ''}"`,
    ].join('\n');
  });

  readonly responseJson = computed(() => {
    const r = this.response();
    return r ? JSON.stringify(r, null, 2) : '';
  });
  readonly accepted = computed(() => this.response()?.Status === '0');

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.response.set(null);
    const v = this.form.getRawValue();
    this.service.send(v)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.loading.set(false);
          this.response.set(res);
          if (res.Status === '0') {
            this.notify.success('Request accepted. Message queued for sending.');
          } else {
            this.notify.error('Request rejected. Check the API key, secret key, and caller ID.');
          }
        },
        error: () => this.loading.set(false),
      });
  }
}

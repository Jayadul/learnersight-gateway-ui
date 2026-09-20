import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { environment } from '../../../environments/environment';
import { NotificationService } from '../../core/services/notification.service';
import { BalanceLookupError, BalanceLookupResponse, SendTextGatewayResponse } from '../../core/models/sendtext.model';
import { HttpErrorResponse } from '@angular/common/http';
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
    MatButtonToggleModule, JsonPipe,
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
   * Which verb the simulator sends. GET exists for integrators whose platform cannot
   * easily do POST; POST stays the recommended default since it keeps credentials off
   * the URL.
   */
  readonly verb = signal<'POST' | 'GET'>('POST');

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


  /** Live cURL preview that mirrors exactly what the simulator sends, either verb. */
  readonly curlPreview = computed(() => {
    const v = this.formValue();
    if (this.verb() === 'GET') {
      const q = new URLSearchParams({
        apikey: v.apikey || 'YOUR_API_KEY',
        secretkey: v.secretkey || 'YOUR_SECRET_KEY',
        callerID: v.callerID || 'YOUR_CALLER_ID',
        toUser: v.toUser ?? '',
        messageContent: v.messageContent ?? '',
      });
      return `curl "${this.baseUrl}/sendtext?${q}"`;
    }
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

  // ── Balance lookup (GET /balance?callerID=) ───────────────────────────────
  // A FormGroup, not a bare FormControl: (ngSubmit) is an output of FormGroupDirective
  // ([formGroup]) or NgForm — this page only imports ReactiveFormsModule, so a <form>
  // without [formGroup] has no directive supplying ngSubmit at all, and the click falls
  // through to the browser's native form submit (a full page reload).
  readonly balanceForm = this.fb.nonNullable.group({ label: [''] });
  readonly balanceLoading = signal(false);
  readonly balanceResult = signal<BalanceLookupResponse | null>(null);
  readonly balanceError = signal<string | null>(null);

  private readonly balanceFormValue = toSignal(this.balanceForm.valueChanges, {
    initialValue: this.balanceForm.getRawValue(),
  });

  readonly balanceCurlPreview = computed(
    () => `curl "${this.baseUrl}/balance?callerID=${this.balanceFormValue().label || 'yourlabel'}"`,
  );
  readonly balanceLabelEmpty = computed(() => !(this.balanceFormValue().label ?? '').trim());

  /**
   * A real, currently-active SMS label from this deployment — "revemain" was a
   * generic doc example that does not exist as an actual label here (or on most
   * installations), which made a first-time balance check fail on the placeholder
   * text itself rather than a typo.
   */
  readonly balancePlaceholder = computed(() => {
    const sms = this.labelledChannels().find((c) => c.channelType === ChannelType.SMS);
    return sms?.labelSlug ?? 'yourlabel';
  });

  checkBalance(): void {
    const label = this.balanceForm.getRawValue().label.trim();
    if (!label) return;
    this.balanceLoading.set(true);
    this.balanceResult.set(null);
    this.balanceError.set(null);
    this.service.checkBalance(label).subscribe({
      next: (res) => {
        this.balanceLoading.set(false);
        this.balanceResult.set(res);
      },
      error: (err: HttpErrorResponse) => {
        this.balanceLoading.set(false);
        const body = err.error as BalanceLookupError | undefined;
        this.balanceError.set(body?.message ?? 'Unknown or unsupported label');
      },
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.response.set(null);
    const v = this.form.getRawValue();
    this.service.send(v, this.verb())
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

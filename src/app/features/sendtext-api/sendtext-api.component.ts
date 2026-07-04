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

// Demonstrates every supported tag in one request:
// SMS, WhatsApp text, SMS+WhatsApp combo, WhatsApp media, Voice campaign.
const EXAMPLE_MESSAGE =
  '[sms::Your OTP is 123456. It expires in 10 minutes.] ' +
  '[wp::Hello, your appointment is confirmed for tomorrow at 3:00 PM.] ' +
  '[smswp::Big sale this weekend! Visit https://example.com] ' +
  '[wpmedia::Please review the attached invoice.||https://example.com/files/invoice.pdf] ' +
  '[call::due-bill-api]';

@Component({
  selector: 'app-sendtext-api',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatDividerModule, MatProgressSpinnerModule,
    PageHeaderComponent, FormFieldErrorsComponent, CopyButtonComponent,
  ],
  templateUrl: './sendtext-api.component.html',
  styleUrl: './sendtext-api.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SendTextApiComponent {
  private readonly fb      = inject(FormBuilder);
  private readonly service = inject(SendTextApiService);
  private readonly notify  = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  /** Base URL shown in the docs — the origin serving this page (nginx proxies /sendtext). */
  readonly baseUrl = environment.apiUrl || window.location.origin;

  readonly loading  = signal(false);
  readonly response = signal<SendTextGatewayResponse | null>(null);

  readonly hideSecret = signal(true);

  readonly form = this.fb.nonNullable.group({
    // credentials are never pre-filled — the caller must supply their own
    apikey:         ['', Validators.required],
    secretkey:      ['', Validators.required],
    callerID:       ['', Validators.required],
    toUser:         ['8801700000001', Validators.required],
    messageContent: [EXAMPLE_MESSAGE, Validators.required],
  });

  private readonly formValue = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });

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
            this.notify.success('Accepted — message queued for dispatch');
          } else {
            this.notify.error('Rejected by the gateway');
          }
        },
        error: () => this.loading.set(false),
      });
  }
}

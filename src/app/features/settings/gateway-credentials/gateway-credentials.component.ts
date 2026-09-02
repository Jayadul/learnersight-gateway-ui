import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { environment } from '../../../../environments/environment';
import { NotificationService } from '../../../core/services/notification.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { FormFieldErrorsComponent } from '../../../shared/components/form-field-errors/form-field-errors.component';
import { CopyButtonComponent } from '../../../shared/components/copy-button/copy-button.component';
import { UpdateGatewayCredentialRequest } from '../../../core/models/gateway-credential.model';
import { GatewayCredentialsService } from './gateway-credentials.service';

/** Matches the seeded format, so a rotated key looks like the one it replaced. */
function randomKey(prefix: string, length: number): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  let out = '';
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return `${prefix}_${out}`;
}

/**
 * The credentials integrators send to /sendtext. Since Release 2.1 these are the
 * gateway's own, not the default SMS channel's — changing an SMS provider's keys no
 * longer locks every integrator out, and rotating these does not touch any channel.
 *
 * Values are shown, not masked: a SuperAdmin has to hand the exact pair to an integrator
 * and there is nowhere else to read it back from. Both keys stay hidden behind a reveal
 * toggle so they are available on purpose rather than on display.
 */
@Component({
  selector: 'app-gateway-credentials',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatTooltipModule, MatProgressSpinnerModule,
    MatDividerModule, PageHeaderComponent, FormFieldErrorsComponent,
    CopyButtonComponent, DatePipe,
  ],
  templateUrl: './gateway-credentials.component.html',
  styleUrl: './gateway-credentials.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GatewayCredentialsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(GatewayCredentialsService);
  private readonly notify = inject(NotificationService);

  /** Where integrators post. The origin serving this page proxies /sendtext. */
  readonly endpoint = `${environment.apiUrl || window.location.origin}/sendtext`;

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly unreadable = signal(false);
  readonly lastUpdated = signal<string | null>(null);
  readonly hideApiKey = signal(true);
  readonly hideSecretKey = signal(true);

  readonly form = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.maxLength(100)]],
    apiKey: ['', [Validators.required, Validators.minLength(8)]],
    secretKey: ['', [Validators.required, Validators.minLength(8)]],
  });

  /** What the server last gave us, so save can send only what actually changed. */
  private readonly loaded = signal<UpdateGatewayCredentialRequest | null>(null);

  private readonly formValue = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });

  readonly dirtyFields = computed(() => {
    const v = this.formValue();
    const base = this.loaded();
    if (!base) return [] as string[];

    const changed: string[] = [];
    if ((v.username ?? '').trim() !== base.username) changed.push('username');
    if ((v.apiKey ?? '').trim() !== base.apiKey) changed.push('API key');
    if ((v.secretKey ?? '').trim() !== base.secretKey) changed.push('secret key');
    return changed;
  });

  /** True once a key differs from what is live — the warning is only honest then. */
  readonly rotating = computed(() =>
    this.dirtyFields().some((f) => f !== 'username'),
  );

  /** Ready to paste into an integrator's terminal, using whatever is in the form now. */
  readonly curlExample = computed(() => {
    const v = this.formValue();
    return [
      `curl -X POST "${this.endpoint}" \\`,
      `  -H "Content-Type: application/x-www-form-urlencoded" \\`,
      `  --data-urlencode "apikey=${v.apiKey || 'YOUR_API_KEY'}" \\`,
      `  --data-urlencode "secretkey=${v.secretKey || 'YOUR_SECRET_KEY'}" \\`,
      `  --data-urlencode "callerID=${v.username || 'YOUR_CALLER_ID'}" \\`,
      `  --data-urlencode "toUser=8801700000001" \\`,
      `  --data-urlencode "messageContent=[sms:yourlabel::Hello from NetZero]"`,
    ].join('\n');
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set(null);

    this.service.get().subscribe({
      next: (dto) => {
        this.form.setValue({
          username: dto.username,
          apiKey: dto.apiKey,
          secretKey: dto.secretKey,
        });
        this.loaded.set({
          username: dto.username,
          apiKey: dto.apiKey,
          secretKey: dto.secretKey,
        });
        this.unreadable.set(!dto.isReadable);
        this.lastUpdated.set(dto.updatedAt);
        this.loading.set(false);
      },
      error: (err) => {
        this.loadError.set(
          err.status === 404
            ? 'No gateway credentials have been created yet. They are seeded on first startup — check Seed:GatewayCredentials in appsettings, then restart the API.'
            : 'Could not load the gateway credentials.',
        );
        this.loading.set(false);
      },
    });
  }

  generateApiKey(): void {
    this.form.controls.apiKey.setValue(randomKey('nzg', 28));
    this.form.controls.apiKey.markAsDirty();
    this.hideApiKey.set(false);
  }

  generateSecretKey(): void {
    this.form.controls.secretKey.setValue(randomKey('nzs', 40));
    this.form.controls.secretKey.markAsDirty();
    this.hideSecretKey.set(false);
  }

  revealAll(): void {
    this.hideApiKey.set(false);
    this.hideSecretKey.set(false);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    const base = this.loaded();

    // Send only what changed. Every omitted field keeps its stored value, so an untouched
    // key is never rewritten — and a no-op save cannot disturb a live credential.
    const body: UpdateGatewayCredentialRequest = {
      ...(v.username.trim() !== base?.username ? { username: v.username.trim() } : {}),
      ...(v.apiKey.trim() !== base?.apiKey ? { apiKey: v.apiKey.trim() } : {}),
      ...(v.secretKey.trim() !== base?.secretKey ? { secretKey: v.secretKey.trim() } : {}),
    };

    if (Object.keys(body).length === 0) {
      this.notify.info('Nothing to save — no field has changed.');
      return;
    }

    const rotated = this.rotating();

    this.saving.set(true);
    this.service.update(body).subscribe({
      next: (dto) => {
        this.saving.set(false);
        this.loaded.set({
          username: dto.username,
          apiKey: dto.apiKey,
          secretKey: dto.secretKey,
        });
        this.lastUpdated.set(dto.updatedAt);
        this.notify.success(
          rotated
            ? 'Credentials updated. Integrators using the previous keys will now be rejected.'
            : 'Gateway credentials saved.',
        );
      },
      error: () => {
        this.saving.set(false);
        this.notify.error('Could not save the gateway credentials.');
      },
    });
  }

  reset(): void {
    const base = this.loaded();
    if (!base) return;
    this.form.setValue({
      username: base.username ?? '',
      apiKey: base.apiKey ?? '',
      secretKey: base.secretKey ?? '',
    });
  }
}

import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ChannelConfigDto } from '../../../../core/models/channel-config.model';
import { StatusSyncResultDto, StatusSyncService } from '../../../../core/services/status-sync.service';

/**
 * Runs a delivery-status sync for one channel over a chosen window. The nightly job
 * already covers the previous full day, so this is for filling a gap or checking a
 * credential fix — which is why the window defaults to that same day rather than to
 * everything ever sent.
 */
@Component({
  selector: 'app-status-sync-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule,
    MatDatepickerModule, MatNativeDateModule, MatButtonModule, MatProgressSpinnerModule,
  ],
  templateUrl: './status-sync-dialog.component.html',
  styleUrl: './status-sync-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusSyncDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(StatusSyncService);
  readonly config = inject<ChannelConfigDto>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<StatusSyncDialogComponent>);

  readonly running = signal(false);
  readonly result = signal<StatusSyncResultDto | null>(null);

  private static yesterday(): Date {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d;
  }

  readonly form = this.fb.nonNullable.group({
    from: [StatusSyncDialogComponent.yesterday(), Validators.required],
    to: [new Date(), Validators.required],
    // Bounded because two of the three providers are looked up one recipient at a
    // time: an unbounded window would mean an unbounded number of provider calls.
    limit: [500, [Validators.required, Validators.min(1), Validators.max(5000)]],
  });

  run(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { from, to, limit } = this.form.getRawValue();

    this.running.set(true);
    this.service.sync(this.config.id, {
      from: from.toISOString(),
      to: to.toISOString(),
      limit,
    }).subscribe({
      next: (r) => {
        this.result.set(r);
        this.running.set(false);
      },
      error: () => {
        this.running.set(false);
        this.result.set({
          channelConfigId: this.config.id,
          label: this.config.label,
          success: false,
          updated: 0,
          unmatched: 0,
          error: 'The sync could not be started.',
          from: from.toISOString(),
          to: to.toISOString(),
        });
      },
    });
  }
}

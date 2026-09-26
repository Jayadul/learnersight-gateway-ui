import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ChannelConfigDto } from '../../../../core/models/channel-config.model';
import { StatusSyncResultDto, StatusSyncService } from '../../../../core/services/status-sync.service';
import { calendarDay, dayRangeText, dhakaInstant, dhakaToday } from '../../../../core/time/app-time';

type SyncMode = 'today' | 'custom';

/**
 * Runs a delivery-status sync for one channel. Every window is a whole calendar day
 * (00:00:00 to 23:59:59, Dhaka time), so a manual sync and the nightly job can never
 * disagree about what a day covers.
 * <p>
 * "Sync today" is deliberately not editable: it is the one-click action, and a partial day
 * would undercut the full-day guarantee. A different range for backfilling history is a
 * separate, clearly labelled action.
 */
@Component({
  selector: 'app-status-sync-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule, DatePipe, MatDialogModule, MatFormFieldModule, MatInputModule,
    MatDatepickerModule, MatNativeDateModule, MatButtonModule, MatButtonToggleModule,
    MatProgressSpinnerModule,
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

  readonly mode = signal<SyncMode>('today');
  readonly running = signal(false);
  readonly result = signal<StatusSyncResultDto | null>(null);

  /** The day the "Sync today" action will cover, shown so the admin sees the exact window. */
  readonly today = dhakaToday();
  readonly todayRange = dayRangeText(this.today, this.today);

  readonly form = this.fb.nonNullable.group({
    from: [new Date(), Validators.required],
    to: [new Date(), Validators.required],
    // Bounded because two of the three providers are looked up one recipient at a
    // time: an unbounded window would mean an unbounded number of provider calls.
    limit: [500, [Validators.required, Validators.min(1), Validators.max(5000)]],
  });

  private readonly formValue = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });

  /** The custom range as it will actually run: whole days, first to last second. */
  readonly customRange = computed(() => {
    const { from, to } = this.formValue();
    if (!from || !to) return '';
    return dayRangeText(calendarDay(from), calendarDay(to));
  });

  setMode(mode: SyncMode): void {
    this.mode.set(mode);
    this.result.set(null);
  }

  run(): void {
    if (this.mode() === 'custom') {
      if (this.form.invalid) {
        this.form.markAllAsTouched();
        return;
      }
      const { from, to, limit } = this.form.getRawValue();
      const fromDay = calendarDay(from);
      const toDay = calendarDay(to);
      if (toDay < fromDay) {
        this.result.set(this.failure('The end date is before the start date.'));
        return;
      }
      this.start({
        from: dhakaInstant(fromDay, '00:00:00'),
        to: dhakaInstant(toDay, '23:59:59'),
        limit,
      });
      return;
    }
    // No dates: the server syncs today's whole day and re-checks anything still waiting
    // from earlier days.
    this.start({});
  }

  private start(request: { from?: string; to?: string; limit?: number }): void {
    this.running.set(true);
    this.result.set(null);
    this.service.sync(this.config.id, request).subscribe({
      next: (r) => {
        this.result.set(r);
        this.running.set(false);
      },
      error: () => {
        this.running.set(false);
        this.result.set(this.failure('The sync could not be started.'));
      },
    });
  }

  private failure(error: string): StatusSyncResultDto {
    return {
      channelConfigId: this.config.id,
      label: this.config.label,
      success: false,
      updated: 0,
      unmatched: 0,
      error,
      from: '',
      to: '',
    };
  }
}

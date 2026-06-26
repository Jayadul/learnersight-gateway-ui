import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { VoiceReportsService } from './voice-reports.service';
import { VoiceCallRecord } from '../../core/models/voice-report.model';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ColumnDef, DataTableComponent } from '../../shared/components/data-table/data-table.component';

type Row = VoiceCallRecord;

@Component({
  selector: 'app-voice-reports',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatCardModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule,
    MatDatepickerModule, MatNativeDateModule, MatProgressBarModule, PageHeaderComponent, DataTableComponent,
  ],
  templateUrl: './voice-reports.component.html',
  styleUrl: './voice-reports.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VoiceReportsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(VoiceReportsService);

  readonly loading = signal(false);
  readonly records = signal<Row[]>([]);
  readonly hasSynced = signal(false);

  private readonly todayStart = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; })();
  private readonly todayEnd   = (() => { const d = new Date(); d.setHours(23, 59, 59, 999); return d; })();

  readonly form = this.fb.nonNullable.group({
    from: [this.todayStart, Validators.required],
    to:   [this.todayEnd,   Validators.required],
  });

  readonly columns: ColumnDef<Row>[] = [
    { key: 'destination',     header: 'Destination',   value: (r) => r.destination ?? '—' },
    { key: 'callState',       header: 'Call State',    type: 'badge', badgeType: 'call', value: (r) => r.callState ?? 'UNKNOWN' },
    { key: 'startTime',       header: 'Start',         type: 'datetime' },
    { key: 'connectTime',     header: 'Connect',       type: 'datetime' },
    { key: 'endTime',         header: 'End',           type: 'datetime' },
    { key: 'duration',        header: 'Duration (s)',  value: (r) => this.duration(r) },
    { key: 'displayNameSent', header: 'Display Name',  value: (r) => r.displayNameSent ?? '—' },
  ];

  duration(r: Row): number | string {
    if (!r.startTime || !r.endTime) return '—';
    const diff = (new Date(r.endTime).getTime() - new Date(r.startTime).getTime()) / 1000;
    return diff > 0 ? Math.round(diff) : 0;
  }

  sync(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.loading.set(true);
    this.service.sync({ from: v.from.toISOString(), to: v.to.toISOString() }).subscribe({
      next: (res) => {
        this.records.set(res.records ?? []);
        this.hasSynced.set(true);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}

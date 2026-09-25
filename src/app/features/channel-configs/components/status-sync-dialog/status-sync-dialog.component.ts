import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ChannelConfigDto } from '../../../../core/models/channel-config.model';
import { StatusSyncResultDto, StatusSyncService } from '../../../../core/services/status-sync.service';

/**
 * One action: ask the provider about every recipient of this channel that is still waiting for a
 * status, whenever it was sent. There are no dates to reason about (hotfix batch 7); a date window
 * is what used to leave older In Progress rows outside the query for good.
 */
@Component({
  selector: 'app-status-sync-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './status-sync-dialog.component.html',
  styleUrl: './status-sync-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusSyncDialogComponent {
  private readonly service = inject(StatusSyncService);
  readonly config = inject<ChannelConfigDto>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<StatusSyncDialogComponent>);

  readonly running = signal(false);
  readonly result = signal<StatusSyncResultDto | null>(null);

  run(): void {
    this.running.set(true);
    this.result.set(null);
    this.service.sync(this.config.id).subscribe({
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
          stillWaiting: 0,
          markedUnknown: 0,
          unmatched: 0,
          moreWaiting: false,
          error: 'The sync could not be started.',
          from: '',
          to: '',
        });
      },
    });
  }
}

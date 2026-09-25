import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FORM_DIALOG_FIELD_OPTIONS } from '../../../../shared/forms/form-dialog';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { ChannelOptionsService } from '../../../../core/services/channel-options.service';
import { ChannelOptionDto } from '../../../../core/models/channel-config.model';
import { ChannelType } from '../../../../core/models/enums';
import { ChannelTypePipe } from '../../../../shared/pipes/channel-type.pipe';
import { DispatchJobRecipientDto } from '../../../../core/models/dispatch-job-recipient.model';

export interface ResendDialogData {
  readonly recipients: readonly DispatchJobRecipientDto[];
}

export interface ResendDialogResult {
  readonly channelConfigId?: string;
}

/**
 * Lets the admin pick "same channel" (default) or another active channel of the same
 * type before a resend (hotfix batch 4, task 2b — the backend has supported this since
 * R3.2, but it was never wired into the UI). Only offered when every selected recipient
 * shares one channel type; a mixed selection resends each one through its own original
 * channel, same as before.
 */
@Component({
  selector: 'app-resend-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatSelectModule],
  templateUrl: './resend-dialog.component.html',
  styleUrl: './resend-dialog.component.scss',
  providers: [FORM_DIALOG_FIELD_OPTIONS],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResendDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly channelsService = inject(ChannelOptionsService);
  readonly data = inject<ResendDialogData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<ResendDialogComponent, ResendDialogResult>);

  readonly count = this.data.recipients.length;

  private readonly distinctTypes = [...new Set(this.data.recipients.map((r) => r.channelType))];
  /** A channel picker only makes sense when every selected row shares one channel type. */
  readonly singleChannelType: ChannelType | null =
    this.distinctTypes.length === 1 ? this.distinctTypes[0] : null;
  readonly channelTypeLabel = this.singleChannelType !== null
    ? new ChannelTypePipe().transform(this.singleChannelType) : '';

  readonly channelOptions = signal<ChannelOptionDto[]>([]);

  readonly form = this.fb.nonNullable.group({ channelConfigId: [''] });

  constructor() {
    if (this.singleChannelType !== null) {
      this.channelsService.getByChannel(this.singleChannelType).subscribe((all) => {
        this.channelOptions.set(all.filter((c) => c.isActive));
      });
    }
  }

  confirm(): void {
    const channelConfigId = this.form.controls.channelConfigId.value;
    this.dialogRef.close({ channelConfigId: channelConfigId || undefined });
  }
}

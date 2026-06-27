import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { ApiLogDto } from '../../../../core/models/api-log.model';

@Component({
  selector: 'app-log-detail-dialog',
  standalone: true,
  imports: [DatePipe, MatDialogModule, MatButtonModule],
  templateUrl: './log-detail-dialog.component.html',
  styleUrl: './log-detail-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogDetailDialogComponent {
  readonly log = inject<ApiLogDto>(MAT_DIALOG_DATA);

  pretty(value: string): string {
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return value;
    }
  }
}

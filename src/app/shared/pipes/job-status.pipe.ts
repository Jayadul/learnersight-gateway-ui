import { Pipe, PipeTransform } from '@angular/core';
import { JobStatus } from '../../core/models/enums';

@Pipe({ name: 'jobStatus', standalone: true })
export class JobStatusPipe implements PipeTransform {
  transform(value: JobStatus | number | null | undefined): string {
    switch (value) {
      case JobStatus.Pending: return 'Pending';
      case JobStatus.Sent: return 'Sent';
      case JobStatus.Failed: return 'Failed';
      default: return 'Unknown';
    }
  }
}

import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly snackBar = inject(MatSnackBar);

  success(message: string, duration = 3000): void {
    this.snackBar.open(message, 'Dismiss', {
      duration,
      panelClass: ['nzg-snack-success'],
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }

  error(message: string, duration = 5000): void {
    this.snackBar.open(message, 'Dismiss', {
      duration,
      panelClass: ['nzg-snack-error'],
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }

  warning(message: string, duration = 4000): void {
    this.snackBar.open(message, 'Dismiss', {
      duration,
      panelClass: ['nzg-snack-warning'],
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }

  info(message: string, duration = 3000): void {
    this.snackBar.open(message, 'Dismiss', {
      duration,
      panelClass: ['nzg-snack-info'],
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }
}

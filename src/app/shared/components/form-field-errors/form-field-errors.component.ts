import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { VALIDATION_MESSAGES } from '../../../core/forms/validation-messages';

/**
 * Drop under any field: <app-form-field-errors [control]="form.controls.email" />
 * Renders the first matching error from the central VALIDATION_MESSAGES map.
 */
@Component({
  selector: 'app-form-field-errors',
  standalone: true,
  imports: [MatFormFieldModule],
  template: `@if (message()) { <mat-error>{{ message() }}</mat-error> }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormFieldErrorsComponent {
  readonly control = input.required<AbstractControl>();

  readonly message = computed<string | null>(() => {
    const c = this.control();
    if (!c || !c.errors || !(c.dirty || c.touched)) {
      return null;
    }
    for (const key of Object.keys(c.errors)) {
      const factory = VALIDATION_MESSAGES[key];
      if (factory) {
        return factory(c.errors[key]);
      }
    }
    return 'Invalid value.';
  });
}

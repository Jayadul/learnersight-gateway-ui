import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';

/**
 * Every form dialog provides this so its fields size their hint and error area the same way.
 * Mixing fixed and dynamic sizing is what left some fields flush against the next one while others
 * had a gap: dynamic removes the reserved space below a field, so spacing has to come from the
 * shared `.nzg-form` layout (a uniform gap) instead. Add it to the component's `providers`, and put
 * the `nzg-form` class on the `<form>`.
 */
export const FORM_DIALOG_FIELD_OPTIONS = {
  provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
  useValue: { appearance: 'outline', subscriptSizing: 'dynamic' },
} as const;

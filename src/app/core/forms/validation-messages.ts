/**
 * Central map of validation error key -> message factory.
 * Used by <app-form-field-errors>. Add new custom validator keys here once,
 * and every form picks up the message automatically.
 */
export const VALIDATION_MESSAGES: Record<string, (err: unknown) => string> = {
  required: () => 'This field is required.',
  email: () => 'Enter a valid email address.',
  minlength: (e) => `Must be at least ${(e as { requiredLength: number }).requiredLength} characters.`,
  maxlength: (e) => `Must be at most ${(e as { requiredLength: number }).requiredLength} characters.`,
  pattern: () => 'Invalid format.',
  phoneList: () => 'Enter valid phone numbers, comma-separated, digits only with country code — no "+" (e.g. 8801700000001).',
  urlInvalid: () => 'Enter a valid http(s) URL.',
  sameChannel: () => 'Trigger and fallback channels must be different.',
};

import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Comma-separated phone numbers, digits only including country code (e.g. 8801700000001 — no "+"). */
export function phoneListValidator(control: AbstractControl): ValidationErrors | null {
  const value = (control.value as string | null)?.trim();
  if (!value) {
    return null; // let `required` handle emptiness
  }
  const pattern = /^[0-9]{6,15}$/;
  const parts = value.split(',').map((p) => p.trim()).filter((p) => p.length > 0);
  if (parts.length === 0) {
    return { phoneList: true };
  }
  const allValid = parts.every((p) => pattern.test(p));
  return allValid ? null : { phoneList: true };
}

/** Valid http(s) URL. */
export function urlValidator(control: AbstractControl): ValidationErrors | null {
  const value = (control.value as string | null)?.trim();
  if (!value) {
    return null;
  }
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:' ? null : { urlInvalid: true };
  } catch {
    return { urlInvalid: true };
  }
}

/**
 * Group-level fallback rule check. Same-type rules must name two different channels;
 * cross-type rules need the explicit opt-in.
 */
export function differentChannelsValidator(group: AbstractControl): ValidationErrors | null {
  const trigger = group.get('triggerChannel')?.value;
  const fallback = group.get('fallbackChannel')?.value;
  if (trigger === null || trigger === undefined || fallback === null || fallback === undefined) {
    return null;
  }

  const triggerConfig = group.get('triggerChannelConfigId')?.value || null;
  const fallbackConfig = group.get('fallbackChannelConfigId')?.value || null;

  // Same type is now legitimate — WhatsApp can fall back to another WhatsApp channel —
  // but only when both sides name a channel, and different ones. Comparing types alone
  // (the old rule) would reject every same-type policy.
  if (trigger === fallback) {
    if (!triggerConfig || !fallbackConfig) {
      return { sameChannelNeedsBoth: true };
    }
    return triggerConfig === fallbackConfig ? { sameChannel: true } : null;
  }

  // Different types are allowed only with the explicit opt-in.
  return group.get('allowCrossChannel')?.value ? null : { crossChannelNotAllowed: true };
}


/** Generic: a control must not equal another control's value. */
export function notEqualValidator(otherKey: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const parent = control.parent;
    if (!parent) {
      return null;
    }
    const other = parent.get(otherKey);
    if (!other) {
      return null;
    }
    return control.value === other.value ? { sameChannel: true } : null;
  };
}

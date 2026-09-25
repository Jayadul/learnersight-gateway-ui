/**
 * Project time standard: the backend stores and returns UTC; the UI always
 * DISPLAYS Dhaka time (UTC+6, no DST), no matter where the browser is.
 *
 * These are the only timezone constants in the app — never hardcode offsets
 * elsewhere. All `| date` pipes pick up APP_UTC_OFFSET automatically via
 * DATE_PIPE_DEFAULT_OPTIONS in app.config.ts; manual formatting (charts etc.)
 * must pass `timeZone: APP_TIMEZONE`.
 */
export const APP_TIMEZONE = 'Asia/Dhaka';
export const APP_UTC_OFFSET = '+0600';

/** Same offset in the ISO form Date can parse ("+06:00"). */
const APP_UTC_OFFSET_ISO = '+06:00';

/** Today's calendar date in Dhaka as yyyy-MM-dd, whatever the browser's own zone is. */
export function dhakaToday(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: APP_TIMEZONE }).format(now);
}

/** A date picker's chosen calendar day as yyyy-MM-dd (its fields, not a zone conversion). */
export function calendarDay(d: Date): string {
  const two = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())}`;
}

/** The whole Dhaka day as display text, e.g. "2026-09-25 00:00:00 to 2026-09-25 23:59:59". */
export function dayRangeText(fromDay: string, toDay: string): string {
  return `${fromDay} 00:00:00 → ${toDay} 23:59:59`;
}

/** The instant a Dhaka wall-clock time falls on, as an ISO string the API accepts. */
export function dhakaInstant(day: string, time: string): string {
  return new Date(`${day}T${time}${APP_UTC_OFFSET_ISO}`).toISOString();
}

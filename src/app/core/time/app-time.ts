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

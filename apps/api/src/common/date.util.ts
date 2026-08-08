/**
 * Calendar-day helpers. A "day key" is a plain "YYYY-MM-DD" string.
 *
 * Everything here goes through UTC internally so arithmetic never lands on a
 * DST boundary, and no value in the app is ever a timezone-bearing timestamp
 * pretending to be a date. "Today" always means today in Algeria, on both the
 * server and the client, regardless of where either is running.
 */

export const DAY_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isDayKey(value: unknown): value is string {
  return typeof value === 'string' && DAY_KEY_PATTERN.test(value);
}

function toUtc(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function fromUtc(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** The app runs on Algeria time, wherever the server happens to be hosted. */
export const TIMEZONE = 'Africa/Algiers';

/** Today in Algeria. `en-CA` formats as YYYY-MM-DD. */
export function todayKey(tz: string = TIMEZONE): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export function addDays(key: string, days: number): string {
  const date = toUtc(key);
  date.setUTCDate(date.getUTCDate() + days);
  return fromUtc(date);
}

/** 0 = Sunday … 6 = Saturday. */
export function weekdayOf(key: string): number {
  return toUtc(key).getUTCDay();
}

/** The `count` day keys ending at (and including) `key`, chronological. */
export function rangeBack(key: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => addDays(key, i - count + 1));
}

/** "Thursday, August 7" — the header line in the design. */
export function formatDayLabel(key: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(toUtc(key));
}

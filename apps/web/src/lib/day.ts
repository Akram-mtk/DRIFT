/**
 * Calendar-day helpers. A "day key" is a plain "YYYY-MM-DD" string.
 *
 * "Today" always means today in Algeria, on the client as well as the server,
 * so the app shows the same day no matter where the browser is running.
 */
export const TIMEZONE = 'Africa/Algiers';

/** Today in Algeria. `en-CA` formats as YYYY-MM-DD. */
export function todayKey(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

/**
 * Day keys are parsed to local midnight purely as a calculation vehicle.
 * Weekday and month names read off such a date are correct in any timezone,
 * because the calendar date itself is what was parsed.
 */
function parse(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function format(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDays(key: string, days: number): string {
  const date = parse(key);
  date.setDate(date.getDate() + days);
  return format(date);
}

/** Whole days from `key` up to `today` (positive when key is in the past). */
export function daysBetween(key: string, today: string): number {
  return Math.round((parse(today).getTime() - parse(key).getTime()) / 86_400_000);
}

/** "yesterday" / "Tuesday" / "Jul 28" — used by the rolled-over subtitle. */
export function relativeDayLabel(key: string, today: string): string {
  const diff = daysBetween(key, today);
  if (diff === 0) return 'today';
  if (diff === 1) return 'yesterday';
  if (diff > 1 && diff < 7) {
    return parse(key).toLocaleDateString(undefined, { weekday: 'long' });
  }
  return parse(key).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

/** "Fri" — the weekday initials under a habit card. */
export function weekdayShort(key: string): string {
  return parse(key).toLocaleDateString(undefined, { weekday: 'short' });
}

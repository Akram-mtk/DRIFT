import { addDays, rangeBack, weekdayOf } from '../common/date.util';
import { Repeat, WEEKDAY_LABELS } from '../common/types';

/** The subset of a Routine this module needs — keeps these functions pure. */
export interface Schedule {
  repeat: Repeat;
  weekdays: number[];
  startDate: string;
  endDate: string | null;
  active: boolean;
}

export function isScheduledOn(schedule: Schedule, date: string): boolean {
  if (!schedule.active) return false;
  if (date < schedule.startDate) return false;
  if (schedule.endDate && date > schedule.endDate) return false;
  if (schedule.repeat === Repeat.DAILY) return true;
  return schedule.weekdays.includes(weekdayOf(date));
}

/**
 * Consecutive scheduled days completed, counting back from `today`.
 *
 * A scheduled-but-not-yet-done *today* is skipped rather than treated as a
 * miss — otherwise every streak would read zero until you checked the box,
 * which is exactly when you most want to see it.
 */
export function computeStreak(
  schedule: Schedule,
  completed: ReadonlySet<string>,
  today: string,
): number {
  let cursor = today;
  if (isScheduledOn(schedule, today) && !completed.has(today)) {
    cursor = addDays(today, -1);
  }

  let streak = 0;
  while (cursor >= schedule.startDate) {
    if (isScheduledOn(schedule, cursor)) {
      if (!completed.has(cursor)) break;
      streak += 1;
    }
    cursor = addDays(cursor, -1);
  }
  return streak;
}

/** Percentage of scheduled days completed over the trailing window. */
export function computeRate(
  schedule: Schedule,
  completed: ReadonlySet<string>,
  today: string,
  windowDays = 30,
): number {
  let scheduled = 0;
  let done = 0;
  for (const date of rangeBack(today, windowDays)) {
    if (!isScheduledOn(schedule, date)) continue;
    scheduled += 1;
    if (completed.has(date)) done += 1;
  }
  return scheduled === 0 ? 0 : Math.round((done / scheduled) * 100);
}

export interface WeekDay {
  date: string;
  scheduled: boolean;
  done: boolean;
  isToday: boolean;
}

/** The seven-cell strip under each habit card. */
export function last7(
  schedule: Schedule,
  completed: ReadonlySet<string>,
  today: string,
): WeekDay[] {
  return rangeBack(today, 7).map((date) => ({
    date,
    scheduled: isScheduledOn(schedule, date),
    done: completed.has(date),
    isToday: date === today,
  }));
}

/** "Daily" | "Weekdays" | "Mon, Wed, Fri" — the repeat pill. */
export function repeatLabel(schedule: Schedule): string {
  if (schedule.repeat === Repeat.DAILY) return 'Daily';

  const days = [...schedule.weekdays].sort((a, b) => a - b);
  if (days.length === 7) return 'Daily';
  if (days.join() === '1,2,3,4,5') return 'Weekdays';
  if (days.join() === '0,6') return 'Weekends';
  return days.map((d) => WEEKDAY_LABELS[d]).join(', ');
}

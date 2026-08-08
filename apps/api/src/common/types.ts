import { DayPart, Repeat, Urgency } from '../generated/prisma/enums';

export { DayPart, Repeat, Urgency };

/** Sort weight — most urgent first, Someday last. */
export const URGENCY_ORDER: Record<Urgency, number> = {
  HIGH: 0,
  MEDIUM: 1,
  LOW: 2,
  SOMEDAY: 3,
};

/** The four buckets a day is split into; `null` is the whole-day "Anytime". */
export const DAY_PART_SECTIONS: Array<{
  dayPart: DayPart | null;
  label: string;
}> = [
  { dayPart: null, label: 'Anytime' },
  { dayPart: 'MORNING', label: 'Morning' },
  { dayPart: 'EVENING', label: 'Evening' },
  { dayPart: 'NIGHT', label: 'Night' },
];

export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** A single row in the Today feed — either a real task or a routine occurrence. */
export interface FeedItem {
  id: string;
  kind: 'task' | 'routine';
  taskId?: string;
  routineId?: string;
  title: string;
  dayPart: DayPart | null;
  urgency: Urgency;
  completed: boolean;
  /** The day this row sits on; null for undated Someday tasks. */
  date?: string | null;
  /** "Daily" | "Mon, Wed, Fri" — shown as a pill on repeating rows. */
  repeatLabel?: string;
  /** Consecutive scheduled days completed, for the flame badge. */
  streak?: number;
  /** Day key this task was originally scheduled for, if it was moved. */
  carriedFrom?: string;
}

export interface DaySection {
  dayPart: DayPart | null;
  label: string;
  items: FeedItem[];
}

export interface DayFeed {
  date: string;
  label: string;
  progress: { done: number; total: number };
  review: FeedItem[];
  sections: DaySection[];
}

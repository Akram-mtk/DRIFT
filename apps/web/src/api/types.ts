export type DayPart = 'MORNING' | 'EVENING' | 'NIGHT';
export type Urgency = 'HIGH' | 'MEDIUM' | 'LOW' | 'SOMEDAY';
export type Repeat = 'DAILY' | 'WEEKLY';

export interface FeedItem {
  id: string;
  kind: 'task' | 'routine';
  taskId?: string;
  routineId?: string;
  title: string;
  dayPart: DayPart | null;
  urgency: Urgency;
  completed: boolean;
  date?: string | null;
  repeatLabel?: string;
  streak?: number;
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

export interface WeekDay {
  date: string;
  scheduled: boolean;
  done: boolean;
  isToday: boolean;
}

export interface Routine {
  id: string;
  title: string;
  dayPart: DayPart | null;
  urgency: Urgency;
  repeat: Repeat;
  weekdays: number[];
  startDate: string;
  endDate: string | null;
  active: boolean;
  repeatLabel: string;
  scheduledToday: boolean;
  completedToday: boolean;
  streak: number;
  rate: number;
  last7: WeekDay[];
}

export interface CreateTaskInput {
  title: string;
  dayPart?: DayPart | null;
  urgency?: Urgency;
  date?: string | null;
}

export interface CreateRoutineInput {
  title: string;
  dayPart?: DayPart | null;
  urgency?: Urgency;
  repeat?: Repeat;
  weekdays?: number[];
}

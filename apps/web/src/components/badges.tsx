import type { DayPart, Urgency } from '../api/types';
import { CircleIcon, FlameIcon, MoonIcon, SunIcon, SunriseIcon } from './Icons';

const URGENCY_LABEL: Record<Urgency, string> = {
  HIGH: 'High',
  MEDIUM: 'Med',
  LOW: 'Low',
  SOMEDAY: 'Someday',
};

const URGENCY_CLASS: Record<Urgency, string> = {
  HIGH: 'badge--high',
  MEDIUM: 'badge--medium',
  LOW: 'badge--low',
  SOMEDAY: 'badge--someday',
};

export function UrgencyBadge({ urgency }: { urgency: Urgency }) {
  return (
    <span className={`badge ${URGENCY_CLASS[urgency]}`}>
      {URGENCY_LABEL[urgency]}
    </span>
  );
}

export function StreakBadge({ streak }: { streak: number }) {
  return (
    <span className="badge badge--streak" title={`${streak}-day streak`}>
      <FlameIcon />
      {streak}
    </span>
  );
}

export function RepeatBadge({ label }: { label: string }) {
  return <span className="badge badge--repeat">{label}</span>;
}

const DAY_PART_CLASS: Record<string, string> = {
  MORNING: 'chip--morning',
  EVENING: 'chip--evening',
  NIGHT: 'chip--night',
  ANYTIME: 'chip--anytime',
};

const DAY_PART_LABEL: Record<string, string> = {
  MORNING: 'Morning',
  EVENING: 'Evening',
  NIGHT: 'Night',
  ANYTIME: 'Anytime',
};

/** The little coloured circle that says which part of the day a row belongs to. */
export function DayPartChip({
  dayPart,
  size = 24,
}: {
  dayPart: DayPart | null;
  size?: number;
}) {
  const key = dayPart ?? 'ANYTIME';
  return (
    <span
      className={`chip ${DAY_PART_CLASS[key]}`}
      style={{ width: size, height: size }}
      title={DAY_PART_LABEL[key]}
    >
      {dayPart === 'MORNING' && <SunriseIcon />}
      {dayPart === 'EVENING' && <SunIcon />}
      {dayPart === 'NIGHT' && <MoonIcon />}
      {dayPart === null && <CircleIcon />}
      <span className="sr-only">{DAY_PART_LABEL[key]}</span>
    </span>
  );
}

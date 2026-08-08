import { useState } from 'react';
import type { Routine } from '../api/types';
import { weekdayShort } from '../lib/day';
import { DayPartChip } from './badges';
import { ConfirmDialog } from './ConfirmDialog';
import { FlameIcon, TrashIcon } from './Icons';
import { ProgressRing } from './ProgressRing';

interface HabitCardProps {
  routine: Routine;
  onToggle: (id: string, date: string) => void;
  onDelete: (id: string) => void | Promise<void>;
}

export function HabitCard({ routine, onToggle, onDelete }: HabitCardProps) {
  const [confirming, setConfirming] = useState(false);

  return (
    <article className="habit">
      <header className="habit-head">
        <ProgressRing
          done={routine.rate}
          total={100}
          size={56}
          stroke={6}
          color="var(--terracotta)"
        >
          <span className="habit-flame">
            <FlameIcon size={20} />
          </span>
        </ProgressRing>

        <div className="habit-meta">
          <div className="habit-title">
            {routine.title}
            <DayPartChip dayPart={routine.dayPart} size={18} />
          </div>
          <div className="habit-stats">
            {routine.streak}-day streak · {routine.rate}%
          </div>
          <div className="habit-repeat">{routine.repeatLabel}</div>
        </div>

        <button
          type="button"
          className="row-delete"
          onClick={() => setConfirming(true)}
          aria-label={`Delete ${routine.title}`}
        >
          <TrashIcon />
        </button>
      </header>

      <div className="habit-strip">
        {routine.last7.map((day) => (
          <button
            key={day.date}
            type="button"
            disabled={!day.scheduled}
            onClick={() => onToggle(routine.id, day.date)}
            className={[
              'habit-cell',
              day.done ? 'habit-cell--done' : '',
              day.scheduled ? '' : 'habit-cell--off',
              day.isToday ? 'habit-cell--today' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            title={`${weekdayShort(day.date)} ${day.date}${
              day.scheduled ? (day.done ? ' — done' : ' — missed') : ' — not scheduled'
            }`}
          >
            <span className="sr-only">{day.date}</span>
          </button>
        ))}
      </div>
      <div className="habit-days">
        {routine.last7.map((day) => (
          <span key={day.date}>{weekdayShort(day.date).slice(0, 1)}</span>
        ))}
      </div>

      {confirming && (
        <ConfirmDialog
          title={`Delete “${routine.title}”?`}
          body="Its whole history goes with it, streak included."
          onCancel={() => setConfirming(false)}
          onConfirm={async () => {
            await onDelete(routine.id);
            setConfirming(false);
          }}
        />
      )}
    </article>
  );
}

import { useState } from 'react';
import type { FeedItem } from '../api/types';
import { relativeDayLabel } from '../lib/day';
import { DayPartChip, RepeatBadge, StreakBadge, UrgencyBadge } from './badges';
import { ConfirmDialog } from './ConfirmDialog';
import { CheckIcon, TrashIcon } from './Icons';

interface TaskRowProps {
  item: FeedItem;
  today: string;
  onToggle: (item: FeedItem) => void;
  onDelete?: (item: FeedItem) => void | Promise<void>;
}

export function TaskRow({ item, today, onToggle, onDelete }: TaskRowProps) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const subtitle = item.carriedFrom
    ? `Rolled over from ${relativeDayLabel(item.carriedFrom, today)}`
    : null;

  // Habits are removed from the Habits screen, not from a single day's row.
  const deletable = Boolean(onDelete) && item.kind === 'task';

  return (
    <div className="row-wrap">
      <div
        className={`row${item.completed ? ' row--done' : ''}${
          open ? ' row--open' : ''
        }`}
      >
        <button
          type="button"
          className={`row-check${item.completed ? ' row-check--done' : ''}`}
          onClick={() => onToggle(item)}
          aria-pressed={item.completed}
          aria-label={item.completed ? 'Mark as not done' : 'Mark as done'}
        >
          {item.completed && <CheckIcon />}
        </button>

        <DayPartChip dayPart={item.dayPart} />

        {deletable ? (
          <button
            type="button"
            className="row-body row-body--button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
          >
            <span className="row-title">{item.title}</span>
            {subtitle && <span className="row-note">{subtitle}</span>}
          </button>
        ) : (
          <div className="row-body">
            <div className="row-title">{item.title}</div>
            {subtitle && <div className="row-note">{subtitle}</div>}
          </div>
        )}

        <div className="row-badges">
          <UrgencyBadge urgency={item.urgency} />
          {(item.repeatLabel || item.streak) && (
            <div className="row-badges-line">
              {item.streak ? <StreakBadge streak={item.streak} /> : null}
              {item.repeatLabel && <RepeatBadge label={item.repeatLabel} />}
            </div>
          )}
        </div>
      </div>

      {open && deletable && (
        // Sits below rather than inside the row, so revealing it never shifts
        // the badges sideways.
        <div className="row-actions">
          <button
            type="button"
            className="btn btn--small btn--danger"
            onClick={() => setConfirming(true)}
          >
            <TrashIcon /> Delete
          </button>
        </div>
      )}

      {confirming && (
        <ConfirmDialog
          title={`Delete “${item.title}”?`}
          body="This removes the task for good."
          onCancel={() => setConfirming(false)}
          onConfirm={async () => {
            await onDelete!(item);
            setConfirming(false);
          }}
        />
      )}
    </div>
  );
}

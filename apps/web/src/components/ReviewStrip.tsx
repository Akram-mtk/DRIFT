import { useState } from 'react';
import type { FeedItem } from '../api/types';
import { addDays, relativeDayLabel } from '../lib/day';
import { DayPartChip, UrgencyBadge } from './badges';
import { ConfirmDialog } from './ConfirmDialog';
import { ArrowRightIcon, TrashIcon } from './Icons';

interface ReviewStripProps {
  items: FeedItem[];
  today: string;
  onMove: (taskId: string, toDate: string) => void;
  onDrop: (taskId: string) => void | Promise<void>;
  onMoveAll: (toDate: string) => void;
}

/**
 * Unfinished tasks from earlier days. Nothing moves on its own — each one is
 * either pulled into today or dropped, which is the whole point of the strip.
 */
export function ReviewStrip({
  items,
  today,
  onMove,
  onDrop,
  onMoveAll,
}: ReviewStripProps) {
  const [dropping, setDropping] = useState<FeedItem | null>(null);

  if (items.length === 0) return null;

  return (
    <section className="review" aria-label="Unfinished from earlier">
      <header className="review-head">
        <div>
          <div className="review-kicker">Left over</div>
          <div className="review-title">
            {items.length} unfinished {items.length === 1 ? 'task' : 'tasks'}
          </div>
        </div>
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => onMoveAll(today)}
        >
          Move all to today
        </button>
      </header>

      {items.map((item) => (
        <div className="review-row" key={item.id}>
          <DayPartChip dayPart={item.dayPart} size={22} />
          <div className="row-body">
            <div className="row-title">{item.title}</div>
            {item.date && (
              <div className="row-note">
                From {relativeDayLabel(item.date, today)}
              </div>
            )}
          </div>
          <UrgencyBadge urgency={item.urgency} />
          <button
            type="button"
            className="btn btn--small"
            onClick={() => onMove(item.taskId ?? item.id, today)}
          >
            <ArrowRightIcon /> Today
          </button>
          <button
            type="button"
            className="btn btn--small btn--quiet"
            onClick={() => onMove(item.taskId ?? item.id, addDays(today, 1))}
          >
            Tomorrow
          </button>
          <button
            type="button"
            className="row-delete"
            onClick={() => setDropping(item)}
            aria-label={`Drop ${item.title}`}
          >
            <TrashIcon />
          </button>
        </div>
      ))}

      {dropping && (
        <ConfirmDialog
          title={`Drop “${dropping.title}”?`}
          body="It leaves your list without being done."
          confirmLabel="Drop"
          onCancel={() => setDropping(null)}
          onConfirm={async () => {
            await onDrop(dropping.taskId ?? dropping.id);
            setDropping(null);
          }}
        />
      )}
    </section>
  );
}

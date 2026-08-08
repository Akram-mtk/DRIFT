import { ChevronLeftIcon, ChevronRightIcon } from './Icons';
import { ProgressRing } from './ProgressRing';

interface DayHeaderProps {
  label: string;
  date: string;
  today: string;
  progress: { done: number; total: number };
  onStep: (days: number) => void;
  onToday: () => void;
}

export function DayHeader({
  label,
  date,
  today,
  progress,
  onStep,
  onToday,
}: DayHeaderProps) {
  const isToday = date === today;

  return (
    <header className="day-head">
      <div>
        <div className="day-kicker">
          {label}
          {!isToday && (
            <button type="button" className="link" onClick={onToday}>
              back to today
            </button>
          )}
        </div>
        <h1 className="day-title">{isToday ? 'Today' : titleFor(date, today)}</h1>
      </div>

      <div className="day-head-right">
        <div className="stepper">
          <button
            type="button"
            onClick={() => onStep(-1)}
            aria-label="Previous day"
          >
            <ChevronLeftIcon />
          </button>
          <button type="button" onClick={() => onStep(1)} aria-label="Next day">
            <ChevronRightIcon />
          </button>
        </div>

        <ProgressRing done={progress.done} total={progress.total}>
          <div className="ring-value">
            {progress.done}/{progress.total}
          </div>
          <div className="ring-caption">DONE</div>
        </ProgressRing>
      </div>
    </header>
  );
}

function titleFor(date: string, today: string): string {
  const [y, m, d] = date.split('-').map(Number);
  const [ty, tm, td] = today.split('-').map(Number);
  const diff = Math.round(
    (new Date(y, m - 1, d).getTime() - new Date(ty, tm - 1, td).getTime()) /
      86_400_000,
  );
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: 'long',
  });
}

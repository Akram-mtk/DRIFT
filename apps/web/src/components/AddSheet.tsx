import { useEffect, useState } from 'react';
import type {
  CreateRoutineInput,
  CreateTaskInput,
  DayPart,
  Repeat,
  Urgency,
} from '../api/types';
import { DayPartChip } from './badges';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const DAY_PARTS: Array<{ value: DayPart | null; label: string }> = [
  { value: null, label: 'Anytime' },
  { value: 'MORNING', label: 'Morning' },
  { value: 'EVENING', label: 'Evening' },
  { value: 'NIGHT', label: 'Night' },
];

const URGENCIES: Array<{ value: Urgency; label: string }> = [
  { value: 'HIGH', label: 'High' },
  { value: 'MEDIUM', label: 'Med' },
  { value: 'LOW', label: 'Low' },
  { value: 'SOMEDAY', label: 'Someday' },
];

interface AddSheetProps {
  /** The day a new task lands on — whichever day the home page is showing. */
  date: string;
  dateLabel: string;
  onClose: () => void;
  onAddTask: (input: CreateTaskInput) => Promise<void>;
  onAddHabit: (input: CreateRoutineInput) => Promise<void>;
}

export function AddSheet({
  date,
  dateLabel,
  onClose,
  onAddTask,
  onAddHabit,
}: AddSheetProps) {
  const [kind, setKind] = useState<'task' | 'habit'>('task');
  const [title, setTitle] = useState('');
  const [dayPart, setDayPart] = useState<DayPart | null>(null);
  const [urgency, setUrgency] = useState<Urgency>('MEDIUM');
  const [repeat, setRepeat] = useState<Repeat>('DAILY');
  const [weekdays, setWeekdays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const toggleWeekday = (index: number) =>
    setWeekdays((current) =>
      current.includes(index)
        ? current.filter((day) => day !== index)
        : [...current, index].sort((a, b) => a - b),
    );

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || busy) return;
    if (kind === 'habit' && repeat === 'WEEKLY' && weekdays.length === 0) return;

    setBusy(true);
    try {
      if (kind === 'habit') {
        await onAddHabit({
          title: trimmed,
          dayPart,
          urgency,
          repeat,
          ...(repeat === 'WEEKLY' && { weekdays }),
        });
      } else {
        await onAddTask({
          title: trimmed,
          dayPart,
          urgency,
          // Someday is undated by definition; the API discards a date here.
          date: urgency === 'SOMEDAY' ? null : date,
        });
      }
      onClose();
    } finally {
      setBusy(false);
    }
  };

  // A recurring task that is also "someday" is a contradiction, so habits
  // only offer the three real urgency levels.
  const urgencies =
    kind === 'habit'
      ? URGENCIES.filter((option) => option.value !== 'SOMEDAY')
      : URGENCIES;

  return (
    <div
      className="sheet-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <form
        className="sheet"
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        aria-label="Add"
      >
        <div className="option-group sheet-kind" role="group" aria-label="Type">
          <button
            type="button"
            className={`option${kind === 'task' ? ' option--on' : ''}`}
            onClick={() => setKind('task')}
            aria-pressed={kind === 'task'}
          >
            Task
          </button>
          <button
            type="button"
            className={`option${kind === 'habit' ? ' option--on' : ''}`}
            onClick={() => {
              setKind('habit');
              if (urgency === 'SOMEDAY') setUrgency('MEDIUM');
            }}
            aria-pressed={kind === 'habit'}
          >
            Habit
          </button>
        </div>

        <input
          className="sheet-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder={kind === 'habit' ? 'Habit name…' : 'What needs doing?'}
          aria-label="Title"
          autoFocus
        />

        {kind === 'habit' && (
          <Field label="Repeats">
            <div className="option-group">
              <button
                type="button"
                className={`option${repeat === 'DAILY' ? ' option--on' : ''}`}
                onClick={() => setRepeat('DAILY')}
              >
                Every day
              </button>
              <button
                type="button"
                className={`option${repeat === 'WEEKLY' ? ' option--on' : ''}`}
                onClick={() => setRepeat('WEEKLY')}
              >
                Days of the week
              </button>
            </div>
            {repeat === 'WEEKLY' && (
              <div className="option-group" role="group" aria-label="Weekdays">
                {WEEKDAYS.map((label, index) => (
                  <button
                    key={index}
                    type="button"
                    className={`option option--day${
                      weekdays.includes(index) ? ' option--on' : ''
                    }`}
                    onClick={() => toggleWeekday(index)}
                    aria-pressed={weekdays.includes(index)}
                  >
                    {label}
                    <span className="sr-only">day {index}</span>
                  </button>
                ))}
              </div>
            )}
          </Field>
        )}

        <Field label="Time of day">
          <div className="option-group">
            {DAY_PARTS.map((option) => (
              <button
                key={option.label}
                type="button"
                className={`option${dayPart === option.value ? ' option--on' : ''}`}
                onClick={() => setDayPart(option.value)}
                aria-pressed={dayPart === option.value}
              >
                <DayPartChip dayPart={option.value} size={18} />
                {option.label}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Urgency">
          <div className="option-group">
            {urgencies.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`option${urgency === option.value ? ' option--on' : ''}`}
                onClick={() => setUrgency(option.value)}
                aria-pressed={urgency === option.value}
              >
                {option.label}
              </button>
            ))}
          </div>
        </Field>

        <div className="sheet-actions">
          <span className="sheet-hint">
            {kind === 'habit'
              ? 'Repeats from today onward'
              : urgency === 'SOMEDAY'
                ? 'No date — carries forward until done'
                : dateLabel}
          </span>
          <button type="button" className="btn btn--quiet" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn--primary" disabled={busy}>
            Add {kind === 'habit' ? 'habit' : 'task'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="sheet-field">
      <div className="sheet-label">{label}</div>
      {children}
    </div>
  );
}

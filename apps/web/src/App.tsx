import { useCallback, useMemo, useState } from 'react';
import './App.css';
import type { CreateRoutineInput, CreateTaskInput, FeedItem } from './api/types';
import { AddSheet } from './components/AddSheet';
import { DayHeader } from './components/DayHeader';
import { HabitsView } from './components/HabitsView';
import { PlusIcon } from './components/Icons';
import { ReviewStrip } from './components/ReviewStrip';
import { SyncBadge } from './components/SyncBadge';
import { TaskRow } from './components/TaskRow';
import { ViewPills, type View } from './components/ViewPills';
import { useDay } from './hooks/useDay';
import { useRoutines } from './hooks/useRoutines';
import { addDays, todayKey } from './lib/day';

export default function App() {
  // Computed once per mount: the app is not open across a midnight boundary
  // often enough to justify a ticking clock.
  const today = useMemo(() => todayKey(), []);

  const [view, setView] = useState<View>('home');
  const [date, setDate] = useState(today);
  const [adding, setAdding] = useState(false);

  const day = useDay(date);
  const routines = useRoutines(today);

  // The two screens are two views of the same completions, so anything that
  // changes one has to refresh the other — checking a habit off at home must
  // move its streak, and vice versa.
  const { reload: reloadDay } = day;
  const { reload: reloadRoutines } = routines;

  const toggleItem = useCallback(
    async (item: FeedItem) => {
      await day.toggle(item);
      if (item.kind === 'routine') await reloadRoutines();
    },
    [day, reloadRoutines],
  );

  const toggleHabitDay = useCallback(
    async (id: string, on: string) => {
      await routines.toggleOn(id, on);
      await reloadDay();
    },
    [routines, reloadDay],
  );

  const addHabit = useCallback(
    async (input: CreateRoutineInput) => {
      await routines.add(input);
      await reloadDay();
    },
    [routines, reloadDay],
  );

  const deleteHabit = useCallback(
    async (id: string) => {
      await routines.remove(id);
      await reloadDay();
    },
    [routines, reloadDay],
  );

  const addTask = useCallback(
    async (input: CreateTaskInput) => {
      await day.addTask(input);
    },
    [day],
  );

  const active = view === 'habits' ? routines : day;

  return (
    <div className="app">
      <main className="shell">
        <div className="topbar">
          <ViewPills view={view} onView={setView} />
          <SyncBadge
            status={active.status}
            syncedAt={active.syncedAt}
            waking={active.waking}
            onRetry={active.reload}
          />
        </div>

        {/* Only when there is nothing to show. A failed refresh on top of a
            cached day is not worth a banner — the badge says "Not synced",
            and the day is right there. */}
        {active.status === 'error' && (
          <p className="notice notice--error">
            Could not reach the API — {active.error}{' '}
            <button type="button" className="link" onClick={active.reload}>
              retry
            </button>
          </p>
        )}

        {active.waking && !active.data && (
          <p className="notice">
            Waking the server… the free tier sleeps after a while, so this first
            request can take up to a minute.
          </p>
        )}

        {view === 'habits' ? (
          routines.data && (
            <HabitsView
              routines={routines.data}
              onToggle={toggleHabitDay}
              onDelete={deleteHabit}
            />
          )
        ) : (
          day.data && (
            <>
              <DayHeader
                label={day.data.label}
                date={date}
                today={today}
                progress={day.data.progress}
                onStep={(days) => setDate((current) => addDays(current, days))}
                onToday={() => setDate(today)}
              />

              {date === today && (
                <ReviewStrip
                  items={day.data.review}
                  today={today}
                  onMove={day.moveToDay}
                  onDrop={day.drop}
                  onMoveAll={day.moveAll}
                />
              )}

              {day.data.progress.total === 0 ? (
                <p className="empty">Nothing scheduled. A clear day.</p>
              ) : (
                // One flat list. The sections still order it — anytime, then
                // morning through night — but each row's coloured chip already
                // says which part of the day it belongs to, so headings on top
                // of that would only repeat the icon in words.
                day.data.sections
                  .flatMap((section) => section.items)
                  .map((item) => (
                    <TaskRow
                      key={item.id}
                      item={item}
                      today={today}
                      onToggle={toggleItem}
                      onDelete={(row) => day.removeTask(row.taskId ?? row.id)}
                    />
                  ))
              )}
            </>
          )
        )}

        {/* Only on a genuinely cold device — with a cached copy there is
            already a day on screen, and the badge carries the status. The
            waking notice above supersedes this once it appears. */}
        {active.loading && !active.data && !active.waking && (
          <p className="notice">Loading…</p>
        )}
      </main>

      <button
        type="button"
        className="fab"
        onClick={() => setAdding(true)}
        aria-label="Add a task or habit"
      >
        <PlusIcon size={24} />
      </button>

      {adding && (
        <AddSheet
          date={date}
          dateLabel={day.data?.label ?? date}
          onClose={() => setAdding(false)}
          onAddTask={addTask}
          onAddHabit={addHabit}
        />
      )}
    </div>
  );
}

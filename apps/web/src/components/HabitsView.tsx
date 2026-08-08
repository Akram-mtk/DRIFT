import type { Routine } from '../api/types';
import { HabitCard } from './HabitCard';

interface HabitsViewProps {
  routines: Routine[];
  onToggle: (id: string, date: string) => void;
  onDelete: (id: string) => void;
}

export function HabitsView({ routines, onToggle, onDelete }: HabitsViewProps) {
  return (
    <>
      <header className="day-head">
        <div>
          <div className="day-kicker">Habits</div>
          <h1 className="day-title">Repeating</h1>
        </div>
      </header>

      {routines.length === 0 ? (
        <p className="empty">
          No repeating tasks yet. Add one with the + button to start a streak.
        </p>
      ) : (
        <div className="habits">
          {routines.map((routine) => (
            <HabitCard
              key={routine.id}
              routine={routine}
              onToggle={onToggle}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </>
  );
}

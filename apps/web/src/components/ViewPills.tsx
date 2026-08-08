export type View = 'home' | 'habits';

const VIEWS: Array<{ value: View; label: string }> = [
  { value: 'home', label: 'Home' },
  { value: 'habits', label: 'Habits' },
];

interface ViewPillsProps {
  view: View;
  onView: (view: View) => void;
}

export function ViewPills({ view, onView }: ViewPillsProps) {
  return (
    <nav className="pills">
      {VIEWS.map((option) => (
        <button
          key={option.value}
          type="button"
          className={`pill${view === option.value ? ' pill--on' : ''}`}
          onClick={() => onView(option.value)}
          aria-current={view === option.value}
        >
          {option.label}
        </button>
      ))}
    </nav>
  );
}

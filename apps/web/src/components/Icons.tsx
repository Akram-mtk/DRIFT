/** The inline stroked icons from the mock, at their original 24×24 geometry. */
interface IconProps {
  size?: number;
  className?: string;
}

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export function CheckIcon({ size = 14 }: IconProps) {
  return (
    <svg {...base} width={size} height={size} strokeWidth={3}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export function PlusIcon({ size = 15 }: IconProps) {
  return (
    <svg {...base} width={size} height={size} strokeWidth={2.6}>
      <path d="M5 12h14M12 5v14" />
    </svg>
  );
}

/** Morning — sun rising over a horizon. */
export function SunriseIcon({ size = 14 }: IconProps) {
  return (
    <svg {...base} width={size} height={size} strokeWidth={2}>
      <path d="M12 2v7M8 8l4-4 4 4M16 18a4 4 0 0 0-8 0M2 22h20" />
    </svg>
  );
}

/** Evening — sun with rays. */
export function SunIcon({ size = 14 }: IconProps) {
  return (
    <svg {...base} width={size} height={size} strokeWidth={2}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2" />
    </svg>
  );
}

/** Night — crescent moon. */
export function MoonIcon({ size = 13 }: IconProps) {
  return (
    <svg {...base} width={size} height={size} strokeWidth={2}>
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}

/** Anytime — a whole-day task, no particular part of it. */
export function CircleIcon({ size = 13 }: IconProps) {
  return (
    <svg {...base} width={size} height={size} strokeWidth={2}>
      <circle cx="12" cy="12" r="7" />
    </svg>
  );
}

export function FlameIcon({ size = 13 }: IconProps) {
  return (
    <svg {...base} width={size} height={size} strokeWidth={2}>
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.4-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5Z" />
    </svg>
  );
}

export function ChevronLeftIcon({ size = 16 }: IconProps) {
  return (
    <svg {...base} width={size} height={size} strokeWidth={2.4}>
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

export function ChevronRightIcon({ size = 16 }: IconProps) {
  return (
    <svg {...base} width={size} height={size} strokeWidth={2.4}>
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

export function TrashIcon({ size = 14 }: IconProps) {
  return (
    <svg {...base} width={size} height={size} strokeWidth={2}>
      <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />
    </svg>
  );
}

export function ArrowRightIcon({ size = 14 }: IconProps) {
  return (
    <svg {...base} width={size} height={size} strokeWidth={2.2}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

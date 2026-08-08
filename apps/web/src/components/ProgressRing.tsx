interface ProgressRingProps {
  done: number;
  total: number;
  size?: number;
  stroke?: number;
  color?: string;
  children?: React.ReactNode;
}

/** The dasharray ring from the mock: a full circle with the remainder offset. */
export function ProgressRing({
  done,
  total,
  size = 76,
  stroke = 8,
  color = 'var(--green)',
  children,
}: ProgressRingProps) {
  const radius = (size - stroke) / 2 - 1;
  const circumference = 2 * Math.PI * radius;
  const ratio = total === 0 ? 0 : done / total;
  const center = size / 2;

  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth={stroke}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - ratio)}
          transform={`rotate(-90 ${center} ${center})`}
          style={{ transition: 'stroke-dashoffset .25s ease' }}
        />
      </svg>
      <div className="ring-label">{children}</div>
    </div>
  );
}

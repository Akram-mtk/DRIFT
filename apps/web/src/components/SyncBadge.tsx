import { useEffect, useState } from 'react';
import type { SyncStatus } from '../hooks/useRemote';

interface SyncBadgeProps {
  status: SyncStatus;
  /** When the server last confirmed the data, epoch ms. */
  syncedAt: number | null;
  /** True once a request has been slow enough to look like a cold start. */
  waking: boolean;
  onRetry: () => void;
}

const LABEL: Record<SyncStatus, string> = {
  syncing: 'Syncing',
  synced: 'Synced',
  stale: 'Not synced',
  offline: 'Offline',
  error: 'No connection',
};

/** How often the "3m ago" text is recomputed. */
const TICK_MS = 30_000;

/**
 * Shows whether what is on screen matches the server.
 *
 * With the cache seeding first paint, the app looks identical whether it is
 * live or working from a copy saved yesterday — so it has to say which, or the
 * silence becomes its own kind of lie. Tapping forces a resync.
 */
export function SyncBadge({
  status,
  syncedAt,
  waking,
  onRetry,
}: SyncBadgeProps) {
  const ago = useRelativeTime(syncedAt);

  const label = waking && status === 'syncing' ? 'Waking server' : LABEL[status];

  // Once synced, the timestamp is the informative half — "Synced" on its own
  // is true a second after load and still true an hour later.
  const detail =
    status === 'synced' || status === 'stale' || status === 'offline'
      ? ago
      : null;

  const busy = status === 'syncing';

  return (
    <button
      type="button"
      className={`sync sync--${status}`}
      onClick={onRetry}
      disabled={busy}
      aria-live="polite"
      title={
        syncedAt
          ? `Last synced ${new Date(syncedAt).toLocaleString()}`
          : 'Never synced on this device'
      }
    >
      <span className="sync-dot" aria-hidden="true" />
      <span className="sync-label">
        {label}
        {detail && <span className="sync-ago"> · {detail}</span>}
      </span>
    </button>
  );
}

/** "just now" / "4m" / "2h" / "3d", re-rendered on its own slow timer. */
function useRelativeTime(at: number | null): string | null {
  // Held in state rather than read during render: the elapsed time has to
  // change only when the timer says so, not on every unrelated re-render.
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!at) return;
    const timer = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(timer);
  }, [at]);

  if (!at) return null;

  // A sync that just happened leaves `now` behind `at` until the next tick.
  // The clamp turns that into "just now", which is what it is.
  const seconds = Math.max(0, Math.round((now - at) / 1000));
  if (seconds < 60) return 'just now';

  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  return `${Math.round(hours / 24)}d ago`;
}

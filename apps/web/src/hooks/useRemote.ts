import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { readCache, writeCache } from '../lib/cache';

/** How long a request may take before we assume Render is cold-starting. */
const WAKING_AFTER_MS = 2000;

/**
 * What the app is showing relative to the server.
 *
 * `stale` is the interesting one: real data on screen, from the cache, with
 * the server unreachable. That is a working app, not a broken one, and it
 * should not read like an error.
 */
export type SyncStatus = 'syncing' | 'synced' | 'stale' | 'offline' | 'error';

export interface Remote<T> {
  data: T | null;
  error: string | null;
  /** True once a request has been outstanding long enough to look stuck. */
  waking: boolean;
  loading: boolean;
  status: SyncStatus;
  /** When the server last confirmed this data, epoch ms. */
  syncedAt: number | null;
  reload: () => Promise<void>;
  /** Apply a local change immediately, before the server has confirmed it. */
  patch: (next: T) => void;
}

/** What we last received, tagged with the request it belongs to. */
interface Snapshot<T> {
  key: string;
  /** Which `reloadCount` produced this; identifies the request, not the data. */
  run: number;
  data: T | null;
  error: string | null;
  /** Last server confirmation, carried across failed reloads. */
  at: number;
  /** Set by `patch`: on screen, but not yet acknowledged by the server. */
  optimistic: boolean;
}

/**
 * Fetches a resource, re-fetches when `key` changes, and renders from
 * localStorage in the meantime.
 *
 * Render's free tier sleeps after ~15 minutes, so the first request of a
 * session can take the better part of a minute. Rather than hold an empty
 * screen for that long, the last response for this key paints immediately and
 * the fetch reconciles when it lands — the wait stops being something you sit
 * through and becomes a dot in the corner.
 *
 * `name` namespaces the cache: `useDay` and `useRoutines` are both keyed by a
 * date string and would otherwise overwrite each other.
 *
 * A failed reload keeps whatever was already on screen. Losing the day's tasks
 * because a refresh timed out is strictly worse than showing them slightly out
 * of date, and `status` says which it is.
 */
export function useRemote<T>(
  name: string,
  key: string,
  loader: () => Promise<T>,
): Remote<T> {
  const [snapshot, setSnapshot] = useState<Snapshot<T> | null>(null);
  const [waking, setWaking] = useState(false);
  const [reloadCount, setReloadCount] = useState(0);
  const [online, setOnline] = useState(() => navigator.onLine);

  const cacheKey = `${name}:${key}`;
  // Only re-read when the key moves; this runs during render, and hitting
  // localStorage on every keystroke elsewhere in the tree would be wasteful.
  const cached = useMemo(() => readCache<T>(cacheKey), [cacheKey]);

  // Latest-ref pattern: keeps an inline arrow at the call site from
  // re-triggering the fetch on every render.
  const loaderRef = useRef(loader);
  useEffect(() => {
    loaderRef.current = loader;
  });

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      if (!cancelled) setWaking(true);
    }, WAKING_AFTER_MS);

    loaderRef
      .current()
      .then(
        (data) => {
          if (cancelled) return;
          writeCache(cacheKey, data);
          setSnapshot({
            key,
            run: reloadCount,
            data,
            error: null,
            at: Date.now(),
            optimistic: false,
          });
        },
        (cause: unknown) => {
          if (cancelled) return;
          setSnapshot((previous) => {
            const kept = previous?.key === key ? previous : null;
            return {
              key,
              run: reloadCount,
              // Hold the line: a failed refresh must not blank the screen.
              data: kept?.data ?? null,
              error: cause instanceof Error ? cause.message : String(cause),
              at: kept?.at ?? 0,
              optimistic: false,
            };
          });
        },
      )
      .finally(() => {
        clearTimeout(timer);
        if (!cancelled) setWaking(false);
      });

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [cacheKey, key, reloadCount]);

  const reload = useCallback(async () => {
    setReloadCount((count) => count + 1);
  }, []);

  // Reopening the phone is the moment the data is most likely to be wrong:
  // it is a new day, or the app has been backgrounded since morning. Coming
  // back online is the other. Both revalidate rather than trusting the cache.
  useEffect(() => {
    const revalidate = () => {
      if (document.visibilityState === 'visible') void reload();
    };
    const wentOnline = () => {
      setOnline(true);
      void reload();
    };
    const wentOffline = () => setOnline(false);

    document.addEventListener('visibilitychange', revalidate);
    window.addEventListener('online', wentOnline);
    window.addEventListener('offline', wentOffline);
    return () => {
      document.removeEventListener('visibilitychange', revalidate);
      window.removeEventListener('online', wentOnline);
      window.removeEventListener('offline', wentOffline);
    };
  }, [reload]);

  const patch = useCallback(
    (next: T) =>
      setSnapshot((previous) => ({
        key,
        run: previous?.key === key ? previous.run : -1,
        data: next,
        error: null,
        at: previous?.key === key ? previous.at : 0,
        // Not written to the cache: this change has not reached the server,
        // and a restart should show the last thing that actually did.
        optimistic: true,
      })),
    [key],
  );

  // Anything tagged with another key belongs to a date we have navigated away
  // from — display the cache for the new one instead.
  const current = snapshot?.key === key ? snapshot : null;
  const settled = current !== null && current.run === reloadCount;
  const pending = !settled || current.optimistic;

  const data = current?.data ?? cached?.data ?? null;
  const syncedAt = (current?.at || cached?.at) ?? null;

  // Offline outranks in-flight: a request made with no connection is not
  // really pending, it is about to fail, and "Offline" is the useful word.
  const status: SyncStatus = !online
    ? 'offline'
    : pending
      ? 'syncing'
      : current?.error
        ? data
          ? 'stale' // the request failed, but there is still a day on screen
          : 'error'
        : 'synced';

  return {
    data,
    error: current?.error ?? null,
    waking,
    loading: pending,
    status,
    syncedAt,
    reload,
    patch,
  };
}

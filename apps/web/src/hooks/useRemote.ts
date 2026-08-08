import { useCallback, useEffect, useRef, useState } from 'react';

/** How long a request may take before we assume Render is cold-starting. */
const WAKING_AFTER_MS = 2000;

export interface Remote<T> {
  data: T | null;
  error: string | null;
  /** True once a request has been outstanding long enough to look stuck. */
  waking: boolean;
  loading: boolean;
  reload: () => Promise<void>;
  /** Apply a local change immediately, before the server has confirmed it. */
  patch: (next: T) => void;
}

/** What we last received, tagged with the key it belongs to. */
interface Snapshot<T> {
  key: string;
  data: T | null;
  error: string | null;
}

/**
 * Fetches a resource and re-fetches when `key` changes.
 *
 * Render's free tier sleeps after ~15 minutes, so the first request of a
 * session can take the better part of a minute. `waking` lets the UI say so
 * rather than sitting on an empty list that looks like a bug.
 *
 * `loading` is derived by comparing the snapshot's key against the requested
 * one, so a key change reads as loading during the very same render rather
 * than needing a synchronous setState inside the effect.
 */
export function useRemote<T>(key: string, loader: () => Promise<T>): Remote<T> {
  const [snapshot, setSnapshot] = useState<Snapshot<T> | null>(null);
  const [waking, setWaking] = useState(false);
  const [reloadCount, setReloadCount] = useState(0);

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
          if (!cancelled) setSnapshot({ key, data, error: null });
        },
        (cause: unknown) => {
          if (!cancelled) {
            setSnapshot({
              key,
              data: null,
              error: cause instanceof Error ? cause.message : String(cause),
            });
          }
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
  }, [key, reloadCount]);

  const fresh = snapshot?.key === key ? snapshot : null;

  const reload = useCallback(async () => {
    setReloadCount((count) => count + 1);
  }, []);

  const patch = useCallback(
    (next: T) => setSnapshot({ key, data: next, error: null }),
    [key],
  );

  return {
    data: fresh?.data ?? null,
    error: fresh?.error ?? null,
    waking,
    loading: fresh === null,
    reload,
    patch,
  };
}

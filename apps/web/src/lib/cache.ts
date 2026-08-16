/**
 * Last-known-good copies of API responses, kept in localStorage.
 *
 * The point is the first paint. Render's free tier sleeps after ~15 minutes,
 * so opening the app cold means waiting the better part of a minute before
 * anything appears. Seeding state from here means the day is on screen
 * immediately and the network fetch just confirms or corrects it.
 *
 * localStorage rather than IndexedDB deliberately: it is synchronous, so the
 * very first render already has the data. An async store would still flash an
 * empty screen for a frame, which is the exact thing being fixed.
 *
 * Only server-confirmed responses are written. Optimistic edits stay in React
 * state, so a cache hit always means "the last thing the API actually said" —
 * never a local change that may never have landed.
 */

const PREFIX = 'drift.cache.v2:';

/** Older prefixes to sweep on boot when the shape of a payload changes. */
const LEGACY = 'drift.cache.';

/** Roughly two months of browsing back and forth before the oldest fall off. */
const MAX_ENTRIES = 60;

export interface Cached<T> {
  data: T;
  /** When the server gave us this, epoch ms. */
  at: number;
}

/**
 * Private-mode Safari and locked-down browsers throw on access rather than
 * returning null, so every entry point goes through this.
 */
function storage(): Storage | null {
  try {
    const probe = '__drift__';
    window.localStorage.setItem(probe, probe);
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    return null;
  }
}

const store = storage();

export function readCache<T>(key: string): Cached<T> | null {
  if (!store) return null;
  try {
    const raw = store.getItem(PREFIX + key);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Cached<T>;
    // A hand-edited or half-written entry should behave like a miss, not
    // like data — the app renders this before any validation gets a look in.
    return parsed && typeof parsed.at === 'number' && 'data' in parsed
      ? parsed
      : null;
  } catch {
    return null;
  }
}

export function writeCache<T>(key: string, data: T): void {
  if (!store) return;
  const entry: Cached<T> = { data, at: Date.now() };

  try {
    store.setItem(PREFIX + key, JSON.stringify(entry));
  } catch {
    // Almost certainly the quota. Drop the oldest half and take one more
    // shot; if it still fails the cache is simply unavailable, which is
    // survivable — the app falls back to plain fetching.
    evict(Math.ceil(MAX_ENTRIES / 2));
    try {
      store.setItem(PREFIX + key, JSON.stringify(entry));
    } catch {
      return;
    }
  }

  const keys = ours();
  if (keys.length > MAX_ENTRIES) evict(keys.length - MAX_ENTRIES);
}

/** Every cache key we own, current version only. */
function ours(): string[] {
  if (!store) return [];
  const keys: string[] = [];
  for (let i = 0; i < store.length; i += 1) {
    const key = store.key(i);
    if (key?.startsWith(PREFIX)) keys.push(key);
  }
  return keys;
}

/** When an entry was written; 0 for anything unreadable, so it goes first. */
function entryTime(from: Storage, key: string): number {
  try {
    return (JSON.parse(from.getItem(key) ?? '{}') as Cached<unknown>).at ?? 0;
  } catch {
    return 0;
  }
}

/** Drop the `count` least recently refreshed entries. */
function evict(count: number): void {
  const from = store;
  if (!from || count <= 0) return;

  ours()
    .map((key) => ({ key, at: entryTime(from, key) }))
    .sort((a, b) => a.at - b.at)
    .slice(0, count)
    .forEach(({ key }) => from.removeItem(key));
}

/**
 * Clear entries left by earlier cache versions. Called once on boot: a payload
 * whose shape has changed since it was written would otherwise be rendered as
 * if it were current, and crash somewhere far from here.
 */
export function pruneLegacyCache(): void {
  if (!store) return;
  const stale: string[] = [];
  for (let i = 0; i < store.length; i += 1) {
    const key = store.key(i);
    if (key?.startsWith(LEGACY) && !key.startsWith(PREFIX)) stale.push(key);
  }
  stale.forEach((key) => store.removeItem(key));
}

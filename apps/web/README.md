# DRIFT web

The frontend for [DRIFT](../../README.md), a personal todo app. Vite + React 19 + TypeScript, served as a static site and talking to the API through `/api`.

For the product rules, deployment, and the API reference, see the [root README](../../README.md).

## Running it

From the repo root, after `npm install`:

```bash
npm run dev -w web          # http://localhost:5173
```

Vite proxies `/api` to `http://localhost:3000`, so start the API alongside it (`npm run dev` from the root starts both).

## Scripts

```bash
npm run dev -w web          # Vite dev server with HMR
npm run build -w web        # type-check (tsc -b), then build to dist/
npm run preview -w web      # serve the built dist/ locally
npm run lint -w web         # ESLint
```

## Layout

```
src/
  App.tsx              top-level screens and view switching
  main.tsx             entry point
  api/                 fetch client and response types
  hooks/               data hooks (day, routines, remote state)
  components/          Today, Habits, and shared UI pieces
  lib/
    day.ts             "today" in Africa/Algiers, plus day-key helpers
    cache.ts           localStorage copy of the last server-confirmed responses
public/
  _redirects           SPA fallback rules, copied into dist/ for Netlify
```

## Things to know

- **"Today" is Algeria time.** `src/lib/day.ts` computes the day key in `Africa/Algiers`, not the browser's zone. The API does the same, so both sides agree on the date.
- **The screen renders from cache first.** `src/lib/cache.ts` keeps the last response the server confirmed in localStorage, so the app paints immediately even while the free-tier API wakes up. Optimistic edits stay in memory and are never written to the cache.
- **The status badge shows live or saved.** The badge in the top-right tells you whether the data on screen came from the server or from the cache.
- **Storage can be unavailable.** Private-mode browsers can throw on localStorage access; every read and write goes through a guarded wrapper, so the app still works without it.

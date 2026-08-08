# DRIFT

A personal todo app. One user, no auth.

- The day is split into **Morning / Evening / Night**, plus an **Anytime** bucket for tasks that belong to the day rather than a part of it.
- Urgency is **High / Med / Low**, plus **Someday**.
- **Someday** tasks are undated and reappear every day until they're done.
- Dated tasks that go unfinished are never moved silently — they collect in a **review strip** at the top of Today, where each is explicitly moved or dropped.
- Repeating tasks run **every day** or **on chosen weekdays**, and keep per-day history so the Habits screen can show streaks, completion rate and a 7-day strip.

```
apps/api   NestJS + Prisma + Postgres
apps/web   Vite + React
```

## Local development

```bash
npm install

# One-time: a local Postgres, no Docker needed.
cd apps/api && npx prisma dev --name drift --detach
# Copy the printed URL into apps/api/.env as DATABASE_URL (see .env.example).

npm run db:deploy -w api    # apply migrations
npm run db:seed -w api      # sample tasks and habits, positioned around today

npm run dev                 # api on :3000, web on :5173
```

Vite proxies `/api` to `localhost:3000`, so the frontend only ever makes same-origin calls.

Other commands:

```bash
npm test -w api             # streak/rate/schedule logic
npm run lint -w api
npm run lint -w web
npm run db:studio -w api    # browse the data
```

## How dates work

Calendar days are stored as plain `YYYY-MM-DD` strings, never timestamps.

**"Today" always means today in Algeria** (`Africa/Algiers`), hardcoded on both sides — `apps/api/src/common/date.util.ts` and `apps/web/src/lib/day.ts`. The hosting server runs in UTC and the browser could be anywhere, so neither is trusted to decide what day it is. The client still sends the day key on each request (`GET /api/days/2026-08-07`); it just computes it in Algiers time.

## API

| Method | Route | |
| --- | --- | --- |
| `GET` | `/api/days/:date` | everything the Today screen needs in one call |
| `GET` | `/api/review?today=` | unfinished tasks from before `today` |
| `POST` | `/api/review/:taskId/move` | `{ toDate }` — pull it forward, records where it came from |
| `POST` | `/api/review/:taskId/drop` | archive it |
| `POST` | `/api/review/move-all` | `{ today, toDate }` |
| `GET POST PATCH DELETE` | `/api/tasks[/:id]` | |
| `POST` | `/api/tasks/:id/toggle` | |
| `GET POST PATCH DELETE` | `/api/routines[/:id]` | list includes `streak`, `rate`, `last7` |
| `POST` | `/api/routines/:id/toggle?date=` | check/uncheck one day |
| `GET` | `/api/health` | Render health check, and the frontend's wake-up ping |

Routine occurrences are computed on read from the schedule — only *completions* are stored, so there is no cron job and no occurrence table.

## Deploying

Frontend on Netlify, API and database on Render. Netlify rewrites `/api/*` to the Render service, so the browser always talks to one origin and CORS never enters the picture.

1. **Render** — New > Blueprint, pointed at this repo. `render.yaml` defines the web service and the free Postgres, and wires `DATABASE_URL` between them.
2. **Netlify** — New site from this repo. `netlify.toml` has the build config; edit the `/api/*` redirect to your actual Render URL (`https://<render-service>.onrender.com`).
3. Seed the deployed database once, from your machine, with `DATABASE_URL` pointed at Render's **external** URL: `npm run db:seed -w api`.

### Two things about the free tier

**The API sleeps.** Render free web services spin down after ~15 minutes idle, so the first request after a quiet spell can take up to a minute. The frontend shows a "waking the server" notice instead of an empty list while it waits.

**The database expires.** Render deletes free Postgres instances 30 days after creation, so take a dump now and then with the PostgreSQL client tools:

```bash
pg_dump "$DATABASE_URL" -Fc -f drift.dump
pg_restore -d "$DATABASE_URL" --clean --if-exists --no-owner drift.dump
```

Rebuilding after an expiry: create a new Render Postgres, update `DATABASE_URL`, run `npm run db:deploy -w api`, then restore (or just re-seed).

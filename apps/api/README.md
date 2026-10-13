# DRIFT API

The backend for [DRIFT](../../README.md), a personal todo app. NestJS 11 + Prisma 7 + Postgres. All routes are served under `/api`.

For the product rules, the full route table, and deployment, see the [root README](../../README.md).

## Setup

From the repo root, after `npm install`:

```bash
cd apps/api
npx prisma dev --name drift --detach     # local Postgres, no Docker needed
cp .env.example .env                     # then set DATABASE_URL to the printed URL
npm run db:deploy                        # apply migrations
npm run start:dev                        # http://localhost:3000/api
```

`.env` variables:

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | yes | Postgres connection string. On Supabase, use the session pooler URI (port `5432`). |
| `PORT` | no | Defaults to `3000`. |

## Scripts

```bash
npm run start:dev           # watch mode
npm run build               # nest build -> dist/
npm run start:prod          # node dist/main
npm test                    # Jest unit tests (streak, rate, and schedule logic)
npm run lint
npm run format
npm run db:generate         # prisma generate
npm run db:migrate          # prisma migrate dev (creates a new migration locally)
npm run db:deploy           # prisma migrate deploy (applies existing migrations)
npm run db:studio           # browse the database
```

## Layout

```
src/
  main.ts                  bootstrap: /api prefix, validation pipe, listens on 0.0.0.0
  app.module.ts            wires the feature modules together
  prisma/                  PrismaService, backed by the pg adapter
  tasks/                   task CRUD, toggle, and the review actions
  routines/                routine CRUD, toggling a day, streak/rate/last7
    streaks.util.ts        pure schedule and streak functions
    streaks.util.spec.ts   tests for the above
  day/                     GET /api/days/:date, the single call behind Today
  health/                  GET /api/health (Render health check)
  common/
    date.util.ts           day arithmetic pinned to Africa/Algiers
    types.ts               shared enums and constants
prisma/
  schema.prisma
  migrations/              applied in order by migrate deploy
```

## Design notes

- **Dates are `YYYY-MM-DD` strings.** Calendar days are never stored as timestamps. `src/common/date.util.ts` defines "today" in `Africa/Algiers`, regardless of the server's timezone.
- **Routine occurrences are computed, not stored.** Only completions are persisted. Whether a routine applies on a given day is derived from its schedule (`startDate`, `endDate`, `repeat`, `weekdays`) at read time, so there is no cron job and no occurrence table.
- **Streaks skip today when it is still open.** A scheduled but unchecked today does not count as a miss, so a streak doesn't read zero until you tick the box.
- **Input is validated globally.** `ValidationPipe` runs with `whitelist` and `transform`, so unknown fields are dropped and DTOs are coerced.
- **Migrations must be additive in production.** Migrations run in the Render build while the previous version is still serving. Add columns and tables; don't drop anything the running code reads.
- **Binding to `0.0.0.0` is deliberate.** Render routes traffic to all interfaces, and the default bind would fail the health check.

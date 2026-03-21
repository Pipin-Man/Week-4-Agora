# Agora

Multi-room live chat app built with Astro SSR + HTMX + SSE + Alpine + PostgreSQL/Drizzle.

## Features

- Dual entry: normal profile or guest
- Lobby + custom room creation
- Real-time message/presence/typing updates over SSE
- Persistent messages in PostgreSQL
- Invite link per room (`/join/:roomSlug`)
- Mention parsing (`@username`, `@everyone`) with mention bell
- Mention autocomplete dropdown
- Sound notifications with mute toggle
- Profile rename
- Mobile responsive layout

## Stack

- Astro (SSR, Node adapter)
- HTMX + htmx SSE extension
- Alpine.js
- Tailwind CSS v4
- PostgreSQL + Drizzle ORM

## Scripts

- `npm run dev` - run local dev server
- `npm run check` - Astro/TS checks
- `npm run test -- --pool=threads --maxWorkers=1` - tests (safe mode for this env)
- `npm run build` - production build
- `npm run start` - run built server (`dist/server/entry.mjs`)
- `npm run db:push` - apply schema to configured PostgreSQL

## Local Setup

1. Copy env file:

```bash
cp .env.example .env
```

2. Install dependencies:

```bash
npm install
```

3. Apply DB schema:

```bash
npm run db:push
```

4. Start dev server:

```bash
npm run dev
```

## Routes

- `/` entry page
- `/chat/:roomSlug` room page
- `/join/:roomSlug` invite redirect
- `/settings/profile` rename page
- `/health` service health endpoint

## Railway Deploy (Recommended)

This repo includes `railway.toml` with build/start and health-check defaults.

1. Create a PostgreSQL service in Railway.
2. Create a web service from this repo.
3. Set environment variable `DATABASE_URL` from Railway Postgres.
4. Run one-time DB sync in Railway shell:

```bash
npm run db:push
```

5. Deploy and verify:
- open `/health`
- test two-browser realtime chat

## QA

Use `QA_CHECKLIST.md` before final submission/deploy.

## Notes

- SSE requires a persistent server process. Railway supports this.
- For production hardening, add CSRF protection and stricter per-route rate limits.


## Railway Node Version Fix

If Railway still builds with an older Node (for example `18.20.5`) after pulling latest commits, set service variable:

- `NIXPACKS_NODE_VERSION=20`

Then trigger a fresh deploy.
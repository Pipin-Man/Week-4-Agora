# Agora

Multi-room live chat app built with Astro SSR + HTMX + SSE + Alpine + PostgreSQL/Drizzle.

## 1) Current Snapshot

- Status: Functional v1 (core chat features working on Railway)
- Last technical audit: 2026-03-24
- Primary deployment model: Stateful Node process + PostgreSQL (Railway)
- Realtime model: `POST` for writes, `SSE` for live updates

## 2) Implemented Features (V1)

- Dual entry: `Normal profile` (nickname required, email optional, color) and `Guest`
- Rooms flow: default `Lobby`, create room, delete room (except Lobby), join via list or invite link
- Invite links: `/join/:roomSlug` and room invite modal
- Realtime messaging in rooms via SSE (new messages without refresh)
- Presence updates (online list updates live)
- Typing indicators (live)
- Mention support:
- `@username` parsing
- `@everyone`
- mention bell + unread mention list
- Sound notifications with on/off toggle
- Profile actions: rename + logout
- Theme toggle: light/dark
- Responsive layout with room and member controls
- Health endpoint: `/health`

## 3) Stack

- Astro (SSR, Node adapter)
- HTMX + native EventSource handling in chat page
- Alpine.js (modal/menu toggles)
- Tailwind CSS v4
- PostgreSQL + Drizzle ORM
- Railway deploy target

## 4) Local Run

1. Copy env file:

```bash
cp .env.example .env
```

2. Install:

```bash
npm install
```

3. Sync schema:

```bash
npm run db:push
```

4. Start dev server:

```bash
npm run dev
```

## 5) Scripts

- `npm run dev` - local dev server
- `npm run check` - Astro/TypeScript checks
- `npm run test -- --pool=threads --maxWorkers=1` - unit tests (safe mode)
- `npm run build` - production build
- `npm run start` - run built server
- `npm run db:push` - push schema to PostgreSQL (`--force`)

## 6) Routes

- `/` entry page
- `/rooms` rooms page
- `/chat/:roomSlug` chat room page
- `/join/:roomSlug` invite entry route
- `/settings/profile` profile page
- `/health` health check

API:

- `POST /api/session/start`
- `POST /api/session/rename`
- `POST /api/session/logout`
- `GET /api/session/mention-bell`
- `GET /api/session/notifications`
- `POST /api/rooms`
- `POST /api/rooms/:roomId/delete`
- `POST /api/rooms/:roomId/join`
- `POST /api/rooms/:roomId/messages`
- `GET /api/rooms/:roomId/messages?before=&limit=`
- `POST /api/rooms/:roomId/typing`
- `GET /api/rooms/:roomId/events` (SSE)
- `POST /api/presence/ping?roomId=`

## 7) Technical Audit Results (2026-03-24)

Executed successfully:

- `npm run check`
- `npm run test -- --pool=threads --maxWorkers=1`
- `npm run build`

Result summary:

- Build: PASS
- Type/astro diagnostics: PASS
- Unit tests: PASS (mentions parser tests)

## 8) Improvements Applied In This Audit

- Added explicit `is:inline` to HTMX CDN script in `BaseLayout.astro` (cleaner Astro script handling)
- Hardened messages history API cursor handling:
- returns `400 Invalid cursor` for invalid `before` date
- normalizes `limit` range to `1..50`
- Added cleanup on chat page unload:
- clears periodic ping interval
- clears periodic mention bell refresh interval
- clears typing/presence timers
- closes SSE connection

## 9) Known Risks / Gaps

High priority:

- In-memory SSE hub is single-process only. If app scales to multiple replicas, realtime broadcasts will split per instance.
- No CSRF token mechanism on POST routes (current cookie config is `sameSite=lax`, but CSRF hardening is still recommended).

Medium priority:

- No route-level rate limiting (message spam and typing spam possible).
- No explicit max message length validation in message POST route.
- Minimal automated tests (currently only mentions parser logic).
- `db:push --force` is convenient for bootcamp velocity but not ideal as long-term migration strategy.

Lower priority:

- Notification system currently focuses on unread mentions; no full notifications history view.
- No centralized application logging/metrics dashboard (useful for production debugging).

## 10) Recommended Next Steps (Priority Backlog)

1. Add max message length validation and friendly UI error.
2. Add basic rate limiting on message/typing routes.
3. Add CSRF token protection for mutating routes.
4. Add integration tests for:
- session start
- message POST flow
- SSE broadcast behavior
- room delete guard (Lobby cannot be deleted)
5. Replace in-memory broadcast with shared pub/sub for multi-instance deploys (Redis or Postgres NOTIFY/LISTEN).
6. Move from `db:push --force` to versioned migrations workflow in CI/deploy.
7. Add lightweight request logging and error correlation IDs.

## 11) Railway Deployment Notes

Required app variables:

- `DATABASE_URL` (copy from Railway Postgres service)
- `NIXPACKS_NODE_VERSION=20` (if builder defaults lower Node)

Recommended deploy flow:

1. Deploy app service
2. Verify `/health`
3. Run schema sync once (`npm run db:push`) when needed
4. Open app in two browsers/devices and confirm realtime behavior

## 12) Troubleshooting Quick Notes

- If session POST fails with cross-site POST restrictions, confirm app uses same origin URL and no mismatched domain in form flow.
- If realtime stops, check browser console for JS errors first, then verify `/api/rooms/:id/events` stream remains open.
- If app goes unhealthy on Railway, check `/health`, `DATABASE_URL`, and whether startup command binds `PORT`.

## 13) QA Checklist

Use `QA_CHECKLIST.md` for manual end-to-end validation before submission/demo.

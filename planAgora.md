# Agora V1 Kickoff Plan (SSE + SSR)

## 1) Summary
- **Project name:** Agora  
- **One-sentence goal:** Multi-room live chat app όπου messages, presence και typing indicators ενημερώνονται άμεσα χωρίς refresh.
- **Primary users:** Bootcamp evaluators, classmates/friends που μπαίνουν ταυτόχρονα από διαφορετικές συσκευές.
- **Success metric (v1):** 3+ ταυτόχρονοι χρήστες σε 2+ rooms με instant updates (<1s perceived), persistence μετά reconnect, και πλήρες deploy demo URL.

## 2) Product Scope (Decision-Complete)
- **Must have**
1. Dual entry: `Normal profile` (nickname required, email optional, color selectable) ή `Just passing by` guest.
2. Multi-room chat: default `Lobby`, create room, join room, room share link (`invite friend`).
3. Real-time flow: `POST` to send/update state, `SSE` to receive/broadcast HTML fragments.
4. Persistence: messages + rooms + membership/session-backed identity.
5. History pagination: load older messages on upward scroll / “load older”.
6. Presence: online users per room.
7. Typing indicators per room.
8. System messages (join/leave) with 60s disconnect grace period.
9. Mobile responsive UI with room list + active chat view.

- **Nice to have (priority order)**
1. `@mentions` with autocomplete + `@everyone`.
2. Mention bell across rooms (unread mention counter/state).
3. Sound notifications with mute toggle.

- **Out of scope (v1)**
1. Password auth / email verification / OAuth.
2. Private rooms + invite tokens (public rooms + share link only for v1).

## 3) Architecture, Interfaces, and UX Spec
- **Tech stack (locked):**
  - Frontend/SSR: `Astro 6` (Node adapter, full SSR)
  - Interactivity: `HTMX 2` + SSE extension, `Alpine.js`
  - Styling: `Tailwind CSS v4` (light/dark with CSS vars)
  - Backend runtime: Node process inside Astro server
  - DB/ORM: `PostgreSQL` from day 1 + `Drizzle ORM`
  - Deploy target: `Railway` (web service + Postgres)

- **Pages & routes**
  - Public: `/` (entry picker), `/join/:roomSlug` (invite entry redirect flow)
  - Protected-by-session: `/chat/:roomSlug`, `/settings/profile`
  - API routes:
    - `POST /api/session/start` (normal/guest entry)
    - `POST /api/session/rename`
    - `POST /api/rooms` (create room)
    - `POST /api/rooms/:roomId/join`
    - `POST /api/rooms/:roomId/messages`
    - `GET /api/rooms/:roomId/messages?before=<cursor>&limit=30`
    - `POST /api/rooms/:roomId/typing`
    - `POST /api/presence/ping`
    - `GET /api/rooms/:roomId/events` (SSE stream)
  - Required states: 404 room not found, empty room (no messages), empty room list (only Lobby), disconnected/reconnecting banner.

- **SSE event contract (server -> client)**
  - `message:new`, `message:updated` (if needed), `presence:update`, `typing:update`, `system:new`, `mention:notify`.
  - Payload strategy: server renders HTML partials; HTMX swaps target containers (messages list, online users list, typing row, bell indicator).

- **Data model (high-level)**
  - `users`: id, nickname, email(nullable), avatar_color, created_at, last_seen_at.
  - `sessions`: id, user_id(nullable for guest profile if unified later), mode(normal|guest), display_name, color, expires_at.
  - `rooms`: id, slug, name, description(nullable), created_by, created_at.
  - `room_members`: id, room_id, session_id/user_id, joined_at, last_active_at, status.
  - `messages`: id, room_id, sender_session_id/user_id, type(user|system), body, mentions(jsonb), created_at.
  - `mention_notifications`: id, room_id, message_id, target_user/session, seen_at(nullable).
  - Relationships: rooms 1-N messages, rooms N-N users via room_members.
  - Visibility rules: rooms public in v1; write/read only for joined sessions; nickname uniqueness enforced per room (not global).

- **UI direction**
  - Style: `clean`, `compact`, `lively`.
  - Themes: light + dark.
  - Default language: bilingual EN/GR labels/messages.
  - Components: message list with grouping, composer, room list, online list, typing strip, mention autocomplete dropdown, invite link modal, notification bell, sound toggle.

## 4) Delivery Plan (7 Days)
1. **Milestone 1 (Day 1-2):** Project setup (Astro SSR, Tailwind, Drizzle, Postgres), schema, session entry flow, Lobby + room creation/join.
2. **Milestone 2 (Day 3-4):** Core chat: send via POST, receive via SSE, persistence, history pagination, mobile layout baseline.
3. **Milestone 3 (Day 5-6):** Presence + typing + system messages + 60s grace disconnect + invite share link.
4. **Final polish (Day 7):** Mentions autocomplete + bell + sound toggle, UX/copy pass (EN/GR), Railway deploy + smoke test.

## 5) Test Plan, Acceptance Criteria, and Assumptions
- **Acceptance criteria**
  - Entry/Auth done when: user can enter via normal or guest mode and persist session across refresh.
  - Chat done when: two browsers in same room see new messages instantly without refresh.
  - Rooms done when: Lobby always exists, new rooms can be created/joined via list or share link.
  - Presence/typing done when: online list and typing indicator update live and clear correctly.
  - History done when: older messages load in correct order with cursor pagination.
  - Deploy done when: public Railway URL supports concurrent users on different networks.

- **Core scenarios**
1. User A + B join Lobby; A sends message; B sees instantly.
2. A types; B sees typing; indicator clears on send/timeout.
3. A disconnects and reconnects <60s; no false leave system message.
4. User receives mention in other room; bell updates.
5. Mobile user can switch rooms and send/receive normally.

- **Done =**
  - Build passes, DB migrations applied cleanly, manual multi-client QA checklist passes, and basic integration tests for message POST + SSE broadcast + pagination.

- **Assumptions/defaults chosen**
  - No passwords in v1.
  - Email is optional metadata (no verification flow).
  - Public rooms only in v1; invite = shareable room link.
  - Postgres is used from day 1 (no SQLite migration step).
  - SSE is one active stream per opened room view.

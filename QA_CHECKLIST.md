# Final QA Checklist (Agora)

## 1) Local Setup

- [ ] `npm install`
- [ ] copy `.env.example` to `.env`
- [ ] confirm `DATABASE_URL` points to Postgres
- [ ] run `npm run db:push`
- [ ] run `npm run dev`

## 2) Core User Flows

- [ ] open browser A and browser B
- [ ] both join `Lobby`
- [ ] A sends message, B receives instantly (no refresh)
- [ ] B sends message, A receives instantly
- [ ] refresh one tab and confirm message history persists

## 3) Presence / Typing / System

- [ ] typing indicator appears and clears in room
- [ ] online list updates when users join
- [ ] system message appears when user joins
- [ ] user disconnects and reconnects within 60s: no false leave message
- [ ] user disconnects >60s: leave message appears

## 4) Rooms / Invite / Profile

- [ ] create new room and auto-navigate into it
- [ ] share invite link `/join/:roomSlug` and verify join works
- [ ] rename profile in settings and confirm new display name is used

## 5) Mentions / Notifications / Sound

- [ ] `@username` mention renders and mention bell updates
- [ ] `@everyone` mention triggers mention event for room users
- [ ] sound toggle works (`Sound: On/Off`)

## 6) Build and Type Safety

- [ ] `npm run check` passes
- [ ] `npm run test -- --pool=threads --maxWorkers=1` passes
- [ ] `npm run build` passes

## 7) Railway Deployment

- [ ] Postgres service created in Railway
- [ ] web service connected to repo
- [ ] `DATABASE_URL` set in Railway variables
- [ ] one-time DB sync run: `npm run db:push`
- [ ] deployment is green and `/health` returns `{ ok: true }`
- [ ] verify 2-device real-time chat from public URL

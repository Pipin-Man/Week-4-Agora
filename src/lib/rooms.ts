import { and, desc, eq, gt, lt, sql } from "drizzle-orm";
import { LOBBY_SLUG, PRESENCE_STALE_MS } from "./constants";
import { getDb } from "./db";
import { mentionNotifications, messages, roomMembers, rooms, sessions, users } from "./schema";
import { parseMentions } from "./mentions";
import { slugify } from "./utils";

let lobbyInit: Promise<void> | null = null;
const ROOM_LIST_CACHE_MS = 5000;
let roomListCache: { value: typeof rooms.$inferSelect[]; expiresAt: number } | null = null;

export async function ensureLobby() {
  if (!lobbyInit) {
    lobbyInit = (async () => {
      const db = getDb();
      const exists = await db.select({ id: rooms.id }).from(rooms).where(eq(rooms.slug, LOBBY_SLUG)).limit(1);
      if (!exists.length) {
        await db.insert(rooms).values({
          slug: LOBBY_SLUG,
          name: "Lobby",
          description: "Default room"
        });
        roomListCache = null;
      }
    })();
  }

  await lobbyInit;
}

export async function listRooms() {
  await ensureLobby();
  if (roomListCache && roomListCache.expiresAt > Date.now()) {
    return roomListCache.value;
  }

  const db = getDb();
  const rows = await db.select().from(rooms).orderBy(rooms.createdAt);
  roomListCache = { value: rows, expiresAt: Date.now() + ROOM_LIST_CACHE_MS };
  return rows;
}

export async function listRoomsWithOnlineCounts() {
  const rows = await listRooms();
  const db = getDb();
  const threshold = new Date(Date.now() - PRESENCE_STALE_MS);

  const counts = await db
    .select({
      roomId: roomMembers.roomId,
      count: sql<number>`count(*)`
    })
    .from(roomMembers)
    .where(and(eq(roomMembers.status, "active"), gt(roomMembers.lastActiveAt, threshold)))
    .groupBy(roomMembers.roomId);

  const byRoom = new Map(counts.map((row) => [row.roomId, Number(row.count)]));

  return rows.map((room) => ({
    ...room,
    onlineCount: byRoom.get(room.id) ?? 0
  }));
}

export async function findRoomBySlug(slug: string) {
  await ensureLobby();
  const db = getDb();
  const found = await db.select().from(rooms).where(eq(rooms.slug, slug)).limit(1);
  return found[0] ?? null;
}

export async function findRoomById(roomId: string) {
  const db = getDb();
  const found = await db.select().from(rooms).where(eq(rooms.id, roomId)).limit(1);
  return found[0] ?? null;
}

export async function findUserNicknameById(userId: string) {
  const db = getDb();
  const found = await db
    .select({ nickname: users.nickname })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return found[0]?.nickname ?? null;
}

export async function deleteRoomById(roomId: string) {
  const db = getDb();
  const found = await db
    .select({ id: rooms.id, slug: rooms.slug })
    .from(rooms)
    .where(eq(rooms.id, roomId))
    .limit(1);

  const target = found[0];
  if (!target) {
    return { ok: false as const, reason: "not_found" as const };
  }

  if (target.slug === LOBBY_SLUG) {
    return { ok: false as const, reason: "forbidden" as const };
  }

  await db.delete(rooms).where(eq(rooms.id, roomId));
  roomListCache = null;
  return { ok: true as const };
}

export async function createRoom(params: { name: string; description?: string | null; createdBy?: string | null }) {
  await ensureLobby();
  const db = getDb();
  const base = slugify(params.name) || `room-${Date.now()}`;

  let slug = base;
  let counter = 1;
  while (await findRoomBySlug(slug)) {
    counter += 1;
    slug = `${base}-${counter}`;
  }

  const [created] = await db
    .insert(rooms)
    .values({
      slug,
      name: params.name,
      description: params.description || null,
      createdBy: params.createdBy || null
    })
    .returning();

  roomListCache = null;
  return created;
}

export async function joinRoom(roomId: string, sessionId: string) {
  const db = getDb();
  const existing = await db
    .select({ id: roomMembers.id, status: roomMembers.status })
    .from(roomMembers)
    .where(and(eq(roomMembers.roomId, roomId), eq(roomMembers.sessionId, sessionId)))
    .limit(1);

  if (!existing.length) {
    await db.insert(roomMembers).values({
      roomId,
      sessionId,
      status: "active",
      lastActiveAt: new Date()
    });
    return true;
  }

  const wasAway = existing[0].status !== "active";
  await db
    .update(roomMembers)
    .set({ status: "active", lastActiveAt: new Date() })
    .where(eq(roomMembers.id, existing[0].id));

  return wasAway;
}

export async function markRoomActivity(roomId: string, sessionId: string) {
  const db = getDb();
  await db
    .update(roomMembers)
    .set({ lastActiveAt: new Date(), status: "active" })
    .where(and(eq(roomMembers.roomId, roomId), eq(roomMembers.sessionId, sessionId)));
}

export async function markRoomAway(roomId: string, sessionId: string) {
  const db = getDb();
  await db
    .update(roomMembers)
    .set({ status: "away", lastActiveAt: new Date() })
    .where(and(eq(roomMembers.roomId, roomId), eq(roomMembers.sessionId, sessionId)));
}

export async function getRoomMember(roomId: string, sessionId: string) {
  const db = getDb();
  const rows = await db
    .select({ status: roomMembers.status, lastActiveAt: roomMembers.lastActiveAt })
    .from(roomMembers)
    .where(and(eq(roomMembers.roomId, roomId), eq(roomMembers.sessionId, sessionId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function listOnlineUsers(roomId: string) {
  const db = getDb();
  const threshold = new Date(Date.now() - PRESENCE_STALE_MS);

  return db
    .select({
      sessionId: sessions.id,
      displayName: sessions.displayName,
      color: sessions.color,
      mode: sessions.mode,
      lastActiveAt: roomMembers.lastActiveAt
    })
    .from(roomMembers)
    .innerJoin(sessions, eq(sessions.id, roomMembers.sessionId))
    .where(and(eq(roomMembers.roomId, roomId), eq(roomMembers.status, "active"), gt(roomMembers.lastActiveAt, threshold)));
}

export async function createMessage(params: {
  roomId: string;
  senderSessionId: string;
  body: string;
  type?: "user" | "system";
}) {
  const db = getDb();
  const mentions = parseMentions(params.body);

  const [created] = await db
    .insert(messages)
    .values({
      roomId: params.roomId,
      senderSessionId: params.senderSessionId,
      body: params.body,
      type: params.type ?? "user",
      mentions: mentions.everyone ? ["everyone", ...mentions.names] : mentions.names
    })
    .returning();

  if (created.type === "user") {
    const online = await listOnlineUsers(params.roomId);
    const targets = mentions.everyone
      ? online.filter((u) => u.sessionId !== params.senderSessionId)
      : online.filter(
          (u) =>
            u.sessionId !== params.senderSessionId &&
            mentions.names.includes(u.displayName.toLowerCase())
        );

    if (targets.length) {
      await db.insert(mentionNotifications).values(
        targets.map((target) => ({
          roomId: params.roomId,
          messageId: created.id,
          targetSessionId: target.sessionId
        }))
      );
    }
  }

  return created;
}

export async function listRecentMessages(roomId: string, limit = 30) {
  const db = getDb();
  return db
    .select({
      id: messages.id,
      roomId: messages.roomId,
      senderSessionId: messages.senderSessionId,
      body: messages.body,
      type: messages.type,
      createdAt: messages.createdAt,
      mentions: messages.mentions,
      displayName: sessions.displayName,
      color: sessions.color
    })
    .from(messages)
    .innerJoin(sessions, eq(sessions.id, messages.senderSessionId))
    .where(and(eq(messages.roomId, roomId), eq(messages.type, "user")))
    .orderBy(desc(messages.createdAt))
    .limit(limit);
}

export async function listOlderMessages(roomId: string, before: Date, limit = 30) {
  const db = getDb();
  return db
    .select({
      id: messages.id,
      roomId: messages.roomId,
      senderSessionId: messages.senderSessionId,
      body: messages.body,
      type: messages.type,
      createdAt: messages.createdAt,
      mentions: messages.mentions,
      displayName: sessions.displayName,
      color: sessions.color
    })
    .from(messages)
    .innerJoin(sessions, eq(sessions.id, messages.senderSessionId))
    .where(and(eq(messages.roomId, roomId), eq(messages.type, "user"), lt(messages.createdAt, before)))
    .orderBy(desc(messages.createdAt))
    .limit(limit);
}

export async function unreadMentionCount(sessionId: string) {
  const db = getDb();
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(mentionNotifications)
    .where(and(eq(mentionNotifications.targetSessionId, sessionId), sql`${mentionNotifications.seenAt} is null`));

  return Number(result[0]?.count ?? 0);
}

export async function markMentionsSeen(sessionId: string, roomId: string) {
  const db = getDb();
  await db
    .update(mentionNotifications)
    .set({ seenAt: new Date() })
    .where(
      and(
        eq(mentionNotifications.targetSessionId, sessionId),
        eq(mentionNotifications.roomId, roomId),
        sql`${mentionNotifications.seenAt} is null`
      )
    );
}

export async function listUnreadMentionNotifications(sessionId: string, limit = 20) {
  const db = getDb();
  return db
    .select({
      id: mentionNotifications.id,
      createdAt: mentionNotifications.createdAt,
      roomSlug: rooms.slug,
      roomName: rooms.name,
      messageBody: messages.body,
      senderName: sessions.displayName
    })
    .from(mentionNotifications)
    .innerJoin(messages, eq(messages.id, mentionNotifications.messageId))
    .innerJoin(rooms, eq(rooms.id, mentionNotifications.roomId))
    .innerJoin(sessions, eq(sessions.id, messages.senderSessionId))
    .where(and(eq(mentionNotifications.targetSessionId, sessionId), sql`${mentionNotifications.seenAt} is null`))
    .orderBy(desc(mentionNotifications.createdAt))
    .limit(limit);
}

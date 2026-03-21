import type { APIContext } from "astro";
import { and, eq, gt } from "drizzle-orm";
import { SESSION_COOKIE, SESSION_TTL_DAYS } from "./constants";
import { getDb } from "./db";
import { sessions, users } from "./schema";
import { randomColor } from "./utils";

export type AppSession = {
  id: string;
  userId: string | null;
  mode: "normal" | "guest";
  displayName: string;
  color: string;
  expiresAt: Date;
};

export function setSessionCookie(context: APIContext, sessionId: string, expiresAt: Date) {
  context.cookies.set(SESSION_COOKIE, sessionId, {
    path: "/",
    expires: expiresAt,
    httpOnly: true,
    sameSite: "lax"
  });
}

export async function getCurrentSession(context: APIContext): Promise<AppSession | null> {
  const sessionId = context.cookies.get(SESSION_COOKIE)?.value;
  if (!sessionId) {
    return null;
  }

  const db = getDb();
  const result = await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.id, sessionId), gt(sessions.expiresAt, new Date())))
    .limit(1);

  if (!result.length) {
    return null;
  }

  const record = result[0];
  return {
    id: record.id,
    userId: record.userId,
    mode: record.mode,
    displayName: record.displayName,
    color: record.color,
    expiresAt: record.expiresAt
  };
}

export async function requireSession(context: APIContext): Promise<AppSession> {
  const session = await getCurrentSession(context);
  if (!session) {
    throw context.redirect("/");
  }
  return session;
}

export async function createSession(params: {
  mode: "normal" | "guest";
  nickname: string;
  email?: string;
  color?: string;
}) {
  const db = getDb();
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
  const color = params.color || randomColor();
  const sessionId = crypto.randomUUID();

  let userId: string | null = null;
  if (params.mode === "normal") {
    const [created] = await db
      .insert(users)
      .values({
        nickname: params.nickname,
        email: params.email || null,
        avatarColor: color,
        lastSeenAt: new Date()
      })
      .returning({ id: users.id });

    userId = created.id;
  }

  await db.insert(sessions).values({
    id: sessionId,
    userId,
    mode: params.mode,
    displayName: params.nickname,
    color,
    expiresAt,
    lastSeenAt: new Date()
  });

  return {
    id: sessionId,
    userId,
    mode: params.mode,
    displayName: params.nickname,
    color,
    expiresAt
  } satisfies AppSession;
}

export async function touchSession(sessionId: string) {
  const db = getDb();
  await db
    .update(sessions)
    .set({ lastSeenAt: new Date() })
    .where(eq(sessions.id, sessionId));
}

export async function renameSession(sessionId: string, nextName: string) {
  const db = getDb();
  await db
    .update(sessions)
    .set({ displayName: nextName, lastSeenAt: new Date() })
    .where(eq(sessions.id, sessionId));
}

import { pgTable, text, timestamp, uuid, varchar, jsonb, pgEnum } from "drizzle-orm/pg-core";

export const sessionModeEnum = pgEnum("session_mode", ["normal", "guest"]);
export const roomMemberStatusEnum = pgEnum("room_member_status", ["active", "away", "left"]);
export const messageTypeEnum = pgEnum("message_type", ["user", "system"]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  nickname: varchar("nickname", { length: 40 }).notNull(),
  email: varchar("email", { length: 255 }),
  avatarColor: varchar("avatar_color", { length: 16 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).defaultNow().notNull()
});

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  mode: sessionModeEnum("mode").notNull(),
  displayName: varchar("display_name", { length: 40 }).notNull(),
  color: varchar("color", { length: 16 }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).defaultNow().notNull()
});

export const rooms = pgTable("rooms", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: varchar("slug", { length: 80 }).unique().notNull(),
  name: varchar("name", { length: 80 }).notNull(),
  description: text("description"),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});

export const roomMembers = pgTable("room_members", {
  id: uuid("id").defaultRandom().primaryKey(),
  roomId: uuid("room_id").notNull().references(() => rooms.id, { onDelete: "cascade" }),
  sessionId: uuid("session_id").notNull().references(() => sessions.id, { onDelete: "cascade" }),
  joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow().notNull(),
  lastActiveAt: timestamp("last_active_at", { withTimezone: true }).defaultNow().notNull(),
  status: roomMemberStatusEnum("status").default("active").notNull()
});

export const messages = pgTable("messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  roomId: uuid("room_id").notNull().references(() => rooms.id, { onDelete: "cascade" }),
  senderSessionId: uuid("sender_session_id").notNull().references(() => sessions.id, { onDelete: "set null" }),
  type: messageTypeEnum("type").default("user").notNull(),
  body: text("body").notNull(),
  mentions: jsonb("mentions").$type<string[]>().default([]).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});

export const mentionNotifications = pgTable("mention_notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  roomId: uuid("room_id").notNull().references(() => rooms.id, { onDelete: "cascade" }),
  messageId: uuid("message_id").notNull().references(() => messages.id, { onDelete: "cascade" }),
  targetSessionId: uuid("target_session_id").notNull().references(() => sessions.id, { onDelete: "cascade" }),
  seenAt: timestamp("seen_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});

CREATE EXTENSION IF NOT EXISTS pgcrypto;\n\nCREATE TYPE session_mode AS ENUM ('normal', 'guest');
CREATE TYPE room_member_status AS ENUM ('active', 'away', 'left');
CREATE TYPE message_type AS ENUM ('user', 'system');

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nickname varchar(40) NOT NULL,
  email varchar(255),
  avatar_color varchar(16) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE sessions (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  mode session_mode NOT NULL,
  display_name varchar(40) NOT NULL,
  color varchar(16) NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug varchar(80) UNIQUE NOT NULL,
  name varchar(80) NOT NULL,
  description text,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE room_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  last_active_at timestamptz NOT NULL DEFAULT now(),
  status room_member_status NOT NULL DEFAULT 'active'
);

CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  sender_session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE SET NULL,
  type message_type NOT NULL DEFAULT 'user',
  body text NOT NULL,
  mentions jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE mention_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  message_id uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  target_session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  seen_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX room_members_room_active_idx ON room_members(room_id, status, last_active_at);
CREATE INDEX messages_room_created_idx ON messages(room_id, created_at DESC);
CREATE INDEX mentions_target_idx ON mention_notifications(target_session_id, seen_at);

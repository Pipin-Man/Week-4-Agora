export const APP_NAME = "Agora";
export const SESSION_COOKIE = "agora_session";
export const SESSION_TTL_DAYS = 7;
export const LOBBY_SLUG = "lobby";
export const PRESENCE_STALE_MS = 70_000;
export const DISCONNECT_GRACE_MS = 60_000;
export const TYPING_TIMEOUT_MS = 4_000;

export const DEFAULT_COLORS = [
  "#0ea5e9",
  "#f97316",
  "#10b981",
  "#ef4444",
  "#a855f7",
  "#f59e0b",
  "#22c55e",
  "#6366f1"
];

export const copy = {
  en: {
    lobby: "Lobby",
    emptyRoom: "No messages yet. Start the conversation.",
    online: "Online",
    typing: "is typing...",
    loadOlder: "Load older messages",
    invite: "Invite friend"
  },
  gr: {
    lobby: "Lobby",
    emptyRoom: "Δεν υπάρχουν ακόμα μηνύματα. Ξεκίνα τη συζήτηση.",
    online: "Συνδεδεμένοι",
    typing: "γράφει...",
    loadOlder: "Φόρτωση παλαιότερων",
    invite: "Πρόσκληση φίλου"
  }
};

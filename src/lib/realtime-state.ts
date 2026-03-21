import { TYPING_TIMEOUT_MS } from "./constants";

type TypingItem = {
  sessionId: string;
  displayName: string;
  expiresAt: number;
};

const roomTyping = new Map<string, Map<string, TypingItem>>();

export function setTyping(roomId: string, sessionId: string, displayName: string, typing: boolean) {
  if (!roomTyping.has(roomId)) {
    roomTyping.set(roomId, new Map());
  }

  const bucket = roomTyping.get(roomId)!;

  if (!typing) {
    bucket.delete(sessionId);
    return;
  }

  bucket.set(sessionId, {
    sessionId,
    displayName,
    expiresAt: Date.now() + TYPING_TIMEOUT_MS
  });
}

export function getTyping(roomId: string, excludeSessionId?: string) {
  const bucket = roomTyping.get(roomId);
  if (!bucket) {
    return [] as string[];
  }

  const now = Date.now();
  const names: string[] = [];
  for (const [sessionId, item] of bucket.entries()) {
    if (item.expiresAt <= now) {
      bucket.delete(sessionId);
      continue;
    }

    if (excludeSessionId && excludeSessionId === sessionId) {
      continue;
    }

    names.push(item.displayName);
  }

  return names;
}

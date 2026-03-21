import { renderPresenceOob, renderTypingOob } from "./render";
import { getTyping } from "./realtime-state";
import { listOnlineUsers } from "./rooms";
import { sseHub } from "./sse";

export async function broadcastPresence(roomId: string) {
  const online = await listOnlineUsers(roomId);
  sseHub.publish({
    roomId,
    event: "presence:update",
    html: renderPresenceOob(online)
  });
}

export function broadcastTyping(roomId: string) {
  const typingUsers = getTyping(roomId);
  sseHub.publish({
    roomId,
    event: "typing:update",
    html: renderTypingOob(typingUsers)
  });
}

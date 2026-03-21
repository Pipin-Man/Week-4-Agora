import type { APIRoute } from "astro";
import { broadcastPresence } from "../../../lib/broadcast";
import { findRoomById, markRoomActivity } from "../../../lib/rooms";
import { requireSession, touchSession } from "../../../lib/session";

export const POST: APIRoute = async (context) => {
  const session = await requireSession(context);
  await touchSession(session.id);

  const roomId = context.url.searchParams.get("roomId");
  if (roomId) {
    const room = await findRoomById(roomId);
    if (room) {
      await markRoomActivity(roomId, session.id);
      await broadcastPresence(roomId);
    }
  }

  return new Response(null, { status: 204 });
};

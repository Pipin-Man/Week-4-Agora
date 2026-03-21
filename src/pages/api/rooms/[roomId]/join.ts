import type { APIRoute } from "astro";
import { broadcastPresence } from "../../../../lib/broadcast";
import { htmxRedirect, plainRedirect } from "../../../../lib/http";
import { findRoomById, joinRoom } from "../../../../lib/rooms";
import { requireSession } from "../../../../lib/session";

export const POST: APIRoute = async (context) => {
  const roomId = context.params.roomId;
  if (!roomId) {
    return new Response("Missing room id", { status: 400 });
  }

  const room = await findRoomById(roomId);
  if (!room) {
    return new Response("Room not found", { status: 404 });
  }

  const session = await requireSession(context);
  await joinRoom(roomId, session.id);
  await broadcastPresence(roomId);

  const target = `/chat/${room.slug}`;
  if (context.request.headers.get("HX-Request") === "true") {
    return htmxRedirect(target);
  }
  return plainRedirect(target);
};

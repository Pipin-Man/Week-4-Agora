import type { APIRoute } from "astro";
import { LOBBY_SLUG } from "../../../../lib/constants";
import { htmxRedirect, plainRedirect } from "../../../../lib/http";
import { deleteRoomById, findRoomById } from "../../../../lib/rooms";
import { requireSession } from "../../../../lib/session";

export const POST: APIRoute = async (context) => {
  const roomId = context.params.roomId;
  if (!roomId) {
    return new Response("Missing room id", { status: 400 });
  }

  await requireSession(context);
  const room = await findRoomById(roomId);
  if (!room) {
    return new Response("Room not found", { status: 404 });
  }

  if (room.slug === LOBBY_SLUG) {
    return new Response("Lobby cannot be deleted", { status: 400 });
  }

  const result = await deleteRoomById(roomId);
  if (!result.ok) {
    return new Response("Could not delete room", { status: 400 });
  }

  const target = "/chat/lobby";
  if (context.request.headers.get("HX-Request") === "true") {
    return htmxRedirect(target);
  }

  return plainRedirect(target);
};

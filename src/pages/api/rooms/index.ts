import type { APIRoute } from "astro";
import { broadcastPresence } from "../../../lib/broadcast";
import { htmxRedirect, plainRedirect, readFormText } from "../../../lib/http";
import { createRoom, joinRoom } from "../../../lib/rooms";
import { requireSession } from "../../../lib/session";

export const POST: APIRoute = async (context) => {
  const session = await requireSession(context);
  const form = await context.request.formData();
  const name = readFormText(form, "name");
  const description = readFormText(form, "description");

  if (name.length < 2) {
    return new Response("Room name must be at least 2 chars", { status: 400 });
  }

  const room = await createRoom({
    name,
    description,
    createdBy: session.userId
  });

  await joinRoom(room.id, session.id);
  await broadcastPresence(room.id);

  const target = `/chat/${room.slug}`;
  if (context.request.headers.get("HX-Request") === "true") {
    return htmxRedirect(target);
  }
  return plainRedirect(target);
};

import type { APIRoute } from "astro";
import { broadcastPresence, broadcastTyping } from "../../../../lib/broadcast";
import { createMessage, listOlderMessages, markRoomActivity } from "../../../../lib/rooms";
import { renderMessage, renderMessageOob } from "../../../../lib/render";
import { requireSession } from "../../../../lib/session";
import { sseHub } from "../../../../lib/sse";

export const GET: APIRoute = async (context) => {
  const roomId = context.params.roomId;
  if (!roomId) {
    return new Response("Missing room id", { status: 400 });
  }

  await requireSession(context);

  const beforeRaw = context.url.searchParams.get("before");
  if (!beforeRaw) {
    return new Response("Missing cursor", { status: 400 });
  }

  const before = new Date(beforeRaw);
  const limit = Number(context.url.searchParams.get("limit") ?? "30");
  const rows = await listOlderMessages(roomId, before, Number.isFinite(limit) ? Math.min(limit, 50) : 30);
  const ordered = [...rows].reverse();

  const html = ordered
    .map((msg) =>
      renderMessage({
        id: msg.id,
        type: msg.type,
        body: msg.body,
        displayName: msg.displayName,
        color: msg.color,
        createdAt: new Date(msg.createdAt)
      })
    )
    .join("");

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" }
  });
};

export const POST: APIRoute = async (context) => {
  const roomId = context.params.roomId;
  if (!roomId) {
    return new Response("Missing room id", { status: 400 });
  }

  const session = await requireSession(context);
  const form = await context.request.formData();
  const body = String(form.get("body") ?? "").trim();

  if (!body) {
    return new Response("Message is required", { status: 400 });
  }

  await markRoomActivity(roomId, session.id);
  const created = await createMessage({ roomId, senderSessionId: session.id, body });

  sseHub.publish({
    roomId,
    event: created.type === "system" ? "system:new" : "message:new",
    html: renderMessageOob({
      id: created.id,
      type: created.type,
      body: created.body,
      displayName: session.displayName,
      color: session.color,
      createdAt: new Date(created.createdAt)
    })
  });

  await broadcastPresence(roomId);
  broadcastTyping(roomId);

  if (body.includes("@")) {
    sseHub.publish({
      roomId,
      event: "mention:notify",
      html: "<div></div>"
    });
  }

  return new Response(null, { status: 204 });
};

import type { APIRoute } from "astro";
import { DISCONNECT_GRACE_MS } from "../../../../lib/constants";
import { formatSseEvent, sseHub } from "../../../../lib/sse";
import { requireSession } from "../../../../lib/session";
import {
  createMessage,
  findRoomById,
  getRoomMember,
  joinRoom,
  markRoomAway,
  markRoomActivity
} from "../../../../lib/rooms";
import { renderMessageOob } from "../../../../lib/render";
import { broadcastPresence } from "../../../../lib/broadcast";

export const GET: APIRoute = async (context) => {
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
  await markRoomActivity(roomId, session.id);
  await broadcastPresence(roomId);

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const push = (chunk: string) => controller.enqueue(encoder.encode(chunk));

      push(`retry: 3000\n\n`);
      const unsubscribe = sseHub.subscribe(roomId, (payload) => {
        push(formatSseEvent(payload.event, payload.html));
      });

      const heartBeat = setInterval(() => {
        push(":keepalive\n\n");
      }, 15000);

      const onAbort = () => {
        clearInterval(heartBeat);
        unsubscribe();

        markRoomAway(roomId, session.id)
          .then(() => broadcastPresence(roomId))
          .catch(() => {});

        setTimeout(async () => {
          const current = await getRoomMember(roomId, session.id);
          if (current?.status === "away") {
            const left = await createMessage({
              roomId,
              senderSessionId: session.id,
              body: `${session.displayName} left the room`,
              type: "system"
            });

            sseHub.publish({
              roomId,
              event: "system:new",
              html: renderMessageOob({
                id: left.id,
                type: "system",
                body: left.body,
                displayName: session.displayName,
                color: session.color,
                createdAt: new Date(left.createdAt)
              })
            });
            await broadcastPresence(roomId);
          }
        }, DISCONNECT_GRACE_MS);

        controller.close();
      };

      context.request.signal.addEventListener("abort", onAbort, { once: true });
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive"
    }
  });
};

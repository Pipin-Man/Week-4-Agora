import type { APIRoute } from "astro";
import { DISCONNECT_GRACE_MS } from "../../../../lib/constants";
import { formatSseEvent, sseHub } from "../../../../lib/sse";
import { requireSession } from "../../../../lib/session";
import {
  createMessage,
  findRoomById,
  getRoomMember,
  joinRoom,
  markRoomAway
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
  void broadcastPresence(roomId);

  const encoder = new TextEncoder();
  let disconnectHandler: (() => void) | null = null;

  const stream = new ReadableStream({
    start(controller) {
      let closed = false;
      let heartBeat: ReturnType<typeof setInterval> | null = null;

      const cleanup = (unsubscribe: () => void) => {
        if (closed) return;
        closed = true;

        if (heartBeat) {
          clearInterval(heartBeat);
          heartBeat = null;
        }

        unsubscribe();
      };

      const finalizePresence = () => {
        markRoomAway(roomId, session.id)
          .then(() => broadcastPresence(roomId))
          .catch(() => {});

        setTimeout(async () => {
          try {
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
              void broadcastPresence(roomId);
            }
          } catch {
            // Avoid crashing server process on delayed disconnect cleanup.
          }
        }, DISCONNECT_GRACE_MS);
      };

      const unsubscribe = sseHub.subscribe(roomId, (payload) => {
        push(formatSseEvent(payload.event, payload.html));
      });

      const onDisconnect = () => {
        if (closed) return;
        cleanup(unsubscribe);
        finalizePresence();
      };

      const push = (chunk: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          onDisconnect();
        }
      };

      disconnectHandler = onDisconnect;
      context.request.signal.addEventListener("abort", onDisconnect, { once: true });

      push(`retry: 3000\n\n`);
      heartBeat = setInterval(() => {
        push(":keepalive\n\n");
      }, 15000);
    },
    cancel() {
      disconnectHandler?.();
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no"
    }
  });
};

import type { APIRoute } from "astro";
import { broadcastTyping } from "../../../../lib/broadcast";
import { setTyping } from "../../../../lib/realtime-state";
import { markRoomActivity } from "../../../../lib/rooms";
import { requireSession } from "../../../../lib/session";

export const POST: APIRoute = async (context) => {
  const roomId = context.params.roomId;
  if (!roomId) {
    return new Response("Missing room id", { status: 400 });
  }

  const session = await requireSession(context);
  const form = await context.request.formData();
  const typing = String(form.get("typing") ?? "0") === "1";

  await markRoomActivity(roomId, session.id);
  setTyping(roomId, session.id, session.displayName, typing);
  broadcastTyping(roomId);

  return new Response(null, { status: 204 });
};

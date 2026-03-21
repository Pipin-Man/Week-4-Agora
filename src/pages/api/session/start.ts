import type { APIRoute } from "astro";
import { htmxRedirect, plainRedirect, readFormText } from "../../../lib/http";
import { createSession, setSessionCookie } from "../../../lib/session";

export const POST: APIRoute = async (context) => {
  const form = await context.request.formData();
  const mode = readFormText(form, "mode") === "guest" ? "guest" : "normal";
  const nickname = readFormText(form, "nickname");
  const email = readFormText(form, "email");
  const color = readFormText(form, "color");
  const nextRoom = readFormText(form, "nextRoom", "lobby") || "lobby";

  if (nickname.length < 2) {
    return new Response("Nickname must be at least 2 chars", { status: 400 });
  }

  const session = await createSession({
    mode,
    nickname,
    email: email || undefined,
    color: color || undefined
  });

  setSessionCookie(context, session.id, session.expiresAt);
  const target = `/chat/${encodeURIComponent(nextRoom.toLowerCase())}`;

  if (context.request.headers.get("HX-Request") === "true") {
    return htmxRedirect(target);
  }

  return plainRedirect(target);
};

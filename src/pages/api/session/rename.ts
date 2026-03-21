import type { APIRoute } from "astro";
import { plainRedirect, readFormText } from "../../../lib/http";
import { renameSession, requireSession } from "../../../lib/session";

export const POST: APIRoute = async (context) => {
  const session = await requireSession(context);
  const form = await context.request.formData();
  const nextName = readFormText(form, "nickname");

  if (nextName.length < 2) {
    return new Response("Nickname must be at least 2 chars", { status: 400 });
  }

  await renameSession(session.id, nextName);
  return plainRedirect("/settings/profile");
};

import type { APIRoute } from "astro";
import { plainRedirect } from "../../../lib/http";
import { clearSessionCookie, getCurrentSession, invalidateSession } from "../../../lib/session";

export const POST: APIRoute = async (context) => {
  const session = await getCurrentSession(context);
  if (session) {
    await invalidateSession(session.id).catch(() => {});
  }

  clearSessionCookie(context);
  return plainRedirect("/");
};

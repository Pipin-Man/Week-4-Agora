import type { APIRoute } from "astro";
import { unreadMentionCount } from "../../../lib/rooms";
import { getCurrentSession } from "../../../lib/session";

export const GET: APIRoute = async (context) => {
  const session = await getCurrentSession(context);
  if (!session) {
    return new Response("", { status: 401 });
  }

  const count = await unreadMentionCount(session.id);
  const dot = count > 0 ? `<span class=\"absolute -right-1 -top-1 rounded-full bg-red-500 px-1 text-[10px] text-white\">${count}</span>` : "";

  return new Response(`<button id=\"mention-bell\" type=\"button\" class=\"relative rounded-lg border border-zinc-300 px-3 py-1 text-xs dark:border-zinc-700\">Bell${dot}</button>`, {
    headers: { "Content-Type": "text/html; charset=utf-8" }
  });
};

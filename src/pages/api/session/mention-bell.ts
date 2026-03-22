import type { APIRoute } from "astro";
import { unreadMentionCount } from "../../../lib/rooms";
import { getCurrentSession } from "../../../lib/session";

function renderBellButton(count: number) {
  const dot = count > 0
    ? `<span class="absolute -right-1 -top-1 min-w-4 rounded-full bg-red-500 px-1 text-center text-[10px] leading-4 text-white">${count}</span>`
    : "";

  return `<button id="mention-bell" type="button" aria-label="Notifications" class="relative inline-flex size-8 items-center justify-center rounded-lg border border-zinc-300 text-zinc-700 dark:border-zinc-700 dark:text-zinc-200">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="size-4">
      <path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17H18l-1.405-1.405A2.03 2.03 0 0 1 16 14.158V11a6.002 6.002 0 0 0-4-5.659V4a2 2 0 1 0-4 0v1.341C5.67 6.165 4 8.388 4 11v3.159c0 .538-.214 1.055-.595 1.436L2 17h3.143M9 17a3 3 0 0 0 6 0"/>
    </svg>
    ${dot}
  </button>`;
}

export const GET: APIRoute = async (context) => {
  const session = await getCurrentSession(context);
  if (!session) {
    return new Response("", { status: 401 });
  }

  const count = await unreadMentionCount(session.id);
  return new Response(renderBellButton(count), {
    headers: { "Content-Type": "text/html; charset=utf-8" }
  });
};

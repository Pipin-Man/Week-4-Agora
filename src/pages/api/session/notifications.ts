import type { APIRoute } from "astro";
import { listUnreadMentionNotifications } from "../../../lib/rooms";
import { getCurrentSession } from "../../../lib/session";
import { escapeHtml, formatRelativeTime } from "../../../lib/utils";

export const GET: APIRoute = async (context) => {
  const session = await getCurrentSession(context);
  if (!session) {
    return new Response("", { status: 401 });
  }

  const items = await listUnreadMentionNotifications(session.id, 20);
  if (!items.length) {
    return new Response('<li class="px-3 py-3 text-xs text-zinc-500 dark:text-zinc-200">No unread notifications</li>', {
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });
  }

  const html = items
    .map((item) => {
      const sender = escapeHtml(item.senderName || "Unknown");
      const body = escapeHtml(item.messageBody).slice(0, 220);
      const roomName = escapeHtml(item.roomName);
      const when = formatRelativeTime(new Date(item.createdAt));
      const href = `/chat/${encodeURIComponent(item.roomSlug)}`;

      return `<li class="border-b border-zinc-200/70 px-3 py-3 last:border-b-0 dark:border-zinc-700/80">
        <a href="${href}" class="block rounded-lg hover:bg-zinc-100/70 dark:hover:bg-zinc-800/60">
          <div class="flex items-start gap-2 p-2">
            <span class="mt-1 size-2 rounded-full bg-sky-500"></span>
            <div class="min-w-0">
              <div class="flex items-center gap-2 text-xs">
                <span class="font-semibold text-zinc-900 dark:text-zinc-100">${sender}</span>
                <time class="text-zinc-500 dark:text-zinc-200">${when}</time>
              </div>
              <p class="mt-0.5 line-clamp-3 whitespace-pre-wrap break-words text-sm text-zinc-800 dark:text-zinc-100">${body}</p>
              <p class="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-200">#${roomName}</p>
            </div>
          </div>
        </a>
      </li>`;
    })
    .join("");

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" }
  });
};

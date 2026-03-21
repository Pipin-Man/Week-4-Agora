import { copy } from "./constants";
import { escapeHtml, formatRelativeTime } from "./utils";

type MessageView = {
  id: string;
  type: "user" | "system";
  body: string;
  displayName: string;
  color: string;
  createdAt: Date;
};

export function renderMessage(message: MessageView) {
  const safeBody = escapeHtml(message.body);
  if (message.type === "system") {
    return `<li id="msg-${message.id}" class="my-2 text-center text-xs text-zinc-500 dark:text-zinc-400">${safeBody}</li>`;
  }

  return `<li id="msg-${message.id}" class="py-2">
  <div class="flex items-start gap-2">
    <span class="mt-1 size-2 rounded-full" style="background:${escapeHtml(message.color)}"></span>
    <div class="min-w-0">
      <div class="flex items-center gap-2 text-xs">
        <span class="font-semibold text-zinc-900 dark:text-zinc-100">${escapeHtml(message.displayName)}</span>
        <time class="text-zinc-500 dark:text-zinc-400">${formatRelativeTime(new Date(message.createdAt))}</time>
      </div>
      <p class="whitespace-pre-wrap break-words text-sm text-zinc-800 dark:text-zinc-200">${safeBody}</p>
    </div>
  </div>
</li>`;
}

export function renderMessageOob(message: MessageView) {
  return `<ul id="message-list" hx-swap-oob="beforeend">${renderMessage(message)}</ul>`;
}

export function renderPresenceOob(onlineUsers: Array<{ displayName: string; color: string }>) {
  const userItems = onlineUsers
    .map(
      (user) =>
        `<li class="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200"><span class="size-2 rounded-full" style="background:${escapeHtml(user.color)}"></span>${escapeHtml(user.displayName)}</li>`
    )
    .join("");

  const body = userItems || `<li class="text-xs text-zinc-500 dark:text-zinc-400">No one online yet</li>`;

  return `<ul id="online-list" hx-swap-oob="innerHTML">${body}</ul>`;
}

export function renderTypingOob(typingUsers: string[], locale: "en" | "gr" = "en") {
  const current = copy[locale];
  const text = typingUsers.length
    ? `${escapeHtml(typingUsers.slice(0, 2).join(", "))} ${current.typing}`
    : "";

  return `<div id="typing-indicator" hx-swap-oob="innerHTML" class="h-5 text-xs text-zinc-500 dark:text-zinc-400">${text}</div>`;
}

export function renderBellOob(count: number) {
  const dot = count > 0 ? `<span class="absolute -top-1 -right-1 rounded-full bg-red-500 px-1 text-[10px] text-white">${count}</span>` : "";
  return `<button id="mention-bell" hx-swap-oob="outerHTML" type="button" class="relative rounded-full border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700">Bell${dot}</button>`;
}

export function renderLoadOlderButton(nextCursor: string | null, roomId: string) {
  if (!nextCursor) {
    return "";
  }

  return `<button id="load-older" class="mx-auto block rounded border border-zinc-300 px-3 py-1 text-xs dark:border-zinc-700" hx-get="/api/rooms/${roomId}/messages?before=${encodeURIComponent(nextCursor)}&limit=30" hx-target="#message-list" hx-swap="afterbegin">${copy.en.loadOlder}</button>`;
}

import { EventEmitter } from "node:events";

type RoomEvent = {
  roomId: string;
  event: string;
  html: string;
};

class SseHub {
  private emitter = new EventEmitter();

  subscribe(roomId: string, handler: (event: RoomEvent) => void) {
    const key = `room:${roomId}`;
    this.emitter.on(key, handler);
    return () => this.emitter.off(key, handler);
  }

  publish(payload: RoomEvent) {
    this.emitter.emit(`room:${payload.roomId}`, payload);
  }
}

export const sseHub = new SseHub();

export function formatSseEvent(event: string, html: string) {
  const sanitized = html
    .replaceAll("\r", "")
    .split("\n")
    .map((line) => `data: ${line}`)
    .join("\n");

  return `event: ${event}\n${sanitized}\n\n`;
}

/// <reference types="astro/client" />

declare global {
  interface Window {
    Alpine?: {
      data: (name: string, value: () => unknown) => void;
    };
    htmx?: {
      ajax: (method: string, path: string, options: { target: string; swap: string }) => void;
    };
    agoraSound: {
      enabled: boolean;
      set: (next: boolean) => void;
      play: () => void;
    };
  }
}

export {};

import type { APIContext } from "astro";

export function isHtmxRequest(context: APIContext) {
  return context.request.headers.get("HX-Request") === "true";
}

export function htmxRedirect(url: string) {
  return new Response(null, {
    status: 204,
    headers: {
      "HX-Redirect": url
    }
  });
}

export function plainRedirect(url: string) {
  return new Response(null, {
    status: 302,
    headers: { Location: url }
  });
}

export function readFormText(form: FormData, key: string, fallback = "") {
  const value = form.get(key);
  return typeof value === "string" ? value.trim() : fallback;
}


export function getPublicOrigin(request: Request, fallback?: string) {
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();

  if (forwardedHost) {
    return `${forwardedProto || "https"}://${forwardedHost}`;
  }

  const host = request.headers.get("host")?.trim();
  if (host) {
    const proto =
      forwardedProto || (host.includes("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");
    return `${proto}://${host}`;
  }

  return fallback || "";
}

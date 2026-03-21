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

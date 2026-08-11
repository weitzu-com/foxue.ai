const immutableObjectPattern = /^v1\/releases\/[a-z0-9][a-z0-9.-]{0,95}\/(?:manifest\.json|works\/(?:T\d{4}|DHP|DN\d{1,2}|MN\d{1,3})\/(?:index\.json|source\.(?:xml|json)|sources\/\d{2}-[A-Za-z0-9._-]+\.(?:xml|json)|folios\/[a-z0-9][a-z0-9.-]{0,95}\.json))$/;

const corsOrigin = "https://foxue.ai";

function json(value: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json; charset=utf-8");
  headers.set("x-content-type-options", "nosniff");
  headers.set("x-frame-options", "DENY");
  headers.set("referrer-policy", "no-referrer");
  return Response.json(value, { ...init, headers });
}

function applyPublicHeaders(headers: Headers, request: Request, immutable: boolean) {
  const origin = request.headers.get("origin");
  if (origin === corsOrigin) headers.set("access-control-allow-origin", corsOrigin);
  headers.set("vary", "Origin");
  headers.set("x-content-type-options", "nosniff");
  headers.set("x-frame-options", "DENY");
  headers.set("referrer-policy", "no-referrer");
  headers.set(
    "cache-control",
    immutable
      ? "public, max-age=31536000, immutable"
      : "public, max-age=60, stale-while-revalidate=300",
  );
}

function isAllowedKey(key: string) {
  return key === "v1/latest.json" || immutableObjectPattern.test(key);
}

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      const headers = new Headers({
        "access-control-allow-methods": "GET, HEAD, OPTIONS",
        "access-control-allow-headers": "if-none-match",
        "access-control-max-age": "86400",
      });
      applyPublicHeaders(headers, request, false);
      return new Response(null, { status: 204, headers });
    }

    if (request.method !== "GET" && request.method !== "HEAD") {
      return json(
        { error: "method_not_allowed" },
        { status: 405, headers: { allow: "GET, HEAD, OPTIONS" } },
      );
    }

    if (url.pathname === "/" || url.pathname === "/health") {
      const latest = await env.CORPUS.head("v1/latest.json");
      return json(
        {
          service: "foxue.ai corpus edge",
          releaseId: env.RELEASE_ID,
          storage: latest ? "ready" : "unseeded",
          readOnly: true,
        },
        { status: latest ? 200 : 503 },
      );
    }

    let key: string;
    try {
      key = decodeURIComponent(url.pathname.slice(1));
    } catch {
      return json({ error: "invalid_path" }, { status: 400 });
    }
    if (!isAllowedKey(key) || key.includes("..") || key.startsWith("/")) {
      return json({ error: "not_found" }, { status: 404 });
    }

    const object = await env.CORPUS.get(key);
    if (!object) return json({ error: "not_found" }, { status: 404 });

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    applyPublicHeaders(headers, request, key !== "v1/latest.json");

    if (request.headers.get("if-none-match") === object.httpEtag) {
      return new Response(null, { status: 304, headers });
    }

    return new Response(request.method === "HEAD" ? null : object.body, { headers });
  },
} satisfies ExportedHandler<Env>;

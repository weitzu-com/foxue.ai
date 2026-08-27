import objectKeyPolicy from "../object-key-policy.json";

// Release builders only publish public reading objects below this layout. A
// bounded canonical identifier keeps the path policy source-agnostic without
// exposing arbitrary R2 keys when a new controlled corpus family is added.
const immutableObjectPattern = new RegExp(objectKeyPolicy.immutableObjectPattern);

const corsOrigins = new Set(["https://www.foxue.ai", "https://foxue.ai"]);

const latestKey = "v1/latest.json";

function applySecurityHeaders(headers: Headers) {
  headers.set("content-security-policy", "default-src 'none'; frame-ancestors 'none'; base-uri 'none'");
  headers.set("cross-origin-resource-policy", "same-site");
  headers.set("permissions-policy", "camera=(), microphone=(), geolocation=()");
  headers.set("referrer-policy", "no-referrer");
  headers.set("strict-transport-security", "max-age=63072000; includeSubDomains; preload");
  headers.set("x-content-type-options", "nosniff");
  headers.set("x-frame-options", "DENY");
}

function json(value: unknown, init: ResponseInit = {}, head = false) {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json; charset=utf-8");
  applySecurityHeaders(headers);
  if (head) return new Response(null, { ...init, headers });
  return Response.json(value, { ...init, headers });
}

function applyPublicHeaders(headers: Headers, request: Request, immutable: boolean) {
  const origin = request.headers.get("origin");
  if (origin && corsOrigins.has(origin)) headers.set("access-control-allow-origin", origin);
  headers.set("vary", "Origin");
  applySecurityHeaders(headers);
  headers.set(
    "cache-control",
    immutable
      ? "public, max-age=31536000, immutable"
      : "public, max-age=60, stale-while-revalidate=300",
  );
}

function isAllowedKey(key: string) {
  return key === latestKey || immutableObjectPattern.test(key);
}

function latestDocument(env: Env) {
  return {
    schema: "https://foxue.ai/schemas/corpus-release-pointer-v0.1",
    releaseId: env.RELEASE_ID,
    manifestObjectKey: `v1/releases/${env.RELEASE_ID}/manifest.json`,
    manifestSha256: env.RELEASE_MANIFEST_SHA256,
  };
}

async function storageState(env: Env) {
  if (!env.CORPUS) return { mode: "bootstrap", latest: null } as const;

  try {
    const latest = await env.CORPUS.head(latestKey);
    return { mode: latest ? "ready" : "unseeded", latest } as const;
  } catch (error) {
    console.error(JSON.stringify({
      message: "corpus storage probe failed",
      error: error instanceof Error ? error.message : String(error),
    }));
    return { mode: "unavailable", latest: null } as const;
  }
}

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);
    const isHead = request.method === "HEAD";

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

    if (url.pathname === "/" || url.pathname === "/health" || url.pathname === "/ready") {
      const storage = await storageState(env);
      const ready = storage.mode === "ready";
      const readinessProbe = url.pathname === "/ready";
      return json(
        {
          service: "foxue.ai corpus edge",
          releaseId: env.RELEASE_ID,
          releaseManifestSha256: env.RELEASE_MANIFEST_SHA256,
          storage: storage.mode,
          ready,
          preservationReady: ready,
          readOnly: true,
          originCoverage: env.ORIGIN_COVERAGE_URL,
          message: ready
            ? "不可变经藏已由 R2 提供。"
            : "Cloudflare 边缘入口已上线；R2 首次订阅与完整对象播种尚未完成。",
        },
        {
          status: readinessProbe && !ready ? 503 : 200,
          headers: { "cache-control": "no-store" },
        },
        isHead,
      );
    }

    let key: string;
    try {
      key = decodeURIComponent(url.pathname.slice(1));
    } catch {
      return json({ error: "invalid_path" }, { status: 400 }, isHead);
    }
    if (!isAllowedKey(key) || key.includes("..") || key.startsWith("/")) {
      return json({ error: "not_found" }, { status: 404 }, isHead);
    }

    if (key === latestKey && !env.CORPUS) {
      const headers = new Headers({ "x-foxue-storage": "bootstrap" });
      applyPublicHeaders(headers, request, false);
      return json(latestDocument(env), { headers }, isHead);
    }

    if (!env.CORPUS) {
      return json(
        {
          error: "corpus_storage_not_ready",
          releaseId: env.RELEASE_ID,
          message: "R2 首次订阅与不可变对象播种尚未完成。",
        },
        {
          status: 503,
          headers: {
            "cache-control": "no-store",
            "retry-after": "86400",
          },
        },
        isHead,
      );
    }

    let object: R2ObjectBody | null;
    try {
      object = await env.CORPUS.get(key);
    } catch (error) {
      console.error(JSON.stringify({
        message: "corpus object read failed",
        key,
        error: error instanceof Error ? error.message : String(error),
      }));
      return json(
        { error: "corpus_storage_unavailable" },
        { status: 503, headers: { "retry-after": "60" } },
        isHead,
      );
    }
    if (!object) {
      if (key === latestKey) {
        const headers = new Headers({ "x-foxue-storage": "unseeded" });
        applyPublicHeaders(headers, request, false);
        return json(latestDocument(env), { headers }, isHead);
      }
      return json({ error: "not_found" }, { status: 404 }, isHead);
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    applyPublicHeaders(headers, request, key !== latestKey);

    if (request.headers.get("if-none-match") === object.httpEtag) {
      return new Response(null, { status: 304, headers });
    }

    return new Response(isHead ? null : object.body, { headers });
  },
} satisfies ExportedHandler<Env>;

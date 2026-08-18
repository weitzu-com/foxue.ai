import { resolveNs } from "node:dns/promises";

const edgeBase = new URL(process.argv[2] ?? "https://canon.foxue.ai");
const expectedReleaseId = process.env.EXPECTED_RELEASE_ID;
const expectedManifestSha256 = process.env.EXPECTED_MANIFEST_SHA256;
const requireReady = process.env.REQUIRE_READY === "true";
const failures = [];
const successes = [];

function check(condition, success, failure) {
  if (condition) successes.push(success);
  else failures.push(failure);
}

async function request(pathname, init = {}) {
  try {
    const response = await fetch(new URL(pathname, edgeBase), {
      ...init,
      headers: {
        "user-agent": "foxue-cloudflare-edge-check/1.0",
        ...(init.headers ?? {}),
      },
      signal: AbortSignal.timeout(20_000),
    });
    const text = init.method === "HEAD" ? "" : await response.text();
    let body = null;
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        failures.push(`${pathname} 未返回有效 JSON`);
      }
    }
    return { body, response };
  } catch (error) {
    failures.push(`${pathname} 请求失败：${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

const [health, ready, latest, latestBare, latestThirdParty, preflight, nameservers] = await Promise.all([
  request("/health"),
  request("/ready"),
  request("/v1/latest.json", { headers: { origin: "https://www.foxue.ai" } }),
  request("/v1/latest.json", { headers: { origin: "https://foxue.ai" } }),
  request("/v1/latest.json", { headers: { origin: "https://example.com" } }),
  request("/v1/latest.json", {
    method: "OPTIONS",
    headers: {
      origin: "https://www.foxue.ai",
      "access-control-request-method": "GET",
    },
  }),
  resolveNs("foxue.ai").catch((error) => {
    failures.push(`无法解析 foxue.ai NS：${error instanceof Error ? error.message : String(error)}`);
    return [];
  }),
]);

check(
  nameservers.length >= 2 && nameservers.every((name) => name.toLowerCase().includes(".ns.cloudflare.com")),
  `权威 DNS 由 Cloudflare 提供（${nameservers.join("、")}）`,
  `权威 DNS 异常（${nameservers.join("、") || "无记录"}）`,
);

if (health) {
  check(health.response.status === 200, "/health 返回 200", `/health 返回 ${health.response.status}`);
  check(
    health.body?.service === "foxue.ai corpus edge" && health.body?.readOnly === true,
    "边缘服务身份与只读标记正确",
    "边缘服务身份或只读标记错误",
  );
  check(
    health.response.headers.get("server")?.toLowerCase() === "cloudflare",
    "请求由 Cloudflare 边缘响应",
    "响应未证明来自 Cloudflare 边缘",
  );
  check(
    health.response.headers.get("cache-control") === "no-store",
    "健康状态禁止缓存",
    "健康状态缺少 no-store",
  );
  check(
    health.response.headers.get("x-content-type-options") === "nosniff" &&
      health.response.headers.get("x-frame-options") === "DENY",
    "健康响应安全头正确",
    "健康响应缺少安全头",
  );
  check(
    health.response.headers.get("strict-transport-security")?.includes("max-age=63072000") &&
      health.response.headers.get("content-security-policy")?.includes("default-src 'none'") &&
      health.response.headers.get("permissions-policy")?.includes("camera=()"),
    "HSTS、CSP 与权限策略正确",
    "HSTS、CSP 或权限策略缺失",
  );
  check(
    ["bootstrap", "unseeded", "unavailable", "ready"].includes(health.body?.storage),
    `存储状态可识别（${health.body?.storage}）`,
    `未知存储状态（${health.body?.storage ?? "缺失"}）`,
  );
  if (requireReady) {
    check(
      health.body?.storage === "ready" && health.body?.preservationReady === true,
      "R2 不可变经藏已就绪",
      `要求 R2 就绪，但当前为 ${health.body?.storage ?? "未知"}`,
    );
  } else if (health.body?.storage !== "ready") {
    console.warn(`⚠ R2 尚未就绪，当前诚实状态为 ${health.body?.storage ?? "未知"}`);
  }
  if (expectedReleaseId) {
    check(
      health.body?.releaseId === expectedReleaseId,
      `发行 ID 符合预期（${expectedReleaseId}）`,
      `发行 ID 不匹配（期望 ${expectedReleaseId}，实际 ${health.body?.releaseId ?? "缺失"}）`,
    );
  }
  if (expectedManifestSha256) {
    check(
      health.body?.releaseManifestSha256 === expectedManifestSha256,
      "版本清单 SHA-256 符合预期",
      `版本清单 SHA-256 不匹配（实际 ${health.body?.releaseManifestSha256 ?? "缺失"}）`,
    );
  }
}

if (ready && health) {
  const shouldBeReady = health.body?.storage === "ready";
  check(
    ready.response.status === (shouldBeReady ? 200 : 503),
    `/ready 与存储状态一致（${ready.response.status}）`,
    `/ready 与存储状态矛盾（${ready.response.status}）`,
  );
  check(
    ready.body?.ready === shouldBeReady && ready.body?.preservationReady === shouldBeReady,
    "就绪布尔值与存储状态一致",
    "就绪布尔值与存储状态矛盾",
  );
}

let manifestPath = null;
if (latest && health) {
  check(latest.response.status === 200, "/v1/latest.json 返回 200", `/v1/latest.json 返回 ${latest.response.status}`);
  check(
    latest.body?.releaseId === health.body?.releaseId,
    "发行指针与健康状态使用同一发行 ID",
    "发行指针与健康状态的发行 ID 不一致",
  );
  check(
    latest.body?.manifestSha256 === health.body?.releaseManifestSha256,
    "发行指针与健康状态使用同一清单哈希",
    "发行指针与健康状态的清单哈希不一致",
  );
  check(
    latest.response.headers.get("access-control-allow-origin") === "https://www.foxue.ai",
    "发行指针允许规范 www 域名跨域读取",
    "发行指针缺少规范 www 域名 CORS",
  );
  check(
    typeof latest.body?.manifestObjectKey === "string" &&
      /^v1\/releases\/[a-z0-9][a-z0-9.-]{0,95}\/manifest\.json$/.test(latest.body.manifestObjectKey),
    "发行清单对象键符合不可变布局",
    "发行清单对象键无效",
  );
  if (typeof latest.body?.manifestObjectKey === "string") manifestPath = `/${latest.body.manifestObjectKey}`;
}

if (latestBare) {
  check(
    latestBare.response.headers.get("access-control-allow-origin") === "https://foxue.ai",
    "发行指针允许裸域跨域读取",
    "发行指针缺少裸域 CORS",
  );
}

if (latestThirdParty) {
  check(
    latestThirdParty.response.headers.get("access-control-allow-origin") === null,
    "第三方来源未获得跨域权限",
    "第三方来源被错误授予跨域权限",
  );
}

if (preflight) {
  check(
    preflight.response.status === 204 &&
      preflight.response.headers.get("access-control-allow-origin") === "https://www.foxue.ai" &&
      preflight.response.headers.get("access-control-allow-methods")?.includes("GET"),
    "规范 www 域名预检请求通过",
    "规范 www 域名预检响应不正确",
  );
}

if (manifestPath && health) {
  const manifest = await request(manifestPath, { method: "HEAD" });
  if (manifest) {
    const shouldBeReady = health.body?.storage === "ready";
    check(
      manifest.response.status === (shouldBeReady ? 200 : 503),
      `发行清单可用性与存储状态一致（${manifest.response.status}）`,
      `发行清单可用性与存储状态矛盾（${manifest.response.status}）`,
    );
  }
}

const writeAttempt = await request("/health", { method: "POST" });
if (writeAttempt) {
  check(
    writeAttempt.response.status === 405 &&
      writeAttempt.response.headers.get("allow") === "GET, HEAD, OPTIONS",
    "写请求被 405 拒绝",
    `写请求门禁异常（${writeAttempt.response.status}）`,
  );
}

for (const item of successes) console.log(`✓ ${item}`);
for (const item of failures) console.error(`✗ ${item}`);

if (failures.length > 0) process.exitCode = 1;

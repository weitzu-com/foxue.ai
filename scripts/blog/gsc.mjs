// Google Search Console Search Analytics 读取器。
// 使用服务账号 JWT 直接换取访问令牌，不依赖 googleapis SDK。
// 需要：把服务账号邮箱加入 Search Console 资源（sc-domain:foxue.ai）的用户列表，权限"受限"即可。

import { createSign } from "node:crypto";

export const gscSiteUrl = process.env.GSC_SITE_URL ?? "sc-domain:foxue.ai";
const tokenEndpoint = "https://oauth2.googleapis.com/token";
const scope = "https://www.googleapis.com/auth/webmasters.readonly";

export function loadServiceAccount() {
  const raw = process.env.GSC_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  let parsed;
  try {
    parsed = JSON.parse(raw.trim().startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf8"));
  } catch {
    throw new Error("GSC_SERVICE_ACCOUNT_JSON 不是合法 JSON（也不是 base64 编码的 JSON）");
  }
  if (!parsed.client_email || !parsed.private_key) {
    throw new Error("GSC_SERVICE_ACCOUNT_JSON 缺少 client_email 或 private_key");
  }
  return parsed;
}

function base64Url(input) {
  return Buffer.from(input).toString("base64").replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

export async function fetchAccessToken(serviceAccount) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64Url(
    JSON.stringify({ iss: serviceAccount.client_email, scope, aud: tokenEndpoint, iat: now, exp: now + 3600 }),
  );
  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${claims}`);
  const signature = signer.sign(serviceAccount.private_key, "base64").replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
  const assertion = `${header}.${claims}.${signature}`;

  const response = await fetch(tokenEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
  });
  if (!response.ok) throw new Error(`Google OAuth 令牌交换失败：HTTP ${response.status} ${await response.text()}`);
  const payload = await response.json();
  if (!payload.access_token) throw new Error("Google OAuth 未返回 access_token");
  return payload.access_token;
}

export function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

/**
 * GSC 数据通常滞后 2–3 天；默认结束日期取 3 天前，起始日期再往前 90 天。
 */
export function defaultWindow(today = new Date()) {
  const end = new Date(today);
  end.setUTCDate(end.getUTCDate() - 3);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 90);
  return { start: formatDate(start), end: formatDate(end) };
}

export async function fetchSearchAnalytics({
  serviceAccount,
  siteUrl = gscSiteUrl,
  start,
  end,
  dimensions = ["query", "page"],
  rowLimit = 25000,
  maxRows = 100000,
  searchType = "web",
}) {
  const token = await fetchAccessToken(serviceAccount);
  const endpoint = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`;
  const rows = [];
  for (let startRow = 0; startRow < maxRows; startRow += rowLimit) {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        startDate: start,
        endDate: end,
        dimensions,
        rowLimit,
        startRow,
        dataState: "final",
        type: searchType,
      }),
    });
    if (!response.ok) {
      throw new Error(`Search Console 查询失败：HTTP ${response.status} ${await response.text()}`);
    }
    const payload = await response.json();
    const batch = Array.isArray(payload.rows) ? payload.rows : [];
    for (const row of batch) {
      const record = {
        clicks: row.clicks ?? 0,
        impressions: row.impressions ?? 0,
        ctr: row.ctr ?? 0,
        position: row.position ?? 0,
      };
      dimensions.forEach((dimension, index) => {
        record[dimension] = row.keys?.[index] ?? "";
      });
      rows.push(record);
    }
    if (batch.length < rowLimit) break;
  }
  return rows;
}

/**
 * 把 query×page 行折叠成 query 级汇总，并记录曝光最多的落地页。
 */
export function aggregateByQuery(rows) {
  const byQuery = new Map();
  for (const row of rows) {
    const query = (row.query ?? "").trim();
    if (!query) continue;
    const entry = byQuery.get(query) ?? {
      query,
      clicks: 0,
      impressions: 0,
      weightedPosition: 0,
      pages: new Map(),
    };
    entry.clicks += row.clicks;
    entry.impressions += row.impressions;
    entry.weightedPosition += row.position * row.impressions;
    if (row.page) entry.pages.set(row.page, (entry.pages.get(row.page) ?? 0) + row.impressions);
    byQuery.set(query, entry);
  }
  return [...byQuery.values()]
    .map((entry) => {
      const topPage = [...entry.pages.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
      return {
        query: entry.query,
        clicks: entry.clicks,
        impressions: entry.impressions,
        ctr: entry.impressions > 0 ? entry.clicks / entry.impressions : 0,
        position: entry.impressions > 0 ? entry.weightedPosition / entry.impressions : 0,
        topPage,
      };
    })
    .sort((a, b) => b.impressions - a.impressions);
}

import { resolveTxt } from "node:dns/promises";

const baseUrl = new URL(process.argv[2] ?? process.env.NEXT_PUBLIC_SITE_URL ?? "https://foxue.ai");
const expectedMeasurementId = process.env.EXPECTED_GA4_MEASUREMENT_ID;
const failures = [];
const successes = [];

function check(condition, success, failure) {
  if (condition) successes.push(success);
  else failures.push(failure);
}

async function get(pathname) {
  const response = await fetch(new URL(pathname, baseUrl), {
    headers: { "user-agent": "foxue-google-integration-check/1.0" },
    signal: AbortSignal.timeout(20_000),
  });

  const body = await response.text();
  check(response.ok, `${pathname} 可访问`, `${pathname} 返回 ${response.status}`);
  return { body, response };
}

async function getTxtRecords(hostname) {
  try {
    return (await resolveTxt(hostname)).map((parts) => parts.join(""));
  } catch (systemDnsError) {
    const endpoint = new URL("https://cloudflare-dns.com/dns-query");
    endpoint.searchParams.set("name", hostname);
    endpoint.searchParams.set("type", "TXT");

    try {
      const response = await fetch(endpoint, {
        headers: { accept: "application/dns-json" },
        signal: AbortSignal.timeout(20_000),
      });
      if (!response.ok) throw new Error(`DoH 返回 ${response.status}`);

      const payload = await response.json();
      const records = (payload.Answer ?? [])
        .filter((answer) => answer.type === 16 && typeof answer.data === "string")
        .map((answer) => answer.data.replace(/^"|"$/g, "").replace(/"\s+"/g, ""));
      if (records.length === 0) throw new Error("DoH 未返回 TXT 记录");
      return records;
    } catch (dohError) {
      throw new AggregateError(
        [systemDnsError, dohError],
        "系统 DNS 与备用 DNS 均无法读取 TXT",
      );
    }
  }
}

const [home, robots, sitemap] = await Promise.all([
  get("/"),
  get("/robots.txt"),
  get("/sitemap.xml"),
]);

const measurementMatch = home.body.match(
  /name=["']ga4-measurement-id["']\s+content=["'](G-[A-Z0-9]+)["']/i,
);
check(
  Boolean(measurementMatch) &&
    (!expectedMeasurementId || measurementMatch?.[1] === expectedMeasurementId),
  `GA4 衡量 ID 已发布（${measurementMatch?.[1] ?? ""}）`,
  expectedMeasurementId
    ? `GA4 衡量 ID 不匹配（期望 ${expectedMeasurementId}，实际 ${measurementMatch?.[1] ?? "缺失"}）`
    : "首页缺少有效的 GA4 衡量 ID 标记",
);

const csp = home.response.headers.get("content-security-policy") ?? "";
check(
  csp.includes("googletagmanager.com") && csp.includes("google-analytics.com"),
  "内容安全策略允许 GA4 必要端点",
  "内容安全策略未完整允许 GA4 必要端点",
);

check(
  robots.body.includes(`Sitemap: ${new URL("/sitemap.xml", baseUrl)}`),
  "robots.txt 已声明站点地图",
  "robots.txt 未声明正确的站点地图地址",
);

check(
  sitemap.body.includes(`<loc>${baseUrl.origin}</loc>`) ||
    sitemap.body.includes(`<loc>${baseUrl.origin}/</loc>`),
  "站点地图包含规范首页",
  "站点地图缺少规范首页",
);

try {
  const records = await getTxtRecords(baseUrl.hostname);
  check(
    records.some((record) => record.startsWith("google-site-verification=")),
    "GSC 网域资源 DNS 验证记录存在",
    "DNS 中缺少 google-site-verification TXT 记录",
  );
} catch (error) {
  failures.push(`无法读取 DNS TXT：${error instanceof Error ? error.message : String(error)}`);
}

for (const item of successes) console.log(`✓ ${item}`);
for (const item of failures) console.error(`✗ ${item}`);

if (failures.length > 0) process.exitCode = 1;

const fetchBaseUrl = new URL(process.argv[2] ?? process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.foxue.ai");
const expectedSiteOrigin = new URL(process.env.EXPECTED_SITE_ORIGIN ?? fetchBaseUrl.origin).origin;
const failures = [];
const successes = [];

const titleMin = 15;
const titleMax = 60;
const descriptionMin = 30;
const descriptionMax = 160;
const concurrency = 12;

function check(condition, success, failure) {
  if (condition) successes.push(success);
  else failures.push(failure);
}

async function fetchWithRetry(url, init, retries = 2) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await fetch(url, init);
    } catch (error) {
      lastError = error;
      if (attempt === retries) break;
    }
  }
  throw lastError;
}

async function get(pathname) {
  const response = await fetchWithRetry(new URL(pathname, fetchBaseUrl), {
    headers: { "user-agent": "foxue-library-metadata-check/1.0" },
    signal: AbortSignal.timeout(20_000),
  });
  const body = await response.text();
  if (!response.ok) {
    failures.push(`${pathname} 返回 ${response.status}`);
  }
  return { response, body };
}

function extractHeadValue(html, pattern) {
  return html.match(pattern)?.[1] ?? null;
}

function decodeHtmlEntities(value) {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#([0-9]+);/g, (_, decimal) => String.fromCodePoint(Number.parseInt(decimal, 10)))
    .replace(/&quot;/g, "\"")
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function characterLength(value) {
  return Array.from(value).length;
}

function normalizeUrl(value) {
  if (!value) return null;
  return new URL(value).href;
}

async function loadMergedSitemap() {
  const { body: indexBody } = await get("/sitemap-index.xml");
  const childPaths = [...indexBody.matchAll(/<loc>https?:\/\/[^/]+(\/sitemap\/\d+\.xml)<\/loc>/g)]
    .map((match) => match[1]);
  check(childPaths.length > 0, "sitemap index 可枚举子分片", "sitemap index 未声明子分片");

  const children = await Promise.all(
    childPaths.map(async (pathname) => {
      const { body } = await get(pathname);
      return body;
    }),
  );
  return children.join("\n");
}

function collectAuditPaths(mergedSitemap) {
  const urls = [...mergedSitemap.matchAll(/<loc>(https?:\/\/[^<]+)<\/loc>/g)].map((match) => match[1]);
  const sutraPaths = urls
    .filter((url) => url.startsWith(`${expectedSiteOrigin}/jingzang/`))
    .map((url) => new URL(url))
    .filter((url) => {
      if (url.search || url.hash) return false;
      if (!url.pathname.startsWith("/jingzang/")) return false;
      if (url.pathname.startsWith("/jingzang/page/")) return false;
      if (url.pathname === "/jingzang/sousuo") return false;
      const parts = url.pathname.split("/").filter(Boolean);
      return parts.length === 2;
    })
    .map((url) => url.pathname);

  return [...new Set(sutraPaths)].sort();
}

async function mapWithConcurrency(items, worker) {
  const queue = [...items];
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (queue.length > 0) {
      const item = queue.shift();
      if (!item) return;
      await worker(item);
    }
  });
  await Promise.all(workers);
}

const mergedSitemap = await loadMergedSitemap();
const sutraPaths = collectAuditPaths(mergedSitemap);
check(sutraPaths.length > 3000, `已收集 ${sutraPaths.length} 个经目页用于 metadata 护栏审计`, `经目页样本过少：仅收集 ${sutraPaths.length} 个`);

await mapWithConcurrency(sutraPaths, async (pathname) => {
  const { body, response } = await get(pathname);
  if (!response.ok) return;

  const title = extractHeadValue(body, /<title>([^<]+)<\/title>/i);
  const description = extractHeadValue(body, /<meta[^>]+name="description"[^>]+content="([^"]+)"/i);
  const canonical = normalizeUrl(extractHeadValue(body, /<link[^>]+rel="canonical"[^>]+href="([^"]+)"/i));
  const ogUrl = normalizeUrl(extractHeadValue(body, /<meta[^>]+property="og:url"[^>]+content="([^"]+)"/i));

  check(Boolean(title), `${pathname} title 存在`, `${pathname} 缺少 title`);
  check(Boolean(description), `${pathname} description 存在`, `${pathname} 缺少 description`);
  check(canonical === `${expectedSiteOrigin}${pathname}`, `${pathname} canonical 自指`, `${pathname} canonical 非自指（实际 ${canonical ?? "缺失"}）`);
  check(ogUrl === `${expectedSiteOrigin}${pathname}`, `${pathname} og:url 自指`, `${pathname} og:url 非自指（实际 ${ogUrl ?? "缺失"}）`);

  if (title) {
    const decodedTitle = decodeHtmlEntities(title);
    const length = characterLength(decodedTitle);
    check(
      length >= titleMin && length <= titleMax,
      `${pathname} title 长度 ${length} 在护栏内`,
      `${pathname} title 长度 ${length} 超出护栏 [${titleMin}, ${titleMax}]：${decodedTitle}`,
    );
    check(
      decodedTitle.includes("原文与目录") && decodedTitle.endsWith("｜foxue.ai"),
      `${pathname} title 语义包含“原文与目录”且带品牌后缀`,
      `${pathname} title 未体现“原文与目录”或缺少品牌后缀：${decodedTitle}`,
    );
  }

  if (description) {
    const decodedDescription = decodeHtmlEntities(description);
    const length = characterLength(decodedDescription);
    check(
      length >= descriptionMin && length <= descriptionMax,
      `${pathname} description 长度 ${length} 在护栏内`,
      `${pathname} description 长度 ${length} 超出护栏 [${descriptionMin}, ${descriptionMax}]：${decodedDescription}`,
    );
  }
});

if (failures.length > 0) {
  console.error(`✗ 经目页 metadata 护栏审计失败，共 ${failures.length} 项`);
  for (const failure of failures.slice(0, 50)) {
    console.error(`- ${failure}`);
  }
  if (failures.length > 50) {
    console.error(`- 其余 ${failures.length - 50} 项已省略`);
  }
  process.exit(1);
}

console.log(`✓ 已审计 ${sutraPaths.length} 个经目页 metadata 护栏`);

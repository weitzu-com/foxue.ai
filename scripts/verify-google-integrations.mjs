import { resolveTxt } from "node:dns/promises";

const fetchBaseUrl = new URL(process.argv[2] ?? process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.foxue.ai");
const expectedSiteOrigin = new URL(process.env.EXPECTED_SITE_ORIGIN ?? fetchBaseUrl.origin).origin;
const expectedMeasurementId = process.env.EXPECTED_GA4_MEASUREMENT_ID;
const failures = [];
const successes = [];
const isLocalFetch = fetchBaseUrl.hostname === "127.0.0.1" || fetchBaseUrl.hostname === "localhost";

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
    headers: { "user-agent": "foxue-google-integration-check/1.0" },
    signal: AbortSignal.timeout(20_000),
  });

  const body = await response.text();
  check(response.ok, `${pathname} 可访问`, `${pathname} 返回 ${response.status}`);
  return { body, response };
}

function extractHeadValue(html, pattern) {
  return html.match(pattern)?.[1] ?? null;
}

function extractJsonLdItems(html) {
  return [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
    .flatMap((match) => {
      const parsed = JSON.parse(match[1]);
      return Array.isArray(parsed["@graph"]) ? parsed["@graph"] : [parsed];
    });
}

function normalizeUrl(value) {
  if (!value) return null;
  return new URL(value).href;
}

function stripTrailingSlash(value) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

async function loadMergedSitemap() {
  const { body: indexBody } = await get("/sitemap-index.xml");
  const childSitemapPaths = [...indexBody.matchAll(/<loc>https?:\/\/[^/]+(\/sitemap\/\d+\.xml)<\/loc>/g)]
    .map((match) => match[1]);
  check(childSitemapPaths.length > 0, "sitemap index 已声明子分片", "sitemap index 未声明子分片");

  const children = await Promise.all(
    childSitemapPaths.map(async (pathname) => {
      const response = await fetchWithRetry(new URL(pathname, fetchBaseUrl), {
        headers: { "user-agent": "foxue-google-integration-check/1.0" },
        signal: AbortSignal.timeout(20_000),
      });
      const body = await response.text();
      check(response.ok, `${pathname} 可访问`, `${pathname} 返回 ${response.status}`);
      return body;
    }),
  );

  return children.join("\n");
}

async function getTxtRecords(hostname) {
  try {
    return (await resolveTxt(hostname)).map((parts) => parts.join(""));
  } catch (systemDnsError) {
    const endpoint = new URL("https://cloudflare-dns.com/dns-query");
    endpoint.searchParams.set("name", hostname);
    endpoint.searchParams.set("type", "TXT");

    try {
      const response = await fetchWithRetry(endpoint, {
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

const [home, wenjing, gainian, gainianKong, gainianWuchang, gainianWuwo, gainianWuzhu, gainianGuanxin, jingzang, jingzangSearch, jingzangXinjing, jingzangXinjingFolio, fugai, fenmu, shenjiao, touming, yuanze, robots] = await Promise.all([
  get("/"),
  get("/wenjing"),
  get("/gainian"),
  get("/gainian/kong"),
  get("/gainian/wuchang"),
  get("/gainian/wuwo"),
  get("/gainian/wuzhu"),
  get("/gainian/guanxin"),
  get("/jingzang"),
  get("/jingzang/sousuo?q=%E5%BF%83%E7%BB%8F"),
  get("/jingzang/xinjing"),
  get("/jingzang/xinjing/001-0848c"),
  get("/fugai"),
  get("/fenmu"),
  get("/shenjiao"),
  get("/touming"),
  get("/yuanze"),
  get("/robots.txt"),
]);
const mergedSitemap = await loadMergedSitemap();

const pageExpectations = [
  [
    "/",
    home,
    {
      title: "佛经在线阅读与 AI 问经平台",
      description: "foxue.ai 提供佛经在线阅读、原典查询、心经原文定位与 AI 问经，所有关键结论回到可核验出处。",
      bodyIncludes: ["佛经在线阅读与", "AI 问经平台", "每条主张可追溯"],
      jsonLd: [["https://www.foxue.ai/#page", "WebPage"]],
    },
  ],
  [
    "/wenjing",
    wenjing,
    {
      title: "AI问经与原典出处对照｜foxue.ai",
      description: "输入佛学问题，查看 AI 问经答案、佛经原典出处、版本边界与证据不足提示。",
      bodyIncludes: ["AI 问经，先回到原典出处。", "当前问经原型仅检索三部已完成人工样本复核的经典"],
      jsonLd: [
        ["https://www.foxue.ai/wenjing#page", "WebPage"],
        ["https://www.foxue.ai/wenjing#breadcrumb", "BreadcrumbList"],
      ],
    },
  ],
  [
    "/gainian",
    gainian,
    {
      title: "佛教概念与主题 Hub｜foxue.ai",
      description: "按主题进入空、无常、无我、无住、观心等受控证据页；先理解边界，再回到原典与问经。",
      bodyIncludes: ["先进入主题层", "再下钻到原典证据。", "进入概念 Hub"],
      jsonLd: [
        ["https://www.foxue.ai/gainian#page", "CollectionPage"],
        ["https://www.foxue.ai/gainian#breadcrumb", "BreadcrumbList"],
        ["https://www.foxue.ai/gainian#list", "ItemList"],
      ],
    },
  ],
  [
    "/gainian/kong",
    gainianKong,
    {
      title: "空｜概念 Hub｜foxue.ai",
      description: "从受控巴利经藏与汉译般若证据理解“空”的术语范围、传统边界、常见误解，并回到稳定原典段落。",
      jsonLd: [
        ["https://www.foxue.ai/gainian/kong#page", "WebPage"],
        ["https://www.foxue.ai/gainian/kong#term", "DefinedTerm"],
        ["https://www.foxue.ai/gainian/kong#breadcrumb", "BreadcrumbList"],
      ],
    },
  ],
  [
    "/gainian/wuchang",
    gainianWuchang,
    {
      title: "无常｜概念 Hub｜foxue.ai",
      description: "从《佛说无常经》与《佛说五蕴皆空经》等现有证据理解“无常”的观察范围、修行指向与常见误解。",
      jsonLd: [
        ["https://www.foxue.ai/gainian/wuchang#page", "WebPage"],
        ["https://www.foxue.ai/gainian/wuchang#term", "DefinedTerm"],
        ["https://www.foxue.ai/gainian/wuchang#breadcrumb", "BreadcrumbList"],
      ],
    },
  ],
  [
    "/gainian/wuwo",
    gainianWuwo,
    {
      title: "无我｜概念 Hub｜foxue.ai",
      description: "从《佛说五蘊皆空经》与《外道问圣大乘法无我义经》等现有证据理解“无我”的观察范围、传统边界与常见误解。",
      jsonLd: [
        ["https://www.foxue.ai/gainian/wuwo#page", "WebPage"],
        ["https://www.foxue.ai/gainian/wuwo#term", "DefinedTerm"],
        ["https://www.foxue.ai/gainian/wuwo#breadcrumb", "BreadcrumbList"],
      ],
    },
  ],
  [
    "/gainian/wuzhu",
    gainianWuzhu,
    {
      title: "无住｜概念 Hub｜foxue.ai",
      description: "从《金刚经》等现有汉译般若证据理解“无住”的行动边界、常见误读与原文出处。",
      jsonLd: [
        ["https://www.foxue.ai/gainian/wuzhu#page", "WebPage"],
        ["https://www.foxue.ai/gainian/wuzhu#term", "DefinedTerm"],
        ["https://www.foxue.ai/gainian/wuzhu#breadcrumb", "BreadcrumbList"],
      ],
    },
  ],
  [
    "/gainian/guanxin",
    gainianGuanxin,
    {
      title: "观心｜概念 Hub｜foxue.ai",
      description: "从《法句经》与《心经》现有受控样本理解“观心”如何与烦恼、语言、行动和离苦相连。",
      jsonLd: [
        ["https://www.foxue.ai/gainian/guanxin#page", "WebPage"],
        ["https://www.foxue.ai/gainian/guanxin#term", "DefinedTerm"],
        ["https://www.foxue.ai/gainian/guanxin#breadcrumb", "BreadcrumbList"],
      ],
    },
  ],
  [
    "/jingzang",
    jingzang,
    {
      title: "佛经在线阅读与经藏目录｜foxue.ai",
      description: "浏览已登记佛典全文、来源、版本、经号与稳定行段；涵盖汉文、藏文、巴利文、梵文与俗语见证。",
      bodyIncludes: ["经文先于工具", "来源先于答案。"],
      jsonLd: [
        ["https://www.foxue.ai/jingzang#page", "CollectionPage"],
        ["https://www.foxue.ai/jingzang#breadcrumb", "BreadcrumbList"],
      ],
    },
  ],
  [
    "/jingzang/xinjing",
    jingzangXinjing,
    {
      title: "般若波罗蜜多心经原文与目录｜foxue.ai",
      description: "般若波罗蜜多心经：以极精炼的篇幅呈现般若空义，并以“照见五蕴皆空”说明智慧与离苦的关系。",
      jsonLd: [
        ["https://www.foxue.ai/jingzang/xinjing#page", "CollectionPage"],
        ["https://www.foxue.ai/jingzang/xinjing#breadcrumb", "BreadcrumbList"],
        ["https://www.foxue.ai/jingzang/xinjing#work", "CreativeWork"],
      ],
    },
  ],
  [
    "/jingzang/xinjing/001-0848c",
    jingzangXinjingFolio,
    {
      title: "般若波罗蜜多心经 · 0848c｜foxue.ai",
      description: "般若波罗蜜多心经卷 1，大正藏 0848c 版页原文。",
      jsonLd: [
        ["https://www.foxue.ai/jingzang/xinjing/001-0848c#page", "WebPage"],
        ["https://www.foxue.ai/jingzang/xinjing/001-0848c#breadcrumb", "BreadcrumbList"],
        ["https://www.foxue.ai/jingzang/xinjing/001-0848c#folio", "DigitalDocument"],
      ],
    },
  ],
  [
    "/fugai",
    fugai,
    {
      title: "全球佛典覆盖登记册｜foxue.ai",
      description: "foxue.ai 全球佛典覆盖登记册：公开分母、来源快照、权利状态和可复算的收录进度。",
      jsonLd: [
        ["https://www.foxue.ai/fugai#page", "CollectionPage"],
        ["https://www.foxue.ai/fugai#breadcrumb", "BreadcrumbList"],
      ],
    },
  ],
  [
    "/fenmu",
    fenmu,
    {
      title: "全球佛经作品分母治理｜foxue.ai",
      description: "foxue.ai 全球佛经作品分母治理：公开来源宇宙、保守公式、审校队列和 G0–G7 发布门。",
      jsonLd: [
        ["https://www.foxue.ai/fenmu#page", "CollectionPage"],
        ["https://www.foxue.ai/fenmu#breadcrumb", "BreadcrumbList"],
      ],
    },
  ],
  [
    "/shenjiao",
    shenjiao,
    {
      title: "汉巴作品关系审校台｜foxue.ai",
      description: "foxue.ai 汉巴作品关系双人复核队列：公开反证、文本范围、证据身份与裁决门槛。",
      jsonLd: [
        ["https://www.foxue.ai/shenjiao#page", "CollectionPage"],
        ["https://www.foxue.ai/shenjiao#breadcrumb", "BreadcrumbList"],
      ],
    },
  ],
  [
    "/touming",
    touming,
    {
      title: "数据透明度与建设状态｜foxue.ai",
      description: "公开 foxue.ai 的数据覆盖、来源、AI 能力、已知局限和当前建设状态。",
      jsonLd: [
        ["https://www.foxue.ai/touming#page", "AboutPage"],
        ["https://www.foxue.ai/touming#breadcrumb", "BreadcrumbList"],
      ],
    },
  ],
  [
    "/yuanze",
    yuanze,
    {
      title: "可信佛学系统的原则与边界｜foxue.ai",
      description: "说明 foxue.ai 如何定义可信、纠错、多传统公平与长期传承的底层原则。",
      jsonLd: [
        ["https://www.foxue.ai/yuanze#page", "AboutPage"],
        ["https://www.foxue.ai/yuanze#breadcrumb", "BreadcrumbList"],
      ],
    },
  ],
];

const measurementMatch = home.body.match(
  /name=["']ga4-measurement-id["']\s+content=["'](G-[A-Z0-9]+)["']/i,
);
if (isLocalFetch && !measurementMatch) {
  successes.push("本地验证已跳过 GA4 衡量 ID 检查");
} else {
  check(
    Boolean(measurementMatch) &&
      (!expectedMeasurementId || measurementMatch?.[1] === expectedMeasurementId),
    `GA4 衡量 ID 已发布（${measurementMatch?.[1] ?? ""}）`,
    expectedMeasurementId
      ? `GA4 衡量 ID 不匹配（期望 ${expectedMeasurementId}，实际 ${measurementMatch?.[1] ?? "缺失"}）`
      : "首页缺少有效的 GA4 衡量 ID 标记",
  );
}

const csp = home.response.headers.get("content-security-policy") ?? "";
check(
  csp.includes("googletagmanager.com") && csp.includes("google-analytics.com"),
  "内容安全策略允许 GA4 必要端点",
  "内容安全策略未完整允许 GA4 必要端点",
);

check(
  robots.body.includes(`Sitemap: ${new URL("/sitemap-index.xml", expectedSiteOrigin)}`),
  "robots.txt 已声明 sitemap index",
  "robots.txt 未声明正确的 sitemap index 地址",
);

check(
  mergedSitemap.includes(`<loc>${expectedSiteOrigin}</loc>`) ||
    mergedSitemap.includes(`<loc>${expectedSiteOrigin}/</loc>`),
  "sitemap 分片包含规范首页",
  "sitemap 分片缺少规范首页",
);

for (const [path, page, expected] of pageExpectations) {
  const expectedUrl = new URL(path, expectedSiteOrigin).href;
  const title = extractHeadValue(page.body, /<title>([^<]+)<\/title>/i);
  const description = extractHeadValue(page.body, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)/i);
  const canonical = extractHeadValue(page.body, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)/i);
  const ogUrl = extractHeadValue(page.body, /<meta[^>]+property=["']og:url["'][^>]+content=["']([^"']+)/i);
  const twitterCard = extractHeadValue(page.body, /<meta[^>]+name=["']twitter:card["'][^>]+content=["']([^"']+)/i);
  const jsonLdItems = extractJsonLdItems(page.body);

  check(title === expected.title, `${path} title 正确`, `${path} title 非预期（实际 ${title ?? "缺失"}）`);
  check(
    description === expected.description,
    `${path} description 正确`,
    `${path} description 非预期（实际 ${description ?? "缺失"}）`,
  );
  check(
    normalizeUrl(canonical) === expectedUrl,
    `${path} canonical 自指`,
    `${path} canonical 非自指（实际 ${canonical ?? "缺失"}）`,
  );
  check(
    normalizeUrl(ogUrl) === expectedUrl,
    `${path} og:url 自指`,
    `${path} og:url 非自指（实际 ${ogUrl ?? "缺失"}）`,
  );
  check(twitterCard === "summary_large_image", `${path} twitter card 正确`, `${path} twitter card 缺失或错误`);
  check(
    mergedSitemap.includes(`<loc>${expectedUrl}</loc>`) ||
      mergedSitemap.includes(`<loc>${stripTrailingSlash(expectedUrl)}</loc>`),
    `${path} 已进入 sitemap`,
    `${path} 未进入 sitemap`,
  );
  for (const text of expected.bodyIncludes ?? []) {
    check(
      page.body.includes(text),
      `${path} 可见内容包含“${text}”`,
      `${path} 缺少可见内容“${text}”`,
    );
  }
  for (const [id, type] of expected.jsonLd ?? []) {
    check(
      jsonLdItems.some((item) => item["@id"] === id && item["@type"] === type),
      `${path} JSON-LD 包含 ${type}`,
      `${path} JSON-LD 缺少 ${type}（${id}）`,
    );
  }
}

const searchCanonical = extractHeadValue(
  jingzangSearch.body,
  /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)/i,
);
const searchOgUrl = extractHeadValue(
  jingzangSearch.body,
  /<meta[^>]+property=["']og:url["'][^>]+content=["']([^"']+)/i,
);
const searchRobots = extractHeadValue(
  jingzangSearch.body,
  /<meta[^>]+name=["']robots["'][^>]+content=["']([^"']+)/i,
);
check(
  normalizeUrl(searchCanonical) === new URL("/jingzang", expectedSiteOrigin).href,
  "/jingzang/sousuo canonical 回落目录",
  `/jingzang/sousuo canonical 非预期（实际 ${searchCanonical ?? "缺失"}）`,
);
check(
  normalizeUrl(searchOgUrl) === new URL("/jingzang", expectedSiteOrigin).href,
  "/jingzang/sousuo og:url 回落目录",
  `/jingzang/sousuo og:url 非预期（实际 ${searchOgUrl ?? "缺失"}）`,
);
check(
  searchRobots === "noindex, follow",
  "/jingzang/sousuo 声明 noindex, follow",
  `/jingzang/sousuo robots 非预期（实际 ${searchRobots ?? "缺失"}）`,
);

if (isLocalFetch) {
  successes.push("本地验证已跳过 DNS TXT 检查");
} else {
  try {
    const verificationHost = fetchBaseUrl.hostname.startsWith("www.")
      ? fetchBaseUrl.hostname.slice("www.".length)
      : fetchBaseUrl.hostname;
    const records = await getTxtRecords(verificationHost);
    check(
      records.some((record) => record.startsWith("google-site-verification=")),
      "GSC 网域资源 DNS 验证记录存在",
      `DNS 中缺少 ${verificationHost} 的 google-site-verification TXT 记录`,
    );
  } catch (error) {
    failures.push(`无法读取 DNS TXT：${error instanceof Error ? error.message : String(error)}`);
  }
}

for (const item of successes) console.log(`✓ ${item}`);
for (const item of failures) console.error(`✗ ${item}`);

if (failures.length > 0) process.exitCode = 1;

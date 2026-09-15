import { resolveTxt } from "node:dns/promises";
import { corpusRuntimeSmokeRoutes } from "./corpus-runtime-smoke-routes.mjs";

const fetchBaseUrl = new URL(process.argv[2] ?? process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.foxue.ai");
const expectedSiteOrigin = new URL(process.env.EXPECTED_SITE_ORIGIN ?? fetchBaseUrl.origin).origin;
const expectedMeasurementId = process.env.EXPECTED_GA4_MEASUREMENT_ID;
const expectedSourceCommitSha = process.env.EXPECTED_SOURCE_COMMIT_SHA?.trim().toLowerCase() || undefined;
const failures = [];
const successes = [];
const isLocalFetch = fetchBaseUrl.hostname === "127.0.0.1" || fetchBaseUrl.hostname === "localhost";

function normalizeCommitRef(value) {
  const compact = value?.trim();
  if (!compact) return undefined;
  if (compact.startsWith("refs/heads/")) return compact.slice("refs/heads/".length);
  if (compact.startsWith("refs/tags/")) return compact.slice("refs/tags/".length);
  return compact;
}

const expectedSourceCommitRef = (() => {
  const normalized = normalizeCommitRef(process.env.EXPECTED_SOURCE_COMMIT_REF);
  if (!normalized) return undefined;
  return /^[0-9a-f]{7,40}$/i.test(normalized) ? undefined : normalized;
})();

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

async function get(pathname, timeoutMs = 20_000) {
  const response = await fetchWithRetry(new URL(pathname, fetchBaseUrl), {
    headers: { "user-agent": "foxue-google-integration-check/1.0" },
    signal: AbortSignal.timeout(timeoutMs),
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
  const childSitemapPaths = [...indexBody.matchAll(
    /<loc>https?:\/\/[^/]+(\/sitemap\/\d+\.xml|\/sitemap-(?:hubs|works)\.xml)<\/loc>/g,
  )]
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

const [home, wenjing, gainian, gainianKong, gainianWuchang, gainianWuwo, gainianWuzhu, gainianGuanxin, gainianYuanqi, gainianSidi, gainianBazhengdao, gainianWuyun, gainianKu, duidu, duiduXinjing, duiduJingangjing, duiduAmituojing, jingzang, jingzangSearch, jingzangXinjing, jingzangXinjingFolio, jingzangJingangjing, jingzangFajujing, fugai, fenmu, shenjiao, touming, yuanze, robots, health, aiPolicy] = await Promise.all([
  get("/"),
  get("/wenjing"),
  get("/gainian"),
  get("/gainian/kong"),
  get("/gainian/wuchang"),
  get("/gainian/wuwo"),
  get("/gainian/wuzhu"),
  get("/gainian/guanxin"),
  get("/gainian/yuanqi"),
  get("/gainian/sidi"),
  get("/gainian/bazhengdao"),
  get("/gainian/wuyun"),
  get("/gainian/ku"),
  get("/duidu"),
  get("/duidu/xinjing"),
  get("/duidu/jingangjing"),
  get("/duidu/amituojing"),
  get("/jingzang"),
  get("/jingzang/sousuo?q=%E5%BF%83%E7%BB%8F"),
  get("/jingzang/xinjing"),
  get("/jingzang/xinjing/001-0848c"),
  get("/jingzang/jingangjing"),
  get("/jingzang/fajujing"),
  get("/fugai"),
  get("/fenmu"),
  get("/shenjiao"),
  get("/touming"),
  get("/yuanze"),
  get("/robots.txt"),
  get("/api/health"),
  get("/ai.txt"),
]);
const mergedSitemap = await loadMergedSitemap();
const healthJson = JSON.parse(health.body);
for (const smoke of corpusRuntimeSmokeRoutes) {
  const page = await get(smoke.path, 60_000);
  check(
    page.body.includes("sutra-segment") && !page.body.includes('id="__next_error__"'),
    `${smoke.bucket} 运行时语料桶返回经文正文`,
    `${smoke.bucket} 运行时语料桶未返回经文正文（${smoke.path}）`,
  );
}

const pageExpectations = [
  [
    "/",
    home,
    {
      title: "佛经原典在线阅读与可核验问经",
      description: "foxue.ai 提供每日可核验原典、佛经全文阅读、稳定行段定位与证据问经；完整原文、人工复核范围与建设缺口均公开。",
      bodyIncludes: ["从问题，", "回到原典。", "每条主张可追溯"],
      jsonLd: [["https://www.foxue.ai/#page", "WebPage"]],
    },
  ],
  [
    "/wenjing",
    wenjing,
    {
      title: "证据问经与佛经原典出处对照｜foxue.ai",
      description: "输入佛学问题，在可信原型中查看佛经原典出处、版本边界、平台综合与证据不足提示。",
      bodyIncludes: ["先看证据，再听综合。", "当前问经只回答已登记、可回到稳定原文的受控主题"],
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
      description: "按主题进入苦、四圣谛、八正道、五蕴、缘起、空、无常、无我、无住、观心等受控证据页；先理解边界，再回到原典与问经。",
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
    "/gainian/yuanqi",
    gainianYuanqi,
    {
      title: "缘起｜概念 Hub｜foxue.ai",
      description: "从《杂阿含经》与巴利《相应部》的稳定原典理解缘起、因缘法与此缘性，保留汉巴表达差异并辨清宿命论等误读。",
      bodyIncludes: ["不是宿命", "相近表达可以并读", "每项判断，都有可以重新打开的位置。"],
      jsonLd: [
        ["https://www.foxue.ai/gainian/yuanqi#page", "WebPage"],
        ["https://www.foxue.ai/gainian/yuanqi#term", "DefinedTerm"],
        ["https://www.foxue.ai/gainian/yuanqi#breadcrumb", "BreadcrumbList"],
      ],
    },
  ],
  [
    "/gainian/sidi",
    gainianSidi,
    {
      title: "四圣谛｜概念 Hub｜foxue.ai",
      description: "从《杂阿含经》与巴利《相应部》的稳定原典理解四圣谛：知苦、断集、证灭、修道，并辨清悲观论等常见误读。",
      bodyIncludes: ["不是四句", "知 · 遍知", "每项判断，都有可以重新打开的位置。"],
      jsonLd: [
        ["https://www.foxue.ai/gainian/sidi#page", "WebPage"],
        ["https://www.foxue.ai/gainian/sidi#term", "DefinedTerm"],
        ["https://www.foxue.ai/gainian/sidi#breadcrumb", "BreadcrumbList"],
      ],
    },
  ],
  [
    "/gainian/bazhengdao",
    gainianBazhengdao,
    {
      title: "八正道｜概念 Hub｜foxue.ai",
      description: "从《杂阿含经》《中阿含经》与巴利 SN 45.8 的稳定原典理解八正道、八支关系及正志／正思惟、正方便／正精进等译语边界。",
      bodyIncludes: ["不是八条", "正思惟 · 正志", "每项判断，都有可以重新打开的位置。"],
      jsonLd: [
        ["https://www.foxue.ai/gainian/bazhengdao#page", "WebPage"],
        ["https://www.foxue.ai/gainian/bazhengdao#term", "DefinedTerm"],
        ["https://www.foxue.ai/gainian/bazhengdao#breadcrumb", "BreadcrumbList"],
      ],
    },
  ],
  [
    "/gainian/wuyun",
    gainianWuyun,
    {
      title: "五蕴｜色受想行识原典导读｜foxue.ai",
      description: "从《心经》《佛说五蘊皆空经》与巴利《相应部》理解色、受、想、行、识，辨明五蕴与五取蕴，并回到稳定原典段落。",
      bodyIncludes: ["不是五个", "五蕴与五取蕴", "每项判断，都有可以重新打开的位置。"],
      jsonLd: [
        ["https://www.foxue.ai/gainian/wuyun#page", "WebPage"],
        ["https://www.foxue.ai/gainian/wuyun#term", "DefinedTerm"],
        ["https://www.foxue.ai/gainian/wuyun#breadcrumb", "BreadcrumbList"],
      ],
    },
  ],
  [
    "/gainian/ku",
    gainianKu,
    {
      title: "苦｜dukkha、三苦与第二支箭原典导读｜foxue.ai",
      description: "从《杂阿含经》与巴利《相应部》理解苦谛、三种苦及第二支箭，辨清 dukkha 不等于悲观主义，并回到稳定原典段落。",
      bodyIncludes: ["不是对人生的", "苦苦 · 行苦 · 坏苦", "每项判断，都有可以重新打开的位置。"],
      jsonLd: [
        ["https://www.foxue.ai/gainian/ku#page", "WebPage"],
        ["https://www.foxue.ai/gainian/ku#term", "DefinedTerm"],
        ["https://www.foxue.ai/gainian/ku#breadcrumb", "BreadcrumbList"],
      ],
    },
  ],
  [
    "/duidu",
    duidu,
    {
      title: "佛经异译与跨本对读｜可核验原典书案｜foxue.ai",
      description: "面向佛教徒、佛学爱好者与研究者的佛经对读入口：并读《心经》《金刚经》《阿弥陀经》的已核验文本表达，每一段回到版本与稳定原典坐标。",
      bodyIncludes: ["并读，不是把差异", "三部经，三种诚实的比较方式", "自动逐句对齐：0"],
      jsonLd: [
        ["https://www.foxue.ai/duidu#page", "CollectionPage"],
        ["https://www.foxue.ai/duidu#breadcrumb", "BreadcrumbList"],
        ["https://www.foxue.ai/duidu#dossiers", "ItemList"],
      ],
    },
  ],
  [
    "/duidu/amituojing",
    duiduAmituojing,
    {
      title: "阿弥陀经鸠摩罗什译与玄奘译双译对读｜foxue.ai",
      description: "按七个修学关口对读《佛说阿弥陀经》T0366 与《称赞净土佛摄受经》T0367；每行返回稳定原典坐标，相关段落不等于逐句对齐。",
      bodyIncludes: ["同向净土", "相关不等于对齐", "复制本关口引用"],
      jsonLd: [
        ["https://www.foxue.ai/duidu/amituojing#page", "CollectionPage"],
        ["https://www.foxue.ai/duidu/amituojing#breadcrumb", "BreadcrumbList"],
        ["https://www.foxue.ai/duidu/amituojing#expressions", "ItemList"],
        ["https://www.foxue.ai/duidu/amituojing#loci", "ItemList"],
      ],
    },
  ],
  [
    "/duidu/jingangjing",
    duiduJingangjing,
    {
      title: "金刚经六种汉译与英译主题对读｜foxue.ai",
      description: "按七个关键阅读关口对读《金刚经》六种汉译与 Gemmell 1912 英译；每段返回稳定原典坐标，主题同现不等于逐句对齐。",
      bodyIncludes: ["不是把诸译", "关系不冒充对齐", "自动对齐"],
      jsonLd: [
        ["https://www.foxue.ai/duidu/jingangjing#page", "CollectionPage"],
        ["https://www.foxue.ai/duidu/jingangjing#breadcrumb", "BreadcrumbList"],
        ["https://www.foxue.ai/duidu/jingangjing#expressions", "ItemList"],
        ["https://www.foxue.ai/duidu/jingangjing#loci", "ItemList"],
      ],
    },
  ],
  [
    "/duidu/xinjing",
    duiduXinjing,
    {
      title: "心经七种汉译异译对读｜foxue.ai",
      description: "并排阅读《心经》七种已审核汉译表达；每个行段回到各自 CBETA 原典坐标，明确同作品关系不等于逐句对齐。",
      bodyIncludes: ["七译同题", "并排不是对齐", "自动对齐"],
      jsonLd: [
        ["https://www.foxue.ai/duidu/xinjing#page", "CollectionPage"],
        ["https://www.foxue.ai/duidu/xinjing#breadcrumb", "BreadcrumbList"],
        ["https://www.foxue.ai/duidu/xinjing#expressions", "ItemList"],
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
      bodyIncludes: ["觀自在菩薩", "色不異空", "先读原文"],
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

const homeReleaseCommit = home.response.headers.get("x-foxue-source-commit");
const homeReleaseRef = home.response.headers.get("x-foxue-source-ref");
const homeReleaseDeployId = home.response.headers.get("x-foxue-deploy-id");
const homeReleaseEnv = home.response.headers.get("x-foxue-deploy-env");
const healthRelease = healthJson.release ?? {};

check(health.response.headers.get("x-robots-tag") === "noindex, nofollow", "/api/health 已声明 noindex", "/api/health 缺少 noindex, nofollow");
check(aiPolicy.response.ok, "/ai.txt 可访问", `/ai.txt 不可访问（HTTP ${aiPolicy.response.status}）`);
check(
  aiPolicy.body.includes(expectedSiteOrigin) && !aiPolicy.body.includes("https://foxue.ai"),
  "/ai.txt 使用 canonical 主域",
  "/ai.txt 未使用 canonical 主域或仍包含 apex 主域",
);
check(
  aiPolicy.body.includes("Disallowed:") &&
    aiPolicy.body.includes("Trust principles:") &&
    aiPolicy.body.includes("Not granted by this file:") &&
    aiPolicy.body.includes("source-level rights") &&
    !aiPolicy.body.includes("Use in AI training datasets for preserving and improving access to Buddhist textual heritage."),
  "/ai.txt 公开 AI 使用边界、原则入口与训练权利约束",
  "/ai.txt 缺少 AI 使用边界、原则入口或训练权利约束",
);
check(healthRelease.provenanceSource !== "unavailable", "/api/health 提供发布指纹来源", "/api/health 缺少可用发布指纹来源");
check(
  /^[0-9a-f]{7,40}$/i.test(healthRelease.sourceCommitSha ?? ""),
  "/api/health 提供 source commit SHA",
  `/api/health source commit SHA 缺失或非法（实际 ${healthRelease.sourceCommitSha ?? "缺失"}）`,
);
check(
  typeof healthRelease.sourceCommitRef === "string" && healthRelease.sourceCommitRef.length > 0,
  "/api/health 提供 source commit ref",
  `/api/health source commit ref 缺失（实际 ${healthRelease.sourceCommitRef ?? "缺失"}）`,
);
check(
  homeReleaseCommit === healthRelease.sourceCommitSha,
  "首页响应头与 /api/health 的 source commit SHA 一致",
  `首页响应头 source commit 与 /api/health 不一致（header ${homeReleaseCommit ?? "缺失"}，health ${healthRelease.sourceCommitSha ?? "缺失"}）`,
);
check(
  homeReleaseRef === healthRelease.sourceCommitRef,
  "首页响应头与 /api/health 的 source commit ref 一致",
  `首页响应头 source ref 与 /api/health 不一致（header ${homeReleaseRef ?? "缺失"}，health ${healthRelease.sourceCommitRef ?? "缺失"}）`,
);
if (healthRelease.deploymentId) {
  check(
    homeReleaseDeployId === healthRelease.deploymentId,
    "首页响应头与 /api/health 的 deployment id 一致",
    `首页响应头 deployment id 与 /api/health 不一致（header ${homeReleaseDeployId ?? "缺失"}，health ${healthRelease.deploymentId}）`,
  );
}
check(
  typeof homeReleaseEnv === "string" && homeReleaseEnv.length > 0,
  "首页响应头提供部署环境标记",
  "首页响应头缺少部署环境标记",
);

if (expectedSourceCommitSha) {
  check(
    healthRelease.sourceCommitSha === expectedSourceCommitSha,
    `/api/health source commit SHA 与期望部署一致（${expectedSourceCommitSha}）`,
    `/api/health source commit SHA 与期望部署不一致（期望 ${expectedSourceCommitSha}，实际 ${healthRelease.sourceCommitSha ?? "缺失"}）`,
  );
  check(
    homeReleaseCommit === expectedSourceCommitSha,
    `首页响应头 source commit SHA 与期望部署一致（${expectedSourceCommitSha}）`,
    `首页响应头 source commit SHA 与期望部署不一致（期望 ${expectedSourceCommitSha}，实际 ${homeReleaseCommit ?? "缺失"}）`,
  );
}

if (expectedSourceCommitRef) {
  check(
    normalizeCommitRef(healthRelease.sourceCommitRef) === expectedSourceCommitRef,
    `/api/health source commit ref 与期望部署一致（${expectedSourceCommitRef}）`,
    `/api/health source commit ref 与期望部署不一致（期望 ${expectedSourceCommitRef}，实际 ${healthRelease.sourceCommitRef ?? "缺失"}）`,
  );
  check(
    normalizeCommitRef(homeReleaseRef) === expectedSourceCommitRef,
    `首页响应头 source commit ref 与期望部署一致（${expectedSourceCommitRef}）`,
    `首页响应头 source commit ref 与期望部署不一致（期望 ${expectedSourceCommitRef}，实际 ${homeReleaseRef ?? "缺失"}）`,
  );
}

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

const xinjingWork = extractJsonLdItems(jingzangXinjing.body).find((item) => item["@id"] === "https://www.foxue.ai/jingzang/xinjing#work");
check(!xinjingWork?.author, "/jingzang/xinjing JSON-LD 不以 CBETA 为作者", "/jingzang/xinjing JSON-LD 仍把 CBETA 标成 author");
check(
  typeof xinjingWork?.translator?.name === "string" && xinjingWork.translator.name.includes("玄奘"),
  "/jingzang/xinjing JSON-LD 以玄奘为译者",
  "/jingzang/xinjing JSON-LD 缺少历史译者",
);
const xinjingExpressions = extractJsonLdItems(duiduXinjing.body).find(
  (item) => item["@id"] === "https://www.foxue.ai/duidu/xinjing#expressions",
);
const duiduDossiers = extractJsonLdItems(duidu.body).find(
  (item) => item["@id"] === "https://www.foxue.ai/duidu#dossiers",
);
check(
  duiduDossiers?.numberOfItems === 3 && duiduDossiers.itemListElement?.length === 3,
  "/duidu JSON-LD 完整列出三份已核验对读书案",
  "/duidu JSON-LD 未完整列出三份已核验对读书案",
);
check(
  xinjingExpressions?.numberOfItems === 7 && xinjingExpressions.itemListElement?.length === 7,
  "/duidu/xinjing JSON-LD 完整列出七种文本表达",
  "/duidu/xinjing JSON-LD 未完整列出七种文本表达",
);
const jingangItems = extractJsonLdItems(duiduJingangjing.body);
const amituojingItems = extractJsonLdItems(duiduAmituojing.body);
const amituojingExpressions = amituojingItems.find(
  (item) => item["@id"] === "https://www.foxue.ai/duidu/amituojing#expressions",
);
const amituojingLoci = amituojingItems.find(
  (item) => item["@id"] === "https://www.foxue.ai/duidu/amituojing#loci",
);
check(
  amituojingExpressions?.numberOfItems === 2 && amituojingExpressions.itemListElement?.length === 2,
  "/duidu/amituojing JSON-LD 完整列出两种古汉译表达",
  "/duidu/amituojing JSON-LD 未完整列出两种古汉译表达",
);
check(
  amituojingLoci?.numberOfItems === 7 && amituojingLoci.itemListElement?.length === 7,
  "/duidu/amituojing JSON-LD 完整列出七个修学关口",
  "/duidu/amituojing JSON-LD 未完整列出七个修学关口",
);
const jingangExpressions = jingangItems.find(
  (item) => item["@id"] === "https://www.foxue.ai/duidu/jingangjing#expressions",
);
const jingangLoci = jingangItems.find(
  (item) => item["@id"] === "https://www.foxue.ai/duidu/jingangjing#loci",
);
check(
  jingangExpressions?.numberOfItems === 7 && jingangExpressions.itemListElement?.length === 7,
  "/duidu/jingangjing JSON-LD 完整列出七种文本表达",
  "/duidu/jingangjing JSON-LD 未完整列出七种文本表达",
);
check(
  jingangLoci?.numberOfItems === 7 && jingangLoci.itemListElement?.length === 7,
  "/duidu/jingangjing JSON-LD 完整列出七个阅读关口",
  "/duidu/jingangjing JSON-LD 未完整列出七个阅读关口",
);
check(jingzangJingangjing.body.includes("如是我聞"), "/jingzang/jingangjing 可见如是我聞", "/jingzang/jingangjing 缺少如是我聞");
check(jingzangFajujing.body.includes("諸惡莫作"), "/jingzang/fajujing 可见诸恶莫作", "/jingzang/fajujing 缺少诸恶莫作");

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

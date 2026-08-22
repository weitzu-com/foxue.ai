import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { corpusRuntimeSmokeRoutes } from "./corpus-runtime-smoke-routes.mjs";
import { rewriteCatalogFolioPath } from "../src/lib/corpus-folio-proxy.mjs";

const root = process.cwd();
const failures = [];

function fail(message) {
  failures.push(message);
}

function requireNoImport(source, fileLabel, forbidden) {
  for (const pattern of forbidden) {
    if (pattern.test(source)) {
      fail(`${fileLabel} 不得导入会在运行时打开语料母版的模块`);
    }
  }
}

const [
  sitemapData,
  llmsSource,
  folioStub,
  workIndexPage,
  folioModule,
  proxySource,
  nextConfig,
  routing,
  tracing,
  folioIndex,
] = await Promise.all([
  readFile(resolve(root, "src/lib/sitemap-data.ts"), "utf8"),
  readFile(resolve(root, "src/lib/llms.ts"), "utf8"),
  readFile(resolve(root, "src/app/jingzang/[slug]/[folio]/page.tsx"), "utf8"),
  readFile(resolve(root, "src/app/jingzang/[slug]/page.tsx"), "utf8"),
  readFile(resolve(root, "src/app/jingzang/_folio/page-module.tsx"), "utf8"),
  readFile(resolve(root, "src/proxy.ts"), "utf8"),
  readFile(resolve(root, "next.config.ts"), "utf8"),
  readFile(resolve(root, "src/data/corpus-runtime-routing.generated.json"), "utf8").then(JSON.parse),
  readFile(resolve(root, "src/data/corpus-runtime-tracing.generated.json"), "utf8").then(JSON.parse),
  readFile(resolve(root, "src/data/corpus-folio-index.generated.json"), "utf8").then(JSON.parse),
]);

requireNoImport(sitemapData, "src/lib/sitemap-data.ts", [/corpus-reading/]);
requireNoImport(llmsSource, "src/lib/llms.ts", [/corpus-reading/, /getSutraReading/]);
requireNoImport(folioStub, "src/app/jingzang/[slug]/[folio]/page.tsx", [/corpus-reading/, /getSutraReading/, /getSutraFolio/]);
requireNoImport(workIndexPage, "src/app/jingzang/[slug]/page.tsx", [/corpus-reading/, /getSutraReading/]);
requireNoImport(nextConfig, "next.config.ts", [/corpusRuntimeRouting/, /async rewrites\(/, /slugToBucket/]);

if (!proxySource.includes("rewriteCatalogFolioPath")) {
  fail("src/proxy.ts 必须把目录版页改写到分桶运行时，而不能再打开未分桶 folio 路由");
}
if (!proxySource.includes(":folio.rsc")) {
  fail("src/proxy.ts 必须匹配 RSC 版页请求");
}

if (!/notFound\(\)/.test(folioStub)) {
  fail("未分桶的 /jingzang/[slug]/[folio] 路由必须 notFound，而不能再读取语料母版");
}
if (!folioModule.includes("CorpusAssetMissingError")) {
  fail("分桶版页模块必须把缺失语料资产收成 notFound，而不是 ENOENT 500");
}

const slugToBucket = routing.slugToBucket;
const routingSlugs = Object.keys(slugToBucket);
const indexSlugs = Object.keys(folioIndex.works ?? {});
if (folioIndex.schema !== "https://foxue.ai/schemas/corpus-folio-index-v0.1") {
  fail("版页索引 schema 不正确");
}
if (folioIndex.totalWorks !== routingSlugs.length || folioIndex.totalWorks !== indexSlugs.length) {
  fail(`版页索引文本数 ${folioIndex.totalWorks} 与运行时分桶 ${routingSlugs.length} 不一致`);
}
if (folioIndex.totalFolios !== indexSlugs.reduce((sum, slug) => sum + folioIndex.works[slug].navigation.length, 0)) {
  fail("版页索引的 totalFolios 与导航条目不一致");
}

for (const slug of routingSlugs) {
  const work = folioIndex.works[slug];
  if (!work) {
    fail(`运行时分桶 slug 缺少版页索引：${slug}`);
    continue;
  }
  if (!Array.isArray(work.navigation) || work.navigation.length < 1) {
    fail(`${slug} 的版页索引没有导航`);
  }
  if (!Number.isSafeInteger(work.segmentCount) || work.segmentCount < 1) {
    fail(`${slug} 的版页索引缺少稳定段落数`);
  }
}

for (const slug of indexSlugs) {
  if (!slugToBucket[slug]) fail(`版页索引 slug 缺少运行时分桶：${slug}`);
}

for (const smoke of corpusRuntimeSmokeRoutes) {
  const match = smoke.path.match(/^\/jingzang\/([^/]+)\/([^/]+)$/);
  if (!match) {
    fail(`抽样路由无法解析：${smoke.path}`);
    continue;
  }
  const [, slug, folio] = match;
  if (slugToBucket[slug] !== smoke.bucket) {
    fail(`抽样路由分桶不一致：${smoke.path}`);
  }
  const keys = folioIndex.works[slug]?.navigation.map((item) => item.key) ?? [];
  if (!keys.includes(folio)) {
    fail(`抽样版页不在索引中：${smoke.path}`);
  }
}

const bucketIds = new Set(tracing.buckets.map((bucket) => bucket.id));
for (const slug of routingSlugs) {
  if (!bucketIds.has(slugToBucket[slug])) {
    fail(`${slug} 指向不存在的运行时桶 ${slugToBucket[slug]}`);
  }
}

const incidentRoutes = [
  { bucket: "cb09", path: "/jingzang/zengyiahanjing/001-0549a" },
  { bucket: "cb01", path: "/jingzang/dasheng-ru-lengqiejing/001-0587a" },
  { bucket: "cb09", path: "/jingzang/xinjing/001-0848c" },
  { bucket: "cb01", path: "/jingzang/jingangjing/001-0748c" },
  { bucket: "cb09", path: "/jingzang/weimojiejing/001-0537a" },
  { bucket: "cb01", path: "/jingzang/changahanjing/001-0001a" },
  { bucket: "cb09", path: "/jingzang/zaahanjing/001-0001a" },
  { bucket: "sc01", path: "/jingzang/dhammapada-pali/001-dhp1-20" },
  { bucket: "dg01", path: "/jingzang/derge-kangyur-d0008/021-0279b" },
];

for (const incident of [...corpusRuntimeSmokeRoutes, ...incidentRoutes]) {
  const match = incident.path.match(/^\/jingzang\/([^/]+)\/([^/]+)$/);
  if (!match) {
    fail(`事故复现路由无法解析：${incident.path}`);
    continue;
  }
  const [, slug, folio] = match;
  if (slugToBucket[slug] !== incident.bucket) {
    fail(`事故复现路由分桶不一致：${incident.path}`);
  }
  const keys = folioIndex.works[slug]?.navigation.map((item) => item.key) ?? [];
  if (!keys.includes(folio)) {
    fail(`事故复现版页不在索引中：${incident.path}`);
  }
  const rewritten = rewriteCatalogFolioPath(incident.path, slugToBucket);
  const rewrittenRsc = rewriteCatalogFolioPath(`${incident.path}.rsc`, slugToBucket);
  if (rewritten !== `/corpus-runtime/${incident.bucket}/${slug}/${folio}`) {
    fail(`版页 Proxy 改写错误：${incident.path} → ${rewritten}`);
  }
  if (rewrittenRsc !== `/corpus-runtime/${incident.bucket}/${slug}/${folio}.rsc`) {
    fail(`RSC Proxy 必须保留 .rsc 后缀：${incident.path}.rsc → ${rewrittenRsc}`);
  }
}

if (rewriteCatalogFolioPath("/sitemap-index.xml", slugToBucket) !== null) {
  fail("Proxy 不得改写 sitemap");
}
if (rewriteCatalogFolioPath("/jingzang/xinjing", slugToBucket) !== null) {
  fail("Proxy 不得改写文本目录页");
}

if (failures.length > 0) {
  for (const failure of failures) console.error(`✗ ${failure}`);
  process.exitCode = 1;
} else {
  console.log(
    `✓ 版页运行时门禁通过：${folioIndex.totalWorks} 个文本表达、${folioIndex.totalFolios} 个版页均有分桶，sitemap/目录/未分桶版页不再打开语料母版`,
  );
}

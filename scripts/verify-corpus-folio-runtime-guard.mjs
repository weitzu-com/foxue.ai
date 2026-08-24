import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { performance } from "node:perf_hooks";
import { corpusRuntimeSmokeRoutes } from "./corpus-runtime-smoke-routes.mjs";
import { rewriteCatalogFolioPath } from "../src/lib/corpus-folio-proxy.mjs";
import {
  folioLocatorLedgerSchema,
  folioLocatorMaxSliceBytes,
} from "../src/lib/corpus-folio-locator-paths.mjs";
import { parseCbetaFolioSlice } from "../src/lib/cbeta-tei.mjs";

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
  sitemapIndexRoute,
  llmsSource,
  folioStub,
  workIndexPage,
  folioModule,
  folioReading,
  folioLocatorModule,
  proxySource,
  nextConfig,
  routing,
  tracing,
  folioIndex,
  workLedger,
  folioLocatorLedger,
] = await Promise.all([
  readFile(resolve(root, "src/lib/sitemap-data.ts"), "utf8"),
  readFile(resolve(root, "src/app/sitemap-index.xml/route.ts"), "utf8"),
  readFile(resolve(root, "src/lib/llms.ts"), "utf8"),
  readFile(resolve(root, "src/app/jingzang/[slug]/[folio]/page.tsx"), "utf8"),
  readFile(resolve(root, "src/app/jingzang/[slug]/page.tsx"), "utf8"),
  readFile(resolve(root, "src/app/jingzang/_folio/page-module.tsx"), "utf8"),
  readFile(resolve(root, "src/lib/corpus-reading.ts"), "utf8"),
  readFile(resolve(root, "src/lib/corpus-folio-locator.ts"), "utf8"),
  readFile(resolve(root, "src/proxy.ts"), "utf8"),
  readFile(resolve(root, "next.config.ts"), "utf8"),
  readFile(resolve(root, "src/data/corpus-runtime-routing.generated.json"), "utf8").then(JSON.parse),
  readFile(resolve(root, "src/data/corpus-runtime-tracing.generated.json"), "utf8").then(JSON.parse),
  readFile(resolve(root, "src/data/corpus-folio-index.generated.json"), "utf8").then(JSON.parse),
  readFile(resolve(root, "src/data/corpus-work-ledger.generated.json"), "utf8").then(JSON.parse),
  readFile(resolve(root, "src/data/corpus-folio-locator-ledger.generated.json"), "utf8").then(JSON.parse),
]);

requireNoImport(sitemapData, "src/lib/sitemap-data.ts", [/corpus-reading/, /corpus-folio-index/, /getSutraReading/, /getSitemapEntries/]);
requireNoImport(sitemapIndexRoute, "src/app/sitemap-index.xml/route.ts", [/corpus-reading/, /corpus-folio-index/, /sitemap-data/, /getSitemapEntries/]);
if (!/export const dynamic = "force-static"/.test(sitemapIndexRoute)) {
  fail("sitemap-index 必须 force-static，不能在请求时物化全量 URL");
}
requireNoImport(llmsSource, "src/lib/llms.ts", [/corpus-reading/, /getSutraReading/, /getSitemapEntries/, /corpus-folio-index/]);
requireNoImport(folioStub, "src/app/jingzang/[slug]/[folio]/page.tsx", [/corpus-reading/, /getSutraReading/, /getSutraFolio/]);
requireNoImport(workIndexPage, "src/app/jingzang/[slug]/page.tsx", [/corpus-reading/, /getSutraReading/, /corpus-folio-index\.generated/, /corpus-folio-locator/]);
requireNoImport(nextConfig, "next.config.ts", [/corpusRuntimeRouting/, /async rewrites\(/, /slugToBucket/]);
requireNoImport(sitemapData, "src/lib/sitemap-data.ts", [/corpus-folio-locator/]);
requireNoImport(llmsSource, "src/lib/llms.ts", [/corpus-folio-locator/]);
requireNoImport(folioLocatorModule, "src/lib/corpus-folio-locator.ts", [/corpus-reading/, /getSutraReading/, /cbeta-tei/, /derge-reading/]);

if (!/getSutraCatalogView/.test(folioReading)) {
  fail("版页读取必须从经目分片取导航，而不能再整本解析 TEI");
}
if (!/getFolioLocator/.test(folioReading) || !/readControlledCorpusAssetRange/.test(folioReading)) {
  fail("版页读取必须按定位账本切开一个版页，而不能打开全本");
}
if (!/肥胖母版，禁止在请求时整本解析/.test(folioReading)) {
  fail("肥胖母版必须拒绝 loadCompleteReading");
}
if (/const completeReading = await loadCompleteReading\(sutra\.slug\)/.test(folioReading)) {
  fail("getSutraReading 不得再 loadCompleteReading 整本母版");
}
if (!/folioLocatorGlobs[\s\S]*corpus-folio-locator-chunks\/\*\.json[\s\S]*corpusRuntimeIncludes/.test(nextConfig)
  && !/folioLocatorGlobs[\s\S]*corpus-runtime/.test(nextConfig)) {
  fail("分桶运行时必须把版页定位账本和经目分片打进 trace");
}
if (!nextConfig.includes("folioLocatorGlobs")) {
  fail("next.config 必须把 folioLocatorGlobs 打进 corpus-runtime 分桶");
}

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

if (folioLocatorLedger.schema !== folioLocatorLedgerSchema) fail("版页定位账本 schema 不正确");
if (folioLocatorLedger.workCount !== Object.keys(folioLocatorLedger.slugToShard ?? {}).length) {
  fail("版页定位账本 slugToShard 覆盖不完整");
}
if (folioLocatorLedger.workCount < 2) fail("版页定位账本至少应覆盖两个肥胖文本");
if (folioLocatorLedger.folioCount < 10_000) fail("版页定位账本版页数过少，大般若等肥胖母版可能未被切开");
if (workLedger.workCount !== folioIndex.totalWorks) fail("经目账本文本数与版页索引不一致");

const requiredLocatedFolios = [
  { slug: "daboruo-jing", key: "001-0001a", firstId: "T0220.001.0001a02" },
  { slug: "daboruo-jing", key: "304-0552c", firstId: "T0220.304.0552c01" },
  { slug: "zengyiahanjing", key: "001-0549a" },
  { slug: "derge-kangyur-d0008", key: "021-0279b" },
  { slug: "dhammapada-pali", key: "001-dhp1-20" },
];

for (const required of requiredLocatedFolios) {
  if (!Number.isSafeInteger(folioLocatorLedger.slugToShard[required.slug])) {
    fail(`肥胖母版缺少定位账本：${required.slug}`);
  }
}

const unknownStarted = performance.now();
const unknownHit = folioLocatorLedger.slugToShard["not-a-real-slug"];
const unknownElapsedMs = performance.now() - unknownStarted;
if (unknownHit !== undefined) fail("定位账本不得收录不存在的 slug");
if (unknownElapsedMs > 10) {
  fail(`未知文本 slug 查找耗时 ${unknownElapsedMs.toFixed(1)}ms，必须只读账本`);
}

let daboruoSliceMs = 0;
const daboruoShardId = folioLocatorLedger.slugToShard["daboruo-jing"];
if (Number.isSafeInteger(daboruoShardId)) {
  const shard = JSON.parse(
    await readFile(resolve(root, `src/data/corpus-folio-locator-chunks/${daboruoShardId}.json`), "utf8"),
  );
  const work = shard.works?.["daboruo-jing"];
  const unknownFolioStarted = performance.now();
  const unknownFolio = work?.folios?.["not-a-real-folio"];
  const unknownFolioMs = performance.now() - unknownFolioStarted;
  if (unknownFolio) fail("大般若定位分片不得收录不存在的版页");
  if (unknownFolioMs > 10) {
    fail(`未知大般若版页查找耗时 ${unknownFolioMs.toFixed(1)}ms，必须只读分片`);
  }

  const sliceStarted = performance.now();
  for (const required of requiredLocatedFolios.filter((item) => item.slug === "daboruo-jing")) {
    const tuple = work?.folios?.[required.key];
    if (!tuple) {
      fail(`大般若缺少定位：${required.key}`);
      continue;
    }
    const [partIndex, start, end] = tuple;
    const partPath = work.parts?.[partIndex];
    if (!partPath) {
      fail(`大般若 ${required.key} 缺少来源分片`);
      continue;
    }
    if (end - start > folioLocatorMaxSliceBytes) {
      fail(`大般若 ${required.key} 切片 ${end - start} 字节，仍然过胖`);
    }
    if (end - start > 20_000) {
      fail(`大般若 ${required.key} 切片 ${end - start} 字节，必须是单页而不是整卷或整部`);
    }
    const bytes = Buffer.from(await readFile(resolve(root, "data/corpus", partPath)));
    const xml = bytes.subarray(start, end).toString("utf8");
    const juan = required.key.slice(0, 3);
    const segments = parseCbetaFolioSlice(xml, { canonId: "T0220", juan });
    if (segments[0]?.id !== required.firstId) {
      fail(`大般若 ${required.key} 切片首段应为 ${required.firstId}，实际 ${segments[0]?.id}`);
    }
    if (work.parts.length < 2) fail("大般若定位必须保留 15 个来源分片路径，但一次只读一个");
    const otherParts = work.parts.filter((_, index) => index !== partIndex);
    if (otherParts.length !== work.parts.length - 1) fail("大般若一次必须只打开一个来源分片");
  }
  daboruoSliceMs = performance.now() - sliceStarted;
  if (daboruoSliceMs > 250) {
    fail(`大般若首尾版页切片解析耗时 ${daboruoSliceMs.toFixed(1)}ms，必须避开整本 TEI`);
  }
}

if (failures.length > 0) {
  for (const failure of failures) console.error(`✗ ${failure}`);
  process.exitCode = 1;
} else {
  console.log(
    `✓ 版页运行时门禁通过：${folioIndex.totalWorks} 个文本表达、${folioIndex.totalFolios} 个版页均有分桶；${folioLocatorLedger.workCount} 个肥胖文本 / ${folioLocatorLedger.folioCount} 个版页按切片读取（大般若切片 ${daboruoSliceMs.toFixed(1)}ms），sitemap/目录/未分桶版页不再打开语料母版`,
  );
}

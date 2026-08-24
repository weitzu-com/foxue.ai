import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { performance } from "node:perf_hooks";
import { corpusRuntimeSmokeRoutes } from "./corpus-runtime-smoke-routes.mjs";
import { rewriteCatalogFolioPath } from "../src/lib/corpus-folio-proxy.mjs";
import {
  folioLocatorLedgerSchema,
  folioLocatorMaxSliceBytes,
} from "../src/lib/corpus-folio-locator-paths.mjs";
import { parseCbetaFolioSlice } from "../src/lib/cbeta-tei-folio.mjs";

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
  folioLocatorLoaders,
  workCatalogLoaders,
  workCatalogNft,
  jsonShard,
  proxySource,
  nextConfig,
  routing,
  tracing,
  folioIndex,
  workLedger,
  folioLocatorLedger,
  bucketFolioPage,
  bucketFolioNft,
] = await Promise.all([
  readFile(resolve(root, "src/lib/sitemap-data.ts"), "utf8"),
  readFile(resolve(root, "src/app/sitemap-index.xml/route.ts"), "utf8"),
  readFile(resolve(root, "src/lib/llms.ts"), "utf8"),
  readFile(resolve(root, "src/app/jingzang/[slug]/[folio]/page.tsx"), "utf8"),
  readFile(resolve(root, "src/app/jingzang/[slug]/page.tsx"), "utf8"),
  readFile(resolve(root, "src/app/jingzang/_folio/page-module.tsx"), "utf8"),
  readFile(resolve(root, "src/lib/corpus-reading.ts"), "utf8"),
  readFile(resolve(root, "src/lib/corpus-folio-locator.ts"), "utf8"),
  readFile(resolve(root, "src/lib/corpus-folio-locator-loaders.ts"), "utf8"),
  readFile(resolve(root, "src/lib/corpus-work-catalog-loaders.ts"), "utf8"),
  readFile(resolve(root, "src/lib/corpus-work-catalog-nft.generated.ts"), "utf8"),
  readFile(resolve(root, "src/lib/corpus-json-shard.mjs"), "utf8"),
  readFile(resolve(root, "src/proxy.ts"), "utf8"),
  readFile(resolve(root, "next.config.ts"), "utf8"),
  readFile(resolve(root, "src/data/corpus-runtime-routing.generated.json"), "utf8").then(JSON.parse),
  readFile(resolve(root, "src/data/corpus-runtime-tracing.generated.json"), "utf8").then(JSON.parse),
  readFile(resolve(root, "src/data/corpus-folio-index.generated.json"), "utf8").then(JSON.parse),
  readFile(resolve(root, "src/data/corpus-work-ledger.generated.json"), "utf8").then(JSON.parse),
  readFile(resolve(root, "src/data/corpus-folio-locator-ledger.generated.json"), "utf8").then(JSON.parse),
  readFile(resolve(root, "src/app/corpus-runtime/cb02/[slug]/[folio]/page.tsx"), "utf8"),
  readFile(resolve(root, "src/app/corpus-runtime/cb02/[slug]/[folio]/nft-json.ts"), "utf8"),
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
requireNoImport(sitemapData, "src/lib/sitemap-data.ts", [/corpus-folio-locator/, /corpus-json-shard/, /corpus-work-catalog-nft/]);
requireNoImport(llmsSource, "src/lib/llms.ts", [/corpus-folio-locator/, /corpus-json-shard/, /corpus-work-catalog-nft/]);
requireNoImport(workIndexPage, "src/app/jingzang/[slug]/page.tsx", [/corpus-json-shard/, /corpus-folio-locator/]);
requireNoImport(folioLocatorModule, "src/lib/corpus-folio-locator.ts", [/corpus-reading/, /getSutraReading/, /cbeta-tei/, /derge-reading/]);
requireNoImport(folioModule, "src/app/jingzang/_folio/page-module.tsx", [/corpus-work-catalog-nft/]);

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
if (!/bucket\.includeGlobs\.map/.test(nextConfig)) {
  fail("next.config 必须按桶 includeGlobs 追踪，而不能把全部经目/定位分片打进每个函数");
}
if (/corpus-folio-locator-chunks\/\*\.json/.test(nextConfig) || /folioLocatorGlobs/.test(nextConfig)) {
  fail("next.config 不得用 locator-chunks/*.json 把全部定位分片打进 corpus-runtime");
}
if (!/readRegisteredJsonFile/.test(folioLocatorLoaders) || !/readRegisteredJsonFile/.test(workCatalogLoaders)) {
  fail("经目/定位分片必须按登记路径惰性 readFile，而不能 switch-import 全量分片");
}
if (!/corpus-shard-paths\.generated/.test(folioLocatorLoaders) || !/corpus-shard-paths\.generated/.test(workCatalogLoaders)) {
  fail("分片路径必须来自生成清单，而不能在源码里用 id 拼出 *.json 通配");
}
if (/import\("@\/data\/corpus-(?:folio-locator|work-catalog)-chunks/.test(folioLocatorLoaders)
  || /import\("@\/data\/corpus-(?:folio-locator|work-catalog)-chunks/.test(workCatalogLoaders)) {
  fail("经目/定位加载器不得静态 import 分片 JSON");
}
if (!jsonShard.includes("readFile") || !jsonShard.includes("src/data/")) {
  fail("分片读取必须走受控 readFile，以便 NFT 只包含 includeGlobs 列出的文件");
}
if (/\$\{id\}\.json/.test(jsonShard) || /relativeDir/.test(jsonShard)) {
  fail("分片 readFile 不得用动态目录或 `${id}.json` 通配，否则会把全库 JSON 扫进 NFT");
}
if (!/loadWorkCatalogShardForTrace/.test(workIndexPage) || !/corpus-work-catalog-nft\.generated/.test(workIndexPage)) {
  fail("经目页必须字面 import() 经目分片做 NFT 追踪；force-static 页不会套用 outputFileTracingIncludes");
}
if (!/includeCorpusBucketJson/.test(bucketFolioPage) || !/nft-json/.test(bucketFolioPage)) {
  fail("分桶版页必须字面 import() 本桶经目/定位分片，而不能只靠 includeGlobs");
}
if (/corpus-work-catalog-nft/.test(folioModule) || /corpus-work-catalog-nft/.test(folioReading) || /corpus-work-catalog-nft/.test(bucketFolioPage)) {
  fail("版页读取不得导入全量经目 NFT 加载器，否则每个语料桶会装上 21MB 经目分片");
}
if (!/import\("@\/data\/corpus-work-catalog-chunks\/0\.json"\)/.test(workCatalogNft)) {
  fail("经目 NFT 加载器必须对每个分片做字面 import()，与 sitemap 分片同一套追踪");
}
if ((workCatalogNft.match(/corpus-work-catalog-chunks\/\d+\.json/g) ?? []).length !== workLedger.shardCount) {
  fail("经目 NFT 加载器分片数必须与账本 shardCount 一致");
}
if (!/corpus-folio-locator-chunks\/0\.json/.test(bucketFolioNft) || !/corpus-work-catalog-chunks\/1\.json/.test(bucketFolioNft)) {
  fail("cb02 JSON NFT 必须追踪大般若定位分片 0 与经目分片 1");
}
if ((bucketFolioNft.match(/corpus-work-catalog-chunks\/\d+\.json/g) ?? []).length !== 1) {
  fail("cb02 不得把其他文本的经目分片打进 304-0552c 的函数");
}

if (!proxySource.includes("rewriteCatalogFolioPath")) {
  fail("src/proxy.ts 必须把目录版页改写到分桶运行时，而不能再打开未分桶 folio 路由");
}
if (!proxySource.includes("corpusRuntimeRouting")) {
  fail("src/proxy.ts 必须把完整 routing（含按卷拆分）交给改写函数");
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
  const rewritten = rewriteCatalogFolioPath(smoke.path, routing);
  if (rewritten !== `/corpus-runtime/${smoke.bucket}/${slug}/${folio}`) {
    fail(`抽样路由分桶不一致：${smoke.path} → ${rewritten}`);
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

const incidentPaths = [
  "/jingzang/zengyiahanjing/001-0549a",
  "/jingzang/dasheng-ru-lengqiejing/001-0587a",
  "/jingzang/xinjing/001-0848c",
  "/jingzang/jingangjing/001-0748c",
  "/jingzang/weimojiejing/001-0537a",
  "/jingzang/changahanjing/001-0001a",
  "/jingzang/zaahanjing/001-0001a",
  "/jingzang/dhammapada-pali/001-dhp1-20",
  "/jingzang/derge-kangyur-d0008/021-0279b",
  "/jingzang/daboruo-jing/001-0001a",
  "/jingzang/daboruo-jing/304-0552c",
];

for (const path of [...corpusRuntimeSmokeRoutes.map((item) => item.path), ...incidentPaths]) {
  const match = path.match(/^\/jingzang\/([^/]+)\/([^/]+)$/);
  if (!match) {
    fail(`事故复现路由无法解析：${path}`);
    continue;
  }
  const [, slug, folio] = match;
  const keys = folioIndex.works[slug]?.navigation.map((item) => item.key) ?? [];
  if (!keys.includes(folio)) {
    fail(`事故复现版页不在索引中：${path}`);
  }
  const rewritten = rewriteCatalogFolioPath(path, routing);
  const rewrittenRsc = rewriteCatalogFolioPath(`${path}.rsc`, routing);
  if (!rewritten?.startsWith("/corpus-runtime/") || !bucketIds.has(rewritten.split("/")[2])) {
    fail(`版页 Proxy 改写错误：${path} → ${rewritten}`);
  }
  if (rewrittenRsc !== `/corpus-runtime/${rewritten.split("/")[2]}/${slug}/${folio}.rsc`) {
    fail(`RSC Proxy 必须保留 .rsc 后缀：${path}.rsc → ${rewrittenRsc}`);
  }
}

if (rewriteCatalogFolioPath("/sitemap-index.xml", routing) !== null) {
  fail("Proxy 不得改写 sitemap");
}
if (rewriteCatalogFolioPath("/jingzang/xinjing", routing) !== null) {
  fail("Proxy 不得改写文本目录页");
}

const daboruoEarly = rewriteCatalogFolioPath("/jingzang/daboruo-jing/001-0001a", routing);
const daboruoLate = rewriteCatalogFolioPath("/jingzang/daboruo-jing/304-0552c", routing);
if (!daboruoEarly || !daboruoLate) {
  fail("大般若首尾版页必须改写到分桶运行时");
} else {
  const earlyBucketId = daboruoEarly.split("/")[2];
  const lateBucketId = daboruoLate.split("/")[2];
  if (earlyBucketId === lateBucketId) {
    fail("大般若 001-0001a 与 304-0552c 不得仍落在同一语料桶，否则一次读取会装上整部 15 分册");
  }
  const lateBucket = tracing.buckets.find((bucket) => bucket.id === lateBucketId);
  if (!lateBucket) fail(`大般若晚页指向不存在的桶 ${lateBucketId}`);
  else if (lateBucket.paths.length !== 1 || lateBucket.paths[0] !== "data/corpus/cbeta/T06n0220b.xml") {
    fail(`${lateBucketId} 仍把兄弟 TEI 打进 304-0552c 的函数：${lateBucket.paths.join(", ")}`);
  }
  for (const range of routing.slugJuanBuckets?.["daboruo-jing"] ?? []) {
    const bucket = tracing.buckets.find((item) => item.id === range.bucket);
    const leaked = bucket?.paths.filter((assetPath) => !/\/T0[567]n0220[a-o]\.xml$/.test(assetPath)) ?? ["missing"];
    if (!bucket || leaked.length > 0) {
      fail(`${range.bucket} 是大般若分册桶，却夹带了兄弟文本：${leaked[0]}`);
    }
  }
  if ((tracing.maxBucketBytes ?? 0) > 8 * 1024 * 1024) {
    fail("运行时单桶上限必须 ≤ 8MiB，不能再按 96MiB 把整袋兄弟母版打进冷启动");
  }
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

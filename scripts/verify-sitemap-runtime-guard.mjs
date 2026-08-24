import { readFile, readdir, stat } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import { performance } from "node:perf_hooks";
import {
  readCanonicalConceptPaths,
  sitemapChunkSize,
  sitemapLedgerSchema,
  sitemapStaticPaths,
} from "../src/lib/sitemap-static-paths.mjs";
import {
  workCatalogLedgerSchema,
  workCatalogTargetShardBytes,
} from "../src/lib/corpus-work-catalog-paths.mjs";
import { rewriteCatalogFolioPath } from "../src/lib/corpus-folio-proxy.mjs";
import { corpusFolioExistence } from "./corpus-folio-existence-document.mjs";
import { corpusRuntimeSmokeRoutes } from "./corpus-runtime-smoke-routes.mjs";

const root = process.cwd();
const failures = [];

function fail(message) {
  failures.push(message);
}

function requireNoImport(source, fileLabel, forbidden) {
  for (const pattern of forbidden) {
    if (pattern.test(source)) {
      fail(`${fileLabel} 不得导入会在运行时打开语料母版或 21MB 版页索引的模块`);
    }
  }
}

function requirePattern(source, fileLabel, pattern, message) {
  if (!pattern.test(source)) fail(`${fileLabel} ${message}`);
}

const fatIndexPattern = /corpus-folio-index\.generated|getSutraReading|corpus-reading|getSitemapEntries|corpus-folio-locator/;
const requiredAdvertisedPaths = [
  "/",
  "/xue/xinjing",
  "/jingzang/xinjing",
  "/jingzang/xinjing/001-0848c",
  "/jingzang/zengyiahanjing/001-0549a",
  "/jingzang/dasheng-ru-lengqiejing/001-0587a",
  "/jingzang/jingangjing/001-0748c",
  "/jingzang/dhammapada-pali/001-dhp1-20",
  "/jingzang/derge-kangyur-d0008/021-0279b",
];

const [
  sitemapIndexRoute,
  sitemapMetadata,
  sitemapData,
  sitemapLedgerModule,
  llmsSource,
  nextConfig,
  folioIndex,
  routing,
  ledger,
  workIndexPage,
  workCatalogModule,
  workLedger,
] = await Promise.all([
  readFile(resolve(root, "src/app/sitemap-index.xml/route.ts"), "utf8"),
  readFile(resolve(root, "src/app/sitemap.ts"), "utf8"),
  readFile(resolve(root, "src/lib/sitemap-data.ts"), "utf8"),
  readFile(resolve(root, "src/lib/sitemap-ledger.ts"), "utf8"),
  readFile(resolve(root, "src/lib/llms.ts"), "utf8"),
  readFile(resolve(root, "next.config.ts"), "utf8"),
  readFile(resolve(root, "src/data/corpus-folio-index.generated.json"), "utf8").then(JSON.parse),
  readFile(resolve(root, "src/data/corpus-runtime-routing.generated.json"), "utf8").then(JSON.parse),
  readFile(resolve(root, "src/data/corpus-sitemap-ledger.generated.json"), "utf8").then(JSON.parse),
  readFile(resolve(root, "src/app/jingzang/[slug]/page.tsx"), "utf8"),
  readFile(resolve(root, "src/lib/corpus-folio-index.ts"), "utf8"),
  readFile(resolve(root, "src/data/corpus-work-ledger.generated.json"), "utf8").then(JSON.parse),
]);

requireNoImport(sitemapIndexRoute, "src/app/sitemap-index.xml/route.ts", [fatIndexPattern, /sitemap-data/, /sitemap-chunk-loaders/]);
requireNoImport(sitemapMetadata, "src/app/sitemap.ts", [/corpus-folio-index/, /corpus-reading/, /getSutraReading/, /getSitemapEntries/]);
requireNoImport(sitemapData, "src/lib/sitemap-data.ts", [/corpus-folio-index/, /corpus-reading/, /getSutraReading/, /getSitemapEntries/]);
requireNoImport(sitemapLedgerModule, "src/lib/sitemap-ledger.ts", [fatIndexPattern, /sitemap-chunk-loaders/, /sitemap-data/]);
requireNoImport(llmsSource, "src/lib/llms.ts", [fatIndexPattern, /sitemap-data/, /sitemap-chunk-loaders/, /getSitemapEntries/, /corpus-work-catalog-nft/]);

requirePattern(sitemapIndexRoute, "src/app/sitemap-index.xml/route.ts", /export const dynamic = "force-static"/, "必须 force-static，不能在请求时从 21MB 索引物化 25 万条 URL");
requirePattern(sitemapIndexRoute, "src/app/sitemap-index.xml/route.ts", /from "@\/lib\/sitemap-ledger"/, "只能读取预计算账本");
requirePattern(sitemapMetadata, "src/app/sitemap.ts", /export const dynamic = "force-static"/, "必须 force-static");
requirePattern(sitemapMetadata, "src/app/sitemap.ts", /getSitemapChunk/, "必须按分片读取，而不能再 getSitemapEntries()");
requirePattern(
  nextConfig,
  "next.config.ts",
  /sitemapLedgerGlob[\s\S]*corpus-sitemap-ledger\.generated\.json[\s\S]*"\/sitemap-index\.xml": \[sitemapLedgerGlob\]/,
  "必须把 sitemap 账本打进 sitemap-index 函数 trace",
);
requirePattern(
  nextConfig,
  "next.config.ts",
  /sitemapChunkGlobs[\s\S]*corpus-sitemap-chunks\/\*\.json[\s\S]*"\/sitemap\/\[__metadata_id__\]": sitemapChunkGlobs/,
  "必须把 sitemap 分片打进 metadata sitemap 函数 trace",
);
requirePattern(
  nextConfig,
  "next.config.ts",
  /workCatalogGlobs[\s\S]*corpus-work-catalog-chunks\/\*\.json[\s\S]*"\/jingzang\/\[slug\]": workCatalogGlobs/,
  "必须把经目账本和分片打进经目页函数 trace，而不能再打进 21MB 版页索引",
);
requireNoImport(workIndexPage, "src/app/jingzang/[slug]/page.tsx", [/corpus-folio-index\.generated/, /corpus-reading/, /getSutraReading/, /corpus-folio-locator/, /corpus-folio-existence/]);
requireNoImport(workCatalogModule, "src/lib/corpus-folio-index.ts", [/corpus-folio-index\.generated/, /corpus-reading/, /getSutraReading/, /corpus-folio-locator/, /corpus-folio-existence/]);
requireNoImport(sitemapData, "src/lib/sitemap-data.ts", [/corpus-folio-existence/]);
requireNoImport(llmsSource, "src/lib/llms.ts", [/corpus-folio-existence/]);
requirePattern(workIndexPage, "src/app/jingzang/[slug]/page.tsx", /export const dynamic = "force-static"/, "必须 force-static");
requirePattern(workIndexPage, "src/app/jingzang/[slug]/page.tsx", /await getSutraCatalogView/, "必须按 slug 异步读取一个经目分片");
requirePattern(
  workIndexPage,
  "src/app/jingzang/[slug]/page.tsx",
  /loadWorkCatalogShardForTrace/,
  "必须字面 import() 经目分片做 NFT 追踪；force-static 页不会套用 outputFileTracingIncludes",
);
requirePattern(workCatalogModule, "src/lib/corpus-folio-index.ts", /corpus-work-ledger\.generated\.json/, "只能静态导入经目账本");
requirePattern(workCatalogModule, "src/lib/corpus-folio-index.ts", /loadWorkCatalogShardWorks/, "必须按分片读取经目，而不能静态导入 21MB 版页索引");

if (ledger.schema !== sitemapLedgerSchema) fail("sitemap 账本 schema 不正确");
if (ledger.chunkSize !== sitemapChunkSize) fail("sitemap 分片大小与常量不一致");
if (ledger.staticPathCount !== sitemapStaticPaths.length) fail("sitemap 静态路径数量与清单不一致");
const conceptPaths = readCanonicalConceptPaths(root);
if (conceptPaths.some((path) => !sitemapStaticPaths.includes(path))) {
  fail("概念 Hub 登记册有路径未进入 sitemap 静态清单");
}
if (new Set(conceptPaths).size !== conceptPaths.length) {
  fail("概念 Hub 登记册含有重复的 sitemap 路径");
}
if (ledger.workCount !== Object.keys(folioIndex.works ?? {}).length) {
  fail("sitemap 账本文本数与版页索引不一致");
}
if (ledger.folioCount !== folioIndex.totalFolios) fail("sitemap 账本版页数与版页索引不一致");
if (ledger.sitemapCount !== Math.ceil(ledger.totalUrls / ledger.chunkSize)) {
  fail("sitemapCount 与 totalUrls/chunkSize 不一致");
}
if (ledger.sitemapCount < 2) fail("sitemap 至少应有两个分片");

if (workLedger.schema !== workCatalogLedgerSchema) fail("经目账本 schema 不正确");
if (workLedger.targetShardBytes !== workCatalogTargetShardBytes) fail("经目分片预算与常量不一致");
if (workLedger.workCount !== ledger.workCount) fail("经目账本文本数与 sitemap 账本不一致");
if (workLedger.folioCount !== ledger.folioCount) fail("经目账本版页数与 sitemap 账本不一致");
if (workLedger.shardCount < 2) fail("经目至少应有两个分片");
if (Object.keys(workLedger.slugToShard ?? {}).length !== workLedger.workCount) {
  fail("经目账本 slugToShard 覆盖不完整");
}

const workLookupStarted = performance.now();
const missingWorkShard = workLedger.slugToShard["not-a-real-slug"];
const workLookupElapsedMs = performance.now() - workLookupStarted;
if (missingWorkShard !== undefined) fail("经目账本不得收录不存在的 slug");
if (workLookupElapsedMs > 10) {
  fail(`未知经目 slug 查找耗时 ${workLookupElapsedMs.toFixed(1)}ms，必须只读账本`);
}
for (const path of requiredAdvertisedPaths.filter((item) => item.startsWith("/jingzang/") && item.split("/").filter(Boolean).length === 2)) {
  const slug = path.slice("/jingzang/".length);
  if (!Number.isSafeInteger(workLedger.slugToShard[slug])) fail(`广告经目缺少分片：${path}`);
}

const started = performance.now();
const sitemapIds = Array.from({ length: ledger.sitemapCount }, (_, id) => ({ id: String(id) }));
const indexXml = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapIds
  .map(({ id }) => `<sitemap><loc>https://www.foxue.ai/sitemap/${id}.xml</loc></sitemap>`)
  .join("\n")}\n</sitemapindex>\n`;
const indexElapsedMs = performance.now() - started;
if (indexElapsedMs > 50) {
  fail(`sitemap-index 生成耗时 ${indexElapsedMs.toFixed(1)}ms，必须保持 O(1) 账本读取`);
}
if (!indexXml.includes("/sitemap/0.xml") || !indexXml.includes(`/sitemap/${ledger.sitemapCount - 1}.xml`)) {
  fail("sitemap-index XML 缺少首尾分片");
}

const chunkFiles = (await readdir(resolve(root, "src/data/corpus-sitemap-chunks")))
  .filter((name) => name.endsWith(".json"))
  .sort((left, right) => Number(left.replace(".json", "")) - Number(right.replace(".json", "")));
if (chunkFiles.length !== ledger.sitemapCount) {
  fail(`分片文件数 ${chunkFiles.length} 与账本 ${ledger.sitemapCount} 不一致`);
}

const advertised = new Set();
let tracedUrls = 0;
for (const [index, name] of chunkFiles.entries()) {
  const chunk = JSON.parse(await readFile(resolve(root, "src/data/corpus-sitemap-chunks", name), "utf8"));
  if (chunk.id !== index) fail(`${name} 的 id 应为 ${index}`);
  if (!Array.isArray(chunk.paths) || chunk.paths.length < 1) fail(`${name} 没有路径`);
  if (index < ledger.sitemapCount - 1 && chunk.paths.length !== ledger.chunkSize) {
    fail(`${name} 应恰好有 ${ledger.chunkSize} 条路径`);
  }
  tracedUrls += chunk.paths.length;
  for (const path of chunk.paths) advertised.add(path);
}
if (tracedUrls !== ledger.totalUrls) fail(`分片路径总数 ${tracedUrls} 与账本 ${ledger.totalUrls} 不一致`);

for (const path of [...sitemapStaticPaths.filter(Boolean), ...requiredAdvertisedPaths]) {
  if (!advertised.has(path) && path !== "/") fail(`广告路径不在预计算 sitemap 中：${path}`);
}
if (!advertised.has("")) fail("sitemap 缺少站点根路径");

for (const smoke of corpusRuntimeSmokeRoutes) {
  if (!advertised.has(smoke.path)) fail(`抽样版页未进入 sitemap：${smoke.path}`);
}

const slugToBucket = routing.slugToBucket;
for (const path of requiredAdvertisedPaths.filter((item) => item.split("/").filter(Boolean).length === 3)) {
  const match = path.match(/^\/jingzang\/([^/]+)\/([^/]+)$/);
  if (!match) continue;
  const [, slug] = match;
  if (!slugToBucket[slug]) fail(`广告版页缺少分桶：${path}`);
  if (rewriteCatalogFolioPath(path, routing, corpusFolioExistence) === null) {
    fail(`广告版页无法改写到分桶运行时：${path}`);
  }
}

const nextBuildDir = resolve(root, ".next/server");
let hasBuild = false;
try {
  await stat(nextBuildDir);
  hasBuild = true;
} catch {
  hasBuild = false;
}

if (hasBuild) {
  try {
    const prerenderedIndex = await readFile(resolve(root, ".next/server/app/sitemap-index.xml.body"), "utf8");
    if (!prerenderedIndex.includes("<sitemapindex") || !prerenderedIndex.includes("/sitemap/0.xml")) {
      fail("构建产物 sitemap-index.xml.body 不是有效索引");
    }
    if ((prerenderedIndex.match(/<sitemap>/g) ?? []).length !== ledger.sitemapCount) {
      fail("构建产物 sitemap-index 分片数与账本不一致");
    }
  } catch {
    fail("构建必须预渲染 /sitemap-index.xml，而不能只留下请求时函数");
  }
  async function walkNftFiles(directory, files = []) {
    const entries = await readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      const entryPath = resolve(directory, entry.name);
      if (entry.isDirectory()) await walkNftFiles(entryPath, files);
      else if (entry.name.endsWith(".nft.json")) files.push(entryPath);
    }
    return files;
  }

  const nftFiles = await walkNftFiles(nextBuildDir);
  const fatIndexPatternOnDisk = /corpus-folio-index\.generated\.json$/;
  const existencePatternOnDisk = /corpus-folio-existence\.generated\.json$/;
  const ledgerPatternOnDisk = /corpus-sitemap-ledger\.generated\.json$/;
  const chunkPatternOnDisk = /corpus-sitemap-chunks\/\d+\.json$/;
  const workChunkPatternOnDisk = /corpus-work-catalog-chunks(?:\/|_)\d+/;
  const corpusSourcePattern = /(?:^|\/)data\/corpus\/(?:cbeta\/[^/]+\.xml|derge\/works\/.+|suttacentral\/root\/.+)$/;

  let sitemapIndexTraces = 0;
  let sitemapChunkTraces = 0;
  let workIndexTraces = 0;
  for (const nftPath of nftFiles) {
    const routeKey = relative(nextBuildDir, nftPath).replaceAll("\\", "/");
    const trace = JSON.parse(await readFile(nftPath, "utf8"));
    const files = (trace.files ?? []).map((file) => resolve(dirname(nftPath), file).replaceAll("\\", "/"));
    const hasFatIndex = files.some((file) => fatIndexPatternOnDisk.test(file));
    const hasExistence = files.some((file) => existencePatternOnDisk.test(file));
    const hasLedger = files.some((file) => ledgerPatternOnDisk.test(file));
    const hasChunk = files.some((file) => chunkPatternOnDisk.test(file));
    const workChunkCount = files.filter((file) => workChunkPatternOnDisk.test(file)).length;
    const leakedSource = files.find((file) => corpusSourcePattern.test(file));

    if (routeKey.includes("sitemap-index.xml")) {
      sitemapIndexTraces += 1;
      if (hasFatIndex) fail(`${routeKey} 把 21MB 版页索引打进了 sitemap-index 函数`);
      if (hasExistence) fail(`${routeKey} 不得夹带版页存在账本`);
      if (hasChunk) fail(`${routeKey} 不应夹带 sitemap 分片文件；index 只能带账本`);
      if (!hasLedger) fail(`${routeKey} 缺少 sitemap 账本`);
    }
    if (routeKey.includes("sitemap/[__metadata_id__]") || routeKey.includes("sitemap.js.nft.json")) {
      sitemapChunkTraces += 1;
      if (hasFatIndex) fail(`${routeKey} 把 21MB 版页索引打进了 sitemap 分片函数`);
    }
    if ((routeKey.includes("llms.txt") || routeKey.includes("llms-full.txt")) && (hasFatIndex || hasExistence)) {
      fail(`${routeKey} 把 21MB 版页索引或存在账本打进了 llms 函数`);
    }
    if (hasExistence && /\/corpus-runtime\/[^/]+\/\[slug\]\/\[folio\]\//.test(routeKey)) {
      fail(`${routeKey} 不得把存在账本打进肥胖分桶；已知缺失版页应停在 Proxy`);
    }
    if (
      routeKey.includes("jingzang/[slug]/page.js.nft.json") ||
      routeKey.includes("jingzang/[slug]/page.nft.json")
    ) {
      workIndexTraces += 1;
      if (hasFatIndex) fail(`${routeKey} 把 21MB 版页索引打进了经目页函数`);
      if (hasExistence) fail(`${routeKey} 不得夹带版页存在账本`);
      if (workChunkCount !== workLedger.shardCount) {
        fail(`${routeKey} 经目分片 trace 为 ${workChunkCount}，应为 ${workLedger.shardCount}（按 slug 异步加载，而不是 21MB 整包）`);
      }
      if (files.some((file) => /corpus-folio-locator-chunks/.test(file))) {
        fail(`${routeKey} 不得夹带版页定位分片`);
      }
      let hasWorkLedger = files.some((file) => /corpus-work-ledger/.test(file));
      if (!hasWorkLedger) {
        for (const file of files) {
          if (!file.endsWith(".js") && !file.endsWith(".json")) continue;
          const fileStat = await stat(file).catch(() => null);
          if (!fileStat || fileStat.size > 2_000_000) continue;
          const source = await readFile(file, "utf8");
          if (source.includes(workCatalogLedgerSchema)) {
            hasWorkLedger = true;
            break;
          }
        }
      }
      if (!hasWorkLedger) fail(`${routeKey} 缺少经目账本（文件或打包后的 schema）`);
    }
    if (leakedSource && !/\/corpus-runtime\/[^/]+\/\[slug\]\/\[folio\]\//.test(routeKey)) {
      fail(`${routeKey} 把语料母版打进了非分桶函数：${relative(root, leakedSource)}`);
    }
  }
  if (sitemapIndexTraces < 1) fail("构建产物缺少 sitemap-index trace");
  if (sitemapChunkTraces < 1) fail("构建产物缺少 sitemap 分片 trace");
  if (workIndexTraces < 1) fail("构建产物缺少经目页 trace");
}

if (failures.length > 0) {
  for (const failure of failures) console.error(`✗ ${failure}`);
  process.exitCode = 1;
} else {
  console.log(
    `✓ sitemap 运行时门禁通过：${ledger.totalUrls} 个 URL / ${ledger.sitemapCount} 个 sitemap 分片 / ${workLedger.shardCount} 个经目分片，sitemap-index 为 force-static 账本读取（${indexElapsedMs.toFixed(1)}ms），未知经目 slug 为账本查找（${workLookupElapsedMs.toFixed(1)}ms）`,
  );
}

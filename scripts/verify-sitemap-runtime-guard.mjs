import { readFile, readdir, stat } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import { performance } from "node:perf_hooks";
import {
  sitemapChunkSize,
  sitemapLedgerSchema,
  sitemapStaticPaths,
} from "../src/lib/sitemap-static-paths.mjs";
import { rewriteCatalogFolioPath } from "../src/lib/corpus-folio-proxy.mjs";
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

const fatIndexPattern = /corpus-folio-index|getSutraReading|corpus-reading|getSitemapEntries/;
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
]);

requireNoImport(sitemapIndexRoute, "src/app/sitemap-index.xml/route.ts", [fatIndexPattern, /sitemap-data/, /sitemap-chunk-loaders/]);
requireNoImport(sitemapMetadata, "src/app/sitemap.ts", [/corpus-folio-index/, /corpus-reading/, /getSutraReading/, /getSitemapEntries/]);
requireNoImport(sitemapData, "src/lib/sitemap-data.ts", [/corpus-folio-index/, /corpus-reading/, /getSutraReading/, /getSitemapEntries/]);
requireNoImport(sitemapLedgerModule, "src/lib/sitemap-ledger.ts", [fatIndexPattern, /sitemap-chunk-loaders/, /sitemap-data/]);
requireNoImport(llmsSource, "src/lib/llms.ts", [fatIndexPattern, /sitemap-data/, /sitemap-chunk-loaders/, /getSitemapEntries/]);

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
  /"\/jingzang\/\[slug\]": \["\.\/src\/data\/corpus-folio-index\.generated\.json"\]/,
  "必须把版页索引打进经目页函数 trace",
);

if (ledger.schema !== sitemapLedgerSchema) fail("sitemap 账本 schema 不正确");
if (ledger.chunkSize !== sitemapChunkSize) fail("sitemap 分片大小与常量不一致");
if (ledger.staticPathCount !== sitemapStaticPaths.length) fail("sitemap 静态路径数量与清单不一致");
if (ledger.workCount !== Object.keys(folioIndex.works ?? {}).length) {
  fail("sitemap 账本文本数与版页索引不一致");
}
if (ledger.folioCount !== folioIndex.totalFolios) fail("sitemap 账本版页数与版页索引不一致");
if (ledger.sitemapCount !== Math.ceil(ledger.totalUrls / ledger.chunkSize)) {
  fail("sitemapCount 与 totalUrls/chunkSize 不一致");
}
if (ledger.sitemapCount < 2) fail("sitemap 至少应有两个分片");

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
  if (rewriteCatalogFolioPath(path, slugToBucket) === null) {
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
  const ledgerPatternOnDisk = /corpus-sitemap-ledger\.generated\.json$/;
  const chunkPatternOnDisk = /corpus-sitemap-chunks\/\d+\.json$/;
  const corpusSourcePattern = /(?:^|\/)data\/corpus\/(?:cbeta\/[^/]+\.xml|derge\/works\/.+|suttacentral\/root\/.+)$/;

  let sitemapIndexTraces = 0;
  let sitemapChunkTraces = 0;
  for (const nftPath of nftFiles) {
    const routeKey = relative(nextBuildDir, nftPath).replaceAll("\\", "/");
    const trace = JSON.parse(await readFile(nftPath, "utf8"));
    const files = (trace.files ?? []).map((file) => resolve(dirname(nftPath), file).replaceAll("\\", "/"));
    const hasFatIndex = files.some((file) => fatIndexPatternOnDisk.test(file));
    const hasLedger = files.some((file) => ledgerPatternOnDisk.test(file));
    const hasChunk = files.some((file) => chunkPatternOnDisk.test(file));
    const leakedSource = files.find((file) => corpusSourcePattern.test(file));

    if (routeKey.includes("sitemap-index.xml")) {
      sitemapIndexTraces += 1;
      if (hasFatIndex) fail(`${routeKey} 把 21MB 版页索引打进了 sitemap-index 函数`);
      if (hasChunk) fail(`${routeKey} 不应夹带 sitemap 分片文件`);
      if (!hasLedger && !files.some((file) => /sitemap-index\.xml/.test(file) && file.endsWith(".js"))) {
        fail(`${routeKey} 既没有账本也没有可服务的 sitemap-index 产物`);
      }
    }
    if (routeKey.includes("sitemap/[__metadata_id__]") || routeKey.includes("sitemap.js.nft.json")) {
      sitemapChunkTraces += 1;
      if (hasFatIndex) fail(`${routeKey} 把 21MB 版页索引打进了 sitemap 分片函数`);
    }
    if ((routeKey.includes("llms.txt") || routeKey.includes("llms-full.txt")) && hasFatIndex) {
      fail(`${routeKey} 把 21MB 版页索引打进了 llms 函数`);
    }
    if (leakedSource && !/\/corpus-runtime\/[^/]+\/\[slug\]\/\[folio\]\//.test(routeKey)) {
      fail(`${routeKey} 把语料母版打进了非分桶函数：${relative(root, leakedSource)}`);
    }
  }
  if (sitemapIndexTraces < 1) fail("构建产物缺少 sitemap-index trace");
  if (sitemapChunkTraces < 1) fail("构建产物缺少 sitemap 分片 trace");
}

if (failures.length > 0) {
  for (const failure of failures) console.error(`✗ ${failure}`);
  process.exitCode = 1;
} else {
  console.log(
    `✓ sitemap 运行时门禁通过：${ledger.totalUrls} 个 URL / ${ledger.sitemapCount} 个分片，sitemap-index 为 force-static 账本读取（${indexElapsedMs.toFixed(1)}ms）`,
  );
}

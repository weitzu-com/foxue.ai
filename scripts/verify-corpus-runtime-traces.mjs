import { readFile, readdir, stat } from "node:fs/promises";
import { dirname, resolve, relative } from "node:path";
import { rewriteCatalogFolioPath } from "../src/lib/corpus-folio-proxy.mjs";
import { corpusFolioExistence } from "./corpus-folio-existence-document.mjs";

const root = process.cwd();
const tracing = JSON.parse(
  await readFile(resolve(root, "src/data/corpus-runtime-tracing.generated.json"), "utf8"),
);
const routing = JSON.parse(
  await readFile(resolve(root, "src/data/corpus-runtime-routing.generated.json"), "utf8"),
);
const maxTraceBytes = 128 * 1024 * 1024;
const corpusSourcePattern = /(?:^|\/)data\/corpus\/(?:cbeta\/[^/]+\.xml|derge\/works\/.+|suttacentral\/root\/.+)$/;
const bucketRoutePattern = /\/corpus-runtime\/[^/]+\/\[slug\]\/\[folio\]\//;

function shardKey(filePath) {
  const locator = posix(filePath).match(/corpus-folio-locator-chunks(?:\/|_)(\d+)/);
  if (locator) return `locator:${locator[1]}`;
  const catalog = posix(filePath).match(/corpus-work-catalog-chunks(?:\/|_)(\d+)/);
  if (catalog) return `catalog:${catalog[1]}`;
  return null;
}

const daboruoLateFolio = {
  path: "/jingzang/daboruo-jing/304-0552c",
  source: "data/corpus/cbeta/T06n0220b.xml",
};

function posix(filePath) {
  return filePath.replaceAll("\\", "/");
}

async function walkNftFiles(directory, files = []) {
  let entries = [];
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      throw new Error("缺少 .next 构建产物；无法校验运行时 trace");
    }
    throw error;
  }
  for (const entry of entries) {
    const entryPath = resolve(directory, entry.name);
    if (entry.isDirectory()) await walkNftFiles(entryPath, files);
    else if (entry.name.endsWith(".nft.json")) files.push(entryPath);
  }
  return files;
}

for (const bucket of tracing.buckets) {
  const tracePath = resolve(
    root,
    `.next/server/app/corpus-runtime/${bucket.id}/[slug]/[folio]/page.js.nft.json`,
  );
  const trace = JSON.parse(await readFile(tracePath, "utf8"));
  const tracedPaths = new Set();
  let totalBytes = 0;
  let corpusBytes = 0;
  const unusedSources = [];
  const extraShards = [];
  const tracedShardKeys = new Set();
  const allowedSources = new Set(bucket.paths.map((assetPath) => resolve(root, assetPath)));
  const allowedShardKeys = new Set(
    bucket.includeGlobs.map((assetPath) => shardKey(assetPath)).filter(Boolean),
  );

  for (const relativePath of trace.files) {
    const absolutePath = resolve(dirname(tracePath), relativePath);
    tracedPaths.add(absolutePath);
    const size = (await stat(absolutePath)).size;
    totalBytes += size;
    const normalized = posix(absolutePath);
    if (corpusSourcePattern.test(normalized)) {
      corpusBytes += size;
      if (!allowedSources.has(absolutePath)) {
        unusedSources.push(relative(root, absolutePath));
      }
    }
    const key = shardKey(normalized);
    if (key) {
      tracedShardKeys.add(key);
      if (!allowedShardKeys.has(key)) extraShards.push(relative(root, absolutePath));
    }
  }

  const missingAssets = bucket.paths.filter(
    (assetPath) => !tracedPaths.has(resolve(root, assetPath)),
  );
  const requiredShards = bucket.includeGlobs.filter((assetPath) => shardKey(assetPath));
  const missingShards = requiredShards.filter((assetPath) => !tracedShardKeys.has(shardKey(assetPath)));
  if (missingAssets.length > 0) {
    throw new Error(
      `${bucket.id} 的部署 trace 缺少 ${missingAssets.length} 个受控语料资产：${missingAssets[0]}`,
    );
  }
  if (missingShards.length > 0) {
    throw new Error(
      `${bucket.id} 的部署 trace 缺少本桶经目/定位分片：${missingShards[0]}（一次版页读取不得只靠 includeGlobs；必须有字面 import()）`,
    );
  }
  if (unusedSources.length > 0) {
    throw new Error(
      `${bucket.id} 的部署 trace 夹带了本桶用不到的语料母版：${unusedSources[0]}`,
    );
  }
  if (extraShards.length > 0) {
    throw new Error(
      `${bucket.id} 的部署 trace 夹带了本桶用不到的经目/定位分片：${extraShards[0]}`,
    );
  }
  if (corpusBytes > bucket.bytes + 64 * 1024) {
    throw new Error(
      `${bucket.id} 的语料母版 ${(corpusBytes / 1024 / 1024).toFixed(1)} MiB，超过本桶 ${(bucket.bytes / 1024 / 1024).toFixed(1)} MiB`,
    );
  }
  if (totalBytes > maxTraceBytes) {
    throw new Error(
      `${bucket.id} 的部署 trace 为 ${(totalBytes / 1024 / 1024).toFixed(1)} MiB，超过 128 MiB 发布门槛`,
    );
  }

  console.log(
    `✓ ${bucket.id} trace ${(totalBytes / 1024 / 1024).toFixed(1)} MiB，语料 ${(corpusBytes / 1024 / 1024).toFixed(1)} MiB，${bucket.paths.length} 个受控资产 / ${requiredShards.length} 个本桶分片，无多余母版`,
  );
}

const rewrittenLate = rewriteCatalogFolioPath(daboruoLateFolio.path, routing, corpusFolioExistence);
if (!rewrittenLate?.startsWith("/corpus-runtime/")) {
  throw new Error(`大般若 ${daboruoLateFolio.path} 无法改写到分桶运行时`);
}
const lateBucketId = rewrittenLate.split("/")[2];
const lateBucket = tracing.buckets.find((bucket) => bucket.id === lateBucketId);
if (!lateBucket) throw new Error(`大般若晚页指向不存在的桶 ${lateBucketId}`);
if (lateBucket.paths.length !== 1 || lateBucket.paths[0] !== daboruoLateFolio.source) {
  throw new Error(
    `${lateBucketId} 服务 ${daboruoLateFolio.path} 却追踪 ${lateBucket.paths.length} 个母版（${lateBucket.paths[0]}），一次版页读取不得夹带兄弟 TEI`,
  );
}

const nftFiles = await walkNftFiles(resolve(root, ".next/server"));
let inspected = 0;
for (const nftPath of nftFiles) {
  const routeKey = relative(resolve(root, ".next/server"), nftPath);
  if (bucketRoutePattern.test(routeKey.replaceAll("\\", "/"))) continue;
  const trace = JSON.parse(await readFile(nftPath, "utf8"));
  const leaked = (trace.files ?? []).filter((file) => {
    const absolutePath = resolve(dirname(nftPath), file);
    return corpusSourcePattern.test(posix(absolutePath));
  });
  inspected += 1;
  if (leaked.length > 0) {
    throw new Error(
      `${routeKey} 把语料母版打进了非分桶函数：${relative(root, resolve(dirname(nftPath), leaked[0]))}`,
    );
  }
}

console.log(`✓ ${inspected} 个非分桶函数 trace 未夹带语料母版`);
console.log(`✓ 大般若 ${daboruoLateFolio.path} 由 ${lateBucketId} 只追踪 ${daboruoLateFolio.source}`);

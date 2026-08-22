import { readFile, readdir, stat } from "node:fs/promises";
import { dirname, resolve, relative } from "node:path";

const root = process.cwd();
const tracing = JSON.parse(
  await readFile(resolve(root, "src/data/corpus-runtime-tracing.generated.json"), "utf8"),
);
const maxTraceBytes = 240 * 1024 * 1024;

for (const bucket of tracing.buckets) {
  const tracePath = resolve(
    root,
    `.next/server/app/corpus-runtime/${bucket.id}/[slug]/[folio]/page.js.nft.json`,
  );
  const trace = JSON.parse(await readFile(tracePath, "utf8"));
  const tracedPaths = new Set();
  let totalBytes = 0;

  for (const relativePath of trace.files) {
    const absolutePath = resolve(dirname(tracePath), relativePath);
    tracedPaths.add(absolutePath);
    totalBytes += (await stat(absolutePath)).size;
  }

  const missingAssets = bucket.paths.filter(
    (assetPath) => !tracedPaths.has(resolve(root, assetPath)),
  );
  if (missingAssets.length > 0) {
    throw new Error(
      `${bucket.id} 的部署 trace 缺少 ${missingAssets.length} 个受控语料资产：${missingAssets[0]}`,
    );
  }
  if (totalBytes > maxTraceBytes) {
    throw new Error(
      `${bucket.id} 的部署 trace 为 ${(totalBytes / 1024 / 1024).toFixed(1)} MiB，超过 240 MiB 发布门槛`,
    );
  }

  console.log(
    `✓ ${bucket.id} trace ${(totalBytes / 1024 / 1024).toFixed(1)} MiB，${bucket.paths.length} 个受控语料资产完整`,
  );
}

const corpusSourcePattern = /(?:^|\/)data\/corpus\/(?:cbeta\/[^/]+\.xml|derge\/works\/.+|suttacentral\/root\/.+)$/;
const bucketRoutePattern = /\/corpus-runtime\/[^/]+\/\[slug\]\/\[folio\]\//;

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

const nftFiles = await walkNftFiles(resolve(root, ".next/server"));
let inspected = 0;
for (const nftPath of nftFiles) {
  const routeKey = relative(resolve(root, ".next/server"), nftPath);
  if (bucketRoutePattern.test(routeKey.replaceAll("\\", "/"))) continue;
  const trace = JSON.parse(await readFile(nftPath, "utf8"));
  const leaked = (trace.files ?? []).filter((file) => {
    const absolutePath = resolve(dirname(nftPath), file);
    return corpusSourcePattern.test(absolutePath.replaceAll("\\", "/"));
  });
  inspected += 1;
  if (leaked.length > 0) {
    throw new Error(
      `${routeKey} 把语料母版打进了非分桶函数：${relative(root, resolve(dirname(nftPath), leaked[0]))}`,
    );
  }
}

console.log(`✓ ${inspected} 个非分桶函数 trace 未夹带语料母版`);

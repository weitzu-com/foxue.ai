import { readFile, stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";

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

import { access, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { corpusRuntimeSmokeRoutes } from "./corpus-runtime-smoke-routes.mjs";

const root = process.cwd();
const write = process.argv.includes("--write");
const maxBucketBytes = 96 * 1024 * 1024;

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

const manifestFamilies = [
  {
    prefix: "cb",
    name: "cbeta",
    manifests: [
      "data/corpus/cbeta/manifest-v4.23.0.json",
      "data/corpus/cbeta/nanchuan-manifest-v1.0.0.json",
    ],
  },
  {
    prefix: "sc",
    name: "suttacentral",
    manifests: [
      "data/corpus/suttacentral/manifest-v0.7.0.json",
      "data/corpus/suttacentral/dn-manifest-v0.8.0.json",
      "data/corpus/suttacentral/mn-manifest-v0.9.0.json",
      "data/corpus/suttacentral/sn-manifest-v1.0.0.json",
      "data/corpus/suttacentral/an-manifest-v1.1.0.json",
      "data/corpus/suttacentral/kn-manifest-v1.2.0.json",
      "data/corpus/suttacentral/indic-manifest-v1.3.0.json",
      "data/corpus/suttacentral/vinaya-manifest-v1.4.0.json",
      "data/corpus/suttacentral/abhidhamma-manifest-v1.5.0.json",
      "data/corpus/suttacentral/lzh-manifest-v1.6.0.json",
    ],
  },
  {
    prefix: "dg",
    name: "derge",
    manifests: ["data/corpus/derge/manifest-v0.1.0.json"],
  },
];

function sourceUnits(file) {
  return file.sourceParts ?? [file];
}

function assertSource(source, slug) {
  if (
    typeof source.localPath !== "string" ||
    !source.localPath.startsWith("data/corpus/") ||
    source.localPath.includes("..") ||
    typeof source.localBytes !== "number" ||
    !Number.isSafeInteger(source.localBytes) ||
    source.localBytes < 1 ||
    typeof source.localSha256 !== "string" ||
    !/^[a-f0-9]{64}$/.test(source.localSha256)
  ) {
    throw new Error(`${slug} 的运行时语料来源缺少受控路径、字节数或 SHA-256`);
  }
}

function serialize(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

async function loadExpressions(family) {
  const expressions = [];
  for (const manifestPath of family.manifests) {
    const manifest = JSON.parse(await readFile(resolve(root, manifestPath), "utf8"));
    for (const file of manifest.files) {
      const sources = sourceUnits(file);
      for (const source of sources) assertSource(source, file.slug);
      expressions.push({
        slug: file.slug,
        bytes: sources.reduce((sum, source) => sum + source.localBytes, 0),
        paths: sources.map((source) => source.localPath).sort(compareText),
      });
    }
  }
  return expressions.sort((left, right) => compareText(left.slug, right.slug));
}

function packFamily(family, expressions) {
  const buckets = [];
  let current;

  for (const expression of expressions) {
    if (expression.bytes > maxBucketBytes) {
      throw new Error(`${expression.slug} 单一文本表达超过运行时桶上限`);
    }
    if (!current || current.bytes + expression.bytes > maxBucketBytes) {
      current = {
        id: `${family.prefix}${String(buckets.length + 1).padStart(2, "0")}`,
        sourceFamily: family.name,
        bytes: 0,
        paths: [],
        slugs: [],
      };
      buckets.push(current);
    }
    current.bytes += expression.bytes;
    current.paths.push(...expression.paths);
    current.slugs.push(expression.slug);
  }

  return buckets;
}

const buckets = [];
for (const family of manifestFamilies) {
  buckets.push(...packFamily(family, await loadExpressions(family)));
}

const slugToBucket = {};
const allPaths = new Set();
for (const bucket of buckets) {
  bucket.paths.sort(compareText);
  bucket.slugs.sort(compareText);
  for (const slug of bucket.slugs) {
    if (slugToBucket[slug]) throw new Error(`重复运行时 slug：${slug}`);
    slugToBucket[slug] = bucket.id;
  }
  for (const assetPath of bucket.paths) {
    if (allPaths.has(assetPath)) throw new Error(`重复运行时语料路径：${assetPath}`);
    allPaths.add(assetPath);
  }
  if (bucket.bytes > maxBucketBytes) throw new Error(`${bucket.id} 超过运行时桶上限`);
  await access(resolve(root, `src/app/corpus-runtime/${bucket.id}/[slug]/[folio]/page.tsx`));
  await access(resolve(root, `src/app/corpus-runtime/${bucket.id}/[slug]/layout.tsx`));
}

const bucketIds = new Set(buckets.map((bucket) => bucket.id));
const smokeBucketIds = new Set();
for (const smoke of corpusRuntimeSmokeRoutes) {
  const match = smoke.path.match(/^\/jingzang\/([^/]+)\/([^/]+)$/);
  if (!match || slugToBucket[match[1]] !== smoke.bucket || !bucketIds.has(smoke.bucket)) {
    throw new Error(`运行时抽样路由与语料桶不一致：${smoke.bucket} ${smoke.path}`);
  }
  if (smokeBucketIds.has(smoke.bucket)) throw new Error(`运行时语料桶抽样重复：${smoke.bucket}`);
  smokeBucketIds.add(smoke.bucket);
}
if (smokeBucketIds.size !== bucketIds.size) {
  throw new Error("每个运行时语料桶必须且只能有一个生产抽样路由");
}

const routing = {
  schema: "https://foxue.ai/schemas/corpus-runtime-routing-v0.1",
  slugToBucket: Object.fromEntries(Object.entries(slugToBucket).sort(([left], [right]) => compareText(left, right))),
};
const tracing = {
  schema: "https://foxue.ai/schemas/corpus-runtime-tracing-v0.1",
  maxBucketBytes,
  totalAssets: allPaths.size,
  totalBytes: buckets.reduce((sum, bucket) => sum + bucket.bytes, 0),
  buckets: buckets.map(({ id, sourceFamily, bytes, paths, slugs }) => ({
    id,
    sourceFamily,
    bytes,
    includeGlobs: sourceFamily === "suttacentral"
      ? ["data/corpus/suttacentral/root/**/*"]
      : paths,
    paths,
    slugs,
  })),
};

const outputs = [
  ["src/data/corpus-runtime-routing.generated.json", serialize(routing)],
  ["src/data/corpus-runtime-tracing.generated.json", serialize(tracing)],
];

for (const [relativePath, expected] of outputs) {
  const outputPath = resolve(root, relativePath);
  if (write) {
    await writeFile(outputPath, expected);
    continue;
  }
  const actual = await readFile(outputPath, "utf8");
  if (actual !== expected) throw new Error(`${relativePath} 与受控语料清单不一致；运行 pnpm build:corpus-runtime-buckets`);
}

console.log(
  `${write ? "已生成" : "已验证"} ${buckets.length} 个运行时语料桶、${Object.keys(slugToBucket).length} 个文本表达、` +
  `${allPaths.size} 个受控资产；单桶上限 ${maxBucketBytes} 字节。`,
);

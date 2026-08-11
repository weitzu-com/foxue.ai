import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parseBilaraSuttaSource } from "../src/lib/bilara-reading.mjs";

const root = process.cwd();
const batchPath = resolve(root, "data/corpus/suttacentral/dn-batch-v0.8.0.json");
const outputPath = resolve(root, "data/corpus/suttacentral/dn-manifest-v0.8.0.json");
const batch = JSON.parse(await readFile(batchPath, "utf8"));
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const gitBlobSha1 = (value) => createHash("sha1")
  .update(`blob ${value.length}\0`)
  .update(value)
  .digest("hex");
const manifestFiles = [];

for (const file of batch.files) {
  const local = await readFile(resolve(root, file.localPath));
  if (local.length !== file.localBytes || sha256(local) !== file.localSha256) {
    throw new Error(`${file.id} 本地文件与固定批次哈希不一致`);
  }
  if (local.at(-1) !== 10) throw new Error(`${file.id} 缺少规范化换行`);
  const upstream = local.subarray(0, -1);
  if (
    upstream.length !== file.upstreamBytes ||
    sha256(upstream) !== file.upstreamSha256 ||
    gitBlobSha1(upstream) !== file.upstreamGitBlobSha1
  ) {
    throw new Error(`${file.id} 无法还原固定上游 Git 对象`);
  }
  const reading = parseBilaraSuttaSource({
    filename: file.localPath.split("/").at(-1),
    text: upstream.toString("utf8"),
  });
  if (
    reading.title !== file.titlePali ||
    reading.segments.length !== file.segments ||
    reading.navigation.length !== file.readingUnits ||
    reading.segments[0]?.id !== file.firstSegmentId ||
    reading.segments.at(-1)?.id !== file.lastSegmentId
  ) {
    throw new Error(`${file.id} 结构与固定批次不一致`);
  }
  manifestFiles.push({
    id: file.id,
    slug: file.slug,
    workId: file.workId,
    language: file.language,
    parser: file.parser,
    format: file.format,
    completeness: "complete",
    localPath: file.localPath,
    upstreamPath: file.upstreamPath,
    upstreamGitBlobSha1: file.upstreamGitBlobSha1,
    upstreamBytes: file.upstreamBytes,
    upstreamSha256: file.upstreamSha256,
    localBytes: file.localBytes,
    localSha256: file.localSha256,
    firstSegmentId: file.firstSegmentId,
    lastSegmentId: file.lastSegmentId,
    presentation: {
      title: file.titleZh,
      alternateTitle: file.titlePali,
      tradition: file.tradition,
      language: "巴利语（罗马字母）",
      canonRef: `SuttaCentral ${file.suttaId.toUpperCase()}`,
      translator: file.edition,
      summary: `巴利《长部》第 ${Number(file.suttaId.slice(2))} 经 ${file.titlePali}；保留 SuttaCentral Bilara 原生段落标识。`,
      sourceUrl: file.sourceUrl,
    },
    verification: {
      segments: reading.segments.length,
      readingUnits: reading.navigation.length,
      anchors: [file.firstSegmentId, file.lastSegmentId],
      humanSampleVerified: false,
    },
  });
}

const manifest = {
  schema: "https://foxue.ai/schemas/corpus-asset-manifest-v0.3",
  version: batch.version,
  source: batch.source,
  rightsDecision: batch.rightsDecision,
  normalization: batch.normalization,
  collection: batch.collection,
  files: manifestFiles,
};
const serialized = `${JSON.stringify(manifest, null, 2)}\n`;

if (process.argv.includes("--verify")) {
  if (await readFile(outputPath, "utf8") !== serialized) {
    throw new Error("SuttaCentral dn-manifest-v0.8.0.json 与固定批次确定性输出不一致");
  }
  console.log(`SuttaCentral 《长部》 v${batch.version} 可复现：${manifestFiles.length} 部完整原文、${batch.collection.stableSegments} 个原生段落。`);
} else {
  await writeFile(outputPath, serialized, "utf8");
  console.log(`SuttaCentral 《长部》 v${batch.version} 已生成：${manifestFiles.length} 部完整原文、${batch.collection.stableSegments} 个原生段落。`);
}

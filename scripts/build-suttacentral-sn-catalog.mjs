import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parseBilaraSamyuttaSources } from "../src/lib/bilara-reading.mjs";

const root = process.cwd();
const batchPath = resolve(root, "data/corpus/suttacentral/sn-batch-v1.0.0.json");
const outputPath = resolve(root, "data/corpus/suttacentral/sn-manifest-v1.0.0.json");
const batch = JSON.parse(await readFile(batchPath, "utf8"));
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const gitBlobSha1 = (value) => createHash("sha1")
  .update(`blob ${value.length}\0`)
  .update(value)
  .digest("hex");
const filesByGroup = new Map();

for (const file of batch.files) {
  const group = filesByGroup.get(file.groupId) ?? [];
  group.push(file);
  filesByGroup.set(file.groupId, group);
}
if (filesByGroup.size !== batch.collection.groupCount) {
  throw new Error("SuttaCentral 《相应部》分组数量与固定批次不一致");
}

const manifestFiles = [];
for (const [groupId, groupFiles] of filesByGroup) {
  const sources = [];
  const sourceParts = [];
  for (const [index, file] of groupFiles.entries()) {
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
    sources.push({ filename: file.localPath.split("/").at(-1), text: upstream.toString("utf8") });
    sourceParts.push({
      part: index + 1,
      id: file.id,
      format: file.format,
      localPath: file.localPath,
      upstreamPath: file.upstreamPath,
      upstreamGitBlobSha1: file.upstreamGitBlobSha1,
      upstreamBytes: file.upstreamBytes,
      upstreamSha256: file.upstreamSha256,
      localBytes: file.localBytes,
      localSha256: file.localSha256,
      firstSegmentId: file.firstSegmentId,
      lastSegmentId: file.lastSegmentId,
      representedSuttas: file.representedSuttas,
      segments: file.segments,
      ...(file.emptySegmentIds ? { emptySegmentIds: file.emptySegmentIds } : {}),
    });
  }

  const reading = parseBilaraSamyuttaSources(sources);
  const first = groupFiles[0];
  const expectedSegments = groupFiles.reduce((sum, file) => sum + file.segments, 0);
  const expectedReadingUnits = groupFiles.reduce((sum, file) => sum + file.readingUnits, 0);
  const expectedRepresentedSuttas = groupFiles.reduce((sum, file) => sum + file.representedSuttas, 0);
  const expectedEmptyIds = groupFiles.flatMap((file) => file.emptySegmentIds ?? []);
  if (
    reading.title !== `Saṁyutta Nikāya ${first.groupNumber}` ||
    reading.segments.length !== expectedSegments ||
    reading.navigation.length !== expectedReadingUnits ||
    reading.representedSuttas !== expectedRepresentedSuttas ||
    JSON.stringify(reading.omittedEmptySegmentIds) !== JSON.stringify(expectedEmptyIds) ||
    reading.segments[0]?.id !== groupFiles[0].firstSegmentId ||
    reading.segments.at(-1)?.id !== groupFiles.at(-1).lastSegmentId
  ) {
    throw new Error(`${groupId} 结构与固定批次不一致`);
  }

  manifestFiles.push({
    id: groupId,
    slug: first.slug,
    workId: first.workId,
    language: first.language,
    parser: first.parser,
    format: first.format,
    completeness: "complete",
    sourceParts,
    presentation: {
      title: first.titleZh,
      alternateTitle: `Saṁyutta Nikāya ${first.groupNumber}`,
      tradition: first.tradition,
      language: "巴利语（罗马字母）",
      canonRef: `SuttaCentral ${groupId}`,
      translator: first.edition,
      summary: `巴利《相应部》第 ${first.groupNumber} 相应；${groupFiles.length} 个物理 root 记录连续表示 ${expectedRepresentedSuttas} 个经号，保留 Bilara 原生段落标识与缩略范围。`,
      sourceUrl: first.sourceUrl,
    },
    verification: {
      segments: reading.segments.length,
      readingUnits: reading.navigation.length,
      sourceRecords: groupFiles.length,
      representedSuttas: expectedRepresentedSuttas,
      omittedEmptySegmentIds: expectedEmptyIds,
      anchors: [reading.segments[0].id, reading.segments.at(-1).id],
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
    throw new Error("SuttaCentral sn-manifest-v1.0.0.json 与固定批次确定性输出不一致");
  }
  console.log(`SuttaCentral 《相应部》 v${batch.version} 可复现：${manifestFiles.length} 个相应、${batch.collection.recordCount} 个来源记录、${batch.collection.stableSegments} 个原生段落。`);
} else {
  await writeFile(outputPath, serialized, "utf8");
  console.log(`SuttaCentral 《相应部》 v${batch.version} 已生成：${manifestFiles.length} 个相应、${batch.collection.recordCount} 个来源记录、${batch.collection.stableSegments} 个原生段落。`);
}

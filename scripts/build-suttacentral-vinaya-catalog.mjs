import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parseBilaraSeriesSources } from "../src/lib/bilara-reading.mjs";

const root = process.cwd();
const batchPath = resolve(root, "data/corpus/suttacentral/vinaya-batch-v1.4.0.json");
const outputPath = resolve(root, "data/corpus/suttacentral/vinaya-manifest-v1.4.0.json");
const batch = JSON.parse(await readFile(batchPath, "utf8"));
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const gitBlobSha1 = (value) => createHash("sha1").update(`blob ${value.length}\0`).update(value).digest("hex");
const requireValue = (condition, message) => {
  if (!condition) throw new Error(message);
};

const files = [];
for (const work of batch.works) {
  const sourceFiles = batch.files.filter((file) => file.workGroupId === work.id);
  requireValue(sourceFiles.length === work.sourceRecordCount, `${work.id} 来源记录数不一致`);
  const sources = [];
  const sourceParts = [];
  for (const file of sourceFiles) {
    const local = await readFile(resolve(root, file.localPath));
    requireValue(local.length === file.localBytes && sha256(local) === file.localSha256, `${file.id} 本地文件与固定批次不一致`);
    requireValue(local.at(-1) === 10, `${file.id} 缺少规范化换行`);
    const upstream = local.subarray(0, -1);
    requireValue(upstream.length === file.upstreamBytes && sha256(upstream) === file.upstreamSha256, `${file.id} 无法还原固定上游文件`);
    requireValue(gitBlobSha1(upstream) === file.upstreamGitBlobSha1, `${file.id} Git blob 指纹不一致`);
    sources.push({ filename: file.localPath.split("/").at(-1), text: upstream.toString("utf8") });
    sourceParts.push({
      part: file.part,
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
      sourceSegments: file.sourceSegments,
      emptySegments: file.emptySegments,
      segments: file.segments,
      rightsStatus: file.rightsStatus,
    });
  }
  const reading = parseBilaraSeriesSources(sources, {
    collectionTitle: work.title,
    collectionPrefix: work.prefix,
    titleSuffixes: ["0.5", "0.4", "0.3", "0.2", "0.1", "0.0"],
    omitEmptySegments: true,
  });
  requireValue(reading.title === work.title && reading.collectionPrefix === work.prefix, `${work.id} 标题或集合前缀不一致`);
  requireValue(reading.sourceRecords === work.sourceRecordCount, `${work.id} 来源记录数不一致`);
  requireValue(reading.segments.length === work.stableSegments, `${work.id} 稳定段落数不一致`);
  requireValue(reading.navigation.length === work.readingUnits, `${work.id} 阅读单元数不一致`);
  requireValue(reading.omittedEmptySegmentIds.length === work.omittedEmptySegments, `${work.id} 空段落数不一致`);
  requireValue(reading.segments[0]?.id === sourceFiles[0].firstSegmentId, `${work.id} 首段锚点不一致`);
  const expectedLast = [...sourceFiles].reverse().map((file) => {
    const source = sources[sourceFiles.indexOf(file)];
    return Object.entries(JSON.parse(source.text)).reverse().find(([, text]) => text.trim())?.[0];
  }).find(Boolean);
  requireValue(reading.segments.at(-1)?.id === expectedLast, `${work.id} 末段锚点不一致`);

  files.push({
    id: work.id,
    slug: work.slug,
    workId: work.workId,
    language: work.language,
    parser: "bilara_series_root_json",
    parserOptions: {
      collectionPrefix: work.prefix,
      titleSuffixes: ["0.5", "0.4", "0.3", "0.2", "0.1", "0.0"],
      omitEmptySegments: true,
    },
    format: "application/json",
    completeness: "complete_multi_source_expression",
    sourceParts,
    presentation: {
      title: work.titleZh,
      alternateTitle: work.title,
      tradition: work.tradition,
      language: work.languageZh,
      canonRef: work.canonRef,
      translator: work.edition,
      summary: `完整保存 ${work.sourceRecordCount} 份固定 root 记录、${work.stableSegments} 个 Bilara 原生稳定段落；${work.omittedEmptySegments} 个上游空值仅从阅读层省略并在清单中保留。`,
      sourceUrl: work.sourceUrl,
    },
    relationDecision: "按 SuttaCentral 上游书级集合登记为巴利律藏表达；物理文件只作可复核来源记录，不作为独立作品计数。",
    verification: {
      segments: reading.segments.length,
      readingUnits: reading.navigation.length,
      sourceRecords: sourceFiles.length,
      anchors: [reading.segments[0].id, reading.segments.at(-1).id],
      omittedEmptySegmentIds: reading.omittedEmptySegmentIds,
      humanSampleVerified: false,
    },
  });
}

const manifest = {
  schema: "https://foxue.ai/schemas/corpus-asset-manifest-v0.5",
  version: batch.version,
  source: batch.source,
  rightsDecision: batch.rightsDecision,
  rightsAudit: batch.rightsAudit,
  normalization: batch.normalization,
  collection: batch.collection,
  files,
};
const serialized = `${JSON.stringify(manifest, null, 2)}\n`;
if (process.argv.includes("--verify")) {
  requireValue(await readFile(outputPath, "utf8") === serialized, "SuttaCentral vinaya-manifest-v1.4.0.json 与确定性输出不一致");
  console.log(`SuttaCentral 巴利律藏 root v${batch.version} 可复现：${files.length} 个表达、${batch.collection.sourceRecordCount} 份来源、${batch.collection.stableSegments} 个稳定段落。`);
} else {
  await writeFile(outputPath, serialized, "utf8");
  console.log(`SuttaCentral 巴利律藏 root v${batch.version} 已生成：${files.length} 个表达、${batch.collection.sourceRecordCount} 份来源、${batch.collection.stableSegments} 个稳定段落。`);
}

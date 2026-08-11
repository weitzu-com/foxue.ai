import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parseBilaraSeriesSources } from "../src/lib/bilara-reading.mjs";

const root = process.cwd();
const batchPath = resolve(root, "data/corpus/suttacentral/kn-batch-v1.2.0.json");
const outputPath = resolve(root, "data/corpus/suttacentral/kn-manifest-v1.2.0.json");
const batch = JSON.parse(await readFile(batchPath, "utf8"));
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const gitBlobSha1 = (value) => createHash("sha1").update(`blob ${value.length}\0`).update(value).digest("hex");
const filesByCollection = new Map();

for (const file of batch.files) {
  const collection = filesByCollection.get(file.collectionId) ?? [];
  collection.push(file);
  filesByCollection.set(file.collectionId, collection);
}
if (filesByCollection.size !== batch.collection.newBookCount) {
  throw new Error("SuttaCentral 《小部》新增书级集合数不一致");
}

const manifestFiles = [];
for (const book of batch.books.filter((candidate) => !candidate.reusedFromVersion)) {
  const bookFiles = filesByCollection.get(book.id);
  if (!bookFiles || bookFiles.length !== book.recordCount) throw new Error(`${book.id} 来源记录不完整`);
  const sources = [];
  const sourceParts = [];
  for (const [index, file] of bookFiles.entries()) {
    const local = await readFile(resolve(root, file.localPath));
    if (local.length !== file.localBytes || sha256(local) !== file.localSha256 || local.at(-1) !== 10) {
      throw new Error(`${file.id} 本地文件与固定批次不一致`);
    }
    const upstream = local.subarray(0, -1);
    if (
      upstream.length !== file.upstreamBytes || sha256(upstream) !== file.upstreamSha256 ||
      gitBlobSha1(upstream) !== file.upstreamGitBlobSha1
    ) throw new Error(`${file.id} 无法还原固定上游 Git 对象`);
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
      segments: file.segments,
    });
  }
  const reading = parseBilaraSeriesSources(sources, { collectionTitle: book.titlePali });
  if (
    reading.title !== book.titlePali || reading.collectionPrefix !== book.prefix ||
    reading.sourceRecords !== book.recordCount || reading.segments.length !== book.stableSegments ||
    reading.navigation.length !== book.readingUnits ||
    reading.segments[0]?.id !== bookFiles[0].firstSegmentId ||
    reading.segments.at(-1)?.id !== bookFiles.at(-1).lastSegmentId
  ) throw new Error(`${book.id} 结构与固定批次不一致`);

  manifestFiles.push({
    id: book.id,
    slug: bookFiles[0].slug,
    workId: bookFiles[0].workId,
    language: bookFiles[0].language,
    parser: bookFiles[0].parser,
    format: bookFiles[0].format,
    completeness: "complete",
    sourceParts,
    presentation: {
      title: `巴利《小部》· ${book.titleZh}`,
      alternateTitle: book.titlePali,
      tradition: "上座部佛教 · 小部",
      language: "巴利语（罗马字母）",
      canonRef: `SuttaCentral KN/${book.id}`,
      translator: bookFiles[0].edition,
      summary: `${book.scopeNoteZh} 本站保存 ${book.recordCount} 个可独立校验的 root 记录与 ${book.stableSegments} 个 Bilara 原生稳定段落。`,
      sourceUrl: `https://suttacentral.net/${book.prefix}/pli/ms`,
    },
    verification: {
      segments: reading.segments.length,
      readingUnits: reading.navigation.length,
      sourceRecords: book.recordCount,
      anchors: [reading.segments[0].id, reading.segments.at(-1).id],
      humanSampleVerified: false,
    },
  });
}

const manifest = {
  schema: "https://foxue.ai/schemas/corpus-asset-manifest-v0.4",
  version: batch.version,
  source: batch.source,
  rightsDecision: batch.rightsDecision,
  normalization: batch.normalization,
  collection: batch.collection,
  books: batch.books,
  files: manifestFiles,
};
const serialized = `${JSON.stringify(manifest, null, 2)}\n`;
if (process.argv.includes("--verify")) {
  if (await readFile(outputPath, "utf8") !== serialized) {
    throw new Error("SuttaCentral kn-manifest-v1.2.0.json 与确定性输出不一致");
  }
  console.log(`SuttaCentral 《小部》 v${batch.version} 可复现：新增 ${manifestFiles.length} 书、${batch.collection.newRecordCount} 个来源记录、${batch.collection.newStableSegments} 个稳定段落。`);
} else {
  await writeFile(outputPath, serialized, "utf8");
  console.log(`SuttaCentral 《小部》 v${batch.version} 已生成：新增 ${manifestFiles.length} 书、${batch.collection.newRecordCount} 个来源记录、${batch.collection.newStableSegments} 个稳定段落。`);
}

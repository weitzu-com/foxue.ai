import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parseBilaraDhammapadaSources } from "../src/lib/bilara-reading.mjs";

const root = process.cwd();
const batchPath = resolve(root, "data/corpus/suttacentral/batch-v0.7.0.json");
const outputPath = resolve(root, "data/corpus/suttacentral/manifest-v0.7.0.json");
const batch = JSON.parse(await readFile(batchPath, "utf8"));
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const gitBlobSha1 = (value) => createHash("sha1")
  .update(`blob ${value.length}\0`)
  .update(value)
  .digest("hex");
const sources = [];

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
  sources.push({ filename: file.localPath.split("/").at(-1), text: upstream.toString("utf8") });
}

const reading = parseBilaraDhammapadaSources(sources);
for (const [index, file] of batch.files.entries()) {
  const sourceSegments = reading.segments.filter(
    (segment) => segment.juan === String(index + 1).padStart(3, "0"),
  );
  if (
    sourceSegments.length !== file.segments ||
    sourceSegments[0]?.id !== file.firstSegmentId ||
    sourceSegments.at(-1)?.id !== file.lastSegmentId ||
    !reading.navigation.some((item) => item.juan === String(index + 1).padStart(3, "0"))
  ) {
    throw new Error(`${file.id} 结构与固定批次不一致`);
  }
}

const manifest = {
  schema: "https://foxue.ai/schemas/corpus-asset-manifest-v0.3",
  version: batch.version,
  source: batch.source,
  rightsDecision: batch.rightsDecision,
  normalization: batch.normalization,
  files: [
    {
      id: batch.work.canonId,
      slug: batch.work.localSlug,
      workId: batch.work.id,
      textFamilyId: batch.work.textFamilyId,
      language: batch.work.language,
      parser: "bilara_root_json",
      format: "application/json",
      completeness: "complete_multi_source_expression",
      sourceParts: batch.files.map((file) => ({ ...file, format: "application/json" })),
      presentation: {
        title: batch.work.titleZh,
        alternateTitle: batch.work.canonicalTitle,
        tradition: batch.work.tradition,
        language: "巴利语（罗马字母）",
        canonRef: "SuttaCentral DHP 1–423",
        translator: batch.work.edition,
        summary: "巴利三藏《小部》的法句偈集，共 26 品、423 偈；保留 SuttaCentral Bilara 原生段落标识。",
        sourceUrl: batch.work.sourceUrl,
      },
      verification: {
        segments: reading.segments.length,
        chapters: batch.files.length,
        readingUnits: reading.navigation.length,
        verseRange: [1, 423],
        anchors: ["dhp1:0.1", "dhp1:1", "dhp423:57"],
        humanSampleVerified: false,
      },
    },
  ],
};

const serialized = `${JSON.stringify(manifest, null, 2)}\n`;
if (process.argv.includes("--verify")) {
  if (await readFile(outputPath, "utf8") !== serialized) {
    throw new Error("SuttaCentral manifest-v0.7.0.json 与固定批次确定性输出不一致");
  }
  console.log(`SuttaCentral 受控目录 v${batch.version} 可复现：1 个完整文本、26 品、${reading.segments.length} 个原生段落。`);
} else {
  await writeFile(outputPath, serialized, "utf8");
  console.log(`SuttaCentral 受控目录 v${batch.version} 已生成：1 个完整文本、26 品、${reading.segments.length} 个原生段落。`);
}

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const batchPath = resolve(root, "data/corpus/sat/modern-japanese-batch-v1.0.0.json");
const catalogPath = resolve(root, "data/corpus/sat/modern-japanese-catalog-v1.0.0.json");
const manifestPath = resolve(root, "data/corpus/sat/modern-japanese-manifest-v1.0.0.json");
const batch = JSON.parse(await readFile(batchPath, "utf8"));
const requireUnique = (values, label) => {
  if (new Set(values).size !== values.length) throw new Error(`${label} 存在重複值`);
};

if (batch.version !== "1.0.0" || batch.files.length !== 4 || new Set(batch.files.map((file) => file.workId)).size !== 4) {
  throw new Error("SAT 現代日本語訳批次基線漂移");
}
requireUnique(batch.files.map((file) => file.id), "SAT 經號");
requireUnique(batch.files.map((file) => file.slug), "閱讀 slug");
requireUnique(batch.files.map((file) => file.localPath), "本地路徑");

const catalog = {
  schema: "https://foxue.ai/schemas/sat-modern-japanese-catalog-v0.1",
  version: batch.version,
  publishedAt: batch.publishedAt,
  source: {
    name: "SAT現代日本語訳仏典",
    site: "https://21dzk.l.u-tokyo.ac.jp/SATm/",
    commit: createHash("sha256").update(batch.files.map((file) => file.upstreamSha256).join("\n")).digest("hex"),
    copyrightUrl: "https://creativecommons.org/licenses/by/4.0/",
    collection: "SAT 現代日本語訳佛說經",
  },
  rightsDecision: {
    status: "approved_cc_by_4_with_attribution",
    category: batch.rightsCategory,
    commercialUse: "allowed_with_attribution",
    headerMustRemain: true,
    reviewedAt: "2026-08-24",
    note: "每個文件內的 Creative Commons Attribution 4.0 聲明與 SAT 研究会署名共同構成審核依據；不抓 SAT 2018 漢文本文庫。",
  },
  normalization: {
    id: "append-terminal-lf-v1",
    description: "僅在上游文件末尾追加一個 LF；TEI 內容、標記與頭部不變。",
  },
  files: batch.files.map((file) => {
    const { juanRange, juanSequence, ...verification } = file.verification;
    const [first, last] = juanRange;
    return {
      ...file,
      verification: {
        segments: verification.segments,
        folios: verification.folios,
        juans: juanSequence.map((juan) => String(juan).padStart(3, "0")),
        anchors: verification.anchors,
        humanSampleVerified: verification.humanSampleVerified,
      },
      juanRange: [first, last],
    };
  }),
};

const manifest = {
  schema: "https://foxue.ai/schemas/corpus-asset-manifest-v0.5",
  version: batch.version,
  source: catalog.source,
  rightsDecision: catalog.rightsDecision,
  normalization: catalog.normalization,
  collection: batch.collection,
  files: catalog.files,
};

const catalogRaw = `${JSON.stringify(catalog, null, 2)}\n`;
const manifestRaw = `${JSON.stringify(manifest, null, 2)}\n`;
if (process.argv.includes("--verify")) {
  if (await readFile(catalogPath, "utf8") !== catalogRaw) throw new Error("modern-japanese-catalog-v1.0.0.json 不可復現");
  if (await readFile(manifestPath, "utf8") !== manifestRaw) throw new Error("modern-japanese-manifest-v1.0.0.json 不可復現");
  console.log(`SAT 現代日本語訳目錄可復現：${catalog.files.length} 個表達、0 個新作品。`);
} else {
  await writeFile(catalogPath, catalogRaw, "utf8");
  await writeFile(manifestPath, manifestRaw, "utf8");
  console.log(`SAT 現代日本語訳目錄已寫入：${catalog.files.length} 個表達。`);
}

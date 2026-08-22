import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const batchPath = resolve(root, "data/corpus/cbeta/nanchuan-batch-v1.0.0.json");
const catalogPath = resolve(root, "data/corpus/cbeta/nanchuan-catalog-v1.0.0.json");
const manifestPath = resolve(root, "data/corpus/cbeta/nanchuan-manifest-v1.0.0.json");
const batch = JSON.parse(await readFile(batchPath, "utf8"));
const requireUnique = (values, label) => {
  if (new Set(values).size !== values.length) throw new Error(`${label} 存在重複值`);
};

if (batch.version !== "1.0.0" || batch.files.length !== 45 || new Set(batch.files.map((file) => file.workId)).size !== 17) {
  throw new Error("南傳經藏批次基線漂移");
}
requireUnique(batch.files.map((file) => file.id), "經號");
requireUnique(batch.files.map((file) => file.slug), "閱讀 slug");
requireUnique(batch.files.map((file) => file.localPath), "本地路徑");
requireUnique(batch.files.map((file) => file.upstreamPath), "上游路徑");

const catalog = {
  schema: "https://foxue.ai/schemas/cbeta-controlled-catalog-v0.2",
  version: batch.version,
  publishedAt: batch.publishedAt,
  source: {
    name: "CBETA XML P5",
    repository: "cbeta-org/xml-p5",
    commit: "2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9",
    copyrightUrl: "https://cbeta.org/copyright",
    formatUrl: "https://archive2.cbeta.org/en/format/xml.php",
    collection: "漢譯南傳大藏經（元亨寺版）",
  },
  rightsDecision: {
    status: "approved_noncommercial_with_attribution_and_header",
    category: batch.rightsCategory,
    commercialUse: "prohibited_without_additional_permission",
    headerMustRemain: true,
    reviewedAt: "2026-08-22",
    note: "每個文件內的 availability 聲明與 CBETA 官方版權頁共同構成審核依據；代碼許可證不覆蓋這些 XML。",
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
  if (await readFile(catalogPath, "utf8") !== catalogRaw) throw new Error("nanchuan-catalog-v1.0.0.json 不可復現");
  if (await readFile(manifestPath, "utf8") !== manifestRaw) throw new Error("nanchuan-manifest-v1.0.0.json 不可復現");
  console.log(`CBETA 南傳經藏目錄可復現：${catalog.files.length} 個表達、${batch.collection.controlledWorks} 個作品。`);
} else {
  await writeFile(catalogPath, catalogRaw, "utf8");
  await writeFile(manifestPath, manifestRaw, "utf8");
  console.log(`CBETA 南傳經藏目錄已生成：${catalog.files.length} 個表達、${batch.collection.controlledWorks} 個作品。`);
}

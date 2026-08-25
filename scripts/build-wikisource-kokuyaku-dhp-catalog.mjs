import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const batchPath = resolve(root, "data/corpus/wikisource/kokuyaku-dhp-batch-v1.0.0.json");
const catalogPath = resolve(root, "data/corpus/wikisource/kokuyaku-dhp-catalog-v1.0.0.json");
const manifestPath = resolve(root, "data/corpus/wikisource/kokuyaku-dhp-manifest-v1.0.0.json");
const batch = JSON.parse(await readFile(batchPath, "utf8"));

if (batch.version !== "1.0.0" || batch.files.length !== 1 || batch.collectionTotals.newWorks !== 0) {
  throw new Error("Wikisource 國譯法句經批次基線漂移");
}
if (batch.files[0].workId !== "gbcr:work:dhammapada-pali" || batch.files[0].attachToExistingWork !== true) {
  throw new Error("國譯法句經必須掛接既有巴利法句作品");
}

const catalog = {
  schema: "https://foxue.ai/schemas/wikisource-kokuyaku-dhp-catalog-v0.1",
  version: batch.version,
  publishedAt: batch.publishedAt,
  source: {
    name: "Wikisource 國譯法句經",
    site: "https://ja.wikisource.org/wiki/國譯法句經",
    commit: createHash("sha256").update(batch.files.map((file) => file.upstreamSha256).join("\n")).digest("hex"),
    copyrightUrl: "https://ja.wikisource.org/wiki/Template:PD-Japan-auto-expired",
    collection: batch.collection,
  },
  rightsDecision: {
    status: batch.rightsDecision.status,
    category: batch.rightsCategory,
    commercialUse: batch.rightsDecision.commercialUse,
    headerMustRemain: true,
    reviewedAt: batch.rightsDecision.reviewedAt,
    note: batch.rightsDecision.note,
    quotedFromPage: batch.rightsDecision.quotedFromPage,
    attribution: batch.rightsDecision.attribution,
  },
  normalization: {
    id: "wikisource-parse-to-tei-ruby-kana-v1",
    description: "從 Wikisource parse HTML 抽出校對正文，把 ruby 寫成漢字（假名），按 26 品與偈號編成與 sat_tei 相容的 TEI；不把 wiki 標記倒進公開頁。",
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
        verseCount: verification.verseCount,
        chapterCount: verification.chapterCount,
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
  if (await readFile(catalogPath, "utf8") !== catalogRaw) throw new Error("kokuyaku-dhp-catalog-v1.0.0.json 不可復現");
  if (await readFile(manifestPath, "utf8") !== manifestRaw) throw new Error("kokuyaku-dhp-manifest-v1.0.0.json 不可復現");
  console.log("Wikisource 國譯法句經目錄可復現：1 個表達、0 個新作品。");
} else {
  await writeFile(catalogPath, catalogRaw, "utf8");
  await writeFile(manifestPath, manifestRaw, "utf8");
  console.log("Wikisource 國譯法句經目錄已寫入：1 個表達。");
}

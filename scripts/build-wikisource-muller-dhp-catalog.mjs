import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const batchPath = resolve(root, "data/corpus/wikisource/muller-dhp-batch-v1.0.0.json");
const catalogPath = resolve(root, "data/corpus/wikisource/muller-dhp-catalog-v1.0.0.json");
const manifestPath = resolve(root, "data/corpus/wikisource/muller-dhp-manifest-v1.0.0.json");
const batch = JSON.parse(await readFile(batchPath, "utf8"));

if (batch.version !== "1.0.0" || batch.files.length !== 1 || batch.collectionTotals.newWorks !== 0) {
  throw new Error("Wikisource Müller Dhammapada 批次基线漂移");
}
if (batch.files[0].workId !== "gbcr:work:dhammapada-pali" || batch.files[0].attachToExistingWork !== true) {
  throw new Error("Müller Dhammapada 必须挂接既有巴利法句作品");
}

const catalog = {
  schema: "https://foxue.ai/schemas/wikisource-muller-dhp-catalog-v0.1",
  version: batch.version,
  publishedAt: batch.publishedAt,
  source: {
    name: "Wikisource Max Müller Dhammapada 1881",
    site: "https://en.wikisource.org/wiki/Dhammapada_(Muller)",
    commit: createHash("sha256").update(batch.files.map((file) => file.upstreamSha256).join("\n")).digest("hex"),
    copyrightUrl: "https://en.wikisource.org/wiki/Template:PD-old",
    collection: batch.collection,
  },
  rightsDecision: {
    status: batch.rightsDecision.status,
    category: batch.rightsCategory,
    commercialUse: batch.rightsDecision.commercialUse,
    redistribution: batch.rightsDecision.redistribution,
    headerMustRemain: true,
    reviewedAt: batch.rightsDecision.reviewedAt,
    note: batch.rightsDecision.note,
    workCategory: batch.rightsDecision.workCategory,
    authorCategory: batch.rightsDecision.authorCategory,
    publicationYear: batch.rightsDecision.publicationYear,
    translatorDeathYear: batch.rightsDecision.translatorDeathYear,
    attribution: batch.rightsDecision.attribution,
  },
  normalization: {
    id: "wikisource-wikitext-to-tei-verse-v1",
    description: "Freeze the complete Wikisource revision, preserve 26 chapter headings and all 423 verse numbers, group only the nine verse pairs already grouped by the source, and emit sat_tei-compatible TEI. The known Chapter XXVI template-label defect is recorded, not silently erased.",
  },
  files: batch.files.map((file) => {
    const { juanRange, juanSequence, ...verification } = file.verification;
    const [first, last] = juanRange;
    return {
      ...file,
      verification: {
        ...verification,
        juans: juanSequence.map((juan) => String(juan).padStart(3, "0")),
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
  if (await readFile(catalogPath, "utf8") !== catalogRaw) throw new Error("muller-dhp-catalog-v1.0.0.json 不可复现");
  if (await readFile(manifestPath, "utf8") !== manifestRaw) throw new Error("muller-dhp-manifest-v1.0.0.json 不可复现");
  console.log("Wikisource Müller Dhammapada 目录可复现：1 个英语表达、0 个新作品。");
} else {
  await writeFile(catalogPath, catalogRaw, "utf8");
  await writeFile(manifestPath, manifestRaw, "utf8");
  console.log("Wikisource Müller Dhammapada 目录已写入：1 个英语表达。");
}

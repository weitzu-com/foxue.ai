import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const batchPath = resolve(root, "data/corpus/gutenberg/diamond-sutra-gemmell-batch-v1.0.0.json");
const catalogPath = resolve(root, "data/corpus/gutenberg/diamond-sutra-gemmell-catalog-v1.0.0.json");
const manifestPath = resolve(root, "data/corpus/gutenberg/diamond-sutra-gemmell-manifest-v1.0.0.json");
const batch = JSON.parse(await readFile(batchPath, "utf8"));

if (batch.version !== "1.0.0" || batch.files.length !== 1 || batch.collectionTotals.newWorks !== 0) {
  throw new Error("Project Gutenberg Gemmell《金刚经》批次基线漂移");
}
if (
  batch.files[0].workId !== "gbcr:work:vajracchedika-prajnaparamita"
  || batch.files[0].attachToExistingWork !== true
) {
  throw new Error("Gemmell《金刚经》必须挂接既有 Vajracchedikā 作品");
}

const catalog = {
  schema: "https://foxue.ai/schemas/gutenberg-diamond-gemmell-catalog-v0.1",
  version: batch.version,
  publishedAt: batch.publishedAt,
  source: {
    name: "Project Gutenberg William Gemmell Diamond Sutra 1912",
    site: "https://www.gutenberg.org/ebooks/64623",
    commit: createHash("sha256").update(batch.files.map((file) => file.upstreamSha256).join("\n")).digest("hex"),
    copyrightUrl: "https://www.gutenberg.org/policy/permission.html",
    collection: batch.collection,
  },
  rightsDecision: {
    ...batch.rightsDecision,
    headerMustRemain: true,
  },
  normalization: {
    id: "gutenberg-plain-text-to-tei-scripture-body-v1",
    description: "Freeze Project Gutenberg eBook 64623, retain only Gemmell's translated scripture body, preserve all source paragraphs and the combined Chapter 3 and 4 boundary, remove numeric note calls and formatting underscores, and emit sat_tei-compatible TEI. Introduction, commentary, footnotes, index, and Project Gutenberg license text are excluded from the reading body.",
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
  if (await readFile(catalogPath, "utf8") !== catalogRaw) throw new Error("diamond-sutra-gemmell-catalog-v1.0.0.json 不可复现");
  if (await readFile(manifestPath, "utf8") !== manifestRaw) throw new Error("diamond-sutra-gemmell-manifest-v1.0.0.json 不可复现");
  console.log("Project Gutenberg Gemmell《金刚经》目录可复现：1 个英语表达、0 个新作品。");
} else {
  await writeFile(catalogPath, catalogRaw, "utf8");
  await writeFile(manifestPath, manifestRaw, "utf8");
  console.log("Project Gutenberg Gemmell《金刚经》目录已写入：1 个英语表达。");
}

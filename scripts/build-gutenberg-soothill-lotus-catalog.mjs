import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const batchPath = resolve(root, "data/corpus/gutenberg/lotus-sutra-soothill-batch-v1.0.0.json");
const catalogPath = resolve(root, "data/corpus/gutenberg/lotus-sutra-soothill-catalog-v1.0.0.json");
const manifestPath = resolve(root, "data/corpus/gutenberg/lotus-sutra-soothill-manifest-v1.0.0.json");
const batch = JSON.parse(await readFile(batchPath, "utf8"));

if (
  batch.version !== "1.0.0"
  || batch.files.length !== 1
  || batch.collectionTotals.newWorks !== 0
  || batch.collectionTotals.unabridgedTranslations !== 0
) {
  throw new Error("Project Gutenberg Soothill《法华经》节本批次基线漂移");
}
if (
  batch.files[0].workId !== "gbcr:work:saddharma-pundarika-t0262"
  || batch.files[0].attachToExistingWork !== true
  || batch.files[0].verification.isAbridged !== true
) {
  throw new Error("Soothill《法华经》必须作为明确删节的英语表达挂接既有 T0262 作品");
}

const catalog = {
  schema: "https://foxue.ai/schemas/gutenberg-lotus-soothill-catalog-v0.1",
  version: batch.version,
  publishedAt: batch.publishedAt,
  source: {
    name: "Project Gutenberg W. E. Soothill Lotus Sutra 1930",
    site: "https://www.gutenberg.org/ebooks/79267",
    commit: createHash("sha256").update(batch.files.map((file) => file.upstreamSha256).join("\n")).digest("hex"),
    copyrightUrl: "https://www.gutenberg.org/policy/permission.html",
    collection: batch.collection,
  },
  rightsDecision: {
    ...batch.rightsDecision,
    headerMustRemain: true,
  },
  normalization: {
    id: "gutenberg-soothill-lotus-plain-text-to-tei-v1",
    description: "Freeze Project Gutenberg eBook 79267, retain the complete 28-chapter reading body of Soothill's explicitly abridged Lotus Sutra edition, preserve source paragraph order and responsibility, remove illustrations and transcriber correction notes, and emit sat_tei-compatible TEI. Preface, introductions, glossary, index, notes, and Project Gutenberg license text are excluded from the reading body.",
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
  if (await readFile(catalogPath, "utf8") !== catalogRaw) throw new Error("lotus-sutra-soothill-catalog-v1.0.0.json 不可复现");
  if (await readFile(manifestPath, "utf8") !== manifestRaw) throw new Error("lotus-sutra-soothill-manifest-v1.0.0.json 不可复现");
  console.log("Project Gutenberg Soothill《法华经》节本目录可复现：1 个英语表达、0 个新作品。");
} else {
  await writeFile(catalogPath, catalogRaw, "utf8");
  await writeFile(manifestPath, manifestRaw, "utf8");
  console.log("Project Gutenberg Soothill《法华经》节本目录已写入：1 个英语表达。");
}

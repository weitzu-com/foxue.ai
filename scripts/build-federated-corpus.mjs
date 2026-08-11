import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const inputs = {
  base: "data/gbcr/registry-v1.1.0.json",
  snapshots: "data/gbcr/source-snapshots-v0.2.1.json",
  inventory: "data/gbcr/cbeta-taisho-sutra-inventory-v0.2.1.json",
  dhammapadaBatch: "data/corpus/suttacentral/batch-v0.7.0.json",
  dhammapadaManifest: "data/corpus/suttacentral/manifest-v0.7.0.json",
  dighaBatch: "data/corpus/suttacentral/dn-batch-v0.8.0.json",
  dighaManifest: "data/corpus/suttacentral/dn-manifest-v0.8.0.json",
  majjhimaBatch: "data/corpus/suttacentral/mn-batch-v0.9.0.json",
  majjhimaManifest: "data/corpus/suttacentral/mn-manifest-v0.9.0.json",
  samyuttaBatch: "data/corpus/suttacentral/sn-batch-v1.0.0.json",
  samyuttaManifest: "data/corpus/suttacentral/sn-manifest-v1.0.0.json",
  anguttaraBatch: "data/corpus/suttacentral/an-batch-v1.1.0.json",
  anguttaraManifest: "data/corpus/suttacentral/an-manifest-v1.1.0.json",
  khuddakaBatch: "data/corpus/suttacentral/kn-batch-v1.2.0.json",
  khuddakaManifest: "data/corpus/suttacentral/kn-manifest-v1.2.0.json",
};
const entries = await Promise.all(Object.entries(inputs).map(async ([id, relativePath]) => [
  id,
  relativePath,
  await readFile(resolve(root, relativePath), "utf8"),
]));
const rawById = Object.fromEntries(entries.map(([id, , raw]) => [id, raw]));
const base = JSON.parse(rawById.base);
const dighaBatch = JSON.parse(rawById.dighaBatch);
const dighaManifest = JSON.parse(rawById.dighaManifest);
const majjhimaBatch = JSON.parse(rawById.majjhimaBatch);
const majjhimaManifest = JSON.parse(rawById.majjhimaManifest);
const samyuttaBatch = JSON.parse(rawById.samyuttaBatch);
const samyuttaManifest = JSON.parse(rawById.samyuttaManifest);
const anguttaraBatch = JSON.parse(rawById.anguttaraBatch);
const anguttaraManifest = JSON.parse(rawById.anguttaraManifest);
const khuddakaBatch = JSON.parse(rawById.khuddakaBatch);
const khuddakaManifest = JSON.parse(rawById.khuddakaManifest);
const outputPath = resolve(root, "data/gbcr/registry-v1.2.0.json");
const checksumPath = resolve(root, "data/gbcr/checksums-v1.2.0.sha256");
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

if (
  dighaManifest.source.commit !== dighaBatch.source.commit ||
  dighaManifest.files.length !== 34 ||
  dighaManifest.collection.stableSegments !== 16401 ||
  dighaManifest.collection.sourceBytes !== 1820223
) {
  throw new Error("SuttaCentral 《长部》固定批次、清单或结构统计不一致");
}
if (
  majjhimaManifest.source.commit !== majjhimaBatch.source.commit ||
  majjhimaManifest.source.commit !== dighaManifest.source.commit ||
  majjhimaManifest.files.length !== 152 ||
  majjhimaManifest.collection.stableSegments !== 27195 ||
  majjhimaManifest.collection.sourceBytes !== 3072235
) {
  throw new Error("SuttaCentral 《中部》固定批次、清单或结构统计不一致");
}
if (
  samyuttaManifest.source.commit !== samyuttaBatch.source.commit ||
  samyuttaManifest.source.commit !== dighaManifest.source.commit ||
  samyuttaManifest.files.length !== 56 ||
  samyuttaManifest.collection.recordCount !== 1819 ||
  samyuttaManifest.collection.representedSuttas !== 3024 ||
  samyuttaManifest.collection.stableSegments !== 43466 ||
  samyuttaManifest.collection.sourceBytes !== 3765299 ||
  samyuttaManifest.collection.emptySegmentIds !== 2
) {
  throw new Error("SuttaCentral 《相应部》固定批次、清单或结构统计不一致");
}
if (
  anguttaraManifest.source.commit !== anguttaraBatch.source.commit ||
  anguttaraManifest.source.commit !== dighaManifest.source.commit ||
  anguttaraManifest.files.length !== 11 ||
  anguttaraManifest.collection.recordCount !== 1408 ||
  anguttaraManifest.collection.representedSuttas !== 8122 ||
  anguttaraManifest.collection.stableSegments !== 41839 ||
  anguttaraManifest.collection.sourceBytes !== 4074931 ||
  anguttaraManifest.collection.emptySegmentIds !== 4
) {
  throw new Error("SuttaCentral 《增支部》固定批次、清单或结构统计不一致");
}
if (
  khuddakaManifest.source.commit !== khuddakaBatch.source.commit ||
  khuddakaManifest.source.commit !== dighaManifest.source.commit ||
  khuddakaManifest.files.length !== 19 ||
  khuddakaManifest.collection.bookCount !== 20 ||
  khuddakaManifest.collection.newBookCount !== 19 ||
  khuddakaManifest.collection.recordCount !== 2351 ||
  khuddakaManifest.collection.newRecordCount !== 2325 ||
  khuddakaManifest.collection.sourceBytes !== 10053548 ||
  khuddakaManifest.collection.newSourceBytes !== 9953598 ||
  khuddakaManifest.collection.stableSegments !== 155801 ||
  khuddakaManifest.collection.newStableSegments !== 153567
) {
  throw new Error("SuttaCentral 《小部》固定批次、清单或结构统计不一致");
}

const khuddakaWorks = khuddakaManifest.files.map((file) => {
  const book = khuddakaManifest.books.find((candidate) => candidate.id === file.id);
  if (!book) throw new Error(`${file.id} 缺少《小部》书级元数据`);
  return {
    id: file.workId,
    workType: "canonical_text_collection",
    canonicalTitle: file.presentation.alternateTitle,
    canonicalTitleZh: file.presentation.title,
    traditions: ["上座部佛教"],
    externalIds: {
      suttacentralCollection: [book.prefix],
      suttacentralSourceRecords: file.sourceParts.map((source) => source.id.toLowerCase()),
    },
    relationDecision: `${book.scopeNoteZh} 作为巴利《小部》的书级文本集合登记；物理 root 记录与规范作品分开计数，不因其位于同一目录就声称全部为佛陀亲说或在所有传承中具有相同正典地位。`,
    expressions: [
      {
        id: `gbcr:expression:${file.id}-pi-Latn-ms`,
        language: file.language,
        title: file.presentation.alternateTitle,
        edition: file.presentation.translator,
        sourceSnapshotId: "suttacentral_bilara",
        localSlug: file.slug,
        cataloged: true,
        fullSourceText: true,
        sampled: false,
        stableSegments: file.verification.segments,
        rightsReviewed: true,
        qualityStatus: "verified_structure_and_anchors",
        sourceTextAssets: file.sourceParts.map((source) => ({
          path: source.localPath,
          format: source.format,
          sha256: source.localSha256,
          rightsStatus: "public_domain",
        })),
      },
    ],
  };
});

const sourceFamilies = base.sourceFamilies.map((family) =>
  family.id === "suttacentral_early_buddhist_texts"
    ? {
        ...family,
        denominatorStatus: "candidate_snapshot_with_controlled_collections",
        controlledWorks: 273,
        controlledExpressions: 273,
        controlledRootRecords: 5764,
        controlledRootBytes: 22786236,
        controlledSuttaRootRecords: 5764,
        suttaRootRecordDenominator: 5764,
        suttaRootRecordPercentage: 100,
        denominatorWorks: null,
        denominatorNote: "固定提交含 7,288 条巴利 root 候选记录，其中经藏目录为 5,764 条，现已逐条受控（100%）；其余 1,102 条论藏与 422 条律藏不混入经藏完成率。当前 273 个书级或经级作品登记保留物理记录、经号、文本集合与作品层的区别。",
      }
    : family,
);

const registry = {
  ...base,
  registry: { ...base.registry, version: "1.2.0", publishedAt: "2026-08-12" },
  sourceFamilies,
  works: [...base.works, ...khuddakaWorks],
};
const registryRaw = `${JSON.stringify(registry, null, 2)}\n`;
const checksumRaw = [
  `${sha256(registryRaw)}  registry-v1.2.0.json`,
  ...entries.slice(1).map(([, relativePath, raw]) => `${sha256(raw)}  ${relativePath.split("/").at(-1)}`),
].join("\n") + "\n";

if (process.argv.includes("--verify")) {
  if (await readFile(outputPath, "utf8") !== registryRaw) throw new Error("registry-v1.2.0.json 不可复现");
  if (await readFile(checksumPath, "utf8") !== checksumRaw) throw new Error("checksums-v1.2.0.sha256 不可复现");
  console.log("跨语种登记册 v1.2.0 可复现：294 部作品、298 个文本表达。");
} else {
  await writeFile(outputPath, registryRaw, "utf8");
  await writeFile(checksumPath, checksumRaw, "utf8");
  console.log("跨语种登记册 v1.2.0 已生成：新增巴利《小部》19 个书级文本集合，经藏 root 记录完成 100%。");
}

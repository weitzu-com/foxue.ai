import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const inputs = {
  base: "data/gbcr/registry-v0.9.0.json",
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
const outputPath = resolve(root, "data/gbcr/registry-v1.0.0.json");
const checksumPath = resolve(root, "data/gbcr/checksums-v1.0.0.sha256");
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

const samyuttaWorks = samyuttaManifest.files.map((file) => ({
  id: file.workId,
  workType: "canonical_sutta_collection",
  canonicalTitle: file.presentation.alternateTitle,
  canonicalTitleZh: file.presentation.title,
  traditions: ["上座部佛教"],
  externalIds: {
    suttacentralCollection: [file.id.toLowerCase()],
    suttacentralSourceRecords: file.sourceParts.map((source) => source.id.toLowerCase()),
  },
  relationDecision: "作为巴利《相应部》的相应级经集登记；物理 root 记录、连续表示的经号与规范作品分别计数；未经学术复核，不自动声称与汉译《杂阿含经》或其他语种文本逐段对应。",
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
}));

const sourceFamilies = base.sourceFamilies.map((family) =>
  family.id === "suttacentral_early_buddhist_texts"
    ? {
        ...family,
        denominatorStatus: "candidate_snapshot_with_controlled_collections",
        controlledWorks: 243,
        controlledExpressions: 243,
        controlledRootRecords: 2031,
        controlledRootBytes: 8757707,
        denominatorWorks: null,
        denominatorNote: "7,288 是固定提交中的巴利 root 候选记录；当前 2,031 个物理文件组成《法句经》《长部》34 经、《中部》152 经与《相应部》56 个相应级经集，并连续表示《相应部》3,024 个经号；文件数、经号数与作品数不得混用。",
      }
    : family,
);

const registry = {
  ...base,
  registry: { ...base.registry, version: "1.0.0", publishedAt: "2026-08-12" },
  sourceFamilies,
  works: [...base.works, ...samyuttaWorks],
};
const registryRaw = `${JSON.stringify(registry, null, 2)}\n`;
const checksumRaw = [
  `${sha256(registryRaw)}  registry-v1.0.0.json`,
  ...entries.slice(1).map(([, relativePath, raw]) => `${sha256(raw)}  ${relativePath.split("/").at(-1)}`),
].join("\n") + "\n";

if (process.argv.includes("--verify")) {
  if (await readFile(outputPath, "utf8") !== registryRaw) throw new Error("registry-v1.0.0.json 不可复现");
  if (await readFile(checksumPath, "utf8") !== checksumRaw) throw new Error("checksums-v1.0.0.sha256 不可复现");
  console.log("跨语种登记册 v1.0.0 可复现：264 部作品、268 个文本表达。");
} else {
  await writeFile(outputPath, registryRaw, "utf8");
  await writeFile(checksumPath, checksumRaw, "utf8");
  console.log("跨语种登记册 v1.0.0 已生成：新增巴利《相应部》56 个相应级经集。");
}

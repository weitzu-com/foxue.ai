import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const baseRegistryPath = resolve(root, "data/gbcr/registry-v0.6.0.json");
const sourceSnapshotsPath = resolve(root, "data/gbcr/source-snapshots-v0.2.1.json");
const inventoryPath = resolve(root, "data/gbcr/cbeta-taisho-sutra-inventory-v0.2.1.json");
const suttaBatchPath = resolve(root, "data/corpus/suttacentral/batch-v0.7.0.json");
const suttaManifestPath = resolve(root, "data/corpus/suttacentral/manifest-v0.7.0.json");
const outputPath = resolve(root, "data/gbcr/registry-v0.7.0.json");
const checksumPath = resolve(root, "data/gbcr/checksums-v0.7.0.sha256");
const [baseRaw, snapshotsRaw, inventoryRaw, suttaBatchRaw, suttaManifestRaw] = await Promise.all([
  readFile(baseRegistryPath, "utf8"),
  readFile(sourceSnapshotsPath, "utf8"),
  readFile(inventoryPath, "utf8"),
  readFile(suttaBatchPath, "utf8"),
  readFile(suttaManifestPath, "utf8"),
]);
const base = JSON.parse(baseRaw);
const suttaBatch = JSON.parse(suttaBatchRaw);
const suttaManifest = JSON.parse(suttaManifestRaw);
const sourceFile = suttaManifest.files[0];
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

if (
  suttaManifest.source.commit !== suttaBatch.source.commit ||
  sourceFile.sourceParts.length !== 26 ||
  sourceFile.verification.segments !== 2234
) {
  throw new Error("SuttaCentral 固定批次、清单或结构统计不一致");
}

const textFamilyId = "gbcr:text-family:dhammapada";
const chineseWorkId = "gbcr:work:dharmapada-t0210";
const paliWork = {
  id: suttaBatch.work.id,
  textFamilyId,
  workType: "distinct_recension",
  canonicalTitle: suttaBatch.work.canonicalTitle,
  canonicalTitleZh: suttaBatch.work.titleZh,
  traditions: ["上座部佛教"],
  externalIds: suttaBatch.work.externalIds,
  relationDecision: "与汉译 T0210 同属法句文本家族；结构与内容不完全相同，不声明为同一作品的逐句翻译。",
  expressions: [
    {
      id: "gbcr:expression:DHP-pi-Latn-ms",
      language: suttaBatch.work.language,
      title: suttaBatch.work.canonicalTitle,
      edition: suttaBatch.work.edition,
      sourceSnapshotId: "suttacentral_bilara",
      localSlug: suttaBatch.work.localSlug,
      cataloged: true,
      fullSourceText: true,
      sampled: false,
      stableSegments: sourceFile.verification.segments,
      rightsReviewed: true,
      qualityStatus: "verified_structure_and_anchors",
      sourceTextAssets: sourceFile.sourceParts.map((part) => ({
        part: part.part,
        id: part.id,
        path: part.localPath,
        format: part.format,
        sha256: part.localSha256,
        rightsStatus: "public_domain",
      })),
    },
  ],
};

const works = base.works.map((work) => work.id === chineseWorkId
  ? {
      ...work,
      textFamilyId,
      workType: "distinct_recension",
      relationDecision: "与巴利 DHP 同属法句文本家族；汉译本为 39 品，不建立未经学术复核的逐章或逐段等同关系。",
    }
  : work);
works.push(paliWork);

const sourceFamilies = base.sourceFamilies.map((family) =>
  family.id === "suttacentral_early_buddhist_texts"
    ? {
        ...family,
        denominatorStatus: "candidate_snapshot_with_controlled_pilot",
        controlledWorks: 1,
        controlledExpressions: 1,
        controlledRootRecords: sourceFile.sourceParts.length,
        controlledRootBytes: sourceFile.sourceParts.reduce((sum, part) => sum + part.upstreamBytes, 0),
        denominatorWorks: null,
        denominatorNote: "7,288 是固定提交中的巴利 root 候选记录；本批 26 个物理文件合成 1 部《法句经》，文件数不是作品数。",
      }
    : family,
);

const registry = {
  ...base,
  registry: { ...base.registry, version: "0.7.0", publishedAt: "2026-08-11" },
  sourceFamilies,
  textFamilies: [
    {
      id: textFamilyId,
      canonicalLabel: "Dhammapada / Dharmapada 法句文本家族",
      relationType: "related_recensions",
      members: [
        { workId: chineseWorkId, tradition: "汉传佛教", externalId: "T0210" },
        { workId: paliWork.id, tradition: "上座部佛教", externalId: "SuttaCentral dhp" },
      ],
      alignmentStatus: "family_level_only",
      alignmentPolicy: "只有经过可引用研究或人工复核的对应关系才能进入平行段落层；共同题名或相似偈颂不自动等同。",
    },
  ],
  parallelRelations: [
    {
      id: "gbcr:parallel:dhammapada-t0210-dhp",
      familyId: textFamilyId,
      members: [chineseWorkId, paliWork.id],
      relation: "related_recensions",
      segmentAlignment: "not_asserted",
      note: "当前只发布文本家族关系，不发布自动生成的逐章或逐偈对应。",
    },
  ],
  works,
};

const registryRaw = `${JSON.stringify(registry, null, 2)}\n`;
const checksumRaw = [
  `${sha256(registryRaw)}  registry-v0.7.0.json`,
  `${sha256(snapshotsRaw)}  source-snapshots-v0.2.1.json`,
  `${sha256(inventoryRaw)}  cbeta-taisho-sutra-inventory-v0.2.1.json`,
  `${sha256(suttaBatchRaw)}  suttacentral-batch-v0.7.0.json`,
  `${sha256(suttaManifestRaw)}  suttacentral-manifest-v0.7.0.json`,
].join("\n") + "\n";

if (process.argv.includes("--verify")) {
  if (await readFile(outputPath, "utf8") !== registryRaw) throw new Error("registry-v0.7.0.json 不可复现");
  if (await readFile(checksumPath, "utf8") !== checksumRaw) throw new Error("checksums-v0.7.0.sha256 不可复现");
  console.log("跨语种登记册 v0.7.0 可复现：22 部作品、26 个文本表达。 ");
} else {
  await writeFile(outputPath, registryRaw, "utf8");
  await writeFile(checksumPath, checksumRaw, "utf8");
  console.log("跨语种登记册 v0.7.0 已生成：法句文本家族保留两个独立传本。 ");
}

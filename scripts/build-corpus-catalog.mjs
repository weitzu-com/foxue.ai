import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { buildPageNavigation, parseCbetaReadingLines } from "../src/lib/cbeta-tei.mjs";

const root = process.cwd();
const outputVersion = "3.7.0";
const catalogPath = resolve(root, "data/corpus/cbeta/catalog-v3.7.0.json");
const agamaBatchPath = resolve(root, "data/corpus/cbeta/batch-v1.3.0.json");
const benyuanBatchPath = resolve(root, "data/corpus/cbeta/batch-v1.4.0.json");
const prajnaparamitaBatchPath = resolve(root, "data/corpus/cbeta/batch-v1.5.0.json");
const lotusBatchPath = resolve(root, "data/corpus/cbeta/batch-v1.6.0.json");
const avatamsakaBatchPath = resolve(root, "data/corpus/cbeta/batch-v1.7.0.json");
const ratnakutaBatchPath = resolve(root, "data/corpus/cbeta/batch-v1.8.0.json");
const t12BatchPath = resolve(root, "data/corpus/cbeta/batch-v1.9.0.json");
const t13BatchPath = resolve(root, "data/corpus/cbeta/batch-v2.0.0.json");
const t14BatchPath = resolve(root, "data/corpus/cbeta/batch-v2.1.0.json");
const t15BatchPath = resolve(root, "data/corpus/cbeta/batch-v2.2.0.json");
const t16BatchPath = resolve(root, "data/corpus/cbeta/batch-v2.3.0.json");
const t17BatchPath = resolve(root, "data/corpus/cbeta/batch-v2.4.0.json");
const t18BatchPath = resolve(root, "data/corpus/cbeta/batch-v2.5.0.json");
const t19BatchPath = resolve(root, "data/corpus/cbeta/batch-v2.6.0.json");
const t20BatchPath = resolve(root, "data/corpus/cbeta/batch-v2.7.0.json");
const t21BatchPath = resolve(root, "data/corpus/cbeta/batch-v2.8.0.json");
const t22BatchPath = resolve(root, "data/corpus/cbeta/batch-v2.9.0.json");
const t23BatchPath = resolve(root, "data/corpus/cbeta/batch-v3.0.0.json");
const t24BatchPath = resolve(root, "data/corpus/cbeta/batch-v3.1.0.json");
const t25BatchPath = resolve(root, "data/corpus/cbeta/batch-v3.2.0.json");
const t26BatchPath = resolve(root, "data/corpus/cbeta/batch-v3.3.0.json");
const t27BatchPath = resolve(root, "data/corpus/cbeta/batch-v3.4.0.json");
const t28BatchPath = resolve(root, "data/corpus/cbeta/batch-v3.5.0.json");
const t29BatchPath = resolve(root, "data/corpus/cbeta/batch-v3.6.0.json");
const t30BatchPath = resolve(root, "data/corpus/cbeta/batch-v3.7.0.json");
const snapshotPath = resolve(root, "data/gbcr/source-snapshots-v1.8.0.json");
const inventoryPath = resolve(root, "data/gbcr/cbeta-taisho-sutra-inventory-v0.2.1.json");
const t18InventoryPath = resolve(root, "data/gbcr/cbeta-taisho-t18-inventory-v0.1.0.json");
const t19InventoryPath = resolve(root, "data/gbcr/cbeta-taisho-t19-inventory-v0.1.0.json");
const t20InventoryPath = resolve(root, "data/gbcr/cbeta-taisho-t20-inventory-v0.1.0.json");
const t21InventoryPath = resolve(root, "data/gbcr/cbeta-taisho-t21-inventory-v0.1.0.json");
const t22InventoryPath = resolve(root, "data/gbcr/cbeta-taisho-t22-inventory-v0.1.0.json");
const t23InventoryPath = resolve(root, "data/gbcr/cbeta-taisho-t23-inventory-v0.1.0.json");
const t24InventoryPath = resolve(root, "data/gbcr/cbeta-taisho-t24-inventory-v0.1.0.json");
const t25InventoryPath = resolve(root, "data/gbcr/cbeta-taisho-t25-inventory-v0.1.0.json");
const t26InventoryPath = resolve(root, "data/gbcr/cbeta-taisho-t26-inventory-v0.1.0.json");
const t27InventoryPath = resolve(root, "data/gbcr/cbeta-taisho-t27-inventory-v0.1.0.json");
const t28InventoryPath = resolve(root, "data/gbcr/cbeta-taisho-t28-inventory-v0.1.0.json");
const t29InventoryPath = resolve(root, "data/gbcr/cbeta-taisho-t29-inventory-v0.1.0.json");
const t30InventoryPath = resolve(root, "data/gbcr/cbeta-taisho-t30-inventory-v0.1.0.json");
const previousRegistryPath = resolve(root, "data/gbcr/registry-v0.1.0.json");
const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
const agamaBatch = JSON.parse(await readFile(agamaBatchPath, "utf8"));
const benyuanBatch = JSON.parse(await readFile(benyuanBatchPath, "utf8"));
const prajnaparamitaBatch = JSON.parse(await readFile(prajnaparamitaBatchPath, "utf8"));
const lotusBatch = JSON.parse(await readFile(lotusBatchPath, "utf8"));
const avatamsakaBatch = JSON.parse(await readFile(avatamsakaBatchPath, "utf8"));
const ratnakutaBatch = JSON.parse(await readFile(ratnakutaBatchPath, "utf8"));
const t12Batch = JSON.parse(await readFile(t12BatchPath, "utf8"));
const t13Batch = JSON.parse(await readFile(t13BatchPath, "utf8"));
const t14Batch = JSON.parse(await readFile(t14BatchPath, "utf8"));
const t15Batch = JSON.parse(await readFile(t15BatchPath, "utf8"));
const t16Batch = JSON.parse(await readFile(t16BatchPath, "utf8"));
const t17Batch = JSON.parse(await readFile(t17BatchPath, "utf8"));
const t18Batch = JSON.parse(await readFile(t18BatchPath, "utf8"));
const t19Batch = JSON.parse(await readFile(t19BatchPath, "utf8"));
const t20Batch = JSON.parse(await readFile(t20BatchPath, "utf8"));
const t21Batch = JSON.parse(await readFile(t21BatchPath, "utf8"));
const t22Batch = JSON.parse(await readFile(t22BatchPath, "utf8"));
const t23Batch = JSON.parse(await readFile(t23BatchPath, "utf8"));
const t24Batch = JSON.parse(await readFile(t24BatchPath, "utf8"));
const t25Batch = JSON.parse(await readFile(t25BatchPath, "utf8"));
const t26Batch = JSON.parse(await readFile(t26BatchPath, "utf8"));
const t27Batch = JSON.parse(await readFile(t27BatchPath, "utf8"));
const t28Batch = JSON.parse(await readFile(t28BatchPath, "utf8"));
const t29Batch = JSON.parse(await readFile(t29BatchPath, "utf8"));
const t30Batch = JSON.parse(await readFile(t30BatchPath, "utf8"));
const snapshots = JSON.parse(await readFile(snapshotPath, "utf8"));
const inventoryRaw = await readFile(inventoryPath, "utf8");
const inventory = JSON.parse(inventoryRaw);
const t18InventoryRaw = await readFile(t18InventoryPath, "utf8");
const t18Inventory = JSON.parse(t18InventoryRaw);
const t19InventoryRaw = await readFile(t19InventoryPath, "utf8");
const t19Inventory = JSON.parse(t19InventoryRaw);
const t20InventoryRaw = await readFile(t20InventoryPath, "utf8");
const t20Inventory = JSON.parse(t20InventoryRaw);
const t21InventoryRaw = await readFile(t21InventoryPath, "utf8");
const t21Inventory = JSON.parse(t21InventoryRaw);
const t22InventoryRaw = await readFile(t22InventoryPath, "utf8");
const t22Inventory = JSON.parse(t22InventoryRaw);
const t23InventoryRaw = await readFile(t23InventoryPath, "utf8");
const t23Inventory = JSON.parse(t23InventoryRaw);
const t24InventoryRaw = await readFile(t24InventoryPath, "utf8");
const t24Inventory = JSON.parse(t24InventoryRaw);
const t25InventoryRaw = await readFile(t25InventoryPath, "utf8");
const t25Inventory = JSON.parse(t25InventoryRaw);
const t26InventoryRaw = await readFile(t26InventoryPath, "utf8");
const t26Inventory = JSON.parse(t26InventoryRaw);
const t27InventoryRaw = await readFile(t27InventoryPath, "utf8");
const t27Inventory = JSON.parse(t27InventoryRaw);
const t28InventoryRaw = await readFile(t28InventoryPath, "utf8");
const t28Inventory = JSON.parse(t28InventoryRaw);
const t29InventoryRaw = await readFile(t29InventoryPath, "utf8");
const t29Inventory = JSON.parse(t29InventoryRaw);
const t30InventoryRaw = await readFile(t30InventoryPath, "utf8");
const t30Inventory = JSON.parse(t30InventoryRaw);
const previousRegistry = JSON.parse(await readFile(previousRegistryPath, "utf8"));
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const requireUnique = (values, label) => {
  if (new Set(values).size !== values.length) throw new Error(`${label} 存在重复值`);
};
const sourceUnits = (file) => file.sourceParts ?? [file];

requireUnique(catalog.files.map((file) => file.id), "经号");
requireUnique(catalog.files.map((file) => file.slug), "阅读 slug");
const catalogSourceUnits = catalog.files.flatMap(sourceUnits);
requireUnique(catalogSourceUnits.map((file) => file.id), "来源资产标识");
requireUnique(catalogSourceUnits.map((file) => file.localPath), "本地路径");
requireUnique(catalogSourceUnits.map((file) => file.upstreamPath), "上游路径");
const cbetaSnapshotSource = snapshots.sources.find((source) => source.id === "cbeta_xml_p5");
const registrySnapshotSource = previousRegistry.sourceSnapshots.find((source) => source.id === "cbeta_xml_p5");
if (
  catalog.source.commit !== cbetaSnapshotSource?.commit ||
  catalog.source.commit !== registrySnapshotSource?.snapshot.ref
) {
  throw new Error("受控目录、来源快照与登记册的 CBETA 提交不一致");
}
const cbetaSubsetSnapshot = cbetaSnapshotSource.candidateSubsets.find(
  (subset) => subset.id === "taisho_chinese_sutra_t01_t17",
);
const cbetaT18SubsetSnapshot = cbetaSnapshotSource.candidateSubsets.find(
  (subset) => subset.id === "taisho_esoteric_t18",
);
const cbetaT19SubsetSnapshot = cbetaSnapshotSource.candidateSubsets.find(
  (subset) => subset.id === "taisho_esoteric_t19",
);
const cbetaT20SubsetSnapshot = cbetaSnapshotSource.candidateSubsets.find(
  (subset) => subset.id === "taisho_esoteric_t20",
);
const cbetaT21SubsetSnapshot = cbetaSnapshotSource.candidateSubsets.find(
  (subset) => subset.id === "taisho_esoteric_t21",
);
const cbetaT22SubsetSnapshot = cbetaSnapshotSource.candidateSubsets.find(
  (subset) => subset.id === "taisho_vinaya_t22",
);
const cbetaT23SubsetSnapshot = cbetaSnapshotSource.candidateSubsets.find(
  (subset) => subset.id === "taisho_vinaya_t23",
);
const cbetaT24SubsetSnapshot = cbetaSnapshotSource.candidateSubsets.find(
  (subset) => subset.id === "taisho_vinaya_t24",
);
const cbetaT25SubsetSnapshot = cbetaSnapshotSource.candidateSubsets.find(
  (subset) => subset.id === "taisho_sutra_commentary_t25",
);
const cbetaT26SubsetSnapshot = cbetaSnapshotSource.candidateSubsets.find(
  (subset) => subset.id === "taisho_sutra_commentary_abhidharma_t26",
);
const cbetaT27SubsetSnapshot = cbetaSnapshotSource.candidateSubsets.find(
  (subset) => subset.id === "taisho_abhidharma_commentary_t27",
);
const cbetaT28SubsetSnapshot = cbetaSnapshotSource.candidateSubsets.find(
  (subset) => subset.id === "taisho_abhidharma_t28",
);
const cbetaT29SubsetSnapshot = cbetaSnapshotSource.candidateSubsets.find(
  (subset) => subset.id === "taisho_abhidharma_t29",
);
const cbetaT30SubsetSnapshot = cbetaSnapshotSource.candidateSubsets.find(
  (subset) => subset.id === "taisho_madhyamaka_yogacara_t30",
);
if (
  inventory.source.commit !== catalog.source.commit ||
  inventory.totals.records !== cbetaSubsetSnapshot?.candidateRecordCount ||
  inventory.totals.upstreamBytes !== cbetaSubsetSnapshot?.candidateBytes ||
  sha256(inventoryRaw) !== cbetaSubsetSnapshot?.inventorySha256
) {
  throw new Error("汉译经藏逐文件清单与来源快照不一致");
}
if (
  t18Inventory.source.commit !== catalog.source.commit ||
  t18Inventory.totals.records !== cbetaT18SubsetSnapshot?.candidateRecordCount ||
  t18Inventory.totals.upstreamBytes !== cbetaT18SubsetSnapshot?.candidateBytes ||
  sha256(t18InventoryRaw) !== cbetaT18SubsetSnapshot?.inventorySha256
) {
  throw new Error("T18 密教部逐文件清单与来源快照不一致");
}
if (
  t19Inventory.source.commit !== catalog.source.commit ||
  t19Inventory.totals.records !== cbetaT19SubsetSnapshot?.candidateRecordCount ||
  t19Inventory.totals.upstreamBytes !== cbetaT19SubsetSnapshot?.candidateBytes ||
  sha256(t19InventoryRaw) !== cbetaT19SubsetSnapshot?.inventorySha256
) {
  throw new Error("T19 密教部逐文件清单与来源快照不一致");
}
if (
  t20Inventory.source.commit !== catalog.source.commit ||
  t20Inventory.totals.records !== cbetaT20SubsetSnapshot?.candidateRecordCount ||
  t20Inventory.totals.upstreamBytes !== cbetaT20SubsetSnapshot?.candidateBytes ||
  sha256(t20InventoryRaw) !== cbetaT20SubsetSnapshot?.inventorySha256
) {
  throw new Error("T20 密教部逐文件清单与来源快照不一致");
}
if (
  t21Inventory.source.commit !== catalog.source.commit ||
  t21Inventory.totals.records !== cbetaT21SubsetSnapshot?.candidateRecordCount ||
  t21Inventory.totals.upstreamBytes !== cbetaT21SubsetSnapshot?.candidateBytes ||
  sha256(t21InventoryRaw) !== cbetaT21SubsetSnapshot?.inventorySha256
) {
  throw new Error("T21 密教部逐文件清单与来源快照不一致");
}
if (
  t22Inventory.source.commit !== catalog.source.commit ||
  t22Inventory.totals.records !== cbetaT22SubsetSnapshot?.candidateRecordCount ||
  t22Inventory.totals.upstreamBytes !== cbetaT22SubsetSnapshot?.candidateBytes ||
  sha256(t22InventoryRaw) !== cbetaT22SubsetSnapshot?.inventorySha256
) {
  throw new Error("T22 律部逐文件清单与来源快照不一致");
}
if (
  t23Inventory.source.commit !== catalog.source.commit ||
  t23Inventory.totals.records !== cbetaT23SubsetSnapshot?.candidateRecordCount ||
  t23Inventory.totals.upstreamBytes !== cbetaT23SubsetSnapshot?.candidateBytes ||
  sha256(t23InventoryRaw) !== cbetaT23SubsetSnapshot?.inventorySha256
) {
  throw new Error("T23 律部逐文件清单与来源快照不一致");
}
if (
  t24Inventory.source.commit !== catalog.source.commit ||
  t24Inventory.totals.records !== cbetaT24SubsetSnapshot?.candidateRecordCount ||
  t24Inventory.totals.upstreamBytes !== cbetaT24SubsetSnapshot?.candidateBytes ||
  sha256(t24InventoryRaw) !== cbetaT24SubsetSnapshot?.inventorySha256
) {
  throw new Error("T24 律部逐文件清单与来源快照不一致");
}
if (
  t25Inventory.source.commit !== catalog.source.commit ||
  t25Inventory.totals.records !== cbetaT25SubsetSnapshot?.candidateRecordCount ||
  t25Inventory.totals.upstreamBytes !== cbetaT25SubsetSnapshot?.candidateBytes ||
  sha256(t25InventoryRaw) !== cbetaT25SubsetSnapshot?.inventorySha256
) {
  throw new Error("T25 释经论部逐文件清单与来源快照不一致");
}
if (
  t26Inventory.source.commit !== catalog.source.commit ||
  t26Inventory.totals.records !== cbetaT26SubsetSnapshot?.candidateRecordCount ||
  t26Inventory.totals.upstreamBytes !== cbetaT26SubsetSnapshot?.candidateBytes ||
  sha256(t26InventoryRaw) !== cbetaT26SubsetSnapshot?.inventorySha256
) {
  throw new Error("T26 释经论与毘昙部逐文件清单与来源快照不一致");
}
if (
  t27Inventory.source.commit !== catalog.source.commit ||
  t27Inventory.totals.records !== cbetaT27SubsetSnapshot?.candidateRecordCount ||
  t27Inventory.totals.upstreamBytes !== cbetaT27SubsetSnapshot?.candidateBytes ||
  sha256(t27InventoryRaw) !== cbetaT27SubsetSnapshot?.inventorySha256
) {
  throw new Error("T27 毘昙部《大毘婆沙论》逐文件清单与来源快照不一致");
}
if (
  t28Inventory.source.commit !== catalog.source.commit ||
  t28Inventory.totals.records !== cbetaT28SubsetSnapshot?.candidateRecordCount ||
  t28Inventory.totals.upstreamBytes !== cbetaT28SubsetSnapshot?.candidateBytes ||
  sha256(t28InventoryRaw) !== cbetaT28SubsetSnapshot?.inventorySha256
) {
  throw new Error("T28 毘昙部逐文件清单与来源快照不一致");
}
if (
  t29Inventory.source.commit !== catalog.source.commit ||
  t29Inventory.totals.records !== cbetaT29SubsetSnapshot?.candidateRecordCount ||
  t29Inventory.totals.upstreamBytes !== cbetaT29SubsetSnapshot?.candidateBytes ||
  sha256(t29InventoryRaw) !== cbetaT29SubsetSnapshot?.inventorySha256
) {
  throw new Error("T29 毘昙部逐文件清单与来源快照不一致");
}
if (
  t30Inventory.source.commit !== catalog.source.commit ||
  t30Inventory.totals.records !== cbetaT30SubsetSnapshot?.candidateRecordCount ||
  t30Inventory.totals.upstreamBytes !== cbetaT30SubsetSnapshot?.candidateBytes ||
  sha256(t30InventoryRaw) !== cbetaT30SubsetSnapshot?.inventorySha256
) {
  throw new Error("T30 中观部、瑜伽部逐文件清单与来源快照不一致");
}
const inventoryByPath = new Map(inventory.records.map((record) => [record.upstreamPath, record]));
const t18InventoryByPath = new Map(t18Inventory.records.map((record) => [record.upstreamPath, record]));
const t19InventoryByPath = new Map(t19Inventory.records.map((record) => [record.upstreamPath, record]));
const t20InventoryByPath = new Map(t20Inventory.records.map((record) => [record.upstreamPath, record]));
const t21InventoryByPath = new Map(t21Inventory.records.map((record) => [record.upstreamPath, record]));
const t22InventoryByPath = new Map(t22Inventory.records.map((record) => [record.upstreamPath, record]));
const t23InventoryByPath = new Map(t23Inventory.records.map((record) => [record.upstreamPath, record]));
const t24InventoryByPath = new Map(t24Inventory.records.map((record) => [record.upstreamPath, record]));
const t25InventoryByPath = new Map(t25Inventory.records.map((record) => [record.upstreamPath, record]));
const t26InventoryByPath = new Map(t26Inventory.records.map((record) => [record.upstreamPath, record]));
const t27InventoryByPath = new Map(t27Inventory.records.map((record) => [record.upstreamPath, record]));
const t28InventoryByPath = new Map(t28Inventory.records.map((record) => [record.upstreamPath, record]));
const t29InventoryByPath = new Map(t29Inventory.records.map((record) => [record.upstreamPath, record]));
const t30InventoryByPath = new Map(t30Inventory.records.map((record) => [record.upstreamPath, record]));

const files = [];
const worksById = new Map();
for (const entry of catalog.files) {
  const entrySources = sourceUnits(entry);
  const segments = [];
  for (const source of entrySources) {
    const bytes = await readFile(resolve(root, source.localPath));
    if (bytes.length !== source.localBytes || sha256(bytes) !== source.localSha256) {
      throw new Error(`${source.id} 本地受控文件与目录哈希不一致`);
    }
    segments.push(...parseCbetaReadingLines(bytes.toString("utf8"), { canonId: entry.id }));
  }
  const navigation = buildPageNavigation(segments);
  const juans = [...new Set(segments.map((segment) => segment.juan))];
  if (
    segments.length !== entry.verification.segments ||
    navigation.length !== entry.verification.folios ||
    JSON.stringify(juans) !== JSON.stringify(entry.verification.juans) ||
    !entry.verification.anchors.every((anchor) => segments.some((segment) => segment.id === anchor))
  ) {
    throw new Error(`${entry.id} 结构或稳定锚点与受控目录不一致`);
  }

  files.push(Object.fromEntries(Object.entries(entry).filter(([key]) => !["presentation", "verification", "workTitle"].includes(key))));
  const tradition = entry.presentation.tradition.split(" · ")[0];
  const work = worksById.get(entry.workId) ?? {
    id: entry.workId,
    workType: entry.workIdentityStatus === "provisional_canon_record"
      ? "provisional_bibliographic_entity"
      : "canonical_text",
    canonicalTitle: entry.workTitle ?? entry.presentation.title,
    traditions: [],
    externalIds: { cbeta: [] },
    sourceRoles: [],
    bibliographicRelations: [],
    ...(entry.workIdentityStatus === "provisional_canon_record" ? {
      relationDecision: "暂按单一大正藏经号建立可追踪书目实体；异译、别本、平行经与跨语种作品关系尚待校勘，不据此声称已经完成作品级去重。",
    } : {}),
    expressions: []
  };
  if (!work.traditions.includes(tradition)) work.traditions.push(tradition);
  work.externalIds.cbeta.push(entry.id);
  if (entry.sourceRole && !work.sourceRoles.includes(entry.sourceRole)) work.sourceRoles.push(entry.sourceRole);
  for (const relation of entry.bibliographicRelations ?? []) {
    if (!work.bibliographicRelations.some((candidate) => candidate.groupId === relation.groupId)) {
      work.bibliographicRelations.push(relation);
    }
  }
  const sourceAsset = (source) => ({
    path: source.localPath,
    format: source.format,
    sha256: source.localSha256,
    rightsStatus: "restricted_noncommercial"
  });
  const expression = {
      id: `gbcr:expression:${entry.id}-zh-Hant`,
      language: "lzh-Hant",
      title: entry.presentation.title,
      translator: entry.presentation.translator,
      sourceSnapshotId: "cbeta_xml_p5",
      localSlug: entry.slug,
      cataloged: true,
      fullSourceText: entry.completeness !== "complete_source_file_partial_work_witness",
      completeSourceRecord: true,
      sampled: entry.verification.humanSampleVerified,
      stableSegments: segments.length,
      rightsReviewed: true,
      qualityStatus: entry.verification.humanSampleVerified ? "verified_sample" : "verified_structure_and_anchors",
      ...(entry.sourceRole ? { sourceRole: entry.sourceRole } : {}),
      ...(entry.bibliographicRelations?.length ? { bibliographicRelations: entry.bibliographicRelations } : {})
  };
  if (entrySources.length === 1) expression.sourceTextAsset = sourceAsset(entrySources[0]);
  else expression.sourceTextAssets = entrySources.map((source, index) => ({
    part: source.part ?? index + 1,
    id: source.id,
    ...sourceAsset(source),
  }));
  work.expressions.push(expression);
  worksById.set(entry.workId, work);
}
const works = [...worksById.values()];

const manifest = {
  schema: "https://foxue.ai/schemas/corpus-asset-manifest-v0.2",
  version: outputVersion,
  source: catalog.source,
  rightsDecision: catalog.rightsDecision,
  normalization: catalog.normalization,
  files
};

const cbetaCandidateSubsets = snapshots.sources
  .find((source) => source.id === "cbeta_xml_p5")
  ?.candidateSubsets?.filter((subset) => ["taisho_chinese_sutra_t01_t17", "taisho_esoteric_t18", "taisho_esoteric_t19", "taisho_esoteric_t20", "taisho_esoteric_t21", "taisho_vinaya_t22", "taisho_vinaya_t23", "taisho_vinaya_t24", "taisho_sutra_commentary_t25", "taisho_sutra_commentary_abhidharma_t26", "taisho_abhidharma_commentary_t27", "taisho_abhidharma_t28", "taisho_abhidharma_t29", "taisho_madhyamaka_yogacara_t30"].includes(subset.id));
if (cbetaCandidateSubsets?.length !== 14) throw new Error("缺少汉译经藏、T18–T21 密教部、T22–T24 律部或 T25–T30 释经论、毘昙、中观与瑜伽部候选子集快照");
const controlledSubsetFiles = files
  .flatMap(sourceUnits)
  .filter((file) => /^T\/T(0[1-9]|[12][0-9]|30)\//.test(file.upstreamPath));
const controlledSubsetRecords = controlledSubsetFiles.length;
for (const file of controlledSubsetFiles) {
  const inventoryRecord = inventoryByPath.get(file.upstreamPath) ?? t18InventoryByPath.get(file.upstreamPath) ?? t19InventoryByPath.get(file.upstreamPath) ?? t20InventoryByPath.get(file.upstreamPath) ?? t21InventoryByPath.get(file.upstreamPath) ?? t22InventoryByPath.get(file.upstreamPath) ?? t23InventoryByPath.get(file.upstreamPath) ?? t24InventoryByPath.get(file.upstreamPath) ?? t25InventoryByPath.get(file.upstreamPath) ?? t26InventoryByPath.get(file.upstreamPath) ?? t27InventoryByPath.get(file.upstreamPath) ?? t28InventoryByPath.get(file.upstreamPath) ?? t29InventoryByPath.get(file.upstreamPath) ?? t30InventoryByPath.get(file.upstreamPath);
  if (
    !inventoryRecord ||
    inventoryRecord.upstreamGitBlobSha1 !== file.upstreamGitBlobSha1 ||
    inventoryRecord.upstreamBytes !== file.upstreamBytes
  ) {
    throw new Error(`${file.id} 与汉译经藏逐文件清单不一致`);
  }
}
const controlledSubsetBytes = controlledSubsetFiles.reduce((sum, file) => sum + file.upstreamBytes, 0);
const sourceFamilies = previousRegistry.sourceFamilies.map((family) => family.id === "cbeta_chinese"
  ? {
      ...family,
      denominatorStatus: "candidate_expression_snapshot_ready",
      candidateSubsetIds: cbetaCandidateSubsets.map((subset) => subset.id),
      candidateExpressionRecords: cbetaCandidateSubsets.reduce((sum, subset) => sum + subset.candidateRecordCount, 0),
      controlledExpressionRecords: controlledSubsetRecords,
      candidateExpressionBytes: cbetaCandidateSubsets.reduce((sum, subset) => sum + subset.candidateBytes, 0),
      controlledExpressionBytes: controlledSubsetBytes,
      agamaSourceRecordDenominator: agamaBatch.collection.sourceRecordDenominator,
      agamaControlledSourceRecords: agamaBatch.collection.controlledSourceRecords,
      agamaSourceRecordPercentage: 100,
      benyuanSourceRecordDenominator: benyuanBatch.collection.sourceRecordDenominator,
      benyuanControlledSourceRecords: benyuanBatch.collection.controlledSourceRecords,
      benyuanSourceRecordPercentage: 100,
      prajnaparamitaSourceRecordDenominator: prajnaparamitaBatch.collection.sourceRecordDenominator,
      prajnaparamitaControlledSourceRecords: prajnaparamitaBatch.collection.controlledSourceRecords,
      prajnaparamitaSourceRecordPercentage: 100,
      lotusSourceRecordDenominator: lotusBatch.collection.sourceRecordDenominator,
      lotusControlledSourceRecords: lotusBatch.collection.controlledSourceRecords,
      lotusSourceRecordPercentage: 100,
      avatamsakaSourceRecordDenominator: avatamsakaBatch.collection.sourceRecordDenominator,
      avatamsakaControlledSourceRecords: avatamsakaBatch.collection.controlledSourceRecords,
      avatamsakaSourceRecordPercentage: 100,
      ratnakutaSourceRecordDenominator: ratnakutaBatch.collection.sourceRecordDenominator,
      ratnakutaControlledSourceRecords: ratnakutaBatch.collection.controlledSourceRecords,
      ratnakutaSourceRecordPercentage: 100,
      t12SourceRecordDenominator: t12Batch.collection.sourceRecordDenominator,
      t12ControlledSourceRecords: t12Batch.collection.controlledSourceRecords,
      t12SourceRecordPercentage: 100,
      t13SourceRecordDenominator: t13Batch.collection.sourceRecordDenominator,
      t13ControlledSourceRecords: t13Batch.collection.controlledSourceRecords,
      t13SourceRecordPercentage: 100,
      t14SourceRecordDenominator: t14Batch.collection.sourceRecordDenominator,
      t14ControlledSourceRecords: t14Batch.collection.controlledSourceRecords,
      t14SourceRecordPercentage: 100,
      t15SourceRecordDenominator: t15Batch.collection.sourceRecordDenominator,
      t15ControlledSourceRecords: t15Batch.collection.controlledSourceRecords,
      t15SourceRecordPercentage: 100,
      t16SourceRecordDenominator: t16Batch.collection.sourceRecordDenominator,
      t16ControlledSourceRecords: t16Batch.collection.controlledSourceRecords,
      t16SourceRecordPercentage: 100,
      t17SourceRecordDenominator: t17Batch.collection.sourceRecordDenominator,
      t17ControlledSourceRecords: t17Batch.collection.controlledSourceRecords,
      t17SourceRecordPercentage: 100,
      t18SourceRecordDenominator: t18Batch.collection.sourceRecordDenominator,
      t18ControlledSourceRecords: t18Batch.collection.controlledSourceRecords,
      t18SourceRecordPercentage: 100,
      t19SourceRecordDenominator: t19Batch.collection.sourceRecordDenominator,
      t19ControlledSourceRecords: t19Batch.collection.controlledSourceRecords,
      t19SourceRecordPercentage: 100,
      t20SourceRecordDenominator: t20Batch.collection.sourceRecordDenominator,
      t20ControlledSourceRecords: t20Batch.collection.controlledSourceRecords,
      t20SourceRecordPercentage: 100,
      t21SourceRecordDenominator: t21Batch.collection.sourceRecordDenominator,
      t21ControlledSourceRecords: t21Batch.collection.controlledSourceRecords,
      t21SourceRecordPercentage: 100,
      t22SourceRecordDenominator: t22Batch.collection.sourceRecordDenominator,
      t22ControlledSourceRecords: t22Batch.collection.controlledSourceRecords,
      t22SourceRecordPercentage: 100,
      t23SourceRecordDenominator: t23Batch.collection.sourceRecordDenominator,
      t23ControlledSourceRecords: t23Batch.collection.controlledSourceRecords,
      t23SourceRecordPercentage: 100,
      t24SourceRecordDenominator: t24Batch.collection.sourceRecordDenominator,
      t24ControlledSourceRecords: t24Batch.collection.controlledSourceRecords,
      t24SourceRecordPercentage: 100,
      t25SourceRecordDenominator: t25Batch.collection.sourceRecordDenominator,
      t25ControlledSourceRecords: t25Batch.collection.controlledSourceRecords,
      t25SourceRecordPercentage: 100,
      t26SourceRecordDenominator: t26Batch.collection.sourceRecordDenominator,
      t26ControlledSourceRecords: t26Batch.collection.controlledSourceRecords,
      t26SourceRecordPercentage: 100,
      t27SourceRecordDenominator: t27Batch.collection.sourceRecordDenominator,
      t27ControlledSourceRecords: t27Batch.collection.controlledSourceRecords,
      t27SourceRecordPercentage: 100,
      t28SourceRecordDenominator: t28Batch.collection.sourceRecordDenominator,
      t28ControlledSourceRecords: t28Batch.collection.controlledSourceRecords,
      t28SourceRecordPercentage: 100,
      t29SourceRecordDenominator: t29Batch.collection.sourceRecordDenominator,
      t29ControlledSourceRecords: t29Batch.collection.controlledSourceRecords,
      t29SourceRecordPercentage: 100,
      t30SourceRecordDenominator: t30Batch.collection.sourceRecordDenominator,
      t30ControlledSourceRecords: t30Batch.collection.controlledSourceRecords,
      t30SourceRecordPercentage: 100,
      denominatorWorks: null,
      denominatorNote: "1,663 是大正藏 T01–T30 十四个固定候选子集中的来源记录，不是去重后的全球作品数。T01–T17 已完成 881/881，T18 完成 76/76，T19 完成 126/126，T20 完成 184/184，T21 完成 228/228，T22 完成 15/15，T23 完成 13/13，T24 完成 59/59，T25 完成 15/15，T26 完成 26/26，T27 完成 1/1，T28 完成 12/12，T29 完成 6/6，T30 完成 21/21。T18–T21 密教部、T22–T24 律部、T25–T30 释经论、毘昙、中观与瑜伽部分别保留译经、仪轨、论造、编集、广律、戒本、羯磨、根本颂、释论、完整论书、组成部分、节略与分离见证、同本异译、失译与争议归属边界；目录部类、传统作者、题名或机器相似度不等于同一作品或佛陀逐字亲说归属。"
    }
  : family);
const registry = {
  ...previousRegistry,
  registry: { ...previousRegistry.registry, version: outputVersion, publishedAt: catalog.publishedAt },
  sourceFamilies,
  works
};

const serialize = (value) => `${JSON.stringify(value, null, 2)}\n`;
const manifestRaw = serialize(manifest);
const registryRaw = serialize(registry);
const snapshotRaw = await readFile(snapshotPath, "utf8");
const checksumRaw = `${sha256(registryRaw)}  registry-cbeta-v3.7.0.json\n${sha256(snapshotRaw)}  source-snapshots-v1.8.0.json\n${sha256(inventoryRaw)}  cbeta-taisho-sutra-inventory-v0.2.1.json\n${sha256(t18InventoryRaw)}  cbeta-taisho-t18-inventory-v0.1.0.json\n${sha256(t19InventoryRaw)}  cbeta-taisho-t19-inventory-v0.1.0.json\n${sha256(t20InventoryRaw)}  cbeta-taisho-t20-inventory-v0.1.0.json\n${sha256(t21InventoryRaw)}  cbeta-taisho-t21-inventory-v0.1.0.json\n${sha256(t22InventoryRaw)}  cbeta-taisho-t22-inventory-v0.1.0.json\n${sha256(t23InventoryRaw)}  cbeta-taisho-t23-inventory-v0.1.0.json\n${sha256(t24InventoryRaw)}  cbeta-taisho-t24-inventory-v0.1.0.json\n${sha256(t25InventoryRaw)}  cbeta-taisho-t25-inventory-v0.1.0.json\n${sha256(t26InventoryRaw)}  cbeta-taisho-t26-inventory-v0.1.0.json\n${sha256(t27InventoryRaw)}  cbeta-taisho-t27-inventory-v0.1.0.json\n${sha256(t28InventoryRaw)}  cbeta-taisho-t28-inventory-v0.1.0.json\n${sha256(t29InventoryRaw)}  cbeta-taisho-t29-inventory-v0.1.0.json\n${sha256(t30InventoryRaw)}  cbeta-taisho-t30-inventory-v0.1.0.json\n`;
const outputs = [
  [resolve(root, "data/corpus/cbeta/manifest-v3.7.0.json"), manifestRaw],
  [resolve(root, "data/gbcr/registry-cbeta-v3.7.0.json"), registryRaw],
  [resolve(root, "data/gbcr/checksums-cbeta-v3.7.0.sha256"), checksumRaw],
];
const expressionCount = works.reduce((sum, work) => sum + work.expressions.length, 0);
const segmentCount = works.flatMap((work) => work.expressions).reduce((sum, expression) => sum + expression.stableSegments, 0);
if (process.argv.includes("--verify")) {
  for (const [path, expected] of outputs) {
    if (await readFile(path, "utf8") !== expected) {
      throw new Error(`${path} 与受控目录确定性输出不一致`);
    }
  }
  console.log(`语料目录 v${outputVersion} 可复现：${works.length} 个作品实体、${expressionCount} 个表达或见证，${segmentCount} 个稳定行段。`);
} else {
  for (const [path, content] of outputs) await writeFile(path, content, "utf8");
  console.log(`语料目录 v${outputVersion} 已生成：${works.length} 个作品实体、${expressionCount} 个表达或见证，${segmentCount} 个稳定行段。`);
}

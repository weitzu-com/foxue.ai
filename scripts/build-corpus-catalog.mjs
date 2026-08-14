import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { buildPageNavigation, parseCbetaReadingLines } from "../src/lib/cbeta-tei.mjs";

const root = process.cwd();
const outputVersion = "2.8.0";
const catalogPath = resolve(root, "data/corpus/cbeta/catalog-v2.8.0.json");
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
const snapshotPath = resolve(root, "data/gbcr/source-snapshots-v0.9.0.json");
const inventoryPath = resolve(root, "data/gbcr/cbeta-taisho-sutra-inventory-v0.2.1.json");
const t18InventoryPath = resolve(root, "data/gbcr/cbeta-taisho-t18-inventory-v0.1.0.json");
const t19InventoryPath = resolve(root, "data/gbcr/cbeta-taisho-t19-inventory-v0.1.0.json");
const t20InventoryPath = resolve(root, "data/gbcr/cbeta-taisho-t20-inventory-v0.1.0.json");
const t21InventoryPath = resolve(root, "data/gbcr/cbeta-taisho-t21-inventory-v0.1.0.json");
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
const inventoryByPath = new Map(inventory.records.map((record) => [record.upstreamPath, record]));
const t18InventoryByPath = new Map(t18Inventory.records.map((record) => [record.upstreamPath, record]));
const t19InventoryByPath = new Map(t19Inventory.records.map((record) => [record.upstreamPath, record]));
const t20InventoryByPath = new Map(t20Inventory.records.map((record) => [record.upstreamPath, record]));
const t21InventoryByPath = new Map(t21Inventory.records.map((record) => [record.upstreamPath, record]));

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
  ?.candidateSubsets?.filter((subset) => ["taisho_chinese_sutra_t01_t17", "taisho_esoteric_t18", "taisho_esoteric_t19", "taisho_esoteric_t20", "taisho_esoteric_t21"].includes(subset.id));
if (cbetaCandidateSubsets?.length !== 5) throw new Error("缺少汉译经藏、T18、T19、T20 或 T21 密教部候选子集快照");
const controlledSubsetFiles = files
  .flatMap(sourceUnits)
  .filter((file) => /^T\/T(0[1-9]|1[0-9]|20|21)\//.test(file.upstreamPath));
const controlledSubsetRecords = controlledSubsetFiles.length;
for (const file of controlledSubsetFiles) {
  const inventoryRecord = inventoryByPath.get(file.upstreamPath) ?? t18InventoryByPath.get(file.upstreamPath) ?? t19InventoryByPath.get(file.upstreamPath) ?? t20InventoryByPath.get(file.upstreamPath) ?? t21InventoryByPath.get(file.upstreamPath);
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
      denominatorWorks: null,
      denominatorNote: "1,495 是大正藏 T01–T21 五个固定候选子集中的来源记录，不是去重后的全球作品数。T01–T17 已完成 881/881，T18 完成 76/76，T19 完成 126/126，T20 完成 184/184，T21 完成 228/228；T18–T21 同时包含译经、陀罗尼、仪轨、赞颂、天部修法、星曜术、施食法、治病咒、撰述、论造、译解、请来或口受材料、失译、局部材料与版本见证。合集、单品组件、文本表达、合部编纂本、版本见证、部分译出、撰集与残篇见证分别计数，目录部类不等于佛陀亲说归属。"
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
const checksumRaw = `${sha256(registryRaw)}  registry-cbeta-v2.8.0.json\n${sha256(snapshotRaw)}  source-snapshots-v0.9.0.json\n${sha256(inventoryRaw)}  cbeta-taisho-sutra-inventory-v0.2.1.json\n${sha256(t18InventoryRaw)}  cbeta-taisho-t18-inventory-v0.1.0.json\n${sha256(t19InventoryRaw)}  cbeta-taisho-t19-inventory-v0.1.0.json\n${sha256(t20InventoryRaw)}  cbeta-taisho-t20-inventory-v0.1.0.json\n${sha256(t21InventoryRaw)}  cbeta-taisho-t21-inventory-v0.1.0.json\n`;
const outputs = [
  [resolve(root, "data/corpus/cbeta/manifest-v2.8.0.json"), manifestRaw],
  [resolve(root, "data/gbcr/registry-cbeta-v2.8.0.json"), registryRaw],
  [resolve(root, "data/gbcr/checksums-cbeta-v2.8.0.sha256"), checksumRaw],
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

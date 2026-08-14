import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const registryPath = resolve(root, "data/gbcr/registry-v4.2.0.json");
const sourceSnapshotsPath = resolve(root, "data/gbcr/source-snapshots-v1.2.0.json");
const inventoryPath = resolve(root, "data/gbcr/cbeta-taisho-sutra-inventory-v0.2.1.json");
const t18InventoryPath = resolve(root, "data/gbcr/cbeta-taisho-t18-inventory-v0.1.0.json");
const t19InventoryPath = resolve(root, "data/gbcr/cbeta-taisho-t19-inventory-v0.1.0.json");
const t20InventoryPath = resolve(root, "data/gbcr/cbeta-taisho-t20-inventory-v0.1.0.json");
const t21InventoryPath = resolve(root, "data/gbcr/cbeta-taisho-t21-inventory-v0.1.0.json");
const t22InventoryPath = resolve(root, "data/gbcr/cbeta-taisho-t22-inventory-v0.1.0.json");
const t23InventoryPath = resolve(root, "data/gbcr/cbeta-taisho-t23-inventory-v0.1.0.json");
const t24InventoryPath = resolve(root, "data/gbcr/cbeta-taisho-t24-inventory-v0.1.0.json");
const dergeInventoryPath = resolve(root, "data/gbcr/bdrc-derge-kangyur-inventory-v0.3.0.json");
const rights84000Path = resolve(root, "data/gbcr/84000-rights-policy-v0.3.0.json");
const sanskritEvidencePath = resolve(root, "data/gbcr/dsbc-gretil-source-snapshot-v0.4.0.json");
const sanskritRightsPath = resolve(root, "data/gbcr/sanskrit-rights-policy-v0.4.0.json");
const gretilFileRightsAuditPath = resolve(root, "data/gbcr/gretil-sanskrit-file-rights-audit-v0.7.0.json");
const suttacentralIndicRightsAuditPath = resolve(root, "data/gbcr/suttacentral-indic-root-rights-audit-v0.8.0.json");
const suttacentralVinayaRightsAuditPath = resolve(root, "data/gbcr/suttacentral-vinaya-root-rights-audit-v0.9.0.json");
const suttacentralAbhidhammaRightsAuditPath = resolve(root, "data/gbcr/suttacentral-abhidhamma-root-rights-audit-v1.0.0.json");
const suttacentralChineseParallelsPath = resolve(root, "data/gbcr/suttacentral-chinese-parallels-v0.7.0.json");
const suttacentralParallelReviewQueuePath = resolve(root, "data/gbcr/suttacentral-parallel-review-queue-v0.1.0.json");
const suttacentralParallelP0EvidencePacketsPath = resolve(root, "data/gbcr/suttacentral-parallel-p0-evidence-packets-v0.1.0.json");
const crossCatalogAlignmentsPath = resolve(root, "data/gbcr/cross-catalog-alignments-v0.5.0.json");
const rktsEvidencePath = resolve(root, "data/gbcr/rkts-kangyur-catalog-snapshot-v0.5.0.json");
const rktsKernelAlignmentsPath = resolve(root, "data/gbcr/rkts-kernel-alignment-audit-v0.6.0.json");
const checksumPath = resolve(root, "data/gbcr/checksums-v4.2.0.sha256");
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
const cbetaCatalogPath = resolve(root, "data/corpus/cbeta/catalog-v3.1.0.json");
const cbetaManifestPath = resolve(root, "data/corpus/cbeta/manifest-v3.1.0.json");
const cbetaRegistryPath = resolve(root, "data/gbcr/registry-cbeta-v3.1.0.json");
const suttacentralBatchPath = resolve(root, "data/corpus/suttacentral/batch-v0.7.0.json");
const suttacentralManifestPath = resolve(root, "data/corpus/suttacentral/manifest-v0.7.0.json");
const dighaBatchPath = resolve(root, "data/corpus/suttacentral/dn-batch-v0.8.0.json");
const dighaManifestPath = resolve(root, "data/corpus/suttacentral/dn-manifest-v0.8.0.json");
const majjhimaBatchPath = resolve(root, "data/corpus/suttacentral/mn-batch-v0.9.0.json");
const majjhimaManifestPath = resolve(root, "data/corpus/suttacentral/mn-manifest-v0.9.0.json");
const samyuttaBatchPath = resolve(root, "data/corpus/suttacentral/sn-batch-v1.0.0.json");
const samyuttaManifestPath = resolve(root, "data/corpus/suttacentral/sn-manifest-v1.0.0.json");
const anguttaraBatchPath = resolve(root, "data/corpus/suttacentral/an-batch-v1.1.0.json");
const anguttaraManifestPath = resolve(root, "data/corpus/suttacentral/an-manifest-v1.1.0.json");
const khuddakaBatchPath = resolve(root, "data/corpus/suttacentral/kn-batch-v1.2.0.json");
const khuddakaManifestPath = resolve(root, "data/corpus/suttacentral/kn-manifest-v1.2.0.json");
const indicBatchPath = resolve(root, "data/corpus/suttacentral/indic-batch-v1.3.0.json");
const indicManifestPath = resolve(root, "data/corpus/suttacentral/indic-manifest-v1.3.0.json");
const vinayaBatchPath = resolve(root, "data/corpus/suttacentral/vinaya-batch-v1.4.0.json");
const vinayaManifestPath = resolve(root, "data/corpus/suttacentral/vinaya-manifest-v1.4.0.json");
const abhidhammaBatchPath = resolve(root, "data/corpus/suttacentral/abhidhamma-batch-v1.5.0.json");
const abhidhammaManifestPath = resolve(root, "data/corpus/suttacentral/abhidhamma-manifest-v1.5.0.json");
const raw = await readFile(registryPath, "utf8");
const sourceSnapshotsRaw = await readFile(sourceSnapshotsPath, "utf8");
const inventoryRaw = await readFile(inventoryPath, "utf8");
const t18InventoryRaw = await readFile(t18InventoryPath, "utf8");
const t19InventoryRaw = await readFile(t19InventoryPath, "utf8");
const t20InventoryRaw = await readFile(t20InventoryPath, "utf8");
const t21InventoryRaw = await readFile(t21InventoryPath, "utf8");
const t22InventoryRaw = await readFile(t22InventoryPath, "utf8");
const t23InventoryRaw = await readFile(t23InventoryPath, "utf8");
const t24InventoryRaw = await readFile(t24InventoryPath, "utf8");
const dergeInventoryRaw = await readFile(dergeInventoryPath, "utf8");
const rights84000Raw = await readFile(rights84000Path, "utf8");
const sanskritEvidenceRaw = await readFile(sanskritEvidencePath, "utf8");
const sanskritRightsRaw = await readFile(sanskritRightsPath, "utf8");
const gretilFileRightsAuditRaw = await readFile(gretilFileRightsAuditPath, "utf8");
const suttacentralIndicRightsAuditRaw = await readFile(suttacentralIndicRightsAuditPath, "utf8");
const suttacentralVinayaRightsAuditRaw = await readFile(suttacentralVinayaRightsAuditPath, "utf8");
const suttacentralAbhidhammaRightsAuditRaw = await readFile(suttacentralAbhidhammaRightsAuditPath, "utf8");
const suttacentralChineseParallelsRaw = await readFile(suttacentralChineseParallelsPath, "utf8");
const suttacentralParallelReviewQueueRaw = await readFile(suttacentralParallelReviewQueuePath, "utf8");
const suttacentralParallelP0EvidencePacketsRaw = await readFile(suttacentralParallelP0EvidencePacketsPath, "utf8");
const crossCatalogAlignmentsRaw = await readFile(crossCatalogAlignmentsPath, "utf8");
const rktsEvidenceRaw = await readFile(rktsEvidencePath, "utf8");
const rktsKernelAlignmentsRaw = await readFile(rktsKernelAlignmentsPath, "utf8");
const agamaBatchRaw = await readFile(agamaBatchPath, "utf8");
const benyuanBatchRaw = await readFile(benyuanBatchPath, "utf8");
const prajnaparamitaBatchRaw = await readFile(prajnaparamitaBatchPath, "utf8");
const lotusBatchRaw = await readFile(lotusBatchPath, "utf8");
const avatamsakaBatchRaw = await readFile(avatamsakaBatchPath, "utf8");
const ratnakutaBatchRaw = await readFile(ratnakutaBatchPath, "utf8");
const t12BatchRaw = await readFile(t12BatchPath, "utf8");
const t13BatchRaw = await readFile(t13BatchPath, "utf8");
const t14BatchRaw = await readFile(t14BatchPath, "utf8");
const t15BatchRaw = await readFile(t15BatchPath, "utf8");
const t16BatchRaw = await readFile(t16BatchPath, "utf8");
const t17BatchRaw = await readFile(t17BatchPath, "utf8");
const t18BatchRaw = await readFile(t18BatchPath, "utf8");
const t19BatchRaw = await readFile(t19BatchPath, "utf8");
const t20BatchRaw = await readFile(t20BatchPath, "utf8");
const t21BatchRaw = await readFile(t21BatchPath, "utf8");
const t22BatchRaw = await readFile(t22BatchPath, "utf8");
const t23BatchRaw = await readFile(t23BatchPath, "utf8");
const t24BatchRaw = await readFile(t24BatchPath, "utf8");
const cbetaCatalogRaw = await readFile(cbetaCatalogPath, "utf8");
const cbetaManifestRaw = await readFile(cbetaManifestPath, "utf8");
const cbetaRegistryRaw = await readFile(cbetaRegistryPath, "utf8");
const suttacentralBatchRaw = await readFile(suttacentralBatchPath, "utf8");
const suttacentralManifestRaw = await readFile(suttacentralManifestPath, "utf8");
const dighaBatchRaw = await readFile(dighaBatchPath, "utf8");
const dighaManifestRaw = await readFile(dighaManifestPath, "utf8");
const majjhimaBatchRaw = await readFile(majjhimaBatchPath, "utf8");
const majjhimaManifestRaw = await readFile(majjhimaManifestPath, "utf8");
const samyuttaBatchRaw = await readFile(samyuttaBatchPath, "utf8");
const samyuttaManifestRaw = await readFile(samyuttaManifestPath, "utf8");
const anguttaraBatchRaw = await readFile(anguttaraBatchPath, "utf8");
const anguttaraManifestRaw = await readFile(anguttaraManifestPath, "utf8");
const khuddakaBatchRaw = await readFile(khuddakaBatchPath, "utf8");
const khuddakaManifestRaw = await readFile(khuddakaManifestPath, "utf8");
const indicBatchRaw = await readFile(indicBatchPath, "utf8");
const indicManifestRaw = await readFile(indicManifestPath, "utf8");
const vinayaBatchRaw = await readFile(vinayaBatchPath, "utf8");
const vinayaManifestRaw = await readFile(vinayaManifestPath, "utf8");
const abhidhammaBatchRaw = await readFile(abhidhammaBatchPath, "utf8");
const abhidhammaManifestRaw = await readFile(abhidhammaManifestPath, "utf8");
const registry = JSON.parse(raw);
const sourceSnapshots = JSON.parse(sourceSnapshotsRaw);
const inventory = JSON.parse(inventoryRaw);
const t18Inventory = JSON.parse(t18InventoryRaw);
const t19Inventory = JSON.parse(t19InventoryRaw);
const t20Inventory = JSON.parse(t20InventoryRaw);
const t21Inventory = JSON.parse(t21InventoryRaw);
const t22Inventory = JSON.parse(t22InventoryRaw);
const t23Inventory = JSON.parse(t23InventoryRaw);
const t24Inventory = JSON.parse(t24InventoryRaw);
const dergeInventory = JSON.parse(dergeInventoryRaw);
const rights84000 = JSON.parse(rights84000Raw);
const sanskritEvidence = JSON.parse(sanskritEvidenceRaw);
const sanskritRights = JSON.parse(sanskritRightsRaw);
const gretilFileRightsAudit = JSON.parse(gretilFileRightsAuditRaw);
const suttacentralIndicRightsAudit = JSON.parse(suttacentralIndicRightsAuditRaw);
const suttacentralVinayaRightsAudit = JSON.parse(suttacentralVinayaRightsAuditRaw);
const suttacentralAbhidhammaRightsAudit = JSON.parse(suttacentralAbhidhammaRightsAuditRaw);
const suttacentralChineseParallels = JSON.parse(suttacentralChineseParallelsRaw);
const suttacentralParallelReviewQueue = JSON.parse(suttacentralParallelReviewQueueRaw);
const suttacentralParallelP0EvidencePackets = JSON.parse(suttacentralParallelP0EvidencePacketsRaw);
const crossCatalogAlignments = JSON.parse(crossCatalogAlignmentsRaw);
const rktsEvidence = JSON.parse(rktsEvidenceRaw);
const rktsKernelAlignments = JSON.parse(rktsKernelAlignmentsRaw);
const agamaBatch = JSON.parse(agamaBatchRaw);
const benyuanBatch = JSON.parse(benyuanBatchRaw);
const prajnaparamitaBatch = JSON.parse(prajnaparamitaBatchRaw);
const lotusBatch = JSON.parse(lotusBatchRaw);
const avatamsakaBatch = JSON.parse(avatamsakaBatchRaw);
const ratnakutaBatch = JSON.parse(ratnakutaBatchRaw);
const t12Batch = JSON.parse(t12BatchRaw);
const t13Batch = JSON.parse(t13BatchRaw);
const t14Batch = JSON.parse(t14BatchRaw);
const t15Batch = JSON.parse(t15BatchRaw);
const t16Batch = JSON.parse(t16BatchRaw);
const t17Batch = JSON.parse(t17BatchRaw);
const t18Batch = JSON.parse(t18BatchRaw);
const t19Batch = JSON.parse(t19BatchRaw);
const t20Batch = JSON.parse(t20BatchRaw);
const t21Batch = JSON.parse(t21BatchRaw);
const t22Batch = JSON.parse(t22BatchRaw);
const t23Batch = JSON.parse(t23BatchRaw);
const t24Batch = JSON.parse(t24BatchRaw);
const cbetaCatalog = JSON.parse(cbetaCatalogRaw);
const cbetaManifest = JSON.parse(cbetaManifestRaw);
const cbetaRegistry = JSON.parse(cbetaRegistryRaw);
const suttacentralBatch = JSON.parse(suttacentralBatchRaw);
const suttacentralManifest = JSON.parse(suttacentralManifestRaw);
const dighaBatch = JSON.parse(dighaBatchRaw);
const dighaManifest = JSON.parse(dighaManifestRaw);
const majjhimaBatch = JSON.parse(majjhimaBatchRaw);
const majjhimaManifest = JSON.parse(majjhimaManifestRaw);
const samyuttaBatch = JSON.parse(samyuttaBatchRaw);
const samyuttaManifest = JSON.parse(samyuttaManifestRaw);
const anguttaraBatch = JSON.parse(anguttaraBatchRaw);
const anguttaraManifest = JSON.parse(anguttaraManifestRaw);
const khuddakaBatch = JSON.parse(khuddakaBatchRaw);
const khuddakaManifest = JSON.parse(khuddakaManifestRaw);
const indicBatch = JSON.parse(indicBatchRaw);
const indicManifest = JSON.parse(indicManifestRaw);
const vinayaBatch = JSON.parse(vinayaBatchRaw);
const vinayaManifest = JSON.parse(vinayaManifestRaw);
const abhidhammaBatch = JSON.parse(abhidhammaBatchRaw);
const abhidhammaManifest = JSON.parse(abhidhammaManifestRaw);
const errors = [];

const requireValue = (condition, message) => {
  if (!condition) errors.push(message);
};

requireValue(registry.schema === "https://foxue.ai/schemas/gbcr/registry-v0.1", "schema 版本不匹配");
requireValue(registry.registry?.version === "4.2.0", "登记册版本不匹配");
requireValue(registry.claimPolicy?.publishable === false, "全球分母未完成时不得发布 99% 声明");

const denominatorValues = [
  registry.globalDenominators?.catalogWorks,
  registry.globalDenominators?.fullSourceTextWorks,
  registry.globalDenominators?.translationWorks,
  registry.globalDenominators?.rightsPublishableWorks,
  registry.globalDenominators?.qualityApprovedWorks,
];
requireValue(denominatorValues.every((value) => value === null), "全球作品分母必须保持 null");

const unique = (values, label) => {
  requireValue(new Set(values).size === values.length, `${label} 存在重复标识`);
};

unique(registry.sourceFamilies.map((item) => item.id), "sourceFamilies");
unique(registry.sourceSnapshots.map((item) => item.id), "sourceSnapshots");
unique(registry.works.map((item) => item.id), "works");

const sourceIds = new Set(registry.sourceSnapshots.map((item) => item.id));
const expressionIds = [];
for (const work of registry.works) {
  requireValue(Object.keys(work.externalIds ?? {}).length > 0, `${work.id} 缺少外部目录标识`);
  for (const expression of work.expressions ?? []) {
    expressionIds.push(expression.id);
    requireValue(sourceIds.has(expression.sourceSnapshotId), `${expression.id} 引用了未知来源快照`);
    requireValue(Number.isInteger(expression.stableSegments) && expression.stableSegments >= 0, `${expression.id} 段落数无效`);
    if (expression.fullSourceText) {
      const assets = expression.sourceTextAssets ?? [expression.sourceTextAsset].filter(Boolean);
      requireValue(assets.length > 0, `${expression.id} 标为完整原文但没有受控资产路径`);
      requireValue(assets.every((asset) => asset.path), `${expression.id} 完整原文资产缺少路径`);
      requireValue(assets.every((asset) => /^[a-f0-9]{64}$/.test(asset.sha256 ?? "")), `${expression.id} 完整原文缺少 SHA-256`);
    }
  }
}
unique(expressionIds, "expressions");

for (const source of registry.sourceSnapshots) {
  if (source.snapshot.type === "git") {
    requireValue(/^[a-f0-9]{40}$/.test(source.snapshot.ref), `${source.id} 未冻结到完整 Git 提交号`);
  }
  if (source.snapshot.type === "api_revision") {
    requireValue(/^[a-f0-9]{40}$/.test(source.snapshot.ref), `${source.id} 未冻结到完整 API 数据修订号`);
  }
  if (source.snapshot.type === "web_sha256") {
    requireValue(/^[a-f0-9]{64}$/.test(source.snapshot.ref), `${source.id} 未冻结网页响应 SHA-256`);
  }
  if (source.snapshot.type === "git_commit_file_sha256") {
    requireValue(/^[a-f0-9]{40}$/.test(source.snapshot.ref), `${source.id} 未冻结到完整 Git 提交号`);
  }
  requireValue(source.rights?.status && source.rights?.summary, `${source.id} 缺少权利审核状态`);
}

requireValue(sourceSnapshots.denominatorReady === false, "候选来源记录尚未去重，不得标为分母就绪");
requireValue(sourceSnapshots.version === "1.2.0", "来源候选快照版本不匹配");
requireValue(sourceSnapshots.sources?.length === 6, "来源候选快照必须包含 CBETA、SuttaCentral、BDRC、DSBC、GRETIL 与 rKTs");
for (const snapshot of sourceSnapshots.sources ?? []) {
  const registrySource = registry.sourceSnapshots.find((item) => item.id === snapshot.id);
  if (snapshot.commit) {
    requireValue(registrySource?.snapshot.ref === snapshot.commit, `${snapshot.id} 的来源提交与登记册不一致`);
    requireValue(snapshot.treeTruncated === false, `${snapshot.id} 的 Git tree 快照被截断`);
  } else {
    requireValue(registrySource?.inventory?.sha256 === snapshot.inventorySha256, `${snapshot.id} 的清单摘要与登记册不一致`);
  }
  requireValue(snapshot.candidateRecordCount > 0, `${snapshot.id} 没有候选记录`);
  requireValue(/^[a-f0-9]{64}$/.test(snapshot.candidatePathSha256), `${snapshot.id} 缺少候选路径摘要`);
}
const dergeSnapshot = sourceSnapshots.sources.find((source) => source.id === "bdrc_derge_kangyur");
const tibetanFamily = registry.sourceFamilies.find((family) => family.id === "tibetan_kangyur_tengyur");
requireValue(dergeSnapshot?.candidateRecordCount === 1114, "德格甘珠尔候选表达式数量漂移");
requireValue(dergeSnapshot?.inventorySha256 === createHash("sha256").update(dergeInventoryRaw).digest("hex"), "德格甘珠尔逐条清单摘要不匹配");
requireValue(dergeInventory?.totals?.topLevelCatalogRecords === 1122, "德格甘珠尔顶层目录项数量漂移");
requireValue(dergeInventory?.totals?.topLevelExpressionRecords === 1114, "德格甘珠尔可定位表达式数量漂移");
requireValue(dergeInventory?.totals?.excludedCatalogOnlyRecords === 8, "德格甘珠尔排除证据数量漂移");
requireValue(dergeInventory?.totals?.nestedTextPartRecords === 71, "德格甘珠尔嵌套子文本数量漂移");
requireValue(dergeInventory?.totals?.dergeIdentifierRecords === 1193, "德格甘珠尔编号数量漂移");
requireValue(dergeInventory?.totals?.linkedAbstractWorkIds === 844, "德格甘珠尔链接抽象作品数量漂移");
requireValue(dergeInventory?.totals?.volumeManifests === 103, "德格甘珠尔 IIIF 卷数漂移");
requireValue(dergeInventory?.records?.length === 1114, "德格甘珠尔逐条清单不完整");
requireValue(dergeInventory?.excludedCatalogRecords?.length === 8, "德格甘珠尔排除清单不完整");
unique(dergeInventory.records.map((record) => record.expressionId), "德格甘珠尔表达式标识");
unique(dergeInventory.records.map((record) => record.dergeCatalogId), "德格甘珠尔目录号");
requireValue(tibetanFamily?.denominatorStatus === "multi_edition_catalog_snapshots_ready_alignment_pending", "藏文来源族状态未升级");
requireValue(tibetanFamily?.candidateExpressionRecords === 1114, "藏文来源族候选表达式数量不匹配");
requireValue(tibetanFamily?.denominatorWorks === null, "藏文跨版本作品分母不得提前填写");
const rktsSnapshot = sourceSnapshots.sources.find((source) => source.id === "rkts_kangyur_catalogs");
const rktsSha256 = createHash("sha256").update(rktsEvidenceRaw).digest("hex");
requireValue(rktsSnapshot?.candidateRecordCount === 15069 && rktsSnapshot?.candidateBytes === 15544576, "rKTs 目录 item 或字节统计漂移");
requireValue(rktsSnapshot?.inventorySha256 === rktsSha256, "rKTs 多版本目录证据摘要不匹配");
requireValue(rktsEvidence?.upstream?.migrationCommit === "7c2885721f9c5af6cfbd9e9436f223597649605d", "rKTs migration 固定提交漂移");
requireValue(rktsEvidence?.upstream?.sourceCommit === "f6a87b6965641111b566ce2db14f7641a7469e6f", "rKTs source 固定提交漂移");
requireValue(rktsEvidence?.upstream?.submoduleVerified === true, "rKTs 子模块提交未验证");
requireValue(rktsEvidence?.totals?.configuredCatalogs === 20 && rktsEvidence?.totals?.availableCatalogs === 19, "rKTs 配置目录计数漂移");
requireValue(rktsEvidence?.totals?.missingConfiguredCatalogs === 1 && rktsEvidence?.totals?.itemRecords === 15069, "rKTs 缺失配置或 item 计数漂移");
requireValue(rktsEvidence?.totals?.referenceFields === 15139 && rktsEvidence?.totals?.rktsLinks === 15116, "rKTs ref 或 kernel 链接计数漂移");
requireValue(rktsEvidence?.catalogs?.length === 20 && rktsEvidence.catalogs.filter((catalog) => catalog.sourcePathAvailable).length === 19, "rKTs 版本级目录明细不完整");
requireValue(rktsEvidence?.catalogs?.find((catalog) => catalog.id === "goldenmustang")?.exclusionReason === "configured_path_missing_at_frozen_source_commit", "rKTs Cx 缺失路径证据未保留");
requireValue(rktsEvidence?.rights?.sourceDataLicense === "CC0-1.0" && rktsEvidence?.integrity?.itemInventoryPublished === false, "rKTs 许可或发布边界漂移");
requireValue(tibetanFamily?.rktsCandidateItemRecords === 15069 && tibetanFamily?.rktsCatalogSnapshotSha256 === rktsSha256, "藏文来源族 rKTs 统计或摘要不匹配");
const rktsKernelSha256 = createHash("sha256").update(rktsKernelAlignmentsRaw).digest("hex");
requireValue(rktsKernelAlignments?.version === "0.6.0" && rktsKernelAlignments?.policy?.automaticWorkMerge === false, "rKTs kernel 对齐版本或合并策略漂移");
requireValue(rktsKernelAlignments?.kernel?.itemRecords === 1570 && rktsKernelAlignments?.kernel?.uniqueIds === 1562, "rKTs kernel 记录统计漂移");
requireValue(rktsKernelAlignments?.kernel?.duplicateIds?.length === 1 && rktsKernelAlignments.kernel.duplicateIds[0]?.id === "835", "rKTs kernel 重号反例漂移");
requireValue(rktsKernelAlignments?.summary?.exactKernelIds === 1143 && rktsKernelAlignments?.summary?.exactKernelIdsInTwoOrMoreCatalogs === 971, "rKTs kernel 精确跨版本连接统计漂移");
requireValue(rktsKernelAlignments?.summary?.unresolvedNormalizedIds === 8 && rktsKernelAlignments?.summary?.denominatorImpact === "none", "rKTs kernel 未决组件或分母边界漂移");
requireValue(rktsKernelAlignments?.exactAlignments?.length === 1143 && rktsKernelAlignments?.unresolvedIds?.every((item) => /^835-[1-8]$/.test(item.normalizedId)), "rKTs kernel 对齐或未决明细不完整");
requireValue(registry.rktsKernelAlignmentAudit?.sha256 === rktsKernelSha256 && registry.rktsKernelAlignmentAudit?.exactKernelIds === 1143, "登记册 rKTs kernel 对齐摘要不匹配");
requireValue(tibetanFamily?.rktsKernelAlignmentSha256 === rktsKernelSha256 && tibetanFamily?.rktsUnresolvedNormalizedIds === 8, "藏文来源族 rKTs kernel 对齐摘要不匹配");
const alignmentAudit = registry.crossCatalogAlignmentAudit;
requireValue(crossCatalogAlignments?.version === "0.5.0", "跨目录对齐账本版本漂移");
requireValue(crossCatalogAlignments?.policy?.automaticWorkMerge === false, "跨目录对齐不得自动合并作品");
requireValue(crossCatalogAlignments?.policy?.segmentEquivalenceAsserted === false, "跨目录对齐不得自动发布段落等同关系");
requireValue(crossCatalogAlignments?.summary?.curatedRelationGroups === 29, "跨目录关系组计数漂移");
requireValue(crossCatalogAlignments?.summary?.curatedRelationGroupsWithIdentifierJoin === 23, "已整理跨目录关系组计数漂移");
requireValue(crossCatalogAlignments?.summary?.relationGroupsRequiringManualReview === 6, "待人工复核跨目录关系组计数漂移");
requireValue(crossCatalogAlignments?.summary?.gbcrWorksReferenced === 57, "跨目录引用站内作品计数漂移");
requireValue(crossCatalogAlignments?.summary?.cbetaCitationIdentifiers === 92, "跨目录 CBETA 引用计数漂移");
requireValue(crossCatalogAlignments?.summary?.tohCitationIdentifiers === 31, "跨目录 Toh 引用计数漂移");
requireValue(crossCatalogAlignments?.summary?.uniqueTohBaseIdentifiers === 29, "跨目录 Toh 基础编号计数漂移");
requireValue(crossCatalogAlignments?.summary?.matchedDergeExpressions === 29, "跨目录德格表达式匹配计数漂移");
requireValue(crossCatalogAlignments?.summary?.unmatchedTohBaseIdentifiers === 0, "跨目录存在未匹配的 Toh 基础编号");
requireValue(crossCatalogAlignments?.summary?.denominatorImpact === "none", "跨目录候选连接不得改变全球分母");
requireValue(crossCatalogAlignments?.alignments?.length === 29, "跨目录逐组账本不完整");
unique(crossCatalogAlignments.alignments.map((item) => item.id), "跨目录对齐标识");
const workIds = new Set(registry.works.map((work) => work.id));
const dergeByCatalogId = new Map(dergeInventory.records.map((record) => [record.dergeCatalogId, record]));
for (const alignment of crossCatalogAlignments.alignments ?? []) {
  requireValue(alignment.gbcrWorkIds.every((id) => workIds.has(id)), `${alignment.id} 引用了未知站内作品`);
  for (const match of alignment.dergeMatches ?? []) {
    const record = dergeByCatalogId.get(match.dergeCatalogId);
    requireValue(record?.expressionId === match.dergeExpressionId, `${alignment.id} 的德格表达式不匹配`);
    requireValue(record?.linkedAbstractWorkId === match.linkedAbstractWorkId, `${alignment.id} 的 BDRC 作品标识不匹配`);
    requireValue(match.dergeCatalogId === `D${match.baseNumber}`, `${alignment.id} 的 Toh—D 基础编号不一致`);
  }
}
const alignmentSha256 = createHash("sha256").update(crossCatalogAlignmentsRaw).digest("hex");
requireValue(alignmentAudit?.sha256 === alignmentSha256, "登记册跨目录对齐摘要不匹配");
requireValue(alignmentAudit?.matchedDergeExpressions === 29 && alignmentAudit?.denominatorImpact === "none", "登记册跨目录对齐摘要统计不匹配");
requireValue(tibetanFamily?.crossCatalogAlignmentSha256 === alignmentSha256, "藏文来源族跨目录对齐摘要不匹配");
requireValue(rights84000?.policy?.publishedTranslations?.license === "CC BY-NC-ND 4.0", "84000 译文许可边界漂移");
requireValue(rights84000?.policy?.translationMetadata?.license === "CC BY 4.0", "84000 元数据许可边界漂移");
requireValue(rights84000?.policy?.api?.open === false && rights84000?.policy?.api?.writtenAgreementRequired === true, "84000 API 边界漂移");
const dsbcSnapshot = sourceSnapshots.sources.find((source) => source.id === "dsbc_sanskrit_catalog");
const gretilSnapshot = sourceSnapshots.sources.find((source) => source.id === "gretil_sanskrit_buddhist_files");
const registryGretilSource = registry.sourceSnapshots.find((source) => source.id === "gretil_sanskrit_buddhist_files");
const sanskritFamily = registry.sourceFamilies.find((family) => family.id === "sanskrit_fragments_and_witnesses");
requireValue(dsbcSnapshot?.candidateRecordCount === 486, "DSBC 梵文目录记录数漂移");
requireValue(gretilSnapshot?.candidateRecordCount === 417, "GRETIL 梵文佛教物理文件数漂移");
requireValue(dsbcSnapshot?.inventorySha256 === createHash("sha256").update(sanskritEvidenceRaw).digest("hex"), "DSBC 梵文来源证据摘要不匹配");
requireValue(gretilSnapshot?.inventorySha256 === createHash("sha256").update(sanskritEvidenceRaw).digest("hex"), "GRETIL 梵文来源证据摘要不匹配");
requireValue(sanskritEvidence?.dsbc?.groups?.sutrapitaka === 111, "DSBC 经藏类记录数漂移");
requireValue(sanskritEvidence?.dsbc?.groups?.vinayapitaka === 15, "DSBC 律藏类记录数漂移");
requireValue(sanskritEvidence?.dsbc?.groups?.sastrapitaka === 360, "DSBC 论疏及其他类记录数漂移");
requireValue(sanskritEvidence?.dsbc?.integrity?.itemInventoryPublished === false, "DSBC 逐条目录不得在无许可时发布");
requireValue(sanskritEvidence?.gretil?.commit === "0baf718d8e450821eb0403c03aacc9a4a82316d7", "GRETIL 固定提交漂移");
requireValue(sanskritEvidence?.gretil?.tree === "b3f67ca1d814b5b20a33fd5a0d686ad1768703ee", "GRETIL 固定 tree 漂移");
requireValue(sanskritEvidence?.gretil?.candidatePhysicalFiles === 417 && sanskritEvidence?.gretil?.candidateBytes === 62432484, "GRETIL 物理文件或字节统计漂移");
requireValue(sanskritRights?.dsbc?.observedPolicy?.reproductionWithoutPermissionProhibited === true, "DSBC 复制限制边界漂移");
requireValue(sanskritRights?.gretil?.repositoryLicenseDetected === false, "GRETIL 仓库级许可状态漂移");
const gretilRightsSha256 = createHash("sha256").update(gretilFileRightsAuditRaw).digest("hex");
requireValue(gretilFileRightsAudit?.version === "0.7.0", "GRETIL 逐文件权利账本版本漂移");
requireValue(gretilFileRightsAudit?.source?.commit === sanskritEvidence.gretil.commit && gretilFileRightsAudit?.source?.tree === sanskritEvidence.gretil.tree, "GRETIL 逐文件权利账本来源漂移");
requireValue(gretilFileRightsAudit?.summary?.filesAudited === 417 && gretilFileRightsAudit?.records?.length === 417, "GRETIL 逐文件权利账本不完整");
requireValue(gretilFileRightsAudit?.summary?.sourceBytes === 62432484, "GRETIL 逐文件权利账本字节数漂移");
requireValue(gretilFileRightsAudit?.summary?.filesMarkedReferenceOnly === 417 && gretilFileRightsAudit?.summary?.filesDeferringTermsToSource === 417, "GRETIL 仅供参考或来源条款回指计数漂移");
requireValue(gretilFileRightsAudit?.summary?.filesWithDsbcPermissionStatement === 179, "GRETIL 的 DSBC 展示许可记录数漂移");
requireValue(gretilFileRightsAudit?.summary?.filesWithExplicitCopyrightNotice === 26, "GRETIL 明示版权记录数漂移");
requireValue(gretilFileRightsAudit?.summary?.filesWithExplicitOpenLicense === 0 && gretilFileRightsAudit?.summary?.filesApprovedForRepublication === 0, "GRETIL 未经授权不得镜像正文");
requireValue(gretilFileRightsAudit?.summary?.filesRestrictedToMetadataAndExternalLink === 417, "GRETIL 外链限定记录数漂移");
requireValue(gretilFileRightsAudit?.summary?.classificationCounts?.dsbc_permission_reference_only === 179, "GRETIL DSBC 分类漂移");
requireValue(gretilFileRightsAudit?.summary?.classificationCounts?.explicit_copyright_reference_only === 26, "GRETIL 明示版权分类漂移");
requireValue(gretilFileRightsAudit?.summary?.classificationCounts?.source_terms_unspecified_reference_only === 212, "GRETIL 来源条款未明分类漂移");
requireValue(gretilFileRightsAudit?.integrity?.rawSourceBodiesPublished === false, "GRETIL 权利账本不得复制来源正文");
unique(gretilFileRightsAudit.records.map((record) => record.path), "GRETIL 逐文件权利路径");
requireValue(registry.gretilFileRightsAudit?.sha256 === gretilRightsSha256 && registry.gretilFileRightsAudit?.filesAudited === 417, "登记册 GRETIL 逐文件权利摘要不匹配");
requireValue(registryGretilSource?.rights?.status === "file_level_audited_metadata_and_external_link_only", "GRETIL 来源权利状态未升级");
requireValue(sanskritFamily?.denominatorStatus === "catalog_and_file_snapshots_ready_three_public_domain_indic_expressions_controlled_alignment_pending", "梵文来源族状态未升级");
requireValue(sanskritFamily?.candidateDsbcCatalogRecords === 486 && sanskritFamily?.candidateGretilPhysicalFiles === 417, "梵文来源族候选记录数不匹配");
requireValue(sanskritFamily?.gretilRightsAuditedFiles === 417 && sanskritFamily?.gretilFilesApprovedForRepublication === 0, "梵文来源族逐文件权利统计不匹配");
requireValue(sanskritFamily?.gretilRightsAuditSha256 === gretilRightsSha256, "梵文来源族逐文件权利摘要不匹配");
requireValue(sanskritFamily?.denominatorWorks === null, "梵文作品分母不得提前填写");
const indicRightsSha256 = createHash("sha256").update(suttacentralIndicRightsAuditRaw).digest("hex");
requireValue(suttacentralIndicRightsAudit?.version === "0.8.0", "SuttaCentral 印度语 root 权利账本版本漂移");
requireValue(suttacentralIndicRightsAudit?.source?.commit === "eac6c24781dd1eefdc17dc2f787b54bf6fe31719", "SuttaCentral 印度语 root 固定提交漂移");
requireValue(suttacentralIndicRightsAudit?.summary?.filesAudited === 24 && suttacentralIndicRightsAudit?.records?.length === 24, "SuttaCentral 印度语 root 权利账本不完整");
requireValue(suttacentralIndicRightsAudit?.summary?.sanskritRootFiles === 2 && suttacentralIndicRightsAudit?.summary?.prakritRootFiles === 22, "SuttaCentral 印度语 root 语言分组漂移");
requireValue(suttacentralIndicRightsAudit?.summary?.sourceBytes === 216385, "SuttaCentral 印度语 root 字节数漂移");
requireValue(suttacentralIndicRightsAudit?.summary?.sourceSegments === 1910 && suttacentralIndicRightsAudit?.summary?.stableSegments === 1909, "SuttaCentral 印度语 root 段落统计漂移");
requireValue(suttacentralIndicRightsAudit?.summary?.omittedEmptyEditorialPlaceholderSegments === 1, "SuttaCentral 印度语 root 空编辑占位统计漂移");
requireValue(suttacentralIndicRightsAudit?.summary?.filesApprovedForReadingAndRetrieval === 24 && suttacentralIndicRightsAudit?.summary?.filesApprovedForModelTraining === 0, "SuttaCentral 印度语 root 许可边界漂移");
requireValue(suttacentralIndicRightsAudit?.integrity?.translationBodiesPublished === false, "SuttaCentral 印度语 root 批次不得复制第三方译文");
requireValue(registry.suttacentralIndicRootRightsAudit?.sha256 === indicRightsSha256, "登记册 SuttaCentral 印度语 root 权利摘要不匹配");
requireValue(sanskritFamily?.controlledSuttacentralIndicWorks === 3 && sanskritFamily?.controlledSuttacentralIndicRootFiles === 24, "梵文来源族受控印度语 root 统计不匹配");
requireValue(sanskritFamily?.suttacentralIndicRightsAuditSha256 === indicRightsSha256, "梵文来源族印度语 root 权利摘要不匹配");
const vinayaRightsSha256 = createHash("sha256").update(suttacentralVinayaRightsAuditRaw).digest("hex");
requireValue(suttacentralVinayaRightsAudit?.version === "0.9.0", "SuttaCentral 巴利律藏 root 权利账本版本漂移");
requireValue(suttacentralVinayaRightsAudit?.source?.commit === "eac6c24781dd1eefdc17dc2f787b54bf6fe31719", "SuttaCentral 巴利律藏 root 固定提交漂移");
requireValue(suttacentralVinayaRightsAudit?.summary?.filesAudited === 422 && suttacentralVinayaRightsAudit?.records?.length === 422, "SuttaCentral 巴利律藏 root 权利账本不完整");
requireValue(suttacentralVinayaRightsAudit?.summary?.representedWorks === 6, "SuttaCentral 巴利律藏书级作品统计漂移");
requireValue(suttacentralVinayaRightsAudit?.summary?.sourceBytes === 6710444, "SuttaCentral 巴利律藏 root 字节数漂移");
requireValue(suttacentralVinayaRightsAudit?.summary?.sourceSegments === 71565 && suttacentralVinayaRightsAudit?.summary?.stableSegments === 71557, "SuttaCentral 巴利律藏 root 段落统计漂移");
requireValue(suttacentralVinayaRightsAudit?.summary?.omittedEmptySegments === 8, "SuttaCentral 巴利律藏 root 空段落统计漂移");
requireValue(suttacentralVinayaRightsAudit?.summary?.filesApprovedForReadingAndRetrieval === 422 && suttacentralVinayaRightsAudit?.summary?.filesApprovedForModelTraining === 0, "SuttaCentral 巴利律藏 root 许可边界漂移");
requireValue(suttacentralVinayaRightsAudit?.integrity?.sourceBodiesPublished === true && suttacentralVinayaRightsAudit?.integrity?.translationBodiesPublished === false, "SuttaCentral 巴利律藏 root 发布边界漂移");
requireValue(registry.suttacentralVinayaRootRightsAudit?.sha256 === vinayaRightsSha256, "登记册 SuttaCentral 巴利律藏 root 权利摘要不匹配");
const abhidhammaRightsSha256 = createHash("sha256").update(suttacentralAbhidhammaRightsAuditRaw).digest("hex");
requireValue(suttacentralAbhidhammaRightsAudit?.version === "1.0.0", "SuttaCentral 巴利论藏 root 权利账本版本漂移");
requireValue(suttacentralAbhidhammaRightsAudit?.source?.commit === "eac6c24781dd1eefdc17dc2f787b54bf6fe31719", "SuttaCentral 巴利论藏 root 固定提交漂移");
requireValue(suttacentralAbhidhammaRightsAudit?.summary?.filesAudited === 1102 && suttacentralAbhidhammaRightsAudit?.records?.length === 1102, "SuttaCentral 巴利论藏 root 权利账本不完整");
requireValue(suttacentralAbhidhammaRightsAudit?.summary?.representedWorks === 7, "SuttaCentral 巴利论藏七论统计漂移");
requireValue(suttacentralAbhidhammaRightsAudit?.summary?.sourceBytes === 11192917, "SuttaCentral 巴利论藏 root 字节数漂移");
requireValue(suttacentralAbhidhammaRightsAudit?.summary?.sourceSegments === 88414 && suttacentralAbhidhammaRightsAudit?.summary?.stableSegments === 88414, "SuttaCentral 巴利论藏 root 段落统计漂移");
requireValue(suttacentralAbhidhammaRightsAudit?.summary?.omittedEmptySegments === 0, "SuttaCentral 巴利论藏 root 不应含空正文值");
requireValue(suttacentralAbhidhammaRightsAudit?.summary?.filesApprovedForReadingAndRetrieval === 1102 && suttacentralAbhidhammaRightsAudit?.summary?.filesApprovedForModelTraining === 0, "SuttaCentral 巴利论藏 root 许可边界漂移");
requireValue(suttacentralAbhidhammaRightsAudit?.integrity?.sourceBodiesPublished === true && suttacentralAbhidhammaRightsAudit?.integrity?.translationBodiesPublished === false, "SuttaCentral 巴利论藏 root 发布边界漂移");
requireValue(registry.suttacentralAbhidhammaRootRightsAudit?.sha256 === abhidhammaRightsSha256, "登记册 SuttaCentral 巴利论藏 root 权利摘要不匹配");
const suttacentralChineseParallelsSha256 = createHash("sha256").update(suttacentralChineseParallelsRaw).digest("hex");
requireValue(suttacentralChineseParallels?.version === "0.7.0", "SuttaCentral 汉巴平行证据版本漂移");
requireValue(suttacentralChineseParallels?.source?.commit === "80b2a63d8442517c1f8be90c4b597088eb855852", "SuttaCentral 汉巴平行证据提交漂移");
requireValue(suttacentralChineseParallels?.source?.rows === 421159, "SuttaCentral 关系表总行数漂移");
requireValue(suttacentralChineseParallels?.source?.sha256 === "8481c812e38d2318a0bf70e9d7ea2320f2fe003e47d121f639966ac107736c80", "SuttaCentral 关系表摘要漂移");
requireValue(suttacentralChineseParallels?.summary?.relevantDirectedRows === 10596, "SuttaCentral 汉巴相关有向关系数漂移");
requireValue(suttacentralChineseParallels?.summary?.deduplicatedParallelEdges === 5161 && suttacentralChineseParallels?.parallels?.length === 5161, "SuttaCentral 汉巴去重关系边数漂移");
requireValue(suttacentralChineseParallels?.summary?.duplicateDirectionsRemoved === 5435, "SuttaCentral 汉巴反向重复关系数漂移");
requireValue(suttacentralChineseParallels?.summary?.decisionClasses?.full_parallel_without_automatic_work_merge === 60, "SuttaCentral 汉巴整经关系数漂移");
requireValue(suttacentralChineseParallels?.summary?.decisionClasses?.component_parallel_within_registered_work === 3345, "SuttaCentral 汉巴组件关系数漂移");
requireValue(suttacentralChineseParallels?.summary?.decisionClasses?.resembling_or_partial_parallel === 1130, "SuttaCentral 汉巴近似关系数漂移");
requireValue(suttacentralChineseParallels?.summary?.decisionClasses?.citation_or_mention_only === 626, "SuttaCentral 汉巴提及关系数漂移");
requireValue(suttacentralChineseParallels?.summary?.paliWorksReferenced === 246 && suttacentralChineseParallels?.summary?.chineseWorksReferenced === 147, "SuttaCentral 汉巴关系引用作品数漂移");
requireValue(suttacentralChineseParallels?.policy?.automaticWorkMerge === false && suttacentralChineseParallels?.policy?.segmentEquivalenceAsserted === false, "SuttaCentral 汉巴证据不得自动合并作品或断言逐段等同");
requireValue(suttacentralChineseParallels?.summary?.denominatorImpact === "none", "SuttaCentral 汉巴证据不得改变全球分母");
requireValue(registry.suttacentralChineseParallelAudit?.sha256 === suttacentralChineseParallelsSha256, "登记册 SuttaCentral 汉巴证据摘要不匹配");
requireValue(registry.sourceSnapshots.find((source) => source.id === "suttacentral_relationship_edges")?.rights?.status === "mit_parallel_metadata_with_no_automatic_work_merge", "SuttaCentral 汉巴关系来源权利或合并边界不匹配");
const suttacentralParallelReviewQueueSha256 = createHash("sha256").update(suttacentralParallelReviewQueueRaw).digest("hex");
requireValue(suttacentralParallelReviewQueue?.version === "0.1.0", "汉巴作品裁决队列版本漂移");
requireValue(suttacentralParallelReviewQueue?.generatedFrom?.sha256 === suttacentralChineseParallelsSha256, "汉巴作品裁决队列来源摘要不匹配");
requireValue(suttacentralParallelReviewQueue?.summary?.queueItems === 80 && suttacentralParallelReviewQueue?.items?.length === 80, "汉巴作品裁决队列必须完整保存 80 项");
requireValue(suttacentralParallelReviewQueue?.summary?.p0ScopeCaveatOrCounterevidence === 20, "汉巴作品裁决 P0 范围备注或反证项漂移");
requireValue(suttacentralParallelReviewQueue?.summary?.p1UpstreamFullStandalonePairs === 60, "汉巴作品裁决 P1 整经候选项漂移");
requireValue(suttacentralParallelReviewQueue?.summary?.assignedItems === 0 && suttacentralParallelReviewQueue?.summary?.completedIndependentReviews === 0, "未经真人提交不得伪造汉巴复核进度");
requireValue(suttacentralParallelReviewQueue?.summary?.adjudicatedItems === 0 && suttacentralParallelReviewQueue?.summary?.automaticMerges === 0, "未经双人复核与必要仲裁不得合并汉巴作品");
requireValue(suttacentralParallelReviewQueue?.summary?.denominatorImpact === "none", "未决汉巴裁决不得改变全球分母");
requireValue(suttacentralParallelReviewQueue?.governance?.minimumIndependentReviews === 2 && suttacentralParallelReviewQueue?.governance?.adjudicatorRequiredOnDisagreement === true, "汉巴作品裁决必须双人独立复核并在分歧时仲裁");
requireValue(suttacentralParallelReviewQueue?.governance?.automaticWorkMerge === false && suttacentralParallelReviewQueue?.governance?.automaticSegmentAlignment === false, "汉巴作品裁决不得自动合并作品或逐段对齐");
requireValue(suttacentralParallelReviewQueue?.governance?.aiMayPrepareEvidenceButMayNotCastHumanReview === true, "AI 不得冒充汉巴作品人工复核者");
requireValue(suttacentralParallelReviewQueue?.items?.every((item) => item.requiredReviews === 2 && item.reviews?.length === 0 && item.adjudication === null), "未决汉巴队列项不得预填复核或裁决");
requireValue(registry.suttacentralParallelReviewQueue?.sha256 === suttacentralParallelReviewQueueSha256, "登记册汉巴作品裁决队列摘要不匹配");
const suttacentralParallelP0EvidencePacketsSha256 = createHash("sha256").update(suttacentralParallelP0EvidencePacketsRaw).digest("hex");
requireValue(suttacentralParallelP0EvidencePackets?.version === "0.1.0", "汉巴 P0 审前证据包版本漂移");
requireValue(suttacentralParallelP0EvidencePackets?.summary?.packets === 20 && suttacentralParallelP0EvidencePackets?.packets?.length === 20, "汉巴 P0 审前证据包必须完整保存 20 项");
requireValue(suttacentralParallelP0EvidencePackets?.summary?.exactPaliStandaloneOrSourcePartAssets === 20, "汉巴 P0 审前证据包巴利资产未全部固定");
requireValue(suttacentralParallelP0EvidencePackets?.summary?.exactChineseInternalTeiRangesMachineLocated === 20, "汉巴 P0 审前证据包汉译范围未全部机器定位");
requireValue(suttacentralParallelP0EvidencePackets?.summary?.chineseInternalRangesPendingHumanBoundaryCheck === 20, "机器定位不得冒充汉译范围人工复核");
requireValue(suttacentralParallelP0EvidencePackets?.summary?.automaticWorkMerges === 0 && suttacentralParallelP0EvidencePackets?.summary?.denominatorImpact === "none", "汉巴 P0 审前证据包不得自动合并作品或改变分母");
requireValue(registry.suttacentralParallelP0EvidencePackets?.sha256 === suttacentralParallelP0EvidencePacketsSha256, "登记册汉巴 P0 审前证据摘要不匹配");
const chineseSubset = sourceSnapshots.sources
  .find((source) => source.id === "cbeta_xml_p5")
  ?.candidateSubsets?.find((subset) => subset.id === "taisho_chinese_sutra_t01_t17");
requireValue(chineseSubset?.candidateRecordCount === 881, "汉译经藏候选记录分母漂移");
requireValue(chineseSubset?.candidateBytes === 247280257, "汉译经藏候选字节数漂移");
requireValue(
  chineseSubset?.candidatePathSha256 === "69eb2530ae53000a606478824eec70e21fb238b495c0ee6c703e2e44f161cf44",
  "汉译经藏候选路径摘要漂移",
);
requireValue(chineseSubset?.inventoryFile === "data/gbcr/cbeta-taisho-sutra-inventory-v0.2.1.json", "汉译经藏逐文件清单路径不匹配");
requireValue(chineseSubset?.inventorySha256 === createHash("sha256").update(inventoryRaw).digest("hex"), "汉译经藏逐文件清单摘要不匹配");
requireValue(inventory?.totals?.records === 881, "汉译经藏逐文件清单记录数漂移");
requireValue(inventory?.totals?.upstreamBytes === 247280257, "汉译经藏逐文件清单字节数漂移");
requireValue(inventory?.records?.length === 881, "汉译经藏逐文件清单不完整");
unique(inventory.records.map((record) => record.sourceRecordId), "汉译经藏来源记录");
unique(inventory.records.map((record) => record.upstreamPath), "汉译经藏上游路径");
const chineseT18Subset = sourceSnapshots.sources
  .find((source) => source.id === "cbeta_xml_p5")
  ?.candidateSubsets?.find((subset) => subset.id === "taisho_esoteric_t18");
requireValue(chineseT18Subset?.candidateRecordCount === 76, "T18 密教部候选来源记录分母漂移");
requireValue(chineseT18Subset?.candidateBytes === 23056368, "T18 密教部候选来源字节数漂移");
requireValue(chineseT18Subset?.candidatePathSha256 === "216634c3736e87650a10a6da3c795720236fb99afba993a9dda6118733aea74a", "T18 密教部候选路径摘要漂移");
requireValue(chineseT18Subset?.inventoryFile === "data/gbcr/cbeta-taisho-t18-inventory-v0.1.0.json", "T18 密教部逐文件清单路径不匹配");
requireValue(chineseT18Subset?.inventorySha256 === createHash("sha256").update(t18InventoryRaw).digest("hex"), "T18 密教部逐文件清单摘要不匹配");
requireValue(t18Inventory?.totals?.records === 76 && t18Inventory?.records?.length === 76, "T18 密教部逐文件清单记录数漂移");
requireValue(t18Inventory?.totals?.upstreamBytes === 23056368, "T18 密教部逐文件清单字节数漂移");
unique(t18Inventory.records.map((record) => record.sourceRecordId), "T18 密教部来源记录");
unique(t18Inventory.records.map((record) => record.upstreamPath), "T18 密教部上游路径");
const chineseT19Subset = sourceSnapshots.sources
  .find((source) => source.id === "cbeta_xml_p5")
  ?.candidateSubsets?.find((subset) => subset.id === "taisho_esoteric_t19");
requireValue(chineseT19Subset?.candidateRecordCount === 126, "T19 密教部候选来源记录分母漂移");
requireValue(chineseT19Subset?.candidateBytes === 18889279, "T19 密教部候选来源字节数漂移");
requireValue(chineseT19Subset?.candidatePathSha256 === "951a90e94332b13d8a05af4e1ee420c6f8ee7306b2a8ff0b9dc69dd1f9de631d", "T19 密教部候选路径摘要漂移");
requireValue(chineseT19Subset?.inventoryFile === "data/gbcr/cbeta-taisho-t19-inventory-v0.1.0.json", "T19 密教部逐文件清单路径不匹配");
requireValue(chineseT19Subset?.inventorySha256 === createHash("sha256").update(t19InventoryRaw).digest("hex"), "T19 密教部逐文件清单摘要不匹配");
requireValue(t19Inventory?.totals?.records === 126 && t19Inventory?.records?.length === 126, "T19 密教部逐文件清单记录数漂移");
requireValue(t19Inventory?.totals?.upstreamBytes === 18889279, "T19 密教部逐文件清单字节数漂移");
unique(t19Inventory.records.map((record) => record.sourceRecordId), "T19 密教部来源记录");
unique(t19Inventory.records.map((record) => record.upstreamPath), "T19 密教部上游路径");
const chineseT20Subset = sourceSnapshots.sources
  .find((source) => source.id === "cbeta_xml_p5")
  ?.candidateSubsets?.find((subset) => subset.id === "taisho_esoteric_t20");
requireValue(chineseT20Subset?.candidateRecordCount === 184, "T20 密教部候选来源记录分母漂移");
requireValue(chineseT20Subset?.candidateBytes === 24220376, "T20 密教部候选来源字节数漂移");
requireValue(chineseT20Subset?.candidatePathSha256 === "bf0f821e6f1e90dc920f54418e0428eefdfe23f88d398026e69aa4fc6b6ba65f", "T20 密教部候选路径摘要漂移");
requireValue(chineseT20Subset?.inventoryFile === "data/gbcr/cbeta-taisho-t20-inventory-v0.1.0.json", "T20 密教部逐文件清单路径不匹配");
requireValue(chineseT20Subset?.inventorySha256 === createHash("sha256").update(t20InventoryRaw).digest("hex"), "T20 密教部逐文件清单摘要不匹配");
requireValue(t20Inventory?.totals?.records === 184 && t20Inventory?.records?.length === 184, "T20 密教部逐文件清单记录数漂移");
requireValue(t20Inventory?.totals?.upstreamBytes === 24220376, "T20 密教部逐文件清单字节数漂移");
unique(t20Inventory.records.map((record) => record.sourceRecordId), "T20 密教部来源记录");
unique(t20Inventory.records.map((record) => record.upstreamPath), "T20 密教部上游路径");
const chineseT21Subset = sourceSnapshots.sources
  .find((source) => source.id === "cbeta_xml_p5")
  ?.candidateSubsets?.find((subset) => subset.id === "taisho_esoteric_t21");
requireValue(chineseT21Subset?.candidateRecordCount === 228, "T21 密教部候选来源记录分母漂移");
requireValue(chineseT21Subset?.candidateBytes === 21264046, "T21 密教部候选来源字节数漂移");
requireValue(chineseT21Subset?.candidatePathSha256 === "405ebba94c6d3baaa7e94958928e609bdf836684d0dd5381421a340819e0ef1f", "T21 密教部候选路径摘要漂移");
requireValue(chineseT21Subset?.inventoryFile === "data/gbcr/cbeta-taisho-t21-inventory-v0.1.0.json", "T21 密教部逐文件清单路径不匹配");
requireValue(chineseT21Subset?.inventorySha256 === createHash("sha256").update(t21InventoryRaw).digest("hex"), "T21 密教部逐文件清单摘要不匹配");
requireValue(t21Inventory?.totals?.records === 228 && t21Inventory?.records?.length === 228, "T21 密教部逐文件清单记录数漂移");
requireValue(t21Inventory?.totals?.upstreamBytes === 21264046, "T21 密教部逐文件清单字节数漂移");
unique(t21Inventory.records.map((record) => record.sourceRecordId), "T21 密教部来源记录");
unique(t21Inventory.records.map((record) => record.upstreamPath), "T21 密教部上游路径");
const chineseT22Subset = sourceSnapshots.sources
  .find((source) => source.id === "cbeta_xml_p5")
  ?.candidateSubsets?.find((subset) => subset.id === "taisho_vinaya_t22");
requireValue(chineseT22Subset?.candidateRecordCount === 15, "T22 律部候选来源记录分母漂移");
requireValue(chineseT22Subset?.candidateBytes === 24063535, "T22 律部候选来源字节数漂移");
requireValue(chineseT22Subset?.candidatePathSha256 === "ec74e95a96d7c9b6a16ab96ec1f6787bafdf2e3aeaf30b667a3f310dc395b0a6", "T22 律部候选路径摘要漂移");
requireValue(chineseT22Subset?.inventoryFile === "data/gbcr/cbeta-taisho-t22-inventory-v0.1.0.json", "T22 律部逐文件清单路径不匹配");
requireValue(chineseT22Subset?.inventorySha256 === createHash("sha256").update(t22InventoryRaw).digest("hex"), "T22 律部逐文件清单摘要不匹配");
requireValue(t22Inventory?.totals?.records === 15 && t22Inventory?.records?.length === 15, "T22 律部逐文件清单记录数漂移");
requireValue(t22Inventory?.totals?.upstreamBytes === 24063535, "T22 律部逐文件清单字节数漂移");
unique(t22Inventory.records.map((record) => record.sourceRecordId), "T22 律部来源记录");
unique(t22Inventory.records.map((record) => record.upstreamPath), "T22 律部上游路径");
const chineseT23Subset = sourceSnapshots.sources
  .find((source) => source.id === "cbeta_xml_p5")
  ?.candidateSubsets?.find((subset) => subset.id === "taisho_vinaya_t23");
requireValue(chineseT23Subset?.candidateRecordCount === 13, "T23 律部候选来源记录分母漂移");
requireValue(chineseT23Subset?.candidateBytes === 18890532, "T23 律部候选来源字节数漂移");
requireValue(chineseT23Subset?.candidatePathSha256 === "ab7ee3274e2c3aa4484ca6a0fa5e9d627acb5a4feb8d1781cb6acfaaa3d4d5a3", "T23 律部候选路径摘要漂移");
requireValue(chineseT23Subset?.inventoryFile === "data/gbcr/cbeta-taisho-t23-inventory-v0.1.0.json", "T23 律部逐文件清单路径不匹配");
requireValue(chineseT23Subset?.inventorySha256 === createHash("sha256").update(t23InventoryRaw).digest("hex"), "T23 律部逐文件清单摘要不匹配");
requireValue(t23Inventory?.totals?.records === 13 && t23Inventory?.records?.length === 13, "T23 律部逐文件清单记录数漂移");
requireValue(t23Inventory?.totals?.upstreamBytes === 18890532, "T23 律部逐文件清单字节数漂移");
unique(t23Inventory.records.map((record) => record.sourceRecordId), "T23 律部来源记录");
unique(t23Inventory.records.map((record) => record.upstreamPath), "T23 律部上游路径");
const chineseT24Subset = sourceSnapshots.sources
  .find((source) => source.id === "cbeta_xml_p5")
  ?.candidateSubsets?.find((subset) => subset.id === "taisho_vinaya_t24");
requireValue(chineseT24Subset?.candidateRecordCount === 59, "T24 律部候选来源记录分母漂移");
requireValue(chineseT24Subset?.candidateBytes === 19745486, "T24 律部候选来源字节数漂移");
requireValue(chineseT24Subset?.candidatePathSha256 === "10212439eec4876aa3f6852280f1e9a8fdf65f863e97f451c0e4f1fe3d1db334", "T24 律部候选路径摘要漂移");
requireValue(chineseT24Subset?.inventoryFile === "data/gbcr/cbeta-taisho-t24-inventory-v0.1.0.json", "T24 律部逐文件清单路径不匹配");
requireValue(chineseT24Subset?.inventorySha256 === createHash("sha256").update(t24InventoryRaw).digest("hex"), "T24 律部逐文件清单摘要不匹配");
requireValue(t24Inventory?.totals?.records === 59 && t24Inventory?.records?.length === 59, "T24 律部逐文件清单记录数漂移");
requireValue(t24Inventory?.totals?.upstreamBytes === 19745486, "T24 律部逐文件清单字节数漂移");
unique(t24Inventory.records.map((record) => record.sourceRecordId), "T24 律部来源记录");
unique(t24Inventory.records.map((record) => record.upstreamPath), "T24 律部上游路径");
const chineseFamily = registry.sourceFamilies.find((family) => family.id === "cbeta_chinese");
requireValue(chineseFamily?.suttacentralParallelEdges === 5161 && chineseFamily?.suttacentralParallelChineseWorksReferenced === 147, "汉译来源族的 SuttaCentral 平行证据统计不匹配");
requireValue(chineseFamily?.suttacentralParallelEvidenceSha256 === suttacentralChineseParallelsSha256, "汉译来源族的 SuttaCentral 平行证据摘要不匹配");
requireValue(chineseFamily?.suttacentralParallelReviewQueueItems === 80 && chineseFamily?.suttacentralParallelAdjudicatedItems === 0, "汉译来源族的汉巴裁决进度不匹配");
requireValue(chineseFamily?.suttacentralParallelReviewQueueSha256 === suttacentralParallelReviewQueueSha256, "汉译来源族的汉巴裁决队列摘要不匹配");
requireValue(chineseFamily?.candidateExpressionRecords === 1582, "汉译 T01–T24 候选记录未写入来源族");
requireValue(chineseFamily?.controlledExpressionRecords === 1582, "汉译 T01–T24 受控记录数不匹配");
requireValue(chineseFamily?.candidateExpressionBytes === 397409879, "汉译 T01–T24 候选字节数未写入来源族");
requireValue(chineseFamily?.controlledExpressionBytes === 397409879, "汉译 T01–T24 受控字节数不匹配");
requireValue(chineseFamily?.agamaSourceRecordDenominator === 155, "汉译阿含部固定来源分母不匹配");
requireValue(chineseFamily?.agamaControlledSourceRecords === 155, "汉译阿含部固定来源未完整受控");
requireValue(chineseFamily?.agamaSourceRecordPercentage === 100, "汉译阿含部固定来源完成率不匹配");
requireValue(agamaBatch?.files?.length === 151, "CBETA T01–T02 新增来源记录数漂移");
requireValue(agamaBatch?.collection?.sourceRecordDenominator === 155, "CBETA T01–T02 固定来源分母漂移");
requireValue(agamaBatch?.collection?.controlledSourceRecords === 155, "CBETA T01–T02 固定来源未完整受控");
requireValue(agamaBatch?.collection?.newSourceBytes === 10508944, "CBETA T01–T02 新增来源字节数漂移");
requireValue(agamaBatch?.collection?.newStableSegments === 52551, "CBETA T01–T02 新增稳定行段数漂移");
requireValue(chineseFamily?.benyuanSourceRecordDenominator === 72, "汉译本缘部固定来源分母不匹配");
requireValue(chineseFamily?.benyuanControlledSourceRecords === 72, "汉译本缘部固定来源未完整受控");
requireValue(chineseFamily?.benyuanSourceRecordPercentage === 100, "汉译本缘部固定来源完成率不匹配");
requireValue(benyuanBatch?.files?.length === 71, "CBETA T03–T04 新增来源记录数漂移");
requireValue(benyuanBatch?.collection?.sourceRecordDenominator === 72, "CBETA T03–T04 固定来源分母漂移");
requireValue(benyuanBatch?.collection?.controlledSourceRecords === 72, "CBETA T03–T04 固定来源未完整受控");
requireValue(benyuanBatch?.collection?.newSourceBytes === 33152203, "CBETA T03–T04 新增来源字节数漂移");
requireValue(benyuanBatch?.collection?.newStableSegments === 150383, "CBETA T03–T04 新增稳定行段数漂移");
requireValue(benyuanBatch?.collection?.attributedAuthoredOrCompiledRecords === 8, "CBETA T03–T04 造撰集类边界漂移");
requireValue(benyuanBatch?.collection?.relationAnnotatedRecords === 17, "CBETA T03–T04 关系证据记录数漂移");
requireValue(benyuanBatch?.boundaryAudit?.status === "relation_candidates_recorded_work_dedup_pending", "CBETA T03–T04 作品边界状态不匹配");
requireValue(chineseFamily?.prajnaparamitaSourceRecordDenominator === 57, "汉译般若部固定来源分母不匹配");
requireValue(chineseFamily?.prajnaparamitaControlledSourceRecords === 57, "汉译般若部固定来源未完整受控");
requireValue(chineseFamily?.prajnaparamitaSourceRecordPercentage === 100, "汉译般若部固定来源完成率不匹配");
requireValue(prajnaparamitaBatch?.files?.length === 39, "CBETA T05–T08 新增来源记录数漂移");
requireValue(prajnaparamitaBatch?.collection?.sourceRecordDenominator === 57, "CBETA T05–T08 固定来源分母漂移");
requireValue(prajnaparamitaBatch?.collection?.controlledSourceRecords === 57, "CBETA T05–T08 固定来源未完整受控");
requireValue(prajnaparamitaBatch?.collection?.newSourceBytes === 11312892, "CBETA T05–T08 新增来源字节数漂移");
requireValue(prajnaparamitaBatch?.collection?.newStableSegments === 60230, "CBETA T05–T08 新增稳定行段数漂移");
requireValue(prajnaparamitaBatch?.collection?.verifiedSameWorkExpressions === 11, "CBETA T05–T08 已验证同作品表达数漂移");
requireValue(prajnaparamitaBatch?.collection?.provisionalRecords === 28, "CBETA T05–T08 暂定书目记录数漂移");
requireValue(prajnaparamitaBatch?.collection?.relationAnnotatedRecords === 35, "CBETA T05–T08 关系证据记录数漂移");
requireValue(prajnaparamitaBatch?.collection?.attributionBoundaryRecords === 3, "CBETA T05–T08 署名角色边界漂移");
requireValue(
  prajnaparamitaBatch?.boundaryAudit?.status === "verified_translation_groups_and_relation_candidates_recorded",
  "CBETA T05–T08 作品边界状态不匹配",
);
requireValue(chineseFamily?.lotusSourceRecordDenominator === 17, "汉译法华部固定来源分母不匹配");
requireValue(chineseFamily?.lotusControlledSourceRecords === 17, "汉译法华部固定来源未完整受控");
requireValue(chineseFamily?.lotusSourceRecordPercentage === 100, "汉译法华部固定来源完成率不匹配");
requireValue(lotusBatch?.files?.length === 15, "CBETA T09 新增来源记录数漂移");
requireValue(lotusBatch?.collection?.sourceRecordDenominator === 17, "CBETA T09 固定来源分母漂移");
requireValue(lotusBatch?.collection?.controlledSourceRecords === 17, "CBETA T09 固定来源未完整受控");
requireValue(lotusBatch?.collection?.newSourceBytes === 6342363, "CBETA T09 新增来源字节数漂移");
requireValue(lotusBatch?.collection?.newStableSegments === 28512, "CBETA T09 新增稳定行段数漂移");
requireValue(lotusBatch?.collection?.newFolios === 1034, "CBETA T09 新增版页数漂移");
requireValue(lotusBatch?.collection?.verifiedSameWorkExpressions === 7, "CBETA T09 已验证同作品表达数漂移");
requireValue(lotusBatch?.collection?.verifiedPartialWorkWitnesses === 1, "CBETA T09 节译见证数漂移");
requireValue(lotusBatch?.collection?.provisionalRecords === 7, "CBETA T09 暂定书目记录数漂移");
requireValue(lotusBatch?.collection?.relationAnnotatedRecords === 11, "CBETA T09 关系证据记录数漂移");
requireValue(lotusBatch?.collection?.attributionBoundaryRecords === 2, "CBETA T09 来源角色边界漂移");
requireValue(
  lotusBatch?.boundaryAudit?.status === "verified_translation_groups_partial_witness_and_liturgical_family_recorded",
  "CBETA T09 作品边界状态不匹配",
);
requireValue(chineseFamily?.avatamsakaSourceRecordDenominator === 31, "汉译华严部固定来源分母不匹配");
requireValue(chineseFamily?.avatamsakaControlledSourceRecords === 31, "汉译华严部固定来源未完整受控");
requireValue(chineseFamily?.avatamsakaSourceRecordPercentage === 100, "汉译华严部固定来源完成率不匹配");
requireValue(avatamsakaBatch?.files?.length === 30, "CBETA T10 新增来源记录数漂移");
requireValue(avatamsakaBatch?.collection?.sourceRecordDenominator === 31, "CBETA T10 固定来源分母漂移");
requireValue(avatamsakaBatch?.collection?.controlledSourceRecords === 31, "CBETA T10 固定来源未完整受控");
requireValue(avatamsakaBatch?.collection?.newSourceBytes === 9331418, "CBETA T10 新增来源字节数漂移");
requireValue(avatamsakaBatch?.collection?.newStableSegments === 51718, "CBETA T10 新增稳定行段数漂移");
requireValue(avatamsakaBatch?.collection?.newFolios === 1881, "CBETA T10 新增版页数漂移");
requireValue(avatamsakaBatch?.collection?.verifiedSameWorkExpressions === 13, "CBETA T10 已验证同作品表达数漂移");
requireValue(avatamsakaBatch?.collection?.verifiedPartialWorkWitnesses === 2, "CBETA T10 节译见证数漂移");
requireValue(avatamsakaBatch?.collection?.provisionalRecords === 15, "CBETA T10 暂定书目记录数漂移");
requireValue(avatamsakaBatch?.collection?.relationAnnotatedRecords === 24, "CBETA T10 关系证据记录数漂移");
requireValue(avatamsakaBatch?.collection?.attributionBoundaryRecords === 3, "CBETA T10 来源角色边界漂移");
requireValue(
  avatamsakaBatch?.boundaryAudit?.status === "verified_translation_groups_partial_component_witnesses_and_candidates_recorded",
  "CBETA T10 作品边界状态不匹配",
);
requireValue(chineseFamily?.ratnakutaSourceRecordDenominator === 12, "汉译宝积部固定来源分母不匹配");
requireValue(chineseFamily?.ratnakutaControlledSourceRecords === 12, "汉译宝积部固定来源未完整受控");
requireValue(chineseFamily?.ratnakutaSourceRecordPercentage === 100, "汉译宝积部固定来源完成率不匹配");
requireValue(ratnakutaBatch?.files?.length === 11, "CBETA T11 新增来源记录数漂移");
requireValue(ratnakutaBatch?.collection?.sourceRecordDenominator === 12, "CBETA T11 固定来源分母漂移");
requireValue(ratnakutaBatch?.collection?.controlledSourceRecords === 12, "CBETA T11 固定来源未完整受控");
requireValue(ratnakutaBatch?.collection?.newSourceBytes === 3417170, "CBETA T11 新增来源字节数漂移");
requireValue(ratnakutaBatch?.collection?.newStableSegments === 24936, "CBETA T11 新增稳定行段数漂移");
requireValue(ratnakutaBatch?.collection?.newFolios === 942, "CBETA T11 新增版页数漂移");
requireValue(ratnakutaBatch?.collection?.verifiedSameWorkExpressions === 2, "CBETA T11 已验证同作品表达数漂移");
requireValue(ratnakutaBatch?.collection?.verifiedSameWorkWitnesses === 2, "CBETA T11 已验证同作品版本见证数漂移");
requireValue(ratnakutaBatch?.collection?.provisionalRecords === 7, "CBETA T11 暂定书目记录数漂移");
requireValue(ratnakutaBatch?.collection?.relationAnnotatedRecords === 11, "CBETA T11 关系证据记录数漂移");
requireValue(ratnakutaBatch?.collection?.attributionBoundaryRecords === 2, "CBETA T11 来源角色边界漂移");
requireValue(
  ratnakutaBatch?.boundaryAudit?.status === "verified_collection_components_translation_group_and_edition_witnesses_recorded",
  "CBETA T11 作品边界状态不匹配",
);
requireValue(chineseFamily?.t12SourceRecordDenominator === 76, "汉译 T12 固定来源分母不匹配");
requireValue(chineseFamily?.t12ControlledSourceRecords === 76, "汉译 T12 固定来源未完整受控");
requireValue(chineseFamily?.t12SourceRecordPercentage === 100, "汉译 T12 固定来源完成率不匹配");
requireValue(t12Batch?.files?.length === 71, "CBETA T12 新增来源记录数漂移");
requireValue(t12Batch?.collection?.sourceRecordDenominator === 76, "CBETA T12 固定来源分母漂移");
requireValue(t12Batch?.collection?.controlledSourceRecords === 76, "CBETA T12 固定来源未完整受控");
requireValue(t12Batch?.collection?.newSourceBytes === 11111518, "CBETA T12 新增来源字节数漂移");
requireValue(t12Batch?.collection?.newStableSegments === 52212, "CBETA T12 新增稳定行段数漂移");
requireValue(t12Batch?.collection?.newFolios === 1924, "CBETA T12 新增版页数漂移");
requireValue(t12Batch?.collection?.verifiedSameWorkExpressions === 39, "CBETA T12 已验证同作品表达数漂移");
requireValue(t12Batch?.collection?.verifiedSameWorkWitnesses === 1, "CBETA T12 已验证同作品版本见证数漂移");
requireValue(t12Batch?.collection?.verifiedPartialWorkWitnesses === 2, "CBETA T12 节译或后分见证数漂移");
requireValue(t12Batch?.collection?.provisionalRecords === 29, "CBETA T12 暂定书目记录数漂移");
requireValue(t12Batch?.collection?.fullSourceTexts === 68, "CBETA T12 完整作品文本数漂移");
requireValue(t12Batch?.collection?.partialSourceWitnesses === 3, "CBETA T12 残篇或节译来源数漂移");
requireValue(t12Batch?.collection?.relationAnnotatedRecords === 54, "CBETA T12 关系证据记录数漂移");
requireValue(t12Batch?.collection?.attributionBoundaryRecords === 12, "CBETA T12 来源角色边界漂移");
requireValue(
  t12Batch?.boundaryAudit?.status === "verified_translation_groups_collection_components_recensions_and_partial_witnesses_recorded",
  "CBETA T12 作品边界状态不匹配",
);
requireValue(chineseFamily?.t13SourceRecordDenominator === 28, "汉译 T13 固定来源分母不匹配");
requireValue(chineseFamily?.t13ControlledSourceRecords === 28, "汉译 T13 固定来源未完整受控");
requireValue(chineseFamily?.t13SourceRecordPercentage === 100, "汉译 T13 固定来源完成率不匹配");
requireValue(t13Batch?.files?.length === 28, "CBETA T13 新增来源记录数漂移");
requireValue(t13Batch?.collection?.sourceRecordDenominator === 28, "CBETA T13 固定来源分母漂移");
requireValue(t13Batch?.collection?.controlledSourceRecords === 28, "CBETA T13 固定来源未完整受控");
requireValue(t13Batch?.collection?.newSourceBytes === 15927605, "CBETA T13 新增来源字节数漂移");
requireValue(t13Batch?.collection?.newStableSegments === 85408, "CBETA T13 新增稳定行段数漂移");
requireValue(t13Batch?.collection?.newFolios === 3108, "CBETA T13 新增版页数漂移");
requireValue(t13Batch?.collection?.verifiedCollectionExpressions === 1, "CBETA T13 合集表达数漂移");
requireValue(t13Batch?.collection?.verifiedSameWorkExpressions === 15, "CBETA T13 已验证同作品表达数漂移");
requireValue(t13Batch?.collection?.verifiedPartialWorkWitnesses === 1, "CBETA T13 节本见证数漂移");
requireValue(t13Batch?.collection?.provisionalRecords === 11, "CBETA T13 暂定书目记录数漂移");
requireValue(t13Batch?.collection?.fullSourceTexts === 27, "CBETA T13 完整作品文本数漂移");
requireValue(t13Batch?.collection?.partialSourceWitnesses === 1, "CBETA T13 部分作品见证数漂移");
requireValue(t13Batch?.collection?.relationAnnotatedRecords === 25, "CBETA T13 关系证据记录数漂移");
requireValue(t13Batch?.collection?.attributionBoundaryRecords === 7, "CBETA T13 来源角色边界漂移");
requireValue(
  t13Batch?.boundaryAudit?.status === "verified_collection_components_translation_groups_abridgement_and_attribution_disputes_recorded",
  "CBETA T13 作品边界状态不匹配",
);
requireValue(chineseFamily?.t14SourceRecordDenominator === 166, "汉译 T14 固定来源分母不匹配");
requireValue(chineseFamily?.t14ControlledSourceRecords === 166, "汉译 T14 固定来源未完整受控");
requireValue(chineseFamily?.t14SourceRecordPercentage === 100, "汉译 T14 固定来源完成率不匹配");
requireValue(t14Batch?.files?.length === 165, "CBETA T14 新增来源记录数漂移");
requireValue(t14Batch?.collection?.sourceRecordDenominator === 166, "CBETA T14 固定来源分母漂移");
requireValue(t14Batch?.collection?.controlledSourceRecords === 166, "CBETA T14 固定来源未完整受控");
requireValue(t14Batch?.collection?.newSourceBytes === 15903183, "CBETA T14 新增来源字节数漂移");
requireValue(t14Batch?.collection?.newStableSegments === 80670, "CBETA T14 新增稳定行段数漂移");
requireValue(t14Batch?.collection?.newFolios === 3025, "CBETA T14 新增版页数漂移");
requireValue(t14Batch?.collection?.verifiedSameWorkExpressions === 51, "CBETA T14 已验证同作品表达数漂移");
requireValue(t14Batch?.collection?.verifiedSameWorkWitnesses === 12, "CBETA T14 版本见证数漂移");
requireValue(t14Batch?.collection?.verifiedPartialWorkWitnesses === 1, "CBETA T14 部分译出见证数漂移");
requireValue(t14Batch?.collection?.provisionalRecords === 101, "CBETA T14 暂定书目记录数漂移");
requireValue(t14Batch?.collection?.fullSourceTexts === 164, "CBETA T14 完整作品文本数漂移");
requireValue(t14Batch?.collection?.partialSourceWitnesses === 1, "CBETA T14 部分作品见证数漂移");
requireValue(t14Batch?.collection?.relationAnnotatedRecords === 65, "CBETA T14 关系证据记录数漂移");
requireValue(t14Batch?.collection?.attributionBoundaryRecords === 24, "CBETA T14 来源角色边界漂移");
requireValue(
  t14Batch?.boundaryAudit?.status === "verified_translation_groups_edition_witnesses_partial_translation_and_scope_boundaries_recorded",
  "CBETA T14 作品边界状态不匹配",
);
requireValue(chineseFamily?.t15SourceRecordDenominator === 71, "汉译 T15 固定来源分母不匹配");
requireValue(chineseFamily?.t15ControlledSourceRecords === 71, "汉译 T15 固定来源未完整受控");
requireValue(chineseFamily?.t15SourceRecordPercentage === 100, "汉译 T15 固定来源完成率不匹配");
requireValue(t15Batch?.files?.length === 71, "CBETA T15 新增来源记录数漂移");
requireValue(t15Batch?.collection?.sourceRecordDenominator === 71, "CBETA T15 固定来源分母漂移");
requireValue(t15Batch?.collection?.controlledSourceRecords === 71, "CBETA T15 固定来源未完整受控");
requireValue(t15Batch?.collection?.newSourceBytes === 16533763, "CBETA T15 新增来源字节数漂移");
requireValue(t15Batch?.collection?.newStableSegments === 69072, "CBETA T15 新增稳定行段数漂移");
requireValue(t15Batch?.collection?.newFolios === 2527, "CBETA T15 新增版页数漂移");
requireValue(t15Batch?.collection?.verifiedSameWorkExpressions === 21, "CBETA T15 已验证同作品表达数漂移");
requireValue(t15Batch?.collection?.verifiedPartialWorkWitnesses === 2, "CBETA T15 部分译出见证数漂移");
requireValue(t15Batch?.collection?.provisionalRecords === 48, "CBETA T15 暂定书目记录数漂移");
requireValue(t15Batch?.collection?.fullSourceTexts === 69, "CBETA T15 完整作品文本数漂移");
requireValue(t15Batch?.collection?.partialSourceWitnesses === 2, "CBETA T15 部分作品见证数漂移");
requireValue(t15Batch?.collection?.relationAnnotatedRecords === 27, "CBETA T15 关系证据记录数漂移");
requireValue(t15Batch?.collection?.attributionBoundaryRecords === 9, "CBETA T15 来源角色边界漂移");
requireValue(
  t15Batch?.boundaryAudit?.status === "verified_translation_groups_partial_witnesses_authorship_and_scope_boundaries_recorded",
  "CBETA T15 作品边界状态不匹配",
);
requireValue(chineseFamily?.t16SourceRecordDenominator === 65, "汉译 T16 固定来源分母不匹配");
requireValue(chineseFamily?.t16ControlledSourceRecords === 65, "汉译 T16 固定来源未完整受控");
requireValue(chineseFamily?.t16SourceRecordPercentage === 100, "汉译 T16 固定来源完成率不匹配");
requireValue(t16Batch?.files?.length === 62, "CBETA T16 新增来源记录数漂移");
requireValue(t16Batch?.collection?.sourceRecordDenominator === 65, "CBETA T16 固定来源分母漂移");
requireValue(t16Batch?.collection?.previouslyControlledSourceRecords === 3, "CBETA T16 既有受控来源记录数漂移");
requireValue(t16Batch?.collection?.controlledSourceRecords === 65, "CBETA T16 固定来源未完整受控");
requireValue(t16Batch?.collection?.newSourceBytes === 11363551, "CBETA T16 新增来源字节数漂移");
requireValue(t16Batch?.collection?.newStableSegments === 59284, "CBETA T16 新增稳定行段数漂移");
requireValue(t16Batch?.collection?.newFolios === 2171, "CBETA T16 新增版页数漂移");
requireValue(t16Batch?.collection?.verifiedSameWorkExpressions === 33, "CBETA T16 已验证同作品表达数漂移");
requireValue(t16Batch?.collection?.verifiedCompiledVersionWitnesses === 1, "CBETA T16 合部编纂见证数漂移");
requireValue(t16Batch?.collection?.verifiedPartialWorkWitnesses === 4, "CBETA T16 局部或短本见证数漂移");
requireValue(t16Batch?.collection?.provisionalRecords === 24, "CBETA T16 暂定书目记录数漂移");
requireValue(t16Batch?.collection?.fullSourceTexts === 58, "CBETA T16 完整作品文本数漂移");
requireValue(t16Batch?.collection?.partialSourceWitnesses === 4, "CBETA T16 部分作品见证数漂移");
requireValue(t16Batch?.collection?.relationAnnotatedRecords === 38, "CBETA T16 关系证据记录数漂移");
requireValue(t16Batch?.collection?.attributionBoundaryRecords === 10, "CBETA T16 来源角色边界漂移");
requireValue(t16Batch?.collection?.newWorks === 39, "CBETA T16 新增作品实体数漂移");
requireValue(
  t16Batch?.boundaryAudit?.status === "verified_translation_groups_partial_and_compiled_witnesses_attribution_boundaries_recorded",
  "CBETA T16 作品边界状态不匹配",
);
requireValue(chineseFamily?.t17SourceRecordDenominator === 131, "汉译 T17 固定来源分母不匹配");
requireValue(chineseFamily?.t17ControlledSourceRecords === 131, "汉译 T17 固定来源未完整受控");
requireValue(chineseFamily?.t17SourceRecordPercentage === 100, "汉译 T17 固定来源完成率不匹配");
requireValue(t17Batch?.files?.length === 129, "CBETA T17 新增来源记录数漂移");
requireValue(t17Batch?.collection?.sourceRecordDenominator === 131, "CBETA T17 固定来源分母漂移");
requireValue(t17Batch?.collection?.previouslyControlledSourceRecords === 2, "CBETA T17 既有受控来源记录数漂移");
requireValue(t17Batch?.collection?.controlledSourceRecords === 131, "CBETA T17 固定来源未完整受控");
requireValue(t17Batch?.collection?.newSourceBytes === 14726248, "CBETA T17 新增来源字节数漂移");
requireValue(t17Batch?.collection?.newStableSegments === 81274, "CBETA T17 新增稳定行段数漂移");
requireValue(t17Batch?.collection?.newFolios === 3016, "CBETA T17 新增版页数漂移");
requireValue(t17Batch?.collection?.verifiedSameWorkExpressions === 29, "CBETA T17 已验证同作品表达数漂移");
requireValue(t17Batch?.collection?.verifiedEditionWitnesses === 8, "CBETA T17 版本见证数漂移");
requireValue(t17Batch?.collection?.provisionalRecords === 92, "CBETA T17 暂定书目记录数漂移");
requireValue(t17Batch?.collection?.fullSourceTexts === 129, "CBETA T17 完整来源文本数漂移");
requireValue(t17Batch?.collection?.partialSourceWitnesses === 0, "CBETA T17 不应登记部分来源见证");
requireValue(t17Batch?.collection?.relationAnnotatedRecords === 46, "CBETA T17 关系证据记录数漂移");
requireValue(t17Batch?.collection?.attributionBoundaryRecords === 22, "CBETA T17 来源角色边界漂移");
requireValue(t17Batch?.collection?.newWorks === 109, "CBETA T17 新增作品实体数漂移");
requireValue(
  t17Batch?.boundaryAudit?.status === "verified_translation_and_edition_groups_candidate_relations_authorship_and_attribution_boundaries_recorded",
  "CBETA T17 作品边界状态不匹配",
);
requireValue(chineseFamily?.t18SourceRecordDenominator === 76, "汉译 T18 固定来源分母不匹配");
requireValue(chineseFamily?.t18ControlledSourceRecords === 76, "汉译 T18 固定来源未完整受控");
requireValue(chineseFamily?.t18SourceRecordPercentage === 100, "汉译 T18 固定来源完成率不匹配");
requireValue(t18Batch?.files?.length === 76, "CBETA T18 新增来源记录数漂移");
requireValue(t18Batch?.collection?.sourceRecordDenominator === 76 && t18Batch?.collection?.controlledSourceRecords === 76, "CBETA T18 固定来源分母或受控记录数漂移");
requireValue(t18Batch?.collection?.newSourceBytes === 23056368, "CBETA T18 新增来源字节数漂移");
requireValue(t18Batch?.collection?.newStableSegments === 77825, "CBETA T18 新增稳定行段数漂移");
requireValue(t18Batch?.collection?.newFolios === 2957, "CBETA T18 新增版页数漂移");
requireValue(t18Batch?.collection?.verifiedEditionWitnesses === 9, "CBETA T18 版本见证数漂移");
requireValue(t18Batch?.collection?.provisionalRecords === 67, "CBETA T18 暂定书目记录数漂移");
requireValue(t18Batch?.collection?.fullSourceTexts === 74 && t18Batch?.collection?.partialSourceWitnesses === 2, "CBETA T18 完整作品来源或局部见证数漂移");
requireValue(t18Batch?.collection?.relationAnnotatedRecords === 15, "CBETA T18 关系证据记录数漂移");
requireValue(t18Batch?.collection?.attributionBoundaryRecords === 25, "CBETA T18 来源角色边界漂移");
requireValue(t18Batch?.collection?.newWorks === 71, "CBETA T18 新增作品实体数漂移");
requireValue(
  t18Batch?.boundaryAudit?.status === "verified_source_integrity_edition_groups_attribution_partial_witness_and_homonymous_scope_boundaries_recorded",
  "CBETA T18 作品边界状态不匹配",
);
requireValue(registry.cbetaT18BoundaryAudit?.sha256 === createHash("sha256").update(t18BatchRaw).digest("hex"), "登记册 CBETA T18 边界审计摘要不匹配");
requireValue(chineseFamily?.t19SourceRecordDenominator === 126, "汉译 T19 固定来源分母不匹配");
requireValue(chineseFamily?.t19ControlledSourceRecords === 126, "汉译 T19 固定来源未完整受控");
requireValue(chineseFamily?.t19SourceRecordPercentage === 100, "汉译 T19 固定来源完成率不匹配");
requireValue(t19Batch?.files?.length === 125, "CBETA T19 新增来源记录数漂移");
requireValue(t19Batch?.collection?.sourceRecordDenominator === 126 && t19Batch?.collection?.controlledSourceRecords === 126, "CBETA T19 固定来源分母或受控记录数漂移");
requireValue(t19Batch?.collection?.previouslyControlledSourceRecords === 1, "CBETA T19 既有受控来源记录数漂移");
requireValue(t19Batch?.collection?.newSourceBytes === 18161693, "CBETA T19 新增来源字节数漂移");
requireValue(t19Batch?.collection?.newStableSegments === 56685, "CBETA T19 新增稳定行段数漂移");
requireValue(t19Batch?.collection?.newFolios === 2179, "CBETA T19 新增版页数漂移");
requireValue(t19Batch?.collection?.verifiedEditionWitnesses === 8, "CBETA T19 版本见证数漂移");
requireValue(t19Batch?.collection?.provisionalRecords === 117, "CBETA T19 暂定书目记录数漂移");
requireValue(t19Batch?.collection?.fullSourceTexts === 120 && t19Batch?.collection?.partialSourceWitnesses === 6, "CBETA T19 完整作品来源或局部见证数漂移");
requireValue(t19Batch?.collection?.relationAnnotatedRecords === 53, "CBETA T19 关系证据记录数漂移");
requireValue(t19Batch?.collection?.attributionBoundaryRecords === 25, "CBETA T19 来源角色边界漂移");
requireValue(t19Batch?.collection?.newWorks === 121 && t19Batch?.collection?.controlledWorks === 122, "CBETA T19 作品实体数漂移");
requireValue(
  t19Batch?.boundaryAudit?.status === "verified_source_integrity_existing_record_edition_groups_attribution_partial_witness_and_component_boundaries_recorded",
  "CBETA T19 作品边界状态不匹配",
);
requireValue(JSON.stringify(t19Batch?.boundaryAudit?.irregularJuanSequences?.[0]?.encodedJuans) === JSON.stringify(["001", "002", "004", "005"]), "CBETA T19 T0946 原始卷号边界漂移");
requireValue(registry.cbetaT19BoundaryAudit?.sha256 === createHash("sha256").update(t19BatchRaw).digest("hex"), "登记册 CBETA T19 边界审计摘要不匹配");
requireValue(chineseFamily?.t20SourceRecordDenominator === 184, "汉译 T20 固定来源分母不匹配");
requireValue(chineseFamily?.t20ControlledSourceRecords === 184, "汉译 T20 固定来源未完整受控");
requireValue(chineseFamily?.t20SourceRecordPercentage === 100, "汉译 T20 固定来源完成率不匹配");
requireValue(t20Batch?.files?.length === 184, "CBETA T20 新增来源记录数漂移");
requireValue(t20Batch?.collection?.sourceRecordDenominator === 184 && t20Batch?.collection?.controlledSourceRecords === 184, "CBETA T20 固定来源分母或受控记录数漂移");
requireValue(t20Batch?.collection?.previouslyControlledSourceRecords === 0, "CBETA T20 既有受控来源记录数漂移");
requireValue(t20Batch?.collection?.newSourceBytes === 24220376, "CBETA T20 新增来源字节数漂移");
requireValue(t20Batch?.collection?.newStableSegments === 76527, "CBETA T20 新增稳定行段数漂移");
requireValue(t20Batch?.collection?.newFolios === 2976, "CBETA T20 新增版页数漂移");
requireValue(t20Batch?.collection?.verifiedEditionWitnesses === 14, "CBETA T20 版本见证数漂移");
requireValue(t20Batch?.collection?.provisionalRecords === 170, "CBETA T20 暂定书目记录数漂移");
requireValue(t20Batch?.collection?.newFullSourceTexts === 179 && t20Batch?.collection?.newPartialSourceWitnesses === 5, "CBETA T20 完整作品来源或局部见证数漂移");
requireValue(t20Batch?.collection?.relationAnnotatedRecords === 117, "CBETA T20 关系证据记录数漂移");
requireValue(t20Batch?.collection?.attributionBoundaryRecords === 28, "CBETA T20 来源角色边界漂移");
requireValue(t20Batch?.collection?.newWorks === 177 && t20Batch?.collection?.controlledWorks === 177, "CBETA T20 作品实体数漂移");
requireValue(
  t20Batch?.boundaryAudit?.status === "verified_source_integrity_edition_groups_attribution_partial_witness_and_component_boundaries_recorded",
  "CBETA T20 作品边界状态不匹配",
);
requireValue(registry.cbetaT20BoundaryAudit?.sha256 === createHash("sha256").update(t20BatchRaw).digest("hex"), "登记册 CBETA T20 边界审计摘要不匹配");
requireValue(chineseFamily?.t21SourceRecordDenominator === 228, "汉译 T21 固定来源分母不匹配");
requireValue(chineseFamily?.t21ControlledSourceRecords === 228, "汉译 T21 固定来源未完整受控");
requireValue(chineseFamily?.t21SourceRecordPercentage === 100, "汉译 T21 固定来源完成率不匹配");
requireValue(t21Batch?.files?.length === 228, "CBETA T21 新增来源记录数漂移");
requireValue(t21Batch?.collection?.sourceRecordDenominator === 228 && t21Batch?.collection?.controlledSourceRecords === 228, "CBETA T21 固定来源分母或受控记录数漂移");
requireValue(t21Batch?.collection?.previouslyControlledSourceRecords === 0, "CBETA T21 既有受控来源记录数漂移");
requireValue(t21Batch?.collection?.newSourceBytes === 21264046, "CBETA T21 新增来源字节数漂移");
requireValue(t21Batch?.collection?.newStableSegments === 78342, "CBETA T21 新增稳定行段数漂移");
requireValue(t21Batch?.collection?.newFolios === 3119, "CBETA T21 新增版页数漂移");
requireValue(t21Batch?.collection?.verifiedEditionWitnesses === 12, "CBETA T21 版本见证数漂移");
requireValue(t21Batch?.collection?.provisionalRecords === 216, "CBETA T21 暂定书目记录数漂移");
requireValue(t21Batch?.collection?.newFullSourceTexts === 222 && t21Batch?.collection?.newPartialSourceWitnesses === 6, "CBETA T21 完整作品来源或局部见证数漂移");
requireValue(t21Batch?.collection?.relationAnnotatedRecords === 177, "CBETA T21 关系证据记录数漂移");
requireValue(t21Batch?.collection?.attributionBoundaryRecords === 58, "CBETA T21 来源角色边界漂移");
requireValue(t21Batch?.collection?.newWorks === 222 && t21Batch?.collection?.controlledWorks === 222, "CBETA T21 作品实体数漂移");
requireValue(
  t21Batch?.boundaryAudit?.status === "verified_source_integrity_edition_groups_attribution_partial_witness_and_component_boundaries_recorded",
  "CBETA T21 作品边界状态不匹配",
);
requireValue(registry.cbetaT21BoundaryAudit?.sha256 === createHash("sha256").update(t21BatchRaw).digest("hex"), "登记册 CBETA T21 边界审计摘要不匹配");
requireValue(chineseFamily?.t22SourceRecordDenominator === 15, "汉译 T22 固定来源分母不匹配");
requireValue(chineseFamily?.t22ControlledSourceRecords === 15, "汉译 T22 固定来源未完整受控");
requireValue(chineseFamily?.t22SourceRecordPercentage === 100, "汉译 T22 固定来源完成率不匹配");
requireValue(t22Batch?.files?.length === 15, "CBETA T22 新增来源记录数漂移");
requireValue(t22Batch?.collection?.sourceRecordDenominator === 15 && t22Batch?.collection?.controlledSourceRecords === 15, "CBETA T22 固定来源分母或受控记录数漂移");
requireValue(t22Batch?.collection?.previouslyControlledSourceRecords === 0, "CBETA T22 既有受控来源记录数漂移");
requireValue(t22Batch?.collection?.newSourceBytes === 24063535, "CBETA T22 新增来源字节数漂移");
requireValue(t22Batch?.collection?.newStableSegments === 91307, "CBETA T22 新增稳定行段数漂移");
requireValue(t22Batch?.collection?.newFolios === 3301, "CBETA T22 新增版页数漂移");
requireValue(t22Batch?.collection?.verifiedEditionWitnesses === 2, "CBETA T22 版本见证数漂移");
requireValue(t22Batch?.collection?.provisionalRecords === 13, "CBETA T22 暂定书目记录数漂移");
requireValue(t22Batch?.collection?.newFullSourceTexts === 15 && t22Batch?.collection?.newPartialSourceWitnesses === 0, "CBETA T22 完整作品来源或局部见证数漂移");
requireValue(t22Batch?.collection?.relationAnnotatedRecords === 15, "CBETA T22 关系证据记录数漂移");
requireValue(t22Batch?.collection?.attributionBoundaryRecords === 4, "CBETA T22 来源角色边界漂移");
requireValue(t22Batch?.collection?.newWorks === 14 && t22Batch?.collection?.controlledWorks === 14, "CBETA T22 作品实体数漂移");
requireValue(
  t22Batch?.boundaryAudit?.status === "verified_source_integrity_edition_attribution_vinaya_component_and_recension_boundaries_recorded",
  "CBETA T22 作品边界状态不匹配",
);
requireValue(registry.cbetaT22BoundaryAudit?.sha256 === createHash("sha256").update(t22BatchRaw).digest("hex"), "登记册 CBETA T22 边界审计摘要不匹配");
requireValue(chineseFamily?.t23SourceRecordDenominator === 13, "汉译 T23 固定来源分母不匹配");
requireValue(chineseFamily?.t23ControlledSourceRecords === 13, "汉译 T23 固定来源未完整受控");
requireValue(chineseFamily?.t23SourceRecordPercentage === 100, "汉译 T23 固定来源完成率不匹配");
requireValue(t23Batch?.files?.length === 13, "CBETA T23 新增来源记录数漂移");
requireValue(t23Batch?.collection?.sourceRecordDenominator === 13 && t23Batch?.collection?.controlledSourceRecords === 13, "CBETA T23 固定来源分母或受控记录数漂移");
requireValue(t23Batch?.collection?.previouslyControlledSourceRecords === 0, "CBETA T23 既有受控来源记录数漂移");
requireValue(t23Batch?.collection?.newSourceBytes === 18890532, "CBETA T23 新增来源字节数漂移");
requireValue(t23Batch?.collection?.newStableSegments === 90632, "CBETA T23 新增稳定行段数漂移");
requireValue(t23Batch?.collection?.newFolios === 3285, "CBETA T23 新增版页数漂移");
requireValue(t23Batch?.collection?.verifiedEditionWitnesses === 0, "CBETA T23 不得伪造版本见证归并");
requireValue(t23Batch?.collection?.provisionalRecords === 13, "CBETA T23 暂定书目记录数漂移");
requireValue(t23Batch?.collection?.newFullSourceTexts === 13 && t23Batch?.collection?.newPartialSourceWitnesses === 0, "CBETA T23 完整作品来源或局部见证数漂移");
requireValue(t23Batch?.collection?.relationAnnotatedRecords === 13, "CBETA T23 关系证据记录数漂移");
requireValue(t23Batch?.collection?.attributionBoundaryRecords === 4, "CBETA T23 来源角色边界漂移");
requireValue(t23Batch?.collection?.newWorks === 13 && t23Batch?.collection?.controlledWorks === 13, "CBETA T23 作品实体数漂移");
requireValue(
  t23Batch?.boundaryAudit?.status === "verified_source_integrity_attribution_vinaya_component_exegesis_and_procedural_boundaries_recorded",
  "CBETA T23 作品边界状态不匹配",
);
requireValue(registry.cbetaT23BoundaryAudit?.sha256 === createHash("sha256").update(t23BatchRaw).digest("hex"), "登记册 CBETA T23 边界审计摘要不匹配");
requireValue(chineseFamily?.t24SourceRecordDenominator === 59, "汉译 T24 固定来源分母不匹配");
requireValue(chineseFamily?.t24ControlledSourceRecords === 59, "汉译 T24 固定来源未完整受控");
requireValue(chineseFamily?.t24SourceRecordPercentage === 100, "汉译 T24 固定来源完成率不匹配");
requireValue(t24Batch?.files?.length === 59, "CBETA T24 新增来源记录数漂移");
requireValue(t24Batch?.collection?.sourceRecordDenominator === 59 && t24Batch?.collection?.controlledSourceRecords === 59, "CBETA T24 固定来源分母或受控记录数漂移");
requireValue(t24Batch?.collection?.previouslyControlledSourceRecords === 0, "CBETA T24 既有受控来源记录数漂移");
requireValue(t24Batch?.collection?.newSourceBytes === 19745486, "CBETA T24 新增来源字节数漂移");
requireValue(t24Batch?.collection?.newStableSegments === 95817, "CBETA T24 新增稳定行段数漂移");
requireValue(t24Batch?.collection?.newFolios === 3502, "CBETA T24 新增版页数漂移");
requireValue(t24Batch?.collection?.verifiedSameWorkExpressions === 2, "CBETA T24 同作品异译表达数漂移");
requireValue(t24Batch?.collection?.verifiedEditionWitnesses === 4, "CBETA T24 版本见证数漂移");
requireValue(t24Batch?.collection?.provisionalRecords === 53, "CBETA T24 暂定书目记录数漂移");
requireValue(t24Batch?.collection?.newFullSourceTexts === 58 && t24Batch?.collection?.newPartialSourceWitnesses === 1, "CBETA T24 完整作品来源或局部见证数漂移");
requireValue(t24Batch?.collection?.relationAnnotatedRecords === 27, "CBETA T24 关系证据记录数漂移");
requireValue(t24Batch?.collection?.attributionBoundaryRecords === 21, "CBETA T24 来源角色边界漂移");
requireValue(t24Batch?.collection?.newWorks === 56 && t24Batch?.collection?.controlledWorks === 56, "CBETA T24 作品实体数漂移");
requireValue(
  t24Batch?.boundaryAudit?.status === "verified_source_integrity_work_expression_witness_attribution_apocrypha_and_partial_boundaries_recorded",
  "CBETA T24 作品边界状态不匹配",
);
requireValue(registry.cbetaT24BoundaryAudit?.sha256 === createHash("sha256").update(t24BatchRaw).digest("hex"), "登记册 CBETA T24 边界审计摘要不匹配");
requireValue(cbetaCatalog?.files?.length === 1568, "CBETA 受控目录来源记录数漂移");
requireValue(cbetaManifest?.files?.length === 1568, "CBETA 资产清单来源记录数漂移");
requireValue(cbetaRegistry?.works?.length === 1379, "CBETA 书目实体数漂移");
const suttacentralFamily = registry.sourceFamilies.find(
  (family) => family.id === "suttacentral_early_buddhist_texts",
);
requireValue(suttacentralFamily?.controlledWorks === 286, "SuttaCentral 巴利受控作品数不匹配");
requireValue(suttacentralFamily?.controlledExpressions === 286, "SuttaCentral 巴利受控表达数不匹配");
requireValue(suttacentralFamily?.controlledRootRecords === 7288, "SuttaCentral 巴利受控 root 记录数不匹配");
requireValue(suttacentralFamily?.controlledRootBytes === 40689597, "SuttaCentral 巴利受控 root 字节数不匹配");
requireValue(suttacentralFamily?.controlledAllLanguageWorks === 289, "SuttaCentral 全语种受控作品数不匹配");
requireValue(suttacentralFamily?.controlledAllLanguageExpressions === 289, "SuttaCentral 全语种受控表达数不匹配");
requireValue(suttacentralFamily?.controlledAllLanguageRootRecords === 7312, "SuttaCentral 全语种受控 root 记录数不匹配");
requireValue(suttacentralFamily?.controlledAllLanguageRootBytes === 40905982, "SuttaCentral 全语种受控 root 字节数不匹配");
requireValue(suttacentralFamily?.controlledVinayaWorks === 6 && suttacentralFamily?.controlledVinayaExpressions === 6, "SuttaCentral 巴利律藏作品或表达数不匹配");
requireValue(suttacentralFamily?.controlledVinayaRootRecords === 422 && suttacentralFamily?.controlledVinayaRootBytes === 6710444, "SuttaCentral 巴利律藏 root 记录或字节数不匹配");
requireValue(suttacentralFamily?.controlledVinayaStableSegments === 71557 && suttacentralFamily?.controlledVinayaOmittedEmptySegments === 8, "SuttaCentral 巴利律藏稳定段落或空段落数不匹配");
requireValue(suttacentralFamily?.vinayaRightsAuditSha256 === vinayaRightsSha256, "SuttaCentral 来源族律藏权利摘要不匹配");
requireValue(suttacentralFamily?.controlledAbhidhammaWorks === 7 && suttacentralFamily?.controlledAbhidhammaExpressions === 7, "SuttaCentral 巴利论藏作品或表达数不匹配");
requireValue(suttacentralFamily?.controlledAbhidhammaRootRecords === 1102 && suttacentralFamily?.controlledAbhidhammaRootBytes === 11192917, "SuttaCentral 巴利论藏 root 记录或字节数不匹配");
requireValue(suttacentralFamily?.controlledAbhidhammaStableSegments === 88414 && suttacentralFamily?.controlledAbhidhammaOmittedEmptySegments === 0, "SuttaCentral 巴利论藏稳定段落或空段落数不匹配");
requireValue(suttacentralFamily?.abhidhammaRightsAuditSha256 === abhidhammaRightsSha256, "SuttaCentral 来源族论藏权利摘要不匹配");
requireValue(suttacentralFamily?.controlledNonPaliIndicWorks === 3, "SuttaCentral 印度语 root 作品数不匹配");
requireValue(suttacentralFamily?.controlledNonPaliIndicRootRecords === 24, "SuttaCentral 印度语 root 记录数不匹配");
requireValue(suttacentralFamily?.controlledNonPaliIndicStableSegments === 1909, "SuttaCentral 印度语 root 稳定段落数不匹配");
requireValue(suttacentralFamily?.controlledSuttaRootRecords === 5764, "巴利经藏受控 root 记录数不匹配");
requireValue(suttacentralFamily?.chineseParallelEdges === 5161 && suttacentralFamily?.chineseParallelPaliWorksReferenced === 246, "SuttaCentral 来源族的汉巴平行证据统计不匹配");
requireValue(suttacentralFamily?.chineseParallelEvidenceSha256 === suttacentralChineseParallelsSha256, "SuttaCentral 来源族的汉巴平行证据摘要不匹配");
requireValue(suttacentralFamily?.chineseParallelReviewQueueItems === 80 && suttacentralFamily?.chineseParallelAdjudicatedItems === 0, "SuttaCentral 来源族的汉巴裁决进度不匹配");
requireValue(suttacentralFamily?.chineseParallelReviewQueueSha256 === suttacentralParallelReviewQueueSha256, "SuttaCentral 来源族的汉巴裁决队列摘要不匹配");
requireValue(suttacentralFamily?.suttaRootRecordDenominator === 5764, "巴利经藏 root 分母不匹配");
requireValue(suttacentralFamily?.suttaRootRecordPercentage === 100, "巴利经藏固定来源完成率不匹配");
requireValue(suttacentralManifest?.files?.[0]?.verification?.segments === 2234, "巴利原生段落数漂移");
requireValue(suttacentralManifest?.files?.[0]?.sourceParts?.length === 26, "巴利来源资产数漂移");
requireValue(suttacentralBatch?.source?.commit === "eac6c24781dd1eefdc17dc2f787b54bf6fe31719", "巴利来源提交漂移");
requireValue(dighaBatch?.source?.commit === suttacentralBatch?.source?.commit, "《长部》来源提交漂移");
requireValue(dighaManifest?.files?.length === 34, "《长部》必须包含 34 部完整原文");
requireValue(dighaManifest?.collection?.stableSegments === 16401, "《长部》原生段落数漂移");
requireValue(majjhimaBatch?.source?.commit === suttacentralBatch?.source?.commit, "《中部》来源提交漂移");
requireValue(majjhimaManifest?.files?.length === 152, "《中部》必须包含 152 部完整原文");
requireValue(majjhimaManifest?.collection?.sourceBytes === 3072235, "《中部》来源字节数漂移");
requireValue(majjhimaManifest?.collection?.stableSegments === 27195, "《中部》原生段落数漂移");
requireValue(samyuttaBatch?.source?.commit === suttacentralBatch?.source?.commit, "《相应部》来源提交漂移");
requireValue(samyuttaManifest?.files?.length === 56, "《相应部》必须包含 56 个相应级经集");
requireValue(samyuttaManifest?.collection?.recordCount === 1819, "《相应部》物理 root 记录数漂移");
requireValue(samyuttaManifest?.collection?.representedSuttas === 3024, "《相应部》连续经号数漂移");
requireValue(samyuttaManifest?.collection?.sourceBytes === 3765299, "《相应部》来源字节数漂移");
requireValue(samyuttaManifest?.collection?.stableSegments === 43466, "《相应部》原生段落数漂移");
requireValue(samyuttaManifest?.collection?.emptySegmentIds === 2, "《相应部》空白占位段落数漂移");
requireValue(anguttaraBatch?.source?.commit === suttacentralBatch?.source?.commit, "《增支部》来源提交漂移");
requireValue(anguttaraManifest?.files?.length === 11, "《增支部》必须包含 11 个集级经集");
requireValue(anguttaraManifest?.collection?.recordCount === 1408, "《增支部》物理 root 记录数漂移");
requireValue(anguttaraManifest?.collection?.representedSuttas === 8122, "《增支部》连续经号数漂移");
requireValue(anguttaraManifest?.collection?.sourceBytes === 4074931, "《增支部》来源字节数漂移");
requireValue(anguttaraManifest?.collection?.stableSegments === 41839, "《增支部》原生段落数漂移");
requireValue(anguttaraManifest?.collection?.emptySegmentIds === 4, "《增支部》空白占位段落数漂移");
requireValue(khuddakaBatch?.source?.commit === suttacentralBatch?.source?.commit, "《小部》来源提交漂移");
requireValue(khuddakaManifest?.files?.length === 19, "《小部》必须新增 19 个书级文本集合");
requireValue(khuddakaManifest?.books?.length === 20, "《小部》必须审计 20 个书级集合（含既有《法句》）");
requireValue(khuddakaManifest?.collection?.recordCount === 2351, "《小部》物理 root 记录数漂移");
requireValue(khuddakaManifest?.collection?.newRecordCount === 2325, "《小部》新增物理 root 记录数漂移");
requireValue(khuddakaManifest?.collection?.sourceBytes === 10053548, "《小部》来源字节数漂移");
requireValue(khuddakaManifest?.collection?.newSourceBytes === 9953598, "《小部》新增来源字节数漂移");
requireValue(khuddakaManifest?.collection?.stableSegments === 155801, "《小部》原生段落数漂移");
requireValue(khuddakaManifest?.collection?.newStableSegments === 153567, "《小部》新增原生段落数漂移");
requireValue(khuddakaManifest?.collection?.newReadingUnits === 2946, "《小部》新增阅读单元数漂移");
requireValue(indicBatch?.source?.commit === suttacentralBatch?.source?.commit, "印度语 root 来源提交漂移");
requireValue(indicManifest?.files?.length === 3, "印度语 root 必须登记 3 个文本表达");
requireValue(indicBatch?.files?.length === 24, "印度语 root 必须保存 24 份物理来源");
requireValue(indicManifest?.collection?.sourceBytes === 216385, "印度语 root 来源字节数漂移");
requireValue(indicManifest?.collection?.sourceSegments === 1910, "印度语 root 来源段落数漂移");
requireValue(indicManifest?.collection?.stableSegments === 1909, "印度语 root 可读稳定段落数漂移");
requireValue(indicManifest?.collection?.omittedEmptyEditorialPlaceholderSegments === 1, "印度语 root 空编辑占位数漂移");
requireValue(indicManifest?.rightsAudit?.sha256 === indicRightsSha256, "印度语 root 清单权利摘要不匹配");
requireValue(vinayaBatch?.source?.commit === suttacentralBatch?.source?.commit, "巴利律藏 root 来源提交漂移");
requireValue(vinayaManifest?.files?.length === 6, "巴利律藏 root 必须登记 6 个书级文本表达");
requireValue(vinayaBatch?.files?.length === 422, "巴利律藏 root 必须保存 422 份物理来源");
requireValue(vinayaManifest?.collection?.sourceBytes === 6710444, "巴利律藏 root 来源字节数漂移");
requireValue(vinayaManifest?.collection?.sourceSegments === 71565, "巴利律藏 root 来源段落数漂移");
requireValue(vinayaManifest?.collection?.stableSegments === 71557, "巴利律藏 root 可读稳定段落数漂移");
requireValue(vinayaManifest?.collection?.omittedEmptySegments === 8, "巴利律藏 root 空段落数漂移");
requireValue(vinayaManifest?.rightsAudit?.sha256 === vinayaRightsSha256, "巴利律藏 root 清单权利摘要不匹配");
requireValue(abhidhammaBatch?.source?.commit === suttacentralBatch?.source?.commit, "巴利论藏 root 来源提交漂移");
requireValue(abhidhammaManifest?.files?.length === 7, "巴利论藏 root 必须登记七论");
requireValue(abhidhammaBatch?.files?.length === 1102, "巴利论藏 root 必须保存 1,102 份物理来源");
requireValue(abhidhammaManifest?.collection?.sourceBytes === 11192917, "巴利论藏 root 来源字节数漂移");
requireValue(abhidhammaManifest?.collection?.sourceSegments === 88414, "巴利论藏 root 来源段落数漂移");
requireValue(abhidhammaManifest?.collection?.stableSegments === 88414, "巴利论藏 root 可读稳定段落数漂移");
requireValue(abhidhammaManifest?.collection?.omittedEmptySegments === 0, "巴利论藏 root 空段落数漂移");
requireValue(abhidhammaManifest?.rightsAudit?.sha256 === abhidhammaRightsSha256, "巴利论藏 root 清单权利摘要不匹配");

const checksumLines = (await readFile(checksumPath, "utf8")).trim().split("\n");
const checksums = new Map(checksumLines.map((line) => {
  const [hash, file] = line.trim().split(/\s+/);
  return [file, hash];
}));
const controlledFiles = [
  ["registry-v4.2.0.json", raw],
  ["source-snapshots-v1.2.0.json", sourceSnapshotsRaw],
  ["cbeta-taisho-sutra-inventory-v0.2.1.json", inventoryRaw],
  ["cbeta-taisho-t18-inventory-v0.1.0.json", t18InventoryRaw],
  ["cbeta-taisho-t19-inventory-v0.1.0.json", t19InventoryRaw],
  ["cbeta-taisho-t20-inventory-v0.1.0.json", t20InventoryRaw],
  ["cbeta-taisho-t21-inventory-v0.1.0.json", t21InventoryRaw],
  ["cbeta-taisho-t22-inventory-v0.1.0.json", t22InventoryRaw],
  ["cbeta-taisho-t23-inventory-v0.1.0.json", t23InventoryRaw],
  ["cbeta-taisho-t24-inventory-v0.1.0.json", t24InventoryRaw],
  ["bdrc-derge-kangyur-inventory-v0.3.0.json", dergeInventoryRaw],
  ["84000-rights-policy-v0.3.0.json", rights84000Raw],
  ["dsbc-gretil-source-snapshot-v0.4.0.json", sanskritEvidenceRaw],
  ["sanskrit-rights-policy-v0.4.0.json", sanskritRightsRaw],
  ["gretil-sanskrit-file-rights-audit-v0.7.0.json", gretilFileRightsAuditRaw],
  ["suttacentral-indic-root-rights-audit-v0.8.0.json", suttacentralIndicRightsAuditRaw],
  ["suttacentral-vinaya-root-rights-audit-v0.9.0.json", suttacentralVinayaRightsAuditRaw],
  ["suttacentral-abhidhamma-root-rights-audit-v1.0.0.json", suttacentralAbhidhammaRightsAuditRaw],
  ["suttacentral-chinese-parallels-v0.7.0.json", suttacentralChineseParallelsRaw],
  ["suttacentral-parallel-review-queue-v0.1.0.json", suttacentralParallelReviewQueueRaw],
  ["suttacentral-parallel-p0-evidence-packets-v0.1.0.json", suttacentralParallelP0EvidencePacketsRaw],
  ["cross-catalog-alignments-v0.5.0.json", crossCatalogAlignmentsRaw],
  ["rkts-kangyur-catalog-snapshot-v0.5.0.json", rktsEvidenceRaw],
  ["rkts-kernel-alignment-audit-v0.6.0.json", rktsKernelAlignmentsRaw],
  ["batch-v1.9.0.json", t12BatchRaw],
  ["batch-v2.0.0.json", t13BatchRaw],
  ["batch-v2.1.0.json", t14BatchRaw],
  ["batch-v2.2.0.json", t15BatchRaw],
  ["batch-v2.3.0.json", t16BatchRaw],
  ["batch-v2.4.0.json", t17BatchRaw],
  ["batch-v2.5.0.json", t18BatchRaw],
  ["batch-v2.6.0.json", t19BatchRaw],
  ["batch-v2.7.0.json", t20BatchRaw],
  ["batch-v2.8.0.json", t21BatchRaw],
  ["batch-v2.9.0.json", t22BatchRaw],
  ["batch-v3.0.0.json", t23BatchRaw],
  ["batch-v3.1.0.json", t24BatchRaw],
  ["catalog-v3.1.0.json", cbetaCatalogRaw],
  ["manifest-v3.1.0.json", cbetaManifestRaw],
  ["registry-cbeta-v3.1.0.json", cbetaRegistryRaw],
  ["batch-v0.7.0.json", suttacentralBatchRaw],
  ["manifest-v0.7.0.json", suttacentralManifestRaw],
  ["dn-batch-v0.8.0.json", dighaBatchRaw],
  ["dn-manifest-v0.8.0.json", dighaManifestRaw],
  ["mn-batch-v0.9.0.json", majjhimaBatchRaw],
  ["mn-manifest-v0.9.0.json", majjhimaManifestRaw],
  ["sn-batch-v1.0.0.json", samyuttaBatchRaw],
  ["sn-manifest-v1.0.0.json", samyuttaManifestRaw],
  ["an-batch-v1.1.0.json", anguttaraBatchRaw],
  ["an-manifest-v1.1.0.json", anguttaraManifestRaw],
  ["kn-batch-v1.2.0.json", khuddakaBatchRaw],
  ["kn-manifest-v1.2.0.json", khuddakaManifestRaw],
  ["indic-batch-v1.3.0.json", indicBatchRaw],
  ["indic-manifest-v1.3.0.json", indicManifestRaw],
  ["vinaya-batch-v1.4.0.json", vinayaBatchRaw],
  ["vinaya-manifest-v1.4.0.json", vinayaManifestRaw],
  ["abhidhamma-batch-v1.5.0.json", abhidhammaBatchRaw],
  ["abhidhamma-manifest-v1.5.0.json", abhidhammaManifestRaw],
];
for (const [file, content] of controlledFiles) {
  const actualHash = createHash("sha256").update(content).digest("hex");
  requireValue(checksums.get(file) === actualHash, `${file} 的 SHA-256 校验和不匹配`);
}

if (errors.length > 0) {
  console.error(errors.map((item) => `- ${item}`).join("\n"));
  process.exit(1);
}

const expressions = registry.works.flatMap((work) => work.expressions);
const segmentCount = expressions.reduce((sum, item) => sum + item.stableSegments, 0);
const candidateCount = sourceSnapshots.sources.reduce((sum, source) => sum + source.candidateRecordCount, 0);
requireValue(candidateCount === 29675, "六个来源的候选记录审计总量漂移");
const lankavatara = registry.works.find((work) => work.id === "gbcr:work:lankavatara-t0670");
const avatamsaka = registry.works.find((work) => work.id === "gbcr:work:avatamsaka-t0278");
const mahaparinirvana = registry.works.find((work) => work.id === "gbcr:work:mahaparinirvana-t0374");
const mahaPrajnaparamita = registry.works.find((work) => work.id === "gbcr:work:maha-prajnaparamita-t0220");
const paliDhammapada = registry.works.find((work) => work.id === "gbcr:work:dhammapada-pali");
const chineseDharmapada = registry.works.find((work) => work.id === "gbcr:work:dharmapada-t0210");
const dhammapadaFamily = registry.textFamilies?.find((family) => family.id === "gbcr:text-family:dhammapada");
requireValue(registry.registry.version === "4.2.0", "当前 GBCR 版本必须为 v4.2.0");
requireValue(registry.works.length === 1668, "v4.2 必须登记 1,668 个可追踪作品实体");
requireValue(expressions.length === 1857, "v4.2 必须登记 1,857 个文本表达或见证");
requireValue(expressions.filter((expression) => expression.fullSourceText).length === 1823, "v4.2 必须登记 1,823 个完整文本表达或见证");
requireValue(segmentCount === 2412999, "v4.2 稳定行段总数漂移");
const provisionalCbetaWorks = registry.works.filter((work) =>
  work.workType === "provisional_bibliographic_entity" && /^gbcr:work:taisho-t/.test(work.id),
);
requireValue(provisionalCbetaWorks.length === 1233, "T01–T24 新增经号必须保留 1,233 个暂定书目实体");
requireValue(
  provisionalCbetaWorks.every((work) => work.relationDecision?.includes("不据此声称已经完成作品级去重")),
  "T01–T24 暂定书目实体缺少作品去重边界",
);
const benyuanRelatedWorkIds = new Set(benyuanBatch.files
  .filter((file) => file.bibliographicRelations?.length)
  .map((file) => file.workId));
const relationAnnotatedBenyuanWorks = provisionalCbetaWorks.filter((work) => benyuanRelatedWorkIds.has(work.id));
const authoredBenyuanWorkIds = new Set(benyuanBatch.files
  .filter((file) => file.sourceRole === "attributed_authored_or_compiled_text")
  .map((file) => file.workId));
const attributedBenyuanWorks = provisionalCbetaWorks.filter((work) => authoredBenyuanWorkIds.has(work.id));
requireValue(relationAnnotatedBenyuanWorks.length === 17, "T03–T04 关系证据未完整进入登记册");
requireValue(attributedBenyuanWorks.length === 8, "T03–T04 造撰集类文本未保持来源角色边界");
const prajnaparamitaProvisionalWorkIds = new Set(prajnaparamitaBatch.files
  .filter((file) => file.workIdentityStatus === "provisional_canon_record")
  .map((file) => file.workId));
const prajnaparamitaProvisionalWorks = provisionalCbetaWorks.filter((work) =>
  prajnaparamitaProvisionalWorkIds.has(work.id));
const prajnaparamitaRelatedIds = new Set(prajnaparamitaBatch.files
  .filter((file) => file.bibliographicRelations?.length)
  .map((file) => file.id));
const prajnaparamitaRelatedExpressions = expressions.filter((expression) =>
  prajnaparamitaRelatedIds.has(expression.id.replace(/^gbcr:expression:(T[^-]+)-zh-Hant$/, "$1")));
requireValue(prajnaparamitaProvisionalWorks.length === 28, "T05–T08 暂定书目实体没有保持 28 个可复核边界");
requireValue(prajnaparamitaRelatedExpressions.length === 35, "T05–T08 关系证据未完整进入文本表达");
const vajracchedika = registry.works.find((work) => work.id === "gbcr:work:vajracchedika-prajnaparamita");
const hrdaya = registry.works.find((work) => work.id === "gbcr:work:prajnaparamita-hrdaya");
const sameMembers = (actual, expected) => actual?.length === expected.length &&
  expected.every((id) => actual.includes(id));
requireValue(
  sameMembers(vajracchedika?.externalIds?.cbeta, ["T0235", "T0236a", "T0236b", "T0237", "T0238", "T0239"]),
  "《金刚经》六个汉译表达未正确归入同一作品",
);
requireValue(vajracchedika?.expressions?.length === 6, "《金刚经》必须保留六个独立汉译表达");
requireValue(
  sameMembers(hrdaya?.externalIds?.cbeta, ["T0250", "T0251", "T0252", "T0253", "T0254", "T0255", "T0257"]),
  "《心经》七个长短本表达未正确归入同一作品",
);
requireValue(hrdaya?.expressions?.length === 7, "《心经》必须保留七个独立汉译表达");
const lotusProvisionalWorkIds = new Set(lotusBatch.files
  .filter((file) => file.workIdentityStatus === "provisional_canon_record")
  .map((file) => file.workId));
const lotusProvisionalWorks = provisionalCbetaWorks.filter((work) => lotusProvisionalWorkIds.has(work.id));
const lotusRelatedIds = new Set(lotusBatch.files
  .filter((file) => file.bibliographicRelations?.length)
  .map((file) => file.id));
const lotusRelatedExpressions = expressions.filter((expression) =>
  lotusRelatedIds.has(expression.id.replace(/^gbcr:expression:(T[^-]+)-zh-Hant$/, "$1")));
requireValue(lotusProvisionalWorks.length === 7, "T09 暂定书目实体没有保持 7 个可复核边界");
requireValue(lotusRelatedExpressions.length === 11, "T09 关系证据未完整进入文本表达或见证");
const lotus = registry.works.find((work) => work.id === "gbcr:work:saddharma-pundarika-t0262");
const avaivartika = registry.works.find((work) => work.id === "gbcr:work:avaivartika-cakra");
const sarvavaidalyasamgraha = registry.works.find((work) => work.id === "gbcr:work:sarvavaidalyasamgraha");
const partialLotusWitness = lotus?.expressions?.find((expression) =>
  expression.id === "gbcr:expression:T0265-zh-Hant");
const openingLotus = registry.works.find((work) => work.id === "gbcr:work:taisho-t0276");
const closingLotus = registry.works.find((work) => work.id === "gbcr:work:taisho-t0277");
requireValue(
  sameMembers(lotus?.externalIds?.cbeta, ["T0262", "T0263", "T0264", "T0265"]),
  "《法华经》三种完整汉译与一条节译见证未正确归入同一作品",
);
requireValue(lotus?.expressions?.length === 4, "《法华经》必须保留三个完整汉译表达和一条节译见证");
requireValue(partialLotusWitness?.fullSourceText === false, "T0265 节译见证不得计作完整文本表达");
requireValue(partialLotusWitness?.completeSourceRecord === true, "T0265 必须标明完整保存来源记录");
requireValue(partialLotusWitness?.sourceRole === "partial_translation_witness", "T0265 节译来源角色缺失");
requireValue(Boolean(partialLotusWitness?.sourceTextAsset?.path), "T0265 节译见证缺少受控来源资产");
requireValue(
  sameMembers(avaivartika?.externalIds?.cbeta, ["T0266", "T0267", "T0268"]) && avaivartika?.expressions?.length === 3,
  "不退转法轮三种汉译未正确归入同一作品",
);
requireValue(
  sameMembers(sarvavaidalyasamgraha?.externalIds?.cbeta, ["T0274", "T0275"]) && sarvavaidalyasamgraha?.expressions?.length === 2,
  "Sarvavaidalyasaṃgraha 两种汉译未正确归入同一作品",
);
requireValue(openingLotus?.id !== closingLotus?.id, "《无量义经》与《观普贤菩萨行法经》不得误并为同一作品");
requireValue(
  [lotus, openingLotus, closingLotus].every((work) =>
    work?.bibliographicRelations?.some((relation) => relation.groupId === "threefold-lotus-sutra")),
  "三部法华经仪轨组合关系未完整保留",
);
requireValue(
  expressions.filter((expression) => expression.sourceRole === "indigenous_composition_candidate").length === 3,
  "东亚本土成书候选必须精确保留三条",
);
const avatamsakaProvisionalWorkIds = new Set(avatamsakaBatch.files
  .filter((file) => file.workIdentityStatus === "provisional_canon_record")
  .map((file) => file.workId));
const avatamsakaProvisionalWorks = provisionalCbetaWorks.filter((work) => avatamsakaProvisionalWorkIds.has(work.id));
const avatamsakaRelatedIds = new Set(avatamsakaBatch.files
  .filter((file) => file.bibliographicRelations?.length)
  .map((file) => file.id));
const avatamsakaRelatedExpressions = expressions.filter((expression) =>
  avatamsakaRelatedIds.has(expression.id.replace(/^gbcr:expression:(T[^-]+)-zh-Hant$/, "$1")));
requireValue(avatamsakaProvisionalWorks.length === 15, "T10 暂定书目实体没有保持 15 个可复核边界");
requireValue(avatamsakaRelatedExpressions.length === 24, "T10 关系证据未完整进入文本表达或见证");
const tenAbodes = registry.works.find((work) => work.id === "gbcr:work:avatamsaka-ten-abodes");
const dasabhumi = registry.works.find((work) => work.id === "gbcr:work:dasabhumi");
const buddhaFields = registry.works.find((work) => work.id === "gbcr:work:buddha-field-qualities");
const gandavyuha = registry.works.find((work) => work.id === "gbcr:work:gandavyuha");
const bhadracarya = registry.works.find((work) => work.id === "gbcr:work:bhadracarya-pranidhana");
const tathagataQualities = registry.works.find((work) => work.id === "gbcr:work:tathagata-qualities-wisdom-realm");
requireValue(sameMembers(tenAbodes?.externalIds?.cbeta, ["T0283", "T0284"]) && tenAbodes?.expressions?.length === 2, "《华严经·十住品》两个汉译未正确归入同一组件作品");
requireValue(sameMembers(dasabhumi?.externalIds?.cbeta, ["T0285", "T0286", "T0287"]) && dasabhumi?.expressions?.length === 3, "《十地经》三个汉译未正确归入同一作品");
requireValue(sameMembers(buddhaFields?.externalIds?.cbeta, ["T0289", "T0290"]) && buddhaFields?.expressions?.length === 2, "佛刹功德两个汉译未正确归入同一作品");
requireValue(sameMembers(gandavyuha?.externalIds?.cbeta, ["T0293", "T0294", "T0295"]) && gandavyuha?.expressions?.length === 3, "《入法界品》完整译本与两条节译见证未正确归入同一作品");
requireValue(gandavyuha?.expressions?.filter((expression) => expression.fullSourceText).length === 1, "《入法界品》只能有一个完整文本表达");
requireValue(gandavyuha?.expressions?.filter((expression) => expression.sourceRole === "partial_translation_witness" && !expression.fullSourceText && expression.completeSourceRecord).length === 2, "《入法界品》两条节译见证边界不完整");
requireValue(sameMembers(bhadracarya?.externalIds?.cbeta, ["T0296", "T0297"]) && bhadracarya?.expressions?.length === 2, "普贤行愿两个汉译未正确归入同一作品");
requireValue(sameMembers(tathagataQualities?.externalIds?.cbeta, ["T0302", "T0303", "T0304"]) && tathagataQualities?.expressions?.length === 3, "如来德智不思议境界三个汉译未正确归入同一作品");
const candidateT0300 = registry.works.find((work) => work.id === "gbcr:work:taisho-t0300");
const candidateT0301 = registry.works.find((work) => work.id === "gbcr:work:taisho-t0301");
requireValue(candidateT0300?.id !== candidateT0301?.id, "T0300/T0301 相关候选不得在证据不足时强行合并");
requireValue([candidateT0300, candidateT0301].every((work) => work?.bibliographicRelations?.some((relation) => relation.groupId === "inconceivable-buddha-realm-candidate")), "T0300/T0301 相关候选证据未完整保留");
const ratnakutaProvisionalWorkIds = new Set(ratnakutaBatch.files
  .filter((file) => file.workIdentityStatus === "provisional_canon_record")
  .map((file) => file.workId));
const ratnakutaProvisionalWorks = provisionalCbetaWorks.filter((work) => ratnakutaProvisionalWorkIds.has(work.id));
const ratnakutaRelatedIds = new Set(ratnakutaBatch.files
  .filter((file) => file.bibliographicRelations?.length)
  .map((file) => file.id));
const ratnakutaRelatedExpressions = expressions.filter((expression) =>
  ratnakutaRelatedIds.has(expression.id.replace(/^gbcr:expression:(T[^-]+)-zh-Hant$/, "$1")));
const maharatnakuta = registry.works.find((work) => work.id === "gbcr:work:maharatnakuta-t0310");
const samantamukha = registry.works.find((work) => work.id === "gbcr:work:samantamukha-parivarta");
const manjushriBuddhaField = registry.works.find((work) => work.id === "gbcr:work:manjushri-buddha-field");
requireValue(ratnakutaProvisionalWorks.length === 7, "T11 暂定书目实体没有保持 7 个可复核边界");
requireValue(ratnakutaRelatedExpressions.length === 11, "T11 关系证据未完整进入文本表达或见证");
requireValue(
  maharatnakuta?.bibliographicRelations?.some((relation) => relation.groupId === "maharatnakuta-component-translations-t11"),
  "《大宝积经》合集缺少单会独立流通译本关系",
);
requireValue(
  sameMembers(samantamukha?.externalIds?.cbeta, ["T0315a", "T0315b"]) && samantamukha?.expressions?.length === 2,
  "《普门品经》两个版本见证未正确归入同一作品",
);
requireValue(
  samantamukha?.expressions?.every((expression) =>
    expression.sourceRole === "edition_witness" && expression.fullSourceText && expression.completeSourceRecord),
  "《普门品经》两个版本见证的完整来源边界不一致",
);
requireValue(
  sameMembers(manjushriBuddhaField?.externalIds?.cbeta, ["T0318", "T0319"]) && manjushriBuddhaField?.expressions?.length === 2,
  "文殊师利佛土庄严两个汉译未正确归入同一作品",
);
const t12ProvisionalWorkIds = new Set(t12Batch.files
  .filter((file) => file.workIdentityStatus === "provisional_canon_record")
  .map((file) => file.workId));
const t12ProvisionalWorks = provisionalCbetaWorks.filter((work) => t12ProvisionalWorkIds.has(work.id));
const t12RelatedIds = new Set(t12Batch.files
  .filter((file) => file.bibliographicRelations?.length)
  .map((file) => file.id));
const t12RelatedExpressions = expressions.filter((expression) =>
  t12RelatedIds.has(expression.id.replace(/^gbcr:expression:(T[^-]+)-zh-Hant$/, "$1")));
const upali = registry.works.find((work) => work.id === "gbcr:work:upali-pariprccha");
const largerSukhavati = registry.works.find((work) => work.id === "gbcr:work:larger-sukhavati-vyuha-t0360");
const smallerSukhavati = registry.works.find((work) => work.id === "gbcr:work:smaller-sukhavati-vyuha-t0366");
const greatCloudFragment = registry.works.find((work) => work.id === "gbcr:work:taisho-t0388");
requireValue(t12ProvisionalWorks.length === 29, "T12 暂定书目实体没有保持 29 个可复核边界");
requireValue(t12RelatedExpressions.length === 54, "T12 关系证据未完整进入文本表达或见证");
requireValue(
  maharatnakuta?.bibliographicRelations?.some((relation) => relation.groupId === "maharatnakuta-component-translations-t12"),
  "《大宝积经》合集缺少 T12 单会独立流通译本关系",
);
requireValue(
  sameMembers(upali?.externalIds?.cbeta, ["T0325", "T0326"]) && upali?.expressions?.length === 2,
  "优波离所问完整译本与礼忏节译见证未归入同一作品",
);
requireValue(
  upali?.expressions?.filter((expression) => expression.sourceRole === "partial_translation_witness" && !expression.fullSourceText).length === 1,
  "T0326 礼忏节译见证边界不完整",
);
requireValue(
  sameMembers(largerSukhavati?.externalIds?.cbeta, ["T0360", "T0361", "T0362", "T0363", "T0364"]) && largerSukhavati?.expressions?.length === 5,
  "《无量寿经》四译与一条校辑见证未正确归入同一作品",
);
requireValue(
  largerSukhavati?.expressions?.filter((expression) => expression.sourceRole === "edited_compilation_witness").length === 1,
  "T0364 后世校辑见证角色缺失",
);
requireValue(
  sameMembers(smallerSukhavati?.externalIds?.cbeta, ["T0366", "T0367"]) && smallerSukhavati?.expressions?.length === 2,
  "《阿弥陀经》两个汉译未正确归入同一作品",
);
requireValue(
  sameMembers(mahaparinirvana?.externalIds?.cbeta, ["T0374", "T0375", "T0376", "T0377"]) && mahaparinirvana?.expressions?.length === 4,
  "大乘《大般涅槃经》译本、校订本与后分见证未正确归入同一作品",
);
requireValue(
  mahaparinirvana?.expressions?.filter((expression) => expression.sourceRole === "edited_recension_witness").length === 1 &&
    mahaparinirvana?.expressions?.filter((expression) => expression.sourceRole === "partial_continuation_witness" && !expression.fullSourceText).length === 1,
  "《大般涅槃经》校订本或后分见证边界不完整",
);
requireValue(
  greatCloudFragment?.expressions?.[0]?.sourceRole === "partial_text_family_witness_candidate" &&
    greatCloudFragment?.expressions?.[0]?.fullSourceText === false &&
    greatCloudFragment?.bibliographicRelations?.some((relation) => relation.groupId === "mahamegha-chinese-text-family"),
  "T0388 必须保持《大云经》文本家族残篇候选而不得冒充完整译本",
);
const visesaCinti = registry.works.find((work) => work.id === "gbcr:work:brahma-visesa-cinti-pariprccha");
const ajatasatru = registry.works.find((work) => work.id === "gbcr:work:ajatasatru-kaukrtya-vinodana");
const samadhiRaja = registry.works.find((work) => work.id === "gbcr:work:samadhi-raja");
const t15RelatedIds = new Set(t15Batch.files
  .filter((file) => file.bibliographicRelations?.length)
  .map((file) => file.id));
const t15RelatedExpressions = expressions.filter((expression) =>
  t15RelatedIds.has(expression.id.replace(/^gbcr:expression:(T[^-]+)-zh-Hant$/, "$1")));
requireValue(t15RelatedExpressions.length === 27, "T15 关系证据未完整进入文本表达或见证");
requireValue(
  sameMembers(visesaCinti?.externalIds?.cbeta, ["T0585", "T0586", "T0587"]) && visesaCinti?.expressions?.length === 3,
  "《思益梵天所问经》三种汉译未正确归入同一作品",
);
requireValue(
  sameMembers(ajatasatru?.externalIds?.cbeta, ["T0626", "T0627", "T0628", "T0629"]) &&
    ajatasatru?.expressions?.filter((expression) => expression.sourceRole === "partial_translation_witness" && !expression.fullSourceText).length === 1,
  "《阿阇世王经》三种完整汉译与 T0629 别品译出见证边界不完整",
);
requireValue(
  sameMembers(samadhiRaja?.externalIds?.cbeta, ["T0639", "T0640"]) &&
    samadhiRaja?.expressions?.find((expression) => expression.id === "gbcr:expression:T0640-zh-Hant")?.fullSourceText === false,
  "《月灯三昧经》与 T0640 局部译出见证边界不完整",
);
requireValue(
  registry.works.find((work) => work.id === "gbcr:work:taisho-t0641")?.bibliographicRelations?.some((relation) => relation.groupId === "moon-lamp-t0640-t0641-boundary"),
  "T0641 同题同署但范围未定的边界关系缺失",
);
const t16RelatedIds = new Set(t16Batch.files
  .filter((file) => file.bibliographicRelations?.length)
  .map((file) => file.id));
const t16RelatedExpressions = expressions.filter((expression) =>
  t16RelatedIds.has(expression.id.replace(/^gbcr:expression:(T[^-]+)-zh-Hant$/, "$1")));
const suvarnaprabhasa = registry.works.find((work) => work.id === "gbcr:work:suvarnaprabhasa-t0663");
const samdhinirmocana = registry.works.find((work) => work.id === "gbcr:work:samdhinirmocana-t0675");
const ullambana = registry.works.find((work) => work.id === "gbcr:work:ullambana-t0685");
const salistamba = registry.works.find((work) => work.id === "gbcr:work:salistamba-t0708");
requireValue(t16RelatedExpressions.length === 38, "T16 新增关系证据未完整进入文本表达或见证");
requireValue(
  sameMembers(suvarnaprabhasa?.externalIds?.cbeta, ["T0663", "T0664", "T0665"]) &&
    suvarnaprabhasa?.expressions?.filter((expression) => expression.sourceRole === "compiled_canonical_witness").length === 1,
  "《金光明经》两译与 T0664 合部编纂见证边界不完整",
);
requireValue(
  sameMembers(samdhinirmocana?.externalIds?.cbeta, ["T0675", "T0676", "T0677", "T0678", "T0679"]) &&
    samdhinirmocana?.expressions?.filter((expression) => expression.sourceRole === "partial_translation_witness" && !expression.fullSourceText).length === 3,
  "《解深密经》两种完整译本与三条单品译出见证边界不完整",
);
requireValue(
  sameMembers(ullambana?.externalIds?.cbeta, ["T0685", "T0686"]) &&
    ullambana?.expressions?.filter((expression) => expression.sourceRole === "abridged_translation_witness" && !expression.fullSourceText).length === 1,
  "《盂兰盆经》完整文本与 T0686 短本见证边界不完整",
);
requireValue(
  sameMembers(salistamba?.externalIds?.cbeta, ["T0708", "T0709", "T0710", "T0711", "T0712"]) && salistamba?.expressions?.length === 5,
  "Śālistambasūtra 五种汉译未正确归入同一作品",
);
requireValue(
  lankavatara?.bibliographicRelations?.some((relation) => relation.groupId === "lankavatara-t0670-t0672") &&
    lankavatara?.expressions?.every((expression) => expression.sourceRole === "translated_canonical_record"),
  "既有《楞伽经》三译缺少 T16 目录关系或来源角色证据",
);
const t17RelatedIds = new Set(t17Batch.files
  .filter((file) => file.bibliographicRelations?.length)
  .map((file) => file.id));
const t17RelatedExpressions = expressions.filter((expression) =>
  t17RelatedIds.has(expression.id.replace(/^gbcr:expression:(T[^-]+)-zh-Hant$/, "$1")));
const fiveNonReversals = registry.works.find((work) => work.id === "gbcr:work:five-non-reversals-t0751");
const wordlessJewelCasket = registry.works.find((work) => work.id === "gbcr:work:wordless-jewel-casket-t0828");
const tathagatagarbhaCandidate = registry.works.find((work) => work.id === "gbcr:work:taisho-t0821");
const tathagatagarbhaTranslations = registry.works.find((work) => work.id === "gbcr:work:tathagatagarbha-sutra-t0666");
requireValue(t17RelatedExpressions.length === 46, "T17 新增关系证据未完整进入文本表达或见证");
requireValue(
  sameMembers(fiveNonReversals?.externalIds?.cbeta, ["T0751a", "T0751b", "T0752"]) &&
    fiveNonReversals?.expressions?.filter((expression) => expression.sourceRole === "edition_witness").length === 2,
  "《五无反复经》两个版本见证与经号表达未正确归入同一作品",
);
requireValue(
  sameMembers(wordlessJewelCasket?.externalIds?.cbeta, ["T0828", "T0829", "T0830"]) &&
    wordlessJewelCasket?.expressions?.length === 3,
  "《无字宝箧经》三种汉译未正确归入同一作品",
);
requireValue(
  tathagatagarbhaCandidate?.bibliographicRelations?.some((relation) => relation.groupId === "tathagatagarbha-t0821-candidate") &&
    tathagatagarbhaTranslations?.bibliographicRelations?.some((relation) => relation.groupId === "tathagatagarbha-t0821-candidate") &&
    tathagatagarbhaCandidate.id !== tathagatagarbhaTranslations.id,
  "T0821 与《如来藏经》候选关系必须公开且不得强行合并",
);
requireValue(
  registry.works.find((work) => work.id === "gbcr:work:taisho-t0839")?.expressions?.[0]?.sourceRole === "indigenous_composition_candidate",
  "T0839 中国撰述候选边界缺失",
);
requireValue(
  registry.works.find((work) => work.id === "gbcr:work:taisho-t0847")?.expressions?.[0]?.sourceRole === "attributed_authored_or_compiled_text",
  "T0847 诸经要集编纂边界缺失",
);
const t18RelatedIds = new Set(t18Batch.files
  .filter((file) => file.bibliographicRelations?.length)
  .map((file) => file.id));
const t18RelatedExpressions = expressions.filter((expression) =>
  t18RelatedIds.has(expression.id.replace(/^gbcr:expression:(T[^-]+)-zh-Hant$/, "$1")));
const t0852Witnesses = registry.works.find((work) => work.id === "gbcr:work:maha-vairocana-ritual-t0852");
const t0893Witnesses = registry.works.find((work) => work.id === "gbcr:work:susiddhikara-sutra-t0893");
const t0894Witnesses = registry.works.find((work) => work.id === "gbcr:work:susiddhikara-puja-t0894");
const t0895Witnesses = registry.works.find((work) => work.id === "gbcr:work:subahu-pariprccha-t0895");
requireValue(t18RelatedExpressions.length === 15, "T18 关系证据未完整进入文本表达或见证");
requireValue(sameMembers(t0852Witnesses?.externalIds?.cbeta, ["T0852a", "T0852b"]) && t0852Witnesses?.expressions?.length === 2, "T0852 a/b 版本见证未正确归入同一作品");
requireValue(sameMembers(t0893Witnesses?.externalIds?.cbeta, ["T0893a", "T0893b", "T0893c"]) && t0893Witnesses?.expressions?.length === 3, "T0893 a/b/c 版本见证未正确归入同一作品");
requireValue(sameMembers(t0894Witnesses?.externalIds?.cbeta, ["T0894a", "T0894b"]) && t0894Witnesses?.expressions?.length === 2, "T0894 a/b 版本见证未正确归入同一作品");
requireValue(sameMembers(t0895Witnesses?.externalIds?.cbeta, ["T0895a", "T0895b"]) && t0895Witnesses?.expressions?.length === 2, "T0895 a/b 版本见证未正确归入同一作品");
requireValue(
  ["T0865", "T0866", "T0882"].every((id) => registry.works.find((work) => work.externalIds?.cbeta?.includes(id))?.bibliographicRelations?.some((relation) => relation.groupId === "sarvatathagata-tattvasamgraha-t0865-t0866-t0882")) &&
    new Set(["T0865", "T0866", "T0882"].map((id) => registry.works.find((work) => work.externalIds?.cbeta?.includes(id))?.id)).size === 3,
  "T0865/T0866/T0882 文本家族候选必须公开且保持三个作品实体",
);
requireValue(
  ["T0908", "T0909"].every((id) => registry.works.find((work) => work.externalIds?.cbeta?.includes(id))?.bibliographicRelations?.some((relation) => relation.groupId === "homa-ritual-t0908-t0909-candidate")) &&
    registry.works.find((work) => work.externalIds?.cbeta?.includes("T0908"))?.id !== registry.works.find((work) => work.externalIds?.cbeta?.includes("T0909"))?.id,
  "T0908/T0909 同作品候选必须公开且不得自动合并",
);
requireValue(
  ["T0863", "T0886"].every((id) => expressions.find((expression) => expression.id === `gbcr:expression:${id}-zh-Hant`)?.fullSourceText === false),
  "T0863/T0886 必须保持局部作品见证而不得冒充完整母作品",
);
const t19RelatedIds = new Set(t19Batch.files
  .filter((file) => file.bibliographicRelations?.length)
  .map((file) => file.id));
const t19RelatedExpressions = expressions.filter((expression) =>
  t19RelatedIds.has(expression.id.replace(/^gbcr:expression:(T[^-]+)-zh-Hant$/, "$1")));
requireValue(t19RelatedExpressions.length === 53, "T19 关系证据未完整进入文本表达或见证");
for (const [workId, ids] of [
  ["gbcr:work:bhaisajya-guru-ritual-t0924", ["T0924A", "T0924B"]],
  ["gbcr:work:ekaksara-usnisa-cakravartin-ritual-t0954", ["T0954A", "T0954B"]],
  ["gbcr:work:karandamudra-dharani-t1022", ["T1022A", "T1022B"]],
  ["gbcr:work:vajra-flame-weather-dharani-t1027", ["T1027a", "T1027b"]],
]) {
  const work = registry.works.find((candidate) => candidate.id === workId);
  requireValue(sameMembers(work?.externalIds?.cbeta, ids) && work?.expressions?.length === 2, `${ids.join("/")} 版本见证未正确归入同一作品`);
}
requireValue(
  ["T0944A", "T0944B"].every((id) => registry.works.find((work) => work.externalIds?.cbeta?.includes(id))?.bibliographicRelations?.some((relation) => relation.groupId === "sitapatra-t0944-candidate")) &&
    registry.works.find((work) => work.externalIds?.cbeta?.includes("T0944A"))?.id !== registry.works.find((work) => work.externalIds?.cbeta?.includes("T0944B"))?.id,
  "T0944 A/B 题名家族候选必须公开且保持两个作品实体",
);
requireValue(
  ["T0938", "T0947", "T0983B", "T0992", "T0993", "T1005B"].every((id) => expressions.find((expression) => expression.id === `gbcr:expression:${id}-zh-Hant`)?.fullSourceText === false),
  "T19 六条品、真言或组件来源必须保持局部作品见证",
);
requireValue(
  JSON.stringify(cbetaCatalog.files.find((file) => file.id === "T0946")?.verification?.juans) === JSON.stringify(["001", "002", "004", "005"]),
  "T0946 必须保留来源卷号 1、2、4、5",
);
const t20RelatedIds = new Set(t20Batch.files
  .filter((file) => file.bibliographicRelations?.length)
  .map((file) => file.id));
const t20RelatedExpressions = expressions.filter((expression) =>
  t20RelatedIds.has(expression.id.replace(/^gbcr:expression:(T[^-]+)-zh-Hant$/, "$1")));
requireValue(t20RelatedExpressions.length === 117, "T20 关系证据未完整进入文本表达或见证");
for (const [number, ids] of [
  ["1045", ["T1045a", "T1045b"]],
  ["1057", ["T1057a", "T1057b"]],
  ["1103", ["T1103a", "T1103b"]],
  ["1108", ["T1108A", "T1108B"]],
  ["1134", ["T1134A", "T1134B"]],
  ["1138", ["T1138a", "T1138b"]],
  ["1185", ["T1185A", "T1185B"]],
]) {
  const work = registry.works.find((candidate) => candidate.id === `gbcr:work:taisho-t${number}-edition-group`);
  requireValue(sameMembers(work?.externalIds?.cbeta, ids) && work?.expressions?.length === 2, `${ids.join("/")} 版本见证未正确归入同一作品`);
}
requireValue(
  ["T1040", "T1120B", "T1130", "T1173", "T1181"].every((id) => expressions.find((expression) => expression.id === `gbcr:expression:${id}-zh-Hant`)?.fullSourceText === false),
  "T20 五条品、分、母经中独立译出或真言组件来源必须保持局部作品见证",
);
requireValue(
  ["T1062A", "T1062B"].every((id) => registry.works.find((work) => work.externalIds?.cbeta?.includes(id))?.bibliographicRelations?.some((relation) => relation.groupId === "t1062-component-candidate")) &&
    registry.works.find((work) => work.externalIds?.cbeta?.includes("T1062A"))?.id !== registry.works.find((work) => work.externalIds?.cbeta?.includes("T1062B"))?.id,
  "T1062 A/B 组件候选必须公开且保持两个作品实体",
);
const t21RelatedIds = new Set(t21Batch.files
  .filter((file) => file.bibliographicRelations?.length)
  .map((file) => file.id));
const t21RelatedExpressions = expressions.filter((expression) =>
  t21RelatedIds.has(expression.id.replace(/^gbcr:expression:(T[^-]+)-zh-Hant$/, "$1")));
requireValue(t21RelatedExpressions.length === 177, "T21 关系证据未完整进入文本表达或见证");
for (const [number, ids] of [
  ["1222", ["T1222a", "T1222b"]],
  ["1252", ["T1252a", "T1252b"]],
  ["1255", ["T1255a", "T1255b"]],
  ["1264", ["T1264a", "T1264b"]],
  ["1369", ["T1369a", "T1369b"]],
  ["1378", ["T1378a", "T1378b"]],
]) {
  const work = registry.works.find((candidate) => candidate.id === `gbcr:work:taisho-t${number}-edition-group`);
  requireValue(sameMembers(work?.externalIds?.cbeta, ids) && work?.expressions?.length === 2, `${ids.join("/")} 版本见证未正确归入同一作品`);
}
requireValue(
  ["T1199", "T1215", "T1216", "T1273", "T1276", "T1297"].every((id) => expressions.find((expression) => expression.id === `gbcr:expression:${id}-zh-Hant`)?.fullSourceText === false),
  "T21 六条法品、仪轨品或大教王经组件来源必须保持局部作品见证",
);
requireValue(
  ["T1382", "T1383"].every((id) => registry.works.find((work) => work.externalIds?.cbeta?.includes(id))?.bibliographicRelations?.some((relation) => relation.groupId === "past-life-knowledge-t1382-t1383")) &&
    registry.works.find((work) => work.externalIds?.cbeta?.includes("T1382"))?.id !== registry.works.find((work) => work.externalIds?.cbeta?.includes("T1383"))?.id,
  "T1382/T1383 同题候选必须公开且保持两个作品实体",
);
const t22RelatedIds = new Set(t22Batch.files
  .filter((file) => file.bibliographicRelations?.length)
  .map((file) => file.id));
const t22RelatedExpressions = expressions.filter((expression) =>
  t22RelatedIds.has(expression.id.replace(/^gbcr:expression:(T[^-]+)-zh-Hant$/, "$1")));
requireValue(t22RelatedExpressions.length === 15, "T22 关系证据未完整进入文本表达或见证");
const t1422Work = registry.works.find((candidate) => candidate.id === "gbcr:work:taisho-t1422-edition-group");
requireValue(
  sameMembers(t1422Work?.externalIds?.cbeta, ["T1422a", "T1422b"]) && t1422Work?.expressions?.length === 2,
  "T1422a/T1422b 版本见证未正确归入同一作品",
);
for (const [left, right, groupId] of [
  ["T1429", "T1430", "dharmaguptaka-bhiksu-pratimoksa-t1429-t1430"],
  ["T1432", "T1433", "dharmaguptaka-karmavacana-t1432-t1434"],
]) {
  const leftWork = registry.works.find((work) => work.externalIds?.cbeta?.includes(left));
  const rightWork = registry.works.find((work) => work.externalIds?.cbeta?.includes(right));
  requireValue(
    leftWork?.id !== rightWork?.id &&
      leftWork?.bibliographicRelations?.some((relation) => relation.groupId === groupId) &&
      rightWork?.bibliographicRelations?.some((relation) => relation.groupId === groupId),
    `${left}/${right} 高相似传本必须公开候选关系且保持不同作品实体`,
  );
}
requireValue(expressions.filter((expression) => expression.sourceRole === "translated_vinaya_canonical_record").length === 58, "T22–T24 译律、戒本、羯磨或事部文本角色总数漂移");
requireValue(expressions.filter((expression) => expression.sourceRole === "translated_and_compiled_vinaya_text").length === 2, "T22 佛陀耶舍译并由怀素编集的戒本必须精确保留两条");
requireValue(expressions.filter((expression) => expression.sourceRole === "compiled_or_recorded_vinaya_text").length === 2, "T22 明徽集与爱同录必须精确保留两条");
const t23RelatedIds = new Set(t23Batch.files
  .filter((file) => file.bibliographicRelations?.length)
  .map((file) => file.id));
const t23RelatedExpressions = expressions.filter((expression) =>
  t23RelatedIds.has(expression.id.replace(/^gbcr:expression:(T[^-]+)-zh-Hant$/, "$1")));
requireValue(t23RelatedExpressions.length === 13, "T23 关系证据未完整进入文本表达或见证");
for (const [left, right, groupId] of [
  ["T1438", "T1439", "sarvastivada-dasadhyaya-vinaya-t1435-t1439"],
  ["T1440", "T1441", "sarvastivada-vinaya-exegesis-t1435-t1441"],
  ["T1442", "T1443", "mulasarvastivada-bhiksu-bhiksuni-vinaya-t1442-t1443"],
  ["T1442", "T1445", "mulasarvastivada-vinaya-t1442-t1447"],
]) {
  const leftWork = registry.works.find((work) => work.externalIds?.cbeta?.includes(left));
  const rightWork = registry.works.find((work) => work.externalIds?.cbeta?.includes(right));
  requireValue(
    leftWork?.id !== rightWork?.id &&
      leftWork?.bibliographicRelations?.some((relation) => relation.groupId === groupId) &&
      rightWork?.bibliographicRelations?.some((relation) => relation.groupId === groupId),
    `${left}/${right} 律部组件或解释关系必须公开且保持不同作品实体`,
  );
}
requireValue(expressions.filter((expression) => expression.sourceRole === "compiled_or_extracted_vinaya_text").length === 2, "T23 法显集出与僧璩撰出必须精确保留两条");
requireValue(expressions.filter((expression) => expression.sourceRole === "unattributed_vinaya_procedure_text").length === 1, "T1438 无署名羯磨法必须精确保留一条");
requireValue(expressions.filter((expression) => expression.sourceRole === "lost_translation_with_appended_vinaya_preface").length === 1, "T1440 失译正文与智首续序边界必须精确保留一条");
const t24RelatedIds = new Set(t24Batch.files
  .filter((file) => file.bibliographicRelations?.length)
  .map((file) => file.id));
const t24RelatedExpressions = expressions.filter((expression) =>
  t24RelatedIds.has(expression.id.replace(/^gbcr:expression:(T[^-]+)-zh-Hant$/, "$1")));
requireValue(t24RelatedExpressions.length === 27, "T24 关系证据未完整进入文本表达或见证");
for (const [workId, ids] of [
  ["gbcr:work:disciplinary-consequences-t1467", ["T1467a", "T1467b"]],
  ["gbcr:work:maudgalyayana-vinaya-questions", ["T1483a", "T1483b"]],
  ["gbcr:work:paramarthasamvrtisatyanirdesa", ["T1489", "T1490"]],
]) {
  const work = registry.works.find((candidate) => candidate.id === workId);
  requireValue(sameMembers(work?.externalIds?.cbeta, ids) && work?.expressions?.length === 2, `${ids.join("/")} 同作品版本或异译关系未正确登记`);
}
for (const [left, right, groupId] of [
  ["T1454", "T1458", "mulasarvastivada-vinaya-exegesis-t1454-t1459"],
  ["T1471", "T1472", "novice-precepts-conduct-t1471-t1473"],
  ["T1484", "T1485", "east-asian-bodhisattva-precepts-t1484-t1485"],
  ["T1500", "T1501", "yogacara-bodhisattva-precepts-t1499-t1501"],
]) {
  const leftWork = registry.works.find((work) => work.externalIds?.cbeta?.includes(left));
  const rightWork = registry.works.find((work) => work.externalIds?.cbeta?.includes(right));
  requireValue(
    leftWork?.id !== rightWork?.id &&
      leftWork?.bibliographicRelations?.some((relation) => relation.groupId === groupId) &&
      rightWork?.bibliographicRelations?.some((relation) => relation.groupId === groupId),
    `${left}/${right} 律部解释、威仪、疑伪或菩萨戒关系必须公开且保持不同作品实体`,
  );
}
requireValue(expressions.filter((expression) => expression.sourceRole === "traditional_attributed_vinaya_translation_with_contested_history").length === 3, "T1467a/T1484/T1485 传统归属争议必须精确保留三条");
requireValue(expressions.filter((expression) => expression.sourceRole === "authored_or_taught_vinaya_text_with_translation").length === 6, "T24 造、说与翻译责任边界必须精确保留六条");
requireValue(expressions.filter((expression) => expression.sourceRole === "lost_translation_vinaya_text").length === 9, "T24 一般失译律部文本必须精确保留九条");
requireValue(expressions.filter((expression) => expression.sourceRole === "lost_translation_with_contested_native_compilation_history").length === 2, "T1483a/b 失译与中国编纂层争议必须精确保留两条");
requireValue(expressions.filter((expression) => expression.sourceRole === "unattributed_vinaya_text").length === 1, "T1467b 无署名状态必须精确保留一条");
const t1482 = expressions.find((expression) => expression.id === "gbcr:expression:T1482-zh-Hant");
requireValue(t1482?.fullSourceText === false && t1482?.sourceRole === "translated_vinaya_canonical_record", "T1482 必须保持完整来源文件、局部作品见证边界");
requireValue(expressions.filter((expression) => expression.sourceRole === "translated_esoteric_canonical_record").length === 478, "T18–T21 译经型目录记录角色总数漂移");
requireValue(expressions.filter((expression) => expression.sourceRole === "attributed_authored_compiled_or_taught_esoteric_text").length === 9, "T18 撰述、辑录或传授型文本角色数漂移");
requireValue(expressions.filter((expression) => expression.sourceRole === "attributed_authored_compiled_or_transmitted_esoteric_text").length === 34, "T19–T21 撰述、论造、译解、注校、记录、请来或口受文本角色数漂移");
requireValue(expressions.filter((expression) => expression.sourceRole === "unattributed_esoteric_text_or_ritual").length === 67, "T18–T21 未署作者或译者的密教文本角色总数漂移");
requireValue(expressions.filter((expression) => expression.sourceRole === "traditional_attributed_translation_with_contested_history").length === 1, "T0945 传统译题争议角色必须精确保留一条");
requireValue(
  expressions.filter((expression) => expression.sourceRole === "edition_witness").length === 22,
  "同译本版本见证必须精确保留二十二条",
);
requireValue(expressions.filter((expression) => expression.sourceRole === "translation_attribution_unknown").length === 82, "失译边界必须精确保留八十二条；兼具局部或短本性质者以更具体的见证角色登记");
requireValue(expressions.filter((expression) => expression.sourceRole === "partial_translation_witness").length === 10, "节译或单品译出见证必须精确保留十条");
requireValue(expressions.filter((expression) => expression.sourceRole === "abridged_translation_witness").length === 1, "T0686 短本翻译见证必须保持独立来源角色");
requireValue(expressions.filter((expression) => expression.sourceRole === "compiled_canonical_witness").length === 1, "T0664 合部编纂见证必须保持独立来源角色");
requireValue(expressions.filter((expression) => expression.sourceRole === "attributed_authored_or_compiled_text").length === 17, "造撰或编纂型文本必须精确保留十七条");
requireValue(expressions.filter((expression) => expression.sourceRole === "partial_continuation_witness").length === 1, "后分见证必须精确保留一条");
requireValue(expressions.filter((expression) => expression.sourceRole === "edited_compilation_witness").length === 1, "校辑见证必须精确保留一条");
requireValue(expressions.filter((expression) => expression.sourceRole === "edited_recension_witness").length === 1, "加治本见证必须精确保留一条");
requireValue(expressions.filter((expression) => expression.sourceRole === "partial_text_family_witness_candidate").length === 1, "文本家族残篇候选必须精确保留一条");
requireValue(
  expressions.filter((expression) => expression.sourceRole === "traditional_translation_attribution_disputed").length === 4,
  "传统译者署名争议必须精确保留四条",
);
requireValue(
  expressions.filter((expression) => expression.sourceRole === "multi_translation_collection_witness").length === 1,
  "多译者合集见证必须精确保留一条",
);
requireValue(
  expressions.filter((expression) => expression.sourceRole === "abridged_recension_witness").length === 1,
  "后出节本见证必须精确保留一条",
);
requireValue(
  expressions.filter((expression) => expression.sourceRole === "liturgical_transliteration_witness").length === 1,
  "梵汉对音读诵见证必须保持独立来源角色",
);
requireValue(paliDhammapada?.expressions?.length === 1, "巴利《法句经》必须登记为一个文本表达");
requireValue(paliDhammapada?.expressions?.[0]?.sourceTextAssets?.length === 26, "巴利《法句经》必须保留 26 个来源资产");
requireValue(paliDhammapada?.expressions?.[0]?.stableSegments === 2234, "巴利《法句经》原生段落数漂移");
requireValue(chineseDharmapada?.textFamilyId === dhammapadaFamily?.id, "汉译《法句经》未进入法句文本家族");
requireValue(paliDhammapada?.textFamilyId === dhammapadaFamily?.id, "巴利《法句经》未进入法句文本家族");
requireValue(dhammapadaFamily?.alignmentStatus === "family_level_only", "法句文本家族不得伪造逐段对齐");
requireValue(registry.parallelRelations?.[0]?.segmentAlignment === "not_asserted", "未复核的平行段落关系不得发布");
const dighaWorks = registry.works.filter((work) => /^gbcr:work:digha-nikaya-dn\d+-pali$/.test(work.id));
requireValue(dighaWorks.length === 34, "《长部》34 经的作品记录不完整");
requireValue(dighaWorks.every((work) => work.expressions?.length === 1), "《长部》每经应有一个巴利文本表达");
const majjhimaWorks = registry.works.filter((work) => /^gbcr:work:majjhima-nikaya-mn\d+-pali$/.test(work.id));
requireValue(majjhimaWorks.length === 152, "《中部》152 经的作品记录不完整");
requireValue(majjhimaWorks.every((work) => work.expressions?.length === 1), "《中部》每经应有一个巴利文本表达");
const samyuttaWorks = registry.works.filter((work) => /^gbcr:work:samyutta-nikaya-sn\d+-pali$/.test(work.id));
requireValue(samyuttaWorks.length === 56, "《相应部》56 个相应级经集的作品记录不完整");
requireValue(samyuttaWorks.every((work) => work.expressions?.length === 1), "《相应部》每个相应应有一个巴利文本表达");
requireValue(
  samyuttaWorks.reduce((sum, work) => sum + (work.expressions?.[0]?.sourceTextAssets?.length ?? 0), 0) === 1819,
  "《相应部》必须保留 1,819 个可独立校验的来源资产",
);
const anguttaraWorks = registry.works.filter((work) => /^gbcr:work:anguttara-nikaya-an\d+-pali$/.test(work.id));
requireValue(anguttaraWorks.length === 11, "《增支部》11 个集级经集的作品记录不完整");
requireValue(anguttaraWorks.every((work) => work.expressions?.length === 1), "《增支部》每个集应有一个巴利文本表达");
requireValue(
  anguttaraWorks.reduce((sum, work) => sum + (work.expressions?.[0]?.sourceTextAssets?.length ?? 0), 0) === 1408,
  "《增支部》必须保留 1,408 个可独立校验的来源资产",
);
const khuddakaWorks = registry.works.filter((work) => /^gbcr:work:khuddaka-nikaya-(?!dhp)[a-z-]+-pali$/.test(work.id));
requireValue(khuddakaWorks.length === 19, "《小部》新增 19 个书级作品记录不完整");
requireValue(khuddakaWorks.every((work) => work.expressions?.length === 1), "《小部》每书应有一个巴利文本表达");
requireValue(
  khuddakaWorks.reduce((sum, work) => sum + (work.expressions?.[0]?.sourceTextAssets?.length ?? 0), 0) === 2325,
  "《小部》新增书级作品必须保留 2,325 个可独立校验的来源资产",
);
requireValue(
  khuddakaWorks.every((work) => work.relationDecision?.includes("不因其位于同一目录就声称全部为佛陀亲说")),
  "《小部》体裁与佛说归属边界未写入作品裁决",
);
const vinayaWorks = registry.works.filter((work) =>
  work.externalIds?.suttacentral?.some((id) => /^pli-tv-(?:bu|bi)-(?:pm|vb)$|^pli-tv-(?:kd|pvr)$/.test(id)),
);
requireValue(vinayaWorks.length === 6, "巴利律藏六个书级作品记录不完整");
requireValue(vinayaWorks.every((work) => work.workType === "canonical_text_collection" && work.expressions?.length === 1), "巴利律藏必须保持六个书级文本集合与六个表达");
requireValue(vinayaWorks.reduce((sum, work) => sum + (work.expressions?.[0]?.sourceTextAssets?.length ?? 0), 0) === 422, "巴利律藏必须保留 422 个可独立校验的来源资产");
requireValue(vinayaWorks.reduce((sum, work) => sum + (work.expressions?.[0]?.stableSegments ?? 0), 0) === 71557, "巴利律藏六个表达的稳定段落总数漂移");
requireValue(vinayaWorks.every((work) => work.relationDecision?.includes("物理文件只作可复核来源记录")), "巴利律藏作品计数裁决边界缺失");
const abhidhammaWorks = registry.works.filter((work) =>
  work.externalIds?.suttacentral?.some((id) => /^pli-abh-(?:ds|vb|dt|pp|kv|ya|patthana)$/.test(id)),
);
requireValue(abhidhammaWorks.length === 7, "巴利论藏七个书级作品记录不完整");
requireValue(abhidhammaWorks.every((work) => work.workType === "canonical_text_collection" && work.expressions?.length === 1), "巴利论藏必须保持七个书级文本集合与七个表达");
requireValue(abhidhammaWorks.reduce((sum, work) => sum + (work.expressions?.[0]?.sourceTextAssets?.length ?? 0), 0) === 1102, "巴利论藏必须保留 1,102 个可独立校验的来源资产");
requireValue(abhidhammaWorks.reduce((sum, work) => sum + (work.expressions?.[0]?.stableSegments ?? 0), 0) === 88414, "巴利论藏七个表达的稳定段落总数漂移");
requireValue(abhidhammaWorks.every((work) => work.relationDecision?.includes("物理文件只作可复核章节或细分来源")), "巴利论藏作品计数裁决边界缺失");
requireValue(abhidhammaWorks.every((work) => work.attributionDecision?.includes("不据此声称其为佛陀逐字亲说")), "巴利论藏佛说归属边界缺失");
requireValue(
  JSON.stringify(lankavatara?.externalIds?.cbeta) === JSON.stringify(["T0670", "T0671", "T0672"]),
  "《楞伽经》三个汉译文本未正确归并",
);
requireValue(lankavatara?.expressions?.length === 3, "《楞伽经》必须保留三个独立文本表达");
requireValue(
  JSON.stringify(avatamsaka?.externalIds?.cbeta) === JSON.stringify(["T0278", "T0279"]),
  "《华严经》六十卷本与八十卷本未正确归并",
);
requireValue(avatamsaka?.expressions?.length === 2, "《华严经》必须保留两个独立文本表达");
requireValue(
  JSON.stringify(mahaparinirvana?.externalIds?.cbeta) === JSON.stringify(["T0374", "T0375", "T0376", "T0377"]),
  "《大般涅槃经》北本、南本、法显本与后分见证未正确归并",
);
requireValue(mahaparinirvana?.expressions?.length === 4, "《大般涅槃经》必须保留三个完整来源表达与一条后分见证");
requireValue(
  JSON.stringify(mahaPrajnaparamita?.externalIds?.cbeta) === JSON.stringify(["T0220"]),
  "《大般若经》必须登记为一个目录学文本表达",
);
requireValue(mahaPrajnaparamita?.expressions?.length === 1, "《大般若经》不得按物理文件拆成多个文本表达");
requireValue(mahaPrajnaparamita?.bibliographicRelations?.length === 7, "《大般若经》七组经会与文本家族关系未完整保留");
requireValue(
  mahaPrajnaparamita?.expressions?.[0]?.sourceTextAssets?.length === 15,
  "《大般若经》必须保留 15 个可独立校验的来源资产",
);
if (errors.length > 0) {
  console.error(errors.map((item) => `- ${item}`).join("\n"));
  process.exit(1);
}
console.log(`GBCR ${registry.registry.version} 已通过校验：${registry.works.length} 个作品实体、${expressions.length} 个表达或见证、${expressions.filter((expression) => expression.fullSourceText).length} 个完整文本，${segmentCount} 个稳定行段，${candidateCount} 条上游候选记录。`);

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const verifyMode = process.argv.includes("--verify");
const basePath = "data/gbcr/registry-v6.22.0.json";
const catalogPath = "data/corpus/suttacentral/sujato-en-catalog-v1.0.0.json";
const manifestPath = "data/corpus/suttacentral/sujato-en-manifest-v1.0.0.json";
const ledgerPath = "data/gbcr/suttacentral-sujato-en-ingest-v1.0.0.json";
const rightsPath = "data/gbcr/suttacentral-sujato-en-rights-audit-v1.0.0.json";
const outputPath = "data/gbcr/registry-v6.23.0.json";
const checksumPath = "data/gbcr/checksums-v6.23.0.sha256";
const inputPaths = [basePath, catalogPath, manifestPath, ledgerPath, rightsPath];
const inputBytes = await Promise.all(inputPaths.map((path) => readFile(resolve(root, path))));
const [, catalogBytes, manifestBytes, ledgerBytes, rightsBytes] = inputBytes;
const [base, catalog, manifest, ledger, rights] = inputBytes.map((bytes) => JSON.parse(bytes.toString("utf8")));
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const jsonRaw = (value) => `${JSON.stringify(value, null, 2)}\n`;

if (base.registry.version !== "6.22.0" || base.works.length !== 3396) throw new Error("GBCR v6.22 基线漂移");
if (catalog.version !== "1.0.0" || catalog.files.length !== 254 || catalog.collection.newWorks !== 0) {
  throw new Error("Sujato 英译目录漂移");
}
if (manifest.version !== "1.0.0" || manifest.files.length !== 254) throw new Error("Sujato 英译清单漂移");
if (ledger.ingest.newWorks !== 0 || ledger.ingest.newExpressions !== 254 || ledger.ingest.filesApprovedForModelTraining !== 0) {
  throw new Error("Sujato 英译总帐计数漂移");
}
if (rights.summary.filesApprovedForModelTraining !== 0 || rights.summary.newWorks !== 0) {
  throw new Error("Sujato 英译权利审计不得批准训练或新建作品");
}
if (base.globalDenominatorGovernance.independentHumanDecisions !== 0) throw new Error("不得伪造独立真人复核");

function sourceUnits(file) {
  return file.sourceParts ?? [file];
}

function expressionFromFile(file) {
  const units = sourceUnits(file);
  const assets = units.map((unit, index) => ({
    part: unit.part ?? index + 1,
    id: unit.id ?? file.id,
    path: unit.localPath,
    format: unit.format ?? file.format,
    sha256: unit.localSha256,
    rightsStatus: "cc0",
  }));
  return {
    id: `gbcr:expression:${file.id}-en`,
    language: "en",
    title: file.presentation.title,
    translator: file.presentation.translator,
    sourceSnapshotId: "suttacentral_bilara_sujato_en",
    localSlug: file.slug,
    cataloged: true,
    fullSourceText: true,
    completeSourceRecord: true,
    sampled: file.verification.humanSampleVerified,
    stableSegments: file.verification.segments,
    rightsReviewed: true,
    qualityStatus: "verified_structure_and_anchors",
    sourceRole: file.sourceRole,
    canonicalStatus: file.canonicalStatus,
    buddhaWordStatus: file.buddhaWordStatus,
    bibliographicRelations: file.bibliographicRelations,
    filesApprovedForModelTraining: 0,
    ...(assets.length === 1
      ? { sourceTextAsset: { path: assets[0].path, format: assets[0].format, sha256: assets[0].sha256, rightsStatus: "cc0" } }
      : { sourceTextAssets: assets }),
  };
}

const attachedWorkIds = new Set(catalog.files.map((file) => file.workId));
const baseIds = new Set(base.works.map((work) => work.id));
for (const workId of attachedWorkIds) {
  if (!baseIds.has(workId)) throw new Error(`掛接作品不在既有登記冊：${workId}`);
}
if (attachedWorkIds.size !== 254) throw new Error(`Sujato 英译应挂接 254 部既有作品，实际 ${attachedWorkIds.size}`);
if (!attachedWorkIds.has("gbcr:work:dhammapada-pali")) throw new Error("缺少巴利法句挂接");

const works = base.works.map((work) => {
  if (!attachedWorkIds.has(work.id)) return work;
  const files = catalog.files.filter((file) => file.workId === work.id);
  return {
    ...work,
    sourceRoles: [...new Set([...(work.sourceRoles ?? []), ...files.map((file) => file.sourceRole)])],
    bibliographicRelations: [
      ...(work.bibliographicRelations ?? []),
      ...files.flatMap((file) => file.bibliographicRelations ?? []),
    ].filter((relation, index, all) => all.findIndex((candidate) => candidate.groupId === relation.groupId) === index),
    expressions: [...work.expressions, ...files.map(expressionFromFile)],
  };
});

const sourceFamilies = [
  ...base.sourceFamilies,
  {
    id: "suttacentral_bilara_sujato_en",
    title: "SuttaCentral Bilara Sujato 英译",
    traditions: ["上座部佛教"],
    languages: ["en"],
    primarySources: ["suttacentral_bilara_sujato_en"],
    denominatorStatus: "translation_witness_attached_not_global_denominator",
    denominatorWorks: null,
    deduplicationNote: "Sujato CC0 英译挂接已持有巴利四部与法句，不另建作品，也不进入全球佛说作品分母。",
    sujatoEnglishControlledExpressions: catalog.files.length,
    sujatoEnglishAttachedExistingWorks: attachedWorkIds.size,
    sujatoEnglishNewWorks: 0,
    sujatoEnglishControlledSourceRecords: catalog.files.reduce((sum, file) => sum + file.verification.sourceRecords, 0),
    sujatoEnglishControlledSourceBytes: catalog.collection.sourceBytes,
    sujatoEnglishControlledStableSegments: catalog.files.reduce((sum, file) => sum + file.verification.segments, 0),
    sujatoEnglishFilesApprovedForModelTraining: 0,
    sujatoEnglishCatalogFile: catalogPath,
    sujatoEnglishCatalogSha256: sha256(catalogBytes),
    sujatoEnglishManifestFile: manifestPath,
    sujatoEnglishManifestSha256: sha256(manifestBytes),
    sujatoEnglishLedgerFile: ledgerPath,
    sujatoEnglishLedgerSha256: sha256(ledgerBytes),
    sujatoEnglishRightsAuditFile: rightsPath,
    sujatoEnglishRightsAuditSha256: sha256(rightsBytes),
    sujatoEnglishNote: "只收 Bilara published translation/en/sujato 且出版记录为 CC0 的 DN/MN/SN/AN/Dhp。不收 DSBC、GRETIL、Brahmali 律、旧版混合许可译文。",
  },
];

const registry = {
  ...base,
  registry: { ...base.registry, version: "6.23.0", publishedAt: "2026-08-27" },
  sourceFamilies,
  claimPolicy: {
    ...base.claimPolicy,
    reason: "站内登记作品仍为 3,396 部；文本表达增至 4,182 个，其中 254 个是已持有巴利经藏作品的 Sujato CC0 英译。3,377 部既有作品仍在双人复核队列，独立真人决定仍为 0。全球分母与百分比不得发布。",
  },
  suttacentralSujatoEnglishRightsAudit: {
    status: "complete_cc0_translation_witness_with_global_denominator_unknown",
    sourceSnapshotId: "suttacentral_bilara_sujato_en",
    commit: catalog.source.commit,
    controlledExpressions: catalog.files.length,
    newWorks: 0,
    attachedExistingWorks: attachedWorkIds.size,
    sourceRecords: catalog.files.reduce((sum, file) => sum + file.verification.sourceRecords, 0),
    stableSegments: catalog.files.reduce((sum, file) => sum + file.verification.segments, 0),
    sourceBytes: catalog.collection.sourceBytes,
    filesApprovedForReadingAndRetrieval: catalog.files.reduce((sum, file) => sum + file.verification.sourceRecords, 0),
    filesApprovedForModelTraining: 0,
    catalogFile: catalogPath,
    catalogSha256: sha256(catalogBytes),
    manifestFile: manifestPath,
    manifestSha256: sha256(manifestBytes),
    ledgerFile: ledgerPath,
    ledgerSha256: sha256(ledgerBytes),
    rightsAuditFile: rightsPath,
    rightsAuditSha256: sha256(rightsBytes),
    caveat: "本审计证明 254 份 Sujato CC0 英译的来源完整性与结构完整性；不把英译、未收入的 DSBC/GRETIL/律藏或其余小部计成全球佛陀亲说覆盖率，也不批准训练。",
  },
  works,
};

const expressions = registry.works.flatMap((work) => work.expressions);
const totals = {
  works: registry.works.length,
  expressions: expressions.length,
  fullSourceExpressions: expressions.filter((expression) => expression.fullSourceText).length,
  worksWithFullSource: registry.works.filter((work) => work.expressions.some((expression) => expression.fullSourceText)).length,
  stableSegments: expressions.reduce((sum, expression) => sum + (expression.stableSegments ?? 0), 0),
};
const expected = {
  works: 3396,
  expressions: 4182,
  fullSourceExpressions: 4136,
  worksWithFullSource: 3369,
  stableSegments: 5818816 + catalog.files.reduce((sum, file) => sum + file.verification.segments, 0),
};
if (JSON.stringify(totals) !== JSON.stringify(expected)) throw new Error(`GBCR v6.23 统计不一致：${JSON.stringify(totals)} vs ${JSON.stringify(expected)}`);
if (
  registry.claimPolicy.publishable !== false ||
  registry.buddhaWordScopeAudit.globalPercentagePublishable !== false ||
  registry.globalDenominatorGovernance.globalDenominator !== null ||
  registry.globalDenominatorGovernance.globalPercentage !== null ||
  registry.globalDenominatorGovernance.independentHumanDecisions !== 0 ||
  registry.globalDenominatorGovernance.registeredWorksQueued !== 3377 ||
  Object.entries(registry.globalDenominators)
    .filter(([key]) => key !== "status" && key !== "unknownMeans")
    .some(([, value]) => value !== null)
) {
  throw new Error("GBCR v6.23 错误地发布了未审定的全球分母或覆盖率");
}

const registryRaw = jsonRaw(registry);
const checksumRaw = [
  `${sha256(Buffer.from(registryRaw))}  registry-v6.23.0.json`,
  ...inputPaths.map((path, index) => `${sha256(inputBytes[index])}  ${path.split("/").at(-1)}`),
].join("\n") + "\n";
if (verifyMode) {
  // 历史登记册只校验自身与校验和；当前版本指针由后续发布维护。
  for (const [path, expectedRaw] of [[outputPath, registryRaw], [checksumPath, checksumRaw]]) {
    if (await readFile(resolve(root, path), "utf8") !== expectedRaw) throw new Error(`${path} 不可复现`);
  }
  console.log(`GBCR v6.23 可复现：${totals.works} 部作品、${totals.expressions} 个表达、${totals.fullSourceExpressions} 个完整来源表达；全球分母和百分比保持 null。`);
} else {
  await Promise.all([
    writeFile(resolve(root, outputPath), registryRaw),
    writeFile(resolve(root, checksumPath), checksumRaw),
  ]);
  console.log(`GBCR v6.23 已生成：新增 254 个 Sujato 英译表达、0 部新作品；独立真人复核仍为 0。`);
}

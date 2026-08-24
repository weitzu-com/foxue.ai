import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const verifyMode = process.argv.includes("--verify");
const basePath = "data/gbcr/registry-v6.20.0.json";
const catalogPath = "data/corpus/sat/modern-japanese-catalog-v1.0.0.json";
const manifestPath = "data/corpus/sat/modern-japanese-manifest-v1.0.0.json";
const remainingInventoryPath = "data/gbcr/cbeta-remaining-collections-inventory-v0.1.0.json";
const remainingFilterPath = "data/gbcr/cbeta-remaining-fosuo-filter-v1.0.0.json";
const satFilterPath = "data/gbcr/sat-modern-japanese-filter-v1.0.0.json";
const refusalPath = "data/gbcr/east-asian-translation-refusal-v1.0.0.json";
const sourceSnapshotsPath = "data/gbcr/source-snapshots-v4.8.0.json";
const outputPath = "data/gbcr/registry-v6.21.0.json";
const checksumPath = "data/gbcr/checksums-v6.21.0.sha256";
const metadataPath = "src/lib/corpus-registry-metadata.ts";
const inputPaths = [
  basePath, catalogPath, manifestPath, remainingInventoryPath, remainingFilterPath,
  satFilterPath, refusalPath, sourceSnapshotsPath,
];
const inputBytes = await Promise.all(inputPaths.map((path) => readFile(resolve(root, path))));
const [, catalogBytes, manifestBytes, remainingInventoryBytes, remainingFilterBytes, satFilterBytes, refusalBytes] = inputBytes;
const [base, catalog, manifest, remainingInventory, remainingFilter, satFilter, refusal, sourceSnapshots] = inputBytes.map((bytes) =>
  JSON.parse(bytes.toString("utf8")),
);
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const jsonRaw = (value) => `${JSON.stringify(value, null, 2)}\n`;

if (base.registry.version !== "6.20.0" || base.works.length !== 3396) throw new Error("GBCR v6.20 基线漂移");
if (catalog.version !== "1.0.0" || catalog.files.length !== 4) throw new Error("SAT 現代日本語訳目錄漂移");
if (manifest.version !== "1.0.0" || manifest.files.length !== 4) throw new Error("SAT 現代日本語訳清單漂移");
if (remainingInventory.totals.records !== 1176) throw new Error("剩餘館藏來源清單漂移");
if (remainingFilter.totals.included !== 0 || remainingFilter.totals.sourceRecordsAudited !== 1176) {
  throw new Error("剩餘館藏佛說經過濾審計漂移");
}
if (satFilter.totals.included !== 4 || satFilter.totals.titlesAdvertised !== 9) throw new Error("SAT 日譯過濾審計漂移");
if (refusal.importedThisPr.koreanTranslationExpressions !== 0) throw new Error("韓文譯文不得在本批次出現");
if (sourceSnapshots.version !== "4.8.0") throw new Error("来源快照必须为 v4.8.0");
if (base.globalDenominatorGovernance.independentHumanDecisions !== 0) throw new Error("不得伪造独立真人复核");

function expressionFromFile(file) {
  return {
    id: `gbcr:expression:${file.id}-ja`,
    language: "ja",
    title: file.presentation.title,
    translator: file.presentation.translator,
    sourceSnapshotId: "sat_modern_japanese",
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
    sourceTextAsset: {
      path: file.localPath,
      format: file.format,
      sha256: file.localSha256,
      rightsStatus: "cc_by_4",
    },
  };
}

const grouped = new Map();
for (const file of catalog.files) {
  const files = grouped.get(file.workId) ?? [];
  files.push(file);
  grouped.set(file.workId, files);
}
const attachedWorkIds = new Set(catalog.files.map((file) => file.workId));
const baseIds = new Set(base.works.map((work) => work.id));
for (const workId of attachedWorkIds) {
  if (!baseIds.has(workId)) throw new Error(`掛接作品不在既有登記冊：${workId}`);
}
if (attachedWorkIds.size !== 4) throw new Error(`SAT 日譯應掛接 4 個既有作品，實際 ${attachedWorkIds.size}`);

const works = base.works.map((work) => {
  if (!attachedWorkIds.has(work.id)) return work;
  const files = grouped.get(work.id);
  return {
    ...work,
    sourceRoles: [...new Set([...(work.sourceRoles ?? []), ...files.map((file) => file.sourceRole)])],
    bibliographicRelations: [
      ...work.bibliographicRelations,
      ...files.flatMap((file) => file.bibliographicRelations ?? []),
    ].filter((relation, index, all) => all.findIndex((candidate) => candidate.groupId === relation.groupId) === index),
    expressions: [...work.expressions, ...files.map(expressionFromFile)],
  };
});

const sourceFamilies = [
  ...base.sourceFamilies,
  {
    id: "sat_modern_japanese",
    title: "SAT 现代日译佛说经",
    traditions: ["汉传佛教"],
    languages: ["ja"],
    primarySources: ["sat_modern_japanese"],
    denominatorStatus: "translation_witness_attached_not_global_denominator",
    denominatorWorks: null,
    deduplicationNote: "日译挂接已持有汉文佛说作品，不另建作品，也不进入全球佛说作品分母。",
    satModernJapaneseTitlesAdvertised: 9,
    satModernJapaneseControlledExpressions: catalog.files.length,
    satModernJapaneseAttachedExistingWorks: attachedWorkIds.size,
    satModernJapaneseNewWorks: 0,
    satModernJapaneseControlledSourceBytes: catalog.files.reduce((sum, file) => sum + file.upstreamBytes, 0),
    satModernJapaneseControlledStableSegments: catalog.files.reduce((sum, file) => sum + file.verification.segments, 0),
    satModernJapaneseFilterFile: satFilterPath,
    satModernJapaneseFilterSha256: sha256(satFilterBytes),
    satModernJapaneseCatalogFile: catalogPath,
    satModernJapaneseCatalogSha256: sha256(catalogBytes),
    satModernJapaneseManifestFile: manifestPath,
    satModernJapaneseManifestSha256: sha256(manifestBytes),
    satModernJapaneseNote: "4/9 只表示 SAT 現代日本語訳中通過佛說過濾的日譯表達；傳記、歎異抄與父母恩重經保持排除。日譯不增加全球佛說作品數。",
  },
];

const registry = {
  ...base,
  registry: { ...base.registry, version: "6.21.0", publishedAt: "2026-08-24" },
  sourceFamilies,
  claimPolicy: {
    ...base.claimPolicy,
    reason: "站内登记作品仍为 3,396 部；文本表达增至 3,927 个，其中 4 个是已持有佛说经的 SAT 现代日译。3,377 部既有作品仍在双人复核队列，独立真人决定仍为 0。全球分母与百分比不得发布。",
  },
  remainingCbetaFosuoFilterAudit: {
    status: "zero_new_chinese_fosuo_from_remaining_collections",
    sourceSnapshotId: "cbeta_xml_p5",
    sourceRecordDenominator: remainingInventory.totals.records,
    excludedSourceRecords: remainingFilter.totals.excluded,
    includedSourceRecords: 0,
    filterFile: remainingFilterPath,
    filterSha256: sha256(remainingFilterBytes),
    inventoryFile: remainingInventoryPath,
    inventorySha256: sha256(remainingInventoryBytes),
    caveat: remainingFilter.caveat,
  },
  satModernJapaneseFullTextAudit: {
    status: "complete_cc_by_4_translation_witness_with_global_denominator_unknown",
    sourceSnapshotId: "sat_modern_japanese",
    titlesAdvertised: 9,
    excludedTitles: 5,
    controlledExpressions: catalog.files.length,
    newWorks: 0,
    attachedExistingWorks: attachedWorkIds.size,
    stableSegments: catalog.files.reduce((sum, file) => sum + file.verification.segments, 0),
    sourceBytes: catalog.files.reduce((sum, file) => sum + file.upstreamBytes, 0),
    filterFile: satFilterPath,
    filterSha256: sha256(satFilterBytes),
    catalogFile: catalogPath,
    catalogSha256: sha256(catalogBytes),
    manifestFile: manifestPath,
    manifestSha256: sha256(manifestBytes),
    refusalFile: refusalPath,
    refusalSha256: sha256(refusalBytes),
    caveat: "本审计证明 4 份 SAT 现代日译的来源完整性、CC BY 4.0 头部和结构完整性；不把日译、未找到的韩文谚解或国译残缺条目计成全球佛陀亲说覆盖率。",
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
  expressions: 3927,
  fullSourceExpressions: 3881,
  worksWithFullSource: 3369,
  stableSegments: 5815910 + catalog.files.reduce((sum, file) => sum + file.verification.segments, 0),
};
if (JSON.stringify(totals) !== JSON.stringify(expected)) throw new Error(`GBCR v6.21 统计不一致：${JSON.stringify(totals)} vs ${JSON.stringify(expected)}`);
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
  throw new Error("GBCR v6.21 错误地发布了未审定的全球分母或覆盖率");
}

const registryRaw = jsonRaw(registry);
const checksumRaw = [
  `${sha256(Buffer.from(registryRaw))}  registry-v6.21.0.json`,
  ...inputPaths.map((path, index) => `${sha256(inputBytes[index])}  ${path.split("/").at(-1)}`),
].join("\n") + "\n";
const metadataRaw = `// Generated by scripts/build-federated-corpus-v6.21.mjs. Do not edit manually.\nexport const CORPUS_REGISTRY_VERSION = "6.21.0" as const;\n`;

if (verifyMode) {
  for (const [path, expectedRaw] of [[outputPath, registryRaw], [checksumPath, checksumRaw], [metadataPath, metadataRaw]]) {
    if (await readFile(resolve(root, path), "utf8") !== expectedRaw) throw new Error(`${path} 不可复现`);
  }
  console.log(`GBCR v6.21 可复现：${totals.works} 部作品、${totals.expressions} 个表达、${totals.fullSourceExpressions} 个完整来源表达；全球分母和百分比保持 null。`);
} else {
  await Promise.all([
    writeFile(resolve(root, outputPath), registryRaw),
    writeFile(resolve(root, checksumPath), checksumRaw),
    writeFile(resolve(root, metadataPath), metadataRaw),
  ]);
  console.log(`GBCR v6.21 已生成：新增 4 个 SAT 现代日译表达、0 部新作品；独立真人复核仍为 0。`);
}

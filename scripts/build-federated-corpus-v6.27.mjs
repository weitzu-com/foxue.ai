import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const verifyMode = process.argv.includes("--verify");
const basePath = "data/gbcr/registry-v6.26.0.json";
const catalogPath = "data/corpus/gutenberg/lotus-sutra-soothill-catalog-v1.0.0.json";
const manifestPath = "data/corpus/gutenberg/lotus-sutra-soothill-manifest-v1.0.0.json";
const ledgerPath = "data/gbcr/gutenberg-lotus-soothill-ingest-v1.0.0.json";
const outputPath = "data/gbcr/registry-v6.27.0.json";
const checksumPath = "data/gbcr/checksums-v6.27.0.sha256";
const metadataPath = "src/lib/corpus-registry-metadata.ts";
const inputPaths = [basePath, catalogPath, manifestPath, ledgerPath];
const inputBytes = await Promise.all(inputPaths.map((path) => readFile(resolve(root, path))));
const [, catalogBytes, manifestBytes, ledgerBytes] = inputBytes;
const [base, catalog, manifest, ledger] = inputBytes.map((bytes) => JSON.parse(bytes.toString("utf8")));
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const jsonRaw = (value) => `${JSON.stringify(value, null, 2)}\n`;

if (base.registry.version !== "6.26.0" || base.works.length !== 3396 || base.works.flatMap((work) => work.expressions).length !== 4189) {
  throw new Error("GBCR v6.26 基线漂移");
}
if (catalog.version !== "1.0.0" || catalog.files.length !== 1) throw new Error("Soothill《法华经》节本目录漂移");
if (manifest.version !== "1.0.0" || manifest.files.length !== 1) throw new Error("Soothill《法华经》节本清单漂移");
if (
  ledger.ingest.newWorks !== 0
  || ledger.ingest.newExpressions !== 1
  || ledger.ingest.unabridgedTranslations !== 0
) {
  throw new Error("Soothill《法华经》节本总账计数或删节边界漂移");
}
if (base.globalDenominatorGovernance.independentHumanDecisions !== 0) throw new Error("不得伪造独立真人复核");

function expressionFromFile(file) {
  return {
    id: `gbcr:expression:${file.id}-en`,
    language: "en",
    title: file.presentation.title,
    translator: file.presentation.translator,
    sourceSnapshotId: "project_gutenberg_soothill_lotus_1930",
    localSlug: file.slug,
    cataloged: true,
    fullSourceText: true,
    completeSourceRecord: true,
    sampled: file.verification.humanSampleVerified,
    stableSegments: file.verification.segments,
    rightsReviewed: true,
    qualityStatus: "verified_structure_source_boundaries_abridgment_and_anchors_scan_collation_pending",
    sourceRole: file.sourceRole,
    canonicalStatus: file.canonicalStatus,
    buddhaWordStatus: file.buddhaWordStatus,
    bibliographicRelations: file.bibliographicRelations,
    sourceTextAsset: {
      path: file.localPath,
      format: file.format,
      sha256: file.localSha256,
      rightsStatus: "public_domain_usa_local_law_check_elsewhere",
    },
  };
}

const attachedWorkIds = new Set(catalog.files.map((file) => file.workId));
const baseIds = new Set(base.works.map((work) => work.id));
for (const workId of attachedWorkIds) {
  if (!baseIds.has(workId)) throw new Error(`挂接作品不在既有登记册：${workId}`);
}
if (attachedWorkIds.size !== 1 || !attachedWorkIds.has("gbcr:work:saddharma-pundarika-t0262")) {
  throw new Error(`Soothill 英译节本应只挂接 T0262 法华作品，实际 ${[...attachedWorkIds].join(",")}`);
}

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
    id: "project_gutenberg_soothill_lotus_1930",
    title: "Project Gutenberg W. E. Soothill Lotus Sutra 1930",
    traditions: ["大乘佛教", "汉传佛教"],
    languages: ["en"],
    primarySources: ["project_gutenberg_soothill_lotus_1930"],
    denominatorStatus: "abridged_translation_witness_attached_not_global_denominator",
    denominatorWorks: null,
    deduplicationNote: "1930 年公版英译节本挂接既有 T0262《妙法莲华经》作品与鸠摩罗什汉译见证，不另建作品，也不进入全球佛说作品分母。",
    controlledExpressions: catalog.files.length,
    attachedExistingWorks: attachedWorkIds.size,
    newWorks: 0,
    completeDigitalSourceFiles: 1,
    unabridgedTranslations: 0,
    controlledSourceBytes: catalog.files.reduce((sum, file) => sum + file.localBytes, 0),
    controlledStableSegments: catalog.files.reduce((sum, file) => sum + file.verification.segments, 0),
    catalogFile: catalogPath,
    catalogSha256: sha256(catalogBytes),
    manifestFile: manifestPath,
    manifestSha256: sha256(manifestBytes),
    ledgerFile: ledgerPath,
    ledgerSha256: sha256(ledgerBytes),
    qualityBoundary: "Soothill 1930 年英译节本的 28 品与 511 个来源段落全部保存；译者明言省略重复与细节，因此不得写成未删节全译。前言、导论、词汇表、索引、插图与转录注排除；扫描对勘、独立人工译文复核和 T0262 逐句对齐均未完成。",
  },
];

const registry = {
  ...base,
  registry: { ...base.registry, version: "6.27.0", publishedAt: "2026-08-28" },
  sourceFamilies,
  claimPolicy: {
    ...base.claimPolicy,
    reason: "站内登记作品仍为 3,396 部；文本表达增至 4,190 个，其中新增 1 个是已持有 T0262《妙法莲华经》的 1930 年英语删节本。3,377 部既有作品仍在双人复核队列，独立真人决定仍为 0。全球分母与百分比不得发布。",
  },
  gutenbergSoothillLotusAbridgedFullSourceAudit: {
    status: "complete_public_domain_in_usa_digital_source_for_explicitly_abridged_translation_structure_and_boundaries_verified_scan_collation_pending",
    sourceSnapshotId: "project_gutenberg_soothill_lotus_1930",
    controlledExpressions: catalog.files.length,
    newWorks: 0,
    attachedExistingWorks: attachedWorkIds.size,
    completeDigitalSourceFiles: 1,
    unabridgedTranslations: 0,
    stableSegments: catalog.files.reduce((sum, file) => sum + file.verification.segments, 0),
    sourceBytes: catalog.files.reduce((sum, file) => sum + file.localBytes, 0),
    chapterCount: catalog.files[0].verification.chapterCount,
    sourceHeadingCount: catalog.files[0].verification.sourceHeadingCount,
    sourceParagraphCount: catalog.files[0].verification.sourceParagraphCount,
    readingUnits: catalog.files[0].verification.folios,
    isAbridged: true,
    excludedPrefaceAndIntroductions: true,
    excludedGlossaryIndexAndNotes: true,
    humanSampleVerified: false,
    scanCollated: false,
    sentenceAlignedToT0262: false,
    worldwidePublicDomainClaim: false,
    catalogFile: catalogPath,
    catalogSha256: sha256(catalogBytes),
    manifestFile: manifestPath,
    manifestSha256: sha256(manifestBytes),
    ledgerFile: ledgerPath,
    ledgerSha256: sha256(ledgerBytes),
    caveat: "本审计只证明 Project Gutenberg 79267 所标美国公有领域的 1930 年 Soothill 英译节本，其 28 品来源正文、511 个稳定段与首尾锚点完整；不证明未删节全译、全球公版、逐页扫描对勘、逐句准确性、T0262 逐句对齐或全球佛典覆盖。",
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
  expressions: 4190,
  fullSourceExpressions: 4144,
  worksWithFullSource: 3369,
  stableSegments: 5945851,
};
if (JSON.stringify(totals) !== JSON.stringify(expected)) {
  throw new Error(`GBCR v6.27 统计不一致：${JSON.stringify(totals)} vs ${JSON.stringify(expected)}`);
}
if (
  registry.claimPolicy.publishable !== false
  || registry.buddhaWordScopeAudit.globalPercentagePublishable !== false
  || registry.globalDenominatorGovernance.globalDenominator !== null
  || registry.globalDenominatorGovernance.globalPercentage !== null
  || registry.globalDenominatorGovernance.independentHumanDecisions !== 0
  || registry.globalDenominatorGovernance.registeredWorksQueued !== 3377
  || Object.entries(registry.globalDenominators)
    .filter(([key]) => key !== "status" && key !== "unknownMeans")
    .some(([, value]) => value !== null)
) {
  throw new Error("GBCR v6.27 错误地发布了未审定的全球分母或覆盖率");
}

const registryRaw = jsonRaw(registry);
const checksumRaw = [
  `${sha256(Buffer.from(registryRaw))}  registry-v6.27.0.json`,
  ...inputPaths.map((path, index) => `${sha256(inputBytes[index])}  ${path.split("/").at(-1)}`),
].join("\n") + "\n";
const metadataRaw = `// Generated by scripts/build-federated-corpus-v6.27.mjs. Do not edit manually.\nexport const CORPUS_REGISTRY_VERSION = "6.27.0" as const;\n`;

if (verifyMode) {
  for (const [path, expectedRaw] of [[outputPath, registryRaw], [checksumPath, checksumRaw], [metadataPath, metadataRaw]]) {
    if (await readFile(resolve(root, path), "utf8") !== expectedRaw) throw new Error(`${path} 不可复现`);
  }
  console.log(`GBCR v6.27 可复现：${totals.works} 部作品、${totals.expressions} 个表达、${totals.fullSourceExpressions} 个完整来源表达；全球分母和百分比保持 null。`);
} else {
  await Promise.all([
    writeFile(resolve(root, outputPath), registryRaw),
    writeFile(resolve(root, checksumPath), checksumRaw),
    writeFile(resolve(root, metadataPath), metadataRaw),
  ]);
  console.log("GBCR v6.27 已生成：新增 1 个公版英语《法华经》删节表达、0 部新作品；独立真人复核仍为 0。");
}

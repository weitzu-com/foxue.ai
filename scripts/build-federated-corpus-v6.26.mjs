import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const verifyMode = process.argv.includes("--verify");
const basePath = "data/gbcr/registry-v6.25.0.json";
const catalogPath = "data/corpus/gutenberg/diamond-sutra-gemmell-catalog-v1.0.0.json";
const manifestPath = "data/corpus/gutenberg/diamond-sutra-gemmell-manifest-v1.0.0.json";
const ledgerPath = "data/gbcr/gutenberg-diamond-gemmell-ingest-v1.0.0.json";
const outputPath = "data/gbcr/registry-v6.26.0.json";
const checksumPath = "data/gbcr/checksums-v6.26.0.sha256";
const metadataPath = "src/lib/corpus-registry-metadata.ts";
const inputPaths = [basePath, catalogPath, manifestPath, ledgerPath];
const inputBytes = await Promise.all(inputPaths.map((path) => readFile(resolve(root, path))));
const [, catalogBytes, manifestBytes, ledgerBytes] = inputBytes;
const [base, catalog, manifest, ledger] = inputBytes.map((bytes) => JSON.parse(bytes.toString("utf8")));
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const jsonRaw = (value) => `${JSON.stringify(value, null, 2)}\n`;

if (base.registry.version !== "6.25.0" || base.works.length !== 3396 || base.works.flatMap((work) => work.expressions).length !== 4188) {
  throw new Error("GBCR v6.25 基线漂移");
}
if (catalog.version !== "1.0.0" || catalog.files.length !== 1) throw new Error("Gemmell《金刚经》目录漂移");
if (manifest.version !== "1.0.0" || manifest.files.length !== 1) throw new Error("Gemmell《金刚经》清单漂移");
if (ledger.ingest.newWorks !== 0 || ledger.ingest.newExpressions !== 1) throw new Error("Gemmell《金刚经》总账计数漂移");
if (base.globalDenominatorGovernance.independentHumanDecisions !== 0) throw new Error("不得伪造独立真人复核");

function expressionFromFile(file) {
  return {
    id: `gbcr:expression:${file.id}-en`,
    language: "en",
    title: file.presentation.title,
    translator: file.presentation.translator,
    sourceSnapshotId: "project_gutenberg_gemmell_diamond_1912",
    localSlug: file.slug,
    cataloged: true,
    fullSourceText: true,
    completeSourceRecord: true,
    sampled: file.verification.humanSampleVerified,
    stableSegments: file.verification.segments,
    rightsReviewed: true,
    qualityStatus: "verified_structure_source_boundaries_and_anchors_scan_collation_pending",
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
if (attachedWorkIds.size !== 1 || !attachedWorkIds.has("gbcr:work:vajracchedika-prajnaparamita")) {
  throw new Error(`Gemmell 英译应只挂接 Vajracchedikā，实际 ${[...attachedWorkIds].join(",")}`);
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
    id: "project_gutenberg_gemmell_diamond_1912",
    title: "Project Gutenberg William Gemmell Diamond Sutra 1912",
    traditions: ["大乘佛教", "汉传佛教"],
    languages: ["en"],
    primarySources: ["project_gutenberg_gemmell_diamond_1912"],
    denominatorStatus: "translation_witness_attached_not_global_denominator",
    denominatorWorks: null,
    deduplicationNote: "1912 年公版英译挂接既有 Vajracchedikā 作品与鸠摩罗什汉译见证，不另建作品，也不进入全球佛说作品分母。",
    controlledExpressions: catalog.files.length,
    attachedExistingWorks: attachedWorkIds.size,
    newWorks: 0,
    controlledSourceBytes: catalog.files.reduce((sum, file) => sum + file.localBytes, 0),
    controlledStableSegments: catalog.files.reduce((sum, file) => sum + file.verification.segments, 0),
    catalogFile: catalogPath,
    catalogSha256: sha256(catalogBytes),
    manifestFile: manifestPath,
    manifestSha256: sha256(manifestBytes),
    ledgerFile: ledgerPath,
    ledgerSha256: sha256(ledgerBytes),
    qualityBoundary: "32 个来源章标签由 31 个阅读单元覆盖，Chapter 3 and 4 合并边界如实保留；导言、注释与索引排除；扫描对勘和独立人工译文复核均不得写成已完成。",
  },
];

const registry = {
  ...base,
  registry: { ...base.registry, version: "6.26.0", publishedAt: "2026-08-28" },
  sourceFamilies,
  claimPolicy: {
    ...base.claimPolicy,
    reason: "站内登记作品仍为 3,396 部；文本表达增至 4,189 个，其中新增 1 个是已持有 Vajracchedikā／《金刚经》的 1912 年英语译本。3,377 部既有作品仍在双人复核队列，独立真人决定仍为 0。全球分母与百分比不得发布。",
  },
  gutenbergGemmellDiamondFullTextAudit: {
    status: "complete_public_domain_in_usa_translation_witness_structure_and_source_boundaries_verified_scan_collation_pending",
    sourceSnapshotId: "project_gutenberg_gemmell_diamond_1912",
    controlledExpressions: catalog.files.length,
    newWorks: 0,
    attachedExistingWorks: attachedWorkIds.size,
    stableSegments: catalog.files.reduce((sum, file) => sum + file.verification.segments, 0),
    sourceBytes: catalog.files.reduce((sum, file) => sum + file.localBytes, 0),
    chapterCount: catalog.files[0].verification.chapterCount,
    sourceHeadingCount: catalog.files[0].verification.sourceHeadingCount,
    readingUnits: catalog.files[0].verification.folios,
    combinedChapterLabels: catalog.files[0].verification.combinedChapterLabels,
    excludedIntroduction: true,
    excludedCommentaryAndFootnotes: true,
    humanSampleVerified: false,
    scanCollated: false,
    worldwidePublicDomainClaim: false,
    catalogFile: catalogPath,
    catalogSha256: sha256(catalogBytes),
    manifestFile: manifestPath,
    manifestSha256: sha256(manifestBytes),
    ledgerFile: ledgerPath,
    ledgerSha256: sha256(ledgerBytes),
    caveat: "本审计只证明 Project Gutenberg 64623 所标美国公有领域的 1912 年英译正文边界、32 章标签覆盖、95 个稳定段与首尾锚点；不证明全球公版、逐页扫描对勘、逐句译文准确性或全球佛典覆盖。",
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
  expressions: 4189,
  fullSourceExpressions: 4143,
  worksWithFullSource: 3369,
  stableSegments: 5945340,
};
if (JSON.stringify(totals) !== JSON.stringify(expected)) {
  throw new Error(`GBCR v6.26 统计不一致：${JSON.stringify(totals)} vs ${JSON.stringify(expected)}`);
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
  throw new Error("GBCR v6.26 错误地发布了未审定的全球分母或覆盖率");
}

const registryRaw = jsonRaw(registry);
const checksumRaw = [
  `${sha256(Buffer.from(registryRaw))}  registry-v6.26.0.json`,
  ...inputPaths.map((path, index) => `${sha256(inputBytes[index])}  ${path.split("/").at(-1)}`),
].join("\n") + "\n";
const metadataRaw = `// Generated by scripts/build-federated-corpus-v6.26.mjs. Do not edit manually.\nexport const CORPUS_REGISTRY_VERSION = "6.26.0" as const;\n`;

if (verifyMode) {
  // v6.26 is now a historical release. Reproduce its immutable registry and
  // checksums without requiring the mutable current-version pointer to move
  // backwards from v6.27.
  for (const [path, expectedRaw] of [[outputPath, registryRaw], [checksumPath, checksumRaw]]) {
    if (await readFile(resolve(root, path), "utf8") !== expectedRaw) throw new Error(`${path} 不可复现`);
  }
  console.log(`GBCR v6.26 可复现：${totals.works} 部作品、${totals.expressions} 个表达、${totals.fullSourceExpressions} 个完整来源表达；全球分母和百分比保持 null。`);
} else {
  await Promise.all([
    writeFile(resolve(root, outputPath), registryRaw),
    writeFile(resolve(root, checksumPath), checksumRaw),
    writeFile(resolve(root, metadataPath), metadataRaw),
  ]);
  console.log("GBCR v6.26 已生成：新增 1 个公版英语《金刚经》表达、0 部新作品；独立真人复核仍为 0。");
}

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const verifyMode = process.argv.includes("--verify");
const basePath = "data/gbcr/registry-v6.24.0.json";
const catalogPath = "data/corpus/wikisource/muller-dhp-catalog-v1.0.0.json";
const manifestPath = "data/corpus/wikisource/muller-dhp-manifest-v1.0.0.json";
const ledgerPath = "data/gbcr/wikisource-muller-dhp-ingest-v1.0.0.json";
const outputPath = "data/gbcr/registry-v6.25.0.json";
const checksumPath = "data/gbcr/checksums-v6.25.0.sha256";
const inputPaths = [basePath, catalogPath, manifestPath, ledgerPath];
const inputBytes = await Promise.all(inputPaths.map((path) => readFile(resolve(root, path))));
const [, catalogBytes, manifestBytes, ledgerBytes] = inputBytes;
const [base, catalog, manifest, ledger] = inputBytes.map((bytes) => JSON.parse(bytes.toString("utf8")));
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const jsonRaw = (value) => `${JSON.stringify(value, null, 2)}\n`;

if (base.registry.version !== "6.24.0" || base.works.length !== 3396 || base.works.flatMap((work) => work.expressions).length !== 4187) {
  throw new Error("GBCR v6.24 基线漂移");
}
if (catalog.version !== "1.0.0" || catalog.files.length !== 1) throw new Error("Müller Dhammapada 目录漂移");
if (manifest.version !== "1.0.0" || manifest.files.length !== 1) throw new Error("Müller Dhammapada 清单漂移");
if (ledger.ingest.newWorks !== 0 || ledger.ingest.newExpressions !== 1) throw new Error("Müller Dhammapada 总账计数漂移");
if (base.globalDenominatorGovernance.independentHumanDecisions !== 0) throw new Error("不得伪造独立真人复核");

function expressionFromFile(file) {
  return {
    id: `gbcr:expression:${file.id}-en`,
    language: "en",
    title: file.presentation.title,
    translator: file.presentation.translator,
    sourceSnapshotId: "wikisource_muller_dhp_1881",
    localSlug: file.slug,
    cataloged: true,
    fullSourceText: true,
    completeSourceRecord: true,
    sampled: file.verification.humanSampleVerified,
    stableSegments: file.verification.segments,
    rightsReviewed: true,
    qualityStatus: "verified_structure_and_anchors_scan_collation_pending",
    sourceRole: file.sourceRole,
    canonicalStatus: file.canonicalStatus,
    buddhaWordStatus: file.buddhaWordStatus,
    bibliographicRelations: file.bibliographicRelations,
    sourceTextAsset: {
      path: file.localPath,
      format: file.format,
      sha256: file.localSha256,
      rightsStatus: "public_domain",
    },
  };
}

const attachedWorkIds = new Set(catalog.files.map((file) => file.workId));
const baseIds = new Set(base.works.map((work) => work.id));
for (const workId of attachedWorkIds) {
  if (!baseIds.has(workId)) throw new Error(`挂接作品不在既有登记册：${workId}`);
}
if (attachedWorkIds.size !== 1 || !attachedWorkIds.has("gbcr:work:dhammapada-pali")) {
  throw new Error(`英译法句经应只挂接巴利法句，实际 ${[...attachedWorkIds].join(",")}`);
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
    id: "wikisource_muller_dhp_1881",
    title: "Wikisource Max Müller Dhammapada 1881",
    traditions: ["上座部佛教"],
    languages: ["en"],
    primarySources: ["wikisource_muller_dhp_1881"],
    denominatorStatus: "translation_witness_attached_not_global_denominator",
    denominatorWorks: null,
    deduplicationNote: "公版英译挂接已持有巴利法句，不另建作品，也不进入全球佛说作品分母。",
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
    qualityBoundary: "423 偈与 26 品结构已验证；Wikisource 标记仍待迁移至扫描本，故扫描对勘和人工抽样均不得写成已完成。",
  },
];

const registry = {
  ...base,
  registry: { ...base.registry, version: "6.25.0", publishedAt: "2026-08-27" },
  sourceFamilies,
  claimPolicy: {
    ...base.claimPolicy,
    reason: "站内登记作品仍为 3,396 部；文本表达增至 4,188 个，其中新增 1 个是已持有巴利《法句》的 1881 年公有领域英语译本。3,377 部既有作品仍在双人复核队列，独立真人决定仍为 0。全球分母与百分比不得发布。",
  },
  wikisourceMullerDhpFullTextAudit: {
    status: "complete_public_domain_translation_witness_structure_verified_scan_collation_pending",
    sourceSnapshotId: "wikisource_muller_dhp_1881",
    controlledExpressions: catalog.files.length,
    newWorks: 0,
    attachedExistingWorks: attachedWorkIds.size,
    stableSegments: catalog.files.reduce((sum, file) => sum + file.verification.segments, 0),
    sourceBytes: catalog.files.reduce((sum, file) => sum + file.localBytes, 0),
    verseCount: catalog.files[0].verification.verseCount,
    chapterCount: catalog.files[0].verification.chapterCount,
    humanSampleVerified: false,
    scanCollated: false,
    catalogFile: catalogPath,
    catalogSha256: sha256(catalogBytes),
    manifestFile: manifestPath,
    manifestSha256: sha256(manifestBytes),
    ledgerFile: ledgerPath,
    ledgerSha256: sha256(ledgerBytes),
    caveat: "本审计只证明一份 1881 年公版英译的来源完整性、423 偈编号完整性与 26 品结构；不证明逐句扫描对勘、人工译文复核或全球佛典覆盖。",
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
  expressions: 4188,
  fullSourceExpressions: 4142,
  worksWithFullSource: 3369,
  stableSegments: 5945245,
};
if (JSON.stringify(totals) !== JSON.stringify(expected)) {
  throw new Error(`GBCR v6.25 统计不一致：${JSON.stringify(totals)} vs ${JSON.stringify(expected)}`);
}
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
  throw new Error("GBCR v6.25 错误地发布了未审定的全球分母或覆盖率");
}

const registryRaw = jsonRaw(registry);
const checksumRaw = [
  `${sha256(Buffer.from(registryRaw))}  registry-v6.25.0.json`,
  ...inputPaths.map((path, index) => `${sha256(inputBytes[index])}  ${path.split("/").at(-1)}`),
].join("\n") + "\n";
if (verifyMode) {
  // v6.25 是历史登记册；当前版本指针由后续发布维护。
  for (const [path, expectedRaw] of [[outputPath, registryRaw], [checksumPath, checksumRaw]]) {
    if (await readFile(resolve(root, path), "utf8") !== expectedRaw) throw new Error(`${path} 不可复现`);
  }
  console.log(`GBCR v6.25 可复现：${totals.works} 部作品、${totals.expressions} 个表达、${totals.fullSourceExpressions} 个完整来源表达；全球分母和百分比保持 null。`);
} else {
  await Promise.all([
    writeFile(resolve(root, outputPath), registryRaw),
    writeFile(resolve(root, checksumPath), checksumRaw),
  ]);
  console.log("GBCR v6.25 已生成：新增 1 个公版英语法句表达、0 部新作品；独立真人复核仍为 0。");
}

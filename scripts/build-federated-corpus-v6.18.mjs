import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const verifyMode = process.argv.includes("--verify");
const basePath = "data/gbcr/registry-v6.17.0.json";
const standardPath = "data/gbcr/global-denominator-standard-v0.1.0.json";
const sourceUniversePath = "data/gbcr/global-denominator-source-universe-v0.1.0.json";
const reviewQueuePath = "data/gbcr/global-denominator-review-queue-v0.1.0.json";
const reviewLedgerPath = "data/gbcr/global-denominator-review-ledger-v0.1.0.json";
const outputPath = "data/gbcr/registry-v6.18.0.json";
const checksumPath = "data/gbcr/checksums-v6.18.0.sha256";
const metadataPath = "src/lib/corpus-registry-metadata.ts";
const inputPaths = [basePath, standardPath, sourceUniversePath, reviewQueuePath, reviewLedgerPath];
const inputBytes = await Promise.all(inputPaths.map((path) => readFile(resolve(root, path))));
const [baseBytes, standardBytes, sourceUniverseBytes, reviewQueueBytes, reviewLedgerBytes] = inputBytes;
const [base, standard, sourceUniverse, reviewQueue, reviewLedger] = inputBytes.map((bytes) =>
  JSON.parse(bytes.toString("utf8")),
);
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const jsonRaw = (value) => `${JSON.stringify(value, null, 2)}\n`;

if (base.registry.version !== "6.17.0" || base.works.length !== 3377) throw new Error("GBCR v6.17 基线漂移");
if (standard.version !== "0.1.0" || standard.target.currentPublishable !== false) throw new Error("全球分母标准漂移");
if (sourceUniverse.version !== "0.1.0" || sourceUniverse.summary.frozenCandidateRecords !== 30797) {
  throw new Error("全球来源宇宙漂移");
}
if (reviewQueue.version !== "0.1.0" || reviewQueue.summary.queueItems !== 3377) throw new Error("全球分母复核队列漂移");
if (reviewLedger.version !== "0.1.0" || reviewLedger.summary.decisions !== 0) throw new Error("全球分母复核账本漂移");
if (standard.inputs.registry.sha256 !== sha256(baseBytes)) throw new Error("全球分母标准引用的登记册指纹漂移");
if (reviewLedger.inputs.reviewQueue.sha256 !== sha256(reviewQueueBytes)) throw new Error("复核账本引用的队列指纹漂移");

const governanceDimension = {
  id: "global_denominator_governance",
  label: "全球分母治理",
  definition: "来源宇宙、范围、作品身份、未决项、独立复核与分维度保守覆盖下界均进入版本化门禁。",
};
if (base.dimensions.some((dimension) => dimension.id === governanceDimension.id)) {
  throw new Error("v6.17 已存在全球分母治理维度");
}

const registry = {
  ...base,
  registry: { ...base.registry, version: "6.18.0", publishedAt: "2026-08-16" },
  dimensions: [...base.dimensions, governanceDimension],
  globalDenominators: {
    ...base.globalDenominators,
    status: "source_universe_and_all_registered_works_queued_for_independent_review_global_denominator_not_frozen",
  },
  claimPolicy: {
    ...base.claimPolicy,
    reason: "30,797 条冻结候选来源记录与 7 类外部缺口已进入来源宇宙账本，3,377 部站内作品已全部进入双人复核队列；但独立真人决定仍为 0，全球分母与百分比不得发布。",
    reviewGate: "只有 G0–G6 全部通过，且某一单独覆盖维度按未决项最保守计入分母后的下界不低于 99%，才可发布该维度声明；禁止发布加权总体 99%。",
  },
  globalDenominatorGovernance: {
    status: standard.status,
    standardVersion: standard.version,
    frozenSources: sourceUniverse.summary.frozenSources,
    frozenCandidateRecords: sourceUniverse.summary.frozenCandidateRecords,
    externalGapsRegistered: sourceUniverse.summary.externalGapsRegistered,
    sourceUniverseReady: sourceUniverse.summary.sourceUniverseReady,
    registeredWorksQueued: reviewQueue.summary.queueItems,
    priorityCounts: reviewQueue.summary.priorityCounts,
    minimumIndependentReviewsPerLane: reviewQueue.summary.minimumIndependentReviewsPerLane,
    independentHumanDecisions: reviewLedger.summary.decisions,
    independentlyApprovedWorks: reviewLedger.summary.independentlyApprovedWorks,
    adjudicatedItems: reviewQueue.summary.adjudicatedItems,
    automaticDenominatorChanges: reviewQueue.summary.automaticDenominatorChanges,
    conservativeUnresolvedTreatment: standard.conservativeFormula.unresolvedTreatment,
    publicationGates: standard.publicationGates,
    globalDenominator: standard.governance.globalDenominator,
    globalPercentage: standard.governance.globalPercentage,
    standardFile: standardPath,
    standardSha256: sha256(standardBytes),
    sourceUniverseFile: sourceUniversePath,
    sourceUniverseSha256: sha256(sourceUniverseBytes),
    reviewQueueFile: reviewQueuePath,
    reviewQueueSha256: sha256(reviewQueueBytes),
    reviewLedgerFile: reviewLedgerPath,
    reviewLedgerSha256: sha256(reviewLedgerBytes),
    caveat: "30,797 是七个冻结来源中计量单位不同且互相重叠的候选记录总量，不是作品数。3,377 项队列是站内作品的治理工作量，也不是全球分母。",
  },
};

const expressions = registry.works.flatMap((work) => work.expressions);
const totals = {
  works: registry.works.length,
  expressions: expressions.length,
  fullSourceExpressions: expressions.filter((expression) => expression.fullSourceText).length,
  worksWithFullSource: registry.works.filter((work) => work.expressions.some((expression) => expression.fullSourceText)).length,
  stableSegments: expressions.reduce((sum, expression) => sum + (expression.stableSegments ?? 0), 0),
};
const expected = { works: 3377, expressions: 3875, fullSourceExpressions: 3829, worksWithFullSource: 3350, stableSegments: 5656889 };
if (JSON.stringify(totals) !== JSON.stringify(expected)) throw new Error(`GBCR v6.18 统计不一致：${JSON.stringify(totals)}`);
if (
  registry.claimPolicy.publishable !== false ||
  registry.globalDenominatorGovernance.globalDenominator !== null ||
  registry.globalDenominatorGovernance.globalPercentage !== null ||
  registry.globalDenominatorGovernance.sourceUniverseReady !== false ||
  registry.globalDenominatorGovernance.independentHumanDecisions !== 0 ||
  registry.globalDenominatorGovernance.automaticDenominatorChanges !== 0 ||
  Object.entries(registry.globalDenominators)
    .filter(([key]) => key !== "status" && key !== "unknownMeans")
    .some(([, value]) => value !== null)
) {
  throw new Error("GBCR v6.18 错误地发布了未审定的全球分母或覆盖率");
}

const registryRaw = jsonRaw(registry);
const checksumRaw = [
  `${sha256(Buffer.from(registryRaw))}  registry-v6.18.0.json`,
  ...inputPaths.map((path, index) => `${sha256(inputBytes[index])}  ${path.split("/").at(-1)}`),
].join("\n") + "\n";
const metadataRaw = `// Generated by scripts/build-federated-corpus-v6.18.mjs. Do not edit manually.\nexport const CORPUS_REGISTRY_VERSION = "6.18.0" as const;\n`;

if (verifyMode) {
  // v6.18 is now a historical release. Reproduce and verify its immutable
  // registry and checksums without requiring the mutable current-version
  // pointer to move backwards from v6.19.
  for (const [path, expectedRaw] of [[outputPath, registryRaw], [checksumPath, checksumRaw]]) {
    if (await readFile(resolve(root, path), "utf8") !== expectedRaw) throw new Error(`${path} 不可复现`);
  }
  console.log("GBCR v6.18 可复现：全球来源宇宙与 3,377 项双人复核队列已登记；全球分母和百分比保持 null。");
} else {
  await Promise.all([
    writeFile(resolve(root, outputPath), registryRaw),
    writeFile(resolve(root, checksumPath), checksumRaw),
    writeFile(resolve(root, metadataPath), metadataRaw),
  ]);
  console.log("GBCR v6.18 已生成：30,797 条来源候选、7 类外部缺口、3,377 项作品复核任务进入可验证治理层。");
}

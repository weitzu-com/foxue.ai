import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const verifyMode = process.argv.includes("--verify");
const basePath = "data/gbcr/registry-v6.21.0.json";
const catalogPath = "data/corpus/wikisource/kokuyaku-dhp-catalog-v1.0.0.json";
const manifestPath = "data/corpus/wikisource/kokuyaku-dhp-manifest-v1.0.0.json";
const ledgerPath = "data/gbcr/wikisource-kokuyaku-dhp-ingest-v1.0.0.json";
const outputPath = "data/gbcr/registry-v6.22.0.json";
const checksumPath = "data/gbcr/checksums-v6.22.0.sha256";
const metadataPath = "src/lib/corpus-registry-metadata.ts";
const inputPaths = [basePath, catalogPath, manifestPath, ledgerPath];
const inputBytes = await Promise.all(inputPaths.map((path) => readFile(resolve(root, path))));
const [, catalogBytes, manifestBytes, ledgerBytes] = inputBytes;
const [base, catalog, manifest, ledger] = inputBytes.map((bytes) => JSON.parse(bytes.toString("utf8")));
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const jsonRaw = (value) => `${JSON.stringify(value, null, 2)}\n`;

if (base.registry.version !== "6.21.0" || base.works.length !== 3396) throw new Error("GBCR v6.21 基线漂移");
if (catalog.version !== "1.0.0" || catalog.files.length !== 1) throw new Error("國譯法句經目錄漂移");
if (manifest.version !== "1.0.0" || manifest.files.length !== 1) throw new Error("國譯法句經清單漂移");
if (ledger.ingest.newWorks !== 0 || ledger.ingest.newExpressions !== 1) throw new Error("國譯法句經總帳計數漂移");
if (base.globalDenominatorGovernance.independentHumanDecisions !== 0) throw new Error("不得伪造独立真人复核");

function expressionFromFile(file) {
  return {
    id: `gbcr:expression:${file.id}-ja`,
    language: "ja",
    title: file.presentation.title,
    translator: file.presentation.translator,
    sourceSnapshotId: "wikisource_kokuyaku_dhp_1918",
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
      rightsStatus: "public_domain",
    },
  };
}

const attachedWorkIds = new Set(catalog.files.map((file) => file.workId));
const baseIds = new Set(base.works.map((work) => work.id));
for (const workId of attachedWorkIds) {
  if (!baseIds.has(workId)) throw new Error(`掛接作品不在既有登記冊：${workId}`);
}
if (attachedWorkIds.size !== 1 || !attachedWorkIds.has("gbcr:work:dhammapada-pali")) {
  throw new Error(`國譯法句經應只掛接巴利法句，實際 ${[...attachedWorkIds].join(",")}`);
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
    id: "wikisource_kokuyaku_dhp_1918",
    title: "Wikisource 国译法句经 1918",
    traditions: ["上座部佛教"],
    languages: ["ja"],
    primarySources: ["wikisource_kokuyaku_dhp_1918"],
    denominatorStatus: "translation_witness_attached_not_global_denominator",
    denominatorWorks: null,
    deduplicationNote: "文语国译挂接已持有巴利法句，不另建作品，也不进入全球佛说作品分母。",
    wikisourceKokuyakuControlledExpressions: catalog.files.length,
    wikisourceKokuyakuAttachedExistingWorks: attachedWorkIds.size,
    wikisourceKokuyakuNewWorks: 0,
    wikisourceKokuyakuControlledSourceBytes: catalog.files.reduce((sum, file) => sum + file.localBytes, 0),
    wikisourceKokuyakuControlledStableSegments: catalog.files.reduce((sum, file) => sum + file.verification.segments, 0),
    wikisourceKokuyakuCatalogFile: catalogPath,
    wikisourceKokuyakuCatalogSha256: sha256(catalogBytes),
    wikisourceKokuyakuManifestFile: manifestPath,
    wikisourceKokuyakuManifestSha256: sha256(manifestBytes),
    wikisourceKokuyakuLedgerFile: ledgerPath,
    wikisourceKokuyakuLedgerSha256: sha256(ledgerBytes),
    wikisourceKokuyakuNote: "只收立花俊道 1918 年國譯法句經；同一 Index 的長老偈、長老尼偈、彌蘭陀王問經與韓文維基志願奉獻本切入不收。",
  },
];

const registry = {
  ...base,
  registry: { ...base.registry, version: "6.22.0", publishedAt: "2026-08-24" },
  sourceFamilies,
  claimPolicy: {
    ...base.claimPolicy,
    reason: "站内登记作品仍为 3,396 部；文本表达增至 3,928 个，其中 1 个是已持有巴利法句的 1918 年公有领域国译。3,377 部既有作品仍在双人复核队列，独立真人决定仍为 0。全球分母与百分比不得发布。",
  },
  wikisourceKokuyakuDhpFullTextAudit: {
    status: "complete_public_domain_translation_witness_with_global_denominator_unknown",
    sourceSnapshotId: "wikisource_kokuyaku_dhp_1918",
    controlledExpressions: catalog.files.length,
    newWorks: 0,
    attachedExistingWorks: attachedWorkIds.size,
    stableSegments: catalog.files.reduce((sum, file) => sum + file.verification.segments, 0),
    sourceBytes: catalog.files.reduce((sum, file) => sum + file.localBytes, 0),
    catalogFile: catalogPath,
    catalogSha256: sha256(catalogBytes),
    manifestFile: manifestPath,
    manifestSha256: sha256(manifestBytes),
    ledgerFile: ledgerPath,
    ledgerSha256: sha256(ledgerBytes),
    caveat: "本审计证明 1 份 1918 年公有领域国译的来源完整性与结构完整性；不把日译、未收入的韩文或国译其余篇目计成全球佛陀亲说覆盖率。",
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
  expressions: 3928,
  fullSourceExpressions: 3882,
  worksWithFullSource: 3369,
  stableSegments: 5818378 + catalog.files.reduce((sum, file) => sum + file.verification.segments, 0),
};
if (JSON.stringify(totals) !== JSON.stringify(expected)) throw new Error(`GBCR v6.22 统计不一致：${JSON.stringify(totals)} vs ${JSON.stringify(expected)}`);
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
  throw new Error("GBCR v6.22 错误地发布了未审定的全球分母或覆盖率");
}

const registryRaw = jsonRaw(registry);
const checksumRaw = [
  `${sha256(Buffer.from(registryRaw))}  registry-v6.22.0.json`,
  ...inputPaths.map((path, index) => `${sha256(inputBytes[index])}  ${path.split("/").at(-1)}`),
].join("\n") + "\n";
const metadataRaw = `// Generated by scripts/build-federated-corpus-v6.22.mjs. Do not edit manually.\nexport const CORPUS_REGISTRY_VERSION = "6.22.0" as const;\n`;

if (verifyMode) {
  for (const [path, expectedRaw] of [[outputPath, registryRaw], [checksumPath, checksumRaw], [metadataPath, metadataRaw]]) {
    if (await readFile(resolve(root, path), "utf8") !== expectedRaw) throw new Error(`${path} 不可复现`);
  }
  console.log(`GBCR v6.22 可复现：${totals.works} 部作品、${totals.expressions} 个表达、${totals.fullSourceExpressions} 个完整来源表达；全球分母和百分比保持 null。`);
} else {
  await Promise.all([
    writeFile(resolve(root, outputPath), registryRaw),
    writeFile(resolve(root, checksumPath), checksumRaw),
    writeFile(resolve(root, metadataPath), metadataRaw),
  ]);
  console.log(`GBCR v6.22 已生成：新增 1 个国译法句表达、0 部新作品；独立真人复核仍为 0。`);
}

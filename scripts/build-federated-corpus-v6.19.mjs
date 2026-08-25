import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const verifyMode = process.argv.includes("--verify");
const basePath = "data/gbcr/registry-v6.18.0.json";
const catalogPath = "data/corpus/cbeta/nanchuan-catalog-v1.0.0.json";
const manifestPath = "data/corpus/cbeta/nanchuan-manifest-v1.0.0.json";
const inventoryPath = "data/gbcr/cbeta-nanchuan-inventory-v0.1.0.json";
const auditPath = "data/gbcr/buddha-word-scope-audit-v1.3.0.json";
const sourceSnapshotsPath = "data/gbcr/source-snapshots-v4.6.0.json";
const outputPath = "data/gbcr/registry-v6.19.0.json";
const checksumPath = "data/gbcr/checksums-v6.19.0.sha256";
const metadataPath = "src/lib/corpus-registry-metadata.ts";
const inputPaths = [basePath, catalogPath, manifestPath, inventoryPath, auditPath, sourceSnapshotsPath];
const inputBytes = await Promise.all(inputPaths.map((path) => readFile(resolve(root, path))));
const [, catalogBytes, manifestBytes, inventoryBytes, auditBytes] = inputBytes;
const [base, catalog, manifest, inventory, audit, sourceSnapshots] = inputBytes.map((bytes) =>
  JSON.parse(bytes.toString("utf8")),
);
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const jsonRaw = (value) => `${JSON.stringify(value, null, 2)}\n`;

if (base.registry.version !== "6.18.0" || base.works.length !== 3377) throw new Error("GBCR v6.18 基线漂移");
if (catalog.version !== "1.0.0" || catalog.files.length !== 45) throw new Error("南傳經藏目錄漂移");
if (manifest.version !== "1.0.0" || manifest.files.length !== 45) throw new Error("南傳經藏清單漂移");
if (inventory.version !== "0.1.0" || inventory.totals.records !== 83) throw new Error("南傳來源清單漂移");
if (audit.version !== "1.3.0" || audit.summary.registeredWorksAudited !== 3394) throw new Error("佛陀教说范围审计 v1.3 漂移");
if (sourceSnapshots.version !== "4.6.0") throw new Error("来源快照必须为 v4.6.0");
if (audit.inputs.nanchuanCatalog.sha256 !== sha256(catalogBytes)) throw new Error("范围审计引用的南傳目錄指紋漂移");
if (audit.summary.independentExpertApprovedWorks !== 0) throw new Error("范围审计不得伪造独立专家批准");

const grouped = new Map();
for (const file of catalog.files) {
  const files = grouped.get(file.workId) ?? [];
  files.push(file);
  grouped.set(file.workId, files);
}
const baseIds = new Set(base.works.map((work) => work.id));
for (const workId of grouped.keys()) if (baseIds.has(workId)) throw new Error(`南傳作品标识与既有登记册冲突：${workId}`);
if (grouped.size !== 17) throw new Error(`南傳作品分组应为 17，实际 ${grouped.size}`);

function workTypeFor(nanchuanNumber) {
  const number = Number(nanchuanNumber.replace(/^N/i, ""));
  if (number >= 4 && number <= 7) return "distinct_recension";
  if (number >= 8 && number <= 12) return "canonical_text";
  if ([13, 14, 15, 16, 17, 18, 20, 21].includes(number)) return "canonical_sutta_collection";
  throw new Error(`未覆盖的南傳經號：${nanchuanNumber}`);
}

const nanchuanWorks = [...grouped.entries()].map(([workId, files]) => {
  const first = files[0];
  const nanchuanNumber = first.authorityIds.nanchuanNumber;
  const tradition = first.presentation.tradition.split(" · ")[0];
  return {
    id: workId,
    workType: workTypeFor(nanchuanNumber),
    canonicalStatus: first.canonicalStatus,
    buddhaWordStatus: first.buddhaWordStatus,
    canonicalTitle: first.workTitle,
    canonicalTitleZh: first.workTitle,
    traditions: [tradition],
    externalIds: {
      cbeta: [...new Set([...files.map((file) => file.id), nanchuanNumber])],
    },
    sourceRoles: [...new Set(files.map((file) => file.sourceRole))],
    bibliographicRelations: files.flatMap((file) => file.bibliographicRelations ?? [])
      .filter((relation, index, all) => all.findIndex((candidate) => candidate.groupId === relation.groupId) === index),
    relationDecision: "元亨寺汉译按南传经号建立独立作品；同一经号的分册是同一作品的多个表达。与 SuttaCentral 巴利根本文本只保留文本家族关系，不因部类名称合并 Work。",
    attributionDecision: "汉译责任见于 CBETA TEI 题记；译文不是巴利原文，也不等于佛陀逐字亲说。",
    expressions: files.map((file) => ({
      id: `gbcr:expression:${file.id}-zh-Hant`,
      language: "lzh-Hant",
      title: file.presentation.title,
      translator: file.presentation.translator,
      sourceSnapshotId: "cbeta_xml_p5",
      localSlug: file.slug,
      cataloged: true,
      fullSourceText: file.completeness !== "complete_source_file_partial_work_witness",
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
        rightsStatus: "restricted_noncommercial",
      },
    })),
  };
});

const sourceFamilies = base.sourceFamilies.map((family) => family.id !== "cbeta_chinese" ? family : {
  ...family,
  candidateSubsetIds: [...family.candidateSubsetIds, "yuanheng_nanchuan_tipitaka"],
  nanchuanSourceRecordDenominator: inventory.totals.records,
  nanchuanControlledSourceRecords: catalog.files.length,
  nanchuanControlledWorks: nanchuanWorks.length,
  nanchuanControlledExpressions: catalog.files.length,
  nanchuanControlledSourceBytes: catalog.files.reduce((sum, file) => sum + file.upstreamBytes, 0),
  nanchuanControlledStableSegments: catalog.files.reduce((sum, file) => sum + file.verification.segments, 0),
  nanchuanInventoryFile: inventoryPath,
  nanchuanInventorySha256: sha256(inventoryBytes),
  nanchuanCatalogFile: catalogPath,
  nanchuanCatalogSha256: sha256(catalogBytes),
  nanchuanManifestFile: manifestPath,
  nanchuanManifestSha256: sha256(manifestBytes),
  nanchuanNote: "45/83 只表示元亨寺汉译南传大藏经中经藏（含混合小部）固定 TEI 已受控；律、论、义释、史传保持排除。文件数不是作品数，也不是全球佛说经分母。",
});

const registry = {
  ...base,
  registry: { ...base.registry, version: "6.19.0", publishedAt: "2026-08-22" },
  sourceFamilies,
  claimPolicy: {
    ...base.claimPolicy,
    reason: "站内登记作品现为 3,394 部、3,920 个文本表达；其中 17 部元亨寺汉译南传经藏为新增本地持有。3,377 部既有作品仍在双人复核队列，独立真人决定仍为 0。全球分母与百分比不得发布。",
  },
  buddhaWordScopeAudit: {
    status: audit.status,
    registeredWorksAudited: audit.summary.registeredWorksAudited,
    registeredWorksUnclassified: audit.summary.registeredWorksUnclassified,
    ruleClassifiedWorks: audit.summary.ruleClassifiedWorks,
    independentExpertApprovedWorks: audit.summary.independentExpertApprovedWorks,
    strictSutraCandidateWorks: audit.summary.strictSutraCandidateWorks,
    strictSutraCandidateWorksWithFullSource: audit.summary.strictSutraCandidateWorksWithFullSource,
    categoryCounts: audit.summary.categoryCounts,
    strictScopeDecisionCounts: audit.summary.strictScopeDecisionCounts,
    globalDenominatorImpact: audit.summary.globalDenominatorImpact,
    traditionalCanonMembershipIsNotVerbatimAuthorship: audit.policy.traditionalCanonMembershipIsNotVerbatimAuthorship,
    globalPercentagePublishable: audit.policy.globalPercentagePublishable,
    auditFile: auditPath,
    auditSha256: sha256(auditBytes),
    caveat: "1,302 是当前 3,394 部站内登记作品经保守规则得到的严格经藏候选数，不是全球佛经分母，也不是独立专家批准数。另有 1,110 部密续、陀罗尼或混合集等待范围政策，212 部跨部类、古逸或疑似文本等待逐项复核。《大雲無想經卷第九》仍只保存第 9 卷见证。",
  },
  nanchuanSuttaPitakaFullTextAudit: {
    status: "complete_fixed_digital_witness_with_global_denominator_unknown",
    sourceSnapshotId: "cbeta_xml_p5",
    sourceSubsetId: "yuanheng_nanchuan_tipitaka",
    sourceRecordDenominator: 83,
    excludedVinayaAbhidhammaCommentaryHistoryRecords: 38,
    controlledExpressions: 45,
    controlledWorks: 17,
    strictSutraWorks: 9,
    mixedKhuddakaWorks: 8,
    stableSegments: catalog.files.reduce((sum, file) => sum + file.verification.segments, 0),
    sourceBytes: catalog.files.reduce((sum, file) => sum + file.upstreamBytes, 0),
    inventoryFile: inventoryPath,
    inventorySha256: sha256(inventoryBytes),
    catalogFile: catalogPath,
    catalogSha256: sha256(catalogBytes),
    manifestFile: manifestPath,
    manifestSha256: sha256(manifestBytes),
    caveat: "本审计证明元亨寺汉译南传经藏 45 份固定 TEI 的来源完整性、权利头部和结构完整性；不把汉译与巴利根本文本合并，也不证明全球佛陀亲说覆盖率。",
  },
  works: [...base.works, ...nanchuanWorks],
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
  works: 3394,
  expressions: 3920,
  fullSourceExpressions: 3874,
  worksWithFullSource: 3367,
  stableSegments: 5814932,
};
if (JSON.stringify(totals) !== JSON.stringify(expected)) throw new Error(`GBCR v6.19 统计不一致：${JSON.stringify(totals)}`);
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
  throw new Error("GBCR v6.19 错误地发布了未审定的全球分母或覆盖率");
}

const registryRaw = jsonRaw(registry);
const checksumRaw = [
  `${sha256(Buffer.from(registryRaw))}  registry-v6.19.0.json`,
  ...inputPaths.map((path, index) => `${sha256(inputBytes[index])}  ${path.split("/").at(-1)}`),
].join("\n") + "\n";
const metadataRaw = `// Generated by scripts/build-federated-corpus-v6.19.mjs. Do not edit manually.\nexport const CORPUS_REGISTRY_VERSION = "6.19.0" as const;\n`;

if (verifyMode) {
  // v6.19 is now a historical release. Reproduce and verify its immutable
  // registry and checksums without requiring the mutable current-version
  // pointer to move backwards from v6.20.
  for (const [path, expectedRaw] of [[outputPath, registryRaw], [checksumPath, checksumRaw]]) {
    if (await readFile(resolve(root, path), "utf8") !== expectedRaw) throw new Error(`${path} 不可复现`);
  }
  console.log(`GBCR v6.19 可复现：${totals.works} 部作品、${totals.expressions} 个表达、${totals.fullSourceExpressions} 个完整来源表达；全球分母和百分比保持 null。`);
} else {
  await Promise.all([
    writeFile(resolve(root, outputPath), registryRaw),
    writeFile(resolve(root, checksumPath), checksumRaw),
    writeFile(resolve(root, metadataPath), metadataRaw),
  ]);
  console.log(`GBCR v6.19 已生成：新增 17 部元亨寺汉译南传经藏作品、45 个完整来源表达；独立真人复核仍为 0。`);
}

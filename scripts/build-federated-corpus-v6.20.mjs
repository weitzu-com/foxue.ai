import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const verifyMode = process.argv.includes("--verify");
const basePath = "data/gbcr/registry-v6.19.0.json";
const catalogPath = "data/corpus/cbeta/beyond-taisho-sutra-catalog-v1.0.0.json";
const manifestPath = "data/corpus/cbeta/beyond-taisho-sutra-manifest-v1.0.0.json";
const xInventoryPath = "data/gbcr/cbeta-xuzangjing-inventory-v0.1.0.json";
const aInventoryPath = "data/gbcr/cbeta-zhaochen-inventory-v0.1.0.json";
const fInventoryPath = "data/gbcr/cbeta-fangshan-inventory-v0.1.0.json";
const filterPath = "data/gbcr/cbeta-beyond-taisho-sutra-filter-v1.0.0.json";
const auditPath = "data/gbcr/buddha-word-scope-audit-v1.4.0.json";
const sourceSnapshotsPath = "data/gbcr/source-snapshots-v4.7.0.json";
const outputPath = "data/gbcr/registry-v6.20.0.json";
const checksumPath = "data/gbcr/checksums-v6.20.0.sha256";
const metadataPath = "src/lib/corpus-registry-metadata.ts";
const inputPaths = [
  basePath, catalogPath, manifestPath, xInventoryPath, aInventoryPath, fInventoryPath,
  filterPath, auditPath, sourceSnapshotsPath,
];
const inputBytes = await Promise.all(inputPaths.map((path) => readFile(resolve(root, path))));
const [, catalogBytes, manifestBytes, xInventoryBytes, aInventoryBytes, fInventoryBytes, filterBytes, auditBytes] = inputBytes;
const [base, catalog, manifest, xInventory, aInventory, fInventory, filterAudit, audit, sourceSnapshots] = inputBytes.map((bytes) =>
  JSON.parse(bytes.toString("utf8")),
);
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const jsonRaw = (value) => `${JSON.stringify(value, null, 2)}\n`;

if (base.registry.version !== "6.19.0" || base.works.length !== 3394) throw new Error("GBCR v6.19 基线漂移");
if (catalog.version !== "1.0.0" || catalog.files.length !== 3) throw new Error("大正藏以外佛說經目錄漂移");
if (manifest.version !== "1.0.0" || manifest.files.length !== 3) throw new Error("大正藏以外佛說經清單漂移");
if (xInventory.totals.records !== 1236 || aInventory.totals.records !== 12 || fInventory.totals.records !== 27) {
  throw new Error("X/A/F 來源清單漂移");
}
if (filterAudit.totals.included !== 3 || filterAudit.totals.sourceRecordsAudited !== 1275) {
  throw new Error("大正藏以外佛說經過濾審計漂移");
}
if (audit.version !== "1.4.0" || audit.summary.registeredWorksAudited !== 3396) throw new Error("佛陀教说范围审计 v1.4 漂移");
if (sourceSnapshots.version !== "4.7.0") throw new Error("来源快照必须为 v4.7.0");
if (audit.inputs.beyondTaishoSutraCatalog.sha256 !== sha256(catalogBytes)) throw new Error("范围审计引用的過濾目錄指紋漂移");
if (audit.summary.independentExpertApprovedWorks !== 0) throw new Error("范围审计不得伪造独立专家批准");

function expressionFromFile(file) {
  return {
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
  };
}

const grouped = new Map();
for (const file of catalog.files) {
  const files = grouped.get(file.workId) ?? [];
  files.push(file);
  grouped.set(file.workId, files);
}
const baseIds = new Set(base.works.map((work) => work.id));
const attachedWorkIds = new Set(catalog.files.filter((file) => file.attachToExistingWork).map((file) => file.workId));
const newWorkIds = new Set(catalog.files.filter((file) => !file.attachToExistingWork).map((file) => file.workId));
for (const workId of attachedWorkIds) {
  if (!baseIds.has(workId)) throw new Error(`掛接作品不在既有登記冊：${workId}`);
}
for (const workId of newWorkIds) {
  if (baseIds.has(workId)) throw new Error(`新作品標識與既有登記冊衝突：${workId}`);
}
if (attachedWorkIds.size !== 1 || newWorkIds.size !== 2) {
  throw new Error(`作品掛接／新增計數漂移：attached ${attachedWorkIds.size} new ${newWorkIds.size}`);
}

const patchedWorks = base.works.map((work) => {
  if (!attachedWorkIds.has(work.id)) return work;
  const files = grouped.get(work.id);
  const extraIds = files.map((file) => file.id);
  const relations = [
    ...work.bibliographicRelations,
    ...files.flatMap((file) => file.bibliographicRelations ?? []),
  ].filter((relation, index, all) => all.findIndex((candidate) => candidate.groupId === relation.groupId) === index)
    .map((relation) => relation.groupId !== "sanghata-sutra-chinese" ? relation : {
      ...relation,
      evidence: files[0].bibliographicRelations[0].evidence,
      externalIds: files[0].bibliographicRelations[0].externalIds,
    });
  return {
    ...work,
    externalIds: {
      ...work.externalIds,
      cbeta: [...new Set([...(work.externalIds.cbeta ?? []), ...extraIds])],
    },
    sourceRoles: [...new Set([...(work.sourceRoles ?? []), ...files.map((file) => file.sourceRole)])],
    bibliographicRelations: relations,
    expressions: [...work.expressions, ...files.map(expressionFromFile)],
  };
});

const newWorks = [...newWorkIds].map((workId) => {
  const files = grouped.get(workId);
  const first = files[0];
  const tradition = first.presentation.tradition.split(" · ")[0];
  return {
    id: workId,
    workType: "canonical_text",
    canonicalStatus: first.canonicalStatus,
    buddhaWordStatus: first.buddhaWordStatus,
    canonicalTitle: first.workTitle,
    canonicalTitleZh: first.workTitle,
    traditions: [tradition],
    externalIds: {
      cbeta: files.map((file) => file.id),
    },
    sourceRoles: [...new Set(files.map((file) => file.sourceRole))],
    bibliographicRelations: files.flatMap((file) => file.bibliographicRelations ?? [])
      .filter((relation, index, all) => all.findIndex((candidate) => candidate.groupId === relation.groupId) === index),
    relationDecision: "房山石刻漢譯按固定經號建立獨立作品；與大正藏題名相近的本起經或恒水經只保留文本家族關係，不自動合併 Work。",
    attributionDecision: "漢譯責任見於 CBETA TEI 題記；石刻本不是大正藏經號，也不等於佛陀逐字親說。",
    expressions: files.map(expressionFromFile),
  };
});

const sourceFamilies = base.sourceFamilies.map((family) => family.id !== "cbeta_chinese" ? family : {
  ...family,
  candidateSubsetIds: [...family.candidateSubsetIds, "zhaochen_jinzang", "fangshan_shijing"],
  beyondTaishoSutraSourceRecordDenominator: xInventory.totals.records + aInventory.totals.records + fInventory.totals.records,
  beyondTaishoSutraControlledSourceRecords: catalog.files.length,
  beyondTaishoSutraNewWorks: newWorks.length,
  beyondTaishoSutraAttachedExistingWorks: attachedWorkIds.size,
  beyondTaishoSutraControlledExpressions: catalog.files.length,
  beyondTaishoSutraControlledSourceBytes: catalog.files.reduce((sum, file) => sum + file.upstreamBytes, 0),
  beyondTaishoSutraControlledStableSegments: catalog.files.reduce((sum, file) => sum + file.verification.segments, 0),
  xuzangjingInventoryFile: xInventoryPath,
  xuzangjingInventorySha256: sha256(xInventoryBytes),
  zhaochenInventoryFile: aInventoryPath,
  zhaochenInventorySha256: sha256(aInventoryBytes),
  fangshanInventoryFile: fInventoryPath,
  fangshanInventorySha256: sha256(fInventoryBytes),
  beyondTaishoSutraFilterFile: filterPath,
  beyondTaishoSutraFilterSha256: sha256(filterBytes),
  beyondTaishoSutraCatalogFile: catalogPath,
  beyondTaishoSutraCatalogSha256: sha256(catalogBytes),
  beyondTaishoSutraManifestFile: manifestPath,
  beyondTaishoSutraManifestSha256: sha256(manifestBytes),
  beyondTaishoSutraNote: "3/1,275 只表示從卍續藏、趙城金藏與房山石經固定 TEI 中過濾出的大正藏未持有漢譯佛說經；1,272 份經疏、儀軌、律、疑偽經、會譯與道教題名保持排除。文件數不是作品數，也不是全球佛說經分母。",
});

const registry = {
  ...base,
  registry: { ...base.registry, version: "6.20.0", publishedAt: "2026-08-24" },
  sourceFamilies,
  claimPolicy: {
    ...base.claimPolicy,
    reason: "站内登记作品现为 3,396 部、3,923 个文本表达；其中 2 部房山汉译佛说经为新增作品，《僧伽吒经》新增赵城金藏表达。3,377 部既有作品仍在双人复核队列，独立真人决定仍为 0。全球分母与百分比不得发布。",
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
    caveat: "1,304 是当前 3,396 部站内登记作品经保守规则得到的严格经藏候选数，不是全球佛经分母，也不是独立专家批准数。另有 1,110 部密续、陀罗尼或混合集等待范围政策，212 部跨部类、古逸或疑似文本等待逐项复核。《大雲無想經卷第九》仍只保存第 9 卷见证。",
  },
  beyondTaishoSutraFullTextAudit: {
    status: "complete_fixed_digital_witness_with_global_denominator_unknown",
    sourceSnapshotId: "cbeta_xml_p5",
    sourceSubsetIds: ["manji_xuzangjing", "zhaochen_jinzang", "fangshan_shijing"],
    sourceRecordDenominator: 1275,
    excludedSourceRecords: 1272,
    controlledExpressions: 3,
    newWorks: 2,
    attachedExistingWorks: 1,
    strictSutraWorks: 3,
    stableSegments: catalog.files.reduce((sum, file) => sum + file.verification.segments, 0),
    sourceBytes: catalog.files.reduce((sum, file) => sum + file.upstreamBytes, 0),
    filterFile: filterPath,
    filterSha256: sha256(filterBytes),
    catalogFile: catalogPath,
    catalogSha256: sha256(catalogBytes),
    manifestFile: manifestPath,
    manifestSha256: sha256(manifestBytes),
    caveat: "本审计证明从 1,275 份固定 TEI 中过滤出的 3 份汉译佛说经来源完整性、权利头部和结构完整性；不把续藏文件数或赵城／房山补辑计成全球佛陀亲说覆盖率。",
  },
  works: [...patchedWorks, ...newWorks],
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
  expressions: 3923,
  fullSourceExpressions: 3877,
  worksWithFullSource: 3369,
  stableSegments: 5815910,
};
if (JSON.stringify(totals) !== JSON.stringify(expected)) throw new Error(`GBCR v6.20 统计不一致：${JSON.stringify(totals)}`);
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
  throw new Error("GBCR v6.20 错误地发布了未审定的全球分母或覆盖率");
}

const registryRaw = jsonRaw(registry);
const checksumRaw = [
  `${sha256(Buffer.from(registryRaw))}  registry-v6.20.0.json`,
  ...inputPaths.map((path, index) => `${sha256(inputBytes[index])}  ${path.split("/").at(-1)}`),
].join("\n") + "\n";
const metadataRaw = `// Generated by scripts/build-federated-corpus-v6.20.mjs. Do not edit manually.\nexport const CORPUS_REGISTRY_VERSION = "6.20.0" as const;\n`;

if (verifyMode) {
  for (const [path, expectedRaw] of [[outputPath, registryRaw], [checksumPath, checksumRaw], [metadataPath, metadataRaw]]) {
    if (await readFile(resolve(root, path), "utf8") !== expectedRaw) throw new Error(`${path} 不可复现`);
  }
  console.log(`GBCR v6.20 可复现：${totals.works} 部作品、${totals.expressions} 个表达、${totals.fullSourceExpressions} 个完整来源表达；全球分母和百分比保持 null。`);
} else {
  await Promise.all([
    writeFile(resolve(root, outputPath), registryRaw),
    writeFile(resolve(root, checksumPath), checksumRaw),
    writeFile(resolve(root, metadataPath), metadataRaw),
  ]);
  console.log(`GBCR v6.20 已生成：新增 2 部房山汉译佛说经作品、3 个完整来源表达；独立真人复核仍为 0。`);
}

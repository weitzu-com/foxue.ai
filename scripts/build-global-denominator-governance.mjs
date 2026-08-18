import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  arbitratorIsInstitutionallyIndependent,
  hasInstitutionallyIndependentDecisionPair,
} from "./global-review-consensus.mjs";

const root = process.cwd();
const verifyMode = process.argv.includes("--verify");
const registryPath = "data/gbcr/registry-v6.17.0.json";
const scopeAuditPath = "data/gbcr/buddha-word-scope-audit-v1.2.0.json";
const sourceSnapshotPath = "data/gbcr/source-snapshots-v4.5.0.json";
const standardPath = "data/gbcr/global-denominator-standard-v0.1.0.json";
const sourceUniversePath = "data/gbcr/global-denominator-source-universe-v0.1.0.json";
const reviewQueuePath = "data/gbcr/global-denominator-review-queue-v0.1.0.json";
const reviewLedgerPath = "data/gbcr/global-denominator-review-ledger-v0.1.0.json";

const [registryBytes, scopeAuditBytes, sourceSnapshotBytes] = await Promise.all(
  [registryPath, scopeAuditPath, sourceSnapshotPath].map((path) => readFile(resolve(root, path))),
);
const registry = JSON.parse(registryBytes.toString("utf8"));
const scopeAudit = JSON.parse(scopeAuditBytes.toString("utf8"));
const sourceSnapshots = JSON.parse(sourceSnapshotBytes.toString("utf8"));
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const jsonRaw = (value) => `${JSON.stringify(value, null, 2)}\n`;

if (registry.registry.version !== "6.17.0" || registry.works.length !== 3377) {
  throw new Error("GBCR v6.17 基线漂移");
}
if (scopeAudit.version !== "1.2.0" || scopeAudit.summary.registeredWorksAudited !== 3377) {
  throw new Error("佛陀教说范围审计基线漂移");
}
if (sourceSnapshots.version !== "4.5.0" || sourceSnapshots.sources.length !== 7) {
  throw new Error("来源宇宙快照基线漂移");
}

const inputFingerprints = {
  registry: { path: registryPath, sha256: sha256(registryBytes) },
  scopeAudit: { path: scopeAuditPath, sha256: sha256(scopeAuditBytes) },
  sourceSnapshots: { path: sourceSnapshotPath, sha256: sha256(sourceSnapshotBytes) },
};
const auditByWorkId = new Map(scopeAudit.works.map((work) => [work.workId, work]));
if (auditByWorkId.size !== registry.works.length) throw new Error("范围审计与登记作品不是一一对应");

const registeredWorkLinksBySource = new Map(sourceSnapshots.sources.map((source) => [source.id, 0]));
for (const work of scopeAudit.works) {
  for (const sourceId of work.sourceSnapshotIds) {
    if (!registeredWorkLinksBySource.has(sourceId)) {
      throw new Error(`${work.workId} 引用了来源宇宙外的快照 ${sourceId}`);
    }
    registeredWorkLinksBySource.set(sourceId, registeredWorkLinksBySource.get(sourceId) + 1);
  }
}

const frozenSources = sourceSnapshots.sources.map((source) => {
  const registeredWorkLinks = registeredWorkLinksBySource.get(source.id);
  return {
    sourceId: source.id,
    candidateRecordCount: source.candidateRecordCount,
    recordUnit: source.recordUnit,
    candidatePathSha256: source.candidatePathSha256 ?? source.recordSetSha256 ?? null,
    registeredWorkLinks,
    normalizationStatus: registeredWorkLinks > 0
      ? "partial_registered_work_normalization"
      : "snapshot_frozen_work_normalization_pending",
    minimumIndependentSourceReviews: 2,
    independentSourceReviewsCompleted: 0,
    denominatorEligible: false,
    caveat: source.denominatorCaveat,
  };
});
const frozenCandidateRecords = frozenSources.reduce((sum, source) => sum + source.candidateRecordCount, 0);
if (frozenCandidateRecords !== 30797) throw new Error(`来源候选记录总数漂移：${frozenCandidateRecords}`);

const externalGapRegister = [
  {
    gapId: "gandhari_manuscripts",
    labelZh: "犍陀罗语佛教写本与残片",
    evidenceUrl: "https://gandhari.org/corpus",
    observedAt: "2026-08-16",
    observedCandidateRecords: 388,
    observedRecordUnit: "manuscripts and manuscript fragments（并非去重作品）",
    requiredAction: "冻结逐项目录、文类、出版标识与作品连接；不得把残片数直接相加到作品分母。",
  },
  {
    gapId: "sat_taisho_independent_crosscheck",
    labelZh: "SAT 大正藏独立目录与页行交叉核验",
    evidenceUrl: "https://21dzk.l.u-tokyo.ac.jp/SAT/index_en.html",
    observedAt: "2026-08-16",
    observedCandidateRecords: null,
    observedRecordUnit: "Taishō 85 volumes（独立见证，不自动新增作品）",
    requiredAction: "建立 T 编号、卷页行和 CBETA 记录的独立抽样与差异账本。",
  },
  {
    gapId: "international_dunhuang_fragments",
    labelZh: "敦煌及中亚多语种佛教写本",
    evidenceUrl: "https://idp.bl.uk/",
    observedAt: "2026-08-16",
    observedCandidateRecords: null,
    observedRecordUnit: "manuscript and fragment catalog records",
    requiredAction: "冻结可核验目录范围，并区分既知作品见证、古逸文本、疑似经与非佛教资料。",
  },
  {
    gapId: "chinese_canon_witnesses_beyond_taisho",
    labelZh: "大正藏以外汉文藏经与目录见证",
    evidenceUrl: "https://cbeta.org/",
    observedAt: "2026-08-16",
    observedCandidateRecords: null,
    observedRecordUnit: "canonical catalog records and witnesses",
    requiredAction: "核对卍续藏、嘉兴藏、高丽藏等补充或异本记录，优先识别大正藏未收作品。",
  },
  {
    gapId: "regional_pali_recensions",
    labelZh: "斯里兰卡、缅甸、泰国等巴利藏经异本",
    evidenceUrl: "https://suttacentral.net/",
    observedAt: "2026-08-16",
    observedCandidateRecords: null,
    observedRecordUnit: "regional recension witnesses",
    requiredAction: "以作品身份和异本为单位核对，不把同一巴利作品的多国版本重复计数。",
  },
  {
    gapId: "tibetan_non_derge_identity_and_scope",
    labelZh: "非德格甘珠尔版本与藏外密续范围",
    evidenceUrl: "https://github.com/buda-base/rkts",
    observedAt: "2026-08-16",
    observedCandidateRecords: null,
    observedRecordUnit: "edition items, fragments and non-Kangyur scriptural candidates",
    requiredAction: "完成多版本作品身份交叉表，并由公开范围政策决定藏外密续是否进入严格经藏分母。",
  },
  {
    gapId: "indic_manuscript_catalogs_beyond_current_sources",
    labelZh: "现有 DSBC、GRETIL 与 SuttaCentral 之外的梵文及印度语写本目录",
    evidenceUrl: "https://www.bdrc.io/",
    observedAt: "2026-08-16",
    observedCandidateRecords: null,
    observedRecordUnit: "catalog records, manuscript witnesses and fragments",
    requiredAction: "登记机构目录边界、持久标识、文类、权利与已知平行本，再进入作品聚类。",
  },
];

const sourceUniverse = {
  schema: "https://foxue.ai/schemas/gbcr/global-denominator-source-universe-v0.1",
  version: "0.1.0",
  generatedAt: "2026-08-16",
  status: "frozen_sources_registered_external_gap_review_pending",
  inputs: inputFingerprints,
  summary: {
    frozenSources: frozenSources.length,
    frozenCandidateRecords,
    registeredWorks: registry.works.length,
    externalGapsRegistered: externalGapRegister.length,
    independentlyApprovedSources: 0,
    independentlyClosedGaps: 0,
    sourceUniverseReady: false,
  },
  countingDiscipline: {
    candidateRecordsAreNotWorks: true,
    physicalFragmentsAreNotWorks: true,
    editionsAndTranslationsAreExpressionsNotAutomaticallyWorks: true,
    unresolvedSourcesCannotBeSilentlyExcluded: true,
    sourceCountsMustNeverBeSummedAsGlobalWorkDenominator: true,
  },
  frozenSources,
  externalGapRegister,
};

const priorityFor = (scope) => {
  if (scope === "included_candidate_requires_identity_review") return "P0";
  if (scope === "scope_policy_and_item_review_required") return "P1";
  if (scope === "scope_policy_required") return "P2";
  if (scope === "included_candidate") return "P3";
  return "P4";
};
const reviewItems = registry.works.map((work) => {
  const audit = auditByWorkId.get(work.id);
  if (!audit) throw new Error(`${work.id} 缺少范围审计记录`);
  return {
    queueId: `gdrq:${work.id.slice("gbcr:work:".length)}`,
    workId: work.id,
    titleZh: audit.title,
    sourceSnapshotIds: audit.sourceSnapshotIds,
    externalIds: audit.externalIds,
    fullSourceText: audit.fullSourceText,
    machineCategory: audit.category,
    machineScopeDecision: audit.strictSutraScope,
    machineRuleId: audit.ruleId,
    priority: priorityFor(audit.strictSutraScope),
    requiredReviewLanes: ["scope", "identity_if_included", "source_and_range"],
    minimumIndependentReviewsPerLane: 2,
    denominatorTreatmentUntilResolved: "count_as_one_possible_work_without_increasing_any_coverage_numerator",
    status: "pending_independent_review",
  };
});
reviewItems.sort((a, b) => a.priority.localeCompare(b.priority) || a.workId.localeCompare(b.workId));
const priorityCounts = Object.fromEntries(
  ["P0", "P1", "P2", "P3", "P4"].map((priority) => [
    priority,
    reviewItems.filter((item) => item.priority === priority).length,
  ]),
);
const expectedPriorityCounts = { P0: 2, P1: 212, P2: 1102, P3: 1291, P4: 770 };
if (JSON.stringify(priorityCounts) !== JSON.stringify(expectedPriorityCounts)) {
  throw new Error(`全球分母复核优先级漂移：${JSON.stringify(priorityCounts)}`);
}

const reviewQueue = {
  schema: "https://foxue.ai/schemas/gbcr/global-denominator-review-queue-v0.1",
  version: "0.1.0",
  generatedAt: "2026-08-16",
  status: "all_registered_works_queued_no_independent_decisions",
  inputs: inputFingerprints,
  summary: {
    queueItems: reviewItems.length,
    priorityCounts,
    pendingItems: reviewItems.length,
    independentlyReviewedItems: 0,
    adjudicatedItems: 0,
    automaticDenominatorChanges: 0,
    minimumIndependentReviewsPerLane: 2,
  },
  priorityDefinitions: {
    P0: "机器标为经文候选，但作品身份仍未决；先处理以避免重复计数。",
    P1: "跨部类、古逸、残卷或疑似文本；必须逐项处理范围与身份。",
    P2: "密续、陀罗尼、仪轨或混合集；先通过范围政策，再逐项复核。",
    P3: "传统经藏候选；仍须双人独立确认范围和跨传统作品身份。",
    P4: "机器暂排除项；双人确认前仍按可能作品进入保守分母，不进入覆盖分子。",
  },
  items: reviewItems,
};

const allowedScopeDecisions = ["include_strict_sutra", "exclude_strict_sutra", "scope_uncertain"];
const allowedIdentityDecisions = ["same_work", "distinct_work", "text_family_only", "identity_uncertain", "not_applicable"];
const allowedSourceAndRangeDecisions = ["source_supported", "source_rejected", "source_uncertain"];
const emptyDurableReviewRecords = {
  reviewerDeclarations: [],
  decisions: [],
  arbitrations: [],
};
let durableReviewRecords = emptyDurableReviewRecords;
try {
  const storedLedger = JSON.parse(await readFile(resolve(root, reviewLedgerPath), "utf8"));
  if (
    storedLedger.schema !== "https://foxue.ai/schemas/gbcr/global-denominator-review-ledger-v0.1" ||
    storedLedger.version !== "0.1.0"
  ) {
    throw new Error("全球分母复核账本 schema 或版本不受当前构建器支持");
  }
  durableReviewRecords = {
    reviewerDeclarations: storedLedger.reviewerDeclarations,
    decisions: storedLedger.decisions,
    arbitrations: storedLedger.arbitrations,
  };
} catch (error) {
  if (!(error && typeof error === "object" && "code" in error && error.code === "ENOENT")) throw error;
  if (verifyMode) throw new Error(`${reviewLedgerPath} 缺失，无法验证持久复核记录`);
}

for (const [field, records] of Object.entries(durableReviewRecords)) {
  if (!Array.isArray(records)) throw new Error(`复核账本 ${field} 必须是数组`);
}

const requireString = (record, field, label) => {
  if (typeof record?.[field] !== "string" || record[field].trim() === "") {
    throw new Error(`${label} 缺少 ${field}`);
  }
  return record[field];
};
const requireIsoTimestamp = (record, field, label) => {
  const value = requireString(record, field, label);
  if (!Number.isFinite(Date.parse(value))) throw new Error(`${label} 的 ${field} 不是有效 ISO 时间`);
  return value;
};
const requireUniqueIds = (records, field, label) => {
  const ids = records.map((record) => requireString(record, field, label));
  if (new Set(ids).size !== ids.length) throw new Error(`${label} ${field} 不唯一`);
  return new Set(ids);
};
const requireEvidence = (record, label) => {
  if (
    !Array.isArray(record.evidenceUrls) ||
    record.evidenceUrls.length === 0 ||
    record.evidenceUrls.some((url) => typeof url !== "string" || !/^https:\/\//.test(url))
  ) {
    throw new Error(`${label} 必须至少包含一个 HTTPS 证据链接`);
  }
  requireString(record, "rationale", label);
  requireIsoTimestamp(record, "submittedAt", label);
};

const reviewerIds = requireUniqueIds(durableReviewRecords.reviewerDeclarations, "reviewerId", "复核者声明");
for (const declaration of durableReviewRecords.reviewerDeclarations) {
  if (declaration.naturalPerson !== true || declaration.aiSystem !== false) {
    throw new Error(`${declaration.reviewerId} 未作自然人且非 AI 系统的明确声明`);
  }
  if (!Array.isArray(declaration.competence) || declaration.competence.length === 0) {
    throw new Error(`${declaration.reviewerId} 缺少能力声明`);
  }
  if (declaration.competence.some((entry) => typeof entry !== "string" || !entry.trim())) {
    throw new Error(`${declaration.reviewerId} 的能力声明含空值`);
  }
  requireString(declaration, "institution", `${declaration.reviewerId} 复核者声明`);
  requireString(declaration, "conflictOfInterest", `${declaration.reviewerId} 复核者声明`);
  requireString(declaration, "signature", `${declaration.reviewerId} 复核者声明`);
  const sourceIssueUrl = requireString(declaration, "sourceIssueUrl", `${declaration.reviewerId} 复核者声明`);
  if (!/^https:\/\/github\.com\/weitzu-com\/foxue\.ai\/issues\/\d+$/.test(sourceIssueUrl)) {
    throw new Error(`${declaration.reviewerId} 的 sourceIssueUrl 不是本仓库复核 Issue`);
  }
  const verifiedBy = requireString(declaration, "verifiedBy", `${declaration.reviewerId} 复核者声明`);
  if (!/^github:[a-z0-9](?:[a-z0-9-]{0,37}[a-z0-9])?$/.test(verifiedBy) || verifiedBy === declaration.reviewerId) {
    throw new Error(`${declaration.reviewerId} 缺少独立 GitHub 验收者`);
  }
  requireIsoTimestamp(declaration, "verifiedAt", `${declaration.reviewerId} 复核者声明`);
  if (!Array.isArray(declaration.affiliations) || declaration.affiliations.length === 0) {
    throw new Error(`${declaration.reviewerId} 缺少版本化机构记录`);
  }
  for (const affiliation of declaration.affiliations) {
    const affiliationLabel = `${declaration.reviewerId} 机构记录`;
    requireString(affiliation, "institution", affiliationLabel);
    const affiliationIssueUrl = requireString(affiliation, "sourceIssueUrl", affiliationLabel);
    if (!/^https:\/\/github\.com\/weitzu-com\/foxue\.ai\/issues\/\d+$/.test(affiliationIssueUrl)) {
      throw new Error(`${affiliationLabel} 的 sourceIssueUrl 不是本仓库复核 Issue`);
    }
    if (!/^[a-f0-9]{64}$/.test(requireString(affiliation, "submissionSha256", affiliationLabel))) {
      throw new Error(`${affiliationLabel} 的 submissionSha256 不是 SHA-256`);
    }
    const affiliationVerifiedBy = requireString(affiliation, "verifiedBy", affiliationLabel);
    if (
      !/^github:[a-z0-9](?:[a-z0-9-]{0,37}[a-z0-9])?$/.test(affiliationVerifiedBy) ||
      affiliationVerifiedBy === declaration.reviewerId
    ) {
      throw new Error(`${affiliationLabel} 缺少独立 GitHub 验收者`);
    }
    requireIsoTimestamp(affiliation, "verifiedAt", affiliationLabel);
  }
  if (new Set(declaration.affiliations.map((entry) => entry.submissionSha256)).size !== declaration.affiliations.length) {
    throw new Error(`${declaration.reviewerId} 的版本化机构记录重复`);
  }
}

const queueIds = new Set(reviewItems.map((item) => item.queueId));
const decisionIds = requireUniqueIds(durableReviewRecords.decisions, "decisionId", "独立复核决定");
const decisionsById = new Map(durableReviewRecords.decisions.map((decision) => [decision.decisionId, decision]));
const outcomeKeyByLane = {
  scope: { key: "scopeDecision", allowed: allowedScopeDecisions },
  identity: { key: "identityDecision", allowed: allowedIdentityDecisions },
  source_and_range: { key: "sourceAndRangeDecision", allowed: allowedSourceAndRangeDecisions },
};
const reviewerLaneKeys = new Set();
for (const decision of durableReviewRecords.decisions) {
  const label = `${decision.decisionId} 独立复核决定`;
  const queueId = requireString(decision, "queueId", label);
  const reviewerId = requireString(decision, "reviewerId", label);
  const lane = requireString(decision, "lane", label);
  if (!queueIds.has(queueId)) throw new Error(`${label} 引用了不存在的 queueId ${queueId}`);
  if (!reviewerIds.has(reviewerId)) throw new Error(`${label} 引用了未声明的复核者 ${reviewerId}`);
  if (decision.independent !== true) throw new Error(`${label} 未声明独立完成`);
  const reviewerLaneKey = `${queueId}\u0000${lane}\u0000${reviewerId}`;
  if (reviewerLaneKeys.has(reviewerLaneKey)) throw new Error(`${label} 与同一复核者既有同任务审校线决定重复`);
  reviewerLaneKeys.add(reviewerLaneKey);
  const outcomeSpec = outcomeKeyByLane[lane];
  if (!outcomeSpec || !outcomeSpec.allowed.includes(decision[outcomeSpec.key])) {
    throw new Error(`${label} 的 ${lane} 结论不在允许值内`);
  }
  requireEvidence(decision, label);
  const sourceIssueUrl = requireString(decision, "sourceIssueUrl", label);
  if (!/^https:\/\/github\.com\/weitzu-com\/foxue\.ai\/issues\/\d+$/.test(sourceIssueUrl)) {
    throw new Error(`${label} 的 sourceIssueUrl 不是本仓库复核 Issue`);
  }
  if (!/^[a-f0-9]{64}$/.test(requireString(decision, "submissionSha256", label))) {
    throw new Error(`${label} 的 submissionSha256 不是 SHA-256`);
  }
  requireString(decision, "reviewerIdentityAndCompetence", label);
  requireString(decision, "reviewerInstitution", label);
  requireString(decision, "conflictOfInterest", label);
  requireString(decision, "sourceScope", label);
  requireString(decision, "supportingEvidence", label);
  const acceptedBy = requireString(decision, "acceptedBy", label);
  if (!/^github:[a-z0-9](?:[a-z0-9-]{0,37}[a-z0-9])?$/.test(acceptedBy) || acceptedBy === reviewerId) {
    throw new Error(`${label} 缺少独立 GitHub 验收者`);
  }
  const acceptedAt = requireIsoTimestamp(decision, "acceptedAt", label);
  if (Date.parse(acceptedAt) < Date.parse(decision.submittedAt)) {
    throw new Error(`${label} 的 acceptedAt 早于 submittedAt`);
  }
}

requireUniqueIds(durableReviewRecords.arbitrations, "arbitrationId", "仲裁记录");
const arbitrationOutcomesByQueueAndLane = new Map();
for (const arbitration of durableReviewRecords.arbitrations) {
  const label = `${arbitration.arbitrationId} 仲裁记录`;
  const queueId = requireString(arbitration, "queueId", label);
  const reviewerId = requireString(arbitration, "arbitratorReviewerId", label);
  const lane = requireString(arbitration, "lane", label);
  if (!queueIds.has(queueId)) throw new Error(`${label} 引用了不存在的 queueId ${queueId}`);
  if (!reviewerIds.has(reviewerId)) throw new Error(`${label} 引用了未声明的仲裁者 ${reviewerId}`);
  if (
    !Array.isArray(arbitration.decisionIds) ||
    arbitration.decisionIds.length < 2 ||
    arbitration.decisionIds.some((decisionId) => !decisionIds.has(decisionId))
  ) {
    throw new Error(`${label} 必须引用至少两项既有决定`);
  }
  const referencedDecisions = arbitration.decisionIds.map((decisionId) => decisionsById.get(decisionId));
  if (referencedDecisions.some((decision) => decision.queueId !== queueId || decision.lane !== lane)) {
    throw new Error(`${label} 引用的决定必须属于同一 queueId 与审校线`);
  }
  if (referencedDecisions.some((decision) => decision.reviewerId === reviewerId)) {
    throw new Error(`${label} 的仲裁者不得是原决定复核者`);
  }
  if (arbitration.independent !== true) throw new Error(`${label} 未声明独立完成`);
  const arbitratorInstitution = requireString(arbitration, "reviewerInstitution", label);
  if (!arbitratorIsInstitutionallyIndependent(
    arbitratorInstitution,
    referencedDecisions,
  )) {
    throw new Error(`${label} 的仲裁者机构必须独立于原决定复核者`);
  }
  const outcomeSpec = outcomeKeyByLane[lane];
  if (!outcomeSpec || !outcomeSpec.allowed.includes(arbitration[outcomeSpec.key])) {
    throw new Error(`${label} 的 ${lane} 结论不在允许值内`);
  }
  if (new Set(referencedDecisions.map((decision) => decision[outcomeSpec.key])).size < 2) {
    throw new Error(`${label} 未引用具有实质分歧的决定`);
  }
  requireEvidence(arbitration, label);
  const sourceIssueUrl = requireString(arbitration, "sourceIssueUrl", label);
  if (!/^https:\/\/github\.com\/weitzu-com\/foxue\.ai\/issues\/\d+$/.test(sourceIssueUrl)) {
    throw new Error(`${label} 的 sourceIssueUrl 不是本仓库复核 Issue`);
  }
  if (!/^[a-f0-9]{64}$/.test(requireString(arbitration, "submissionSha256", label))) {
    throw new Error(`${label} 的 submissionSha256 不是 SHA-256`);
  }
  const acceptedBy = requireString(arbitration, "acceptedBy", label);
  if (!/^github:[a-z0-9](?:[a-z0-9-]{0,37}[a-z0-9])?$/.test(acceptedBy) || acceptedBy === reviewerId) {
    throw new Error(`${label} 缺少独立 GitHub 验收者`);
  }
  const acceptedAt = requireIsoTimestamp(arbitration, "acceptedAt", label);
  if (Date.parse(acceptedAt) < Date.parse(arbitration.submittedAt)) {
    throw new Error(`${label} 的 acceptedAt 早于 submittedAt`);
  }
  arbitrationOutcomesByQueueAndLane.set(`${queueId}\u0000${lane}`, arbitration[outcomeSpec.key]);
}

const laneOutcomesByQueue = new Map();
for (const decision of durableReviewRecords.decisions) {
  const outcomeSpec = outcomeKeyByLane[decision.lane];
  const key = `${decision.queueId}\u0000${decision.lane}`;
  const outcomes = laneOutcomesByQueue.get(key) ?? new Map();
  const decisions = outcomes.get(decision[outcomeSpec.key]) ?? [];
  decisions.push(decision);
  outcomes.set(decision[outcomeSpec.key], decisions);
  laneOutcomesByQueue.set(key, outcomes);
}
const consensusFor = (queueId, lane) => {
  const key = `${queueId}\u0000${lane}`;
  const arbitratedOutcome = arbitrationOutcomesByQueueAndLane.get(key);
  if (arbitratedOutcome) return arbitratedOutcome;
  const outcomes = laneOutcomesByQueue.get(key) ?? new Map();
  if (outcomes.size !== 1) return null;
  return [...outcomes.entries()].find(([, decisions]) => (
    hasInstitutionallyIndependentDecisionPair(decisions)
  ))?.[0] ?? null;
};
let independentlyApprovedWorks = 0;
let independentlyExcludedWorks = 0;
let unresolvedConflicts = 0;
for (const queueId of queueIds) {
  const scope = consensusFor(queueId, "scope");
  const identity = consensusFor(queueId, "identity");
  const sourceAndRange = consensusFor(queueId, "source_and_range");
  if (
    scope === "include_strict_sutra" &&
    identity && identity !== "identity_uncertain" &&
    sourceAndRange === "source_supported"
  ) {
    independentlyApprovedWorks += 1;
  }
  if (scope === "exclude_strict_sutra") independentlyExcludedWorks += 1;
  for (const lane of Object.keys(outcomeKeyByLane)) {
    const outcomes = laneOutcomesByQueue.get(`${queueId}\u0000${lane}`);
    if (
      outcomes && outcomes.size > 1 &&
      !arbitrationOutcomesByQueueAndLane.has(`${queueId}\u0000${lane}`)
    ) {
      unresolvedConflicts += 1;
    }
  }
}

const reviewLedger = {
  schema: "https://foxue.ai/schemas/gbcr/global-denominator-review-ledger-v0.1",
  version: "0.1.0",
  generatedAt: [
    "2026-08-16T00:00:00Z",
    ...durableReviewRecords.reviewerDeclarations.map((record) => record.verifiedAt),
    ...durableReviewRecords.decisions.map((record) => record.acceptedAt),
    ...durableReviewRecords.arbitrations.map((record) => record.acceptedAt),
  ].filter((value) => Number.isFinite(Date.parse(value))).sort().at(-1).slice(0, 10),
  status: durableReviewRecords.decisions.length === 0
    ? "open_for_independent_human_review_no_decisions_recorded"
    : "open_for_independent_human_review",
  inputs: {
    reviewQueue: { path: reviewQueuePath, sha256: sha256(Buffer.from(jsonRaw(reviewQueue))) },
  },
  reviewerPolicy: {
    naturalPersonsOnly: true,
    aiSystemsCannotCountAsIndependentReviewers: true,
    minimumIndependentReviewersPerLane: 2,
    sameInstitutionPairRequiresPublishedIndependenceJustification: true,
    automatedConsensusRequiresDistinctInstitutions: true,
    institutionalIndependenceUsesPerDecisionSnapshots: true,
    versionedReviewerAffiliationsRequired: true,
    liveIssueRevalidationBeforeAcceptanceRequired: true,
    conflictOfInterestDeclarationRequired: true,
    relevantLanguageAndTextualCompetenceRequired: true,
    publicEvidenceCitationsRequired: true,
    signedGitHistoryOrEquivalentVerifiableSignatureRequired: true,
    unresolvedDisagreementRequiresThirdPartyArbitration: true,
  },
  allowedScopeDecisions,
  allowedIdentityDecisions,
  reviewerDeclarations: durableReviewRecords.reviewerDeclarations,
  decisions: durableReviewRecords.decisions,
  arbitrations: durableReviewRecords.arbitrations,
  summary: {
    declaredReviewers: durableReviewRecords.reviewerDeclarations.length,
    decisions: durableReviewRecords.decisions.length,
    arbitrations: durableReviewRecords.arbitrations.length,
    independentlyApprovedWorks,
    independentlyExcludedWorks,
    unresolvedConflicts,
    denominatorChanges: 0,
  },
};

const standard = {
  schema: "https://foxue.ai/schemas/gbcr/global-denominator-standard-v0.1",
  version: "0.1.0",
  generatedAt: "2026-08-16",
  titleZh: "foxue.ai 全球佛经作品分母与 99% 声明标准",
  status: "public_draft_not_publishable",
  inputs: inputFingerprints,
  firstPrinciples: [
    "覆盖率必须先有有限、版本化、可反驳的分母。",
    "物理文件、目录项、卷册、译本、版本见证和作品是不同实体，不得相加。",
    "传统正典地位是可记录事实，不等于历史上的逐字亲说。",
    "机器分类只能排序证据，不能替代独立真人学术裁决。",
    "不确定项必须降低覆盖率下界，不能通过静默排除来提高百分比。",
    "目录、完整原文、中文译文、权利和质量必须分别计算，不发布加权总分。",
  ],
  target: {
    term: "全球佛经作品",
    targetPercentage: 99,
    unit: "经独立复核的去重 Work；Expression、Witness、卷、段和文件另行计量",
    currentPublishable: false,
    currentReason: "来源宇宙、范围政策、作品身份和独立双重复核均未闭合。",
  },
  conservativeFormula: {
    denominator: "已批准纳入且身份已冻结的独立作品 + 尚未归入冻结作品的未决候选记录 + 经复核的已知缺失作品占位",
    numerator: "在相同冻结分母中，已批准纳入、身份已冻结并满足某一单独覆盖维度的作品",
    lowerBound: "numerator / conservative_denominator",
    unresolvedTreatment: "每个未决候选暂按一个可能作品计入分母，且不进入任何覆盖分子；即使可能重复，也不得先行合并。",
    externalUnknownTreatment: "任何尚未完成来源宇宙审计的外部空白都会使全球百分比保持 null，而不是记为 0 或忽略。",
  },
  claimDimensions: [
    { id: "catalog", labelZh: "全球作品编目", numeratorRule: "具有冻结 Work ID 与至少一条可核验目录证据" },
    { id: "full_source_text", labelZh: "完整原文", numeratorRule: "至少一个完整原语言 Expression 合法受控并通过结构校验" },
    { id: "chinese_translation", labelZh: "完整中文译文", numeratorRule: "完整中文译文与来源对齐；机器译文必须单独标记，不等同人工译审" },
    { id: "rights_publishable", labelZh: "权利可发布", numeratorRule: "逐对象许可、署名、用途、地域与再分发条件已冻结" },
    { id: "quality_approved", labelZh: "质量通过", numeratorRule: "来源、范围、结构、锚点与抽样文本均通过规定质量门" },
  ],
  publicationGates: [
    { id: "G0", labelZh: "术语与范围政策", status: "partial", requirement: "严格经、密续、陀罗尼、疑似经、合集、律论边界公开且版本化" },
    { id: "G1", labelZh: "来源宇宙", status: "pending", requirement: "所有主要传统、语种、写本与地区见证的纳入或排除均有两份独立意见" },
    { id: "G2", labelZh: "候选记录规范化", status: "partial", requirement: "每条冻结来源记录映射为 Expression/Witness、未决记录或明确排除证据" },
    { id: "G3", labelZh: "作品范围双重复核", status: "pending", requirement: "每个可能作品至少两名独立真人给出具证据的范围决定" },
    { id: "G4", labelZh: "作品身份双重复核", status: "pending", requirement: "跨语言、跨版本聚类经双人一致；分歧由第三人仲裁" },
    { id: "G5", labelZh: "权利、全文与质量分层", status: "partial", requirement: "各覆盖维度的分子独立计算并可逐项复算" },
    { id: "G6", labelZh: "全球分母冻结", status: "pending", requirement: "分母版本、输入哈希、未决项和已知缺失项同时冻结" },
    { id: "G7", labelZh: "99% 发布", status: "pending", requirement: "仅当 G0–G6 全部通过且某一维度的保守下界不低于 99% 才可发布该维度声明" },
  ],
  governance: {
    standardFile: standardPath,
    sourceUniverseFile: sourceUniversePath,
    reviewQueueFile: reviewQueuePath,
    reviewLedgerFile: reviewLedgerPath,
    frozenCandidateRecords,
    registeredWorksQueued: reviewItems.length,
    independentHumanDecisions: reviewLedger.summary.decisions,
    automaticMerges: 0,
    globalDenominator: null,
    globalPercentage: null,
  },
};

if (
  standard.target.currentPublishable !== false ||
  standard.governance.globalDenominator !== null ||
  standard.governance.globalPercentage !== null ||
  sourceUniverse.summary.sourceUniverseReady !== false ||
  reviewQueue.summary.automaticDenominatorChanges !== 0 ||
  reviewLedger.summary.denominatorChanges !== 0
) {
  throw new Error("全球分母治理层错误地发布了未审定结论");
}
if (new Set(reviewItems.map((item) => item.queueId)).size !== reviewItems.length) {
  throw new Error("全球分母复核队列 ID 不唯一");
}

const outputs = [
  [standardPath, jsonRaw(standard)],
  [sourceUniversePath, jsonRaw(sourceUniverse)],
  [reviewQueuePath, jsonRaw(reviewQueue)],
  [reviewLedgerPath, jsonRaw(reviewLedger)],
];
if (verifyMode) {
  for (const [path, expectedRaw] of outputs) {
    if (await readFile(resolve(root, path), "utf8") !== expectedRaw) throw new Error(`${path} 不可复现`);
  }
  console.log(`全球分母治理 v0.1 可复现：${frozenCandidateRecords} 条冻结候选、${reviewItems.length} 部登记作品全部进入双人复核队列；0 项自动改变分母。`);
} else {
  await Promise.all(outputs.map(([path, raw]) => writeFile(resolve(root, path), raw)));
  console.log(`全球分母治理 v0.1 已生成：${frozenSources.length} 个冻结来源、${externalGapRegister.length} 类外部缺口、${reviewItems.length} 项双人复核任务。`);
}

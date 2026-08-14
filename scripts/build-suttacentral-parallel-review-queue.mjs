import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const version = "0.1.0";
const capturedAt = "2026-08-14";
const evidencePath = "data/gbcr/suttacentral-chinese-parallels-v0.7.0.json";
const outputPath = `data/gbcr/suttacentral-parallel-review-queue-v${version}.json`;
const evidenceRaw = await readFile(resolve(root, evidencePath), "utf8");
const evidence = JSON.parse(evidenceRaw);
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const requireValue = (condition, message) => {
  if (!condition) throw new Error(message);
};

requireValue(evidence.version === "0.7.0", "汉巴平行证据版本不匹配");
requireValue(evidence.summary?.deduplicatedParallelEdges === 5161, "汉巴平行证据边数漂移");

const selected = evidence.parallels.filter((edge) =>
  edge.decisionClass === "full_parallel_without_automatic_work_merge" || edge.remark,
);

const items = selected.map((edge) => {
  const hasScopeRemark = Boolean(edge.remark);
  return {
    id: `gbcr:parallel-review:${edge.id.split(":").at(-1)}`,
    evidenceEdgeId: edge.id,
    priority: hasScopeRemark ? "p0_scope_caveat_or_counterevidence" : "p1_upstream_full_standalone_pair",
    rationale: hasScopeRemark
      ? "上游保存了范围差异、反证或研究备注；必须先核对备注与正文，禁止按关系类型直接归并。"
      : "上游标作 full，且两端都是站内独立作品记录；这是作品裁决候选，不是已经确认的同一作品。",
    reviewState: "unassigned_pending_two_independent_reviews",
    sourceDecisionClass: edge.decisionClass,
    sourceType: edge.upstreamType,
    resembling: edge.resembling,
    upstreamRemark: edge.remark,
    pali: edge.pali,
    chinese: edge.chinese,
    evidenceSha256: edge.evidenceSha256,
    upstreamRowNumbers: edge.upstreamRowNumbers,
    requiredReviews: 2,
    adjudicationRequiredOnDisagreement: true,
    reviewChecklist: [
      "核对两端文本范围与是否为整经、合集组件或片段",
      "核对开头、结尾、说法地点、人物和叙事框架",
      "核对章节结构、教义次序、重复段落与显著增删",
      "核对异本、节译、编纂本和目录层级，避免以经号代替作品边界",
      "至少保存一条可复核的现代研究或权威目录来源；若无则维持未决",
      "记录支持证据、反证、范围差异与置信理由",
      "分别确认原文、转写、译文与元数据权利，不扩大许可",
    ],
    allowedOutcomes: [
      "same_work_different_expression",
      "text_family_relation_only",
      "component_relation_only",
      "partial_parallel_only",
      "citation_or_mention_only",
      "rejected_not_parallel",
      "unresolved_more_evidence_required",
    ],
    reviews: [],
    adjudication: null,
    denominatorImpactUntilAdjudicated: "none",
  };
}).sort((left, right) =>
  left.priority.localeCompare(right.priority)
    || left.pali.reference.localeCompare(right.pali.reference, "en", { numeric: true })
    || left.chinese.reference.localeCompare(right.chinese.reference, "en", { numeric: true }),
);

const summary = {
  queueItems: items.length,
  p0ScopeCaveatOrCounterevidence: items.filter((item) => item.priority === "p0_scope_caveat_or_counterevidence").length,
  p1UpstreamFullStandalonePairs: items.filter((item) => item.priority === "p1_upstream_full_standalone_pair").length,
  assignedItems: items.filter((item) => item.reviewState !== "unassigned_pending_two_independent_reviews").length,
  completedIndependentReviews: items.reduce((sum, item) => sum + item.reviews.length, 0),
  adjudicatedItems: items.filter((item) => item.adjudication).length,
  automaticMerges: 0,
  denominatorImpact: "none",
};

requireValue(summary.queueItems === 80, "汉巴作品裁决队列总数漂移");
requireValue(summary.p0ScopeCaveatOrCounterevidence === 20, "带范围备注或反证的 P0 队列数漂移");
requireValue(summary.p1UpstreamFullStandalonePairs === 60, "整经级独立记录的 P1 队列数漂移");
requireValue(new Set(items.map((item) => item.evidenceEdgeId)).size === items.length, "汉巴作品裁决队列存在重复证据边");
requireValue(items.every((item) => item.reviews.length === 0 && item.adjudication === null), "未经人工复核不得预填裁决结果");

const document = {
  schema: "https://foxue.ai/schemas/gbcr/suttacentral-parallel-review-queue-v0.1",
  version,
  capturedAt,
  status: "open_two_reviewer_work_identity_queue",
  warning: "队列项不是已确认同一作品。未完成两名独立复核与必要仲裁前，不得改变 Work 数、全球分母或逐段对齐状态。",
  generatedFrom: {
    file: evidencePath,
    version: evidence.version,
    sha256: sha256(evidenceRaw),
    sourceCommit: evidence.source.commit,
  },
  governance: {
    minimumIndependentReviews: 2,
    reviewerIdentityRequired: true,
    reviewTimestampRequired: true,
    citedEvidenceRequired: true,
    counterevidenceRequired: true,
    scopeDecisionRequired: true,
    adjudicatorRequiredOnDisagreement: true,
    automaticWorkMerge: false,
    automaticSegmentAlignment: false,
    aiMayPrepareEvidenceButMayNotCastHumanReview: true,
  },
  summary,
  items,
};

const outputRaw = `${JSON.stringify(document, null, 2)}\n`;
if (process.argv.includes("--verify")) {
  requireValue(await readFile(resolve(root, outputPath), "utf8") === outputRaw, `${outputPath} 不可复现`);
  console.log(`汉巴作品裁决队列 v${version} 可复现：${summary.queueItems} 项，${summary.p0ScopeCaveatOrCounterevidence} 项含范围备注或反证，尚无自动归并。`);
} else {
  await writeFile(resolve(root, outputPath), outputRaw, "utf8");
  console.log(`汉巴作品裁决队列 v${version} 已生成：${summary.queueItems} 项待双人独立复核。`);
}

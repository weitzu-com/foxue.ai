import reviewQueue from "../../data/gbcr/global-denominator-review-queue-v0.1.0.json";

export type GlobalReviewSearchParams = Record<string, string | string[] | undefined> | URLSearchParams;

type ReviewItem = (typeof reviewQueue.items)[number];
type Priority = keyof typeof reviewQueue.priorityDefinitions;

type ReviewItemView = {
  queueId: string;
  workId: string;
  titleZh: string;
  priority: string;
  statusLabel: string;
  categoryLabel: string;
  fullSourceText: boolean;
  sourceNames: string[];
  externalIdentifiersText: string;
  machineDecisionLabel: string;
  machineRuleId: string;
  requiredReviewLaneLabels: string[];
  minimumIndependentReviewsPerLane: number;
  issueUrl: string;
  anchorId: string;
};

type SelectOption = {
  value: string;
  label: string;
};

export type GlobalReviewWorkbenchPayload = {
  version: string;
  query: string;
  rawQuery: string;
  priority: string;
  source: string;
  decision: string;
  matchingItems: number;
  currentPage: number;
  totalPages: number;
  resultStart: number;
  resultEnd: number;
  queueItems: number;
  independentlyReviewedItems: number;
  automaticDenominatorChanges: number;
  prioritySummaries: Array<{ value: string; description: string; count: number }>;
  sourceOptions: SelectOption[];
  decisionOptions: SelectOption[];
  items: ReviewItemView[];
};

const PAGE_SIZE = 20;
const ISSUE_FORM_URL = "https://github.com/weitzu-com/foxue.ai/issues/new";

const sourceLabels: Record<string, string> = {
  cbeta_xml_p5: "CBETA 汉文藏经",
  esukhia_derge_kangyur: "Esukhia 德格甘珠尔",
  suttacentral_bilara: "SuttaCentral",
};

const decisionLabels: Record<string, string> = {
  excluded_from_strict_sutra_denominator: "机器暂排除：非严格经藏",
  excluded_non_buddhist_reference: "机器暂排除：非佛教参考项",
  included_candidate: "机器暂纳入候选",
  included_candidate_requires_identity_review: "机器暂纳入：身份待复核",
  scope_policy_and_item_review_required: "范围政策与逐项复核均待完成",
  scope_policy_required: "范围政策待完成",
};

const categoryLabels: Record<string, string> = {
  canonical_abhidhamma_or_treatise_not_strict_sutra: "论藏、阿毘达磨或论书",
  canonical_vinaya_not_strict_sutra: "律藏文本",
  commentary_history_or_reference_not_strict_sutra: "注疏、史传或参考材料",
  cross_section_work_scope_boundary: "跨部类作品",
  esoteric_scripture_or_ritual_scope_boundary: "密续、陀罗尼或仪轨边界",
  manuscript_or_suspected_text_scope_boundary: "写本、残片或疑似文本",
  mixed_scriptural_collection_scope_boundary: "混合经集",
  non_buddhist_reference_excluded: "非佛教参考项",
  provisional_sutra_witness: "临时经文见证",
  traditional_kangyur_sutra_section_member: "传统甘珠尔经部成员",
  traditional_sutra_or_discourse_canon_member: "传统经藏或教说成员",
};

const reviewLaneLabels: Record<string, string> = {
  scope: "严格佛经范围",
  identity_if_included: "跨版本作品身份",
  source_and_range: "来源、底本与文本范围",
};

const priorityOrder: Priority[] = ["P0", "P1", "P2", "P3", "P4"];
const decisionOrder = [
  "included_candidate_requires_identity_review",
  "scope_policy_and_item_review_required",
  "scope_policy_required",
  "included_candidate",
  "excluded_from_strict_sutra_denominator",
  "excluded_non_buddhist_reference",
];
const sourceOptions = Array.from(new Set<string>(reviewQueue.items.flatMap((item) => [...item.sourceSnapshotIds]))).sort();
const decisionOptions = [
  ...decisionOrder,
  ...Array.from(new Set(reviewQueue.items.map((item) => item.machineScopeDecision)))
    .filter((value) => !decisionOrder.includes(value))
    .sort(),
];

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function readParam(searchParams: GlobalReviewSearchParams, key: string) {
  if (searchParams instanceof URLSearchParams) return searchParams.get(key) ?? undefined;
  return first(searchParams[key]);
}

function normalize(value: string) {
  return value.trim().toLocaleLowerCase("zh-CN");
}

function externalIdEntries(item: ReviewItem) {
  return Object.entries(item.externalIds as unknown as Record<string, string[]>).filter(([, values]) => values.length > 0);
}

function searchableText(item: ReviewItem) {
  return normalize([
    item.queueId,
    item.workId,
    item.titleZh,
    item.machineCategory,
    item.machineScopeDecision,
    item.machineRuleId,
    ...item.sourceSnapshotIds,
    ...externalIdEntries(item).flatMap(([namespace, values]) => [namespace, ...values]),
  ].join(" "));
}

function issueUrl(item: ReviewItem) {
  const identifiers = externalIdEntries(item)
    .map(([namespace, values]) => `${namespace}: ${values.join(", ")}`)
    .join("；");
  const sourceScope = [
    `任务：${item.queueId}`,
    `作品：${item.workId}`,
    `题名：${item.titleZh}`,
    `来源快照：${item.sourceSnapshotIds.join(", ")}`,
    `外部编号：${identifiers || "无"}`,
    `机器规则：${item.machineRuleId}`,
    "以上仅为机器整理的定位信息，请由复核者逐项核验底本、范围与版本关系。",
    "人工核验补充（必填）：",
  ].join("\n");
  const params = new URLSearchParams({
    template: "global-denominator-review.yml",
    title: `[全球分母复核] ${item.queueId}`,
    queue_id: item.queueId,
    source_scope: sourceScope,
  });
  return `${ISSUE_FORM_URL}?${params.toString()}`;
}

function itemAnchor(queueId: string) {
  return `review-${queueId.replaceAll(":", "-")}`;
}

function buildReviewItemView(item: ReviewItem): ReviewItemView {
  const identifiers = externalIdEntries(item);

  return {
    queueId: item.queueId,
    workId: item.workId,
    titleZh: item.titleZh,
    priority: item.priority,
    statusLabel: "待双重复核",
    categoryLabel: categoryLabels[item.machineCategory] ?? item.machineCategory,
    fullSourceText: item.fullSourceText,
    sourceNames: item.sourceSnapshotIds.map((id) => sourceLabels[id] ?? id),
    externalIdentifiersText: identifiers.map(([namespace, values]) => `${namespace}: ${values.join(", ")}`).join(" · ") || "无",
    machineDecisionLabel: decisionLabels[item.machineScopeDecision] ?? item.machineScopeDecision,
    machineRuleId: item.machineRuleId,
    requiredReviewLaneLabels: item.requiredReviewLanes.map((lane) => reviewLaneLabels[lane] ?? lane),
    minimumIndependentReviewsPerLane: item.minimumIndependentReviewsPerLane,
    issueUrl: issueUrl(item),
    anchorId: itemAnchor(item.queueId),
  };
}

export function buildGlobalReviewWorkbenchPayload(searchParams: GlobalReviewSearchParams): GlobalReviewWorkbenchPayload {
  const rawQuery = readParam(searchParams, "q")?.trim().slice(0, 120) ?? "";
  const query = normalize(rawQuery);
  const requestedPriority = readParam(searchParams, "priority") ?? "";
  const priority = priorityOrder.includes(requestedPriority as Priority) ? requestedPriority : "";
  const requestedSource = readParam(searchParams, "source") ?? "";
  const source = sourceOptions.includes(requestedSource) ? requestedSource : "";
  const requestedDecision = readParam(searchParams, "decision") ?? "";
  const decision = decisionOptions.includes(requestedDecision) ? requestedDecision : "";

  const matchingItems = reviewQueue.items.filter((item) => {
    if (priority && item.priority !== priority) return false;
    if (source && !(item.sourceSnapshotIds as readonly string[]).includes(source)) return false;
    if (decision && item.machineScopeDecision !== decision) return false;
    return !query || searchableText(item).includes(query);
  });

  const requestedPage = Number.parseInt(readParam(searchParams, "reviewPage") ?? "1", 10);
  const totalPages = Math.max(1, Math.ceil(matchingItems.length / PAGE_SIZE));
  const currentPage = Number.isFinite(requestedPage)
    ? Math.min(Math.max(requestedPage, 1), totalPages)
    : 1;
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const visibleItems = matchingItems.slice(startIndex, startIndex + PAGE_SIZE).map(buildReviewItemView);
  const resultStart = matchingItems.length === 0 ? 0 : startIndex + 1;
  const resultEnd = Math.min(startIndex + PAGE_SIZE, matchingItems.length);

  return {
    version: reviewQueue.version,
    query,
    rawQuery,
    priority,
    source,
    decision,
    matchingItems: matchingItems.length,
    currentPage,
    totalPages,
    resultStart,
    resultEnd,
    queueItems: reviewQueue.summary.queueItems,
    independentlyReviewedItems: reviewQueue.summary.independentlyReviewedItems,
    automaticDenominatorChanges: reviewQueue.summary.automaticDenominatorChanges,
    prioritySummaries: priorityOrder.map((value) => ({
      value,
      description: reviewQueue.priorityDefinitions[value],
      count: reviewQueue.summary.priorityCounts[value],
    })),
    sourceOptions: sourceOptions.map((value) => ({
      value,
      label: sourceLabels[value] ?? value,
    })),
    decisionOptions: decisionOptions.map((value) => ({
      value,
      label: decisionLabels[value] ?? value,
    })),
    items: visibleItems,
  };
}

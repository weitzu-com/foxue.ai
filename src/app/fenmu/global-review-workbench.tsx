import Link from "next/link";
import { ArrowLeft, ArrowRight, ExternalLink, Search, ShieldCheck } from "lucide-react";
import reviewQueue from "../../../data/gbcr/global-denominator-review-queue-v0.1.0.json";

export type GlobalReviewSearchParams = Record<string, string | string[] | undefined>;

type ReviewItem = (typeof reviewQueue.items)[number];
type Priority = keyof typeof reviewQueue.priorityDefinitions;

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
  ].join("\n");
  const params = new URLSearchParams({
    template: "global-denominator-review.yml",
    title: `[全球分母复核] ${item.queueId}`,
    queue_id: item.queueId,
    source_scope: sourceScope,
  });
  return `${ISSUE_FORM_URL}?${params.toString()}`;
}

function queryHref(
  query: string,
  priority: string,
  source: string,
  decision: string,
  page: number,
) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (priority) params.set("priority", priority);
  if (source) params.set("source", source);
  if (decision) params.set("decision", decision);
  if (page > 1) params.set("reviewPage", String(page));
  const suffix = params.toString();
  return `/fenmu${suffix ? `?${suffix}` : ""}#global-review-queue`;
}

function itemAnchor(queueId: string) {
  return `review-${queueId.replaceAll(":", "-")}`;
}

export default function GlobalReviewWorkbench({ searchParams }: { searchParams: GlobalReviewSearchParams }) {
  const rawQuery = first(searchParams.q)?.trim().slice(0, 120) ?? "";
  const query = normalize(rawQuery);
  const requestedPriority = first(searchParams.priority) ?? "";
  const priority = priorityOrder.includes(requestedPriority as Priority) ? requestedPriority : "";
  const requestedSource = first(searchParams.source) ?? "";
  const source = sourceOptions.includes(requestedSource) ? requestedSource : "";
  const requestedDecision = first(searchParams.decision) ?? "";
  const decision = decisionOptions.includes(requestedDecision) ? requestedDecision : "";

  const matchingItems = reviewQueue.items.filter((item) => {
    if (priority && item.priority !== priority) return false;
    if (source && !(item.sourceSnapshotIds as readonly string[]).includes(source)) return false;
    if (decision && item.machineScopeDecision !== decision) return false;
    return !query || searchableText(item).includes(query);
  });

  const requestedPage = Number.parseInt(first(searchParams.reviewPage) ?? "1", 10);
  const totalPages = Math.max(1, Math.ceil(matchingItems.length / PAGE_SIZE));
  const currentPage = Number.isFinite(requestedPage)
    ? Math.min(Math.max(requestedPage, 1), totalPages)
    : 1;
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const visibleItems = matchingItems.slice(startIndex, startIndex + PAGE_SIZE);
  const resultStart = matchingItems.length === 0 ? 0 : startIndex + 1;
  const resultEnd = Math.min(startIndex + PAGE_SIZE, matchingItems.length);

  return (
    <section className="global-review-workbench page-shell" id="global-review-queue" aria-labelledby="global-review-title">
      <header className="global-review-workbench__intro">
        <div>
          <p className="eyebrow">OPEN REVIEW DESK · {reviewQueue.version}</p>
          <h2 id="global-review-title">把 {reviewQueue.summary.queueItems.toLocaleString("zh-CN")} 个未知，<br />变成可核验的判断。</h2>
          <p>
            这里不是投票榜，也不会让 AI 自动改写分母。每项任务都必须由至少两名自然人独立核对范围、作品身份与来源；
            意见冲突时，再交第三人公开仲裁。
          </p>
        </div>
        <aside className="global-review-workbench__seal" aria-label="复核进度">
          <span>HUMAN DECISIONS</span>
          <strong>{reviewQueue.summary.independentlyReviewedItems}<i> / {reviewQueue.summary.queueItems.toLocaleString("zh-CN")}</i></strong>
          <p>机器自动改变分母：{reviewQueue.summary.automaticDenominatorChanges}</p>
        </aside>
      </header>

      <div className="global-review-workbench__layout">
        <aside className="global-review-filters" aria-label="复核队列筛选">
          <form action="/fenmu#global-review-queue" method="get">
            <label className="global-review-search">
              <span>检索队列</span>
              <span>
                <Search aria-hidden="true" size={16} />
                <input
                  type="search"
                  name="q"
                  defaultValue={rawQuery}
                  maxLength={120}
                  placeholder="题名、队列 ID、目录号"
                  aria-label={`检索 ${reviewQueue.summary.queueItems} 项全球分母任务`}
                />
              </span>
            </label>

            <label>
              <span>优先级</span>
              <select name="priority" defaultValue={priority}>
                <option value="">全部优先级</option>
                {priorityOrder.map((value) => (
                  <option key={value} value={value}>{value} · {reviewQueue.summary.priorityCounts[value].toLocaleString("zh-CN")} 项</option>
                ))}
              </select>
            </label>

            <label>
              <span>来源</span>
              <select name="source" defaultValue={source}>
                <option value="">全部来源</option>
                {sourceOptions.map((value) => (
                  <option key={value} value={value}>{sourceLabels[value] ?? value}</option>
                ))}
              </select>
            </label>

            <label>
              <span>机器初筛（非结论）</span>
              <select name="decision" defaultValue={decision}>
                <option value="">全部初筛状态</option>
                {decisionOptions.map((value) => (
                  <option key={value} value={value}>{decisionLabels[value] ?? value}</option>
                ))}
              </select>
            </label>

            <div className="global-review-filters__actions">
              <button type="submit">应用筛选 <ArrowRight aria-hidden="true" size={14} /></button>
              <Link href="/fenmu#global-review-queue">清除</Link>
            </div>
          </form>

          <div className="global-review-priority-key">
            <h3>优先级不是价值排序</h3>
            {priorityOrder.map((value) => (
              <p key={value}><b>{value}</b><span>{reviewQueue.priorityDefinitions[value]}</span></p>
            ))}
          </div>
        </aside>

        <div className="global-review-results">
          <header className="global-review-results__header">
            <div>
              <span>符合条件</span>
              <strong>{matchingItems.length.toLocaleString("zh-CN")}</strong>
              <small>项 · 显示 {resultStart.toLocaleString("zh-CN")}–{resultEnd.toLocaleString("zh-CN")}</small>
            </div>
            <p>所有机器判断都标作待复核；单份意见不会改变分母。</p>
          </header>

          {visibleItems.length > 0 ? (
            <ol className="global-review-list" start={startIndex + 1}>
              {visibleItems.map((item, index) => {
                const identifiers = externalIdEntries(item);
                return (
                  <li key={item.queueId} id={itemAnchor(item.queueId)} className={`global-review-card global-review-card--${item.priority.toLocaleLowerCase()}`}>
                    <article>
                      <header>
                        <span className="global-review-card__number">{String(startIndex + index + 1).padStart(4, "0")}</span>
                        <span className="global-review-card__priority">{item.priority}</span>
                        <span className="global-review-card__status">待双重复核</span>
                      </header>

                      <div className="global-review-card__title">
                        <div>
                          <p>{categoryLabels[item.machineCategory] ?? item.machineCategory}</p>
                          <h3>{item.titleZh}</h3>
                        </div>
                        <span>{item.fullSourceText ? "有全文底本" : "仅目录或片段"}</span>
                      </div>

                      <dl className="global-review-card__identity">
                        <div><dt>队列 ID</dt><dd>{item.queueId}</dd></div>
                        <div><dt>作品 ID</dt><dd>{item.workId}</dd></div>
                        <div><dt>来源快照</dt><dd>{item.sourceSnapshotIds.map((id) => sourceLabels[id] ?? id).join("、")}</dd></div>
                        <div><dt>外部编号</dt><dd>{identifiers.map(([namespace, values]) => `${namespace}: ${values.join(", ")}`).join(" · ") || "无"}</dd></div>
                      </dl>

                      <div className="global-review-card__machine">
                        <ShieldCheck aria-hidden="true" size={20} />
                        <p><span>机器初筛 · 不是学术结论</span><strong>{decisionLabels[item.machineScopeDecision] ?? item.machineScopeDecision}</strong></p>
                        <code>{item.machineRuleId}</code>
                      </div>

                      <details className="global-review-card__protocol">
                        <summary>展开本项复核要求 <ArrowRight aria-hidden="true" size={14} /></summary>
                        <div>
                          <p><b>必须独立核对</b>{item.requiredReviewLanes.map((lane) => reviewLaneLabels[lane] ?? lane).join("、")}</p>
                          <p><b>每条审线最低人数</b>{item.minimumIndependentReviewsPerLane} 名自然人</p>
                          <p><b>未决期间处理</b>作为一个可能作品进入保守分母，但不增加任何覆盖分子。</p>
                        </div>
                      </details>

                      <footer>
                        <a href={issueUrl(item)} target="_blank" rel="noreferrer">
                          填写本项具名复核 <ExternalLink aria-hidden="true" size={14} />
                        </a>
                        <span>队列 ID 与来源定位已预填；结论、理由、反证及利益冲突必须由复核者本人填写。</span>
                      </footer>
                    </article>
                  </li>
                );
              })}
            </ol>
          ) : (
            <div className="global-review-empty">
              <Search aria-hidden="true" />
              <h3>没有符合条件的任务</h3>
              <p>清除筛选，或改用题名、队列 ID、作品 ID、目录号检索。</p>
              <Link href="/fenmu#global-review-queue">查看全部 {reviewQueue.summary.queueItems.toLocaleString("zh-CN")} 项</Link>
            </div>
          )}

          {matchingItems.length > PAGE_SIZE ? (
            <nav className="global-review-pagination" aria-label="全球分母复核队列分页">
              {currentPage > 1 ? (
                <Link href={queryHref(rawQuery, priority, source, decision, currentPage - 1)} rel="prev">
                  <ArrowLeft aria-hidden="true" size={14} /> 上一页
                </Link>
              ) : <span aria-disabled="true"><ArrowLeft aria-hidden="true" size={14} /> 上一页</span>}
              <p>第 <b>{currentPage}</b> / {totalPages.toLocaleString("zh-CN")} 页</p>
              {currentPage < totalPages ? (
                <Link href={queryHref(rawQuery, priority, source, decision, currentPage + 1)} rel="next">
                  下一页 <ArrowRight aria-hidden="true" size={14} />
                </Link>
              ) : <span aria-disabled="true">下一页 <ArrowRight aria-hidden="true" size={14} /></span>}
            </nav>
          ) : null}
        </div>
      </div>
    </section>
  );
}

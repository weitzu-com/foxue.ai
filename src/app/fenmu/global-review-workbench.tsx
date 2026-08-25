import Link from "next/link";
import { ArrowLeft, ArrowRight, ExternalLink, Search, ShieldCheck } from "lucide-react";
import type { FormEventHandler } from "react";
import type { GlobalReviewWorkbenchPayload } from "@/lib/global-review-queue";

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

export default function GlobalReviewWorkbench({
  payload,
  onSubmit,
  isLoading = false,
}: {
  payload: GlobalReviewWorkbenchPayload;
  onSubmit?: FormEventHandler<HTMLFormElement>;
  isLoading?: boolean;
}) {
  return (
    <section className="global-review-workbench page-shell" id="global-review-queue" aria-labelledby="global-review-title" aria-busy={isLoading}>
      <header className="global-review-workbench__intro">
        <div>
          <p className="eyebrow">OPEN REVIEW DESK · {payload.version}</p>
          <h2 id="global-review-title">把 {payload.queueItems.toLocaleString("zh-CN")} 个未知，<br />变成可核验的判断。</h2>
          <p>
            这里不是投票榜，也不会让 AI 自动改写分母。每项任务都必须由至少两名自然人独立核对范围、作品身份与来源；
            意见冲突时，再交第三人公开仲裁。
          </p>
        </div>
        <aside className="global-review-workbench__seal" aria-label="复核进度">
          <span>HUMAN DECISIONS</span>
          <strong>{payload.independentlyReviewedItems}<i> / {payload.queueItems.toLocaleString("zh-CN")}</i></strong>
          <p>机器自动改变分母：{payload.automaticDenominatorChanges}</p>
        </aside>
      </header>

      <div className="global-review-workbench__layout">
        <aside className="global-review-filters" aria-label="复核队列筛选">
          <form action="/fenmu#global-review-queue" method="get" onSubmit={onSubmit}>
            <label className="global-review-search">
              <span>检索队列</span>
              <span>
                <Search aria-hidden="true" size={16} />
                <input
                  type="search"
                  name="q"
                  defaultValue={payload.rawQuery}
                  maxLength={120}
                  placeholder="题名、队列 ID、目录号"
                  aria-label={`检索 ${payload.queueItems} 项全球分母任务`}
                />
              </span>
            </label>

            <label>
              <span>优先级</span>
              <select name="priority" defaultValue={payload.priority}>
                <option value="">全部优先级</option>
                {payload.prioritySummaries.map((value) => (
                  <option key={value.value} value={value.value}>{value.value} · {value.count.toLocaleString("zh-CN")} 项</option>
                ))}
              </select>
            </label>

            <label>
              <span>来源</span>
              <select name="source" defaultValue={payload.source}>
                <option value="">全部来源</option>
                {payload.sourceOptions.map((value) => (
                  <option key={value.value} value={value.value}>{value.label}</option>
                ))}
              </select>
            </label>

            <label>
              <span>机器初筛（非结论）</span>
              <select name="decision" defaultValue={payload.decision}>
                <option value="">全部初筛状态</option>
                {payload.decisionOptions.map((value) => (
                  <option key={value.value} value={value.value}>{value.label}</option>
                ))}
              </select>
            </label>

            <div className="global-review-filters__actions">
              <button type="submit" disabled={isLoading}>应用筛选 <ArrowRight aria-hidden="true" size={14} /></button>
              <Link href="/fenmu#global-review-queue">清除</Link>
            </div>

            <noscript>
              <p className="global-review-filters__noscript">无脚本环境下默认展示第一页公开队列；筛选与分页需要浏览器脚本完成。</p>
            </noscript>
          </form>

          <div className="global-review-priority-key">
            <h3>优先级不是价值排序</h3>
            {payload.prioritySummaries.map((value) => (
              <p key={value.value}><b>{value.value}</b><span>{value.description}</span></p>
            ))}
          </div>
        </aside>

        <div className="global-review-results">
          <header className="global-review-results__header">
            <div>
              <span>符合条件</span>
              <strong>{payload.matchingItems.toLocaleString("zh-CN")}</strong>
              <small>项 · 显示 {payload.resultStart.toLocaleString("zh-CN")}–{payload.resultEnd.toLocaleString("zh-CN")}</small>
            </div>
            <p>所有机器判断都标作待复核；单份意见不会改变分母。</p>
          </header>

          {payload.items.length > 0 ? (
            <ol className="global-review-list" start={payload.resultStart}>
              {payload.items.map((item, index) => (
                <li key={item.queueId} id={item.anchorId} className={`global-review-card global-review-card--${item.priority.toLocaleLowerCase()}`}>
                  <article>
                    <header>
                      <span className="global-review-card__number">{String(payload.resultStart + index).padStart(4, "0")}</span>
                      <span className="global-review-card__priority">{item.priority}</span>
                      <span className="global-review-card__status">{item.statusLabel}</span>
                    </header>

                    <div className="global-review-card__title">
                      <div>
                        <p>{item.categoryLabel}</p>
                        <h3>{item.titleZh}</h3>
                      </div>
                      <span>{item.fullSourceText ? "有全文底本" : "仅目录或片段"}</span>
                    </div>

                    <dl className="global-review-card__identity">
                      <div><dt>队列 ID</dt><dd>{item.queueId}</dd></div>
                      <div><dt>作品 ID</dt><dd>{item.workId}</dd></div>
                      <div><dt>来源快照</dt><dd>{item.sourceNames.join("、")}</dd></div>
                      <div><dt>外部编号</dt><dd>{item.externalIdentifiersText}</dd></div>
                    </dl>

                    <div className="global-review-card__machine">
                      <ShieldCheck aria-hidden="true" size={20} />
                      <p><span>机器初筛 · 不是学术结论</span><strong>{item.machineDecisionLabel}</strong></p>
                      <code>{item.machineRuleId}</code>
                    </div>

                    <details className="global-review-card__protocol">
                      <summary>展开本项复核要求 <ArrowRight aria-hidden="true" size={14} /></summary>
                      <div>
                        <p><b>必须独立核对</b>{item.requiredReviewLaneLabels.join("、")}</p>
                        <p><b>每条审线最低人数</b>{item.minimumIndependentReviewsPerLane} 名自然人</p>
                        <p><b>未决期间处理</b>作为一个可能作品进入保守分母，但不增加任何覆盖分子。</p>
                      </div>
                    </details>

                    <footer>
                      <a href={item.issueUrl} target="_blank" rel="noreferrer">
                        填写本项具名复核 <ExternalLink aria-hidden="true" size={14} />
                      </a>
                      <span>队列 ID 与来源定位已预填；结论、理由、反证及利益冲突必须由复核者本人填写。</span>
                    </footer>
                  </article>
                </li>
              ))}
            </ol>
          ) : (
            <div className="global-review-empty">
              <Search aria-hidden="true" />
              <h3>没有符合条件的任务</h3>
              <p>清除筛选，或改用题名、队列 ID、作品 ID、目录号检索。</p>
              <Link href="/fenmu#global-review-queue">查看全部 {payload.queueItems.toLocaleString("zh-CN")} 项</Link>
            </div>
          )}

          {payload.matchingItems > 20 ? (
            <nav className="global-review-pagination" aria-label="全球分母复核队列分页">
              {payload.currentPage > 1 ? (
                <Link href={queryHref(payload.rawQuery, payload.priority, payload.source, payload.decision, payload.currentPage - 1)} rel="prev">
                  <ArrowLeft aria-hidden="true" size={14} /> 上一页
                </Link>
              ) : <span aria-disabled="true"><ArrowLeft aria-hidden="true" size={14} /> 上一页</span>}
              <p>第 <b>{payload.currentPage}</b> / {payload.totalPages.toLocaleString("zh-CN")} 页</p>
              {payload.currentPage < payload.totalPages ? (
                <Link href={queryHref(payload.rawQuery, payload.priority, payload.source, payload.decision, payload.currentPage + 1)} rel="next">
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

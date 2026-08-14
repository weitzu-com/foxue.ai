"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, BookOpenText, Search, ShieldAlert } from "lucide-react";

export type ReviewQueueItem = {
  id: string;
  evidenceEdgeId: string;
  priority: "p0_scope_caveat_or_counterevidence" | "p1_upstream_full_standalone_pair";
  rationale: string;
  reviewState: string;
  sourceDecisionClass: string;
  sourceType: string;
  resembling: boolean;
  upstreamRemark: string | null;
  pali: {
    reference: string;
    workId: string;
    title: string;
    localSlug: string;
    componentWithinRegisteredWork: boolean;
    matchedBy: string;
  };
  chinese: {
    reference: string;
    cbetaId: string;
    workId: string;
    title: string;
    localSlug: string;
    componentWithinRegisteredWork: boolean;
    matchedBy: string;
  };
  evidenceSha256: string;
  upstreamRowNumbers: number[];
  requiredReviews: number;
  reviewChecklist: string[];
  reviews: unknown[];
  adjudication: unknown | null;
};

type Filter = "all" | "p0" | "p1";

const filterLabels: Array<{ id: Filter; label: string; note: string }> = [
  { id: "all", label: "全部", note: "80" },
  { id: "p0", label: "先审反证", note: "20" },
  { id: "p1", label: "整经候选", note: "60" },
];

const priorityMeta = {
  p0_scope_caveat_or_counterevidence: {
    short: "P0",
    label: "范围备注 / 反证优先",
  },
  p1_upstream_full_standalone_pair: {
    short: "P1",
    label: "整经级候选",
  },
} as const;

const normalizeSearch = (value: string) => value
  .toLocaleLowerCase("zh-CN")
  .replace(/[\s‐‑‒–—-]+/g, "");

export function ReviewQueueWorkbench({ items }: { items: ReviewQueueItem[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const visibleItems = useMemo(() => {
    const normalizedQuery = normalizeSearch(query.trim());
    return items.filter((item) => {
      if (filter === "p0" && item.priority !== "p0_scope_caveat_or_counterevidence") return false;
      if (filter === "p1" && item.priority !== "p1_upstream_full_standalone_pair") return false;
      if (!normalizedQuery) return true;

      return [
        item.pali.reference,
        item.pali.title,
        item.chinese.reference,
        item.chinese.cbetaId,
        item.chinese.title,
        item.upstreamRemark ?? "",
      ].some((value) => normalizeSearch(value).includes(normalizedQuery));
    });
  }, [filter, items, query]);

  return (
    <section className="review-workbench page-shell" aria-labelledby="review-workbench-title">
      <aside className="review-controls">
        <p className="eyebrow">REVIEW DESK</p>
        <h2 id="review-workbench-title">先找反证，<br />再谈归并。</h2>
        <p>按巴利编号、汉译编号、CBETA 号或题名检索。筛选只发生在当前设备，不会提交或改写裁决。</p>

        <label className="review-search">
          <span>检索 80 项证据</span>
          <span className="review-search__field">
            <Search aria-hidden="true" size={17} />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="例如 MN 1、MA 106、T0026"
            />
          </span>
        </label>

        <div className="review-filters" aria-label="队列优先级筛选">
          {filterLabels.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={filter === item.id}
              onClick={() => setFilter(item.id)}
            >
              <span>{item.label}</span>
              <small>{item.note}</small>
            </button>
          ))}
        </div>

        <div className="review-boundary-note">
          <ShieldAlert aria-hidden="true" />
          <p><strong>只读工作台</strong>AI 可整理证据，但不能署名为真人复核者，也不能在这里改变作品数。</p>
        </div>
      </aside>

      <div className="review-results" aria-live="polite">
        <header className="review-results__header">
          <div>
            <span>当前显示</span>
            <strong>{visibleItems.length}</strong>
            <small>项未决关系</small>
          </div>
          <p>每项须完成 2 份独立复核；有分歧时另行仲裁。</p>
        </header>

        {visibleItems.length ? (
          <ol className="review-case-list">
            {visibleItems.map((item, index) => {
              const priority = priorityMeta[item.priority];
              return (
                <li className={`review-case review-case--${priority.short.toLowerCase()}`} key={item.id}>
                  <article>
                    <header className="review-case__header">
                      <span className="review-case__number">案 {String(index + 1).padStart(2, "0")}</span>
                      <span className="review-priority"><b>{priority.short}</b>{priority.label}</span>
                      <span className="review-unresolved">未决</span>
                    </header>

                    <div className="review-pair">
                      <div>
                        <span>巴利</span>
                        <strong>{item.pali.reference.toUpperCase()}</strong>
                        <p>{item.pali.title}</p>
                      </div>
                      <i aria-hidden="true">↔</i>
                      <div>
                        <span>汉译</span>
                        <strong>{item.chinese.reference.toUpperCase()}</strong>
                        <p>{item.chinese.title} · {item.chinese.cbetaId}</p>
                      </div>
                    </div>

                    <p className="review-rationale">{item.rationale}</p>

                    {item.upstreamRemark ? (
                      <blockquote>
                        <span>上游范围备注 / 反证</span>
                        <p lang="en">{item.upstreamRemark}</p>
                      </blockquote>
                    ) : null}

                    <div className="review-case__links">
                      <Link href={`/jingzang/${item.pali.localSlug}`}>
                        <BookOpenText aria-hidden="true" size={15} /> 阅读巴利原文
                      </Link>
                      <Link href={`/jingzang/${item.chinese.localSlug}`}>
                        <BookOpenText aria-hidden="true" size={15} /> 阅读汉译原文
                      </Link>
                    </div>

                    <details className="review-evidence-details">
                      <summary>展开证据身份与复核清单 <ArrowRight aria-hidden="true" size={14} /></summary>
                      <dl>
                        <div><dt>证据边</dt><dd>{item.evidenceEdgeId}</dd></div>
                        <div><dt>上游行</dt><dd>{item.upstreamRowNumbers.join("、")}</dd></div>
                        <div><dt>关系类型</dt><dd>{item.sourceDecisionClass}</dd></div>
                        <div><dt>证据摘要</dt><dd>{item.evidenceSha256}</dd></div>
                      </dl>
                      <ol>
                        {item.reviewChecklist.map((check) => <li key={check}>{check}</li>)}
                      </ol>
                    </details>
                  </article>
                </li>
              );
            })}
          </ol>
        ) : (
          <div className="review-empty">
            <Search aria-hidden="true" />
            <h3>没有匹配的证据项</h3>
            <p>尝试输入巴利编号、阿含内部编号、CBETA 号或更短的题名。</p>
          </div>
        )}
      </div>
    </section>
  );
}

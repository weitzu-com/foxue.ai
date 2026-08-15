"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpenText, Search } from "lucide-react";
import type { Sutra } from "@/data/sutras";

const pageSize = 60;
const filters = [
  { id: "all", label: "全部" },
  { id: "chinese", label: "汉文" },
  { id: "tibetan", label: "藏文" },
  { id: "pali", label: "巴利" },
  { id: "indic", label: "梵文与俗语" },
] as const;

type FilterId = (typeof filters)[number]["id"];

function belongsTo(sutra: Sutra, filter: FilterId) {
  if (filter === "all") return true;
  if (filter === "tibetan") return sutra.readerMode === "derge-folio";
  if (filter === "pali") return sutra.language.includes("巴利");
  if (filter === "indic") return sutra.language.startsWith("梵") || sutra.language.includes("俗语");
  return sutra.language === "汉文";
}

export function LibraryCatalog({ sutras }: { sutras: Sutra[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterId>("all");
  const [limit, setLimit] = useState(pageSize);
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const results = useMemo(() => sutras.filter((sutra) => {
    if (!belongsTo(sutra, filter)) return false;
    if (!normalizedQuery) return true;
    return [
      sutra.title,
      sutra.alternateTitle,
      sutra.canonRef,
      sutra.tradition,
      sutra.translator,
      sutra.summary,
    ].join("\n").toLocaleLowerCase().includes(normalizedQuery);
  }), [filter, normalizedQuery, sutras]);
  const visible = results.slice(0, limit);

  const resetLimit = () => setLimit(pageSize);

  return (
    <>
      <section className="library-toolbar library-toolbar--search" aria-label="佛典目录检索">
        <label className="library-search">
          <Search aria-hidden="true" size={18} />
          <span className="sr-only">检索佛典目录</span>
          <input
            type="search"
            value={query}
            onChange={(event) => { setQuery(event.target.value); resetLimit(); }}
            placeholder="输入经名、D／T 编号、EWTS 题名或译者"
          />
        </label>
        <div className="library-filters" role="group" aria-label="按语种筛选">
          {filters.map((item) => (
            <button
              type="button"
              key={item.id}
              aria-pressed={filter === item.id}
              onClick={() => { setFilter(item.id); resetLimit(); }}
            >
              {item.label}
            </button>
          ))}
        </div>
        <p aria-live="polite">
          找到 <strong>{results.length}</strong> 个文本表达；检索范围为已审计书目元数据，不把它冒充全文语义检索。
        </p>
      </section>

      {visible.length ? (
        <div className="sutra-list">
          {visible.map((sutra, index) => (
            <article className="sutra-row" key={sutra.slug}>
              <div className="sutra-row__index">{String(index + 1).padStart(2, "0")}</div>
              <div className="sutra-row__title">
                <span>{sutra.tradition}</span>
                <h2>{sutra.title}</h2>
                <p>{sutra.alternateTitle} · {sutra.translator}</p>
              </div>
              <div className="sutra-row__summary">
                <p>{sutra.summary}</p>
                <div>
                  <span>{sutra.canonRef}</span>
                  <span>{sutra.status}</span>
                </div>
              </div>
              <Link
                href={`/jingzang/${sutra.slug}`}
                aria-label={`阅读${sutra.title}`}
                data-analytics-event="scripture_opened"
                data-analytics-location="library"
                data-analytics-content-id={sutra.canonRef}
                data-analytics-label={sutra.title}
              >
                <BookOpenText aria-hidden="true" />
                <span>阅读</span>
                <ArrowRight aria-hidden="true" />
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <div className="library-empty">
          <p>当前受控目录中没有匹配项。</p>
          <button type="button" onClick={() => { setQuery(""); setFilter("all"); resetLimit(); }}>清除筛选</button>
        </div>
      )}

      {visible.length < results.length ? (
        <div className="library-load-more">
          <button type="button" onClick={() => setLimit((value) => value + pageSize)}>
            再显示 {Math.min(pageSize, results.length - visible.length)} 项
          </button>
          <span>已显示 {visible.length} / {results.length}</span>
        </div>
      ) : null}
    </>
  );
}

import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpenText, Search } from "lucide-react";
import { isChineseLibraryLanguage, type Sutra } from "@/data/sutras";
import { libraryPageSize } from "@/lib/library-pagination";

export { libraryPageSize } from "@/lib/library-pagination";

export const libraryFilters = [
  { id: "all", label: "全部" },
  { id: "chinese", label: "汉文" },
  { id: "tibetan", label: "藏文" },
  { id: "pali", label: "巴利" },
  { id: "indic", label: "梵文与俗语" },
] as const;

export type LibraryFilterId = (typeof libraryFilters)[number]["id"];
export type LibrarySearchParams = Record<string, string | string[] | undefined>;

function scalar(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function belongsTo(sutra: Sutra, filter: LibraryFilterId) {
  if (filter === "all") return true;
  if (filter === "tibetan") return sutra.readerMode === "derge-folio";
  if (filter === "pali") return sutra.language.includes("巴利");
  if (filter === "indic") return sutra.language.startsWith("梵") || sutra.language.includes("俗语");
  return isChineseLibraryLanguage(sutra.language);
}

export function parseLibrarySearchParams(searchParams: LibrarySearchParams) {
  const query = (scalar(searchParams.q) ?? "").replace(/\s+/g, " ").trim().slice(0, 120);
  const candidate = scalar(searchParams.language);
  const filter = libraryFilters.some((item) => item.id === candidate)
    ? candidate as LibraryFilterId
    : "all";
  return { query, filter };
}

export function filterLibrary(sutras: Sutra[], query: string, filter: LibraryFilterId) {
  const normalizedQuery = query.toLocaleLowerCase();
  return sutras.filter((sutra) => {
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
  });
}

export function libraryPageHref(page: number, query: string, filter: LibraryFilterId) {
  const searching = Boolean(query) || filter !== "all";
  const pathname = searching
    ? "/jingzang/sousuo"
    : page > 1 ? `/jingzang/page/${page}` : "/jingzang";
  const searchParams = new URLSearchParams();
  if (searching && page > 1) searchParams.set("page", String(page));
  if (query) searchParams.set("q", query);
  if (filter !== "all") searchParams.set("language", filter);
  const search = searchParams.toString();
  return search ? `${pathname}?${search}` : pathname;
}

export function LibraryCatalog({
  sutras,
  page,
  query,
  filter,
}: {
  sutras: Sutra[];
  page: number;
  query: string;
  filter: LibraryFilterId;
}) {
  const results = filterLibrary(sutras, query, filter);
  const pageCount = Math.max(1, Math.ceil(results.length / libraryPageSize));
  const offset = (page - 1) * libraryPageSize;
  const visible = page <= pageCount ? results.slice(offset, offset + libraryPageSize) : [];

  return (
    <>
      <section className="library-toolbar library-toolbar--search" aria-label="佛典目录检索">
        <form className="library-search" action="/jingzang/sousuo" method="get" role="search">
          <Search aria-hidden="true" size={18} />
          <label className="sr-only" htmlFor="library-query">检索佛典目录</label>
          <input
            id="library-query"
            name="q"
            type="search"
            defaultValue={query}
            placeholder="输入经名、D／T 编号、EWTS 题名或译者"
          />
          {filter !== "all" ? <input name="language" type="hidden" value={filter} /> : null}
          <button type="submit">检索</button>
        </form>
        <nav className="library-filters" aria-label="按语种筛选">
          {libraryFilters.map((item) => (
            <Link
              href={libraryPageHref(1, query, item.id)}
              key={item.id}
              prefetch={false}
              aria-current={filter === item.id ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <p>
          找到 <strong>{results.length}</strong> 个文本表达；当前为第 {Math.min(page, pageCount)} / {pageCount} 页。
          检索范围为已审计书目元数据，不把它冒充全文语义检索。
        </p>
      </section>

      {visible.length ? (
        <div className="sutra-list">
          {visible.map((sutra, index) => (
            <article className="sutra-row" key={sutra.slug}>
              <div className="sutra-row__index">{String(offset + index + 1).padStart(2, "0")}</div>
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
                prefetch={false}
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
          <Link href="/jingzang" prefetch={false}>清除筛选</Link>
        </div>
      )}

      {results.length ? (
        <nav className="library-pagination" aria-label="经藏目录分页">
          <div className="library-pagination__steps">
            {page > 1 ? (
              <Link href={libraryPageHref(page - 1, query, filter)} prefetch={false} rel="prev">
                <ArrowLeft aria-hidden="true" size={15} /> 上一页
              </Link>
            ) : <span aria-hidden="true" />}
            <p>每页 60 部，全部目录均可由普通链接遍历。</p>
            {page < pageCount ? (
              <Link href={libraryPageHref(page + 1, query, filter)} prefetch={false} rel="next">
                下一页 <ArrowRight aria-hidden="true" size={15} />
              </Link>
            ) : <span aria-hidden="true" />}
          </div>
          <ol className="library-pagination__pages">
            {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => (
              <li key={pageNumber}>
                <Link
                  href={libraryPageHref(pageNumber, query, filter)}
                  prefetch={false}
                  aria-current={pageNumber === page ? "page" : undefined}
                  aria-label={`第 ${pageNumber} 页`}
                >
                  {String(pageNumber).padStart(2, "0")}
                </Link>
              </li>
            ))}
          </ol>
        </nav>
      ) : null}
    </>
  );
}

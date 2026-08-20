import {
  LibraryCatalog,
  filterLibrary,
  libraryPageSize,
  parseLibrarySearchParams,
  type LibrarySearchParams,
} from "@/components/library-catalog";
import { sutras } from "@/data/sutras";
import { buildPageMetadata } from "@/lib/site-metadata";

type PageProps = { searchParams: Promise<LibrarySearchParams> };

function parsePage(value: string | string[] | undefined) {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (!candidate || !/^\d+$/.test(candidate)) return 1;
  const page = Number(candidate);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

export async function generateMetadata({ searchParams }: PageProps) {
  const { query } = parseLibrarySearchParams(await searchParams);
  return buildPageMetadata({
    title: query ? `经藏检索：${query}` : "经藏语种筛选",
    description: "在已审计佛典书目元数据中按经名、经号、EWTS 题名、译者和语种检索。",
    path: "/jingzang",
    index: false,
  });
}

export default async function LibrarySearchPage({ searchParams }: PageProps) {
  const rawSearchParams = await searchParams;
  const { query, filter } = parseLibrarySearchParams(rawSearchParams);
  const requestedPage = parsePage(rawSearchParams.page);
  const results = filterLibrary(sutras, query, filter);
  const pageCount = Math.max(1, Math.ceil(results.length / libraryPageSize));
  const page = Math.min(requestedPage, pageCount);

  return (
    <div className="library-page">
      <header className="library-page-marker">
        <div className="page-shell">
          <p className="eyebrow">开放经藏 · SEARCH</p>
          <h1>经藏检索 <span>{query || filter !== "all" ? "受控书目" : "全部目录"}</span></h1>
        </div>
      </header>
      <div className="page-shell library-content">
        <LibraryCatalog sutras={sutras} page={page} query={query} filter={filter} />
      </div>
    </div>
  );
}

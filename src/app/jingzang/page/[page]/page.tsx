import { notFound } from "next/navigation";
import {
  LibraryCatalog,
  libraryPageSize,
} from "@/components/library-catalog";
import { sutras } from "@/data/sutras";
import { buildPageMetadata } from "@/lib/site-metadata";

type PageProps = {
  params: Promise<{ page: string }>;
};

const pageCount = Math.ceil(sutras.length / libraryPageSize);

export function generateStaticParams() {
  return Array.from({ length: Math.max(0, pageCount - 1) }, (_, index) => ({
    page: String(index + 2),
  }));
}

function parsePage(value: string) {
  if (!/^\d+$/.test(value)) return null;
  const page = Number(value);
  return Number.isSafeInteger(page) && page >= 2 ? page : null;
}

export async function generateMetadata({ params }: PageProps) {
  const page = parsePage((await params).page);
  if (!page) return { title: "经藏分页未找到" };
  return buildPageMetadata({
    title: `佛经目录 · 第 ${page} 页`,
    description: `foxue.ai 经藏目录第 ${page} 页：按来源与版本登记佛典全文、经号和稳定行段。`,
    path: `/jingzang/page/${page}`,
    index: page <= pageCount,
  });
}

export default async function LibraryPaginationPage({ params }: PageProps) {
  const page = parsePage((await params).page);
  if (!page || page > pageCount) notFound();

  return (
    <div className="library-page">
      <header className="library-page-marker">
        <div className="page-shell">
          <p className="eyebrow">开放经藏 · DIRECTORY</p>
          <h1>经藏目录 <span>第 {page} 页</span></h1>
        </div>
      </header>
      <div className="page-shell library-content">
        <LibraryCatalog sutras={sutras} page={page} query="" filter="all" />
      </div>
    </div>
  );
}

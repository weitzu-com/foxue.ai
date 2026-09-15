import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, DatabaseZap, Fingerprint, ScanSearch } from "lucide-react";
import { CorpusExactSearch } from "./corpus-exact-search";
import styles from "./page.module.css";
import { buildPageJsonLd, buildPageMetadata, serializeJsonLd } from "@/lib/site-metadata";

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };
const pagePath = "/jingzang/quanwen";
const title = "佛经全文逐字检索";
const description = "在 foxue.ai 已审计佛典全文中按原文短句精确检索，返回版本、版页、稳定行段与可核验原典链接。";

function scalar(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const query = scalar((await searchParams).q)?.trim();
  return buildPageMetadata({
    title: query ? `全文检索：${query.slice(0, 32)}` : title,
    description,
    path: pagePath,
    index: !query,
  });
}

const pageJsonLd = buildPageJsonLd({
  path: pagePath,
  title,
  description,
  type: "WebPage",
  breadcrumb: [
    { name: "首页", path: "/" },
    { name: "经藏目录", path: "/jingzang" },
    { name: "全文逐字检索", path: pagePath },
  ],
  about: ["佛经全文检索", "原典出处", "版本与版页", "稳定行段"],
});

export default async function CorpusExactSearchPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const initialQuery = scalar(params.q)?.trim().slice(0, 120) ?? "";
  const initialLanguage = scalar(params.language)?.trim() ?? "all";

  return (
    <main className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(pageJsonLd) }}
      />
      <header className={styles.hero}>
        <div className={`page-shell ${styles.heroGrid}`}>
          <div>
            <Link className={styles.backLink} href="/jingzang" prefetch={false}>
              <ArrowLeft aria-hidden="true" size={14} /> 返回经藏目录
            </Link>
            <p className="eyebrow">经藏全文 · EXACT TEXT SEARCH</p>
            <h1>记得一句，<br /><span>回到原典。</span></h1>
          </div>
          <div className={styles.heroAside}>
            <p>
              输入你记得的原文短句。系统只做可解释的逐字匹配，再回查原始版页确认；
              每条结果都给出版本、页码与稳定行段。
            </p>
            <dl>
              <div><dt>匹配方式</dt><dd>精确子串</dd></div>
              <div><dt>返回单位</dt><dd>原典版页</dd></div>
              <div><dt>生成式改写</dt><dd>不使用</dd></div>
            </dl>
          </div>
        </div>
      </header>

      <div className={`page-shell ${styles.content}`}>
        <CorpusExactSearch initialQuery={initialQuery} initialLanguage={initialLanguage} />

        <section className={styles.contract} aria-labelledby="search-contract-title">
          <div>
            <p className="eyebrow">检索边界 · SEARCH CONTRACT</p>
            <h2 id="search-contract-title">它能证明“这段字出现在哪里”，<br />不能代替义理判断。</h2>
          </div>
          <ol>
            <li>
              <ScanSearch aria-hidden="true" />
              <div><strong>逐字，不猜意思</strong><span>忽略空格、标点与大小写；不自动做繁简转换，也不扩展同义词。</span></div>
            </li>
            <li>
              <Fingerprint aria-hidden="true" />
              <div><strong>命中仍回查原文</strong><span>倒排索引只负责找候选；边缘服务会读取该版页，确认完整短句确实连续出现。</span></div>
            </li>
            <li>
              <DatabaseZap aria-hidden="true" />
              <div><strong>版本不会被抹平</strong><span>同一作品的不同译本与语言表达分开返回，研究引用应继续核对来源说明。</span></div>
            </li>
          </ol>
        </section>
      </div>
    </main>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpenText, Database, Search } from "lucide-react";
import { corpusPrinciples, sutras } from "@/data/sutras";
import { buildCoverageSnapshot } from "@/lib/corpus-registry";

export const metadata: Metadata = {
  title: "经藏",
  description: "浏览已登记佛典全文、来源、版本、经号与稳定行段。",
};

export default function LibraryPage() {
  const snapshot = buildCoverageSnapshot();
  return (
    <div className="library-page">
      <header className="subpage-hero">
        <div className="page-shell subpage-hero__grid">
          <div>
            <p className="eyebrow">开放经藏 · CORPUS 0.1</p>
            <h1>经文先于工具，<br />来源先于答案。</h1>
          </div>
          <div className="subpage-hero__aside">
            <p>
              这里展示经过来源登记与哈希核验的首批全文，不把目录条目冒充经文，
              也不把机器识别文本冒充校订本。
            </p>
            <div className="subpage-stats">
              <span><strong>{snapshot.localHoldings.fullSourceTextWorks}</strong> 部完整原文</span>
              <span><strong>{snapshot.localHoldings.stableSegments}</strong> 个稳定行段</span>
            </div>
          </div>
        </div>
      </header>

      <div className="page-shell library-content">
        <div className="library-toolbar">
          <div className="library-search" aria-label="经藏筛选即将开放">
            <Search aria-hidden="true" size={17} />
            <span>精确与语义检索将在语料审计后开放</span>
          </div>
          <span className="build-badge">索引筹建中</span>
        </div>

        <div className="sutra-list">
          {sutras.map((sutra, index) => (
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

        <section className="corpus-rules">
          <div>
            <Database aria-hidden="true" />
            <p className="eyebrow">CORPUS CONTRACT</p>
            <h2>语料契约</h2>
          </div>
          <ol>
            {corpusPrinciples.map((principle, index) => (
              <li key={principle}><span>0{index + 1}</span>{principle}</li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}

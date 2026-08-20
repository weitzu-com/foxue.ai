import { Database } from "lucide-react";
import { LibraryCatalog } from "@/components/library-catalog";
import { corpusPrinciples, sutras } from "@/data/sutras";
import { buildCoverageSnapshot } from "@/lib/corpus-registry";
import { buildPageMetadata } from "@/lib/site-metadata";

export const metadata = buildPageMetadata({
  title: "佛经在线阅读与经藏目录",
  description: "浏览已登记佛典全文、来源、版本、经号与稳定行段；涵盖汉文、藏文、巴利文、梵文与俗语见证。",
  path: "/jingzang",
});

export default function LibraryPage() {
  const snapshot = buildCoverageSnapshot();
  return (
    <div className="library-page">
      <header className="subpage-hero">
        <div className="page-shell subpage-hero__grid">
          <div>
            <p className="eyebrow">开放经藏 · CORPUS 0.8</p>
            <h1>经文先于工具，<br />来源先于答案。</h1>
          </div>
          <div className="subpage-hero__aside">
            <p>
              这里展示经过来源登记与哈希核验的首批全文，不把目录条目冒充经文，
              也不把机器识别文本冒充校订本。
            </p>
            <div className="subpage-stats">
              <span><strong>{snapshot.localHoldings.fullSourceTextExpressions}</strong> 个完整文本</span>
              <span><strong>{snapshot.localHoldings.stableSegments}</strong> 个稳定行段</span>
            </div>
            <p>{snapshot.localHoldings.registeredWorks} 个可追踪作品实体；不同版本与译本分开保留，跨传统去重持续审校。</p>
          </div>
        </div>
      </header>

      <div className="page-shell library-content">
        <LibraryCatalog sutras={sutras} page={1} query="" filter="all" />

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

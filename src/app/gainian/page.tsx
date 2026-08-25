import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Network } from "lucide-react";
import { allConcepts } from "@/lib/concept-hubs";
import { buildPageJsonLd, buildPageMetadata, serializeJsonLd } from "@/lib/site-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "佛教概念与主题 Hub",
  description: "按主题进入空、无常、无我、无住、观心等受控证据页；先理解边界，再回到原典与问经。",
  path: "/gainian",
});

const conceptIndexJsonLdBase = buildPageJsonLd({
  path: "/gainian",
  title: "佛教概念与主题 Hub",
  description: "按主题进入空、无常、无我、无住、观心等受控证据页；先理解边界，再回到原典与问经。",
  type: "CollectionPage",
  breadcrumb: [
    { name: "首页", path: "/" },
    { name: "概念", path: "/gainian" },
  ],
  about: ["佛教概念", "空", "无常", "无我", "无住", "观心", "原典证据"],
  mainEntityId: "https://www.foxue.ai/gainian#list",
});

const conceptIndexJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    ...(conceptIndexJsonLdBase["@graph"] as Array<Record<string, unknown>>),
    {
      "@type": "ItemList",
      "@id": "https://www.foxue.ai/gainian#list",
      itemListElement: allConcepts.map((concept, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: concept.title,
        url: `https://www.foxue.ai${concept.href}`,
      })),
    },
  ],
};

export default function ConceptsIndexPage() {
  return (
    <div className="page-shell section-space">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(conceptIndexJsonLd) }}
      />
      <div className="page-breadcrumb">
        <Link href="/"><ArrowLeft aria-hidden="true" size={15} /> 首页</Link>
        <span>/</span>
        <span>概念</span>
      </div>

      <header className="section-heading section-heading--split">
        <div>
          <p className="eyebrow">主题层 · TOPIC HUBS</p>
          <h1>先进入主题层，<br />再下钻到原典证据。</h1>
        </div>
        <p>
          这里不是把佛教词汇做成百科标签，而是把“用户真实会问的问题”组织成受控证据页。
          每个主题页都必须向下连到稳定原文，向上回到问经与首页，横向保留相关概念的边界。
        </p>
      </header>

      <div className="task-grid">
        {allConcepts.map((concept, index) => (
          <Link href={concept.href} className="task-card" key={concept.slug}>
            <span className="task-card__number">{String(index + 1).padStart(2, "0")}</span>
            <Network aria-hidden="true" />
            <h2>{concept.title}</h2>
            <p>{concept.summary}</p>
            <p>入口问题：{concept.prompt}</p>
            <span className="task-card__link">
              进入概念 Hub <ArrowRight aria-hidden="true" size={16} />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

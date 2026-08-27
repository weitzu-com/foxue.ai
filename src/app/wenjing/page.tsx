import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Info } from "lucide-react";
import { AskExperience } from "@/components/ask-experience";
import { buildCoverageSnapshot } from "@/lib/corpus-registry";
import { buildPageJsonLd, buildPageMetadata, serializeJsonLd } from "@/lib/site-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "证据问经与佛经原典出处对照",
  description: "输入佛学问题，在可信原型中查看佛经原典出处、版本边界、平台综合与证据不足提示。",
  path: "/wenjing",
});

const askPageJsonLd = buildPageJsonLd({
  path: "/wenjing",
  title: "证据问经与佛经原典出处对照",
  description: "输入佛学问题，在可信原型中查看佛经原典出处、版本边界、平台综合与证据不足提示。",
  breadcrumb: [
    { name: "首页", path: "/" },
    { name: "问经", path: "/wenjing" },
  ],
  about: ["AI 问经", "佛经原典出处", "证据对照", "佛学问题"],
});

export default function AskPage() {
  const coverage = buildCoverageSnapshot();
  const readableCount = new Intl.NumberFormat("zh-CN").format(
    coverage.localHoldings.fullSourceTextExpressions,
  );

  return (
    <div className="ask-page page-shell">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(askPageJsonLd) }}
      />
      <div className="page-breadcrumb">
        <Link href="/"><ArrowLeft aria-hidden="true" size={15} /> 首页</Link>
        <span>/</span>
        <span>问经</span>
      </div>

      <header className="ask-header">
        <div>
          <p className="eyebrow">引证式问经 · 可信原型</p>
          <h1>先看证据，再听综合。</h1>
        </div>
        <div className="prototype-note">
          <Info aria-hidden="true" size={17} />
          <p>
            当前问经原型仅检索三部已完成人工样本复核的经典；
            经藏另有 {readableCount} 个完整原文表达可独立阅读，尚未启用生成式模型。
          </p>
        </div>
      </header>

      <AskExperience />
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Info } from "lucide-react";
import { AskExperience } from "@/components/ask-experience";
import { buildPageJsonLd, buildPageMetadata, serializeJsonLd } from "@/lib/site-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "AI问经与原典出处对照",
  description: "输入佛学问题，查看 AI 问经答案、佛经原典出处、版本边界与证据不足提示。",
  path: "/wenjing",
});

const askPageJsonLd = buildPageJsonLd({
  path: "/wenjing",
  title: "AI问经与原典出处对照",
  description: "输入佛学问题，查看 AI 问经答案、佛经原典出处、版本边界与证据不足提示。",
  breadcrumb: [
    { name: "首页", path: "/" },
    { name: "问经", path: "/wenjing" },
  ],
  about: ["AI 问经", "佛经原典出处", "证据对照", "佛学问题"],
});

export default function AskPage() {
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
          <h1>AI 问经，先回到原典出处。</h1>
        </div>
        <div className="prototype-note">
          <Info aria-hidden="true" size={17} />
          <p>当前问经原型仅检索三部已完成人工样本复核的经典；完整经藏阅读规模请以覆盖登记册为准，尚未启用生成式模型。</p>
        </div>
      </header>

      <AskExperience />
    </div>
  );
}

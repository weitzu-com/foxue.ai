import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Info } from "lucide-react";
import { AskExperience } from "@/components/ask-experience";

export const metadata: Metadata = {
  title: "问经",
  description: "提出佛学问题，查看附带原典出处、版本和范围说明的回答。",
  alternates: { canonical: "/wenjing" },
};

export default function AskPage() {
  return (
    <div className="ask-page page-shell">
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
          <p>当前问经原型仅检索三部已完成人工样本复核的经典；完整经藏阅读规模请以覆盖登记册为准，尚未启用生成式模型。</p>
        </div>
      </header>

      <AskExperience />
    </div>
  );
}

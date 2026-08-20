import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Ban, BookOpenCheck, GitBranch, Scale, ShieldCheck } from "lucide-react";
import { buildPageJsonLd, buildPageMetadata, serializeJsonLd } from "@/lib/site-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "可信佛学系统的原则与边界",
  description: "说明 foxue.ai 如何定义可信、纠错、多传统公平与长期传承的底层原则。",
  path: "/yuanze",
});

const principlesPageJsonLd = buildPageJsonLd({
  path: "/yuanze",
  title: "可信佛学系统的原则与边界",
  description: "说明 foxue.ai 如何定义可信、纠错、多传统公平与长期传承的底层原则。",
  type: "AboutPage",
  breadcrumb: [
    { name: "首页", path: "/" },
    { name: "原则与边界", path: "/yuanze" },
  ],
  about: ["可信佛学系统", "原典优先", "多传统公平", "可纠错可接管"],
});

const principles = [
  {
    icon: BookOpenCheck,
    number: "01",
    title: "原典优先",
    text: "AI 不是佛法的来源，只是检索、对齐与综合层。关键主张必须能回到具体版本和段落。",
  },
  {
    icon: ShieldCheck,
    number: "02",
    title: "失败可见",
    text: "来源不足、版本冲突、机器候选和专家未复核都必须明确显示，绝不以流畅语气掩盖不确定性。",
  },
  {
    icon: Scale,
    number: "03",
    title: "多传统公平",
    text: "不把传统之间的术语差异强行抹平；回答说明依据哪一传统、哪一时期和哪一种文本。",
  },
  {
    icon: GitBranch,
    number: "04",
    title: "可纠错、可接管",
    text: "每次变更可追溯，数据可导出，模型可替换。即使原团队消失，公共机构仍能恢复核心阅读服务。",
  },
];

const refusals = [
  "不塑造“AI 高僧”人格，不暗示机器具有证量或宗教权威。",
  "不伪造佛经、祖师语录、经号、译者、页码或学术共识。",
  "不把单一传统包装成全体佛教的唯一立场。",
  "不利用用户的脆弱、焦虑或宗教信仰做成瘾设计和精准商业操纵。",
  "不让 AI 建议未经人类审校就成为正式佛典译文。",
];

export default function PrinciplesPage() {
  return (
    <div className="principles-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(principlesPageJsonLd) }}
      />
      <header className="manifesto-hero page-shell">
        <p className="eyebrow">第一性原理 · FIRST PRINCIPLES</p>
        <h1>“完美”不是永不犯错，<br />而是永远能够发现并纠正错误。</h1>
        <p>
          一个值得运行百年的系统，必须让证据可检查、失败可见、异议可进入、
          数据可迁移、组织可交接。
        </p>
      </header>

      <section className="page-shell principle-grid">
        {principles.map((principle) => {
          const Icon = principle.icon;
          return (
            <article key={principle.number}>
              <div className="principle-grid__topline">
                <span>{principle.number}</span>
                <Icon aria-hidden="true" />
              </div>
              <h2>{principle.title}</h2>
              <p>{principle.text}</p>
            </article>
          );
        })}
      </section>

      <section className="refusal-section">
        <div className="page-shell refusal-grid">
          <div>
            <Ban aria-hidden="true" />
            <p className="eyebrow">不可逾越的边界</p>
            <h2>为了信任，<br />先说清楚不做什么。</h2>
          </div>
          <ol>
            {refusals.map((item, index) => (
              <li key={item}><span>{String(index + 1).padStart(2, "0")}</span>{item}</li>
            ))}
          </ol>
        </div>
      </section>

      <section className="page-shell governance-cta">
        <div>
          <p className="eyebrow">公开治理</p>
          <h2>原则必须能被外界监督。</h2>
          <p>查看当前语料、覆盖方法、AI 能力、局限与建设状态。</p>
        </div>
        <Link className="button-primary" href="/touming">
          打开透明度页面 <ArrowRight aria-hidden="true" size={16} />
        </Link>
      </section>
    </div>
  );
}

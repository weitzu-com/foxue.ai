import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpenText,
  CircleAlert,
  Clock3,
  FileCheck2,
  Layers3,
  Route,
  ShieldCheck,
} from "lucide-react";
import { JingangjingLearningPath } from "@/components/jingangjing-learning-path";
import {
  jingangjingEnglishHref,
  jingangjingFullTextHref,
  jingangjingLearningDays,
} from "@/data/jingangjing-learning-path";
import {
  absoluteUrl,
  buildPageJsonLd,
  buildPageMetadata,
  serializeJsonLd,
} from "@/lib/site-metadata";

const title = "金刚经入门｜7天逐段研读与可核验原典";
const description =
  "《金刚经》七日原典研读路径：从云何住心、无四相、无所住行到如梦幻泡影，逐段阅读鸠摩罗什译 T0235；每一日附稳定行号、版本边界、本地进度与研读笺。";
const pagePath = "/xue/jingangjing";
const modifiedDate = "2026-08-28";

export const metadata: Metadata = buildPageMetadata({ title, description, path: pagePath });

const pageJsonLd = buildPageJsonLd({
  path: pagePath,
  title,
  description,
  type: "CollectionPage",
  breadcrumb: [
    { name: "首页", path: "/" },
    { name: "研读", path: "/xue" },
    { name: "金刚经入门", path: pagePath },
  ],
  about: ["金刚般若波罗蜜经", "无所住", "无四相", "般若", "鸠摩罗什译本"],
  mainEntityId: `${absoluteUrl(pagePath)}#learning-resource`,
});

const learningResourceJsonLd = {
  "@context": "https://schema.org",
  "@type": "LearningResource",
  "@id": `${absoluteUrl(pagePath)}#learning-resource`,
  name: title,
  description,
  url: absoluteUrl(pagePath),
  inLanguage: ["zh-Hans", "zh-Hant"],
  learningResourceType: "七日原典研读路径",
  educationalLevel: ["佛学入门", "佛典研读"],
  timeRequired: "P7D",
  dateModified: modifiedDate,
  provider: { "@id": `${absoluteUrl("/")}#organization` },
  isBasedOn: {
    "@type": "Book",
    name: "金刚般若波罗蜜经",
    translator: { "@type": "Person", name: "鸠摩罗什" },
    identifier: "T0235",
    url: absoluteUrl(jingangjingFullTextHref),
  },
  hasPart: jingangjingLearningDays.map((day) => ({
    "@type": "LearningResource",
    position: day.id,
    name: `第 ${day.id} 天：${day.title}`,
    description: day.hint,
    url: `${absoluteUrl(pagePath)}#day-${day.id}`,
    citation: absoluteUrl(day.href),
  })),
};

export default function JingangjingLearningPage() {
  return (
    <div className="xinjing-learning-page jingangjing-learning-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(pageJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(learningResourceJsonLd) }}
      />
      <div className="page-shell">
        <div className="page-breadcrumb">
          <Link href="/xue">
            <ArrowLeft aria-hidden="true" size={15} /> 研读中心
          </Link>
          <span>/</span>
          <span>《金刚经》入门</span>
        </div>

        <header className="learning-hero">
          <div className="learning-hero__copy">
            <p className="eyebrow">七日核读 · DIAMOND SUTRA</p>
            <h1>
              《金刚经》入门，
              <br />
              <em>
                从“云何住”
                <br />
                读到“如是观”。
              </em>
            </h1>
            <p>
              每天沿一段原文慢读：先读经，再看编辑提示与核读边界，最后留一分钟观照。
              七日不是权威讲义，而是一条随时能回到 T0235 的入口。
            </p>
            <ul aria-label="研读路径说明">
              <li>
                <Clock3 aria-hidden="true" /> 每天约 8 分钟
              </li>
              <li>
                <Route aria-hidden="true" /> 七日随时可读
              </li>
              <li>
                <ShieldCheck aria-hidden="true" /> 进度仅存本地
              </li>
            </ul>
          </div>

          <aside className="learning-hero__seal jingangjing-hero__seal" aria-label="研读方法">
            <span aria-hidden="true">金</span>
            <div>
              <BookOpenText aria-hidden="true" />
              <strong>经 · 解 · 核 · 观</strong>
              <p>原句在前；编辑提示、版本边界与个人观照分层呈现。</p>
            </div>
          </aside>
        </header>

        <section className="learning-overview" aria-labelledby="jingangjing-overview-title">
          <div className="learning-overview__heading">
            <div>
              <p className="eyebrow">先看全函 · SEVEN PASSAGES</p>
              <h2 id="jingangjing-overview-title">七段经文，组成一条可回查的阅读线。</h2>
            </div>
            <p>
              七段引文完整写入页面，并直接落到对应版页行号。可以顺读，也可以从熟悉的
              “应无所住而生其心”或“一切有为法”开始。
            </p>
          </div>
          <ol className="learning-overview__grid jingangjing-overview__grid">
            {jingangjingLearningDays.map((day) => (
              <li key={day.id}>
                <a href={`#day-${day.id}`}>
                  <span>0{day.id}</span>
                  <small>{day.focus}</small>
                  <h3>{day.title}</h3>
                  <blockquote lang="zh-Hant">{day.reading}</blockquote>
                  <span className="learning-overview__link">
                    进入第 {day.id} 天 <ArrowRight aria-hidden="true" />
                  </span>
                </a>
              </li>
            ))}
          </ol>
        </section>

        <section className="jingangjing-expression-note" aria-labelledby="expression-note-title">
          <div>
            <Layers3 aria-hidden="true" />
            <p className="eyebrow">同一作品 · 多种表达</p>
            <h2 id="expression-note-title">先站稳一个译本，再打开版本差异。</h2>
          </div>
          <div>
            <p>
              七日路径以鸠摩罗什译 T0235 为单一底本，避免在入门阶段把诸译本拼成一部
              “综合经文”。作品页现列六种汉译和一份历史英译；它们是可分别阅读的文本表达，
              不是已经完成的逐句对勘表。
            </p>
            <div>
              <Link href={jingangjingFullTextHref}>
                打开《金刚经》作品页 <ArrowUpRight aria-hidden="true" />
              </Link>
              <Link href={jingangjingEnglishHref}>查看 Gemmell 1912 英译</Link>
            </div>
          </div>
        </section>

        <JingangjingLearningPath />

        <section className="learning-editorial" aria-labelledby="jingangjing-editorial-title">
          <div className="learning-editorial__intro">
            <FileCheck2 aria-hidden="true" />
            <p className="eyebrow">谁整理 · 如何核对</p>
            <h2 id="jingangjing-editorial-title">经文、路标与判断，各自承担自己的责任。</h2>
            <p>
              本页不把编辑提示写成佛说，也不把同一作品的不同译本自动抹平。
              任何读者都可沿稳定行号检查引文，并从原典继续向上、向下阅读。
            </p>
          </div>
          <dl>
            <div>
              <dt>当前阅读底本</dt>
              <dd>CBETA《大正新修大藏经》T0235，后秦·鸠摩罗什译</dd>
            </div>
            <div>
              <dt>引文处理</dt>
              <dd>依版页稳定行段摘录完整句义；不改写为现代语，不补造缺句</dd>
            </div>
            <div>
              <dt>入门提示责任</dt>
              <dd>foxue.ai 编辑组；提示不是经文，当前尚未标注外部具名佛学审校</dd>
            </div>
            <div>
              <dt>版本边界</dt>
              <dd>其余汉译与历史英译可分别阅读；本页不发布未经校勘的逐句对应结论</dd>
            </div>
            <div>
              <dt>本次修订</dt>
              <dd><time dateTime={modifiedDate}>2026-08-28</time> · 新增七日原典路径、本地进度、研读笺与引文复制</dd>
            </div>
          </dl>
          <div className="learning-editorial__actions">
            <Link href={jingangjingFullTextHref}>
              打开完整原典 <ArrowUpRight aria-hidden="true" />
            </Link>
            <Link href="/touming">查看来源与数据方法</Link>
            <a
              href="https://github.com/weitzu-com/foxue.ai/issues/new"
              target="_blank"
              rel="noreferrer"
            >
              报告引文或解释问题 <ArrowUpRight aria-hidden="true" />
            </a>
          </div>
          <p className="learning-editorial__notice">
            <CircleAlert aria-hidden="true" />
            在外部具名审校完成前，本站不会把这些入门提示标为“权威解释”。
          </p>
        </section>
      </div>
    </div>
  );
}

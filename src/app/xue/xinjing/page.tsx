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
  Route,
  ShieldCheck,
} from "lucide-react";
import { XinjingLearningPath } from "@/components/xinjing-learning-path";
import {
  xinjingFullTextHref,
  xinjingLearningDays,
} from "@/data/xinjing-learning-path";
import {
  absoluteUrl,
  buildPageJsonLd,
  buildPageMetadata,
  serializeJsonLd,
} from "@/lib/site-metadata";

const title = "心经全文入门｜7天逐句学习与原典出处";
const description =
  "《心经》全文入门学习路径：7 天逐句阅读玄奘译本，理解五蕴、色即是空、无所得与心无罣碍；每一日附大正藏经号、稳定行段和可核验原典出处。";
const pagePath = "/xue/xinjing";
const modifiedDate = "2026-08-24";

export const metadata: Metadata = buildPageMetadata({ title, description, path: pagePath });

const pageJsonLd = buildPageJsonLd({
  path: pagePath,
  title,
  description,
  type: "CollectionPage",
  breadcrumb: [
    { name: "首页", path: "/" },
    { name: "心经全文入门", path: pagePath },
  ],
  about: ["般若波罗蜜多心经", "五蕴", "色即是空", "无所得", "心无罣碍"],
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
  learningResourceType: "七日原典学习路径",
  educationalLevel: "佛学入门",
  timeRequired: "P7D",
  dateModified: modifiedDate,
  provider: { "@id": `${absoluteUrl("/")}#organization` },
  isBasedOn: {
    "@type": "Book",
    name: "般若波罗蜜多心经",
    translator: { "@type": "Person", name: "玄奘" },
    identifier: "T0251",
    url: absoluteUrl(xinjingFullTextHref),
  },
  hasPart: xinjingLearningDays.map((day) => ({
    "@type": "LearningResource",
    position: day.id,
    name: `第 ${day.id} 天：${day.title}`,
    description: day.hint,
    url: `${absoluteUrl(pagePath)}#day-${day.id}`,
    citation: absoluteUrl(day.href),
  })),
};

export default function XinjingLearningPage() {
  return (
    <div className="xinjing-learning-page">
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
          <Link href="/">
            <ArrowLeft aria-hidden="true" size={15} /> 首页
          </Link>
          <span>/</span>
          <span>《心经》入门</span>
        </div>

        <header className="learning-hero">
          <div className="learning-hero__copy">
            <p className="eyebrow">七日入经 · HEART SUTRA</p>
            <h1>
              《心经》全文入门，
              <br />
              <em>
                七天和原典
                <br />
                见七次面。
              </em>
            </h1>
            <p>
              每天读一小段，只带一个理解提示回到生活。
              没有打卡压力：所有日程都开放，今天读不下去就跳过。
            </p>
            <ul aria-label="学习路径说明">
              <li>
                <Clock3 aria-hidden="true" /> 每天约 5 分钟
              </li>
              <li>
                <Route aria-hidden="true" /> 七天随时可读
              </li>
              <li>
                <ShieldCheck aria-hidden="true" /> 进度仅存本地
              </li>
            </ul>
          </div>

          <aside className="learning-hero__seal" aria-label="学习方法">
            <span aria-hidden="true">七</span>
            <div>
              <BookOpenText aria-hidden="true" />
              <strong>读 · 解 · 观</strong>
              <p>每天三步，每次都回到稳定原典段落。</p>
            </div>
          </aside>
        </header>

        <section className="learning-overview" aria-labelledby="learning-overview-title">
          <div className="learning-overview__heading">
            <div>
              <p className="eyebrow">先看全图 · SEVEN QUESTIONS</p>
              <h2 id="learning-overview-title">七天，不是七篇摘要；是七次回到原句。</h2>
            </div>
            <p>
              下列七段会完整出现在服务器 HTML 中，帮助读者与搜索系统先理解这条路径。
              点击任一日，即可直接进入对应原文、理解提示与一分钟观察。
            </p>
          </div>
          <ol className="learning-overview__grid">
            {xinjingLearningDays.map((day) => (
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

        <XinjingLearningPath />

        <section className="learning-editorial" aria-labelledby="learning-editorial-title">
          <div className="learning-editorial__intro">
            <FileCheck2 aria-hidden="true" />
            <p className="eyebrow">谁整理 · 如何核对</p>
            <h2 id="learning-editorial-title">把责任写出来，比写得像权威更重要。</h2>
            <p>
              本页的经文与解释不是同一层内容。经文回到受控来源；理解提示只是一条入门路标，
              不冒充佛说、注疏或具名法师开示。
            </p>
          </div>
          <dl>
            <div>
              <dt>原典底本</dt>
              <dd>CBETA《大正新修大藏经》T0251，唐·玄奘译</dd>
            </div>
            <div>
              <dt>文本与产品维护</dt>
              <dd>foxue.ai contributors，版本、来源与稳定行段公开可核验</dd>
            </div>
            <div>
              <dt>入门提示责任</dt>
              <dd>foxue.ai 编辑组；提示不是经文，当前尚未标注外部具名佛学审校</dd>
            </div>
            <div>
              <dt>本次修订</dt>
              <dd><time dateTime={modifiedDate}>2026-08-24</time> · 增加七日索引、编辑说明与引用卡</dd>
            </div>
          </dl>
          <div className="learning-editorial__actions">
            <Link href={xinjingFullTextHref}>
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
            <CircleAlert aria-hidden="true" /> 在外部具名审校完成前，本站不会把这些入门提示标为“权威解释”。
          </p>
        </section>
      </div>
    </div>
  );
}

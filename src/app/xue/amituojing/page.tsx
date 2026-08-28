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
  Languages,
  Route,
  ShieldCheck,
} from "lucide-react";
import { AmituojingLearningPath } from "@/components/amituojing-learning-path";
import {
  amituojingFullTextHref,
  amituojingLearningDays,
  xuanzangAmituojingHref,
} from "@/data/amituojing-learning-path";
import {
  absoluteUrl,
  buildPageJsonLd,
  buildPageMetadata,
  serializeJsonLd,
} from "@/lib/site-metadata";
import styles from "./page.module.css";

const title = "阿弥陀经入门｜7天修持、理解与版本校读";
const description =
  "《佛说阿弥陀经》七日原典研读：从今现在说法、极乐释名、念三宝、光寿无量到执持名号与难信之法；以鸠摩罗什译 T0366 为底本，并列玄奘译 T0367 相关段落。";
const pagePath = "/xue/amituojing";
const modifiedDate = "2026-08-29";

export const metadata: Metadata = buildPageMetadata({ title, description, path: pagePath });

const pageJsonLd = buildPageJsonLd({
  path: pagePath,
  title,
  description,
  type: "CollectionPage",
  breadcrumb: [
    { name: "首页", path: "/" },
    { name: "研读", path: "/xue" },
    { name: "阿弥陀经入门", path: pagePath },
  ],
  about: ["佛说阿弥陀经", "称赞净土佛摄受经", "净土", "念佛", "鸠摩罗什译本", "玄奘译本"],
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
  educationalLevel: ["佛学入门", "佛典研读", "佛典版本比较"],
  timeRequired: "P7D",
  dateModified: modifiedDate,
  provider: { "@id": `${absoluteUrl("/")}#organization` },
  isBasedOn: [
    {
      "@type": "Book",
      name: "佛说阿弥陀经",
      translator: { "@type": "Person", name: "鸠摩罗什" },
      identifier: "T0366",
      url: absoluteUrl(amituojingFullTextHref),
    },
    {
      "@type": "Book",
      name: "称赞净土佛摄受经",
      translator: { "@type": "Person", name: "玄奘" },
      identifier: "T0367",
      url: absoluteUrl(xuanzangAmituojingHref),
    },
  ],
  hasPart: amituojingLearningDays.map((day) => ({
    "@type": "LearningResource",
    position: day.id,
    name: `第 ${day.id} 天：${day.title}`,
    description: day.context,
    url: `${absoluteUrl(pagePath)}#day-${day.id}`,
    citation: [absoluteUrl(day.href), absoluteUrl(day.parallelHref)],
  })),
};

const expressions = [
  {
    number: "01",
    title: "佛说阿弥陀经",
    meta: "lzh-Hant · T0366 · 141 稳定行段",
    credit: "姚秦·鸠摩罗什译",
    href: amituojingFullTextHref,
    status: "七日阅读底本",
  },
  {
    number: "02",
    title: "称赞净土佛摄受经",
    meta: "lzh-Hant · T0367 · 263 稳定行段",
    credit: "唐·玄奘译",
    href: xuanzangAmituojingHref,
    status: "相关段落校读",
  },
  {
    number: "03",
    title: "佛説阿彌陀經（現代日本語訳）",
    meta: "ja · JT0366b · 87 稳定行段",
    credit: "SAT 现代日本语译团队",
    href: "/jingzang/sat-ja-t0366",
    status: "CC BY 4.0 现代译本",
  },
] as const;

export default function AmituojingLearningPage() {
  return (
    <div className={`xinjing-learning-page ${styles.page}`}>
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
          <Link href="/xue"><ArrowLeft aria-hidden="true" size={15} /> 研读中心</Link>
          <span>/</span>
          <span>《佛说阿弥陀经》入门</span>
        </div>

        <header className={`learning-hero ${styles.hero}`}>
          <div className="learning-hero__copy">
            <p className="eyebrow">七日净读 · AMITĀBHA SUTRA</p>
            <h1>
              《阿弥陀经》入门，
              <br />
              <em>从“闻说”到“愿、持、信”。</em>
            </h1>
            <p>
              每天只守一段鸠摩罗什译原文，再分别进入修持、理解与校读。
              玄奘译本只在需要比较时出现；两种声音并列，不拼成一部“综合经文”。
            </p>
            <ul aria-label="研读路径说明">
              <li><Clock3 aria-hidden="true" /> 每天约 8 分钟</li>
              <li><Route aria-hidden="true" /> 七日随时可读</li>
              <li><ShieldCheck aria-hidden="true" /> 进度仅存本地</li>
            </ul>
          </div>

          <aside className={styles.heroSeal} aria-label="研读方法">
            <span aria-hidden="true">願</span>
            <div>
              <BookOpenText aria-hidden="true" />
              <strong>闻 · 愿 · 持 · 信</strong>
              <p>一部短经，三个入口：修持不离原句，理解不越边界，校读不抹平译本。</p>
            </div>
          </aside>
        </header>

        <section className={`learning-overview ${styles.overview}`} aria-labelledby="amituojing-overview-title">
          <div className="learning-overview__heading">
            <div>
              <p className="eyebrow">先看全函 · SEVEN PASSAGES</p>
              <h2 id="amituojing-overview-title">七段原文，先完整站在解释之前。</h2>
            </div>
            <p>
              下列引文全部写入服务器 HTML，并落到 T0366 的稳定版页行号。
              可以顺读，也可以从“执持名号”进入；每一日仍能回到前后全文。
            </p>
          </div>
          <ol className="learning-overview__grid">
            {amituojingLearningDays.map((day) => (
              <li key={day.id}>
                <a href={`#day-${day.id}`}>
                  <span>0{day.id}</span>
                  <small>{day.focus}</small>
                  <h3>{day.title}</h3>
                  <blockquote lang="zh-Hant">{day.reading}</blockquote>
                  <span className="learning-overview__link">进入第 {day.id} 天 <ArrowRight aria-hidden="true" /></span>
                </a>
              </li>
            ))}
          </ol>
        </section>

        <section className={styles.expressionLedger} aria-labelledby="amituojing-expressions-title">
          <div className={styles.expressionIntro}>
            <Languages aria-hidden="true" />
            <p className="eyebrow">一部作品 · 三种表达</p>
            <h2 id="amituojing-expressions-title">先选底本，再谈“同一句”。</h2>
            <p>作品关系已经登记，不代表三种文本可自动逐句对齐。七日路径只以 T0366 为经文底本。</p>
          </div>
          <ol>
            {expressions.map((expression) => (
              <li key={expression.href}>
                <span>{expression.number}</span>
                <div>
                  <small>{expression.status}</small>
                  <h3>{expression.title}</h3>
                  <p>{expression.credit}</p>
                  <code>{expression.meta}</code>
                </div>
                <Link href={expression.href} aria-label={`打开${expression.title}`}>
                  <ArrowUpRight aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ol>
        </section>

        <AmituojingLearningPath />

        <section className="learning-editorial" aria-labelledby="amituojing-editorial-title">
          <div className="learning-editorial__intro">
            <FileCheck2 aria-hidden="true" />
            <p className="eyebrow">谁整理 · 如何核对</p>
            <h2 id="amituojing-editorial-title">修持可以真诚，出处仍须精确。</h2>
            <p>
              页面允许个人修持进入，却不把编辑练习写成佛说，也不把同一作品的不同译本强制归一。
              每一段经文、相关译本和平台说明都承担不同责任。
            </p>
          </div>
          <dl>
            <div><dt>七日阅读底本</dt><dd>CBETA《大正新修大藏经》T0366，姚秦·鸠摩罗什译</dd></div>
            <div><dt>相关译本</dt><dd>T0367 唐·玄奘译；仅标相关段落，不发布未经人工校勘的逐句对应表</dd></div>
            <div><dt>引文处理</dt><dd>逐字取自声明版页行段；不现代化改写，不补造缺句</dd></div>
            <div><dt>编辑辅助层</dt><dd>foxue.ai 编辑组整理；修持、理解与校读提示均不是经文，尚无外部具名佛学审校</dd></div>
            <div><dt>权利边界</dt><dd>汉译底本依来源限制用于站内核读；SAT 现代日本语译本标记为 CC BY 4.0</dd></div>
            <div><dt>本次修订</dt><dd><time dateTime={modifiedDate}>2026-08-29</time> · 新增七日路径、双译定位、本地进度与研读笺</dd></div>
          </dl>
          <div className="learning-editorial__actions">
            <Link href={amituojingFullTextHref}>打开完整 T0366 <ArrowUpRight aria-hidden="true" /></Link>
            <Link href={xuanzangAmituojingHref}>打开完整 T0367</Link>
            <Link href="/touming">查看来源与数据方法</Link>
            <a href="https://github.com/weitzu-com/foxue.ai/issues/new" target="_blank" rel="noreferrer">
              报告引文或解释问题 <ArrowUpRight aria-hidden="true" />
            </a>
          </div>
          <p className="learning-editorial__notice">
            <CircleAlert aria-hidden="true" /> 在外部具名审校完成前，本站不会把编辑辅助层标为“权威解释”或“标准修法”。
          </p>
        </section>
      </div>
    </div>
  );
}

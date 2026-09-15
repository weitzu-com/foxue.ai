import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookMarked,
  BookOpenText,
  Clock3,
  FileCheck2,
  Fingerprint,
  Languages,
  Map,
  Route,
  ShieldCheck,
  Sprout,
} from "lucide-react";
import { FahuajingReadingPath } from "@/components/fahuajing-reading-path";
import {
  fahuajingFullTextHref,
  fahuajingReadingGates,
  fahuajingSoothillHref,
} from "@/data/fahuajing-reading-path";
import {
  absoluteUrl,
  buildPageJsonLd,
  buildPageMetadata,
  serializeJsonLd,
} from "@/lib/site-metadata";
import styles from "./page.module.css";

const title = "《法华经》怎么读｜七个关口回到 T0262 原典";
const description =
  "面向佛教徒、佛学爱好者与研究者的《法华经》七关研读路径：从方便、譬喻与承持读到寿量和普门，每关提供鸠摩罗什译 T0262 原句、稳定行号、观照提示、校读边界与同品英译见证。";
const pagePath = "/xue/fahuajing";
const modifiedDate = "2026-09-15";

export const metadata: Metadata = buildPageMetadata({ title, description, path: pagePath });

const pageJsonLd = buildPageJsonLd({
  path: pagePath,
  title,
  description,
  type: "CollectionPage",
  breadcrumb: [
    { name: "首页", path: "/" },
    { name: "研读", path: "/xue" },
    { name: "法华经七关研读", path: pagePath },
  ],
  about: [
    "妙法莲华经",
    "法华经",
    "方便品",
    "譬喻品",
    "如来寿量品",
    "观世音菩萨普门品",
    "鸠摩罗什译本",
  ],
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
  learningResourceType: "七关原典研读路径",
  educationalLevel: ["佛学入门", "佛典研读", "佛典版本研究"],
  timeRequired: "PT84M",
  dateModified: modifiedDate,
  provider: { "@id": `${absoluteUrl("/")}#organization` },
  isBasedOn: {
    "@type": "Book",
    name: "妙法莲华经",
    translator: { "@type": "Person", name: "鸠摩罗什" },
    identifier: "T0262",
    url: absoluteUrl(fahuajingFullTextHref),
  },
  hasPart: fahuajingReadingGates.map((gate) => ({
    "@type": "LearningResource",
    position: gate.id,
    name: `第 ${gate.id} 关：${gate.title}`,
    description: gate.hint,
    url: `${absoluteUrl(pagePath)}#day-${gate.id}`,
    citation: absoluteUrl(gate.href),
  })),
};

const readerLenses = [
  {
    icon: Sprout,
    label: "佛教徒 · 行与愿",
    title: "让经句落回当下",
    description: "每关留一分钟观照，但不把平台提示冒充修持证明，也不制造连续打卡压力。",
  },
  {
    icon: BookOpenText,
    label: "爱好者 · 故事与转折",
    title: "沿譬喻进入长经",
    description: "先抓住火宅、药草、从地踊出等叙事关口，再顺着上下文进入完整二十八品。",
  },
  {
    icon: Fingerprint,
    label: "研究者 · 版本与坐标",
    title: "每个判断都能回查",
    description: "T0262 稳定行号、同品英译见证与版本责任分开呈现，不自动制造逐句对勘。",
  },
] as const;

export default function FahuajingLearningPage() {
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
        <nav className="page-breadcrumb" aria-label="面包屑">
          <Link href="/xue">
            <ArrowLeft aria-hidden="true" size={15} /> 研读中心
          </Link>
          <span>/</span>
          <span>《法华经》七关研读</span>
        </nav>

        <header className={`learning-hero ${styles.hero}`}>
          <div className="learning-hero__copy">
            <p className="eyebrow">七个阅读关口 · LOTUS SUTRA</p>
            <h1>
              《法华经》很长，
              <br />
              入口不该只剩<em>目录。</em>
            </h1>
            <p>
              七关不是二十八品的摘要，也不承诺替你“读完”。它从七处可复查的原句搭桥：
              先看全经如何转向，再回到完整品章慢慢读。
            </p>
            <ul aria-label="研读路径说明">
              <li><Clock3 aria-hidden="true" /> 每关约 12 分钟</li>
              <li><Route aria-hidden="true" /> 七关随时可读</li>
              <li><ShieldCheck aria-hidden="true" /> 进度仅存本地</li>
            </ul>
          </div>

          <aside className={styles.heroSeal} aria-label="七关研读方法">
            <span aria-hidden="true">法</span>
            <div>
              <Map aria-hidden="true" />
              <strong>经 · 解 · 核 · 观</strong>
              <p>展开一张可回到原典的经卷地图，不把路标当终点。</p>
            </div>
          </aside>
        </header>

        <section className={`learning-overview ${styles.overview}`} aria-labelledby="fahuajing-overview-title">
          <div className="learning-overview__heading">
            <div>
              <p className="eyebrow">先看全卷 · SEVEN GATES</p>
              <h2 id="fahuajing-overview-title">七处转折，打开二十八品。</h2>
            </div>
            <p>
              可顺读，也可从最熟悉的火宅、寿量或普门进入。每张卡只是一枚界标；点击后会看到原句、
              上下文坐标、同品英译边界和继续读的方向。
            </p>
          </div>
          <ol className="learning-overview__grid">
            {fahuajingReadingGates.map((gate) => (
              <li key={gate.id}>
                <a href={`#day-${gate.id}`}>
                  <span>0{gate.id}</span>
                  <small>第 {gate.chapter} 品 · {gate.chapterTitle}</small>
                  <h3>{gate.title}</h3>
                  <blockquote lang="zh-Hant">{gate.reading}</blockquote>
                  <span className="learning-overview__link">
                    进入第 {gate.id} 关 <ArrowRight aria-hidden="true" />
                  </span>
                </a>
              </li>
            ))}
          </ol>
        </section>

        <section className={styles.lenses} aria-labelledby="fahuajing-lenses-title">
          <div className={styles.lensesHeading}>
            <p className="eyebrow">同一关 · 三种读法</p>
            <h2 id="fahuajing-lenses-title">修学、理解与校读，在同一页各有位置。</h2>
            <p>身份不是等级。修持者也需要版本坐标，研究者也可以先让一个譬喻完整发生。</p>
          </div>
          <div className={styles.lensGrid}>
            {readerLenses.map((lens) => {
              const Icon = lens.icon;
              return (
                <article key={lens.label}>
                  <Icon aria-hidden="true" />
                  <small>{lens.label}</small>
                  <h3>{lens.title}</h3>
                  <p>{lens.description}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className={styles.sourceLedger} aria-labelledby="fahuajing-source-ledger-title">
          <div className={styles.sourceIntro}>
            <BookMarked aria-hidden="true" />
            <p className="eyebrow">先站稳底本 · THEN COMPARE</p>
            <h2 id="fahuajing-source-ledger-title">这里读的是 T0262，不是一部拼接出来的“综合法华经”。</h2>
            <p>
              七关只摘录姚秦·鸠摩罗什译《妙法莲华经》。其他汉译、节译与藏译可帮助求证文本家族，
              但差异必须被保留。
            </p>
          </div>
          <ol>
            <li>
              <span>01</span>
              <div>
                <small>PRIMARY TEXT</small>
                <h3>T0262 · 姚秦·鸠摩罗什译</h3>
                <p>七处引文逐字来自站内 CBETA TEI 正文，共有 5,343 个稳定行段。</p>
                <Link href={fahuajingFullTextHref}>打开完整作品页 <ArrowUpRight aria-hidden="true" /></Link>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <small>CHINESE EXPRESSIONS</small>
                <h3>T0263 · T0264 · T0265</h3>
                <p>前两者为完整汉译，T0265 是一卷节译见证；同属作品关系，不代表品次或句子天然对齐。</p>
                <Link href={fahuajingFullTextHref}>查看四种汉译表达 <ArrowUpRight aria-hidden="true" /></Link>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <small>HISTORICAL ENGLISH WITNESS</small>
                <h3>Soothill 1930 · 28 品节译本</h3>
                <p>完整保存其删节版来源正文；Project Gutenberg 标记美国公有领域，本站不作全球公版声明。</p>
                <Link href={fahuajingSoothillHref}>查看删节与质量边界 <ArrowUpRight aria-hidden="true" /></Link>
              </div>
            </li>
          </ol>
        </section>

        <FahuajingReadingPath />

        <section className={`learning-editorial ${styles.editorial}`} aria-labelledby="fahuajing-editorial-title">
          <div className="learning-editorial__intro">
            <FileCheck2 aria-hidden="true" />
            <p className="eyebrow">谁整理 · 如何核对</p>
            <h2 id="fahuajing-editorial-title">让来源比解释更靠近经句。</h2>
            <p>
              本页的价值不在替读者得出七个答案，而在每个入口都能回到原典、继续上下文，
              并知道版本比较目前能说到哪里。
            </p>
          </div>
          <dl>
            <div>
              <dt>当前阅读底本</dt>
              <dd>CBETA《大正新修大藏经》T0262，姚秦·鸠摩罗什译</dd>
            </div>
            <div>
              <dt>引文处理</dt>
              <dd>按版页稳定行段逐字摘录；不改写原文，不以平台白话替换经句</dd>
            </div>
            <div>
              <dt>编辑路标责任</dt>
              <dd>foxue.ai 编辑组；路标不是经文，当前尚未标注外部具名佛学审校</dd>
            </div>
            <div>
              <dt>英译关系边界</dt>
              <dd>Soothill 1930 为明确删节的历史英译，每关只连同品，不发布未经校勘的句对齐</dd>
            </div>
            <div>
              <dt>本次修订</dt>
              <dd><time dateTime={modifiedDate}>2026-09-15</time> · 新增七关路线、本地进度、研读笺、引文复制与来源账本</dd>
            </div>
            <div>
              <dt>完整性声明</dt>
              <dd>七关不是二十八品摘要；完成进度只表示走过界标，不表示完成全经研读</dd>
            </div>
          </dl>
          <div className="learning-editorial__actions">
            <Link href={fahuajingFullTextHref}>打开完整原典 <ArrowUpRight aria-hidden="true" /></Link>
            <a href="https://tripitaka.cbeta.org/T09n0262_002" target="_blank" rel="noreferrer">
              CBETA 原始版页 <ArrowUpRight aria-hidden="true" />
            </a>
            <a href="https://www.bdkamerica.org/product/the-lotus-sutra-revised-second-edition/" target="_blank" rel="noreferrer">
              BDK T0262 英译说明 <ArrowUpRight aria-hidden="true" />
            </a>
            <a href="https://reader.84000.co/7711a098-9c12-4bf6-aecf-0cae08f05026" target="_blank" rel="noreferrer">
              84000 藏译文本家族见证 <Languages aria-hidden="true" />
            </a>
            <Link href="/touming">查看来源与数据方法</Link>
          </div>
          <p className="learning-editorial__notice">
            <ShieldCheck aria-hidden="true" />
            在外部具名审校完成前，本站不会把这些编辑路标标为“权威解释”。
          </p>
        </section>
      </div>
    </div>
  );
}

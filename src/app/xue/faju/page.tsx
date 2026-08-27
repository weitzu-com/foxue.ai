import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpenText,
  CircleAlert,
  Fingerprint,
  Languages,
  Quote,
  Scale,
  SearchCheck,
  Sprout,
} from "lucide-react";
import {
  fajuComparisonBoundary,
  fajuStudySources,
} from "@/data/faju-study";
import {
  absoluteUrl,
  buildPageJsonLd,
  buildPageMetadata,
  serializeJsonLd,
} from "@/lib/site-metadata";
import styles from "../xue.module.css";

const title = "法句经研读｜汉译、巴利与 Müller 英译并读";
const description =
  "从《法句经》“心为法本”开始，并读汉译 T0210、巴利 Dhammapada 1–2 与 Müller 1881 英译；附稳定段号、来源、质量边界与研究说明。";
const pagePath = "/xue/faju";
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
    { name: "法句三源研读", path: pagePath },
  ],
  about: ["法句经", "Dhammapada", "巴利语", "佛典汉译", "F. Max Müller"],
  mainEntityId: `${absoluteUrl(pagePath)}#source-dossier`,
});

const learningResourceJsonLd = {
  "@context": "https://schema.org",
  "@type": "LearningResource",
  "@id": `${absoluteUrl(pagePath)}#source-dossier`,
  name: title,
  description,
  url: absoluteUrl(pagePath),
  inLanguage: ["zh-Hans", "zh-Hant", "pi", "en"],
  learningResourceType: "跨语种原典研读档案",
  educationalLevel: ["佛学入门", "佛典研究"],
  timeRequired: "PT30M",
  dateModified: modifiedDate,
  provider: { "@id": `${absoluteUrl("/")}#organization` },
  citation: fajuStudySources.flatMap((source) =>
    source.stanzas.map((stanza) => absoluteUrl(stanza.href)),
  ),
};

const readingLenses = [
  {
    icon: BookOpenText,
    number: "一",
    title: "静读",
    description: "先完整读完相邻的善、恶两组偈，不急着把“心”换成现代心理学术语。",
    prompt: "这一刻的言行，正被什么样的意向带领？",
  },
  {
    icon: Sprout,
    number: "二",
    title: "观照",
    description: "留意文本反复连接的三个环节：心意、言行，以及随之而来的苦乐。",
    prompt: "结果出现之前，是否有一个可以觉察和转向的地方？",
  },
  {
    icon: SearchCheck,
    number: "三",
    title: "校勘",
    description: "比较结构与意象，也同时记录语言、版本、编排和翻译年代的差异。",
    prompt: "我看到的是文本证据，还是自己熟悉的解释？",
  },
] as const;

export default function FajuStudyPage() {
  return (
    <div className={`${styles.studyPage} ${styles.fajuPage}`}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(pageJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(learningResourceJsonLd) }}
      />
      <div className={`page-shell ${styles.shell}`}>
        <nav className={styles.breadcrumb} aria-label="面包屑">
          <Link href="/xue"><ArrowLeft aria-hidden="true" /> 研读</Link>
          <span aria-hidden="true">/</span>
          <span>《法句》三源档案</span>
        </nav>

        <header className={styles.fajuHero}>
          <div className={styles.fajuHeroCopy}>
            <p className={styles.eyebrow}>法句 · THREE SOURCE DOSSIER</p>
            <h1>
              同一句熟悉的话，
              <br />
              先让<em>三份原文</em>各自站稳。
            </h1>
            <p className={styles.lead}>
              从汉译《法句经》“心为法本”出发，并读巴利《Dhammapada》开篇与 Müller 1881 英译。
              这不是自动对齐结果，而是一份可逐段复核的研读入口。
            </p>
            <ul className={styles.fajuHeroMeta} aria-label="档案范围">
              <li><Languages aria-hidden="true" /> 3 种语言表达</li>
              <li><Fingerprint aria-hidden="true" /> 6 组稳定引文</li>
              <li><Scale aria-hidden="true" /> 1 条明确比较边界</li>
            </ul>
          </div>

          <aside className={styles.fajuSpecimen} aria-label="《法句经》原文摘录">
            <div className={styles.specimenTopline}>
              <span>雙要品第九</span>
              <span>T0210 · 0562a</span>
            </div>
            <Quote aria-hidden="true" />
            <blockquote lang="zh-Hant">
              心為法本，心尊心使，
              <br />
              中心念善，即言即行，
              <br />
              福樂自追，如影隨形。
            </blockquote>
            <Link href="/jingzang/fajujing/001-0562a#T0210.001.0562a15">
              核对 T0210.001.0562a15–16 <ArrowRight aria-hidden="true" />
            </Link>
          </aside>
        </header>

        <section className={styles.lensSection} aria-labelledby="reading-lenses-title">
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>先决定怎样读</p>
              <h2 id="reading-lenses-title">一段法句，可以经过三次。</h2>
            </div>
            <p>第一次不急着解释，第二次带回身心，第三次才比较版本。三个动作可以分开，也可以往返。</p>
          </div>
          <ol className={styles.lensGrid}>
            {readingLenses.map((lens) => {
              const Icon = lens.icon;
              return (
                <li key={lens.number}>
                  <div><span>{lens.number}</span><Icon aria-hidden="true" /></div>
                  <h3>{lens.title}</h3>
                  <p>{lens.description}</p>
                  <blockquote>{lens.prompt}</blockquote>
                </li>
              );
            })}
          </ol>
        </section>

        <section
          className={styles.dossierSection}
          id="source-dossier"
          aria-labelledby="source-dossier-title"
        >
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>原典台 · PRIMARY SOURCES</p>
              <h2 id="source-dossier-title">三份文本，六个落点。</h2>
            </div>
            <p>点击每组引文下方的段号，会直接落到经藏中的相应原文，而不是只回到作品首页。</p>
          </div>

          <div className={styles.sourceGrid}>
            {fajuStudySources.map((source, sourceIndex) => (
              <article
                key={source.id}
                className={`${styles.sourceCard} ${styles[`sourceCard${source.id}`]}`}
              >
                <header>
                  <span>0{sourceIndex + 1}</span>
                  <div>
                    <p>{source.eyebrow}</p>
                    <h3>{source.title}</h3>
                    <small>{source.subtitle} · {source.language}</small>
                  </div>
                </header>

                <div className={styles.stanzaList}>
                  {source.stanzas.map((stanza) => (
                    <section key={stanza.locator}>
                      <div>
                        <strong>{stanza.label}</strong>
                        <Link href={stanza.href}>
                          {stanza.locator} <ArrowUpRight aria-hidden="true" />
                        </Link>
                      </div>
                      <blockquote lang={source.lang}>
                        {stanza.text.split("\n").map((line) => <span key={line}>{line}</span>)}
                      </blockquote>
                    </section>
                  ))}
                </div>

                <footer>
                  <p><strong>来源</strong>{source.sourceNote}</p>
                  <p><strong>质量</strong>{source.qualityNote}</p>
                  <Link href={source.workHref}>
                    打开完整作品 <ArrowRight aria-hidden="true" />
                  </Link>
                </footer>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.boundarySection} aria-labelledby="comparison-boundary-title">
          <div className={styles.boundaryStatement}>
            <Scale aria-hidden="true" />
            <p className={styles.eyebrow}>比较边界 · EDITORIAL NOTE</p>
            <h2 id="comparison-boundary-title">相近，不等于相同。</h2>
            <p>{fajuComparisonBoundary}</p>
          </div>
          <div className={styles.boundaryColumns}>
            <article>
              <small>依据本页证据，可以说</small>
              <ul>
                <li>三组材料都把心意、言行与苦乐后果组织在相近结构中。</li>
                <li>巴利 Dhp 1–2 与 Müller 第 1–2 偈属于原文与历史英译关系。</li>
                <li>汉译《法句经》可作为相关汉译传本独立阅读和研究。</li>
              </ul>
            </article>
            <article>
              <small>未经进一步校勘，不能说</small>
              <ul>
                <li>T0210 的每个汉字都能与巴利语逐词一一对应。</li>
                <li>Müller 的维多利亚时代措辞就是唯一或最终英文解释。</li>
                <li>本页的并置已经替代版本史、注疏学或人工对勘。</li>
              </ul>
            </article>
          </div>
        </section>

        <section className={styles.researchSection} aria-labelledby="research-method-title">
          <div>
            <p className={styles.eyebrow}>给研究者 · REPRODUCIBLE READING</p>
            <h2 id="research-method-title">从引文到判断，保留四步。</h2>
          </div>
          <ol>
            <li><span>01</span><div><strong>定位</strong><p>记录作品、版本、段号与永久链接。</p></div></li>
            <li><span>02</span><div><strong>读上下文</strong><p>至少向前、向后各读一组偈，不截句立论。</p></div></li>
            <li><span>03</span><div><strong>分层</strong><p>把原文、翻译、编辑提示与个人解释分别标注。</p></div></li>
            <li><span>04</span><div><strong>写边界</strong><p>公开尚未核对的版本与无法推出的结论。</p></div></li>
          </ol>
          <div className={styles.researchActions}>
            <Link href="/touming">查看语料与来源方法</Link>
            <a
              href="https://github.com/weitzu-com/foxue.ai/issues/new"
              target="_blank"
              rel="noreferrer"
            >
              提交校勘或引文问题 <ArrowUpRight aria-hidden="true" />
            </a>
          </div>
          <p className={styles.revisionNote}>
            <CircleAlert aria-hidden="true" />
            本页比较说明由 foxue.ai 编辑组整理，尚未标注外部具名佛学审校。修订日期：
            <time dateTime={modifiedDate}>2026-08-28</time>。
          </p>
        </section>
      </div>
    </div>
  );
}

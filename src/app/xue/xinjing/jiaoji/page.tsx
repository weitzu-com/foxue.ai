import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpenCheck,
  BookOpenText,
  Braces,
  CircleAlert,
  FileCheck2,
  Fingerprint,
  Languages,
  Microscope,
  Scale,
  ScrollText,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import apparatus from "@/data/xinjing-apparatus.json";
import {
  absoluteUrl,
  buildPageJsonLd,
  buildPageMetadata,
  serializeJsonLd,
} from "@/lib/site-metadata";
import styles from "./page.module.css";

const pagePath = "/xue/xinjing/jiaoji";
const pageTitle = "心经版本差异｜5组校记与异读证据";
const pageDescription =
  "逐条读懂玄奘译《心经》T0251 的 5 组 CBETA 校记：唐字有无、奘奉诏、帝与谛、般与波、莎婆等异读，并回到大正藏稳定行号与固定 TEI 来源。";

export const metadata: Metadata = buildPageMetadata({
  title: pageTitle,
  description: pageDescription,
  path: pagePath,
});

const notation = [
  {
    mark: "【大】",
    title: "先看见证，不先判胜负",
    description: "方括号说明某个读法见于哪个文本见证；【大】在本文件中指原大正藏读法。",
  },
  {
    mark: "〔－〕",
    title: "减号表示缺文",
    description: "“唐【大】，〔－〕【宋】”表示大正藏有“唐”，宋本在相应位置没有这个字。",
  },
  {
    mark: "＝",
    title: "等号记录另一读法",
    description: "大正藏原注用“帝＝諦【三】”压缩表示：三本在相应位置作“諦”。",
  },
  {
    mark: "＊",
    title: "星号提示后文复见",
    description: "同一组异读在咒语后面再次出现；不是星级、重点或正确答案标记。",
  },
] as const;

const readerLenses = [
  {
    icon: Sparkles,
    label: "佛教徒 · 读诵与受持",
    title: "遇见不同写法，不急着判谁念错",
    description:
      "先确认自己依止的课诵本或传统，再把站内文字连同版本一起引用。校记说明流传痕迹，不替代道场、师承或仪轨的读诵规范。",
  },
  {
    icon: Languages,
    label: "佛学爱好者 · 理解版本",
    title: "熟悉的句子，也有形成过程",
    description:
      "先区分经文、题署、音写和来源注，再观察哪些差异只改变书写，哪些会影响你对版本身份的描述。",
  },
  {
    icon: Microscope,
    label: "研究者 · 校读与引用",
    title: "把采用读法、异读与见证分开",
    description:
      "每一组都保留 note 编号、稳定行号、见证符号和固定来源指纹；页面仍不是代替底本图像与完整 TEI 的批判校勘本。",
  },
] as const;

const faqs = [
  {
    question: "出现异读，是否说明现在读到的《心经》是错的？",
    answer:
      "不能这样推断。校记先记录不同见证在相应位置写了什么；判断讹误、演变或采用哪一读法，还需要底本图像、版本关系和编辑原则。本站只呈现当前受控来源已经编码的证据。",
  },
  {
    question: "“莎婆”“僧莎”“薩婆”应该念哪一种？",
    answer:
      "本页不规定读诵发音。它只确认 T0251 的当前 CBETA 正文采用“莎婆”，原大正藏与宋元明见证另有写法。实际课诵请依所属传统、课诵本或具资格指导。",
  },
  {
    question: "这 5 组差异会改变《心经》的核心义理吗？",
    answer:
      "本页不作整体义理裁决。这里两组位于译者题署，三组位于咒语音写；这至少说明不能把它们直接当作“五蕴皆空”等正文命题的增删，但更大的文本史问题仍需另行研究。",
  },
  {
    question: "这是不是《心经》的完整校勘本？",
    answer:
      "不是。本页只覆盖 CBETA T0251 当前 TEI 文件中 5 组现代校注和 2 条相关大正藏原注；不替代七种汉译的逐本校勘、底本影像核查、梵藏材料或专业校勘成果。",
  },
] as const;

const pageJsonLdBase = buildPageJsonLd({
  path: pagePath,
  title: pageTitle,
  description: pageDescription,
  type: "WebPage",
  breadcrumb: [
    { name: "首页", path: "/" },
    { name: "研读", path: "/xue" },
    { name: "心经入门", path: "/xue/xinjing" },
    { name: "心经校记", path: pagePath },
  ],
  about: ["心经版本差异", "心经校记", "心经异读", "T0251", "CBETA", "大正藏"],
  mainEntityId: `${absoluteUrl(pagePath)}#apparatus`,
});

const pageJsonLd = {
  ...pageJsonLdBase,
  "@graph": [
    ...pageJsonLdBase["@graph"],
    {
      "@type": "LearningResource",
      "@id": `${absoluteUrl(pagePath)}#apparatus`,
      name: "玄奘译《心经》T0251 校记入门",
      description: pageDescription,
      url: absoluteUrl(pagePath),
      inLanguage: ["zh-Hans", "zh-Hant"],
      learningResourceType: "佛典校记证据书案",
      isBasedOn: {
        "@type": "DigitalDocument",
        name: apparatus.source.title,
        identifier: apparatus.source.canon,
        url: apparatus.source.sourceUrl,
        encodingFormat: "application/tei+xml",
      },
      hasPart: { "@id": `${absoluteUrl(pagePath)}#variants` },
      isPartOf: { "@id": `${absoluteUrl(pagePath)}#page` },
    },
    {
      "@type": "ItemList",
      "@id": `${absoluteUrl(pagePath)}#variants`,
      name: "T0251 五组 CBETA 校记",
      numberOfItems: apparatus.variants.length,
      itemListElement: apparatus.variants.map((variant, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: variant.title,
        description: variant.sourceNote,
        url: `${absoluteUrl(pagePath)}#note-${variant.id}`,
      })),
    },
    {
      "@type": "FAQPage",
      "@id": `${absoluteUrl(pagePath)}#questions`,
      mainEntity: faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: { "@type": "Answer", text: faq.answer },
      })),
    },
  ],
};

function MarkedExcerpt({ text, focus }: { text: string; focus: string }) {
  const parts = text.split(focus);
  return (
    <>
      {parts.map((part, index) => (
        <span key={`${part}-${index}`}>
          {part}
          {index < parts.length - 1 ? <mark>{focus}</mark> : null}
        </span>
      ))}
    </>
  );
}

export default function HeartSutraApparatusPage() {
  return (
    <div className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(pageJsonLd) }}
      />

      <div className={`page-shell ${styles.shell}`}>
        <nav className={styles.breadcrumb} aria-label="面包屑">
          <Link href="/">
            <ArrowLeft aria-hidden="true" /> 首页
          </Link>
          <span aria-hidden="true">/</span>
          <Link href="/xue">研读</Link>
          <span aria-hidden="true">/</span>
          <Link href="/xue/xinjing">《心经》</Link>
          <span aria-hidden="true">/</span>
          <span>校记</span>
        </nav>

        <header className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>文本见证 · TEXTUAL APPARATUS</p>
            <h1>
              同一部《心经》，
              <br />
              字旁还有一条<em>证据链。</em>
            </h1>
            <p className={styles.lead}>
              站内正文给你一个可读文本；校记说明这个文本为什么这样写、其他见证又怎样写。
              先不争“唯一正确”，先把 5 组差异放回原行、版本和来源。
            </p>
            <div className={styles.heroActions}>
              <a href="#variants">
                逐条看 5 组异读 <ArrowRight aria-hidden="true" />
              </a>
              <Link href={apparatus.source.readerHref}>
                打开 T0251 原文 <BookOpenText aria-hidden="true" />
              </Link>
            </div>
          </div>

          <aside className={styles.specimen} aria-label="心经校记示例">
            <div className={styles.specimenHeader}>
              <span>大正藏 T0251 · 0848c</span>
              <small>朱批处有异读</small>
            </div>
            <div className={styles.specimenLine}>
              <span className={styles.lineNumber}>05</span>
              <p lang="zh-Hant"><mark>唐</mark>三藏法師玄<mark>奘</mark>譯</p>
              <small>宋本缺“唐”；三本多“奉詔”</small>
            </div>
            <div className={styles.specimenLine}>
              <span className={styles.lineNumber}>21</span>
              <p lang="zh-Hant">揭帝　揭<mark>帝</mark>　<mark>般</mark>羅揭帝</p>
              <small>諦【宋元明】 · 波【宋元明】</small>
            </div>
            <div className={styles.specimenLine}>
              <span className={styles.lineNumber}>22</span>
              <p lang="zh-Hant">菩提　<mark>莎婆</mark>訶</p>
              <small>僧莎【大】 · 薩婆【宋元明】</small>
            </div>
            <p className={styles.specimenBoundary}>
              <ShieldCheck aria-hidden="true" /> 校记记录见证，不自动裁定教义或读诵规范。
            </p>
          </aside>
        </header>

        <section className={styles.sourceStrip} aria-label="本页证据范围">
          <div><strong>{apparatus.variants.length}</strong><span>组 CBETA 现代校注</span></div>
          <div><strong>{apparatus.sourceNotes.length}</strong><span>条大正藏原注</span></div>
          <div><strong>{apparatus.witnesses.length}</strong><span>个来源见证标记</span></div>
          <div><strong>1</strong><span>份固定 TEI 源文件</span></div>
        </section>

        <section className={styles.firstPrinciples} aria-labelledby="first-principles-title">
          <div className={styles.sectionIntro}>
            <p className={styles.eyebrow}>先弄清它解决什么</p>
            <h2 id="first-principles-title">校记不是经文旁的杂音，而是“这几个字从哪里来”的回答。</h2>
          </div>
          <div className={styles.principleFlow}>
            <article>
              <BookOpenCheck aria-hidden="true" />
              <span>01</span>
              <h3>正文负责可读</h3>
              <p>你先看到编辑后采用的一种连续文字，能够读诵、检索和引用。</p>
            </article>
            <article>
              <Braces aria-hidden="true" />
              <span>02</span>
              <h3>校记负责显露选择</h3>
              <p>同一位置若有缺文、增文或另一写法，校记把见证和采用读法分开。</p>
            </article>
            <article>
              <Fingerprint aria-hidden="true" />
              <span>03</span>
              <h3>坐标负责让人复查</h3>
              <p>每组差异都回到 T0251 稳定行号；来源版本和文件指纹也公开。</p>
            </article>
          </div>
        </section>

        <section className={styles.notationSection} aria-labelledby="notation-title">
          <div className={styles.sectionIntro}>
            <p className={styles.eyebrow}>四个符号就能开始</p>
            <h2 id="notation-title">先学会读校记，再讨论哪一种读法。</h2>
            <p>下列说明只解码本页实际出现的符号，不把一页入门说明冒充完整校勘学教程。</p>
          </div>
          <dl className={styles.notationGrid}>
            {notation.map((item) => (
              <div key={item.mark}>
                <dt>{item.mark}</dt>
                <dd>
                  <strong>{item.title}</strong>
                  <span>{item.description}</span>
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section className={styles.variantsSection} id="variants" aria-labelledby="variants-title">
          <div className={styles.sectionIntro}>
            <p className={styles.eyebrow}>逐条校读 · FIVE NOTES</p>
            <h2 id="variants-title">5 组异读，先看“谁这样写”。</h2>
            <p>
              红字是当前站内正文采用的文字；下方各栏照录 CBETA 校注，不将“并列见证”改写成平台裁决。
            </p>
          </div>

          <ol className={styles.variantList}>
            {apparatus.variants.map((variant, index) => (
              <li key={variant.id} id={`note-${variant.id}`}>
                <article>
                  <header>
                    <div>
                      <span className={styles.noteNumber}>0{index + 1}</span>
                      <small>{variant.category} · NOTE {variant.id}</small>
                    </div>
                    <Link href={variant.href}>
                      {variant.locator} <ArrowUpRight aria-hidden="true" />
                    </Link>
                  </header>

                  <div className={styles.variantBody}>
                    <div className={styles.variantExcerpt}>
                      <span>当前正文</span>
                      <blockquote lang="zh-Hant">
                        <MarkedExcerpt text={variant.readerExcerpt} focus={variant.focus} />
                      </blockquote>
                      <small>{variant.location}</small>
                    </div>
                    <div className={styles.variantExplanation}>
                      <h3>{variant.title}</h3>
                      <p>{variant.summary}</p>
                      <code lang="zh-Hant">{variant.sourceNote}</code>
                    </div>
                  </div>

                  <div className={styles.readingGrid} aria-label={`${variant.title}的见证读法`}>
                    {variant.readings.map((reading) => (
                      <div key={`${variant.id}-${reading.text}`} data-kind={reading.kind}>
                        <span>{reading.kind === "reader" ? "站内采用" : "异读"}</span>
                        <strong lang="zh-Hant">{reading.text}</strong>
                        <small>{reading.witnesses.join(" ")}</small>
                      </div>
                    ))}
                  </div>

                  <p className={styles.noteBoundary}>
                    <Scale aria-hidden="true" /> {variant.boundary}
                  </p>
                </article>
              </li>
            ))}
          </ol>
        </section>

        <section className={styles.witnessSection} aria-labelledby="witness-title">
          <div className={styles.sectionIntro}>
            <p className={styles.eyebrow}>见证图例 · WITNESS LEGEND</p>
            <h2 id="witness-title">符号指向来源，不代表高下排名。</h2>
          </div>
          <dl className={styles.witnessGrid}>
            {apparatus.witnesses.map((witness) => (
              <div key={witness.id}>
                <dt lang="zh-Hant">{witness.code}</dt>
                <dd>
                  <strong>{witness.label}</strong>
                  <span>{witness.description}</span>
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section className={styles.originalNotes} aria-labelledby="original-notes-title">
          <div className={styles.originalNotesLead}>
            <ScrollText aria-hidden="true" />
            <p className={styles.eyebrow}>不属于异读的两条原注</p>
            <h2 id="original-notes-title">来源注也保留，但不混进“5 组异读”。</h2>
            <p>
              T0251 还在经题与咒语处保留两条大正藏原注。它们补充梵语信息，功能不同于列举汉字见证的校记。
            </p>
          </div>
          <ol>
            {apparatus.sourceNotes.map((note) => (
              <li key={note.id}>
                <div>
                  <small>NOTE {note.id}</small>
                  <h3>{note.title}</h3>
                  <p lang="sa-Latn">{note.text}</p>
                </div>
                <div>
                  <p>{note.purpose}</p>
                  <Link href={note.href}>
                    回到 {note.locator} <ArrowUpRight aria-hidden="true" />
                  </Link>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className={styles.lensesSection} aria-labelledby="lenses-title">
          <div className={styles.sectionIntro}>
            <p className={styles.eyebrow}>三种读者，三种用法</p>
            <h2 id="lenses-title">校记不是只给专家看的，也不能只凭直觉使用。</h2>
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

        <section className={styles.provenance} aria-labelledby="provenance-title">
          <div className={styles.provenanceHeading}>
            <FileCheck2 aria-hidden="true" />
            <p className={styles.eyebrow}>来源、版本与边界</p>
            <h2 id="provenance-title">能复查，才算把校记交到读者手里。</h2>
          </div>
          <dl>
            <div>
              <dt>固定来源</dt>
              <dd>CBETA XML P5 · {apparatus.source.canon} · 目录发行 {apparatus.source.catalogVersion}</dd>
            </div>
            <div>
              <dt>上游提交</dt>
              <dd><code>{apparatus.source.upstreamCommit}</code></dd>
            </div>
            <div>
              <dt>本地文件 SHA-256</dt>
              <dd><code>{apparatus.source.localSha256}</code></dd>
            </div>
            <div>
              <dt>源文件日期</dt>
              <dd><time dateTime={apparatus.source.sourceUpdatedAt}>{apparatus.source.sourceUpdatedAt}</time></dd>
            </div>
          </dl>
          <div className={styles.boundaryBox}>
            <CircleAlert aria-hidden="true" />
            <p>
              <strong>覆盖边界：</strong>
              本页只转写当前固定 TEI 中的 5 组 CBETA 现代校注与 2 条相关大正藏原注；
              未核对纸本影像，也不宣称完成七译、梵本、藏译或历代刻本的全面校勘。
            </p>
          </div>
          <div className={styles.provenanceActions}>
            <a href={apparatus.source.sourceUrl} target="_blank" rel="noreferrer">
              打开 CBETA 来源页 <ArrowUpRight aria-hidden="true" />
            </a>
            <Link href="/touming">查看全站来源方法</Link>
          </div>
        </section>

        <section className={styles.faqSection} id="questions" aria-labelledby="questions-title">
          <div className={styles.sectionIntro}>
            <p className={styles.eyebrow}>常见问题 · QUESTIONS</p>
            <h2 id="questions-title">看见差异之后，先守住四条边界。</h2>
          </div>
          <div className={styles.faqList}>
            {faqs.map((faq, index) => (
              <article key={faq.question}>
                <span>0{index + 1}</span>
                <div>
                  <h3>{faq.question}</h3>
                  <p>{faq.answer}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.nextSection} aria-labelledby="next-title">
          <div>
            <p className={styles.eyebrow}>下一步 · KEEP THE DIFFERENCE</p>
            <h2 id="next-title">读一部经，也读清它是哪一个文本。</h2>
            <p>继续时可以选择慢读 T0251、并排七种汉译，或把一处异读带进自己的研究证据矩阵。</p>
          </div>
          <div className={styles.nextLinks}>
            <Link href="/xue/xinjing">
              <BookOpenText aria-hidden="true" /> 《心经》七日慢读 <ArrowRight aria-hidden="true" />
            </Link>
            <Link href="/duidu/xinjing">
              <Languages aria-hidden="true" /> 七译同屏对读 <ArrowRight aria-hidden="true" />
            </Link>
            <Link href="/yanjiu">
              <Microscope aria-hidden="true" /> 建立证据矩阵 <ArrowRight aria-hidden="true" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

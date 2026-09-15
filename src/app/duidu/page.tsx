import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpenText,
  Braces,
  Columns2,
  Fingerprint,
  Languages,
  LibraryBig,
  Scale,
  ScrollText,
} from "lucide-react";
import { getWorkExpressionGroup } from "@/data/sutras";
import {
  absoluteUrl,
  buildPageJsonLd,
  buildPageMetadata,
  serializeJsonLd,
} from "@/lib/site-metadata";
import styles from "./page.module.css";

const pagePath = "/duidu";
const pageTitle = "佛经异译与跨本对读｜可核验原典书案";
const pageDescription =
  "面向佛教徒、佛学爱好者与研究者的佛经对读入口：并读《心经》《金刚经》《阿弥陀经》的已核验文本表达，每一段回到版本与稳定原典坐标。";

export const metadata: Metadata = buildPageMetadata({
  title: pageTitle,
  description: pageDescription,
  path: pagePath,
});

const dossiers = [
  {
    number: "01",
    seal: "心",
    rootSlug: "xinjing",
    workId: "gbcr:work:prajnaparamita-hrdaya",
    expectedGroupCount: 7,
    relation: "同作品 · 全文并排",
    title: "《心经》七种汉译异译对读",
    description:
      "七种已审核汉译各自完整展开。适合先感受篇幅、用词与责任题记怎样变化，再从任一行回到底本上下文。",
    question: "同一个作品，可以怎样保留七种不同声音？",
    metrics: ["7 种汉译", "全文可读", "0 自动对齐"],
    boundary: "左右位置只用于并读，不表示两行互为译句。",
    href: "/duidu/xinjing",
    action: "打开七译全文",
    studyHref: "/xue/xinjing",
    studyLabel: "先走七日研读",
    tone: "heart",
  },
  {
    number: "02",
    seal: "金",
    rootSlug: "jingangjing",
    workId: "gbcr:work:vajracchedika-prajnaparamita",
    expectedGroupCount: 7,
    relation: "同作品 · 主题关口",
    title: "《金刚经》六种汉译与英译主题对读",
    description:
      "从发心、四相、不住、筏喻到结偈的七个问题进入六种汉译与一份历史英译，观察各本在哪里说、怎样说。",
    question: "熟悉的名句，放回其他译本还会一样吗？",
    metrics: ["7 种表达", "7 个关口", "0 现代合译"],
    boundary: "主题同现只建立阅读入口，不证明逐句或逐词等值。",
    href: "/duidu/jingangjing",
    action: "从第一问开始",
    studyHref: "/xue/jingangjing",
    studyLabel: "先读通行本七段",
    tone: "diamond",
  },
  {
    number: "03",
    seal: "願",
    rootSlug: "amituojing",
    workId: "gbcr:work:smaller-sukhavati-vyuha-t0366",
    expectedGroupCount: 3,
    relation: "同作品 · 双译修学",
    title: "《阿弥陀经》鸠摩罗什译与玄奘译双读",
    description:
      "沿说法处、极乐释名、念三宝、光寿无量、发愿、持名与难信之法，逐关并读两种古汉译的相关段落。",
    question: "信、愿、持的修学语境，在两译中怎样展开？",
    metrics: ["2 种古汉译", "7 个关口", "0 综合改写"],
    boundary: "相关段落由人工核验，但不制造行与行的自动对应。",
    href: "/duidu/amituojing",
    action: "打开双译七关",
    studyHref: "/xue/amituojing",
    studyLabel: "先走七日净读",
    tone: "pureland",
  },
] as const;

const readerRoutes = [
  {
    icon: BookOpenText,
    label: "佛教徒 · 从修学进入",
    title: "先读原句，再观察另一译怎样照见它。",
    description: "不把差异当作胜负，也不让工具打断读诵；需要比较时再打开第二种声音。",
    href: "/duidu/amituojing",
    action: "从《阿弥陀经》双译开始",
  },
  {
    icon: Languages,
    label: "佛学爱好者 · 从问题进入",
    title: "看见熟悉译文之外，还有哪些表达可能。",
    description: "从一部熟悉的经开始，观察篇幅、译语和结构差异，再回到完整文本理解语境。",
    href: "/duidu/xinjing",
    action: "从《心经》七译开始",
  },
  {
    icon: Fingerprint,
    label: "研究者 · 从证据进入",
    title: "让每一项比较都带着版本、责任与坐标。",
    description: "把对读当作发现问题的入口；判断仍须回到各本全文、版本信息与可复核引用。",
    href: "/duidu/jingangjing",
    action: "从《金刚经》七关口开始",
  },
] as const;

const method = [
  {
    icon: Fingerprint,
    title: "先确认关系",
    description: "只有作品关系与表达身份已经进入受控目录，文本才进入对读书案。",
  },
  {
    icon: Columns2,
    title: "再并排阅读",
    description: "全文、相关段或主题窗口各自明示，不用版面位置暗示逐句等值。",
  },
  {
    icon: ScrollText,
    title: "回到底本",
    description: "每一个可引用片段都保留版本、经号与稳定坐标，随时打开前后文。",
  },
  {
    icon: Scale,
    title: "把判断留给人",
    description: "平台不拼接现代合译，不替传统与研究者消除真实存在的差异。",
  },
] as const;

function verifyDossierRelationships() {
  for (const dossier of dossiers) {
    const group = getWorkExpressionGroup(dossier.rootSlug);
    if (
      !group ||
      group.workId !== dossier.workId ||
      group.expressions.length !== dossier.expectedGroupCount
    ) {
      throw new Error(`${dossier.rootSlug} 对读作品关系已变化，须重新审核总入口`);
    }
  }
}

const pageJsonLdBase = buildPageJsonLd({
  path: pagePath,
  title: pageTitle,
  description: pageDescription,
  type: "CollectionPage",
  breadcrumb: [
    { name: "首页", path: "/" },
    { name: "对读", path: pagePath },
  ],
  about: ["佛经异译", "佛经版本对读", "文本表达", "稳定原典坐标", "数字佛学研究"],
  mainEntityId: `${absoluteUrl(pagePath)}#dossiers`,
});

const pageJsonLd = {
  ...pageJsonLdBase,
  "@graph": [
    ...(pageJsonLdBase["@graph"] as Array<Record<string, unknown>>),
    {
      "@type": "ItemList",
      "@id": `${absoluteUrl(pagePath)}#dossiers`,
      name: "已发布的佛经对读书案",
      numberOfItems: dossiers.length,
      itemListElement: dossiers.map((dossier, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: dossier.title,
        description: dossier.boundary,
        url: absoluteUrl(dossier.href),
      })),
    },
  ],
};

export default function ComparisonHubPage() {
  verifyDossierRelationships();

  return (
    <div className={styles.page} data-comparison-hub>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(pageJsonLd) }}
      />
      <div className={`page-shell ${styles.shell}`}>
        <nav className={styles.breadcrumb} aria-label="面包屑">
          <Link href="/">首页</Link>
          <span aria-hidden="true">/</span>
          <span>对读</span>
        </nav>

        <header className={styles.hero}>
          <div className={styles.heroCopy}>
            <p>佛经对读 · VERIFIED COMPARISON DESK</p>
            <h1>并读，不是把差异<br /><em>磨成同一句。</em></h1>
            <p>
              同一部经可以留下不同译语，相关传统也可以彼此照见。这里先确认文本关系，
              再把每一段放回自己的版本、责任题记与稳定坐标。
            </p>
            <div className={styles.heroActions}>
              <a href="#dossiers"><LibraryBig aria-hidden="true" /> 查看三份书案</a>
              <Link href="/xue">先从单本研读开始</Link>
            </div>
          </div>

          <aside className={styles.archiveMap} aria-label="三份已核验对读书案">
            <div className={styles.archiveTopline}>
              <span>开放书案</span>
              <code>03 / VERIFIED</code>
            </div>
            <ol>
              {dossiers.map((dossier) => (
                <li key={dossier.href}>
                  <span aria-hidden="true">{dossier.seal}</span>
                  <div>
                    <small>{dossier.number} · {dossier.relation}</small>
                    <strong>{dossier.title.replace(/《|》/g, "")}</strong>
                  </div>
                </li>
              ))}
            </ol>
            <p><Braces aria-hidden="true" /> 自动逐句对齐：0</p>
          </aside>
        </header>

        <section className={styles.readerSection} aria-labelledby="reader-routes-title">
          <header className={styles.sectionHeading}>
            <div>
              <p>三种身份，不是三个等级</p>
              <h2 id="reader-routes-title">今天想怎样读，就从哪里进入。</h2>
            </div>
            <p>对读不是研究者专属。修学者可以慢读，爱好者可以辨义，研究者可以核引；三者都从原句开始。</p>
          </header>
          <div className={styles.readerGrid}>
            {readerRoutes.map((route) => {
              const Icon = route.icon;
              return (
                <article key={route.label}>
                  <Icon aria-hidden="true" />
                  <small>{route.label}</small>
                  <h3>{route.title}</h3>
                  <p>{route.description}</p>
                  <Link href={route.href}>{route.action} <ArrowRight aria-hidden="true" /></Link>
                </article>
              );
            })}
          </div>
        </section>

        <section className={styles.dossierSection} id="dossiers" aria-labelledby="dossiers-title">
          <header className={styles.sectionHeading}>
            <div>
              <p>已核验书案 · OPEN DOSSIERS</p>
              <h2 id="dossiers-title">三部经，三种诚实的比较方式。</h2>
            </div>
            <p>每份书案都说明纳入什么、怎样选择片段，以及哪些结论不能由页面布局自动推出。</p>
          </header>

          <div className={styles.dossierList}>
            {dossiers.map((dossier) => (
              <article
                key={dossier.href}
                className={styles[dossier.tone]}
                data-comparison-dossier={dossier.rootSlug}
              >
                <header>
                  <span>{dossier.number}</span>
                  <small>{dossier.relation}</small>
                  <i aria-hidden="true">{dossier.seal}</i>
                </header>
                <div className={styles.dossierBody}>
                  <div>
                    <p>{dossier.question}</p>
                    <h3>{dossier.title}</h3>
                    <p>{dossier.description}</p>
                    <ul>
                      {dossier.metrics.map((metric) => <li key={metric}>{metric}</li>)}
                    </ul>
                  </div>
                  <aside>
                    <strong><Scale aria-hidden="true" /> 这一案停在哪里</strong>
                    <p>{dossier.boundary}</p>
                    <code>{dossier.workId}</code>
                  </aside>
                </div>
                <footer>
                  <Link href={dossier.href}>
                    {dossier.action} <ArrowRight aria-hidden="true" />
                  </Link>
                  <Link href={dossier.studyHref}>{dossier.studyLabel}</Link>
                </footer>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.methodSection} aria-labelledby="comparison-method-title">
          <header>
            <p>对读契约 · COMPARISON CONTRACT</p>
            <h2 id="comparison-method-title">比较可以更深，<br />证据边界不能更松。</h2>
          </header>
          <ol>
            {method.map((item, index) => {
              const Icon = item.icon;
              return (
                <li key={item.title}>
                  <span>0{index + 1}</span>
                  <Icon aria-hidden="true" />
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </li>
              );
            })}
          </ol>
        </section>

        <section className={styles.nextSection} aria-labelledby="comparison-next-title">
          <div>
            <p>发现差异以后 · KEEP READING</p>
            <h2 id="comparison-next-title">对读提出问题，<br />全文与证据继续回答。</h2>
          </div>
          <div>
            <Link href="/jingzang">去经藏读完整底本 <ArrowRight aria-hidden="true" /></Link>
            <Link href="/xue">按研读路径慢读一部经</Link>
            <Link href="/yanjiu">把稳定坐标带入研究工作台</Link>
          </div>
        </section>
      </div>
    </div>
  );
}

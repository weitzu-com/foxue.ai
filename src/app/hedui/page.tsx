import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BookOpenCheck, Braces, FileWarning, ScanSearch } from "lucide-react";
import { buildPageJsonLd, buildPageMetadata, serializeJsonLd } from "@/lib/site-metadata";
import { QuoteVerifier } from "./quote-verifier";
import styles from "./page.module.css";

const pageTitle = "佛经名句与“佛说”语录出处核对";
const pageDescription =
  "核对一句常见佛学说法是否能在已复核佛经底本中找到原句；区分逐字出处、近似转述与当前证据不足，并直达稳定行段。";

export const metadata: Metadata = buildPageMetadata({
  title: pageTitle,
  description: pageDescription,
  path: "/hedui",
});

const pageJsonLd = buildPageJsonLd({
  path: "/hedui",
  title: pageTitle,
  description: pageDescription,
  breadcrumb: [
    { name: "首页", path: "/" },
    { name: "核对说法", path: "/hedui" },
  ],
  about: ["佛经名句出处", "佛说语录辨伪", "佛经原文核对", "稳定行段引用"],
});

const method = [
  {
    number: "01",
    icon: Braces,
    title: "先拆掉表面差异",
    text: "只忽略繁简、标点与空格；不会把意思相近自动判成同一句。",
  },
  {
    number: "02",
    icon: ScanSearch,
    title: "再比对受控原句",
    text: "首批条目逐字取自站内 CBETA 底本，并登记经名、译者、经号与行段。",
  },
  {
    number: "03",
    icon: BookOpenCheck,
    title: "结果必须能打开",
    text: "命中不是终点；每条证据都直达原典阅读器，继续检查前后文。",
  },
  {
    number: "04",
    icon: FileWarning,
    title: "没证据就停下",
    text: "未命中只表示当前受控范围不足，不能反过来宣判所有佛典都没有。",
  },
];

export default function QuoteCheckPage() {
  return (
    <div className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(pageJsonLd) }}
      />
      <div className="page-shell">
        <div className={styles.breadcrumb}>
          <Link href="/"><ArrowLeft aria-hidden="true" /> 首页</Link>
          <span>/</span>
          <span>核对说法</span>
        </div>

        <header className={styles.hero}>
          <div>
            <p className={styles.eyebrow}>核对说法 · VERIFY A QUOTE</p>
            <h1>先别问像不像佛法，<br /><em>先问原文在哪里。</em></h1>
            <p className={styles.lead}>
              一句话听起来有智慧，不等于它出自佛经。这里先核对文字与出处，
              再让佛教徒安心引用、爱好者看懂语境、研究者追到稳定行段。
            </p>
          </div>
          <aside className={styles.heroDossier} aria-label="核验契约">
            <span className={styles.dossierStamp}>核</span>
            <p>核验契约</p>
            <strong>原句、转述、未知<br />必须分开。</strong>
            <dl>
              <div><dt>首批条目</dt><dd>5</dd></div>
              <div><dt>逐字定位</dt><dd>5 / 5</dd></div>
              <div><dt>上传问题</dt><dd>0</dd></div>
            </dl>
            <small>受控原型 · 范围会公开扩展</small>
          </aside>
        </header>

        <QuoteVerifier />

        <section className={styles.method} aria-labelledby="method-title">
          <div className={styles.methodHeading}>
            <div>
              <p className={styles.eyebrow}>第一性原理 · FIRST PRINCIPLES</p>
              <h2 id="method-title">不是判断“有无禅意”，<br />而是检查证据链。</h2>
            </div>
            <p>
              文字归属是可核验的问题：输入是什么、底本写什么、定位在哪里、结论边界到哪一步，
              都应当让读者自己复查。
            </p>
          </div>
          <div className={styles.methodGrid}>
            {method.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.number}>
                  <div><span>{item.number}</span><Icon aria-hidden="true" /></div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookOpenText,
  CalendarDays,
  Compass,
  Fingerprint,
  Layers3,
  ShieldCheck,
} from "lucide-react";
import {
  dailyScripturePassages,
  dailyScriptureSeries,
} from "@/data/daily-scripture";
import {
  absoluteUrl,
  buildPageJsonLd,
  buildPageMetadata,
  serializeJsonLd,
} from "@/lib/site-metadata";
import styles from "./page.module.css";

const pagePath = "/xue/meiri";
const pageTitle = "每日佛经原典｜30段静读、理解与核对";
const pageDescription =
  "30段可核验佛经原典月读：从阿含、心经、金刚经、法句经、阿弥陀经到法华经；每段分开静读练习、理解提示与版本核对，并直达稳定行号。";

export const metadata: Metadata = buildPageMetadata({
  title: pageTitle,
  description: pageDescription,
  path: pagePath,
});

const pageJsonLdBase = buildPageJsonLd({
  path: pagePath,
  title: pageTitle,
  description: pageDescription,
  type: "CollectionPage",
  breadcrumb: [
    { name: "首页", path: "/" },
    { name: "研读", path: "/xue" },
    { name: "每日原典", path: pagePath },
  ],
  about: ["每日佛经", "佛经原典", "佛经入门", "佛经静读", "佛经引用", "佛典版本"],
  mainEntityId: `${absoluteUrl(pagePath)}#passages`,
});

const pageJsonLd = {
  ...pageJsonLdBase,
  "@graph": [
    ...(pageJsonLdBase["@graph"] as Array<Record<string, unknown>>),
    {
      "@type": "ItemList",
      "@id": `${absoluteUrl(pagePath)}#passages`,
      name: "三十段可核验每日原典",
      numberOfItems: dailyScripturePassages.length,
      itemListElement: dailyScripturePassages.map((passage, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: `${passage.workTitle} · ${passage.locator}`,
        url: `${absoluteUrl(pagePath)}#${passage.id}`,
      })),
    },
  ],
};

const audienceLenses = [
  {
    icon: Compass,
    label: "佛教徒 · 静读",
    title: "先让一句原文停下来",
    text: "练习只帮助回到当下，不冒充经文，也不替代法师、师承与现实处境中的判断。",
  },
  {
    icon: BookOpenText,
    label: "佛学爱好者 · 理解",
    title: "把一句话放回上下文",
    text: "知道它在回答什么、前后还说了什么，不让熟悉名句脱离文本变成万能口号。",
  },
  {
    icon: Fingerprint,
    label: "研究者 · 核对",
    title: "保留译者、版本与坐标",
    text: "每段直达固定底本行号；不同译本与相关文本可以并读，但不会被悄悄抹平成同一句。",
  },
] as const;

const uniqueWorkCount = new Set(
  dailyScripturePassages.map((passage) => passage.workTitle),
).size;

export default function DailyScriptureCollectionPage() {
  return (
    <div className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(pageJsonLd) }}
      />
      <div className={`page-shell ${styles.shell}`}>
        <nav className={styles.breadcrumb} aria-label="面包屑">
          <Link href="/xue"><ArrowLeft aria-hidden="true" /> 研读</Link>
          <span aria-hidden="true">/</span>
          <span>每日原典</span>
        </nav>

        <header className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>每日原典 · THIRTY SOURCE PASSAGES</p>
            <h1>
              三十段，
              <br />不规定一种<em>唯一读法。</em>
            </h1>
            <p className={styles.lead}>
              不必先决定自己属于哪一宗，也不必把大藏经从头读起。
              每天只选一段：先读原句，再看理解边界，最后留下能重新打开的版本坐标。
            </p>
            <div className={styles.heroActions}>
              <a href="#passages">从第一段开始 <ArrowRight aria-hidden="true" /></a>
              <Link href="/jingzang/quanwen">自己查一句经文</Link>
            </div>
          </div>

          <aside className={styles.monthSeal} aria-label="三十段原典范围">
            <div className={styles.sealNumber}>30</div>
            <div className={styles.sealLabel}>
              <span>一月可读</span>
              <strong>不是连续打卡</strong>
            </div>
            <dl>
              <div><dt>阅读组</dt><dd>{dailyScriptureSeries.length}</dd></div>
              <div><dt>作品</dt><dd>{uniqueWorkCount}</dd></div>
              <div><dt>稳定引文</dt><dd>{dailyScripturePassages.length}</dd></div>
            </dl>
            <p>漏一天不归零。每次回来，都从一段完整出处重新开始。</p>
          </aside>
        </header>

        <section className={styles.lenses} aria-labelledby="three-lenses-title">
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>同一句，三种进入方式</p>
              <h2 id="three-lenses-title">身份不是等级，读法可以切换。</h2>
            </div>
            <p>
              静读、理解、核对都围绕同一段底本展开。平台提示始终退到原文之后，
              让修持经验、兴趣理解与学术复核不必彼此排斥。
            </p>
          </div>
          <div className={styles.lensGrid}>
            {audienceLenses.map((lens) => {
              const Icon = lens.icon;
              return (
                <article key={lens.label}>
                  <Icon aria-hidden="true" />
                  <small>{lens.label}</small>
                  <h3>{lens.title}</h3>
                  <p>{lens.text}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className={styles.collection} id="passages" aria-labelledby="passages-title">
          <div className={styles.collectionIntro}>
            <div>
              <p className={styles.eyebrow}>月读卷 · SOURCE MONTH</p>
              <h2 id="passages-title">六组原典，三十个可重开的落点。</h2>
            </div>
            <p>
              编号只是让人容易回来，不代表教义高下或历史先后。
              想顺读可以从 01 开始；已有所学，也可以直接进入相应经典。
            </p>
          </div>

          {dailyScriptureSeries.map((series) => {
            const passages = dailyScripturePassages.filter(
              (passage) => passage.series === series.id,
            );
            return (
              <section
                className={styles.series}
                key={series.id}
                aria-labelledby={`series-${series.id}`}
                data-daily-series={series.id}
              >
                <header className={styles.seriesHeader}>
                  <span>{series.number}</span>
                  <div>
                    <p>{series.label}</p>
                    <h3 id={`series-${series.id}`}>{series.title}</h3>
                  </div>
                  <p>{series.description}</p>
                </header>

                <ol className={styles.passageList}>
                  {passages.map((passage) => {
                    const dayNumber = dailyScripturePassages.findIndex(
                      (item) => item.id === passage.id,
                    ) + 1;
                    return (
                      <li
                        id={passage.id}
                        key={passage.id}
                        className={styles.passage}
                        data-daily-passage={passage.id}
                      >
                        <article>
                          <header>
                            <span>DAY {String(dayNumber).padStart(2, "0")}</span>
                            <small>{passage.collection}</small>
                          </header>
                          <blockquote lang={passage.lang}>“{passage.quote}”</blockquote>
                          <div className={styles.sourceLine}>
                            <strong>{passage.workTitle}</strong>
                            <span>{passage.witness}</span>
                            <code>{passage.locator}</code>
                          </div>

                          <details className={styles.readingLayers}>
                            <summary>
                              <Layers3 aria-hidden="true" /> 展开静读、理解与核对
                            </summary>
                            <dl>
                              <div>
                                <dt><Compass aria-hidden="true" /> 静读</dt>
                                <dd>{passage.quietPrompt}</dd>
                              </div>
                              <div>
                                <dt><BookOpenText aria-hidden="true" /> 理解</dt>
                                <dd>{passage.context}</dd>
                              </div>
                              <div>
                                <dt><Fingerprint aria-hidden="true" /> 核对</dt>
                                <dd>{passage.verification}</dd>
                              </div>
                            </dl>
                          </details>

                          <footer>
                            <Link href={passage.sourceHref} prefetch={false}>
                              打开原典 <ArrowRight aria-hidden="true" />
                            </Link>
                            <Link href={passage.studyHref}>{passage.studyLabel}</Link>
                          </footer>
                        </article>
                      </li>
                    );
                  })}
                </ol>
              </section>
            );
          })}
        </section>

        <section className={styles.contract} aria-labelledby="daily-contract-title">
          <div>
            <CalendarDays aria-hidden="true" />
            <p className={styles.eyebrow}>月读约定</p>
            <h2 id="daily-contract-title">每天一段，不把修学变成数字焦虑。</h2>
          </div>
          <ul>
            <li><strong>可以跳读</strong><span>次序是导航，不是宗派判教。</span></li>
            <li><strong>可以停下</strong><span>读不懂时先保留问题，不制造即时答案。</span></li>
            <li><strong>可以带走</strong><span>每段都有版本、行号与永久原典入口。</span></li>
          </ul>
          <Link href="/shufang">
            <ShieldCheck aria-hidden="true" /> 把选文与研读笺留在本地书房
          </Link>
        </section>
      </div>
    </div>
  );
}

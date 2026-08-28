import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpenText,
  CircleAlert,
  Clock3,
  Download,
  Fingerprint,
  Languages,
  LibraryBig,
  NotebookPen,
  Route,
  Scale,
  Search,
  ShieldCheck,
} from "lucide-react";
import {
  absoluteUrl,
  buildPageJsonLd,
  buildPageMetadata,
  serializeJsonLd,
} from "@/lib/site-metadata";
import { ReadingShelf } from "@/components/reading-shelf";
import styles from "./xue.module.css";

const title = "佛经研读中心｜从静读到版本校勘";
const description =
  "面向佛教徒、佛学爱好者与研究者的佛经研读入口：七日读《心经》与《金刚经》，从汉译、巴利与历史英译并读《法句》，每一步都能回到稳定原典。";
const pagePath = "/xue";

export const metadata: Metadata = buildPageMetadata({ title, description, path: pagePath });

const pageJsonLd = buildPageJsonLd({
  path: pagePath,
  title,
  description,
  type: "CollectionPage",
  breadcrumb: [
    { name: "首页", path: "/" },
    { name: "研读", path: pagePath },
  ],
  about: ["佛经研读", "心经", "金刚经", "法句经", "巴利三藏", "佛典版本研究"],
  mainEntityId: `${absoluteUrl(pagePath)}#study-paths`,
});

const studyPaths = [
  {
    number: "01",
    status: "七日路径",
    title: "《心经》：每天只带一个问题回到原句",
    description:
      "从“照见”到“无所得”，每天约五分钟。所有日程开放，进度只留在你的浏览器里。",
    meta: ["玄奘译 T0251", "7 个稳定行段", "入门提示有责任边界"],
    href: "/xue/xinjing",
    action: "开始第一天",
    tone: "cinnabar",
  },
  {
    number: "02",
    status: "七日核读",
    title: "《金刚经》：从“云何住”读到“如是观”",
    description:
      "七段原文、七个稳定行段；每一天把入门提示、版本边界和个人观照分开呈现。",
    meta: ["鸠摩罗什译 T0235", "7 段可核验引文", "7 种文本表达入口"],
    href: "/xue/jingangjing",
    action: "开始《金刚经》七日研读",
    tone: "gold",
  },
  {
    number: "03",
    status: "三源研读档案",
    title: "《法句》：让汉译、巴利与英译各自站稳",
    description:
      "从“心为法本”读起，观察相关文本如何彼此照见，同时保留版本、语言与质量差异。",
    meta: ["汉译 T0210", "巴利 Dhp 1–2", "Müller 1881"],
    href: "/xue/faju",
    action: "打开三源档案",
    tone: "ink",
  },
] as const;

const readingModes = [
  {
    icon: BookOpenText,
    label: "佛教徒 · 日常静读",
    title: "先让一句经文停下来",
    description: "不以连续打卡制造焦虑；读、停、观照，再回到完整上下文。",
  },
  {
    icon: Languages,
    label: "爱好者 · 理解脉络",
    title: "把译文放回文本家族",
    description: "分清原典、译本、平台提示与后世解释，不把熟悉的说法当成唯一答案。",
  },
  {
    icon: Fingerprint,
    label: "研究者 · 可复核引用",
    title: "每一个判断都留下坐标",
    description: "稳定段号、版本来源、质量状态与永久链接同时出现，方便复查与引用。",
  },
] as const;

export default function StudyPage() {
  return (
    <div className={styles.studyPage}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(pageJsonLd) }}
      />
      <div className={`page-shell ${styles.shell}`}>
        <nav className={styles.breadcrumb} aria-label="面包屑">
          <Link href="/">首页</Link>
          <span aria-hidden="true">/</span>
          <span>研读</span>
        </nav>

        <header className={styles.hubHero}>
          <div className={styles.hubHeroCopy}>
            <p className={styles.eyebrow}>研读 · STUDY WITH SOURCES</p>
            <h1>
              读经，不是更快地
              <br />
              得到一个<em>结论。</em>
            </h1>
            <p className={styles.lead}>
              是让一句话有原文、有上下文、有版本，也有回到生活与继续求证的余地。
              这里把静读、理解和校勘放在同一条路上。
            </p>
            <div className={styles.heroActions}>
              <Link href="/xue/xinjing">
                从《心经》开始 <ArrowRight aria-hidden="true" />
              </Link>
              <Link href="/xue/jingangjing">研读《金刚经》七段原文</Link>
              <Link href="/xue/biji">打开我的研读笺</Link>
            </div>
          </div>

          <aside className={styles.hubHeroMap} aria-label="研读的三个层次">
            <div className={styles.mapAxis} aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <ol>
              <li>
                <small>01 · READ</small>
                <strong>先读原句</strong>
                <span>不把解释放在原文前面</span>
              </li>
              <li>
                <small>02 · CONTEXT</small>
                <strong>再看上下文</strong>
                <span>知道这句话从哪里来</span>
              </li>
              <li>
                <small>03 · VERIFY</small>
                <strong>最后作判断</strong>
                <span>能说到哪里，就停在哪里</span>
              </li>
            </ol>
          </aside>
        </header>

        <ReadingShelf />

        <section className={styles.modeSection} aria-labelledby="study-for-whom">
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>同一部经，三种进入方式</p>
              <h2 id="study-for-whom">你不必先成为专家，才能认真读经。</h2>
            </div>
            <p>
              三种身份不是等级。今天可以静读，明天可以查版本；研究者也可以先让一段经文安静地发生。
            </p>
          </div>
          <div className={styles.modeGrid}>
            {readingModes.map((mode) => {
              const Icon = mode.icon;
              return (
                <article key={mode.label}>
                  <Icon aria-hidden="true" />
                  <small>{mode.label}</small>
                  <h3>{mode.title}</h3>
                  <p>{mode.description}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section
          className={styles.pathsSection}
          id="study-paths"
          aria-labelledby="study-paths-title"
        >
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>现在可读 · OPEN PATHS</p>
              <h2 id="study-paths-title">三条路径，三种进入方式。</h2>
            </div>
            <p>两条七日路径分别练习逐段慢读与版本核读；一份三源档案适合在一小时内完成有边界的跨语种观察。</p>
          </div>
          <div className={styles.pathGrid}>
            {studyPaths.map((path) => (
              <article
                key={path.href}
                className={
                  path.tone === "cinnabar"
                    ? styles.pathWarm
                    : path.tone === "gold"
                      ? styles.pathGold
                      : styles.pathDark
                }
              >
                <div className={styles.pathTopline}>
                  <span>{path.number}</span>
                  <small>{path.status}</small>
                </div>
                <h3>{path.title}</h3>
                <p>{path.description}</p>
                <ul>
                  {path.meta.map((item) => <li key={item}>{item}</li>)}
                </ul>
                <Link href={path.href}>
                  {path.action} <ArrowRight aria-hidden="true" />
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.notesSection} aria-labelledby="study-notes-title">
          <div className={styles.notesSectionCopy}>
            <p className={styles.eyebrow}>读完以后 · KEEP THE LOCATOR</p>
            <h2 id="study-notes-title">感想会淡，坐标不要丢。</h2>
            <p>
              全藏经卷页都可选文：选中一行或一段，写下观照、理解或待求证问题；引文、稳定段号和原典链接会一起留在当前浏览器。
            </p>
            <Link href="/xue/biji">
              打开本地研读笺 <ArrowRight aria-hidden="true" />
            </Link>
          </div>
          <ol>
            <li>
              <NotebookPen aria-hidden="true" />
              <span><strong>写</strong><small>在原句旁留下自己的话</small></span>
            </li>
            <li>
              <ShieldCheck aria-hidden="true" />
              <span><strong>存</strong><small>不登录，不上传到服务器</small></span>
            </li>
            <li>
              <Download aria-hidden="true" />
              <span><strong>带走</strong><small>连同出处导出 Markdown</small></span>
            </li>
          </ol>
        </section>

        <section className={styles.promiseSection} aria-labelledby="study-promise-title">
          <div className={styles.promiseQuote}>
            <Scale aria-hidden="true" />
            <p className={styles.eyebrow}>研读约定</p>
            <h2 id="study-promise-title">经文、翻译与解释，不混成一种声音。</h2>
          </div>
          <dl>
            <div>
              <dt><Fingerprint aria-hidden="true" /> 原文有坐标</dt>
              <dd>段号与链接直接落到相应行文，不只指向一部长经的首页。</dd>
            </div>
            <div>
              <dt><Languages aria-hidden="true" /> 版本不抹平</dt>
              <dd>同一文本家族可以并读，但不会因此被宣称为逐词等同。</dd>
            </div>
            <div>
              <dt><CircleAlert aria-hidden="true" /> 解释有署名边界</dt>
              <dd>平台提示不是经文，也不会在缺少具名审校时冒充权威解释。</dd>
            </div>
          </dl>
        </section>

        <section className={styles.studyFinder} aria-labelledby="study-finder-title">
          <div>
            <p className={styles.eyebrow}>还没有你想读的路径？</p>
            <h2 id="study-finder-title">先去经藏找到它，我们再把路修到那里。</h2>
            <p>经藏已经开放数千部作品与完整原文；研读路径会在来源、段落与审校条件成熟后逐步增加。</p>
          </div>
          <div>
            <Link href="/jingzang">
              <LibraryBig aria-hidden="true" /> 浏览完整经藏 <ArrowUpRight aria-hidden="true" />
            </Link>
            <Link href="/jingzang/sousuo">
              <Search aria-hidden="true" /> 搜索经名与经号
            </Link>
          </div>
          <ul aria-label="研读路径说明">
            <li><Clock3 aria-hidden="true" /> 不制造打卡焦虑</li>
            <li><Route aria-hidden="true" /> 进度只保存在本地</li>
            <li><BookOpenText aria-hidden="true" /> 每一步都能回到全文</li>
          </ul>
        </section>
      </div>
    </div>
  );
}

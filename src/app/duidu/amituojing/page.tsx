import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  BookOpenCheck,
  Braces,
  Fingerprint,
  Languages,
  Scale,
  ScrollText,
} from "lucide-react";
import { AmituojingCitationButton } from "@/components/amituojing-citation-button";
import {
  amituojingLearningDays,
  amituojingFullTextHref,
  xuanzangAmituojingHref,
} from "@/data/amituojing-learning-path";
import { getWorkExpressionGroup, type Sutra } from "@/data/sutras";
import { getLocalSutraReading, getSutraFolio } from "@/lib/corpus-reading";
import { folioHref } from "@/lib/reader-routes";
import {
  absoluteUrl,
  buildPageJsonLd,
  buildPageMetadata,
  serializeJsonLd,
} from "@/lib/site-metadata";
import styles from "./page.module.css";

const pagePath = "/duidu/amituojing";
const pageTitle = "阿弥陀经鸠摩罗什译与玄奘译双译对读";
const pageDescription =
  "按七个修学关口对读《佛说阿弥陀经》T0366 与《称赞净土佛摄受经》T0367；每行返回稳定原典坐标，相关段落不等于逐句对齐。";
const workId = "gbcr:work:smaller-sukhavati-vyuha-t0366";
const expressionSlugs = ["amituojing", "taisho-t0367"] as const;
const workExpressionSlugs = [...expressionSlugs, "sat-ja-t0366"] as const;

export const metadata: Metadata = buildPageMetadata({
  title: pageTitle,
  description: pageDescription,
  path: pagePath,
});

type PassageSegment = {
  id: string;
  text: string;
  sourceHref: string;
};

type Edition = {
  slug: string;
  title: string;
  alternateTitle: string;
  canonRef: string;
  translator: string;
  sourceName: string;
  sourceUrl: string;
  sourceLicense: string;
  status: string;
  folioCount: number;
  segmentCount: number;
  passages: Record<string, PassageSegment[]>;
};

type ParsedLocator = {
  canonId: string;
  startId: string;
  endId: string;
};

const comparisonQuestions = [
  "两译怎样交代方所、世界名与正在说法的佛？",
  "“无有众苦，但受诸乐”在玄奘译中展开了哪些身心层次？",
  "两译列出的法目有何长短，又怎样收束到念佛、念法、念僧？",
  "罗什译的“阿弥陀”与玄奘译的“无量寿／无量光”如何分别释名？",
  "发愿往生为何与善友、同会和亲近诸佛连在一起？",
  "“执持名号／一心不乱”与“闻已思惟／系念不乱”应如何各归其本？",
  "经末怎样描述此世界、此时代与此法之难信？",
] as const;

function parseLocator(locator: string): ParsedLocator {
  const match = locator.match(
    /^(T\d{4})\.(\d{3})\.(\d{4}[abc])(\d{2})–(?:(\d{4}[abc]))?(\d{2})$/,
  );
  if (!match) throw new Error(`无效的阿弥陀经稳定坐标：${locator}`);
  const [, canonId, juan, startPage, startLine, explicitEndPage, endLine] = match;
  return {
    canonId,
    startId: `${canonId}.${juan}.${startPage}${startLine}`,
    endId: `${canonId}.${juan}.${explicitEndPage ?? startPage}${endLine}`,
  };
}

function passageFromLocator(
  segments: PassageSegment[],
  locator: string,
  expectedCanonId: string,
) {
  const parsed = parseLocator(locator);
  if (parsed.canonId !== expectedCanonId) {
    throw new Error(`${locator} 不属于 ${expectedCanonId}`);
  }
  const start = segments.findIndex((segment) => segment.id === parsed.startId);
  const end = segments.findIndex((segment) => segment.id === parsed.endId);
  if (start < 0 || end < start) {
    throw new Error(`${locator} 无法在完整底本中解析`);
  }
  return segments.slice(start, end + 1);
}

async function loadEdition(sutra: Sutra, side: "primary" | "parallel"): Promise<Edition> {
  const reading = await getLocalSutraReading(sutra);
  const folios = await Promise.all(
    reading.navigation.map((item) => getSutraFolio(sutra, reading, item.key)),
  );
  const segments = folios.flatMap((folio) => folio
    ? folio.segments.map((segment) => ({
        id: segment.id,
        text: segment.text,
        sourceHref: `${folioHref(sutra.slug, folio.item.key)}#${segment.id}`,
      }))
    : []);

  if (segments.length !== reading.segmentCount) {
    throw new Error(`${sutra.slug} 对读母本不完整：${segments.length}/${reading.segmentCount}`);
  }

  const passages = Object.fromEntries(amituojingLearningDays.map((day) => [
    `day-${day.id}`,
    passageFromLocator(
      segments,
      side === "primary" ? day.locator : day.parallelLocator,
      side === "primary" ? "T0366" : "T0367",
    ),
  ]));

  return {
    slug: sutra.slug,
    title: sutra.title,
    alternateTitle: sutra.alternateTitle,
    canonRef: sutra.canonRef,
    translator: sutra.translator,
    sourceName: sutra.sourceName,
    sourceUrl: sutra.sourceUrl,
    sourceLicense: sutra.sourceLicense,
    status: sutra.status,
    folioCount: reading.navigation.length,
    segmentCount: reading.segmentCount,
    passages,
  };
}

function sourceLineLabel(segmentId: string) {
  return segmentId.split(".").at(-1) ?? segmentId;
}

function EditionPassage({
  edition,
  locusId,
  side,
}: {
  edition: Edition;
  locusId: string;
  side: "primary" | "parallel";
}) {
  const segments = edition.passages[locusId];
  return (
    <section
      className={styles.edition}
      aria-label={`${edition.title}相关段落`}
      data-comparison-edition={edition.slug}
      data-comparison-side={side}
    >
      <header>
        <span aria-hidden="true">{side === "primary" ? "甲" : "乙"}</span>
        <div>
          <small>{edition.canonRef}</small>
          <h3>{edition.title}</h3>
          <p>{edition.translator}</p>
        </div>
        <Link href={`/jingzang/${edition.slug}`} prefetch={false}>
          全本 <ArrowUpRight aria-hidden="true" />
        </Link>
      </header>
      <ol lang="zh-Hant">
        {segments.map((segment) => (
          <li key={segment.id}>
            <a
              href={segment.sourceHref}
              aria-label={`打开原典 ${segment.id}`}
              title={`回到 ${segment.id}`}
              data-analytics-event="comparison_segment_opened"
              data-analytics-content-id={segment.id}
            >
              <span>{sourceLineLabel(segment.id)}</span>
              <ScrollText aria-hidden="true" />
            </a>
            <p>{segment.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

const pageJsonLdBase = buildPageJsonLd({
  path: pagePath,
  title: pageTitle,
  description: pageDescription,
  type: "CollectionPage",
  breadcrumb: [
    { name: "首页", path: "/" },
    { name: "对读", path: "/duidu" },
    { name: "阿弥陀经双译对读", path: pagePath },
  ],
  about: ["佛说阿弥陀经", "称赞净土佛摄受经", "Sukhāvatīvyūha", "净土经典", "佛经异译对读"],
  mainEntityId: `${absoluteUrl(pagePath)}#expressions`,
});

const principles = [
  {
    icon: BookOpenCheck,
    title: "修学不离原句",
    text: "七个关口沿经文推进；可从持名进入，也能随时回到该译本的完整前后文。",
  },
  {
    icon: Languages,
    title: "译语各归其本",
    text: "罗什译与玄奘译分别署名、分别引用，不拼成一部看似顺畅却无底本的综合经文。",
  },
  {
    icon: Scale,
    title: "相关不等于对齐",
    text: "同一作品关系已核验；七组窗口是人工整理的阅读入口，不声称行与行自动等值。",
  },
  {
    icon: Braces,
    title: "引文可以复核",
    text: "每一行直达稳定版页坐标；复制引用只带版本、坐标与链接，便于笔记和研究复用。",
  },
] as const;

export default async function AmituojingComparisonPage() {
  const group = getWorkExpressionGroup("amituojing");
  if (!group || group.workId !== workId) {
    throw new Error("阿弥陀经同作品表达关系尚未就绪");
  }

  const bySlug = new Map(group.expressions.map((expression) => [expression.slug, expression]));
  const unexpected = group.expressions.filter((expression) => !workExpressionSlugs.includes(
    expression.slug as (typeof workExpressionSlugs)[number],
  ));
  if (bySlug.size !== workExpressionSlugs.length || unexpected.length > 0) {
    throw new Error("阿弥陀经同作品表达集合已变化，须重新审核双译窗口");
  }
  const editions = await Promise.all(expressionSlugs.map((slug, index) => {
    const sutra = bySlug.get(slug);
    if (!sutra) throw new Error(`阿弥陀经双译对读缺少 ${slug}`);
    return loadEdition(sutra, index === 0 ? "primary" : "parallel");
  }));
  const [primary, parallel] = editions;
  const totalSegments = editions.reduce((sum, edition) => sum + edition.segmentCount, 0);
  const excerptSegments = editions.reduce(
    (sum, edition) => sum + Object.values(edition.passages).reduce(
      (subtotal, passage) => subtotal + passage.length,
      0,
    ),
    0,
  );
  const loci = amituojingLearningDays.map((day, index) => ({
    ...day,
    locusId: `day-${day.id}`,
    number: String(day.id).padStart(2, "0"),
    question: comparisonQuestions[index],
  }));
  const pageJsonLd = {
    ...pageJsonLdBase,
    "@graph": [
      ...(pageJsonLdBase["@graph"] as Array<Record<string, unknown>>),
      {
        "@type": "ItemList",
        "@id": `${absoluteUrl(pagePath)}#expressions`,
        name: "阿弥陀经两种古汉译表达",
        numberOfItems: editions.length,
        itemListElement: editions.map((edition, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: `${edition.title} · ${edition.canonRef}`,
          url: absoluteUrl(`/jingzang/${edition.slug}`),
        })),
      },
      {
        "@type": "ItemList",
        "@id": `${absoluteUrl(pagePath)}#loci`,
        name: "阿弥陀经七个双译阅读关口",
        numberOfItems: loci.length,
        itemListElement: loci.map((locus, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: locus.title,
          url: `${absoluteUrl(pagePath)}#${locus.locusId}`,
        })),
      },
    ],
  };

  return (
    <div className={styles.page} data-amituojing-comparison>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(pageJsonLd) }}
      />
      <div className="page-shell">
        <nav className={styles.breadcrumb} aria-label="面包屑">
          <Link href="/duidu"><ArrowLeft aria-hidden="true" /> 对读书案</Link>
          <span>/</span>
          <Link href={amituojingFullTextHref}>阿弥陀经</Link>
          <span>/</span>
          <span>双译对读</span>
        </nav>

        <header className={styles.hero}>
          <div className={styles.heroCopy}>
            <p>SUKHĀVATĪVYŪHA · TWO VERIFIED EXPRESSIONS</p>
            <h1>同向净土，<br /><em>不等于同一句。</em></h1>
            <p>
              从七个修学关口并读鸠摩罗什译与玄奘译：佛教徒不离原句，爱好者看见译语展开，
              研究者沿每一行回到底本。这里标示相关段落，不制造自动逐句对齐。
            </p>
            <a href="#day-1"><BookOpenCheck aria-hidden="true" /> 从“今现在说法”开始</a>
          </div>
          <aside className={styles.docket} aria-label="阿弥陀经双译对读范围">
            <div className={styles.docketSeal} aria-hidden="true">願</div>
            <p>双译经案 · DOSSIER</p>
            <code>{workId}</code>
            <dl>
              <div><dt>古汉译</dt><dd>{editions.length}</dd></div>
              <div><dt>阅读关口</dt><dd>{loci.length}</dd></div>
              <div><dt>母本行段</dt><dd>{totalSegments}</dd></div>
              <div><dt>窗口行段</dt><dd>{excerptSegments}</dd></div>
              <div><dt>自动对齐</dt><dd>0</dd></div>
              <div><dt>综合改写</dt><dd>0</dd></div>
            </dl>
            <small>同一作品关系已核验；SAT 现代日译是第三种表达，但不混入本页古汉译双读。</small>
          </aside>
        </header>

        <section className={styles.method} aria-labelledby="amituojing-method-title">
          <header>
            <p>阅读契约 · METHOD</p>
            <h2 id="amituojing-method-title">先守版本边界，<br />再进入信、愿、持。</h2>
          </header>
          <div>
            {principles.map((principle, index) => {
              const Icon = principle.icon;
              return (
                <article key={principle.title}>
                  <span>0{index + 1}</span>
                  <Icon aria-hidden="true" />
                  <h3>{principle.title}</h3>
                  <p>{principle.text}</p>
                </article>
              );
            })}
          </div>
        </section>

        <nav className={styles.locusRail} aria-label="七个双译阅读关口">
          {loci.map((locus) => (
            <a key={locus.locusId} href={`#${locus.locusId}`}>
              <span>{locus.number}</span>
              <small>{locus.focus}</small>
              <strong>{locus.title}</strong>
            </a>
          ))}
        </nav>

        <main className={styles.loci}>
          {loci.map((locus) => {
            const primarySegments = primary.passages[locus.locusId];
            const parallelSegments = parallel.passages[locus.locusId];
            return (
              <article
                id={locus.locusId}
                key={locus.locusId}
                className={styles.locus}
                data-comparison-locus={locus.locusId}
              >
                <header className={styles.locusHeader}>
                  <div aria-hidden="true">{locus.number}</div>
                  <div>
                    <p>{locus.focus}</p>
                    <h2>{locus.title}</h2>
                  </div>
                  <blockquote>{locus.question}</blockquote>
                </header>

                <p className={styles.context}><strong>先看语境：</strong>{locus.context}</p>

                <div className={styles.editionGrid}>
                  <EditionPassage edition={primary} locusId={locus.locusId} side="primary" />
                  <div className={styles.notEqual} aria-hidden="true"><span>≠</span><small>相关段落</small></div>
                  <EditionPassage edition={parallel} locusId={locus.locusId} side="parallel" />
                </div>

                <footer className={styles.observation}>
                  <div>
                    <Languages aria-hidden="true" />
                    <p><strong>差异观察</strong>{locus.versionNote}</p>
                  </div>
                  <AmituojingCitationButton
                    className={styles.citation}
                    locusId={locus.locusId}
                    title={locus.title}
                    items={[
                      {
                        label: `${primary.title}（${primary.translator}）`,
                        locator: locus.locator,
                        href: primarySegments[0].sourceHref,
                      },
                      {
                        label: `${parallel.title}（${parallel.translator}）`,
                        locator: locus.parallelLocator,
                        href: parallelSegments[0].sourceHref,
                      },
                    ]}
                  />
                </footer>
              </article>
            );
          })}
        </main>

        <section className={styles.ledger} aria-labelledby="amituojing-ledger-title">
          <div>
            <Fingerprint aria-hidden="true" />
            <p>版本责任 · SOURCE LEDGER</p>
            <h2 id="amituojing-ledger-title">两部全文都在，<br />窗口只是入口。</h2>
          </div>
          <ol>
            {editions.map((edition, index) => (
              <li key={edition.slug}>
                <span>0{index + 1}</span>
                <div>
                  <small>{edition.status}</small>
                  <h3>{edition.title}</h3>
                  <p>{edition.translator} · {edition.canonRef}</p>
                  <code>{edition.folioCount} 页组 · {edition.segmentCount} 稳定行段</code>
                  <p>{edition.sourceLicense}</p>
                </div>
                <a href={edition.sourceUrl} target="_blank" rel="noreferrer">
                  {edition.sourceName} <ArrowUpRight aria-hidden="true" />
                </a>
              </li>
            ))}
          </ol>
        </section>

        <section className={styles.closing} aria-labelledby="amituojing-next-title">
          <p>继续研读 · NEXT READING</p>
          <h2 id="amituojing-next-title">双读看见差异，<br />全本与日课承接修学。</h2>
          <div>
            <Link href="/xue/amituojing">进入七日净读路径</Link>
            <Link href={amituojingFullTextHref}>阅读鸠摩罗什译全本</Link>
            <Link href={xuanzangAmituojingHref}>阅读玄奘译全本</Link>
            <Link href="/yanjiu">把坐标带入研究工作台</Link>
          </div>
          <p>
            本页由 foxue.ai 编辑组整理；14 个窗口均由构建脚本对照固定 CBETA TEI 与稳定行段验证，
            尚未经过外部具名佛学审校。修持提示、差异观察与段落配对均不是经文。
          </p>
        </section>
      </div>
    </div>
  );
}

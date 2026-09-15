import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BookOpenCheck, Braces, Columns2, Fingerprint, Scale } from "lucide-react";
import {
  HeartSutraComparison,
  type HeartSutraComparisonEdition,
} from "@/components/heart-sutra-comparison";
import { getSutra, getWorkExpressionGroup, type Sutra } from "@/data/sutras";
import { getLocalSutraReading, getSutraFolio } from "@/lib/corpus-reading";
import { folioHref } from "@/lib/reader-routes";
import {
  absoluteUrl,
  buildPageJsonLd,
  buildPageMetadata,
  serializeJsonLd,
} from "@/lib/site-metadata";
import styles from "./page.module.css";

const pagePath = "/duidu/xinjing";
const pageTitle = "心经七种汉译异译对读";
const pageDescription =
  "并排阅读《心经》七种已审核汉译表达；每个行段回到各自 CBETA 原典坐标，明确同作品关系不等于逐句对齐。";

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
    { name: "经藏", path: "/jingzang" },
    { name: "心经异译对读", path: pagePath },
  ],
  about: ["般若波罗蜜多心经", "心经异译", "佛经版本对读", "CBETA 稳定行段"],
  mainEntityId: `${absoluteUrl(pagePath)}#expressions`,
});

const principles = [
  {
    icon: Fingerprint,
    title: "关系先审，再并排",
    text: "只纳入已确认挂接同一稳定作品标识的七种汉译表达；唐梵对字音本不因题名相近自动加入。",
  },
  {
    icon: Columns2,
    title: "并排不是对齐",
    text: "左右栏独立展开，不用相同高度、相邻位置或机器相似度暗示两行互为译句。",
  },
  {
    icon: Braces,
    title: "坐标跟着原文",
    text: "每个行号打开该文本自己的经号、版页与稳定行段；离开本页仍能核查前后文。",
  },
  {
    icon: Scale,
    title: "差异留给读者",
    text: "页面提供文本与责任信息，不把七译压成一段现代合成文，也不替研究者裁决译史争议。",
  },
];

const mainTextStartBySlug: Record<string, string> = {
  "taisho-t0250": "T0250.001.0847c10",
  xinjing: "T0251.001.0848c06",
  "taisho-t0252": "T0252.001.0849a07",
  "taisho-t0253": "T0253.001.0849b26",
  "taisho-t0254": "T0254.001.0850a10",
  "taisho-t0255": "T0255.001.0850b23",
  "taisho-t0257": "T0257.001.0852b07",
};

async function loadEdition(sutra: Sutra): Promise<HeartSutraComparisonEdition> {
  // The complete witnesses become part of this static page at build time. Do
  // not consult the revalidated edge pointer here: that would turn this route
  // into ISR and require corpus masters inside a non-bucket server function.
  const reading = await getLocalSutraReading(sutra);
  const folios = await Promise.all(
    reading.navigation.map((item) => getSutraFolio(sutra, reading, item.key)),
  );
  const segments = folios.flatMap((folio) => folio
    ? folio.segments.map((segment) => ({
        id: segment.id,
        text: segment.text,
        note: segment.note,
        sourceHref: `${folioHref(sutra.slug, folio.item.key)}#${segment.id}`,
      }))
    : []);

  if (segments.length !== reading.segmentCount) {
    throw new Error(`${sutra.slug} 对读原文不完整：${segments.length}/${reading.segmentCount}`);
  }
  const mainTextStartId = mainTextStartBySlug[sutra.slug];
  if (!mainTextStartId || !segments.some((segment) => segment.id === mainTextStartId)) {
    throw new Error(`${sutra.slug} 对读正文起点未经核验`);
  }

  return {
    slug: sutra.slug,
    title: sutra.title,
    alternateTitle: sutra.alternateTitle,
    canonRef: sutra.canonRef,
    translator: sutra.translator,
    language: sutra.language,
    sourceName: sutra.sourceName,
    sourceUrl: sutra.sourceUrl,
    sourceLicense: sutra.sourceLicense,
    attributionNote: sutra.attributionNote,
    bibliographicNote: sutra.bibliographicNote,
    mainTextStartId,
    folioCount: reading.navigation.length,
    segments,
  };
}

export default async function HeartSutraComparisonPage() {
  const heartSutra = getSutra("xinjing");
  const group = getWorkExpressionGroup("xinjing");
  if (!heartSutra || !group || group.workId !== "gbcr:work:prajnaparamita-hrdaya") {
    throw new Error("心经同作品表达关系尚未就绪");
  }
  const editions = await Promise.all(group.expressions.map(loadEdition));
  const pageJsonLd = {
    ...pageJsonLdBase,
    "@graph": [
      ...(pageJsonLdBase["@graph"] as Array<Record<string, unknown>>),
      {
        "@type": "ItemList",
        "@id": `${absoluteUrl(pagePath)}#expressions`,
        name: "心经七种已审核汉译表达",
        numberOfItems: editions.length,
        itemListElement: editions.map((edition, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: `${edition.title} · ${edition.canonRef}`,
          url: absoluteUrl(`/jingzang/${edition.slug}`),
        })),
      },
    ],
  };

  return (
    <div className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(pageJsonLd) }}
      />
      <div className="page-shell">
        <nav className={styles.breadcrumb} aria-label="面包屑">
          <Link href="/jingzang"><ArrowLeft aria-hidden="true" /> 经藏</Link>
          <span>/</span>
          <Link href="/jingzang/xinjing">心经</Link>
          <span>/</span>
          <span>异译对读</span>
        </nav>

        <header className={styles.hero}>
          <div className={styles.heroCopy}>
            <p>心经异译 · VERIFIED TEXTUAL EXPRESSIONS</p>
            <h1>七译同题，<br /><em>不抹平差异。</em></h1>
            <p>
              佛教徒可以连续读完不同译本，佛学爱好者可以看见措辞与篇幅差异，
              研究者可以从每一行返回各自底本。这里不生成“标准合译”，也不伪造逐句对应。
            </p>
            <a href="#duidu-texts" className={styles.heroAction}>
              <BookOpenCheck aria-hidden="true" /> 开始并排阅读
            </a>
          </div>
          <aside className={styles.identityCard} aria-label="心经对读范围">
            <span className={styles.seal} aria-hidden="true">異</span>
            <p>作品身份已确认</p>
            <code>{group.workId}</code>
            <dl>
              <div><dt>可读表达</dt><dd>{editions.length}</dd></div>
              <div><dt>稳定行段</dt><dd>{editions.reduce((sum, edition) => sum + edition.segments.length, 0)}</dd></div>
              <div><dt>自动对齐</dt><dd>0</dd></div>
            </dl>
            <small>关系来自受控目录；文本分别署名、分别引用。</small>
          </aside>
        </header>

        <section className={styles.principles} aria-labelledby="comparison-method-title">
          <div className={styles.principlesLead}>
            <p>对读契约 · COMPARISON CONTRACT</p>
            <h2 id="comparison-method-title">先守住边界，<br />差异才有意义。</h2>
          </div>
          <div className={styles.principleGrid}>
            {principles.map((principle, index) => {
              const Icon = principle.icon;
              return (
                <article key={principle.title}>
                  <header><span>0{index + 1}</span><Icon aria-hidden="true" /></header>
                  <h3>{principle.title}</h3>
                  <p>{principle.text}</p>
                </article>
              );
            })}
          </div>
        </section>

        <HeartSutraComparison editions={editions} />

        <section className={styles.closing} aria-labelledby="comparison-next-title">
          <p>读完以后 · RETURN TO CONTEXT</p>
          <h2 id="comparison-next-title">对读帮助发现问题，<br />原典上下文负责回答问题。</h2>
          <div>
            <Link href="/xue/xinjing">进入《心经》七日研读</Link>
            <Link href="/jingzang/xinjing">查看玄奘本目录</Link>
            <Link href="/yanjiu">把选文带入研究工作台</Link>
          </div>
        </section>
      </div>
    </div>
  );
}

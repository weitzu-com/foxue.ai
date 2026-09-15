import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BookOpenCheck, Braces, Languages, Route, Scale } from "lucide-react";
import {
  DiamondSutraComparison,
  type DiamondSutraComparisonEdition,
  type DiamondSutraComparisonLocus,
  type DiamondSutraPassageSegment,
} from "@/components/diamond-sutra-comparison";
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

const pagePath = "/duidu/jingangjing";
const pageTitle = "金刚经六种汉译与英译主题对读";
const pageDescription =
  "按七个关键阅读关口对读《金刚经》六种汉译与 Gemmell 1912 英译；每段返回稳定原典坐标，主题同现不等于逐句对齐。";
const workId = "gbcr:work:vajracchedika-prajnaparamita";

export const metadata: Metadata = buildPageMetadata({
  title: pageTitle,
  description: pageDescription,
  path: pagePath,
});

type PassageWindow = { startId: string; endId: string };
type LocusSpec = DiamondSutraComparisonLocus & {
  windows: Record<string, PassageWindow>;
};

const expressionSlugs = [
  "jingangjing",
  "taisho-t0236a",
  "taisho-t0236b",
  "taisho-t0237",
  "taisho-t0238",
  "taisho-t0239",
  "gutenberg-en-diamond-gemmell",
] as const;

const locusSpecs: LocusSpec[] = [
  {
    id: "question",
    number: "01",
    eyebrow: "发心与提问",
    title: "发心之后，究竟在问什么？",
    question: "“应云何住、云何修行、云何降伏其心”在各译中增加、删略或换成了哪些动词？",
    readingNote: "先读须菩提如何发问，再看回答从哪里开始。不要只拿一个流行短句代替整组问题。",
    windows: {
      jingangjing: { startId: "T0235.001.0748c27", endId: "T0235.001.0749a02" },
      "taisho-t0236a": { startId: "T0236a.001.0752c23", endId: "T0236a.001.0752c28" },
      "taisho-t0236b": { startId: "T0236b.001.0757b09", endId: "T0236b.001.0757b12" },
      "taisho-t0237": { startId: "T0237.001.0762a20", endId: "T0237.001.0762a23" },
      "taisho-t0238": { startId: "T0238.001.0767a02", endId: "T0238.001.0767a05" },
      "taisho-t0239": { startId: "T0239.001.0772a04", endId: "T0239.001.0772a07" },
      "gutenberg-en-diamond-gemmell": {
        startId: "GUTENBERG-DIAMOND-GEMMELL-1912.001.s0000000500",
        endId: "GUTENBERG-DIAMOND-GEMMELL-1912.001.s0000000600",
      },
    },
  },
  {
    id: "four-views",
    number: "02",
    eyebrow: "度生与四相",
    title: "度众生，为何又说无众生得度？",
    question: "“我、人、众生、寿者”在诸译中如何换序、换词，乃至出现“受者”与“更求趣”？",
    readingNote: "这些名相并非一张无需版本的固定词表。先观察每一译本的成组措辞，再进入注疏解释。",
    windows: {
      jingangjing: { startId: "T0235.001.0749a09", endId: "T0235.001.0749a11" },
      "taisho-t0236a": { startId: "T0236a.001.0753a05", endId: "T0236a.001.0753a08" },
      "taisho-t0236b": { startId: "T0236b.001.0757b24", endId: "T0236b.001.0757b27" },
      "taisho-t0237": { startId: "T0237.001.0762b06", endId: "T0237.001.0762b09" },
      "taisho-t0238": { startId: "T0238.001.0767a14", endId: "T0238.001.0767a18" },
      "taisho-t0239": { startId: "T0239.001.0772a16", endId: "T0239.001.0772a20" },
      "gutenberg-en-diamond-gemmell": {
        startId: "GUTENBERG-DIAMOND-GEMMELL-1912.001.s0000000700",
        endId: "GUTENBERG-DIAMOND-GEMMELL-1912.001.s0000000700",
      },
    },
  },
  {
    id: "giving",
    number: "03",
    eyebrow: "布施与不住",
    title: "不住，不等于不行动。",
    question: "各译怎样把“不住”放回布施的具体动作，而不是抽象成一句脱离语境的格言？",
    readingNote: "对读时留意“事、色、声香味触法、相想”等宾语；窗口长短来自底本行分，不是义理权重。",
    windows: {
      jingangjing: { startId: "T0235.001.0749a12", endId: "T0235.001.0749a14" },
      "taisho-t0236a": { startId: "T0236a.001.0753a09", endId: "T0236a.001.0753a11" },
      "taisho-t0236b": { startId: "T0236b.001.0757b28", endId: "T0236b.001.0757c01" },
      "taisho-t0237": { startId: "T0237.001.0762b10", endId: "T0237.001.0762b12" },
      "taisho-t0238": { startId: "T0238.001.0767a19", endId: "T0238.001.0767a21" },
      "taisho-t0239": { startId: "T0239.001.0772a21", endId: "T0239.001.0772a23" },
      "gutenberg-en-diamond-gemmell": {
        startId: "GUTENBERG-DIAMOND-GEMMELL-1912.001.s0000000800",
        endId: "GUTENBERG-DIAMOND-GEMMELL-1912.001.s0000000800",
      },
    },
  },
  {
    id: "seeing",
    number: "04",
    eyebrow: "见相与见如来",
    title: "可以从身相见如来吗？",
    question: "“身相、相成就、胜相、相具足”如何共同指向一个问题，又保留不同翻译路径？",
    readingNote: "相似主题不等于词语可以无损互换。点击任一行号，可回到问答之前与未来信受之后的上下文。",
    windows: {
      jingangjing: { startId: "T0235.001.0749a21", endId: "T0235.001.0749a25" },
      "taisho-t0236a": { startId: "T0236a.001.0753a19", endId: "T0236a.001.0753a23" },
      "taisho-t0236b": { startId: "T0236b.001.0757c09", endId: "T0236b.001.0757c13" },
      "taisho-t0237": { startId: "T0237.001.0762b19", endId: "T0237.001.0762b23" },
      "taisho-t0238": { startId: "T0238.001.0767b01", endId: "T0238.001.0767b06" },
      "taisho-t0239": { startId: "T0239.001.0772a29", endId: "T0239.001.0772b04" },
      "gutenberg-en-diamond-gemmell": {
        startId: "GUTENBERG-DIAMOND-GEMMELL-1912.001.s0000001000",
        endId: "GUTENBERG-DIAMOND-GEMMELL-1912.001.s0000001000",
      },
    },
  },
  {
    id: "raft",
    number: "05",
    eyebrow: "法与非法",
    title: "筏喻要舍的是什么？",
    question: "诸译如何把“取法、取非法”与筏喻连接起来？不要把“舍”孤立成否定学习或修行。",
    readingNote: "这里只呈现各版本的经文窗口，不替注疏统一“法”的层次，也不把 Gemmell 的解释性英译当作逐词对应。",
    windows: {
      jingangjing: { startId: "T0235.001.0749b09", endId: "T0235.001.0749b11" },
      "taisho-t0236a": { startId: "T0236a.001.0753b14", endId: "T0236a.001.0753b16" },
      "taisho-t0236b": { startId: "T0236b.001.0758a02", endId: "T0236b.001.0758a05" },
      "taisho-t0237": { startId: "T0237.001.0762c12", endId: "T0237.001.0762c15" },
      "taisho-t0238": { startId: "T0238.001.0767b29", endId: "T0238.001.0767c03" },
      "taisho-t0239": { startId: "T0239.001.0772b18", endId: "T0239.001.0772b21" },
      "gutenberg-en-diamond-gemmell": {
        startId: "GUTENBERG-DIAMOND-GEMMELL-1912.001.s0000001300",
        endId: "GUTENBERG-DIAMOND-GEMMELL-1912.001.s0000001400",
      },
    },
  },
  {
    id: "raising-mind",
    number: "06",
    eyebrow: "离相与发心",
    title: "“无所住而生其心”如何展开？",
    question: "把名句放回忍辱仙人与发菩提心的段落，各译显出了哪些被流行引文省略的条件？",
    readingNote: "本关口专门核对名句上下文；T0239 的次序与词语、T0238 的直译句法尤其提醒读者不要只认一个通行版本。",
    windows: {
      jingangjing: { startId: "T0235.001.0750b19", endId: "T0235.001.0750b24" },
      "taisho-t0236a": { startId: "T0236a.001.0754c07", endId: "T0236a.001.0754c12" },
      "taisho-t0236b": { startId: "T0236b.001.0759b04", endId: "T0236b.001.0759b11" },
      "taisho-t0237": { startId: "T0237.001.0764a11", endId: "T0237.001.0764a18" },
      "taisho-t0238": { startId: "T0238.001.0769a14", endId: "T0238.001.0769a20" },
      "taisho-t0239": { startId: "T0239.001.0773b27", endId: "T0239.001.0773c04" },
      "gutenberg-en-diamond-gemmell": {
        startId: "GUTENBERG-DIAMOND-GEMMELL-1912.001.s0000004300",
        endId: "GUTENBERG-DIAMOND-GEMMELL-1912.001.s0000004300",
      },
    },
  },
  {
    id: "conditioned",
    number: "07",
    eyebrow: "结尾观法",
    title: "最后一偈，各译真的一样吗？",
    question: "通行本的“梦幻泡影”与其他译本的“星、翳、灯、幻、露、泡、梦、电、云”如何并存？",
    readingNote: "意象数量与顺序应按版本引用；本页不生产一个混合诸译的“标准偈”，也不把英译意象反译回汉文。",
    windows: {
      jingangjing: { startId: "T0235.001.0752b27", endId: "T0235.001.0752b29" },
      "taisho-t0236a": { startId: "T0236a.001.0757a05", endId: "T0236a.001.0757a08" },
      "taisho-t0236b": { startId: "T0236b.001.0761c23", endId: "T0236b.001.0761c25" },
      "taisho-t0237": { startId: "T0237.001.0766b21", endId: "T0237.001.0766b24" },
      "taisho-t0238": { startId: "T0238.001.0771c10", endId: "T0238.001.0771c13" },
      "taisho-t0239": { startId: "T0239.001.0775b18", endId: "T0239.001.0775b23" },
      "gutenberg-en-diamond-gemmell": {
        startId: "GUTENBERG-DIAMOND-GEMMELL-1912.001.s0000009300",
        endId: "GUTENBERG-DIAMOND-GEMMELL-1912.001.s0000009400",
      },
    },
  },
];

const pageJsonLdBase = buildPageJsonLd({
  path: pagePath,
  title: pageTitle,
  description: pageDescription,
  type: "CollectionPage",
  breadcrumb: [
    { name: "首页", path: "/" },
    { name: "经藏", path: "/jingzang" },
    { name: "金刚经主题对读", path: pagePath },
  ],
  about: ["金刚般若波罗蜜经", "金刚经异译", "Vajracchedikā", "佛经版本对读", "CBETA 稳定行段"],
  mainEntityId: `${absoluteUrl(pagePath)}#expressions`,
});

function slicePassage(
  slug: string,
  locusId: string,
  segments: DiamondSutraPassageSegment[],
  window: PassageWindow,
) {
  const start = segments.findIndex((segment) => segment.id === window.startId);
  const end = segments.findIndex((segment) => segment.id === window.endId);
  if (start < 0 || end < start) {
    throw new Error(`${slug} 的 ${locusId} 对读窗口失效：${window.startId}–${window.endId}`);
  }
  return segments.slice(start, end + 1);
}

async function loadEdition(sutra: Sutra): Promise<DiamondSutraComparisonEdition> {
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

  const passages = Object.fromEntries(locusSpecs.map((locus) => {
    const window = locus.windows[sutra.slug];
    if (!window) throw new Error(`${sutra.slug} 缺少 ${locus.id} 对读窗口`);
    return [locus.id, slicePassage(sutra.slug, locus.id, segments, window)];
  }));

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
    status: sutra.status,
    attributionNote: sutra.attributionNote,
    bibliographicNote: sutra.bibliographicNote,
    folioCount: reading.navigation.length,
    segmentCount: reading.segmentCount,
    passages,
  };
}

const principles = [
  {
    icon: Route,
    title: "问题是入口",
    text: "七个关口跟随经文推进：发问、度生、不住布施、见相、筏喻、发心与结偈。",
  },
  {
    icon: Braces,
    title: "窗口不是断章",
    text: "片段帮助定位差异；每一行仍链接完整经卷，前后文始终比页面摘录优先。",
  },
  {
    icon: Languages,
    title: "语词各归其本",
    text: "六种古汉译与一部近代英译分别署名，不反译、不混合，也不制造统一现代释文。",
  },
  {
    icon: Scale,
    title: "关系不冒充对齐",
    text: "同一作品关系已经核验；段落对应、译史争议和义理判断仍需独立研究与人工审校。",
  },
];

export default async function DiamondSutraComparisonPage() {
  const diamondSutra = getSutra("jingangjing");
  const group = getWorkExpressionGroup("jingangjing");
  if (!diamondSutra || !group || group.workId !== workId) {
    throw new Error("金刚经同作品表达关系尚未就绪");
  }

  const bySlug = new Map(group.expressions.map((expression) => [expression.slug, expression]));
  const unexpected = group.expressions.filter((expression) => !expressionSlugs.includes(
    expression.slug as (typeof expressionSlugs)[number],
  ));
  if (bySlug.size !== expressionSlugs.length || unexpected.length > 0) {
    throw new Error("金刚经对读表达集合已变化，须重新审核窗口");
  }
  const editions = await Promise.all(expressionSlugs.map((slug) => {
    const sutra = bySlug.get(slug);
    if (!sutra) throw new Error(`金刚经对读缺少 ${slug}`);
    return loadEdition(sutra);
  }));
  const loci = locusSpecs.map((locus) => ({
    id: locus.id,
    number: locus.number,
    eyebrow: locus.eyebrow,
    title: locus.title,
    question: locus.question,
    readingNote: locus.readingNote,
  }));
  const totalSegments = editions.reduce((sum, edition) => sum + edition.segmentCount, 0);
  const excerptSegments = editions.reduce(
    (sum, edition) => sum + Object.values(edition.passages).reduce((part, passage) => part + passage.length, 0),
    0,
  );
  const pageJsonLd = {
    ...pageJsonLdBase,
    "@graph": [
      ...(pageJsonLdBase["@graph"] as Array<Record<string, unknown>>),
      {
        "@type": "ItemList",
        "@id": `${absoluteUrl(pagePath)}#expressions`,
        name: "金刚经六种汉译与 Gemmell 1912 英译",
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
        name: "金刚经七个关键阅读关口",
        numberOfItems: loci.length,
        itemListElement: loci.map((locus, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: locus.title,
          url: `${absoluteUrl(pagePath)}?left=jingangjing&right=taisho-t0239&locus=${locus.id}`,
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
          <Link href="/jingzang/jingangjing">金刚经</Link>
          <span>/</span>
          <span>主题对读</span>
        </nav>

        <header className={styles.hero}>
          <div className={styles.heroIndex} aria-hidden="true">
            <span>V</span><span>07</span>
          </div>
          <div className={styles.heroCopy}>
            <p>VAJRACCHEDIKĀ · VERIFIED READING LOCI</p>
            <h1>不是把诸译<br /><em>排成同一句。</em></h1>
            <p>
              从七个关键问题进入《金刚经》：佛教徒回到修学语境，爱好者看见译语差异，
              研究者沿每一行返回底本。这里比较“各本在哪里说”；主题同现不等于逐句对齐。
            </p>
            <a href="#diamond-reading-desk" className={styles.heroAction}>
              <BookOpenCheck aria-hidden="true" /> 从第一问开始
            </a>
          </div>
          <aside className={styles.docket} aria-label="金刚经对读资料范围">
            <p>对读卷宗 · DOSSIER</p>
            <code>{workId}</code>
            <dl>
              <div><dt>文本表达</dt><dd>{editions.length}</dd></div>
              <div><dt>阅读关口</dt><dd>{loci.length}</dd></div>
              <div><dt>母本行段</dt><dd>{totalSegments.toLocaleString("en-US")}</dd></div>
              <div><dt>窗口行段</dt><dd>{excerptSegments}</dd></div>
              <div><dt>自动对齐</dt><dd>0</dd></div>
              <div><dt>现代合译</dt><dd>0</dd></div>
            </dl>
            <small>六种汉译 + Gemmell 1912 英译；T0236a/b 署名见证边界保持公开。</small>
          </aside>
        </header>

        <section className={styles.method} aria-labelledby="diamond-method-title">
          <header>
            <p>阅读契约 · METHOD</p>
            <h2 id="diamond-method-title">把比较变成<br />可复核的阅读动作。</h2>
          </header>
          <div className={styles.methodGrid}>
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

        <div id="diamond-reading-desk">
          <DiamondSutraComparison editions={editions} loci={loci} />
        </div>

        <section className={styles.closing} aria-labelledby="diamond-next-title">
          <p>继续深入 · NEXT READING</p>
          <h2 id="diamond-next-title">片段提出差异，<br />全本与研读路径承接问题。</h2>
          <div>
            <Link href="/xue/jingangjing">进入《金刚经》七日核读</Link>
            <Link href="/jingzang/jingangjing">阅读鸠摩罗什译全本</Link>
            <Link href="/yanjiu">把稳定行段带入研究工作台</Link>
          </div>
        </section>
      </div>
    </div>
  );
}

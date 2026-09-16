import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookMarked,
  BookOpenText,
  CalendarDays,
  Clock3,
  Compass,
  Fingerprint,
  Languages,
  Layers3,
  LibraryBig,
  Quote,
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
import styles from "./page.module.css";

const pagePath = "/xue/xuanjing";
const pageTitle = "初学佛经先读哪部｜按目的与读法选经";
const pageDescription =
  "不知道佛经入门先读哪部？按阅读目的、文本质地和可用时间，在每日原典、法句经、心经、金刚经、阿弥陀经与法华经之间选择，并直达可核验原文。";

export const metadata: Metadata = buildPageMetadata({
  title: pageTitle,
  description: pageDescription,
  path: pagePath,
});

const readingRoutes = [
  {
    id: "daily",
    number: "01",
    icon: CalendarDays,
    question: "还不知道自己会对哪一类经典发生兴趣",
    title: "先从每日一段开始",
    work: "30 段每日原典",
    texture: "跨阿含、般若、法句、净土与法华的短段选读",
    pace: "每次 3–10 分钟",
    reason: "一次只接触一段完整出处，先建立直接读原文的经验，再观察自己愿意追问哪类问题。",
    boundary: "30 段不是教义次序、宗派次第或打卡课程，也不暗示其中某部经典高于其他经典。",
    href: "/xue/meiri",
    action: "打开三十段原典",
    source: "8 部作品 · 30 个稳定引文",
    tone: "paper",
  },
  {
    id: "dhammapada",
    number: "02",
    icon: Quote,
    question: "想从短偈观察心念、言行与修习",
    title: "从《法句》读短而完整的教导",
    work: "《法句经》三源研读",
    texture: "一偈一意象；适合逐句停留，也适合跨文本观察",
    pace: "先读一组二偈",
    reason: "汉译、巴利与公版英译各自站稳，既能静读，也能看见相关传统之间不能被抹平的差异。",
    boundary: "相关《法句》文本不是逐句互译；并排出现只提供研究入口，不制造一部综合经文。",
    href: "/xue/faju",
    action: "打开三源《法句》",
    source: "T0210 · 巴利 Dhp · Müller 1881",
    tone: "ink",
  },
  {
    id: "heart",
    number: "03",
    icon: Compass,
    question: "想从五蕴、空与无所得进入般若",
    title: "用七天慢读《心经》",
    work: "《心经》七日路径",
    texture: "篇幅极短、概念密度很高；适合反复回到同一句",
    pace: "每天约 5 分钟",
    reason: "七个问题把“照见、五蕴、空、无所得”放回玄奘译原句，不让熟悉名句脱离上下文。",
    boundary: "短不等于浅，也不保证第一次就容易理解；遇到术语障碍，可以先进入概念页再回来。",
    href: "/xue/xinjing",
    action: "开始《心经》第一天",
    source: "玄奘译 T0251 · 7 个稳定行段",
    tone: "cinnabar",
  },
  {
    id: "diamond",
    number: "04",
    icon: Layers3,
    question: "正在追问：行动、发心与不执著如何并存",
    title: "沿问答读《金刚经》",
    work: "《金刚经》七日核读",
    texture: "问答、反转与重复辨析；适合慢读，不适合只摘一句定论",
    pace: "每天 8–12 分钟",
    reason: "从“云何住”到“如是观”，把不住、生心、四相与譬喻放在连续问题里核读。",
    boundary: "路径只提供七个原文关口，不替代整经，也不把平台提示当成唯一的般若解释。",
    href: "/xue/jingangjing",
    action: "开始《金刚经》核读",
    source: "鸠摩罗什译 T0235 · 7 种文本表达入口",
    tone: "gold",
  },
  {
    id: "amitabha",
    number: "05",
    icon: BookMarked,
    question: "想从信、愿、持名理解净土经典的原文依据",
    title: "从闻说进入《阿弥陀经》",
    work: "《阿弥陀经》七日净读",
    texture: "叙说、劝信与发愿相连；适合修持者，也可作文本理解",
    pace: "每天约 10 分钟",
    reason: "以鸠摩罗什译为底本，从闻说、极乐、发愿与持名进入；需要比较时再打开玄奘译。",
    boundary: "平台说明修学语境与版本差异，但不代替师承、法师开示或个人宗教抉择。",
    href: "/xue/amituojing",
    action: "开始《阿弥陀经》净读",
    source: "T0366 底本 · T0367 相关段",
    tone: "blue",
  },
  {
    id: "lotus",
    number: "06",
    icon: BookOpenText,
    question: "愿意进入长篇叙事、譬喻与菩萨行的展开",
    title: "从七处转折走进《法华经》",
    work: "《法华经》七关地图",
    texture: "长经、譬喻与多品展开；适合愿意保留上下文的读者",
    pace: "每关 15–30 分钟",
    reason: "先经过方便、火宅、药草、承持、踊出、寿量与普门，再回到二十八品完整原文。",
    boundary: "七关是进入长经的路标，不是全经摘要；完成七关也不等于已经读完或掌握整部经典。",
    href: "/xue/fahuajing",
    action: "打开《法华经》七关",
    source: "鸠摩罗什译 T0262 · 7 处稳定行段",
    tone: "lotus",
  },
] as const;

const faqs = [
  {
    question: "初学佛经是否必须先读《心经》？",
    answer:
      "不必。篇幅短不等于概念简单。可以先按自己真正关心的问题、喜欢的文本质地和可投入时间选择；若仍不确定，从每日一段观察兴趣成本最低。",
  },
  {
    question: "可以同时读几部经吗？",
    answer:
      "可以，但第一次进入时，先完成一小段连贯路径更容易保留上下文。需要比较版本时，再把同一作品的不同表达并排，而不是把多部经文混成一个答案。",
  },
  {
    question: "这里的推荐是否代表宗派次第或修行指导？",
    answer:
      "不是。页面只依据站内已有原文、阅读长度与文本结构提供导航，不裁定宗派高下，也不代替法师、师承或现实处境中的判断。",
  },
  {
    question: "研究者应从哪里开始？",
    answer:
      "若目标是核对译本、书目或引文，不必先走入门顺序；可直接进入异译对读、经藏目录或研究工作台，并保留版本、稳定段号与来源边界。",
  },
] as const;

const pageJsonLdBase = buildPageJsonLd({
  path: pagePath,
  title: pageTitle,
  description: pageDescription,
  type: "CollectionPage",
  breadcrumb: [
    { name: "首页", path: "/" },
    { name: "研读", path: "/xue" },
    { name: "选经", path: pagePath },
  ],
  about: ["佛经入门", "初学佛经", "佛经阅读顺序", "心经", "金刚经", "法句经", "阿弥陀经", "法华经"],
  mainEntityId: `${absoluteUrl(pagePath)}#routes`,
});

const pageJsonLd = {
  ...pageJsonLdBase,
  "@graph": [
    ...(pageJsonLdBase["@graph"] as Array<Record<string, unknown>>),
    {
      "@type": "ItemList",
      "@id": `${absoluteUrl(pagePath)}#routes`,
      name: "按目的与读法选择佛经入门路径",
      numberOfItems: readingRoutes.length,
      itemListElement: readingRoutes.map((route, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: route.title,
        description: route.reason,
        url: absoluteUrl(route.href),
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

export default function ScriptureFinderPage() {
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
          <span>选经</span>
        </nav>

        <header className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>佛经入门 · CHOOSE BY PURPOSE</p>
            <h1>
              <span>先别问哪部<em>最好。</em></span>
              <span>先问此刻<span className={styles.keepTogether}>为何而读。</span></span>
            </h1>
            <p className={styles.lead}>
              佛经没有一条适用于所有人的排行榜。把目的、文本质地和可用时间说清楚，
              再选一条能真正打开原文的窄入口，比收藏一张宏大书单更容易开始。
            </p>
            <div className={styles.heroActions}>
              <a href="#routes">按目的选入口 <ArrowRight aria-hidden="true" /></a>
              <Link href="/xue/meiri">仍不确定？先读一段</Link>
            </div>
          </div>

          <aside className={styles.compassCard} aria-label="选经的三个判断步骤">
            <div className={styles.compassMark} aria-hidden="true">
              <Compass />
              <span>選</span>
            </div>
            <ol>
              <li>
                <span>01</span>
                <div><strong>目的</strong><small>我此刻在追问什么？</small></div>
              </li>
              <li>
                <span>02</span>
                <div><strong>质地</strong><small>短偈、问答还是长篇叙事？</small></div>
              </li>
              <li>
                <span>03</span>
                <div><strong>尺度</strong><small>先完成一个可返回的小段落</small></div>
              </li>
            </ol>
            <p>选择是一张可修改的阅读假设，不是终身标签。</p>
          </aside>
        </header>

        <section className={styles.quickStart} aria-labelledby="quick-start-title">
          <div>
            <p className={styles.eyebrow}>先回答一个问题</p>
            <h2 id="quick-start-title">哪一句最像你现在的状态？</h2>
          </div>
          <nav aria-label="按当前状态跳到选经路径">
            <a href="#daily"><Clock3 aria-hidden="true" /><span>只有几分钟</span><strong>先读一段</strong></a>
            <a href="#dhammapada"><Quote aria-hidden="true" /><span>喜欢短句</span><strong>读《法句》</strong></a>
            <a href="#heart"><Compass aria-hidden="true" /><span>想理解空</span><strong>读《心经》</strong></a>
            <a href="#amitabha"><BookMarked aria-hidden="true" /><span>关心信愿</span><strong>读《阿弥陀经》</strong></a>
            <a href="#lotus"><BookOpenText aria-hidden="true" /><span>愿意读长经</span><strong>进《法华经》</strong></a>
            <a href="#research"><Fingerprint aria-hidden="true" /><span>要版本坐标</span><strong>直接做研究</strong></a>
          </nav>
        </section>

        <section className={styles.routesSection} id="routes" aria-labelledby="routes-title">
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>六条已开放路径 · SIX OPEN DOORS</p>
              <h2 id="routes-title">不排高下，只说明入口成本与阅读边界。</h2>
            </div>
            <p>
              每条路径都已有可核验原文、稳定坐标和继续阅读全文的链接。
              推荐理由是编辑导航，不是对经典价值或读者根器的判断。
            </p>
          </div>

          <div className={styles.routeGrid}>
            {readingRoutes.map((route) => {
              const Icon = route.icon;
              return (
                <article
                  className={`${styles.routeCard} ${styles[`route_${route.tone}`]}`}
                  id={route.id}
                  key={route.id}
                  data-scripture-route={route.id}
                >
                  <div className={styles.routeTopline}>
                    <span>{route.number}</span>
                    <Icon aria-hidden="true" />
                  </div>
                  <p className={styles.routeQuestion}>如果你：{route.question}</p>
                  <h3>{route.title}</h3>
                  <p className={styles.routeWork}>{route.work}</p>
                  <dl>
                    <div><dt>文本质地</dt><dd>{route.texture}</dd></div>
                    <div><dt>起步尺度</dt><dd>{route.pace}</dd></div>
                  </dl>
                  <p className={styles.routeReason}>{route.reason}</p>
                  <p className={styles.routeBoundary}><Scale aria-hidden="true" /> <span><strong>边界：</strong>{route.boundary}</span></p>
                  <div className={styles.routeFooter}>
                    <small>{route.source}</small>
                    <Link
                      href={route.href}
                      data-analytics-event="scripture_path_selected"
                      data-analytics-location="scripture_finder"
                      data-analytics-content-id={route.id}
                      data-analytics-label={route.action}
                    >
                      {route.action} <ArrowRight aria-hidden="true" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className={styles.detourSection} aria-labelledby="detour-title">
          <div className={styles.detourNumber} aria-hidden="true">詞</div>
          <div>
            <p className={styles.eyebrow}>也可以暂时不选一部经</p>
            <h2 id="detour-title">如果卡住的是术语，先从概念回到原典。</h2>
            <p>
              苦、四圣谛、八正道、五蕴、缘起、空、无常、无我、无住与观心已经整理为受控证据页。
              先弄清问题边界，再决定要追进哪部经典，往往比硬读一部长经更诚实。
            </p>
          </div>
          <Link href="/gainian">
            浏览十个概念入口 <ArrowRight aria-hidden="true" />
          </Link>
        </section>

        <section className={styles.researchSection} id="research" aria-labelledby="research-title">
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>研究者不必经过“入门书单”</p>
              <h2 id="research-title">若任务是核对，就从版本与坐标开始。</h2>
            </div>
            <p>研究路径不把“容易读”当作首要条件，而先确认作品关系、底本、译者、稳定段号与证据范围。</p>
          </div>
          <div className={styles.researchGrid}>
            <article>
              <Languages aria-hidden="true" />
              <small>COMPARE</small>
              <h3>同一作品，先看不同表达</h3>
              <p>心经、金刚经、阿弥陀经与汉巴 EBT 书案均明确区分同作品表达、相关段落和机器候选。</p>
              <Link href="/duidu">进入异译与跨本对读 <ArrowRight aria-hidden="true" /></Link>
            </article>
            <article>
              <Fingerprint aria-hidden="true" />
              <small>ASSESS</small>
              <h3>把判断写成主张—证据矩阵</h3>
              <p>从经卷选中稳定原文，标记支持、限定、反证或背景，再连同版本坐标导出。</p>
              <Link href="/yanjiu">打开本地研究工作台 <ArrowRight aria-hidden="true" /></Link>
            </article>
          </div>
        </section>

        <section className={styles.contractSection} aria-labelledby="contract-title">
          <div>
            <ShieldCheck aria-hidden="true" />
            <p className={styles.eyebrow}>选经契约 · EDITORIAL CONTRACT</p>
            <h2 id="contract-title">导航可以明确，权威不能伪造。</h2>
          </div>
          <ol>
            <li><span>01</span><p><strong>只推荐已经能打开的路径</strong>每个入口都返回具体原文、版本与稳定坐标，不用尚未完成的愿景充当内容。</p></li>
            <li><span>02</span><p><strong>不发明唯一阅读顺序</strong>佛教徒、爱好者与研究者的任务不同；阅读目的比一张统一排行榜更有解释力。</p></li>
            <li><span>03</span><p><strong>把不适用范围写在推荐旁</strong>短经不等于浅，七关不等于全经，对读不等于逐句相同。</p></li>
          </ol>
        </section>

        <section className={styles.faqSection} id="questions" aria-labelledby="questions-title">
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>开始之前 · FOUR QUESTIONS</p>
              <h2 id="questions-title">把常见误会先放下。</h2>
            </div>
            <p>这些回答说明的是本站导航方法，不替任何传统规定修学次第。</p>
          </div>
          <div className={styles.faqList}>
            {faqs.map((faq, index) => (
              <details key={faq.question} open={index === 0}>
                <summary><span>{String(index + 1).padStart(2, "0")}</span>{faq.question}</summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className={styles.catalogSection} aria-labelledby="catalog-title">
          <div>
            <p className={styles.eyebrow}>已经知道经名？</p>
            <h2 id="catalog-title">不需要推荐，直接打开原文。</h2>
            <p>经藏目录适合按经名、经号、译者或语种查找；记得原句时，改用全文逐字检索。</p>
          </div>
          <div>
            <Link href="/jingzang"><LibraryBig aria-hidden="true" /> 浏览经藏目录 <ArrowRight aria-hidden="true" /></Link>
            <Link href="/jingzang/quanwen"><Search aria-hidden="true" /> 逐字查一句经文</Link>
          </div>
        </section>
      </div>
    </div>
  );
}

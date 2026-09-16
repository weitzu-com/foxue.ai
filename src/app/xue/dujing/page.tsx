import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpenCheck,
  BookOpenText,
  CircleAlert,
  Compass,
  Fingerprint,
  Languages,
  LibraryBig,
  Microscope,
  Quote,
  Scale,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { verifiedQuoteEvidence } from "@/lib/quote-verification";
import {
  absoluteUrl,
  buildPageJsonLd,
  buildPageMetadata,
  serializeJsonLd,
} from "@/lib/site-metadata";
import styles from "./page.module.css";

const pagePath = "/xue/dujing";
const pageTitle = "佛经怎么读懂｜从原文、上下文到版本复核";
const pageDescription =
  "佛经读不懂怎么办？用四步证据读经法确认文本身份、阅读全文上下文、辨认佛学术语并记录可证边界，适合佛教徒、爱好者与研究者。";

export const metadata: Metadata = buildPageMetadata({
  title: pageTitle,
  description: pageDescription,
  path: pagePath,
});

const methodSteps = [
  {
    number: "01",
    id: "identity",
    icon: Fingerprint,
    label: "IDENTITY",
    title: "先认文本，不急着解释",
    question: "这句话属于哪部作品、哪个译本、哪一卷或哪一品？",
    action: "先记下经名、译者、经号与稳定位置。若只能找到一句流行转述，先核对它是不是原句。",
    stop: "不知道底本身份时，先停在“待核对”，不要把熟悉措辞加上引号当佛经。",
    link: "/hedui",
    linkLabel: "核对一句流行说法",
  },
  {
    number: "02",
    id: "context",
    icon: BookOpenCheck,
    label: "CONTEXT",
    title: "再读前后，不让摘句独行",
    question: "谁在说、对谁说、在回答什么问题，前后发生了什么？",
    action: "至少打开当前稳定版页；短经读完整篇，长经读完一个连续问答、偈组或品次。",
    stop: "前后文改变了语气、对象或论证范围时，放弃原先那句过快的概括。",
    link: "/jingzang",
    linkLabel: "进入完整经藏",
  },
  {
    number: "03",
    id: "terms",
    icon: Languages,
    label: "TERMS",
    title: "圈出名相，暂缓换成白话",
    question: "哪些词在这里不是日常汉语？同一个汉字是否承载特定翻译传统？",
    action: "一次只查一至三个关键词；把平台提示、古代注疏、现代解释与经文原句分层记录。",
    stop: "没有证据支持唯一释义时，保留两个可能读法，并说明各自来自哪里。",
    link: "/gainian",
    linkLabel: "从十个概念入口查证",
  },
  {
    number: "04",
    id: "verify",
    icon: Scale,
    label: "VERIFY",
    title: "最后复核，只说证据允许的话",
    question: "另一译本、相邻段落或反例会不会限制我刚才的理解？",
    action: "写下“可以确认”与“仍不能确认”；研究任务再加入异译、候选关系和反证。",
    stop: "相关不等于相同，并排不等于逐句对齐；不能证明的部分明确留下。",
    link: "/yanjiu",
    linkLabel: "把判断放进证据矩阵",
  },
] as const;

const readerLenses = [
  {
    icon: Sparkles,
    label: "佛教徒 · 读诵与受持",
    title: "先让原句完整出现",
    description:
      "可从读诵、静读或日课进入；平台帮助保留出处与上下文，但不替代师承、法师开示或所属传统的修学要求。",
    prompt: "今天只问：哪一句需要再读一遍？",
  },
  {
    icon: Compass,
    label: "佛学爱好者 · 理解与探索",
    title: "先理解问题，再收集答案",
    description:
      "把人物、场景、譬喻和关键词放回连续文本；遇到陌生术语时先缩小问题，不急着拼成一套宏大教义。",
    prompt: "今天只问：这段经文在回答什么？",
  },
  {
    icon: Microscope,
    label: "研究者 · 校读与论证",
    title: "先固定版本，再提出主张",
    description:
      "区分作品、文本表达与具体见证；保留经号、译者、稳定行段、关系状态和反证，不让引用脱离底本。",
    prompt: "今天只问：这个判断能否由他人复查？",
  },
] as const;

const obstacles = [
  {
    title: "字面读不顺",
    diagnosis: "可能是古汉语句法、译经语序或当前断句造成的困难。",
    next: "放慢到一个连续句群，先标人名、动词与问答关系；不要立刻改写原文。",
    href: "/xue/meiri",
    action: "从每日短段练习",
  },
  {
    title: "名相太密",
    diagnosis: "一个短句可能同时压入五蕴、缘起、空、无我等多层术语。",
    next: "一次只查一个词，记录它在当前段落能说明什么，以及还不能说明什么。",
    href: "/gainian",
    action: "打开概念证据页",
  },
  {
    title: "一句话太熟",
    diagnosis: "熟悉可能来自现代转述、海报或二次改写，不等于底本文字。",
    next: "先核对逐字出处，再打开前后文；近似说法不要继续加引号。",
    href: "/hedui",
    action: "核对佛经名句",
  },
  {
    title: "译本彼此不同",
    diagnosis: "差异可能来自译者、年代、底本或作品关系，不应自动抹平。",
    next: "先确认是否为同一作品表达、相关段落或仍待裁决的候选关系。",
    href: "/duidu",
    action: "进入受控对读",
  },
  {
    title: "想形成研究结论",
    diagnosis: "单一摘句只能提供入口，通常不足以承担完整论证。",
    next: "限定问题与来源范围，再分别标记支持、限定、反证、背景与不纳入。",
    href: "/yanjiu",
    action: "建立证据矩阵",
  },
] as const;

const faqs = [
  {
    question: "佛经一定要从头读到尾吗？",
    answer:
      "不一定。短经适合先读完整篇；长经可以从一个品、一个连续问答或一个有稳定出处的段落进入。但任何摘读都应保留它在全经中的位置，并避免把局部当作全经摘要。",
  },
  {
    question: "读不懂时，可以先看白话解释吗？",
    answer:
      "可以把具名翻译、注疏或现代解释当作辅助，但要与经文原句分开标示。先确认解释者、文本范围与所据版本，再回到原文检查它解释了什么、遗漏了什么。",
  },
  {
    question: "只摘抄一句经文可以吗？",
    answer:
      "可以用于记忆、读诵或提出问题；引用时应同时保留经名、译者、经号和稳定位置。若要据此解释义理，还需读前后文并说明结论范围。",
  },
  {
    question: "四步法是否代表某个宗派的修学次第？",
    answer:
      "不是。它是本站用于降低误引、断章与版本混淆的阅读工作流，不裁定宗派高下，也不替代受持仪轨、师承指导、传统注疏或学术训练。",
  },
] as const;

function getWorkedEvidence() {
  const evidence = verifiedQuoteEvidence.find((item) => item.id === "dhammapada-all-buddhas");
  if (!evidence) {
    throw new Error("读经方法页缺少已核验的《法句经》示例");
  }
  return evidence;
}

const workedEvidence = getWorkedEvidence();

const pageJsonLdBase = buildPageJsonLd({
  path: pagePath,
  title: pageTitle,
  description: pageDescription,
  type: "WebPage",
  breadcrumb: [
    { name: "首页", path: "/" },
    { name: "研读", path: "/xue" },
    { name: "读经方法", path: pagePath },
  ],
  about: ["佛经怎么读", "佛经读不懂", "读经方法", "佛经原文", "佛经版本", "佛学研究方法"],
  mainEntityId: `${absoluteUrl(pagePath)}#method`,
});

const pageJsonLd = {
  ...pageJsonLdBase,
  "@graph": [
    ...pageJsonLdBase["@graph"],
    {
      "@type": "LearningResource",
      "@id": `${absoluteUrl(pagePath)}#method`,
      name: "四步证据读经法",
      description: pageDescription,
      url: absoluteUrl(pagePath),
      inLanguage: "zh-Hans",
      educationalUse: ["佛经阅读", "佛学自学", "佛典研究"],
      audience: readerLenses.map((lens) => ({
        "@type": "Audience",
        audienceType: lens.label.split(" · ")[0],
      })),
      hasPart: { "@id": `${absoluteUrl(pagePath)}#steps` },
      isPartOf: { "@id": `${absoluteUrl(pagePath)}#page` },
    },
    {
      "@type": "HowTo",
      "@id": `${absoluteUrl(pagePath)}#steps`,
      name: "怎样从一段佛经原文形成可复核的理解",
      description: "依次确认文本身份、阅读全文上下文、辨认佛学术语，并复核结论边界。",
      inLanguage: "zh-Hans",
      step: methodSteps.map((step, index) => ({
        "@type": "HowToStep",
        position: index + 1,
        name: step.title,
        text: `${step.question}${step.action}${step.stop}`,
        url: `${absoluteUrl(pagePath)}#${step.id}`,
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

export default function ScriptureReadingMethodPage() {
  return (
    <div className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(pageJsonLd) }}
      />

      <div className={`page-shell ${styles.shell}`}>
        <nav className={styles.breadcrumb} aria-label="面包屑">
          <Link href="/">首页</Link>
          <span aria-hidden="true">/</span>
          <Link href="/xue">研读</Link>
          <span aria-hidden="true">/</span>
          <span>读经方法</span>
        </nav>

        <header className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>读经方法 · READ WITH EVIDENCE</p>
            <h1>
              读不懂，<br />不要急着找<em>结论。</em>
            </h1>
            <p className={styles.lead}>
              先确认这是什么文本，再读它的前后，辨认其中的名相，最后才写下自己能证明到哪里。
              四步不是唯一修学次第，而是一条防止误引、断章与版本混淆的最短路径。
            </p>
            <div className={styles.heroActions}>
              <a href="#method">现在读一段 <ArrowRight aria-hidden="true" /></a>
              <Link href="/xue/xuanjing">还没有选经？先找入口</Link>
            </div>
          </div>

          <aside className={styles.folioCard} aria-label="读一段经文前的四个问题">
            <div className={styles.folioMark} aria-hidden="true">
              <BookOpenText />
              <span>讀</span>
            </div>
            <p>先在页边写下四问</p>
            <ol>
              <li><span>一</span><strong>这是什么文本？</strong><small>经名 · 译者 · 经号 · 位置</small></li>
              <li><span>二</span><strong>前后在说什么？</strong><small>人物 · 场景 · 问答 · 段落</small></li>
              <li><span>三</span><strong>哪些词不能想当然？</strong><small>名相 · 译语 · 注释来源</small></li>
              <li><span>四</span><strong>证据允许我说到哪里？</strong><small>确认 · 限定 · 未知 · 反证</small></li>
            </ol>
            <div className={styles.folioSeal}>不替原典说话</div>
          </aside>
        </header>

        <section className={styles.lenses} aria-labelledby="lenses-title">
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>先说清为什么读</p>
              <h2 id="lenses-title">同一段经文，可以有三种认真。</h2>
            </div>
            <p>身份不是等级，也不是固定标签。读诵者可以查版本，研究者也可以先安静地读完一段。</p>
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
                  <strong>{lens.prompt}</strong>
                </article>
              );
            })}
          </div>
        </section>

        <section className={styles.method} id="method" aria-labelledby="method-title">
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>四步证据读经法 · FOUR PASSES</p>
              <h2 id="method-title">每一步都减少一种过早确定。</h2>
            </div>
            <p>不要求一次看懂整部经。先完成一段可返回、可核对、可继续追问的阅读。</p>
          </div>

          <ol className={styles.methodList}>
            {methodSteps.map((step) => {
              const Icon = step.icon;
              return (
                <li id={step.id} key={step.id} data-reading-step={step.id}>
                  <div className={styles.stepRail} aria-hidden="true">
                    <span>{step.number}</span>
                    <Icon />
                  </div>
                  <article>
                    <small>{step.label}</small>
                    <h3>{step.title}</h3>
                    <blockquote>{step.question}</blockquote>
                    <dl>
                      <div><dt>最小动作</dt><dd>{step.action}</dd></div>
                      <div><dt>停下条件</dt><dd>{step.stop}</dd></div>
                    </dl>
                    <Link href={step.link}>{step.linkLabel} <ArrowUpRight aria-hidden="true" /></Link>
                  </article>
                </li>
              );
            })}
          </ol>
        </section>

        <section className={styles.example} aria-labelledby="example-title">
          <div className={styles.exampleHeading}>
            <div>
              <p className={styles.eyebrow}>一段做完 · WORKED EXAMPLE</p>
              <h2 id="example-title">不要解释得更多，先核对得更好。</h2>
            </div>
            <span>{workedEvidence.canonId}</span>
          </div>

          <div className={styles.exampleGrid}>
            <blockquote className={styles.scriptureQuote}>
              <Quote aria-hidden="true" />
              <p>{workedEvidence.quote}</p>
              <footer>
                <strong>{workedEvidence.title}</strong>
                <span>{workedEvidence.attribution} · {workedEvidence.locator}</span>
              </footer>
            </blockquote>

            <ol className={styles.exampleNotes}>
              <li>
                <span>01</span>
                <div><strong>身份</strong><p>这是本站逐字复核的 T0210 汉译原句；常见“众善奉行”与底本“诸善奉行”不同。</p></div>
              </li>
              <li>
                <span>02</span>
                <div><strong>上下文</strong><p>引用落在《法句经》卷下述佛品；先打开稳定版页，而不是只保存四句截图。</p></div>
              </li>
              <li>
                <span>03</span>
                <div><strong>名相</strong><p>“诸佛教”在这里首先是底本文字；进一步解释仍需说明所据注疏或传统。</p></div>
              </li>
              <li>
                <span>04</span>
                <div><strong>边界</strong><p>可确认此句见于 T0210；不能因此断言所有《法句》文本逐字相同或整部佛法只有这一种表达。</p></div>
              </li>
            </ol>
          </div>

          <div className={styles.exampleActions}>
            <Link href={workedEvidence.href}>打开原句与稳定行段 <ArrowRight aria-hidden="true" /></Link>
            <Link href="/xue/faju">继续汉译、巴利与英译三源研读</Link>
          </div>
        </section>

        <section className={styles.obstacles} aria-labelledby="obstacles-title">
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>卡住时不要硬猜</p>
              <h2 id="obstacles-title">先诊断是哪一种“读不懂”。</h2>
            </div>
            <p>文字、术语、出处、译本和论证是五种不同问题，需要不同工具。</p>
          </div>

          <div className={styles.obstacleList}>
            {obstacles.map((obstacle, index) => (
              <article key={obstacle.title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{obstacle.title}</h3>
                <p>{obstacle.diagnosis}</p>
                <p><strong>下一步：</strong>{obstacle.next}</p>
                <Link href={obstacle.href}>{obstacle.action} <ArrowRight aria-hidden="true" /></Link>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.contract} aria-labelledby="contract-title">
          <div>
            <ShieldCheck aria-hidden="true" />
            <p className={styles.eyebrow}>方法边界 · METHOD BOUNDARY</p>
            <h2 id="contract-title">方法可以公开，权威不能伪造。</h2>
          </div>
          <ul>
            <li><span>原典</span><p>经文保持底本文字、译者与稳定位置；平台不会生成缺失段落或现代综合经文。</p></li>
            <li><span>解释</span><p>编辑提示只帮助定位问题，不冒充佛说、师承、注疏结论或学术共识。</p></li>
            <li><span>差异</span><p>同作品、相关段落与候选关系分层呈现；相似措辞不自动证明相同文本。</p></li>
          </ul>
        </section>

        <section className={styles.faq} id="questions" aria-labelledby="questions-title">
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>开始之前 · FOUR QUESTIONS</p>
              <h2 id="questions-title">把最常见的捷径先说清。</h2>
            </div>
            <p>这里说明的是证据阅读纪律，不规定个人信仰、宗派归属或日课仪轨。</p>
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

        <section className={styles.next} aria-labelledby="next-title">
          <div>
            <p className={styles.eyebrow}>现在开始 · CHOOSE ONE PASSAGE</p>
            <h2 id="next-title">今天不用读完一部经，只需认真读完一段。</h2>
          </div>
          <div className={styles.nextLinks}>
            <Link href="/xue/meiri"><BookOpenText aria-hidden="true" /> 从每日一段开始 <ArrowRight aria-hidden="true" /></Link>
            <Link href="/xue/xuanjing"><Compass aria-hidden="true" /> 按目的选择经典</Link>
            <Link href="/jingzang/quanwen"><Search aria-hidden="true" /> 逐字查一句经文</Link>
            <Link href="/jingzang"><LibraryBig aria-hidden="true" /> 浏览完整经藏</Link>
          </div>
          <p className={styles.nextNote}><CircleAlert aria-hidden="true" /> 若涉及个人修行、戒律、身心健康或重大生活决定，请同时寻求所属传统的合格指导与相应专业支持。</p>
        </section>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookOpenText,
  CheckCircle2,
  CircleDashed,
  ExternalLink,
  Fingerprint,
  GitCompareArrows,
  Languages,
  Scale,
  UsersRound,
} from "lucide-react";
import {
  ebtEvidenceCases,
  ebtEvidenceDeskSnapshot,
  verifyEbtEvidenceDesk,
} from "@/lib/ebt-evidence-desk";
import {
  absoluteUrl,
  buildPageJsonLd,
  buildPageMetadata,
  serializeJsonLd,
} from "@/lib/site-metadata";
import styles from "./page.module.css";

const pagePath = "/duidu/ebt";
const pageTitle = "汉巴早期佛典 EBT 证据书案｜原文、反证与复核状态";
const pageDescription =
  "从五蕴、锯喻与央掘魔罗三个书案进入汉巴早期佛典：直达巴利原文、Sujato 英译与阿含候选范围，并公开反证、证据哈希和双人复核状态。";

export const metadata: Metadata = buildPageMetadata({
  title: pageTitle,
  description: pageDescription,
  path: pagePath,
});

const audienceRoutes = [
  {
    icon: BookOpenText,
    label: "佛教徒",
    title: "从能修、能读的主题进入",
    description: "先选五蕴、慈心或生命转变等问题，读完整原文；跨传统关系只是帮助照见语境。",
    href: "#wuyun",
  },
  {
    icon: Languages,
    label: "佛学爱好者",
    title: "从相似处继续追问差异",
    description: "看共享人物、譬喻与教义结构，也看一篇经从哪里开始不再相同。",
    href: "#saw",
  },
  {
    icon: Fingerprint,
    label: "研究者",
    title: "从范围、版本与反证复核",
    description: "每案给出原文落点、机器定位边界、证据哈希与未完成的人类判断。",
    href: "#angulimala",
  },
] as const;

const contractSteps = [
  {
    state: "已固定",
    title: "原文资产与稳定坐标",
    description: "巴利源文件、汉译 CBETA 范围和数据版本已经固定，可直接回到底本。",
    icon: CheckCircle2,
  },
  {
    state: "已保存",
    title: "支持线索与最强反证",
    description: "上游备注不被删成一个“对应”标签；范围冲突与替代平行一起进入书案。",
    icon: CheckCircle2,
  },
  {
    state: "待真人",
    title: "两次独立复核",
    description: "AI 只能整理材料，不能冒充复核者；两名具名真人必须独立提交判断。",
    icon: CircleDashed,
  },
  {
    state: "未发生",
    title: "裁决、作品合并与逐段对齐",
    description: "裁决数仍为零，因此不改变作品分母，也不发布机器生成的经文对应表。",
    icon: CircleDashed,
  },
] as const;

const pageJsonLdBase = buildPageJsonLd({
  path: pagePath,
  title: pageTitle,
  description: pageDescription,
  type: "CollectionPage",
  breadcrumb: [
    { name: "首页", path: "/" },
    { name: "对读", path: "/duidu" },
    { name: "汉巴 EBT 证据书案", path: pagePath },
  ],
  about: ["早期佛典", "巴利尼柯耶", "汉译阿含", "平行经", "文本范围", "双人复核"],
  mainEntityId: `${absoluteUrl(pagePath)}#cases`,
});

const pageJsonLd = {
  ...pageJsonLdBase,
  "@graph": [
    ...(pageJsonLdBase["@graph"] as Array<Record<string, unknown>>),
    {
      "@type": "ItemList",
      "@id": `${absoluteUrl(pagePath)}#cases`,
      name: "首批汉巴早期佛典证据书案",
      numberOfItems: ebtEvidenceCases.length,
      itemListElement: ebtEvidenceCases.map((evidenceCase, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: evidenceCase.title,
        description: evidenceCase.openQuestion,
        url: `${absoluteUrl(pagePath)}#${evidenceCase.id}`,
      })),
    },
  ],
};

function decisionLabel(decisionClass: string) {
  return decisionClass === "component_parallel_within_registered_work"
    ? "合集内部组件关系"
    : "近似或部分平行";
}

export default function EbtEvidenceDeskPage() {
  verifyEbtEvidenceDesk();

  return (
    <div className={styles.page} data-ebt-evidence-desk>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(pageJsonLd) }}
      />
      <div className={`page-shell ${styles.shell}`}>
        <nav className={styles.breadcrumb} aria-label="面包屑">
          <Link href="/duidu"><ArrowLeft aria-hidden="true" /> 对读书案</Link>
          <span aria-hidden="true">/</span>
          <span>汉巴 EBT</span>
        </nav>

        <header className={styles.hero}>
          <div className={styles.heroCopy}>
            <p>EARLY BUDDHIST TEXTS · EVIDENCE DESK 01</p>
            <h1>相似，<em>先不是相同。</em></h1>
            <p>
              汉译阿含与巴利尼柯耶彼此照见，最珍贵的不是快速得出“同一篇”，
              而是把共享结构、文本范围和反证同时摊开。这里先开放三份可读、可查、仍未裁决的证据书案。
            </p>
            <div className={styles.heroActions}>
              <a href="#cases"><GitCompareArrows aria-hidden="true" /> 打开三份书案</a>
              <Link href="/shenjiao">进入完整复核队列</Link>
            </div>
          </div>

          <aside className={styles.ledger} aria-label="汉巴证据账本当前状态">
            <div className={styles.ledgerHeading}>
              <span>固定账本</span>
              <code>PRE-ADJUDICATION</code>
            </div>
            <dl>
              <div>
                <dt>关系证据</dt>
                <dd>{ebtEvidenceDeskSnapshot.parallelEdges.toLocaleString("zh-CN")}</dd>
              </div>
              <div>
                <dt>待审关系</dt>
                <dd>{ebtEvidenceDeskSnapshot.reviewQueueItems}</dd>
              </div>
              <div>
                <dt>P0 证据包</dt>
                <dd>{ebtEvidenceDeskSnapshot.p0Packets}</dd>
              </div>
              <div className={styles.zeroMetric}>
                <dt>已裁决</dt>
                <dd>{ebtEvidenceDeskSnapshot.adjudicatedItems}</dd>
              </div>
            </dl>
            <p><Scale aria-hidden="true" /> 关系表是查证入口，不是作品合并表。</p>
          </aside>
        </header>

        <section className={styles.audienceSection} aria-labelledby="ebt-audiences-title">
          <header>
            <p>三种读法 · ONE EVIDENCE CONTRACT</p>
            <h2 id="ebt-audiences-title">先选一个真实问题，再走进异本。</h2>
          </header>
          <div className={styles.audienceGrid}>
            {audienceRoutes.map((route) => {
              const Icon = route.icon;
              return (
                <a href={route.href} key={route.label}>
                  <Icon aria-hidden="true" />
                  <small>{route.label}</small>
                  <strong>{route.title}</strong>
                  <span>{route.description}</span>
                  <i>进入这一案 <ArrowRight aria-hidden="true" /></i>
                </a>
              );
            })}
          </div>
        </section>

        <main className={styles.cases} id="cases" aria-labelledby="ebt-cases-title">
          <header className={styles.sectionHeading}>
            <div>
              <p>首批书案 · 3 CONTROLLED CASE FILES</p>
              <h2 id="ebt-cases-title">每一案，都把“还不知道”放在正文里。</h2>
            </div>
            <p>
              巴利原文与 Sujato 英译属于同一已核验作品表达；汉译只以候选关系加入，
              不被塞进同作品切换器，也不声称逐句对齐。
            </p>
          </header>

          <div className={styles.caseList}>
            {ebtEvidenceCases.map((evidenceCase) => (
              <article
                className={`${styles.caseFile} ${styles[evidenceCase.tone]}`}
                id={evidenceCase.id}
                key={evidenceCase.id}
                data-ebt-case={evidenceCase.id}
              >
                <header>
                  <span>{evidenceCase.number}</span>
                  <div>
                    <small>{evidenceCase.eyebrow}</small>
                    <h3>{evidenceCase.title}</h3>
                  </div>
                  <code>{decisionLabel(evidenceCase.packet.sourceRelationship.decisionClass)}</code>
                </header>

                <div className={styles.caseBody}>
                  <div className={styles.caseReading}>
                    <p>{evidenceCase.lead}</p>
                    <div className={styles.sourceGrid} aria-label={`${evidenceCase.title}原文入口`}>
                      <Link href={evidenceCase.paliHref} prefetch={false}>
                        <small>PĀLI · 原文</small>
                        <strong>{evidenceCase.packet.pali.reference.toUpperCase()}</strong>
                        <span>{evidenceCase.packet.pali.title} · {evidenceCase.paliSegments.toLocaleString("zh-CN")} 个稳定段</span>
                        <i>读巴利底本 <ArrowRight aria-hidden="true" /></i>
                      </Link>
                      <Link href={evidenceCase.englishHref} prefetch={false}>
                        <small>ENGLISH · 辅助译读</small>
                        <strong>Sujato EN</strong>
                        <span>同一巴利作品的 CC0 英译表达；不是汉巴关系裁决依据</span>
                        <i>读英文译本 <ArrowRight aria-hidden="true" /></i>
                      </Link>
                      <Link href={evidenceCase.chineseHref} prefetch={false}>
                        <small>漢譯 · 候选范围</small>
                        <strong>{evidenceCase.packet.chinese.reference.toUpperCase()}</strong>
                        <span>{evidenceCase.packet.chinese.title} {evidenceCase.packet.chinese.cbetaId} · {evidenceCase.packet.chinese.exactInternalRange.stableSegments} 个稳定段</span>
                        <i>从首行读汉译 <ArrowRight aria-hidden="true" /></i>
                      </Link>
                    </div>
                  </div>

                  <aside className={styles.evidenceNote}>
                    <div>
                      <small>证据现在能说什么</small>
                      <p>{evidenceCase.evidenceReading}</p>
                    </div>
                    <div>
                      <small>这一案停在哪里</small>
                      <p>{evidenceCase.openQuestion}</p>
                    </div>
                  </aside>
                </div>

                <footer>
                  <div>
                    <Fingerprint aria-hidden="true" />
                    <span>
                      汉译机器定位范围<br />
                      <code>{evidenceCase.packet.chinese.exactInternalRange.startSegmentId} → {evidenceCase.packet.chinese.exactInternalRange.endSegmentId}</code>
                    </span>
                  </div>
                  <div>
                    <span>证据 SHA-256</span>
                    <code title={evidenceCase.packet.sourceRelationship.evidenceSha256}>
                      {evidenceCase.packet.sourceRelationship.evidenceSha256}
                    </code>
                  </div>
                  <span className={styles.pending}><CircleDashed aria-hidden="true" /> 0 / 2 真人复核</span>
                </footer>
              </article>
            ))}
          </div>
        </main>

        <section className={styles.contract} aria-labelledby="ebt-contract-title">
          <header>
            <p>证据契约 · WHAT HAPPENS NEXT</p>
            <h2 id="ebt-contract-title">材料可以先开放，结论必须晚一点。</h2>
            <p>书案发布不等于审校完成。只有可复核的支持证据、反证与真人判断全部到位，关系才可能升级。</p>
          </header>
          <ol>
            {contractSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <li key={step.title}>
                  <span>0{index + 1}</span>
                  <Icon aria-hidden="true" />
                  <div>
                    <small>{step.state}</small>
                    <h3>{step.title}</h3>
                    <p>{step.description}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        <section className={styles.reviewCallout} aria-labelledby="ebt-review-title">
          <UsersRound aria-hidden="true" />
          <div>
            <p>真人判断不可外包给 AI</p>
            <h2 id="ebt-review-title">你可以从读者，走到证据共同维护者。</h2>
            <p>审校台公开 80 条队列、原文范围、反证和允许结论；两份独立意见冲突时，才进入第三人裁决。</p>
          </div>
          <div>
            <Link href="/shenjiao">查看复核规则与队列 <ArrowRight aria-hidden="true" /></Link>
            <a
              href="https://github.com/weitzu-com/foxue.ai/blob/main/docs/HAN_PALI_REVIEW_PROTOCOL.md"
              target="_blank"
              rel="noreferrer"
            >
              阅读公开协议 <ExternalLink aria-hidden="true" />
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookMarked,
  Check,
  CircleDashed,
  ExternalLink,
  Fingerprint,
  Languages,
  Layers3,
  LockKeyhole,
  Scale,
  ScrollText,
  ShieldCheck,
} from "lucide-react";
import {
  sanskritGateSnapshot,
  sanskritReadingDossiers,
  sanskritSourceGates,
  verifySanskritReadingGate,
} from "@/lib/sanskrit-reading-gate";
import {
  absoluteUrl,
  buildPageJsonLd,
  buildPageMetadata,
  serializeJsonLd,
} from "@/lib/site-metadata";
import styles from "./page.module.css";

const pagePath = "/jingzang/fanwen";
const pageTitle = "梵文佛经原典门｜梵文与俗语全文阅读";
const pageDescription =
  "阅读三部已核验的梵文与俗语佛典原文，共 1,909 个稳定段；查看来源、版本、许可与异本关系，并明确 DSBC、GRETIL 候选资料的版权边界。";

export const metadata: Metadata = buildPageMetadata({
  title: pageTitle,
  description: pageDescription,
  path: pagePath,
});

const audiencePaths = [
  {
    icon: BookMarked,
    label: "佛教徒",
    title: "从一部短经，读回原语",
    description: "先完整读《月经》25 段。梵文不是神秘装饰，而是帮助你慢下来，看见词、句与语境。",
    href: "#candra",
  },
  {
    icon: Languages,
    label: "佛学爱好者",
    title: "让异本各自站稳",
    description: "从巴特那《法句》进入文本家族：可以比较，但不把不同传承硬排成逐句译本。",
    href: "#patna",
  },
  {
    icon: Fingerprint,
    label: "研究者",
    title: "从锚点与权利复核",
    description: "每份文本都给出固定源、稳定首尾段与关系判断；目录候选和站内全文分层统计。",
    href: "#source-gate",
  },
] as const;

const boundaryRules = [
  { mark: "01", title: "可访问 ≠ 可复制", description: "先读官方政策，再决定是否入库。" },
  { mark: "02", title: "目录项 ≠ 一部经", description: "分卷、版本和转写可能重复。" },
  { mark: "03", title: "相似题名 ≠ 同一作品", description: "跨语种关系必须另交证据。" },
  { mark: "04", title: "AI 整理 ≠ 人工校勘", description: "机器不能替代具名复核者。" },
] as const;

const pageJsonLdBase = buildPageJsonLd({
  path: pagePath,
  title: pageTitle,
  description: pageDescription,
  type: "CollectionPage",
  breadcrumb: [
    { name: "首页", path: "/" },
    { name: "经藏", path: "/jingzang" },
    { name: "梵文原典门", path: pagePath },
  ],
  about: ["梵文佛经", "佛教混合梵语", "俗语佛典", "Mahāvadānasūtra", "Candrasūtra", "Patna Dharmapada"],
  mainEntityId: `${absoluteUrl(pagePath)}#readable-works`,
});

const pageJsonLd = {
  ...pageJsonLdBase,
  "@graph": [
    ...(pageJsonLdBase["@graph"] as Array<Record<string, unknown>>),
    {
      "@type": "ItemList",
      "@id": `${absoluteUrl(pagePath)}#readable-works`,
      name: "foxue.ai 已核验梵文与俗语佛典原文",
      numberOfItems: sanskritReadingDossiers.length,
      itemListElement: sanskritReadingDossiers.map((dossier, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: `${dossier.alternateTitle}｜${dossier.title}`,
        url: absoluteUrl(dossier.readingHref),
        description: dossier.summary,
      })),
    },
    {
      "@type": "Dataset",
      "@id": `${absoluteUrl(pagePath)}#source-snapshot`,
      name: "梵文与俗语原典来源准入快照",
      description: "区分已获准站内阅读的原典、只登记目录候选和只提供外链的文件候选。",
      version: "SuttaCentral Indic 1.3.0 · rights audit 0.8.0",
      temporalCoverage: "2026",
      variableMeasured: [
        `${sanskritGateSnapshot.readableExpressions} 个站内文本表达`,
        `${sanskritGateSnapshot.sourceFiles} 个受控源文件`,
        `${sanskritGateSnapshot.stableSegments} 个稳定段`,
        `${sanskritGateSnapshot.dsbcCandidateRecords} 条 DSBC 目录候选`,
        `${sanskritGateSnapshot.gretilCandidateFiles} 个 GRETIL 文件候选`,
      ],
    },
  ],
};

export default function SanskritReadingGatePage() {
  verifySanskritReadingGate();

  return (
    <div className={styles.page} data-sanskrit-reading-gate>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(pageJsonLd) }}
      />

      <div className={`page-shell ${styles.shell}`}>
        <nav className={styles.breadcrumb} aria-label="面包屑">
          <Link href="/jingzang"><ArrowLeft aria-hidden="true" /> 经藏目录</Link>
          <span aria-hidden="true">/</span>
          <span>梵文原典门</span>
        </nav>

        <header className={styles.hero}>
          <div className={styles.heroCopy}>
            <p>SANSKRIT &amp; PRAKRIT · CONTROLLED READING GATE</p>
            <h1>梵文，<em>不是装饰。</em></h1>
            <p className={styles.heroLead}>
              回到原语，不是为了制造权威感；是为了看见一个词如何落进句子，一部经如何留在版本里，
              以及我们还不能确定什么。先开放三份可从头读到尾、可回查来源的文本见证。
            </p>
            <div className={styles.heroActions}>
              <a href="#readable-works"><ScrollText aria-hidden="true" /> 打开三份原典</a>
              <a href="#source-gate">查看来源准入门</a>
            </div>
          </div>

          <aside className={styles.manuscript} aria-label="梵文原典库当前快照">
            <div className={styles.manuscriptTopline}>
              <span>SC · INDIC ROOTS</span>
              <code>COMMIT {sanskritGateSnapshot.sourceCommit.slice(0, 7)}</code>
            </div>
            <div className={styles.glyph} aria-hidden="true">धर्म</div>
            <p className={styles.transliteration}>dharma · sūtra · prajñā</p>
            <dl>
              <div>
                <dt>文本表达</dt>
                <dd>{sanskritGateSnapshot.readableExpressions}</dd>
              </div>
              <div>
                <dt>稳定段</dt>
                <dd>{sanskritGateSnapshot.stableSegments.toLocaleString("zh-CN")}</dd>
              </div>
              <div>
                <dt>梵文源文件</dt>
                <dd>{sanskritGateSnapshot.sanskritRootFiles}</dd>
              </div>
              <div>
                <dt>俗语源文件</dt>
                <dd>{sanskritGateSnapshot.prakritRootFiles}</dd>
              </div>
            </dl>
            <p className={styles.manuscriptNote}><ShieldCheck aria-hidden="true" /> 全文、版本、许可、锚点同时入库</p>
          </aside>
        </header>

        <section className={styles.audiences} aria-labelledby="audience-title">
          <header>
            <p>THREE WAYS IN · 一扇门，三种读法</p>
            <h2 id="audience-title">你不必先会梵文，<br />但要知道自己正在读什么。</h2>
          </header>
          <div className={styles.audienceGrid}>
            {audiencePaths.map((path) => {
              const Icon = path.icon;
              return (
                <a href={path.href} key={path.label}>
                  <Icon aria-hidden="true" />
                  <small>{path.label}</small>
                  <strong>{path.title}</strong>
                  <span>{path.description}</span>
                  <i>沿此路径进入 <ArrowRight aria-hidden="true" /></i>
                </a>
              );
            })}
          </div>
        </section>

        <main className={styles.dossiers} id="readable-works" aria-labelledby="works-title">
          <header className={styles.sectionHeading}>
            <div>
              <p>READABLE NOW · 现在可以完整阅读</p>
              <h2 id="works-title">三份原典，三种诚实的关系。</h2>
            </div>
            <p>
              每份文本保留 Bilara 原生段号。点击后直接落到第一段；首尾锚点、源文件数量和跨本判断都公开，
              不用“梵文版”三个字遮蔽版本差异。
            </p>
          </header>

          <div className={styles.dossierList}>
            {sanskritReadingDossiers.map((dossier, index) => (
              <article
                className={`${styles.dossier} ${styles[dossier.tone]}`}
                id={dossier.id}
                key={dossier.slug}
                data-sanskrit-dossier={dossier.slug}
              >
                <div className={styles.dossierIndex} aria-hidden="true">0{index + 1}</div>
                <div className={styles.dossierMain}>
                  <small>{dossier.label}</small>
                  <p className={styles.dossierOpening}>{dossier.opening}</p>
                  <h3>{dossier.alternateTitle}<span>{dossier.title}</span></h3>
                  <p>{dossier.invitation}</p>
                  <Link
                    className={styles.readButton}
                    href={dossier.readingHref}
                    prefetch={false}
                    data-analytics-event="scripture_opened"
                    data-analytics-location="sanskrit_reading_gate"
                    data-analytics-content-id={dossier.canonRef}
                    data-analytics-label={dossier.title}
                  >
                    从 {dossier.firstSegmentId} 开始读 <ArrowRight aria-hidden="true" />
                  </Link>
                </div>

                <div className={styles.dossierEvidence}>
                  <div className={styles.dossierMetrics}>
                    <span><strong>{dossier.segments.toLocaleString("zh-CN")}</strong> 稳定段</span>
                    <span><strong>{dossier.sourceRecords}</strong> 源文件</span>
                    <span><strong>{dossier.readingUnits}</strong> 阅读单元</span>
                  </div>
                  <dl>
                    <div><dt>语言</dt><dd>{dossier.language}</dd></div>
                    <div><dt>固定编号</dt><dd>{dossier.canonRef}</dd></div>
                    <div><dt>锚点范围</dt><dd><code>{dossier.firstSegmentId}</code> → <code>{dossier.lastSegmentId}</code></dd></div>
                    <div><dt>来源权利</dt><dd>{dossier.sourceLicense}</dd></div>
                  </dl>
                  <div className={styles.relationNote}>
                    <Layers3 aria-hidden="true" />
                    <div>
                      <Link href={dossier.relationHref} prefetch={false}>{dossier.relationTitle} <ArrowRight aria-hidden="true" /></Link>
                      <p>{dossier.relationNote}</p>
                    </div>
                  </div>
                  <a className={styles.sourceLink} href={dossier.sourceUrl} target="_blank" rel="noreferrer">
                    核对上游原文 <ExternalLink aria-hidden="true" />
                  </a>
                </div>
              </article>
            ))}
          </div>
        </main>
      </div>

      <section className={styles.sourceGate} id="source-gate" aria-labelledby="source-gate-title">
        <div className="page-shell">
          <header className={styles.gateHeading}>
            <div>
              <p>SOURCE ADMISSION · 来源准入门</p>
              <h2 id="source-gate-title">缺失的佛经，<br />先过权利与身份两道门。</h2>
            </div>
            <p>
              调研报告指向了大量梵文候选资源；第一性原理要求我们先问：能否合法再发布？一个记录究竟是作品、版本，
              还是物理文件？答案未明确前，它只能是线索，不能进入全文分母。
            </p>
          </header>

          <div className={styles.gateGrid}>
            {sanskritSourceGates.map((gate) => (
              <article className={`${styles.gateCard} ${styles[gate.tone]}`} key={gate.title}>
                <header>
                  {gate.tone === "open" ? <Check aria-hidden="true" /> : gate.tone === "held" ? <LockKeyhole aria-hidden="true" /> : <CircleDashed aria-hidden="true" />}
                  <span>{gate.state}</span>
                </header>
                <h3>{gate.title}</h3>
                <p className={styles.gateCount}><strong>{gate.count.toLocaleString("zh-CN")}</strong><span>{gate.unit}</span></p>
                <p>{gate.description}</p>
                <div className={styles.gateDecision}><Scale aria-hidden="true" />{gate.decision}</div>
                <div className={styles.gateLinks}>
                  <a href={gate.href} target="_blank" rel="noreferrer">{gate.hrefLabel} <ExternalLink aria-hidden="true" /></a>
                  {"secondaryHref" in gate ? (
                    <a href={gate.secondaryHref} target="_blank" rel="noreferrer">{gate.secondaryLabel} <ExternalLink aria-hidden="true" /></a>
                  ) : null}
                </div>
              </article>
            ))}
          </div>

          <div className={styles.boundaryStrip} aria-label="梵文佛典来源判断四条底线">
            {boundaryRules.map((rule) => (
              <div key={rule.mark}>
                <span>{rule.mark}</span>
                <strong>{rule.title}</strong>
                <p>{rule.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.closing}>
        <div className="page-shell">
          <p>THE NEXT TEXT MUST BE ADMISSIBLE</p>
          <h2>宁可清楚地少，<br />也不含糊地多。</h2>
          <div>
            <p>
              下一部梵文佛经只有在作品身份、固定版本、稳定锚点和再发布权利同时成立后，才会进入全文阅读。
              这不是拖慢收录，而是让未来的研究、修学与纠错都有根可回。
            </p>
            <Link href="/fugai">查看佛典覆盖登记 <ArrowRight aria-hidden="true" /></Link>
          </div>
        </div>
      </section>
    </div>
  );
}

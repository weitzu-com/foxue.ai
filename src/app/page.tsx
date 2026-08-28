import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookMarked,
  BookOpenText,
  CheckCircle2,
  CircleDot,
  CircleAlert,
  Database,
  FileSearch,
  Fingerprint,
  Languages,
  Layers3,
  Link2,
  MessagesSquare,
  Network,
  Scale,
  ShieldCheck,
  Users,
} from "lucide-react";
import { DailyScripture } from "@/components/daily-scripture";
import { SearchConsole } from "@/components/search-console";
import { ReadingShelf } from "@/components/reading-shelf";
import { buildCoverageSnapshot } from "@/lib/corpus-registry";
import { allConcepts } from "@/lib/concept-hubs";
import { buildPageJsonLd, buildPageMetadata, serializeJsonLd } from "@/lib/site-metadata";
import styles from "./home.module.css";

const homeTitle = "佛经原典在线阅读与可核验问经";
const homeDescription =
  "foxue.ai 提供每日可核验原典、佛经全文阅读、稳定行段定位与证据问经；完整原文、人工复核范围与建设缺口均公开。";

export const metadata: Metadata = buildPageMetadata({
  title: homeTitle,
  description: homeDescription,
  path: "/",
});

const homeJsonLd = buildPageJsonLd({
  path: "/",
  title: homeTitle,
  description: homeDescription,
  about: ["每日佛经原典", "佛经原典阅读", "佛经检索", "证据问经", "佛典版本", "数字人文学"],
});

const tasks = [
  {
    number: "01",
    icon: BookMarked,
    eyebrow: "想认真读一部经",
    title: "进入研读中心",
    description: "慢读《心经》、核读《金刚经》、净读《阿弥陀经》，或并读三源《法句》；每一步都回到稳定原文。",
    link: "/xue",
    action: "选择研读路径",
  },
  {
    number: "02",
    icon: BookOpenText,
    eyebrow: "已经知道经名",
    title: "浏览完整经藏",
    description: "按作品、文本表达与版本阅读；拼音只是显示辅助，不改动原始底本。",
    link: "/jingzang",
    action: "打开经藏",
  },
  {
    number: "03",
    icon: MessagesSquare,
    eyebrow: "只记得一句流行说法",
    title: "用证据核对说法",
    description: "分清佛经原句、现代转述与当前未知；命中后直达经号与稳定行段。",
    link: "/hedui",
    action: "核对一句话",
  },
  {
    number: "04",
    icon: FileSearch,
    eyebrow: "想做进一步研究",
    title: "查看覆盖与缺口",
    description: "分别核对目录、原文、译文、权利与质量，不把不同分母混成一个百分比。",
    link: "/fugai",
    action: "打开覆盖账本",
  },
];

const priorities = [
  {
    number: "一",
    icon: Languages,
    title: "补足梵文与俗语",
    description: "优先接入许可清晰的数字语料，让“多语”从目录候选变成可读原文。",
    status: "语系短板",
  },
  {
    number: "二",
    icon: Network,
    title: "完成 EBT 平行层",
    description: "把汉译阿含、巴利尼柯耶、梵文残片与藏文对应经组织成可审校的对照关系。",
    status: "产品机会",
  },
  {
    number: "三",
    icon: Users,
    title: "扩展真人复核",
    description: "引入法师、学者、译者与不同传统用户，持续公开复核比例和争议记录。",
    status: "质量工程",
  },
];

const formatCount = new Intl.NumberFormat("zh-CN").format;

export default function Home() {
  const coverage = buildCoverageSnapshot();
  const reviewRate = coverage.localHoldings.registeredWorks > 0
    ? (
        coverage.localHoldings.qualityVerifiedSampleWorks /
        coverage.localHoldings.registeredWorks *
        100
      ).toFixed(2)
    : "0.00";

  return (
    <div className={styles.home}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(homeJsonLd) }}
      />
      <section className={styles.hero} aria-labelledby="home-title">
        <div className={styles.heroGrid}>
          <div className={styles.heroCopy}>
            <div className={`${styles.kicker} ${styles.revealOne}`}>
              <span>可核验佛典阅读</span>
              <span aria-hidden="true" />
              <span>登记册 v{coverage.generatedFrom.registryVersion}</span>
            </div>
            <h1 id="home-title" className={styles.revealTwo}>
              从问题，<br />
              <em>回到原典。</em>
            </h1>
            <p className={`${styles.heroLead} ${styles.revealThree}`}>
              先找到原句，再看上下文、版本与解释边界。foxue.ai 不替佛陀说话，
              也不把机器综合伪装成经典原文。
            </p>
            <div className={`${styles.searchArea} ${styles.revealFour}`}>
              <SearchConsole />
            </div>
            <ul className={`${styles.trustRow} ${styles.revealFive}`} aria-label="平台承诺">
              <li><ShieldCheck aria-hidden="true" /> 每条主张可追溯</li>
              <li><Scale aria-hidden="true" /> 多传统不强行合一</li>
              <li><CircleAlert aria-hidden="true" /> 证据不足就明确停下</li>
            </ul>
          </div>

          <DailyScripture className={styles.revealThree} />
        </div>

        <dl className={styles.heroLedger} aria-label="当前可核验能力">
          <div>
            <dt>完整原文表达</dt>
            <dd>{formatCount(coverage.localHoldings.fullSourceTextExpressions)}</dd>
            <dd className={styles.ledgerNote}>不等于去重作品数</dd>
          </div>
          <div>
            <dt>稳定行段</dt>
            <dd>{formatCount(coverage.localHoldings.stableSegments)}</dd>
            <dd className={styles.ledgerNote}>可直达、可引用</dd>
          </div>
          <div>
            <dt>结构与锚点已验作品</dt>
            <dd>{formatCount(coverage.localHoldings.structureVerifiedWorks)}</dd>
            <dd className={styles.ledgerNote}>继承层质量</dd>
          </div>
          <div className={styles.ledgerWarning}>
            <dt>人工质量复核作品</dt>
            <dd>{formatCount(coverage.localHoldings.qualityVerifiedSampleWorks)}</dd>
            <dd className={styles.ledgerNote}>自有层 {reviewRate}%</dd>
          </div>
        </dl>
      </section>

      <ReadingShelf variant="home" />

      <section className={styles.pathSection} aria-labelledby="paths-title">
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>从你的任务出发</p>
            <h2 id="paths-title">不必先理解整座大藏经。</h2>
          </div>
          <p>
            有人第一次接触佛经，有人只记得半句话，也有人要做跨版本研究。
            入口应跟随问题，而不是要求每个人先学会同一套术语。
          </p>
        </div>
        <div className={styles.taskGrid}>
          {tasks.map((task) => {
            const Icon = task.icon;
            return (
              <Link href={task.link} className={styles.taskCard} key={task.title}>
                <div className={styles.taskTopline}>
                  <span>{task.number}</span>
                  <Icon aria-hidden="true" />
                </div>
                <p>{task.eyebrow}</p>
                <h3>{task.title}</h3>
                <span>{task.description}</span>
                <strong>{task.action} <ArrowRight aria-hidden="true" size={16} /></strong>
              </Link>
            );
          })}
        </div>
      </section>

      <section className={styles.conceptSection} aria-labelledby="concepts-title">
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>按主题进入原典</p>
            <h2 id="concepts-title">先辨清概念，<br />再打开经文。</h2>
          </div>
          <p>
            面对“空、无常、无我、观心、无住”等高频问题，先看术语边界、常见误读与原典入口，
            再自行核对上下文；概念页不是替代经典的标准答案。
          </p>
        </div>
        <div className={styles.conceptGrid}>
          {allConcepts.map((concept, index) => (
            <Link href={concept.href} className={styles.conceptCard} key={concept.slug}>
              <div>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <CircleDot aria-hidden="true" />
              </div>
              <h3>{concept.title}</h3>
              <p>{concept.summary}</p>
              <small>入口问题：{concept.prompt}</small>
              <strong>进入概念页 <ArrowRight aria-hidden="true" size={15} /></strong>
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.qualitySection} aria-labelledby="quality-title">
        <div className={styles.qualityIntro}>
          <p className={styles.eyebrow}>质量必须分两层看</p>
          <h2 id="quality-title">底本可靠，<br />不等于解释已经完成。</h2>
          <p>
            报告指出，foxue.ai 的底本继承层已具学术引用条件；真正需要投入的，
            是平台自己的翻译、注释、异本对照与真人复核。
          </p>
          <Link href="/touming">
            查看完整质量账本 <ArrowRight aria-hidden="true" size={16} />
          </Link>
        </div>
        <div className={styles.qualityLedger}>
          <article>
            <div className={styles.qualityLabel}>
              <CheckCircle2 aria-hidden="true" />
              <span>继承层 · 已可用</span>
            </div>
            <h3>可定位、可复算的原典底座</h3>
            <ul>
              <li><Fingerprint aria-hidden="true" /> 固定上游版本与 SHA-256 指纹</li>
              <li><Link2 aria-hidden="true" /> 字符级或段落级稳定锚点</li>
              <li><Database aria-hidden="true" /> 版本、译者、来源与权利逐项登记</li>
            </ul>
            <p>这里的“已验”主要指结构、锚点、来源与权利，不自动等于内容已由真人逐部审定。</p>
          </article>
          <article className={styles.qualityPending}>
            <div className={styles.qualityLabel}>
              <Layers3 aria-hidden="true" />
              <span>自有层 · 起步中</span>
            </div>
            <h3>让普通人真正读懂的辅助层</h3>
            <ul>
              <li><Users aria-hidden="true" /> 人工质量样本复核 {formatCount(coverage.localHoldings.qualityVerifiedSampleWorks)} / {formatCount(coverage.localHoldings.registeredWorks)} 部</li>
              <li><Languages aria-hidden="true" /> 白话导读与现代译文尚未形成全库覆盖</li>
              <li><FileSearch aria-hidden="true" /> 校勘记、异本对照与朗诵仍待产品化</li>
            </ul>
            <p>因此，站内解释必须明确标注为“综合”或“理解提示”，并保留回到原文继续求证的路径。</p>
          </article>
        </div>
      </section>

      <section className={styles.answerSection} aria-labelledby="answer-title">
        <div className={styles.answerGrid}>
          <div className={styles.answerCopy}>
            <p className={styles.eyebrow}>答案契约 · ANSWER CONTRACT</p>
            <h2 id="answer-title">答案不是终点，<br />证据才是入口。</h2>
            <p>
              关键判断旁边，应当能打开原句、上下文、版本与许可；
              找不到可靠来源时，系统必须明确说“不知道”。
            </p>
            <Link href="/wenjing">
              查看问经原型 <ArrowRight aria-hidden="true" size={16} />
            </Link>
          </div>
          <article className={styles.answerBoard}>
            <div className={styles.answerTopline}>
              <span><CheckCircle2 aria-hidden="true" size={14} /> 有充分来源</span>
              <span>可信原型 · 回答样本 001</span>
            </div>
            <h3>无住不是消极不做，而是不以占有心行动。</h3>
            <p>
              《金刚经》把“不住”与“生心”放在同一句中：仍然发心和行动，
              但不把身份、成果和功德固定为“我所有”。
            </p>
            <div className={styles.inlineEvidence}>
              <span>原典证据 01</span>
              <blockquote>“应无所住而生其心。”</blockquote>
              <Link href="/jingzang/jingangjing/001-0749c#T0235.001.0749c22">
                T0235.001.0749c22 <ArrowRight aria-hidden="true" size={14} />
              </Link>
            </div>
            <div className={styles.answerLegend}>
              <span><i className={styles.sourceDot} /> 原典证据</span>
              <span><i className={styles.synthesisDot} /> 平台综合</span>
              <span><i className={styles.boundaryDot} /> 范围边界</span>
            </div>
          </article>
        </div>
      </section>

      <section className={styles.parallelSection} aria-labelledby="parallel-title">
        <div className={styles.parallelVisual} aria-label="同一佛说的四类文本见证示意">
          <div className={`${styles.witness} ${styles.witnessChinese}`}>
            <span>汉译</span><strong>阿含</strong><small>完整经与行段</small>
          </div>
          <div className={`${styles.witness} ${styles.witnessPali}`}>
            <span>巴利</span><strong>尼柯耶</strong><small>原文与段号</small>
          </div>
          <div className={`${styles.witness} ${styles.witnessSanskrit}`}>
            <span>梵文</span><strong>写本残片</strong><small>候选与见证</small>
          </div>
          <div className={`${styles.witness} ${styles.witnessTibetan}`}>
            <span>藏文</span><strong>对应经</strong><small>异本关系</small>
          </div>
          <div className={styles.parallelCore}>
            <Network aria-hidden="true" />
            <strong>同一佛说</strong>
            <span>EBT 平行层</span>
          </div>
        </div>
        <div className={styles.parallelCopy}>
          <p className={styles.eyebrow}>下一阶段 · 建设中</p>
          <h2 id="parallel-title">让不同传承的文本，<br />在差异中彼此照见。</h2>
          <p>
            报告把 EBT 平行层识别为最大的差异化机会。目标不是把四种语言强行译成同一个答案，
            而是保留各自原文、版本与分歧，再说明它们为什么可能对应。
          </p>
          <dl className={styles.parallelStats}>
            <div>
              <dt>汉巴平行证据边</dt>
              <dd>{formatCount(coverage.candidateInventory.suttacentralChineseParallelEvidence.deduplicatedParallelEdges)}</dd>
            </div>
            <div>
              <dt>人工裁决队列</dt>
              <dd>
                {formatCount(coverage.candidateInventory.suttacentralParallelReviewQueue.adjudicatedItems)} / {formatCount(coverage.candidateInventory.suttacentralParallelReviewQueue.queueItems)}
              </dd>
            </div>
          </dl>
          <p className={styles.parallelCaveat}>
            关系边不等于整经对应；在真人完成裁决前，不把候选关系冒充学术结论。
          </p>
          <Link href="/shenjiao">
            进入汉巴作品审校台 <ArrowRight aria-hidden="true" size={16} />
          </Link>
        </div>
      </section>

      <section className={styles.prioritySection} aria-labelledby="priority-title">
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>未来 12 个月</p>
            <h2 id="priority-title">接下来，只聚焦三件事。</h2>
          </div>
          <p>
            许可清洁度决定能不能做，学术与用户价值决定先做什么。
            每一步都要能在公开登记册中被复算，而不是只写进愿景。
          </p>
        </div>
        <ol className={styles.priorityGrid}>
          {priorities.map((priority) => {
            const Icon = priority.icon;
            return (
              <li key={priority.title}>
                <div>
                  <span>{priority.number}</span>
                  <Icon aria-hidden="true" />
                </div>
                <small>{priority.status}</small>
                <h3>{priority.title}</h3>
                <p>{priority.description}</p>
              </li>
            );
          })}
        </ol>
      </section>

      <section className={styles.closingSection}>
        <div>
          <p className={styles.eyebrow}>从一部经开始</p>
          <h2>先读一段原文，<br />再决定相信什么。</h2>
        </div>
        <div className={styles.closingActions}>
          <Link href="/xue">
            选择研读路径 <ArrowRight aria-hidden="true" size={17} />
          </Link>
          <Link href="/jingzang">浏览全部经藏</Link>
        </div>
      </section>
    </div>
  );
}

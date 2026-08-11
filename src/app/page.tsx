import Link from "next/link";
import {
  ArrowRight,
  BookMarked,
  BookOpenText,
  CheckCircle2,
  CircleDot,
  Database,
  FileSearch,
  Globe2,
  LibraryBig,
  MessagesSquare,
  Quote,
  Scale,
  SearchCheck,
  ShieldCheck,
} from "lucide-react";
import { SearchConsole } from "@/components/search-console";
import { buildCoverageSnapshot } from "@/lib/corpus-registry";

const tasks = [
  {
    number: "壹",
    icon: FileSearch,
    title: "找一句经文",
    description: "用现代语言、原句或主题检索，结果直接落到稳定段落。",
    link: "/jingzang",
  },
  {
    number: "贰",
    icon: MessagesSquare,
    title: "问一个问题",
    description: "先看来源是否充分，再综合回答；证据不足就诚实停下。",
    link: "/wenjing",
  },
  {
    number: "叁",
    icon: BookMarked,
    title: "读一部经典",
    description: "保留经号、版本、段号和上下文，让阅读不被 AI 遮蔽。",
    link: "/jingzang/xinjing",
  },
  {
    number: "肆",
    icon: SearchCheck,
    title: "核对一个说法",
    description: "区分原典、译文、注疏、学术观点与机器候选。",
    link: "/yuanze",
  },
];

const centuries = [
  { year: "现在", title: "可信原型", text: "开放代码、稳定段落、来源账本" },
  { year: "3 年", title: "多语经藏", text: "跨藏检索、公开 API、年度典藏版" },
  { year: "20 年", title: "99% 计划", text: "按公开注册表审计原文覆盖" },
  { year: "100 年", title: "世代传承", text: "任何维护者都能从公开包恢复" },
];

export default function Home() {
  const coverage = buildCoverageSnapshot();
  return (
    <>
      <section className="hero-section">
        <div className="hero-orbit" aria-hidden="true" />
        <div className="page-shell hero-grid">
          <div className="hero-copy">
            <div className="hero-kicker reveal-1">
              <span>可信佛典知识基础设施</span>
              <span className="hero-kicker__line" />
              <span>立愿于 2026</span>
            </div>
            <h1 className="reveal-2">
              从问题，<br />
              <em>回到原典。</em>
            </h1>
            <p className="hero-lead reveal-3">
              foxue.ai 是面向世界的佛学交流 AI 平台。它不替佛陀说话，
              只帮助你找到原文、理解语境、看见分歧，并保留继续求证的路。
            </p>
            <div className="reveal-4">
              <SearchConsole />
            </div>
            <ul className="trust-row reveal-5" aria-label="平台承诺">
              <li>
                <ShieldCheck aria-hidden="true" /> 每条主张可追溯
              </li>
              <li>
                <Scale aria-hidden="true" /> 多传统不强行合一
              </li>
              <li>
                <Globe2 aria-hidden="true" /> 为全球文字系统设计
              </li>
            </ul>
          </div>

          <aside className="today-passage reveal-3" aria-labelledby="today-title">
            <div className="today-passage__index" aria-hidden="true">
              <span>今</span>
              <span>日</span>
              <span>一</span>
              <span>段</span>
            </div>
            <div className="today-passage__paper">
              <div className="passage-meta">
                <span>般若部</span>
                <span>已核验样本</span>
              </div>
              <Quote aria-hidden="true" />
              <h2 id="today-title">照见五蕴皆空，度一切苦厄。</h2>
              <p>
                空并非把生活抹去，而是看见身体、感受和念头都依条件而起，
                因此不必把它们紧握成永恒的“我”。
              </p>
              <div className="passage-citation">
                <div>
                  <strong>《般若波罗蜜多心经》</strong>
                  <span>唐·玄奘译 · T0251</span>
                </div>
                <Link href="/jingzang/xinjing/001-0848c#T0251.001.0848c06">
                  打开原文 <ArrowRight aria-hidden="true" size={15} />
                </Link>
              </div>
            </div>
            <span className="paper-registration" aria-hidden="true">T08 · 251</span>
          </aside>
        </div>
        <div className="page-shell hero-footnote">
          <span>01</span>
          <p>AI 可以暂时离线，经典阅读必须仍然可用。</p>
        </div>
      </section>

      <section className="intent-section section-space">
        <div className="page-shell">
          <div className="section-heading section-heading--split">
            <div>
              <p className="eyebrow">不止是一个聊天框</p>
              <h2>你可以这样接近佛法</h2>
            </div>
            <p>
              我们从真实任务出发：寻找、阅读、理解、核对。
              AI 退居到证据之后，让经文本身成为界面的主角。
            </p>
          </div>
          <div className="task-grid">
            {tasks.map((task) => {
              const Icon = task.icon;
              return (
                <Link href={task.link} className="task-card" key={task.title}>
                  <span className="task-card__number">{task.number}</span>
                  <Icon aria-hidden="true" />
                  <h3>{task.title}</h3>
                  <p>{task.description}</p>
                  <span className="task-card__link">
                    开始 <ArrowRight aria-hidden="true" size={16} />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="evidence-demo section-space">
        <div className="page-shell evidence-demo__grid">
          <div className="evidence-demo__statement">
            <p className="eyebrow">答案契约 · ANSWER CONTRACT</p>
            <h2>答案不是终点，<br />证据才是入口。</h2>
            <p>
              每一个关键判断旁边，都应该能打开原句、上下文、版本和许可。
              找不到可靠来源时，系统必须明确说“不知道”。
            </p>
            <Link className="text-link" href="/wenjing">
              查看完整回答示例 <ArrowRight aria-hidden="true" size={16} />
            </Link>
          </div>
          <div className="claim-board">
            <div className="claim-board__topline">
              <span className="status-pill status--verified">
                <CheckCircle2 aria-hidden="true" size={14} /> 有充分来源
              </span>
              <span>可信原型 · 回答 001</span>
            </div>
            <h3>无住不是消极不做，而是不以占有心行动。</h3>
            <p>
              《金刚经》把“不住”与“生心”放在同一句中：仍然发心和行动，
              但不把身份、成果和功德固定为“我所有”。
            </p>
            <div className="inline-evidence">
              <span className="inline-evidence__marker">原典 01</span>
              <blockquote>“应无所住而生其心。”</blockquote>
              <Link href="/jingzang/jingangjing/001-0749c#T0235.001.0749c22">
                T0235.001.0749c22 <ArrowRight aria-hidden="true" size={14} />
              </Link>
            </div>
            <div className="claim-board__legend">
              <span><span className="legend-dot legend-dot--source" /> 原典证据</span>
              <span><span className="legend-dot legend-dot--synthesis" /> AI 综合</span>
              <span><span className="legend-dot legend-dot--boundary" /> 范围边界</span>
            </div>
          </div>
        </div>
      </section>

      <section className="corpus-section section-space">
        <div className="page-shell corpus-grid">
          <div className="corpus-visual" aria-hidden="true">
            <div className="corpus-ring corpus-ring--outer" />
            <div className="corpus-ring corpus-ring--middle" />
            <div className="corpus-ring corpus-ring--inner" />
            <span className="corpus-glyph">藏</span>
            <span className="corpus-label corpus-label--one">汉文</span>
            <span className="corpus-label corpus-label--two">巴利</span>
            <span className="corpus-label corpus-label--three">藏文</span>
            <span className="corpus-label corpus-label--four">梵文</span>
          </div>
          <div className="corpus-copy">
            <p className="eyebrow">99% 佛典计划</p>
            <h2>先定义分母，<br />再谈收录率。</h2>
            <p>
              “收录 99%”不是一句无法核验的宣传。我们将建立全球佛典覆盖登记册，
              按目录项、原文、段落、译文和版权状态分别计算，并让任何人都能复算。
            </p>
            <div className="corpus-status">
              <div>
                <span>覆盖登记册</span>
                <strong>v0.9 公开</strong>
              </div>
              <div>
                <span>受控完整原文</span>
                <strong>{coverage.localHoldings.fullSourceTextExpressions} 个文本</strong>
              </div>
              <div>
                <span>目标时间尺度</span>
                <strong>5—20 年</strong>
              </div>
            </div>
            <Link className="button-secondary" href="/fugai">
              打开覆盖登记册 <ArrowRight aria-hidden="true" size={16} />
            </Link>
          </div>
        </div>
      </section>

      <section className="century-section section-space">
        <div className="page-shell">
          <div className="section-heading section-heading--split">
            <div>
              <p className="eyebrow">运行 100 年</p>
              <h2>为交接而建，<br />不为锁定而建。</h2>
            </div>
            <p>
              域名和服务器只是表层。真正的长期性来自开放格式、多个保存节点、
              年度典藏版、可替换模型，以及清晰的组织继任。
            </p>
          </div>
          <ol className="century-timeline">
            {centuries.map((item, index) => (
              <li key={item.year}>
                <span className="timeline-index">0{index + 1}</span>
                <CircleDot aria-hidden="true" />
                <span className="timeline-year">{item.year}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </li>
            ))}
          </ol>
          <div className="resilience-strip">
            <span><Database aria-hidden="true" /> 开放数据包</span>
            <span><LibraryBig aria-hidden="true" /> 多机构保存</span>
            <span><BookOpenText aria-hidden="true" /> 静态阅读救生艇</span>
            <span><ShieldCheck aria-hidden="true" /> 年度恢复演练</span>
          </div>
        </div>
      </section>

      <section className="closing-vow">
        <div className="page-shell closing-vow__inner">
          <p className="eyebrow">一项跨世代的公共事业</p>
          <h2>让古老智慧，<br />在未来仍可被看见、核对与传承。</h2>
          <div className="closing-actions">
            <Link className="button-primary" href="/jingzang">
              开始阅读 <ArrowRight aria-hidden="true" size={17} />
            </Link>
            <a
              className="button-ghost"
              href="https://github.com/weitzu-com/foxue.ai"
              target="_blank"
              rel="noreferrer"
            >
              参与共建
            </a>
          </div>
        </div>
      </section>
    </>
  );
}

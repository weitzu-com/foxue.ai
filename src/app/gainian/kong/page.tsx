import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpenCheck,
  CircleAlert,
  Languages,
  Link2,
  ShieldCheck,
} from "lucide-react";
import {
  absoluteUrl,
  buildPageMetadata,
  buildPageJsonLd,
  serializeJsonLd,
} from "@/lib/site-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "空｜概念 Hub",
  description:
    "从受控巴利经藏与汉译般若证据理解“空”的术语范围、传统边界、常见误解，并回到稳定原典段落。",
  path: "/gainian/kong",
});

const conceptUrl = absoluteUrl("/gainian/kong");
const conceptPageJsonLdBase = buildPageJsonLd({
  path: "/gainian/kong",
  title: "空｜概念 Hub",
  description: "从受控巴利经藏与汉译般若证据理解“空”的术语范围、传统边界、常见误解，并回到稳定原典段落。",
  breadcrumb: [
    { name: "首页", path: "/" },
    { name: "空", path: "/gainian/kong" },
  ],
  about: ["空", "佛教概念", "巴利经藏", "汉译般若"],
  mainEntityId: `${conceptUrl}#term`,
});

const conceptPageJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    ...(conceptPageJsonLdBase["@graph"] as Array<Record<string, unknown>>),
    {
      "@type": "DefinedTerm",
      "@id": `${conceptUrl}#term`,
      name: "空",
      url: conceptUrl,
      description: "从受控巴利经藏与汉译般若证据理解“空”的术语范围、传统边界、常见误解，并回到稳定原典段落。",
      inLanguage: "zh-Hans",
      termCode: "kong",
      inDefinedTermSet: conceptUrl,
    },
  ],
};

const evidence = [
  {
    kind: "直接证据",
    canon: "巴利《相应部》SN 35.85",
    title: "空于“我”或“我所”",
    quote:
      "Yasmā ca kho, ānanda, suññaṁ attena vā attaniyena vā tasmā suñño lokoti vuccati.",
    reading: "工作释义：因为世间空于我或我所，所以说世间是空。",
    locator: "sn35.85:1.4",
    href: "/jingzang/samyutta-nikaya-sn35/068-sn35-85-0001-0013#sn35.85:1.4",
    sourceUrl: "https://suttacentral.net/sn35.85/pli/ms",
  },
  {
    kind: "直接证据",
    canon: "巴利《中部》MN 121",
    title: "空无其物，也如实知其所余",
    quote:
      "Iti yañhi kho tattha na hoti tena taṁ suññaṁ samanupassati, yaṁ pana tattha avasiṭṭhaṁ hoti taṁ ‘santamidaṁ atthī’ti pajānāti.",
    reading: "工作释义：其中没有什么，就在那个意义上观其为空；仍有余者，则如实知其为有。",
    locator: "mn121:4.10",
    href: "/jingzang/majjhima-nikaya-mn121/001-mn121-0001-0102#mn121:4.10",
    sourceUrl: "https://suttacentral.net/mn121/pli/ms",
  },
  {
    kind: "直接证据",
    canon: "《般若波罗蜜多心经》T0251",
    title: "从五蕴进入诸法空相",
    quote: "舍利子！色不异空，空不异色；色即是空，空即是色。",
    reading: "本站受控汉译样本；“受、想、行、识，亦复如是”紧随其后。",
    locator: "T0251.001.0848c07",
    href: "/jingzang/xinjing/001-0848c#T0251.001.0848c07",
    sourceUrl: "https://cbetaonline.dila.edu.tw/zh/T0251_001",
  },
  {
    kind: "相关证据",
    canon: "《金刚般若波罗蜜经》T0235",
    title: "不住著，不等于不行动",
    quote: "应无所住而生其心。",
    reading: "这段不直接定义“空”，但为“空等于消极不做”的误解提供边界证据。",
    locator: "T0235.001.0749c22",
    href: "/jingzang/jingangjing/001-0749c#T0235.001.0749c22",
    sourceUrl: "https://cbetaonline.dila.edu.tw/zh/T0235_001",
  },
] as const;

const traditions = [
  {
    label: "巴利尼柯耶语境",
    term: "suñña · suññatā",
    supported: "现有证据可直接支持“空于我与我所”，以及按“其中没有什么／仍有什么”如实辨认的修习语境。",
    boundary: "不据此代替上座部后世论书的完整空观体系，也不把经藏用法缩成单一哲学定义。",
    sources: "SN 35.85 · MN 121",
  },
  {
    label: "汉译般若语境",
    term: "空 · 空相",
    supported: "现有证据可直接支持五蕴皆空、色空不二与诸法空相；其语境把般若观照与离苦相连。",
    boundary: "《金刚经》的“无住”在本页只作相关证据；不能把所有“非相”“无住”都机械替换成同一空义。",
    sources: "T0251 · T0235（相关）",
  },
  {
    label: "后续论释与宗派",
    term: "中观 · 唯识 · 禅等",
    supported: "这些传统对空义形成了不同论证、术语与修行表达，值得分别建立证据页。",
    boundary: "当前问经证据没有纳入对应论典与注疏，本页不裁决它们的异同，也不选定唯一宗派解释。",
    sources: "待受控论典与注疏证据",
  },
] as const;

const misconceptions = [
  {
    myth: "空 = 什么都不存在",
    correction: "不成立。MN 121 明说：对所无者观空，对所余者如实知其为有；“空”不是把经验、因果与责任一笔抹去。",
  },
  {
    myth: "懂空就应该没有感受",
    correction: "不成立。《心经》从色、受、想、行、识切入，不是删除五蕴，而是改变对五蕴的固着方式。",
  },
  {
    myth: "空会导向消极不做",
    correction: "证据不支持。《金刚经》把“无所住”与“生其心”放在同一句中：不住著与发心行动并不冲突。",
  },
  {
    myth: "所有佛教传统说的是同一套空",
    correction: "过度合并。经藏语境、论证对象与修习方法不同；可以比较，但必须保留来源、年代、语言与文本层次。",
  },
] as const;

const readingPath = [
  {
    step: "先定边界",
    title: "SN 35.85《空世间经》",
    text: "先读“空于我或我所”的直接定义，避免一开始就把空理解成宇宙虚无。",
    href: evidence[0].href,
  },
  {
    step: "再看方法",
    title: "MN 121《小空经》",
    text: "观察经文怎样逐层辨认“所无”与“所余”，理解空也可以是一种严格的注意方法。",
    href: evidence[1].href,
  },
  {
    step: "进入般若",
    title: "《般若波罗蜜多心经》",
    text: "从“照见五蕴皆空”读到“诸法空相”，同时留意观照、般若与度苦的上下文。",
    href: "/jingzang/xinjing/001-0848c#T0251.001.0848c06",
  },
  {
    step: "核对行动",
    title: "《金刚般若波罗蜜经》",
    text: "用“应无所住而生其心”检查：不住著是否被误读成退场、冷漠或拒绝承担。",
    href: evidence[3].href,
  },
] as const;

export default function EmptinessConceptPage() {
  return (
    <article className="concept-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(conceptPageJsonLd) }}
      />
      <header className="concept-hero">
        <div className="page-shell">
          <nav className="page-breadcrumb" aria-label="面包屑">
            <Link href="/"><ArrowLeft aria-hidden="true" size={15} /> 首页</Link>
            <span>/</span>
            <span>概念</span>
            <span>/</span>
            <span aria-current="page">空</span>
          </nav>

          <div className="concept-hero__grid">
            <div className="concept-hero__copy">
              <p className="eyebrow">概念 HUB · 受控证据版</p>
              <h1><span>空</span>，不是一个<br />脱离语境的答案。</h1>
              <p className="concept-hero__lead">
                在现有原典中，“空”可以指空于我与我所、辨认某处所无与所余，
                也可以在般若经典中说明五蕴与诸法。先分清经藏语境，才不会把它误读成虚无。
              </p>
              <div className="concept-hero__actions">
                <a className="button-primary" href="#evidence">
                  查看原典证据 <ArrowDown aria-hidden="true" size={16} />
                </a>
                <Link className="button-ghost" href="/wenjing">
                  继续问经 <ArrowRight aria-hidden="true" size={16} />
                </Link>
              </div>
            </div>

            <aside className="emptiness-lens" aria-label="空的三个阅读边界">
              <span className="emptiness-lens__glyph" aria-hidden="true">空</span>
              <p className="emptiness-lens__note emptiness-lens__note--one">
                <small>巴利经藏</small>
                空于我与我所
              </p>
              <p className="emptiness-lens__note emptiness-lens__note--two">
                <small>汉译般若</small>
                五蕴与诸法空相
              </p>
              <p className="emptiness-lens__note emptiness-lens__note--three">
                <small>共同底线</small>
                不等于断灭虚无
              </p>
            </aside>
          </div>

          <dl className="concept-proofline">
            <div><dt>可定位证据</dt><dd>4 处</dd></div>
            <div><dt>直接语境</dt><dd>2 组</dd></div>
            <div><dt>统一教义裁决</dt><dd>0 个</dd></div>
            <div><dt>证据状态</dt><dd>受控原文</dd></div>
          </dl>
        </div>
      </header>

      <section className="concept-section concept-terms page-shell" aria-labelledby="terms-title">
        <div className="concept-section__heading">
          <p className="eyebrow">术语范围</p>
          <h2 id="terms-title">先问：在什么语言、哪一层文本里？</h2>
          <p>词形能帮助定位语境，但相近译名并不自动证明各传统的论证完全相同。</p>
        </div>
        <div className="term-register">
          <article>
            <Languages aria-hidden="true" />
            <span>巴利语</span>
            <h3>suñña <small>形容词</small></h3>
            <p>常表达“空的”或“空于某物”。SN 35.85 明确把范围落在“我”与“我所”。</p>
          </article>
          <article>
            <Languages aria-hidden="true" />
            <span>巴利语</span>
            <h3>suññatā <small>名词</small></h3>
            <p>可指空性或空的住处／修习。MN 121 展开一条逐层辨认的实践路径。</p>
          </article>
          <article>
            <Languages aria-hidden="true" />
            <span>梵语对照</span>
            <h3>śūnya · śūnyatā</h3>
            <p>这里只作术语导航；当前证据集没有用受控梵文段落支持独立结论。</p>
          </article>
          <article>
            <Languages aria-hidden="true" />
            <span>汉译佛典</span>
            <h3>空 · 空相 · 空性</h3>
            <p>本页的汉译直接证据来自《心经》；“空性”作为现代总称使用时，仍须回看具体文本措辞。</p>
          </article>
        </div>
      </section>

      <section className="concept-boundaries" aria-labelledby="boundaries-title">
        <div className="page-shell">
          <div className="concept-section__heading concept-section__heading--light">
            <p className="eyebrow">传统边界</p>
            <h2 id="boundaries-title">同一个汉字，不抹平三种文本层次。</h2>
            <p>以下边界只说明当前证据能支持到哪里，并不替任何传统作最终定义。</p>
          </div>
          <div className="tradition-ledger">
            {traditions.map((tradition) => (
              <article key={tradition.label}>
                <div className="tradition-ledger__name">
                  <span>{tradition.label}</span>
                  <strong>{tradition.term}</strong>
                </div>
                <div>
                  <small>当前可支持</small>
                  <p>{tradition.supported}</p>
                </div>
                <div>
                  <small>不能越过的线</small>
                  <p>{tradition.boundary}</p>
                </div>
                <code>{tradition.sources}</code>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="evidence" className="concept-section concept-evidence page-shell" aria-labelledby="evidence-title">
        <div className="concept-section__heading concept-evidence__heading">
          <div>
            <p className="eyebrow">原典证据账本</p>
            <h2 id="evidence-title">每项判断，都有可以重新打开的位置。</h2>
          </div>
          <p><ShieldCheck aria-hidden="true" /> 站内链接固定到作品、阅读页与原生段落；外部链接保留来源核对路径。</p>
        </div>

        <div className="concept-evidence__list">
          {evidence.map((item, index) => (
            <article key={item.locator} className="concept-evidence-card">
              <div className="concept-evidence-card__index" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </div>
              <div className="concept-evidence-card__body">
                <div className="concept-evidence-card__meta">
                  <span className={item.kind === "直接证据" ? "is-direct" : "is-related"}>{item.kind}</span>
                  <span>{item.canon}</span>
                </div>
                <h3>{item.title}</h3>
                <blockquote lang={index < 2 ? "pi" : "zh-Hans"}>{item.quote}</blockquote>
                <p>{item.reading}</p>
              </div>
              <div className="concept-evidence-card__links">
                <code>{item.locator}</code>
                <Link href={item.href}>
                  <Link2 aria-hidden="true" size={15} /> 站内稳定原文
                </Link>
                <a href={item.sourceUrl} target="_blank" rel="noreferrer">
                  来源页 <ArrowUpRight aria-hidden="true" size={14} />
                </a>
              </div>
            </article>
          ))}
        </div>
        <p className="concept-translation-note">
          <CircleAlert aria-hidden="true" /> 巴利文下方中文为本站工作释义，用来说明取证范围，不冒充受控古译或现代授权译本。
        </p>
      </section>

      <section className="concept-misreadings" aria-labelledby="misreadings-title">
        <div className="page-shell concept-misreadings__grid">
          <div className="concept-misreadings__intro">
            <CircleAlert aria-hidden="true" />
            <p className="eyebrow">常见误解</p>
            <h2 id="misreadings-title">先去掉四个太快的等号。</h2>
            <p>这些不是新的教义断言，而是用上方证据为理解划出最低限度的护栏。</p>
          </div>
          <div className="misreading-list">
            {misconceptions.map((item) => (
              <article key={item.myth}>
                <h3>{item.myth}</h3>
                <ArrowRight aria-hidden="true" />
                <p>{item.correction}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="concept-section concept-reading page-shell" aria-labelledby="reading-title">
        <div className="concept-section__heading">
          <p className="eyebrow">下一步阅读</p>
          <h2 id="reading-title">从定义到修习，再进入般若。</h2>
          <p>这是一条有顺序的阅读路径：每一步都用下一部经纠正上一步可能出现的单向理解。</p>
        </div>
        <ol className="reading-path">
          {readingPath.map((item, index) => (
            <li key={item.title}>
              <Link href={item.href}>
                <span className="reading-path__number">{String(index + 1).padStart(2, "0")}</span>
                <span className="reading-path__copy">
                  <small>{item.step}</small>
                  <strong>{item.title}</strong>
                  <span>{item.text}</span>
                </span>
                <ArrowRight aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <footer className="concept-footer">
        <div className="page-shell concept-footer__inner">
          <div>
            <BookOpenCheck aria-hidden="true" />
            <p className="eyebrow">证据边界声明</p>
            <h2>这是入口，不是最后一句话。</h2>
          </div>
          <p>
            本页只综合 foxue.ai 当前受控的巴利经藏与汉译般若原文。
            它不代替师承、论典、注疏与学术研究，也不把一种传统包装成全佛教的唯一答案。
            <span>证据校订：<time dateTime="2026-08-16">2026-08-16</time></span>
          </p>
          <Link className="button-primary" href="/wenjing">
            带着语境继续问 <ArrowRight aria-hidden="true" size={16} />
          </Link>
        </div>
      </footer>
    </article>
  );
}

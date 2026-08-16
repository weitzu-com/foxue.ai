import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, CircleDashed, Clock3, ExternalLink, FileWarning } from "lucide-react";
import { buildCoverageSnapshot } from "@/lib/corpus-registry";

export const metadata: Metadata = {
  title: "透明度",
  description: "foxue.ai 的数据覆盖、来源、AI 能力、已知局限和建设状态。",
  alternates: { canonical: "/touming" },
};

const sources = [
  {
    name: "CBETA",
    use: "首版汉译佛典来源与目录核对",
    href: "https://cbeta.org/",
    rights: "逐项遵循 CBETA 授权说明",
  },
  {
    name: "SuttaCentral",
    use: "巴利经藏、律藏及梵文与俗语固定原文，原生段落标识、书级体裁边界与跨传本关系",
    href: "https://suttacentral.net/",
    rights: "本批巴利原文属公有领域；保留来源署名，不用于模型训练",
  },
  {
    name: "BDRC / BUDA",
    use: "规划藏文资源、IIIF 与关联数据",
    href: "https://www.bdrc.io/",
    rights: "逐对象核对权利与访问条件",
  },
];

export default function TransparencyPage() {
  const coverage = buildCoverageSnapshot();
  const systems = [
    { name: "经典阅读", status: "可用", detail: `${coverage.localHoldings.fullSourceTextExpressions} 个完整文本 · 稳定段落链接`, icon: Check },
    { name: "引证式问经", status: "原型", detail: "确定性规则 · 未启用 LLM", icon: Clock3 },
    { name: "覆盖登记册", status: "公开草案", detail: `GBCR v${coverage.generatedFrom.registryVersion} · 全球分母尚待审计`, icon: Check },
    { name: "全局检索", status: "筹建中", detail: "等待语料权利与索引审计", icon: CircleDashed },
    { name: "用户账户", status: "未开放", detail: "先完成隐私与数据导出设计", icon: CircleDashed },
  ];

  return (
    <div className="transparency-page page-shell">
      <header className="transparency-header">
        <div>
          <p className="eyebrow">透明度报告 · 2026-08-14</p>
          <h1>公开我们知道什么，<br />也公开还不知道什么。</h1>
        </div>
        <p>
          这是随代码发布的机器可核对状态快照。当前数字只描述已进入受控库的文本，
          不代表全球佛典总体覆盖。
        </p>
      </header>

      <section className="metric-board" aria-label="当前公开数据">
        <div><span>完整文本</span><strong>{coverage.localHoldings.fullSourceTextExpressions}</strong><small>个</small></div>
        <div><span>稳定段落</span><strong>{coverage.localHoldings.stableSegments}</strong><small>个</small></div>
        <div><span>生成式回答</span><strong>0</strong><small>尚未启用</small></div>
        <div><span>99% 分母</span><strong>—</strong><small>GBCR v{coverage.generatedFrom.registryVersion} · 未知</small></div>
      </section>

      <section className="transparency-section">
        <div className="transparency-section__heading">
          <p className="eyebrow">SERVICE STATUS</p>
          <h2>系统状态</h2>
        </div>
        <div className="system-list">
          {systems.map((system) => {
            const Icon = system.icon;
            return (
              <div key={system.name}>
                <Icon aria-hidden="true" />
                <strong>{system.name}</strong>
                <span>{system.detail}</span>
                <em>{system.status}</em>
              </div>
            );
          })}
        </div>
      </section>

      <section className="transparency-section transparency-section--sources">
        <div className="transparency-section__heading">
          <p className="eyebrow">SOURCE LEDGER</p>
          <h2>来源与权利</h2>
        </div>
        <div className="source-ledger">
          {sources.map((source) => (
            <article key={source.name}>
              <h3>{source.name}</h3>
              <p>{source.use}</p>
              <span>{source.rights}</span>
              <a href={source.href} target="_blank" rel="noreferrer">
                来源网站 <ExternalLink aria-hidden="true" size={14} />
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className="transparency-section">
        <div className="transparency-section__heading">
          <p className="eyebrow">COVERAGE REGISTRY</p>
          <h2>可复算覆盖</h2>
        </div>
        <div className="coverage-summary-inline">
          <p>
            当前登记 {coverage.localHoldings.registeredWorks} 个可追踪作品实体、{coverage.localHoldings.registeredExpressions} 个文本表达、
            {coverage.localHoldings.stableSegments} 个稳定行段。部分新增经号仍是暂定书目实体；全球分母与作品级去重尚未完成，因此不会发布总体百分比。
          </p>
          <Link className="button-secondary" href="/fugai">
            打开全球佛典覆盖登记册 <ArrowRight aria-hidden="true" size={16} />
          </Link>
          <a className="text-link" href="/api/v1/corpus/coverage">机器可读 API</a>
        </div>
      </section>

      <section className="known-limits">
        <FileWarning aria-hidden="true" />
        <div>
          <p className="eyebrow">KNOWN LIMITS</p>
          <h2>当前已知局限</h2>
          <ul>
            <li>经藏现有 {coverage.localHoldings.registeredWorks} 个可追踪作品实体、{coverage.localHoldings.fullSourceTextExpressions} 个完整文本；般若、法华与华严部已核定部分同作品多译本或节译见证边界，其余经会、文本家族与跨语种候选仍保留待复核状态，尚不能支持全部佛学问答。</li>
            <li>{coverage.localHoldings.structureVerifiedWorks} 部作品已通过结构与锚点核验，其中 {coverage.localHoldings.qualityVerifiedSampleWorks} 部完成代表性人工样本复核。</li>
            <li>覆盖登记册已发布 v{coverage.generatedFrom.registryVersion} 草案；汉译与巴利来源记录可复算，但全球作品分母尚未完成独立审计。</li>
            <li>尚未完成法师、学者、译者和不同传统用户的外部评审。</li>
            <li>当前问经回答为代码内人工编写示例，不是实时 AI 生成。</li>
          </ul>
        </div>
      </section>

      <section className="transparency-cta">
        <div>
          <p className="eyebrow">公开建设</p>
          <h2>所有承诺，都应该进入版本历史。</h2>
        </div>
        <a
          className="button-secondary"
          href="https://github.com/weitzu-com/foxue.ai"
          target="_blank"
          rel="noreferrer"
        >
          查看 GitHub <ArrowRight aria-hidden="true" size={16} />
        </a>
        <Link className="text-link" href="/yuanze">阅读原则与边界</Link>
      </section>
    </div>
  );
}

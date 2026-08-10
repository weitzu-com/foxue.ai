import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, CircleDashed, Clock3, ExternalLink, FileWarning } from "lucide-react";
import { sutras } from "@/data/sutras";

export const metadata: Metadata = {
  title: "透明度",
  description: "foxue.ai 的数据覆盖、来源、AI 能力、已知局限和建设状态。",
};

const systems = [
  { name: "经典阅读", status: "可用", detail: "3 部样本 · 稳定段落链接", icon: Check },
  { name: "引证式问经", status: "原型", detail: "确定性规则 · 未启用 LLM", icon: Clock3 },
  { name: "全局检索", status: "筹建中", detail: "等待语料权利与索引审计", icon: CircleDashed },
  { name: "用户账户", status: "未开放", detail: "先完成隐私与数据导出设计", icon: CircleDashed },
];

const sources = [
  {
    name: "CBETA",
    use: "首版汉译佛典来源与目录核对",
    href: "https://cbeta.org/",
    rights: "逐项遵循 CBETA 授权说明",
  },
  {
    name: "SuttaCentral",
    use: "规划巴利经藏、段落标识与多语对读",
    href: "https://suttacentral.net/",
    rights: "逐文本核对 CC0 或来源许可",
  },
  {
    name: "BDRC / BUDA",
    use: "规划藏文资源、IIIF 与关联数据",
    href: "https://www.bdrc.io/",
    rights: "逐对象核对权利与访问条件",
  },
];

export default function TransparencyPage() {
  const segmentCount = sutras.reduce((sum, item) => sum + item.segments.length, 0);

  return (
    <div className="transparency-page page-shell">
      <header className="transparency-header">
        <div>
          <p className="eyebrow">透明度报告 · 2026-08-11</p>
          <h1>公开我们知道什么，<br />也公开还不知道什么。</h1>
        </div>
        <p>
          这是随代码发布的首份机器可核对状态快照。当前数字只描述已进入仓库的样本，
          不代表全球佛典总体覆盖。
        </p>
      </header>

      <section className="metric-board" aria-label="当前公开数据">
        <div><span>登记经典</span><strong>{sutras.length}</strong><small>部样本</small></div>
        <div><span>稳定段落</span><strong>{segmentCount}</strong><small>个</small></div>
        <div><span>生成式回答</span><strong>0</strong><small>尚未启用</small></div>
        <div><span>99% 分母</span><strong>—</strong><small>登记册筹建中</small></div>
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

      <section className="known-limits">
        <FileWarning aria-hidden="true" />
        <div>
          <p className="eyebrow">KNOWN LIMITS</p>
          <h2>当前已知局限</h2>
          <ul>
            <li>经藏仅有 3 部短样本，不能支持广泛的佛学问答。</li>
            <li>段落定位需要在正式导入 CBETA 数据时重新自动核对。</li>
            <li>尚未建立全球佛典覆盖登记册，因此不会发布覆盖百分比。</li>
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

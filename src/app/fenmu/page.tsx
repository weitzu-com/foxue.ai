import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight, CircleDashed, ExternalLink, FileCheck2, Scale } from "lucide-react";
import standard from "../../../data/gbcr/global-denominator-standard-v0.1.0.json";
import sourceUniverse from "../../../data/gbcr/global-denominator-source-universe-v0.1.0.json";
import reviewLedger from "../../../data/gbcr/global-denominator-review-ledger-v0.1.0.json";
import { corpusRegistry } from "@/lib/corpus-registry";
import { buildGlobalReviewWorkbenchPayload } from "@/lib/global-review-queue";
import { buildPageJsonLd, buildPageMetadata, serializeJsonLd } from "@/lib/site-metadata";
import GlobalReviewWorkbench from "./global-review-workbench";
import GlobalReviewWorkbenchClient from "./global-review-workbench-client";

export const metadata: Metadata = buildPageMetadata({
  title: "全球佛经作品分母治理",
  description: "foxue.ai 全球佛经作品分母治理：公开来源宇宙、保守公式、审校队列和 G0–G7 发布门。",
  path: "/fenmu",
});

const denominatorPageJsonLd = buildPageJsonLd({
  path: "/fenmu",
  title: "全球佛经作品分母治理",
  description: "foxue.ai 全球佛经作品分母治理：公开来源宇宙、保守公式、审校队列和 G0–G7 发布门。",
  type: "CollectionPage",
  breadcrumb: [
    { name: "首页", path: "/" },
    { name: "全球分母治理", path: "/fenmu" },
  ],
  about: ["全球佛经作品分母", "来源宇宙", "保守公式", "G0-G7 发布门"],
});

const sourceLabels: Record<string, string> = {
  cbeta_xml_p5: "CBETA 汉文藏经",
  suttacentral_bilara: "SuttaCentral 多语种根本文本",
  bdrc_derge_kangyur: "BDRC 德格甘珠尔",
  dsbc_sanskrit_catalog: "DSBC 梵文目录",
  gretil_sanskrit_buddhist_files: "GRETIL 梵文文件",
  rkts_kangyur_catalogs: "rKTs 多版本藏文目录",
  esukhia_derge_kangyur: "Esukhia 德格全文",
};

const statusLabels: Record<string, string> = {
  partial: "部分完成",
  pending: "待完成",
};

export const dynamic = "force-static";

export default function GlobalDenominatorPage() {
  const governance = corpusRegistry.globalDenominatorGovernance;
  const initialReviewPayload = buildGlobalReviewWorkbenchPayload({});

  return (
    <main className="denominator-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(denominatorPageJsonLd) }}
      />
      <header className="denominator-hero page-shell">
        <div>
          <p className="eyebrow">GLOBAL DENOMINATOR · PUBLIC DRAFT {standard.version}</p>
          <h1>先定义“全世界”，<br />再谈 99%。</h1>
          <p>
            文件、卷、译本、版本见证与作品不是同一个单位。foxue.ai 先把所有不确定性公开进入保守分母，
            再由独立真人逐项复核；在来源宇宙闭合前，全球覆盖率保持未知。
          </p>
        </div>
        <aside className="denominator-verdict" aria-label="全球分母状态">
          <CircleDashed aria-hidden="true" />
          <strong>全球作品分母：未知</strong>
          <span>独立真人裁决 {governance.independentHumanDecisions}</span>
          <p>当前不发布任何全球 99% 声明，也不以来源记录总数冒充作品数。</p>
        </aside>
      </header>

      <section className="denominator-ledger page-shell" aria-label="当前分母治理账本">
        <article><span>冻结候选记录</span><strong>{governance.frozenCandidateRecords.toLocaleString("zh-CN")}</strong><p>异质记录，不是作品总数</p></article>
        <article><span>待双重复核</span><strong>{governance.registeredWorksQueued.toLocaleString("zh-CN")}</strong><p>站内登记作品任务</p></article>
        <article><span>外部来源空白</span><strong>{governance.externalGapsRegistered}</strong><p>每一类都必须公开闭合</p></article>
        <article><span>自动分母变更</span><strong>{governance.automaticDenominatorChanges}</strong><p>机器不会替代学术裁决</p></article>
      </section>

      <section className="denominator-formula page-shell" aria-labelledby="formula-title">
        <div>
          <p className="eyebrow">CONSERVATIVE LOWER BOUND</p>
          <h2 id="formula-title">未知，不是可以丢掉的零。</h2>
          <p>{standard.conservativeFormula.externalUnknownTreatment}</p>
        </div>
        <div className="denominator-equation">
          <div><span>保守分母</span><p>{standard.conservativeFormula.denominator}</p></div>
          <div><span>单项分子</span><p>{standard.conservativeFormula.numerator}</p></div>
          <code>单项覆盖率下界 = 单项分子 ÷ 保守分母</code>
          <small>{governance.conservativeUnresolvedTreatment}</small>
        </div>
      </section>

      <section className="denominator-sources">
        <div className="page-shell">
          <div className="denominator-heading">
            <div>
              <p className="eyebrow">FROZEN SOURCE UNIVERSE</p>
              <h2>七个来源，七种计量边界。</h2>
            </div>
            <Scale aria-hidden="true" />
          </div>
          <div className="denominator-source-table" role="table" aria-label="冻结来源宇宙">
            <div className="denominator-source-table__head" role="row">
              <span role="columnheader">来源</span><span role="columnheader">候选记录</span><span role="columnheader">单位</span><span role="columnheader">审校</span>
            </div>
            {sourceUniverse.frozenSources.map((source) => (
              <div className="denominator-source-table__row" role="row" key={source.sourceId}>
                <strong role="cell">{sourceLabels[source.sourceId] ?? source.sourceId}</strong>
                <span role="cell">{source.candidateRecordCount.toLocaleString("zh-CN")}</span>
                <span role="cell">{source.recordUnit}</span>
                <em role="cell">{source.independentSourceReviewsCompleted}/{source.minimumIndependentSourceReviews}</em>
                <p>{source.caveat}</p>
              </div>
            ))}
          </div>
          <p className="denominator-note">30,797 是上述异质候选记录的合计，只用于暴露审计规模，绝不作为全球去重作品分母。</p>
        </div>
      </section>

      <section className="denominator-gaps page-shell" aria-labelledby="gaps-title">
        <div className="denominator-heading">
          <div><p className="eyebrow">EXTERNAL GAP REGISTER</p><h2 id="gaps-title">已知不知道的，也进入账本。</h2></div>
        </div>
        <div className="denominator-gap-grid">
          {sourceUniverse.externalGapRegister.map((gap, index) => (
            <article key={gap.gapId}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{gap.labelZh}</h3>
              <p>{gap.requiredAction}</p>
              <a href={gap.evidenceUrl} target="_blank" rel="noreferrer">核对外部证据 <ExternalLink aria-hidden="true" size={13} /></a>
            </article>
          ))}
        </div>
      </section>

      <section className="denominator-gates">
        <div className="page-shell">
          <div className="denominator-heading">
            <div><p className="eyebrow">G0–G7 RELEASE GATES</p><h2>八道门，一道都不能绕过。</h2></div>
            <FileCheck2 aria-hidden="true" />
          </div>
          <ol className="denominator-gate-list">
            {governance.publicationGates.map((gate) => (
              <li key={gate.id}>
                <span>{gate.id}</span>
                <div><h3>{gate.labelZh}</h3><p>{gate.requirement}</p></div>
                <em data-status={gate.status}>{statusLabels[gate.status] ?? gate.status}</em>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="denominator-review page-shell">
        <div>
          <p className="eyebrow">INDEPENDENT HUMAN REVIEW</p>
          <h2>两人独立判断；分歧由第三人仲裁。</h2>
          <p>
            每个任务分别审查严格佛经范围与跨版本作品身份。复核者必须具名、披露利益冲突、提供支持证据与反证，
            并以可验证签名负责。当前账本共有 {reviewLedger.summary.declaredReviewers} 名申报复核者、
            {reviewLedger.summary.decisions} 份决定、{reviewLedger.summary.arbitrations} 份仲裁。
          </p>
          <div className="denominator-actions">
            <a className="button-primary" href="https://github.com/weitzu-com/foxue.ai/issues/new?template=global-denominator-review.yml" target="_blank" rel="noreferrer">
              提交独立复核 <ArrowRight aria-hidden="true" size={15} />
            </a>
            <a className="button-secondary" href="https://github.com/weitzu-com/foxue.ai/blob/main/docs/GLOBAL_DENOMINATOR_REVIEW_PROTOCOL.md" target="_blank" rel="noreferrer">
              阅读完整协议
            </a>
          </div>
        </div>
        <dl className="denominator-priorities">
          {Object.entries(governance.priorityCounts).map(([priority, count]) => (
            <div key={priority}><dt>{priority}</dt><dd>{count.toLocaleString("zh-CN")}<small> 项</small></dd></div>
          ))}
        </dl>
      </section>

      <Suspense fallback={<GlobalReviewWorkbench payload={initialReviewPayload} />}>
        <GlobalReviewWorkbenchClient initialPayload={initialReviewPayload} />
      </Suspense>

      <section className="denominator-artifacts page-shell">
        <h2>所有判断，都能回到原始文件。</h2>
        <div>
          <a href="https://github.com/weitzu-com/foxue.ai/blob/main/data/gbcr/global-denominator-standard-v0.1.0.json" target="_blank" rel="noreferrer">分母标准 JSON <ExternalLink aria-hidden="true" size={13} /></a>
          <a href="https://github.com/weitzu-com/foxue.ai/blob/main/data/gbcr/global-denominator-source-universe-v0.1.0.json" target="_blank" rel="noreferrer">来源宇宙 JSON <ExternalLink aria-hidden="true" size={13} /></a>
          <a href="https://github.com/weitzu-com/foxue.ai/blob/main/data/gbcr/global-denominator-review-queue-v0.1.0.json" target="_blank" rel="noreferrer">3,377 项队列 JSON <ExternalLink aria-hidden="true" size={13} /></a>
          <a href="https://github.com/weitzu-com/foxue.ai/blob/main/data/gbcr/global-denominator-review-ledger-v0.1.0.json" target="_blank" rel="noreferrer">审校账本 JSON <ExternalLink aria-hidden="true" size={13} /></a>
          <Link href="/api/v1/corpus/coverage">机器可读覆盖 API <ArrowRight aria-hidden="true" size={13} /></Link>
        </div>
      </section>
    </main>
  );
}

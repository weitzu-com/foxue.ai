import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Braces,
  CheckCircle2,
  CircleDashed,
  ExternalLink,
  FileLock2,
  Fingerprint,
  Scale,
} from "lucide-react";
import {
  buildCoverageSnapshot,
  corpusRegistry,
  sourceSnapshotInventory,
} from "@/lib/corpus-registry";

export const metadata: Metadata = {
  title: "佛典覆盖登记册",
  description: "foxue.ai 全球佛典覆盖登记册：公开分母、来源快照、权利状态和可复算的收录进度。",
};

const statusLabels: Record<string, string> = {
  candidate_snapshot_ready: "候选快照已冻结",
  candidate_expression_snapshot_ready: "候选文本记录已冻结",
  candidate_snapshot_with_controlled_pilot: "候选快照与受控试点已完成",
  candidate_snapshot_with_controlled_collections: "候选快照与受控经集已完成",
  catalog_snapshot_pending: "目录快照待建",
  edition_alignment_pending: "版本对齐中",
  federated_sources_pending: "联邦来源待建",
};

const dimensionNotes: Record<string, string> = {
  catalog: "有规范作品标识与外部目录号",
  full_source_text: "必须是完整文本，摘录不计",
  stable_segments: "每段有持久链接",
  translation: "每种目标语言单独计算",
  rights: "逐对象核对许可与再分发条件",
  quality: "通过来源、结构与抽样复核",
};

export default function CoveragePage() {
  const snapshot = buildCoverageSnapshot();

  return (
    <main className="coverage-page">
      <header className="coverage-hero page-shell">
        <div className="coverage-hero__copy">
          <p className="eyebrow">GBCR · PUBLIC DRAFT {corpusRegistry.registry.version}</p>
          <h1>先把世界的佛典<br />一部一部数清楚。</h1>
          <p>
            这是“收录 99%”承诺的公开账本。当前全球分母仍未知，所以这里不展示一个看似漂亮、实际无法复算的百分比。
          </p>
        </div>
        <aside className="coverage-claim" aria-label="99% 声明状态">
          <span className="coverage-claim__number">99%</span>
          <div>
            <strong><CircleDashed aria-hidden="true" /> 尚不可声明</strong>
            <p>{snapshot.claim.reason}</p>
          </div>
        </aside>
      </header>

      <section className="coverage-ledger page-shell" aria-labelledby="ledger-title">
        <div className="coverage-ledger__intro">
          <p className="eyebrow">CURRENT HOLDINGS</p>
          <h2 id="ledger-title">仓库里真实拥有的，只有这些。</h2>
          <p>外部项目的目录与翻译进度只作为来源证据，不会算进 foxue.ai 的本地收录；暂定书目实体也不会冒充已完成去重的作品。</p>
        </div>
        <dl className="coverage-numbers">
          <div><dt>作品实体</dt><dd>{snapshot.localHoldings.registeredWorks}<small>个</small></dd></div>
          <div><dt>稳定行段</dt><dd>{snapshot.localHoldings.stableSegments}<small>段</small></dd></div>
          <div><dt>完整文本</dt><dd>{snapshot.localHoldings.fullSourceTextExpressions}<small>个</small></dd></div>
          <div><dt>结构核验</dt><dd>{snapshot.localHoldings.structureVerifiedWorks}<small>部</small></dd></div>
        </dl>
      </section>

      <section className="candidate-inventory page-shell" aria-labelledby="candidate-title">
        <div>
          <p className="eyebrow">FIRST SOURCE SNAPSHOTS</p>
          <h2 id="candidate-title">已经数清来源记录，<br />还没有数清独立作品。</h2>
          <p>{sourceSnapshotInventory.warning}</p>
        </div>
        <div className="candidate-cards">
          {sourceSnapshotInventory.sources.map((source) => (
            <article key={source.id}>
              <span>{source.id === "cbeta_xml_p5" ? "CBETA" : "SUTTACENTRAL"}</span>
              <strong>{source.candidateRecordCount.toLocaleString("zh-CN")}</strong>
              <p>条候选来源记录</p>
              <small>{source.denominatorCaveat}</small>
            </article>
          ))}
          <article>
            <span>漢譯經藏階段進度</span>
            <strong>
              {snapshot.candidateInventory.chineseSutraRecordSubset.controlled}
              <small> / {snapshot.candidateInventory.chineseSutraRecordSubset.denominator}</small>
            </strong>
            <p>
              {snapshot.candidateInventory.chineseSutraRecordSubset.percentage}% 候选文本记录进入受控全文库；
              固定清单合计 {(snapshot.candidateInventory.chineseSutraRecordSubset.sourceBytes! / 1_000_000).toFixed(1)} MB；
              其中 T01–T02 阿含部固定来源已完成 {snapshot.candidateInventory.chineseAgamaSourceRecords.controlled}
              /{snapshot.candidateInventory.chineseAgamaSourceRecords.denominator}（{snapshot.candidateInventory.chineseAgamaSourceRecords.percentage}%），
              T03–T04 本缘部固定来源已完成 {snapshot.candidateInventory.chineseBenyuanSourceRecords.controlled}
              /{snapshot.candidateInventory.chineseBenyuanSourceRecords.denominator}（{snapshot.candidateInventory.chineseBenyuanSourceRecords.percentage}%），
              T05–T08 般若部固定来源已完成 {snapshot.candidateInventory.chinesePrajnaparamitaSourceRecords.controlled}
              /{snapshot.candidateInventory.chinesePrajnaparamitaSourceRecords.denominator}（{snapshot.candidateInventory.chinesePrajnaparamitaSourceRecords.percentage}%），
              T09 法华部固定来源已完成 {snapshot.candidateInventory.chineseLotusSourceRecords.controlled}
              /{snapshot.candidateInventory.chineseLotusSourceRecords.denominator}（{snapshot.candidateInventory.chineseLotusSourceRecords.percentage}%）；
              其中一条是完整保存的节译见证，不冒充完整译本；
              T10 华严部固定来源已完成 {snapshot.candidateInventory.chineseAvatamsakaSourceRecords.controlled}
              /{snapshot.candidateInventory.chineseAvatamsakaSourceRecords.denominator}（{snapshot.candidateInventory.chineseAvatamsakaSourceRecords.percentage}%），
              全经、单品与节译见证分层计数；
              T11 宝积部固定来源已完成 {snapshot.candidateInventory.chineseRatnakutaSourceRecords.controlled}
              /{snapshot.candidateInventory.chineseRatnakutaSourceRecords.denominator}（{snapshot.candidateInventory.chineseRatnakutaSourceRecords.percentage}%），
              合集、单会译本与版本见证分层计数；
              T12 宝积部末与涅槃部固定来源已完成 {snapshot.candidateInventory.chineseT12SourceRecords.controlled}
              /{snapshot.candidateInventory.chineseT12SourceRecords.denominator}（{snapshot.candidateInventory.chineseT12SourceRecords.percentage}%），
              异译、校辑本、后分与残篇见证分层计数；
              T13 大集部固定来源已完成 {snapshot.candidateInventory.chineseT13SourceRecords.controlled}
              /{snapshot.candidateInventory.chineseT13SourceRecords.denominator}（{snapshot.candidateInventory.chineseT13SourceRecords.percentage}%），
              合集、单品译本、同经异译与后出节本分层计数；
              T14 经集部固定来源已完成 {snapshot.candidateInventory.chineseT14SourceRecords.controlled}
              /{snapshot.candidateInventory.chineseT14SourceRecords.denominator}（{snapshot.candidateInventory.chineseT14SourceRecords.percentage}%），
              同题异译、a/b 版本与部分独立译出分层计数；
              T15 经集部固定来源已完成 {snapshot.candidateInventory.chineseT15SourceRecords.controlled}
              /{snapshot.candidateInventory.chineseT15SourceRecords.denominator}（{snapshot.candidateInventory.chineseT15SourceRecords.percentage}%），
              同经异译、别品译出、禅观撰述与同题范围候选分层计数；
              T16 经集部固定来源已完成 {snapshot.candidateInventory.chineseT16SourceRecords.controlled}
              /{snapshot.candidateInventory.chineseT16SourceRecords.denominator}（{snapshot.candidateInventory.chineseT16SourceRecords.percentage}%），
              同经异译、再译、合部编纂、单品译出与短本见证分层计数
            </p>
            <small>{snapshot.candidateInventory.chineseSutraRecordSubset.caveat}</small>
            <a
              className="text-link"
              href="https://github.com/weitzu-com/foxue.ai/blob/main/data/gbcr/cbeta-taisho-sutra-inventory-v0.2.1.json"
              target="_blank"
              rel="noreferrer"
            >
              查看 881 条逐文件清单 <ExternalLink aria-hidden="true" size={13} />
            </a>
          </article>
          <article>
            <span>巴利 ROOT 受控进度</span>
            <strong>
              {snapshot.candidateInventory.suttacentralPaliRootPilot.controlled}
              <small> / {snapshot.candidateInventory.suttacentralPaliRootPilot.denominator}</small>
            </strong>
            <p>
              {snapshot.candidateInventory.suttacentralPaliRootPilot.percentage}% 物理记录进入受控全文库；
              其中固定提交的巴利经藏目录已完成 {snapshot.candidateInventory.suttacentralPaliSuttaRoot.controlled}
              /{snapshot.candidateInventory.suttacentralPaliSuttaRoot.denominator} 条（{snapshot.candidateInventory.suttacentralPaliSuttaRoot.percentage}%）逐文件受控；
              律藏与论藏仍保持独立统计
            </p>
            <small>{snapshot.candidateInventory.suttacentralPaliRootPilot.caveat}</small>
            <Link className="text-link" href="/jingzang/khuddaka-nikaya-snp">
              阅读巴利《小部·经集》 <ArrowRight aria-hidden="true" size={13} />
            </Link>
          </article>
        </div>
      </section>

      <section className="coverage-method">
        <div className="page-shell">
          <div className="coverage-section-heading">
            <div>
              <p className="eyebrow">SIX SEPARATE MEASURES</p>
              <h2>六把尺子，绝不揉成一个数。</h2>
            </div>
            <Scale aria-hidden="true" />
          </div>
          <div className="dimension-grid">
            {corpusRegistry.dimensions.map((dimension, index) => (
              <article key={dimension.id}>
                <span>0{index + 1}</span>
                <h3>{dimension.label}</h3>
                <p>{dimension.definition}</p>
                <small>{dimensionNotes[dimension.id]}</small>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="source-family-section page-shell" aria-labelledby="family-title">
        <div className="coverage-section-heading">
          <div>
            <p className="eyebrow">DENOMINATOR MAP</p>
            <h2 id="family-title">全球分母，分四条线建设。</h2>
          </div>
          <Fingerprint aria-hidden="true" />
        </div>
        <div className="family-table" role="table" aria-label="全球佛典来源族状态">
          <div className="family-table__header" role="row">
            <span role="columnheader">来源族</span>
            <span role="columnheader">语种</span>
            <span role="columnheader">分母</span>
            <span role="columnheader">状态</span>
          </div>
          {corpusRegistry.sourceFamilies.map((family) => (
            <div className="family-table__row" role="row" key={family.id}>
              <strong role="cell">{family.title}</strong>
              <span role="cell">{family.languages.join(" · ")}</span>
              <span role="cell">
                {"candidateExpressionRecords" in family
                  ? `${family.candidateExpressionRecords} 条候选记录`
                  : "—"}
              </span>
              <em role="cell">{statusLabels[family.denominatorStatus] ?? family.denominatorStatus}</em>
            </div>
          ))}
        </div>
        <p className="coverage-null-note">“—” 表示尚未测量，不表示 0。每条线完成去重、版本对齐和独立复核后才会填入分母。</p>
      </section>

      <section className="snapshot-section">
        <div className="page-shell snapshot-grid">
          <div>
            <p className="eyebrow">FROZEN SOURCES</p>
            <h2>来源会变化，证据必须冻结。</h2>
            <p>Git 来源固定到完整提交号；网页来源记录抓取日期。API 代码许可与佛典对象许可严格分开。</p>
            <a className="button-secondary" href="/api/v1/corpus/coverage">
              <Braces aria-hidden="true" size={16} /> 打开机器可读 API
            </a>
          </div>
          <div className="snapshot-list">
            {corpusRegistry.sourceSnapshots.map((source) => (
              <article key={source.id}>
                <div>
                  <CheckCircle2 aria-hidden="true" />
                  <h3>{source.name}</h3>
                </div>
                <p>{source.role}</p>
                <code>{source.snapshot.ref.slice(0, 12)}</code>
                <a href={source.dataUrl} target="_blank" rel="noreferrer">
                  核对来源 <ExternalLink aria-hidden="true" size={13} />
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="integrity-callout page-shell">
        <FileLock2 aria-hidden="true" />
        <div>
          <p className="eyebrow">INTEGRITY CONTRACT</p>
          <h2>旧版本不覆盖，未知数不猜测。</h2>
          <p>
            登记册以 JSON、版本号和 SHA-256 校验和保存。每次构建都会自动检查标识唯一性、来源引用、权利状态与统计纪律。
          </p>
        </div>
        <a
          className="text-link"
          href="https://github.com/weitzu-com/foxue.ai/tree/main/data/gbcr"
          target="_blank"
          rel="noreferrer"
        >
          查看原始登记册 <ArrowRight aria-hidden="true" size={15} />
        </a>
      </section>

      <section className="coverage-next page-shell">
        <div>
          <p className="eyebrow">NEXT AUDIT GATE</p>
          <h2>下一步：扩展汉译，并复核跨语种作品关系。</h2>
          <p>固定提交中的巴利经藏目录已逐条受控。下一阶段继续纳入汉译经藏候选记录，并在学术复核后逐步建立平行经与传本关系；未经复核的自动对齐不会进入永久登记册。</p>
        </div>
        <Link className="button-primary" href="/touming">
          查看完整透明度报告 <ArrowRight aria-hidden="true" size={16} />
        </Link>
      </section>
    </main>
  );
}

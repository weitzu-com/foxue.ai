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
  fixed_edition_expression_snapshot_ready: "固定版本表达式快照已冻结",
  multi_edition_catalog_snapshots_ready_alignment_pending: "多版本目录已冻结，作品对齐中",
  catalog_and_file_snapshots_ready_file_rights_audited_alignment_pending: "逐文件权利已审计，作品对齐中",
  federated_sources_pending: "联邦来源待建",
};

const sourceLabels: Record<string, string> = {
  cbeta_xml_p5: "CBETA",
  suttacentral_bilara: "SUTTACENTRAL",
  bdrc_derge_kangyur: "BDRC · 德格甘珠尔",
  dsbc_sanskrit_catalog: "DSBC · 梵文目录",
  gretil_sanskrit_buddhist_files: "GRETIL · 梵文文件",
  rkts_kangyur_catalogs: "rKTs · 多版本甘珠尔",
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
              <span>{sourceLabels[source.id] ?? source.id}</span>
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
              同经异译、再译、合部编纂、单品译出与短本见证分层计数；
              T17 经集部固定来源已完成 {snapshot.candidateInventory.chineseT17SourceRecords.controlled}
              /{snapshot.candidateInventory.chineseT17SourceRecords.denominator}（{snapshot.candidateInventory.chineseT17SourceRecords.percentage}%），
              异译、a/b 版本、失译、撰集、节抄与疑似中国撰述分层计数；
              T18 密教部固定来源已完成 {snapshot.candidateInventory.chineseT18SourceRecords.controlled}
              /{snapshot.candidateInventory.chineseT18SourceRecords.denominator}（{snapshot.candidateInventory.chineseT18SourceRecords.percentage}%），
              其中 {snapshot.candidateInventory.chineseT18SourceRecords.fullSourceTexts} 份登记为完整作品来源全文、
              {snapshot.candidateInventory.chineseT18SourceRecords.partialSourceWitnesses} 份明确保持局部作品见证，
              {snapshot.candidateInventory.chineseT18SourceRecords.verifiedEditionWitnesses} 份版本见证共享作品实体；
              译经、仪轨、撰述、辑录与失译分层计数；
              T19 密教部固定来源已完成 {snapshot.candidateInventory.chineseT19SourceRecords.controlled}
              /{snapshot.candidateInventory.chineseT19SourceRecords.denominator}（{snapshot.candidateInventory.chineseT19SourceRecords.percentage}%），
              其中 {snapshot.candidateInventory.chineseT19SourceRecords.fullSourceTexts} 份登记为完整作品来源全文、
              {snapshot.candidateInventory.chineseT19SourceRecords.partialSourceWitnesses} 份保持局部作品见证，
              {snapshot.candidateInventory.chineseT19SourceRecords.verifiedEditionWitnesses} 份版本见证共享作品实体；
              T0946 的原始卷号 1、2、4、5 按来源保留；
              T20 密教部固定来源已完成 {snapshot.candidateInventory.chineseT20SourceRecords.controlled}
              /{snapshot.candidateInventory.chineseT20SourceRecords.denominator}（{snapshot.candidateInventory.chineseT20SourceRecords.percentage}%），
              其中 {snapshot.candidateInventory.chineseT20SourceRecords.fullSourceTexts} 份登记为完整作品来源全文、
              {snapshot.candidateInventory.chineseT20SourceRecords.partialSourceWitnesses} 份保持品、分或真言组件的局部作品见证，
              {snapshot.candidateInventory.chineseT20SourceRecords.verifiedEditionWitnesses} 份版本见证共享作品实体；
              T21 密教部固定来源已完成 {snapshot.candidateInventory.chineseT21SourceRecords.controlled}
              /{snapshot.candidateInventory.chineseT21SourceRecords.denominator}（{snapshot.candidateInventory.chineseT21SourceRecords.percentage}%），
              其中 {snapshot.candidateInventory.chineseT21SourceRecords.fullSourceTexts} 份登记为完整作品来源全文、
              {snapshot.candidateInventory.chineseT21SourceRecords.partialSourceWitnesses} 份保持法品、仪轨品或大教王经组件的局部作品见证，
              {snapshot.candidateInventory.chineseT21SourceRecords.verifiedEditionWitnesses} 份版本见证共享作品实体；
              译、失译、无署名、撰、述、集、记、造、译解、请来与将来角色分别标注；
              T22 律部固定来源已完成 {snapshot.candidateInventory.chineseT22SourceRecords.controlled}
              /{snapshot.candidateInventory.chineseT22SourceRecords.denominator}（{snapshot.candidateInventory.chineseT22SourceRecords.percentage}%），
              15 份均为完整来源全文，{snapshot.candidateInventory.chineseT22SourceRecords.verifiedEditionWitnesses} 份同号版本见证共享作品实体，
              {snapshot.candidateInventory.chineseT22SourceRecords.attributionBoundaryRecords} 份保留“集”“录”或译后编集责任；
              广律、戒本与羯磨文本分层登记；
              T23 律部固定来源已完成 {snapshot.candidateInventory.chineseT23SourceRecords.controlled}
              /{snapshot.candidateInventory.chineseT23SourceRecords.denominator}（{snapshot.candidateInventory.chineseT23SourceRecords.percentage}%），
              13 份均为完整来源全文，0 份被自动归并为版本见证，
              {snapshot.candidateInventory.chineseT23SourceRecords.attributionBoundaryRecords} 份保留“集出”“撰出”、无署名或失译附序责任；
              十诵律组件、毘尼解释与根本说一切有部事部文本分层登记；
              T24 律部固定来源已完成 {snapshot.candidateInventory.chineseT24SourceRecords.controlled}
              /{snapshot.candidateInventory.chineseT24SourceRecords.denominator}（{snapshot.candidateInventory.chineseT24SourceRecords.percentage}%），
              其中 {snapshot.candidateInventory.chineseT24SourceRecords.fullSourceTexts} 份为完整作品来源全文、
              {snapshot.candidateInventory.chineseT24SourceRecords.partialSourceWitnesses} 份保持节出见证，
              {snapshot.candidateInventory.chineseT24SourceRecords.verifiedEditionWitnesses} 份 a/b 版本见证共享作品实体，
              {snapshot.candidateInventory.chineseT24SourceRecords.verifiedSameWorkExpressions} 份异译表达共享作品实体，
              {snapshot.candidateInventory.chineseT24SourceRecords.attributionBoundaryRecords} 份明确保留失译、无署名、造说责任或传统译者归属争议；
              T25 释经论部固定来源已完成 {snapshot.candidateInventory.chineseT25SourceRecords.controlled}
              /{snapshot.candidateInventory.chineseT25SourceRecords.denominator}（{snapshot.candidateInventory.chineseT25SourceRecords.percentage}%），
              {snapshot.candidateInventory.chineseT25SourceRecords.fullSourceTexts} 份均为完整来源文本，
              {snapshot.candidateInventory.chineseT25SourceRecords.verifiedSameWorkExpressions} 份同本异译表达共享作品实体，
              {snapshot.candidateInventory.chineseT25SourceRecords.verifiedEditionWitnesses} 份 a/b 传本见证共享作品实体，
              {snapshot.candidateInventory.chineseT25SourceRecords.attributionBoundaryRecords} 份全部明确标注为论书、译者缺名、失译或传统作者归属争议；
              T26 释经论与毘昙部固定来源已完成 {snapshot.candidateInventory.chineseT26SourceRecords.controlled}
              /{snapshot.candidateInventory.chineseT26SourceRecords.denominator}（{snapshot.candidateInventory.chineseT26SourceRecords.percentage}%），
              {snapshot.candidateInventory.chineseT26SourceRecords.fullSourceTexts} 份均为完整来源文本，
              {snapshot.candidateInventory.chineseT26SourceRecords.verifiedSameWorkExpressions} 份同本异译或异传表达共享作品实体，
              {snapshot.candidateInventory.chineseT26SourceRecords.attributionBoundaryRecords} 份全部明确标注论师、译者、传统说者、无署名敦煌释文或争议作者责任；
              《法华论》《品类足论》《发智论》的三组双译共享作品，其他同根本经论释和“六足一身”历史文献不自动合并；
              T27 毘昙部《大毘婆沙论》固定来源已完成 {snapshot.candidateInventory.chineseT27SourceRecords.controlled}
              /{snapshot.candidateInventory.chineseT27SourceRecords.denominator}（{snapshot.candidateInventory.chineseT27SourceRecords.percentage}%），
              完整保存 200 卷、{snapshot.candidateInventory.chineseT27SourceRecords.fullSourceTexts} 份来源文本；
              T1545 作为独立广释作品，与 T1543/T1544《发智论》建立根本论—注释关系，
              传统“五百大阿罗汉等造”题记与现代作者判断分层呈现；
              T28 毘昙部固定来源已完成 {snapshot.candidateInventory.chineseT28SourceRecords.controlled}
              /{snapshot.candidateInventory.chineseT28SourceRecords.denominator}（{snapshot.candidateInventory.chineseT28SourceRecords.percentage}%），
              其中 {snapshot.candidateInventory.chineseT28SourceRecords.fullSourceTexts} 份完整作品来源、
              {snapshot.candidateInventory.chineseT28SourceRecords.partialSourceWitnesses} 份部分作品见证，
              映射为 {snapshot.candidateInventory.chineseT28SourceRecords.controlledWorks} 个批次内作品并新增
              {snapshot.candidateInventory.chineseT28SourceRecords.newWorks} 个作品；T1546 保留为《大毘婆沙论》残存旧译见证，
              T1556/T1557 作为《五事论》同本异译，T1551/T1552 与 T1550 保持扩释、增广而不合并；
              T29 毘昙部固定来源已完成 {snapshot.candidateInventory.chineseT29SourceRecords.controlled}
              /{snapshot.candidateInventory.chineseT29SourceRecords.denominator}（{snapshot.candidateInventory.chineseT29SourceRecords.percentage}%），
              其中 {snapshot.candidateInventory.chineseT29SourceRecords.fullSourceTexts} 份完整作品来源、
              {snapshot.candidateInventory.chineseT29SourceRecords.partialSourceWitnesses} 份部分作品见证，
              映射为 {snapshot.candidateInventory.chineseT29SourceRecords.controlledWorks} 个作品；T1558/T1559 按《俱舍论释》同本异译共享作品，
              T1560 保留为独立本颂，T1561 标为安慧注疏的极端节本见证，T1562/T1563 保持广论与略论两个相关作品；
              T30 中观与瑜伽部固定来源已完成 {snapshot.candidateInventory.chineseT30SourceRecords.controlled}
              /{snapshot.candidateInventory.chineseT30SourceRecords.denominator}（{snapshot.candidateInventory.chineseT30SourceRecords.percentage}%），
              其中 {snapshot.candidateInventory.chineseT30SourceRecords.fullSourceTexts} 份完整作品来源、
              {snapshot.candidateInventory.chineseT30SourceRecords.partialSourceWitnesses} 份部分作品见证，
              映射为 {snapshot.candidateInventory.chineseT30SourceRecords.controlledWorks} 个作品；T1582/T1583 作为原十卷文本的两个分离部分见证共享作品，
              T1567、T1570、T1580、T1584 保持部分译本或组成部分边界，T1581 与 T1582/T1583 的异译或汉地改编争议不自动合并；
              T31 瑜伽部固定来源已完成 {snapshot.candidateInventory.chineseT31SourceRecords.controlled}
              /{snapshot.candidateInventory.chineseT31SourceRecords.denominator}（{snapshot.candidateInventory.chineseT31SourceRecords.percentage}%），
              {snapshot.candidateInventory.chineseT31SourceRecords.fullSourceTexts} 份均为完整来源文件，映射为
              {snapshot.candidateInventory.chineseT31SourceRecords.controlledWorks} 个作品；其中
              {snapshot.candidateInventory.chineseT31SourceRecords.verifiedSameWorkExpressions} 份同作品异译或异本表达共享作品实体；
              《唯识三十颂》《唯识二十论》《摄大乘论》《成业论》《观所缘缘论》等异译分组可复算，根本论、释论、合糅注释与《瑜伽师地论》独立流通组成部分保持边界，真谛名下译作、讲录或汉地编成争议公开保留；
              T32 论集部固定来源已完成 {snapshot.candidateInventory.chineseT32SourceRecords.controlled}
              /{snapshot.candidateInventory.chineseT32SourceRecords.denominator}（{snapshot.candidateInventory.chineseT32SourceRecords.percentage}%），
              其中 {snapshot.candidateInventory.chineseT32SourceRecords.fullSourceTexts} 份完整作品来源、
              {snapshot.candidateInventory.chineseT32SourceRecords.partialSourceWitnesses} 份部分作品见证，映射为
              {snapshot.candidateInventory.chineseT32SourceRecords.controlledWorks} 个作品；《因明正理门论》《缘生论》《大乘起信论》《那先比丘经》《亲友书》与《三身赞》的同作品表达共享实体，
              T1677 因第 4 偈末句缺文保留为部分作品见证，论书、经证汇编、赞颂、仪轨、汉地撰成及“佛说”题名按逐份证据分层；
              T33 经疏部固定来源已完成 {snapshot.candidateInventory.chineseT33SourceRecords.controlled}
              /{snapshot.candidateInventory.chineseT33SourceRecords.denominator}（{snapshot.candidateInventory.chineseT33SourceRecords.percentage}%），
              {snapshot.candidateInventory.chineseT33SourceRecords.fullSourceTexts} 份均为完整来源并映射为
              {snapshot.candidateInventory.chineseT33SourceRecords.controlledWorks} 个独立注疏作品；《金刚经》《仁王经》《心经》《法华经》等根本经与直接注疏保持作品边界，
              T1702、T1706、T1713、T1717 四部再注释另立作品并连接所释注疏，撰述、讲说记录、合注与治定责任均公开保留；
              T34 经疏部固定来源已完成 {snapshot.candidateInventory.chineseT34SourceRecords.controlled}
              /{snapshot.candidateInventory.chineseT34SourceRecords.denominator}（{snapshot.candidateInventory.chineseT34SourceRecords.percentage}%），
              {snapshot.candidateInventory.chineseT34SourceRecords.fullSourceTexts} 份完整来源映射为
              {snapshot.candidateInventory.chineseT34SourceRecords.controlledWorks} 个独立作品；《法华文句》与《文句记》、《法华玄赞》与《玄赞义决》、
              《观音玄义》与《玄义记》、《观音义疏》与《义疏记》均按注释—再注释分层，T1726–T1729 只解释《法华经》第二十五品，
              T1730 与来源身份仍有争议的 T0273 保持根本经—论释边界；
              T35 华严经疏部固定来源已完成 {snapshot.candidateInventory.chineseT35SourceRecords.controlled}
              /{snapshot.candidateInventory.chineseT35SourceRecords.denominator}（{snapshot.candidateInventory.chineseT35SourceRecords.percentage}%），
              {snapshot.candidateInventory.chineseT35SourceRecords.fullSourceTexts} 份完整来源映射为
              {snapshot.candidateInventory.chineseT35SourceRecords.controlledWorks} 个独立作品；T1731–T1734 分别以游意、搜玄、探玄与纲目关联六十卷本 T0278，
              T1735 关联八十卷本 T0279，并与下一卷 T1736 保持疏—再注释边界；
              T36 华严经疏部固定来源已完成 {snapshot.candidateInventory.chineseT36SourceRecords.controlled}
              /{snapshot.candidateInventory.chineseT36SourceRecords.denominator}（{snapshot.candidateInventory.chineseT36SourceRecords.percentage}%），
              {snapshot.candidateInventory.chineseT36SourceRecords.fullSourceTexts} 份完整来源映射为
              {snapshot.candidateInventory.chineseT36SourceRecords.controlledWorks} 个独立作品；T1736 明确作为 T1735 的再注释，
              澄观 T1736–T1738 与李通玄 T1739–T1741 均按同作者异作分列，T1742 观门骨目与 T1743 宫廷讲义也保持独立；
              T37 净土与涅槃经疏部固定来源已完成 {snapshot.candidateInventory.chineseT37SourceRecords.controlled}
              /{snapshot.candidateInventory.chineseT37SourceRecords.denominator}（{snapshot.candidateInventory.chineseT37SourceRecords.percentage}%），
              {snapshot.candidateInventory.chineseT37SourceRecords.fullSourceTexts} 份完整来源映射为
              {snapshot.candidateInventory.chineseT37SourceRecords.controlledWorks} 个独立作品；T0353、T0360、T0365、T0366、T0374 与 T0375 根经分别连接所释经疏，
              T1750 与 T1751 保持直接注疏—再注释层级，T1745/T1746 和 T1757/T1758 保持同题或同作者异作边界；
              T38 涅槃、药师、弥勒与维摩经疏部固定来源已完成 {snapshot.candidateInventory.chineseT38SourceRecords.controlled}
              /{snapshot.candidateInventory.chineseT38SourceRecords.denominator}（{snapshot.candidateInventory.chineseT38SourceRecords.percentage}%），
              {snapshot.candidateInventory.chineseT38SourceRecords.fullSourceTexts} 份完整来源映射为
              {snapshot.candidateInventory.chineseT38SourceRecords.controlledWorks} 个独立作品；T0375、T0450、T0452/T0454/T0456、T0475/T0476 根经连接对应经疏，
              T1765/T1766 与 T1778/T1779 保持注释—再注释层级，T1774 明确连接三部弥勒根经，T1777/T1778 与 T1780/T1781 保持相关但不同作品边界；
              T39 金光明、楞伽及显密经疏部固定来源已完成 {snapshot.candidateInventory.chineseT39SourceRecords.controlled}
              /{snapshot.candidateInventory.chineseT39SourceRecords.denominator}（{snapshot.candidateInventory.chineseT39SourceRecords.percentage}%），
              {snapshot.candidateInventory.chineseT39SourceRecords.fullSourceTexts} 份完整来源映射为
              {snapshot.candidateInventory.chineseT39SourceRecords.controlledWorks} 个独立作品；14 组根经—注疏、3 组直接注释—再注释与 4 组相关异作边界均已记录，
              T1796 的全经疏和 T1797 仅释第七卷供养次第法的范围差异、T1799 所连《首楞严经》的成书争议均不被抹平；
              T40 四分律、菩萨戒及经论疏部固定来源已完成 {snapshot.candidateInventory.chineseT40SourceRecords.controlled}
              /{snapshot.candidateInventory.chineseT40SourceRecords.denominator}（{snapshot.candidateInventory.chineseT40SourceRecords.percentage}%），
              {snapshot.candidateInventory.chineseT40SourceRecords.fullSourceTexts} 份完整来源映射为
              {snapshot.candidateInventory.chineseT40SourceRecords.controlledWorks} 个独立作品；4 组根本律或戒本—律疏、5 组论本—论疏、1 组行事钞—再注释与 3 组适用范围边界均已记录，
              T1808–T1810 的通用、僧众、尼众羯磨范围和 T1820 的节要、补注复合责任保持可审计；
              不把部派、共同译者、目录位置、传统作者或机器相似度冒充同一作品或佛陀逐字亲说
            </p>
            <small>{snapshot.candidateInventory.chineseSutraRecordSubset.caveat}</small>
            <a
              className="text-link"
              href="https://github.com/weitzu-com/foxue.ai/blob/main/data/gbcr/cbeta-taisho-sutra-inventory-v0.2.1.json"
              target="_blank"
              rel="noreferrer"
            >
              查看 T01–T17 的 881 条逐文件清单 <ExternalLink aria-hidden="true" size={13} />
            </a>
            <a
              className="text-link"
              href="https://github.com/weitzu-com/foxue.ai/blob/main/data/gbcr/cbeta-taisho-t18-inventory-v0.1.0.json"
              target="_blank"
              rel="noreferrer"
            >
              查看 T18 的 76 条逐文件清单 <ExternalLink aria-hidden="true" size={13} />
            </a>
            <a
              className="text-link"
              href="https://github.com/weitzu-com/foxue.ai/blob/main/data/gbcr/cbeta-taisho-t19-inventory-v0.1.0.json"
              target="_blank"
              rel="noreferrer"
            >
              查看 T19 的 126 条逐文件清单 <ExternalLink aria-hidden="true" size={13} />
            </a>
            <a
              className="text-link"
              href="https://github.com/weitzu-com/foxue.ai/blob/main/data/gbcr/cbeta-taisho-t20-inventory-v0.1.0.json"
              target="_blank"
              rel="noreferrer"
            >
              查看 T20 的 184 条逐文件清单 <ExternalLink aria-hidden="true" size={13} />
            </a>
            <a
              className="text-link"
              href="https://github.com/weitzu-com/foxue.ai/blob/main/data/gbcr/cbeta-taisho-t21-inventory-v0.1.0.json"
              target="_blank"
              rel="noreferrer"
            >
              查看 T21 的 228 条逐文件清单 <ExternalLink aria-hidden="true" size={13} />
            </a>
            <a
              className="text-link"
              href="https://github.com/weitzu-com/foxue.ai/blob/main/data/gbcr/cbeta-taisho-t22-inventory-v0.1.0.json"
              target="_blank"
              rel="noreferrer"
            >
              查看 T22 的 15 条逐文件清单 <ExternalLink aria-hidden="true" size={13} />
            </a>
            <a
              className="text-link"
              href="https://github.com/weitzu-com/foxue.ai/blob/main/data/gbcr/cbeta-taisho-t23-inventory-v0.1.0.json"
              target="_blank"
              rel="noreferrer"
            >
              查看 T23 的 13 条逐文件清单 <ExternalLink aria-hidden="true" size={13} />
            </a>
            <a
              className="text-link"
              href="https://github.com/weitzu-com/foxue.ai/blob/main/data/gbcr/cbeta-taisho-t24-inventory-v0.1.0.json"
              target="_blank"
              rel="noreferrer"
            >
              查看 T24 的 59 条逐文件清单 <ExternalLink aria-hidden="true" size={13} />
            </a>
            <a
              className="text-link"
              href="https://github.com/weitzu-com/foxue.ai/blob/main/data/gbcr/cbeta-taisho-t25-inventory-v0.1.0.json"
              target="_blank"
              rel="noreferrer"
            >
              查看 T25 的 15 条逐文件清单 <ExternalLink aria-hidden="true" size={13} />
            </a>
            <a
              className="text-link"
              href="https://github.com/weitzu-com/foxue.ai/blob/main/data/gbcr/cbeta-taisho-t26-inventory-v0.1.0.json"
              target="_blank"
              rel="noreferrer"
            >
              查看 T26 的 26 条逐文件清单 <ExternalLink aria-hidden="true" size={13} />
            </a>
            <a
              className="text-link"
              href="https://github.com/weitzu-com/foxue.ai/blob/main/data/gbcr/cbeta-taisho-t27-inventory-v0.1.0.json"
              target="_blank"
              rel="noreferrer"
            >
              查看 T27《大毘婆沙论》的逐文件清单 <ExternalLink aria-hidden="true" size={13} />
            </a>
            <a
              className="text-link"
              href="https://github.com/weitzu-com/foxue.ai/blob/main/data/gbcr/cbeta-taisho-t28-inventory-v0.1.0.json"
              target="_blank"
              rel="noreferrer"
            >
              查看 T28 的 12 条逐文件清单 <ExternalLink aria-hidden="true" size={13} />
            </a>
            <a
              className="text-link"
              href="https://github.com/weitzu-com/foxue.ai/blob/main/data/gbcr/cbeta-taisho-t29-inventory-v0.1.0.json"
              target="_blank"
              rel="noreferrer"
            >
              查看 T29 的 6 条逐文件清单 <ExternalLink aria-hidden="true" size={13} />
            </a>
            <a
              className="text-link"
              href="https://github.com/weitzu-com/foxue.ai/blob/main/data/gbcr/cbeta-taisho-t30-inventory-v0.1.0.json"
              target="_blank"
              rel="noreferrer"
            >
              查看 T30 的 21 条逐文件清单 <ExternalLink aria-hidden="true" size={13} />
            </a>
            <a
              className="text-link"
              href="https://github.com/weitzu-com/foxue.ai/blob/main/data/gbcr/cbeta-taisho-t31-inventory-v0.1.0.json"
              target="_blank"
              rel="noreferrer"
            >
              查看 T31 的 43 条逐文件清单 <ExternalLink aria-hidden="true" size={13} />
            </a>
            <a
              className="text-link"
              href="https://github.com/weitzu-com/foxue.ai/blob/main/data/gbcr/cbeta-taisho-t32-inventory-v0.1.0.json"
              target="_blank"
              rel="noreferrer"
            >
              查看 T32 的 66 条逐文件清单 <ExternalLink aria-hidden="true" size={13} />
            </a>
            <a
              className="text-link"
              href="https://github.com/weitzu-com/foxue.ai/blob/main/data/gbcr/cbeta-taisho-t33-inventory-v0.1.0.json"
              target="_blank"
              rel="noreferrer"
            >
              查看 T33 的 25 条逐文件清单 <ExternalLink aria-hidden="true" size={13} />
            </a>
            <a
              className="text-link"
              href="https://github.com/weitzu-com/foxue.ai/blob/main/data/gbcr/cbeta-taisho-t34-inventory-v0.1.0.json"
              target="_blank"
              rel="noreferrer"
            >
              查看 T34 的 13 条逐文件清单 <ExternalLink aria-hidden="true" size={13} />
            </a>
            <a
              className="text-link"
              href="https://github.com/weitzu-com/foxue.ai/blob/main/data/gbcr/cbeta-taisho-t35-inventory-v0.1.0.json"
              target="_blank"
              rel="noreferrer"
            >
              查看 T35 的 5 条逐文件清单 <ExternalLink aria-hidden="true" size={13} />
            </a>
            <a
              className="text-link"
              href="https://github.com/weitzu-com/foxue.ai/blob/main/data/gbcr/cbeta-taisho-t36-inventory-v0.1.0.json"
              target="_blank"
              rel="noreferrer"
            >
              查看 T36 的 8 条逐文件清单 <ExternalLink aria-hidden="true" size={13} />
            </a>
            <a
              className="text-link"
              href="https://github.com/weitzu-com/foxue.ai/blob/main/data/gbcr/cbeta-taisho-t37-inventory-v0.1.0.json"
              target="_blank"
              rel="noreferrer"
            >
              查看 T37 的 21 条逐文件清单 <ExternalLink aria-hidden="true" size={13} />
            </a>
            <a
              className="text-link"
              href="https://github.com/weitzu-com/foxue.ai/blob/main/data/gbcr/cbeta-taisho-t38-inventory-v0.1.0.json"
              target="_blank"
              rel="noreferrer"
            >
              查看 T38 的 18 条逐文件清单 <ExternalLink aria-hidden="true" size={13} />
            </a>
            <a
              className="text-link"
              href="https://github.com/weitzu-com/foxue.ai/blob/main/data/gbcr/cbeta-taisho-t39-inventory-v0.1.0.json"
              target="_blank"
              rel="noreferrer"
            >
              查看 T39 的 21 条逐文件清单 <ExternalLink aria-hidden="true" size={13} />
            </a>
            <a
              className="text-link"
              href="https://github.com/weitzu-com/foxue.ai/blob/main/data/gbcr/cbeta-taisho-t40-inventory-v0.1.0.json"
              target="_blank"
              rel="noreferrer"
            >
              查看 T40 的 17 条逐文件清单 <ExternalLink aria-hidden="true" size={13} />
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
              律藏已完成 {snapshot.candidateInventory.suttacentralPaliVinayaRoot.controlled}
              /{snapshot.candidateInventory.suttacentralPaliVinayaRoot.denominator} 条（{snapshot.candidateInventory.suttacentralPaliVinayaRoot.percentage}%）逐文件受控；
              论藏已完成 {snapshot.candidateInventory.suttacentralPaliAbhidhammaRoot.controlled}
              /{snapshot.candidateInventory.suttacentralPaliAbhidhammaRoot.denominator} 条（{snapshot.candidateInventory.suttacentralPaliAbhidhammaRoot.percentage}%）逐文件受控
            </p>
            <small>{snapshot.candidateInventory.suttacentralPaliRootPilot.caveat}</small>
            <Link className="text-link" href="/jingzang/khuddaka-nikaya-snp">
              阅读巴利《小部·经集》 <ArrowRight aria-hidden="true" size={13} />
            </Link>
          </article>
          <article>
            <span>巴利论藏七论受控原文</span>
            <strong>
              {snapshot.candidateInventory.suttacentralPaliAbhidhammaRoot.controlledExpressions}
              <small> 个表达 / {snapshot.candidateInventory.suttacentralPaliAbhidhammaRoot.controlled} 份 root</small>
            </strong>
            <p>
              固定提交的巴利论藏目录已 100% 逐文件受控，按七论书级边界登记，
              共 {snapshot.candidateInventory.suttacentralPaliAbhidhammaRoot.stableSegments?.toLocaleString("zh-CN")} 个可读稳定段落；
              固定来源未发现空正文值，且未导入第三方译文或授予模型训练权。
            </p>
            <small>{snapshot.candidateInventory.suttacentralPaliAbhidhammaRoot.caveat}</small>
            <Link className="text-link" href="/jingzang/pali-dhammasangani">
              阅读上座部《法集论》 <ArrowRight aria-hidden="true" size={13} />
            </Link>
          </article>
          <article>
            <span>巴利律藏受控原文</span>
            <strong>
              {snapshot.candidateInventory.suttacentralPaliVinayaRoot.controlledExpressions}
              <small> 个表达 / {snapshot.candidateInventory.suttacentralPaliVinayaRoot.controlled} 份 root</small>
            </strong>
            <p>
              固定提交的巴利律藏目录已 100% 逐文件受控，按六个书级集合登记，
              共 {snapshot.candidateInventory.suttacentralPaliVinayaRoot.stableSegments?.toLocaleString("zh-CN")} 个可读稳定段落；
              {snapshot.candidateInventory.suttacentralPaliVinayaRoot.omittedEmptySegments} 个上游空值保留在来源与审计账本中，不伪装成正文。
            </p>
            <small>{snapshot.candidateInventory.suttacentralPaliVinayaRoot.caveat}</small>
            <Link className="text-link" href="/jingzang/pali-vinaya-khandhaka">
              阅读上座部律藏犍度 <ArrowRight aria-hidden="true" size={13} />
            </Link>
          </article>
          <article>
            <span>藏文固定版本目录</span>
            <strong>
              {snapshot.candidateInventory.dergeKangyurEdition.candidateExpressions}
              <small> / {snapshot.candidateInventory.dergeKangyurEdition.catalogRecords}</small>
            </strong>
            <p>
              条顶层目录项中，{snapshot.candidateInventory.dergeKangyurEdition.candidateExpressions} 条可定位到
              {snapshot.candidateInventory.dergeKangyurEdition.volumeManifests} 卷德格甘珠尔初印本；
              {snapshot.candidateInventory.dergeKangyurEdition.excludedCatalogOnlyRecords} 条无法定位的目录补充项另列，
              {snapshot.candidateInventory.dergeKangyurEdition.nestedTextParts} 条嵌套子文本、
              {snapshot.candidateInventory.dergeKangyurEdition.dergeIdentifiers} 个德格编号和
              {snapshot.candidateInventory.dergeKangyurEdition.linkedAbstractWorkIds} 个 BDRC 链接抽象作品分别计数
            </p>
            <small>{snapshot.candidateInventory.dergeKangyurEdition.caveat}</small>
            <a
              className="text-link"
              href="https://github.com/weitzu-com/foxue.ai/blob/main/data/gbcr/bdrc-derge-kangyur-inventory-v0.3.0.json"
              target="_blank"
              rel="noreferrer"
            >
              查看 1,114 条机器清单与 8 条排除证据 <ExternalLink aria-hidden="true" size={13} />
            </a>
          </article>
          <article>
            <span>梵文候选来源</span>
            <strong>
              {snapshot.candidateInventory.sanskritCatalogs.dsbcCatalogRecords}
              <small> + {snapshot.candidateInventory.sanskritCatalogs.gretilPhysicalFiles}</small>
            </strong>
            <p>
              DSBC 固定目录含 {snapshot.candidateInventory.sanskritCatalogs.dsbcCatalogRecords} 条记录：
              经藏类 {snapshot.candidateInventory.sanskritCatalogs.dsbcSutrapitakaRecords}、
              律藏类 {snapshot.candidateInventory.sanskritCatalogs.dsbcVinayapitakaRecords}、
              论疏及其他 {snapshot.candidateInventory.sanskritCatalogs.dsbcSastrapitakaRecords}；
              GRETIL 固定提交另有 {snapshot.candidateInventory.sanskritCatalogs.gretilPhysicalFiles} 个物理文件，
              合计 {(snapshot.candidateInventory.sanskritCatalogs.gretilBytes! / 1_000_000).toFixed(1)} MB
            </p>
            <small>{snapshot.candidateInventory.sanskritCatalogs.caveat}</small>
            <a
              className="text-link"
              href="https://github.com/weitzu-com/foxue.ai/blob/main/data/gbcr/dsbc-gretil-source-snapshot-v0.4.0.json"
              target="_blank"
              rel="noreferrer"
            >
              查看汇总证据与权利边界 <ExternalLink aria-hidden="true" size={13} />
            </a>
          </article>
          <article>
            <span>梵文逐文件权利审计</span>
            <strong>
              {snapshot.candidateInventory.sanskritCatalogs.gretilRightsAuditedFiles}
              <small> / {snapshot.candidateInventory.sanskritCatalogs.gretilPhysicalFiles}</small>
            </strong>
            <p>
              GRETIL 固定提交的 {snapshot.candidateInventory.sanskritCatalogs.gretilPhysicalFiles} 份梵文佛教文件已逐一核对：
              {snapshot.candidateInventory.sanskritCatalogs.gretilFilesMarkedReferenceOnly} 份均标为仅供参考并回指来源条款；
              {snapshot.candidateInventory.sanskritCatalogs.gretilFilesWithDsbcPermissionStatement} 份带 DSBC 对 GRETIL 的展示许可说明，
              {snapshot.candidateInventory.sanskritCatalogs.gretilFilesWithExplicitCopyrightNotice} 份含明示版权，
              检测到开放许可 {snapshot.candidateInventory.sanskritCatalogs.gretilFilesWithExplicitOpenLicense} 份，
              获准由 foxue.ai 镜像正文 {snapshot.candidateInventory.sanskritCatalogs.gretilFilesApprovedForRepublication} 份
            </p>
            <small>完成审计不等于取得许可；417 份当前全部只发布题名、路径、Git 指纹、哈希和固定外链，不复制正文。</small>
            <a
              className="text-link"
              href="https://github.com/weitzu-com/foxue.ai/blob/main/data/gbcr/gretil-sanskrit-file-rights-audit-v0.7.0.json"
              target="_blank"
              rel="noreferrer"
            >
              查看 417 份逐文件权利账本 <ExternalLink aria-hidden="true" size={13} />
            </a>
          </article>
          <article>
            <span>梵文与俗语受控原文</span>
            <strong>
              {snapshot.candidateInventory.suttacentralIndicRoots.controlledExpressions}
              <small> 个表达 / {snapshot.candidateInventory.suttacentralIndicRoots.controlledRootRecords} 份 root</small>
            </strong>
            <p>
              SuttaCentral 固定提交中的 {snapshot.candidateInventory.suttacentralIndicRoots.sanskritRootFiles} 份梵文与
              {snapshot.candidateInventory.suttacentralIndicRoots.prakritRootFiles} 份俗语文件，按 SF 36、SF 276 与
              巴特那《法句经》合并为 {snapshot.candidateInventory.suttacentralIndicRoots.controlledExpressions} 个可读表达，
              共 {snapshot.candidateInventory.suttacentralIndicRoots.stableSegments?.toLocaleString("zh-CN")} 个稳定段落。
            </p>
            <small>{snapshot.candidateInventory.suttacentralIndicRoots.caveat}</small>
            <a
              className="text-link"
              href="https://github.com/weitzu-com/foxue.ai/blob/main/data/gbcr/suttacentral-indic-root-rights-audit-v0.8.0.json"
              target="_blank"
              rel="noreferrer"
            >
              查看 24 份原文权利账本 <ExternalLink aria-hidden="true" size={13} />
            </a>
          </article>
          <article>
            <span>藏文多版本目录</span>
            <strong>
              {snapshot.candidateInventory.multiEditionTibetanCatalogs.itemRecords?.toLocaleString("zh-CN")}
              <small> / {snapshot.candidateInventory.multiEditionTibetanCatalogs.availableCatalogs} 个可用目录</small>
            </strong>
            <p>
              rKTs 固定迁移清单配置了 {snapshot.candidateInventory.multiEditionTibetanCatalogs.configuredCatalogs} 个
              甘珠尔版本、合集或残片目录；其中 {snapshot.candidateInventory.multiEditionTibetanCatalogs.availableCatalogs} 个
              XML 通过 Git blob 校验，合计 {(snapshot.candidateInventory.multiEditionTibetanCatalogs.sourceBytes! / 1_000_000).toFixed(2)} MB。
              {snapshot.candidateInventory.multiEditionTibetanCatalogs.missingConfiguredCatalogs} 个缺失配置单列，不猜测补齐
            </p>
            <small>{snapshot.candidateInventory.multiEditionTibetanCatalogs.caveat}</small>
            <a
              className="text-link"
              href="https://github.com/weitzu-com/foxue.ai/blob/main/data/gbcr/rkts-kangyur-catalog-snapshot-v0.5.0.json"
              target="_blank"
              rel="noreferrer"
            >
              查看 20 个版本配置、19 个固定 blob 与 CC0 证据 <ExternalLink aria-hidden="true" size={13} />
            </a>
          </article>
          <article>
            <span>跨目录标识对齐</span>
            <strong>
              {snapshot.candidateInventory.crossCatalogAlignment.matchedDergeExpressions}
              <small> / {snapshot.candidateInventory.crossCatalogAlignment.uniqueTohBaseIdentifiers}</small>
            </strong>
            <p>
              {snapshot.candidateInventory.crossCatalogAlignment.curatedRelationGroups} 个已有证据关系组涉及
              {snapshot.candidateInventory.crossCatalogAlignment.gbcrWorksReferenced} 个站内作品、
              {snapshot.candidateInventory.crossCatalogAlignment.cbetaCitationIdentifiers} 个汉译引用和
              {snapshot.candidateInventory.crossCatalogAlignment.tohCitationIdentifiers} 个 Toh 引用；
              基础编号连接到 {snapshot.candidateInventory.crossCatalogAlignment.matchedDergeExpressions} 个固定德格表达式。
              其中 {snapshot.candidateInventory.crossCatalogAlignment.relationGroupsRequiringManualReview} 组仍待人工复核
            </p>
            <small>{snapshot.candidateInventory.crossCatalogAlignment.caveat}</small>
            <a
              className="text-link"
              href="https://github.com/weitzu-com/foxue.ai/blob/main/data/gbcr/cross-catalog-alignments-v0.5.0.json"
              target="_blank"
              rel="noreferrer"
            >
              查看 29 组可审计连接与裁决边界 <ExternalLink aria-hidden="true" size={13} />
            </a>
          </article>
          <article>
            <span>SuttaCentral 汉—巴平行证据</span>
            <strong>
              {snapshot.candidateInventory.suttacentralChineseParallelEvidence.deduplicatedParallelEdges.toLocaleString("zh-CN")}
              <small> 条去重证据边</small>
            </strong>
            <p>
              固定关系表共 {snapshot.candidateInventory.suttacentralChineseParallelEvidence.upstreamRows.toLocaleString("zh-CN")} 行；
              其中 {snapshot.candidateInventory.suttacentralChineseParallelEvidence.relevantDirectedRows.toLocaleString("zh-CN")} 条有向记录
              可连接站内 {snapshot.candidateInventory.suttacentralChineseParallelEvidence.paliWorksReferenced} 个巴利作品与
              {snapshot.candidateInventory.suttacentralChineseParallelEvidence.chineseWorksReferenced} 个汉译作品。
              去重后只有 {snapshot.candidateInventory.suttacentralChineseParallelEvidence.decisionClasses.full_parallel_without_automatic_work_merge} 条列作整经级平行，
              其余分别保留为合集组件、近似/部分平行或引用/提及
            </p>
            <small>{snapshot.candidateInventory.suttacentralChineseParallelEvidence.caveat}</small>
            <a
              className="text-link"
              href="https://github.com/weitzu-com/foxue.ai/blob/main/data/gbcr/suttacentral-chinese-parallels-v0.7.0.json"
              target="_blank"
              rel="noreferrer"
            >
              查看 5,161 条固定证据与裁决边界 <ExternalLink aria-hidden="true" size={13} />
            </a>
          </article>
          <article>
            <span>汉—巴作品裁决队列</span>
            <strong>
              {snapshot.candidateInventory.suttacentralParallelReviewQueue.adjudicatedItems}
              <small> / {snapshot.candidateInventory.suttacentralParallelReviewQueue.queueItems} 已裁决</small>
            </strong>
            <p>
              {snapshot.candidateInventory.suttacentralParallelReviewQueue.p0ScopeCaveatOrCounterevidence} 项含明确范围备注或反证，
              {snapshot.candidateInventory.suttacentralParallelReviewQueue.p1UpstreamFullStandalonePairs} 项为上游整经级候选。
              每项至少需要 {snapshot.candidateInventory.suttacentralParallelReviewQueue.minimumIndependentReviews} 名独立复核者；
              当前自动归并 {snapshot.candidateInventory.suttacentralParallelReviewQueue.automaticMerges} 项
            </p>
            <small>{snapshot.candidateInventory.suttacentralParallelReviewQueue.caveat}</small>
            <Link className="text-link" href="/shenjiao">
              进入 80 项只读审校工作台 <ArrowRight aria-hidden="true" size={13} />
            </Link>
          </article>
          <article>
            <span>rKTs 核心编号候选连接</span>
            <strong>
              {snapshot.candidateInventory.rktsKernelAlignment.exactKernelIds.toLocaleString("zh-CN")}
              <small> / {snapshot.candidateInventory.rktsKernelAlignment.kernelUniqueIds.toLocaleString("zh-CN")}</small>
            </strong>
            <p>
              固定 kernel 有 {snapshot.candidateInventory.rktsKernelAlignment.kernelItemRecords.toLocaleString("zh-CN")} 条记录、
              {snapshot.candidateInventory.rktsKernelAlignment.kernelUniqueIds.toLocaleString("zh-CN")} 个唯一编号；
              {snapshot.candidateInventory.rktsKernelAlignment.exactKernelIds.toLocaleString("zh-CN")} 个编号与目录精确连接，
              其中 {snapshot.candidateInventory.rktsKernelAlignment.exactKernelIdsInTwoOrMoreCatalogs.toLocaleString("zh-CN")} 个
              见于至少两个目录。编号 835 在 kernel 重复九次，835-1 至 835-8 继续保持未决
            </p>
            <small>{snapshot.candidateInventory.rktsKernelAlignment.caveat}</small>
            <a
              className="text-link"
              href="https://github.com/weitzu-com/foxue.ai/blob/main/data/gbcr/rkts-kernel-alignment-audit-v0.6.0.json"
              target="_blank"
              rel="noreferrer"
            >
              查看 1,143 个候选连接与 8 个反例 <ExternalLink aria-hidden="true" size={13} />
            </a>
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
          <h2>下一步：接入巴利论藏，并复核跨语种作品关系。</h2>
          <p>固定提交中的巴利经藏与律藏目录已逐条受控。下一阶段审计 1,102 份巴利论藏 root，同时在学术复核后逐步建立平行经与传本关系；未经复核的自动对齐不会进入永久登记册。</p>
        </div>
        <Link className="button-primary" href="/touming">
          查看完整透明度报告 <ArrowRight aria-hidden="true" size={16} />
        </Link>
      </section>
    </main>
  );
}

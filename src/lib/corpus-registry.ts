import registryDocument from "../../data/gbcr/registry-v2.5.0.json";
import sourceSnapshotsDocument from "../../data/gbcr/source-snapshots-v0.3.0.json";

type Expression = {
  id: string;
  cataloged: boolean;
  fullSourceText: boolean;
  sampled: boolean;
  stableSegments: number;
  rightsReviewed: boolean;
  qualityStatus: string;
};

type RegistryDocument = Omit<typeof registryDocument, "works"> & {
  works: Array<{ id: string; expressions: Expression[] }>;
};

export const corpusRegistry = registryDocument as unknown as RegistryDocument;
export const sourceSnapshotInventory = sourceSnapshotsDocument;

export function buildCoverageSnapshot() {
  const expressions = corpusRegistry.works.flatMap((work) => work.expressions);
  const verifiedExpressions = expressions.filter(
    (item) => item.qualityStatus === "verified_sample",
  );
  const structureVerifiedExpressions = expressions.filter(
    (item) => item.qualityStatus === "verified_sample" ||
      item.qualityStatus === "verified_structure_and_anchors",
  );
  const chineseFamily = corpusRegistry.sourceFamilies.find(
    (family) => family.id === "cbeta_chinese",
  );
  const chineseCandidateRecords = "candidateExpressionRecords" in (chineseFamily ?? {})
    ? chineseFamily?.candidateExpressionRecords ?? null
    : null;
  const chineseControlledRecords = "controlledExpressionRecords" in (chineseFamily ?? {})
    ? chineseFamily?.controlledExpressionRecords ?? null
    : null;
  const chineseCandidateBytes = "candidateExpressionBytes" in (chineseFamily ?? {})
    ? chineseFamily?.candidateExpressionBytes ?? null
    : null;
  const chineseControlledBytes = "controlledExpressionBytes" in (chineseFamily ?? {})
    ? chineseFamily?.controlledExpressionBytes ?? null
    : null;
  const chineseAgamaDenominator = "agamaSourceRecordDenominator" in (chineseFamily ?? {})
    ? chineseFamily?.agamaSourceRecordDenominator ?? null
    : null;
  const chineseAgamaControlled = "agamaControlledSourceRecords" in (chineseFamily ?? {})
    ? chineseFamily?.agamaControlledSourceRecords ?? null
    : null;
  const chineseBenyuanDenominator = "benyuanSourceRecordDenominator" in (chineseFamily ?? {})
    ? chineseFamily?.benyuanSourceRecordDenominator ?? null
    : null;
  const chineseBenyuanControlled = "benyuanControlledSourceRecords" in (chineseFamily ?? {})
    ? chineseFamily?.benyuanControlledSourceRecords ?? null
    : null;
  const chinesePrajnaparamitaDenominator = "prajnaparamitaSourceRecordDenominator" in (chineseFamily ?? {})
    ? chineseFamily?.prajnaparamitaSourceRecordDenominator ?? null
    : null;
  const chinesePrajnaparamitaControlled = "prajnaparamitaControlledSourceRecords" in (chineseFamily ?? {})
    ? chineseFamily?.prajnaparamitaControlledSourceRecords ?? null
    : null;
  const chineseLotusDenominator = "lotusSourceRecordDenominator" in (chineseFamily ?? {})
    ? chineseFamily?.lotusSourceRecordDenominator ?? null
    : null;
  const chineseLotusControlled = "lotusControlledSourceRecords" in (chineseFamily ?? {})
    ? chineseFamily?.lotusControlledSourceRecords ?? null
    : null;
  const chineseAvatamsakaDenominator = "avatamsakaSourceRecordDenominator" in (chineseFamily ?? {})
    ? chineseFamily?.avatamsakaSourceRecordDenominator ?? null
    : null;
  const chineseAvatamsakaControlled = "avatamsakaControlledSourceRecords" in (chineseFamily ?? {})
    ? chineseFamily?.avatamsakaControlledSourceRecords ?? null
    : null;
  const chineseRatnakutaDenominator = "ratnakutaSourceRecordDenominator" in (chineseFamily ?? {})
    ? chineseFamily?.ratnakutaSourceRecordDenominator ?? null
    : null;
  const chineseRatnakutaControlled = "ratnakutaControlledSourceRecords" in (chineseFamily ?? {})
    ? chineseFamily?.ratnakutaControlledSourceRecords ?? null
    : null;
  const chineseT12Denominator = "t12SourceRecordDenominator" in (chineseFamily ?? {})
    ? chineseFamily?.t12SourceRecordDenominator ?? null
    : null;
  const chineseT12Controlled = "t12ControlledSourceRecords" in (chineseFamily ?? {})
    ? chineseFamily?.t12ControlledSourceRecords ?? null
    : null;
  const chineseT13Denominator = "t13SourceRecordDenominator" in (chineseFamily ?? {})
    ? chineseFamily?.t13SourceRecordDenominator ?? null
    : null;
  const chineseT13Controlled = "t13ControlledSourceRecords" in (chineseFamily ?? {})
    ? chineseFamily?.t13ControlledSourceRecords ?? null
    : null;
  const chineseT14Denominator = "t14SourceRecordDenominator" in (chineseFamily ?? {})
    ? chineseFamily?.t14SourceRecordDenominator ?? null
    : null;
  const chineseT14Controlled = "t14ControlledSourceRecords" in (chineseFamily ?? {})
    ? chineseFamily?.t14ControlledSourceRecords ?? null
    : null;
  const chineseT15Denominator = "t15SourceRecordDenominator" in (chineseFamily ?? {})
    ? chineseFamily?.t15SourceRecordDenominator ?? null
    : null;
  const chineseT15Controlled = "t15ControlledSourceRecords" in (chineseFamily ?? {})
    ? chineseFamily?.t15ControlledSourceRecords ?? null
    : null;
  const chineseT16Denominator = "t16SourceRecordDenominator" in (chineseFamily ?? {})
    ? chineseFamily?.t16SourceRecordDenominator ?? null
    : null;
  const chineseT16Controlled = "t16ControlledSourceRecords" in (chineseFamily ?? {})
    ? chineseFamily?.t16ControlledSourceRecords ?? null
    : null;
  const chineseT17Denominator = "t17SourceRecordDenominator" in (chineseFamily ?? {})
    ? chineseFamily?.t17SourceRecordDenominator ?? null
    : null;
  const chineseT17Controlled = "t17ControlledSourceRecords" in (chineseFamily ?? {})
    ? chineseFamily?.t17ControlledSourceRecords ?? null
    : null;
  const cbetaSourceInventory = sourceSnapshotInventory.sources.find(
    (source) => source.id === "cbeta_xml_p5",
  );
  const chineseSubsetInventory = cbetaSourceInventory && "candidateSubsets" in cbetaSourceInventory
    ? cbetaSourceInventory.candidateSubsets?.find(
        (subset) => subset.id === "taisho_chinese_sutra_t01_t17",
      ) ?? null
    : null;
  const suttacentralFamily = corpusRegistry.sourceFamilies.find(
    (family) => family.id === "suttacentral_early_buddhist_texts",
  );
  const suttacentralSourceInventory = sourceSnapshotInventory.sources.find(
    (source) => source.id === "suttacentral_bilara",
  );
  const paliCandidateRecords = suttacentralSourceInventory?.groups?.pli ?? null;
  const paliControlledRecords = "controlledRootRecords" in (suttacentralFamily ?? {})
    ? suttacentralFamily?.controlledRootRecords ?? null
    : null;
  const paliControlledBytes = "controlledRootBytes" in (suttacentralFamily ?? {})
    ? suttacentralFamily?.controlledRootBytes ?? null
    : null;
  const paliControlledWorks = "controlledWorks" in (suttacentralFamily ?? {})
    ? suttacentralFamily?.controlledWorks ?? null
    : null;
  const paliSuttaRootDenominator = "suttaRootRecordDenominator" in (suttacentralFamily ?? {})
    ? suttacentralFamily?.suttaRootRecordDenominator ?? null
    : null;
  const paliControlledSuttaRootRecords = "controlledSuttaRootRecords" in (suttacentralFamily ?? {})
    ? suttacentralFamily?.controlledSuttaRootRecords ?? null
    : null;
  const tibetanFamily = corpusRegistry.sourceFamilies.find(
    (family) => family.id === "tibetan_kangyur_tengyur",
  );
  const dergeSourceInventory = sourceSnapshotInventory.sources.find(
    (source) => source.id === "bdrc_derge_kangyur",
  );
  const dergeCatalogRecords = "candidateTopLevelCatalogRecords" in (tibetanFamily ?? {})
    ? tibetanFamily?.candidateTopLevelCatalogRecords ?? null
    : null;
  const dergeExpressionRecords = "candidateExpressionRecords" in (tibetanFamily ?? {})
    ? tibetanFamily?.candidateExpressionRecords ?? null
    : null;
  const dergeExcludedRecords = "excludedCatalogOnlyRecords" in (tibetanFamily ?? {})
    ? tibetanFamily?.excludedCatalogOnlyRecords ?? null
    : null;
  const dergeNestedTextParts = "nestedTextPartRecords" in (tibetanFamily ?? {})
    ? tibetanFamily?.nestedTextPartRecords ?? null
    : null;
  const dergeIdentifiers = "dergeIdentifierRecords" in (tibetanFamily ?? {})
    ? tibetanFamily?.dergeIdentifierRecords ?? null
    : null;
  const dergeLinkedWorks = "candidateLinkedAbstractWorkIds" in (tibetanFamily ?? {})
    ? tibetanFamily?.candidateLinkedAbstractWorkIds ?? null
    : null;
  const dergeVolumes = "volumeManifests" in (tibetanFamily ?? {})
    ? tibetanFamily?.volumeManifests ?? null
    : null;

  return {
    schema: "https://foxue.ai/schemas/gbcr/coverage-snapshot-v0.1",
    generatedFrom: {
      registryVersion: corpusRegistry.registry.version,
      publishedAt: corpusRegistry.registry.publishedAt,
    },
    claim: {
      target: corpusRegistry.claimPolicy.target,
      publishable: corpusRegistry.claimPolicy.publishable,
      reason: corpusRegistry.claimPolicy.reason,
    },
    globalDenominators: corpusRegistry.globalDenominators,
    localHoldings: {
      registeredWorks: corpusRegistry.works.length,
      registeredExpressions: expressions.length,
      catalogedWorks: countDistinctWorks((item) => item.cataloged),
      fullSourceTextWorks: countDistinctWorks((item) => item.fullSourceText),
      fullSourceTextExpressions: expressions.filter((item) => item.fullSourceText).length,
      sampledWorks: countDistinctWorks((item) => item.sampled),
      stableSegments: expressions.reduce((sum, item) => sum + item.stableSegments, 0),
      rightsReviewedWorks: countDistinctWorks((item) => item.rightsReviewed),
      qualityVerifiedSampleWorks: new Set(
        verifiedExpressions.map((expression) =>
          corpusRegistry.works.find((work) =>
            work.expressions.some((candidate) => candidate.id === expression.id),
          )?.id,
        ),
      ).size,
      structureVerifiedWorks: new Set(
        structureVerifiedExpressions.map((expression) =>
          corpusRegistry.works.find((work) =>
            work.expressions.some((candidate) => candidate.id === expression.id),
          )?.id,
        ),
      ).size,
    },
    globalPercentages: {
      catalog: null,
      fullSourceText: null,
      translation: null,
      rightsPublishable: null,
      qualityApproved: null,
    },
    candidateInventory: {
      denominatorReady: sourceSnapshotInventory.denominatorReady,
      totalSourceRecords: sourceSnapshotInventory.sources.reduce(
        (sum, source) => sum + source.candidateRecordCount,
        0,
      ),
      sources: sourceSnapshotInventory.sources.map((source) => ({
        id: source.id,
        candidateRecordCount: source.candidateRecordCount,
        recordUnit: source.recordUnit,
        candidatePathSha256: source.candidatePathSha256,
        denominatorCaveat: source.denominatorCaveat,
      })),
      chineseSutraRecordSubset: {
        denominator: chineseCandidateRecords,
        controlled: chineseControlledRecords,
        percentage: chineseCandidateRecords && chineseControlledRecords !== null
          ? Number(((chineseControlledRecords / chineseCandidateRecords) * 100).toFixed(2))
          : null,
        sourceBytes: chineseCandidateBytes,
        controlledBytes: chineseControlledBytes,
        bytePercentage: chineseCandidateBytes && chineseControlledBytes !== null
          ? Number(((chineseControlledBytes / chineseCandidateBytes) * 100).toFixed(2))
          : null,
        inventorySha256: chineseSubsetInventory?.inventorySha256 ?? null,
        unit: "CBETA 大正藏 T01–T17 汉译经藏候选文本记录",
        caveat: "这是固定来源中的文本记录进度，不是去重作品覆盖率或全球佛典覆盖率。",
      },
      chineseAgamaSourceRecords: {
        denominator: chineseAgamaDenominator,
        controlled: chineseAgamaControlled,
        percentage: chineseAgamaDenominator && chineseAgamaControlled !== null
          ? Number(((chineseAgamaControlled / chineseAgamaDenominator) * 100).toFixed(2))
          : null,
        unit: "CBETA 固定提交大正藏 T01–T02 阿含部来源记录",
        caveat: "155/155 表示固定来源记录完整性；新增经号仍是暂定书目实体，不能当作已经去重的全球佛经作品。",
      },
      chineseBenyuanSourceRecords: {
        denominator: chineseBenyuanDenominator,
        controlled: chineseBenyuanControlled,
        percentage: chineseBenyuanDenominator && chineseBenyuanControlled !== null
          ? Number(((chineseBenyuanControlled / chineseBenyuanDenominator) * 100).toFixed(2))
          : null,
        unit: "CBETA 固定提交大正藏 T03–T04 本缘部来源记录",
        caveat: "72/72 表示固定来源记录完整性；已识别的藏本见证、同作品候选与跨语种平行仍等待版本学复核。",
      },
      chinesePrajnaparamitaSourceRecords: {
        denominator: chinesePrajnaparamitaDenominator,
        controlled: chinesePrajnaparamitaControlled,
        percentage: chinesePrajnaparamitaDenominator && chinesePrajnaparamitaControlled !== null
          ? Number(((chinesePrajnaparamitaControlled / chinesePrajnaparamitaDenominator) * 100).toFixed(2))
          : null,
        unit: "CBETA 固定提交大正藏 T05–T08 般若部来源记录",
        caveat: "57/57 表示固定来源记录完整性；《金刚经》《心经》已按同作品多表达登记，其余经会、文本家族和跨语种候选不据相似题名贸然合并。",
      },
      chineseLotusSourceRecords: {
        denominator: chineseLotusDenominator,
        controlled: chineseLotusControlled,
        percentage: chineseLotusDenominator && chineseLotusControlled !== null
          ? Number(((chineseLotusControlled / chineseLotusDenominator) * 100).toFixed(2))
          : null,
        unit: "CBETA 固定提交大正藏 T09 法华部来源记录",
        caveat: "17/17 表示固定来源记录完整性；T0265 完整保存来源文件但只作为《法华经》节译见证，T0273 保留东亚本土成书候选边界。",
      },
      chineseAvatamsakaSourceRecords: {
        denominator: chineseAvatamsakaDenominator,
        controlled: chineseAvatamsakaControlled,
        percentage: chineseAvatamsakaDenominator && chineseAvatamsakaControlled !== null
          ? Number(((chineseAvatamsakaControlled / chineseAvatamsakaDenominator) * 100).toFixed(2))
          : null,
        unit: "CBETA 固定提交大正藏 T10 华严部来源记录",
        caveat: "31/31 表示固定来源记录完整性；全经、单品组件、完整译本与节译见证分层计数，T0300/T0301 只保留相关候选而不强行合并。",
      },
      chineseRatnakutaSourceRecords: {
        denominator: chineseRatnakutaDenominator,
        controlled: chineseRatnakutaControlled,
        percentage: chineseRatnakutaDenominator && chineseRatnakutaControlled !== null
          ? Number(((chineseRatnakutaControlled / chineseRatnakutaDenominator) * 100).toFixed(2))
          : null,
        unit: "CBETA 固定提交大正藏 T11 宝积部来源记录",
        caveat: "12/12 表示固定来源记录完整性；合集、单会独立译本、同作品译本与同译本版本见证分层计数，不把组件冒充整部《大宝积经》的重复译本。",
      },
      chineseT12SourceRecords: {
        denominator: chineseT12Denominator,
        controlled: chineseT12Controlled,
        percentage: chineseT12Denominator && chineseT12Controlled !== null
          ? Number(((chineseT12Controlled / chineseT12Denominator) * 100).toFixed(2))
          : null,
        unit: "CBETA 固定提交大正藏 T12 宝积部末与涅槃部来源记录",
        caveat: "76/76 表示固定来源记录完整性；同经异译、后世校辑本、节译、后分与残篇候选分层计数，《大云经》家族证据不足时不强行合并。",
      },
      chineseT13SourceRecords: {
        denominator: chineseT13Denominator,
        controlled: chineseT13Controlled,
        percentage: chineseT13Denominator && chineseT13Controlled !== null
          ? Number(((chineseT13Controlled / chineseT13Denominator) * 100).toFixed(2))
          : null,
        unit: "CBETA 固定提交大正藏 T13 大集部来源记录",
        caveat: "28/28 表示固定来源记录完整性；《大集经》合集、单品译本、同经异译、后出节本及传统译者争议分层登记，不把来源文件数冒充作品数。",
      },
      chineseT14SourceRecords: {
        denominator: chineseT14Denominator,
        controlled: chineseT14Controlled,
        percentage: chineseT14Denominator && chineseT14Controlled !== null
          ? Number(((chineseT14Controlled / chineseT14Denominator) * 100).toFixed(2))
          : null,
        unit: "CBETA 固定提交大正藏 T14 经集部来源记录",
        caveat: "166/166 表示固定来源记录完整性；同题异译、同经号 a/b 版本、部分独立译出与范围相关文本分层登记，只在权威经录证据支持时合并作品。",
      },
      chineseT15SourceRecords: {
        denominator: chineseT15Denominator,
        controlled: chineseT15Controlled,
        percentage: chineseT15Denominator && chineseT15Controlled !== null
          ? Number(((chineseT15Controlled / chineseT15Denominator) * 100).toFixed(2))
          : null,
        unit: "CBETA 固定提交大正藏 T15 经集部来源记录",
        caveat: "71/71 表示固定来源记录完整性；异译、局部译出、撰述型禅观文本与同题范围候选分层登记，证据不足时不强行合并作品。",
      },
      chineseT16SourceRecords: {
        denominator: chineseT16Denominator,
        controlled: chineseT16Controlled,
        percentage: chineseT16Denominator && chineseT16Controlled !== null
          ? Number(((chineseT16Controlled / chineseT16Denominator) * 100).toFixed(2))
          : null,
        unit: "CBETA 固定提交大正藏 T16 经集部来源记录",
        caveat: "65/65 表示固定来源记录完整性；同经异译、同译者再译、合部编纂、单品译出与短本见证分层登记，不把来源文件数冒充作品数。",
      },
      chineseT17SourceRecords: {
        denominator: chineseT17Denominator,
        controlled: chineseT17Controlled,
        percentage: chineseT17Denominator && chineseT17Controlled !== null
          ? Number(((chineseT17Controlled / chineseT17Denominator) * 100).toFixed(2))
          : null,
        unit: "CBETA 固定提交大正藏 T17 经集部来源记录",
        caveat: "131/131 表示固定来源记录完整性；异译、同经号 a/b 版本、失译、撰集、节抄与疑似中国撰述分别登记，候选关系不作强制作品合并。",
      },
      suttacentralPaliRootPilot: {
        denominator: paliCandidateRecords,
        controlled: paliControlledRecords,
        percentage: paliCandidateRecords && paliControlledRecords !== null
          ? Number(((paliControlledRecords / paliCandidateRecords) * 100).toFixed(2))
          : null,
        controlledBytes: paliControlledBytes,
        controlledWorks: paliControlledWorks,
        unit: "SuttaCentral 固定提交中的巴利 root 物理记录",
        caveat: "5,764 个物理 JSON 文件覆盖固定提交的巴利经藏目录；其中《小部》按书级文本集合登记，并明确区分经、偈颂、义释、论辩和方法论文本。物理文件比例不是作品覆盖率。",
      },
      suttacentralPaliSuttaRoot: {
        denominator: paliSuttaRootDenominator,
        controlled: paliControlledSuttaRootRecords,
        percentage: paliSuttaRootDenominator && paliControlledSuttaRootRecords !== null
          ? Number(((paliControlledSuttaRootRecords / paliSuttaRootDenominator) * 100).toFixed(2))
          : null,
        unit: "SuttaCentral 固定提交 root/pli/ms/sutta 目录物理记录",
        caveat: "这是一个固定来源版本的经藏目录完整性，不是全球佛经作品覆盖率，也不把律藏、论藏或不同传统佛典算入分母。",
      },
      dergeKangyurEdition: {
        catalogRecords: dergeCatalogRecords,
        candidateExpressions: dergeExpressionRecords,
        excludedCatalogOnlyRecords: dergeExcludedRecords,
        nestedTextParts: dergeNestedTextParts,
        dergeIdentifiers,
        linkedAbstractWorkIds: dergeLinkedWorks,
        volumeManifests: dergeVolumes,
        inventorySha256: dergeSourceInventory && "inventorySha256" in dergeSourceInventory
          ? dergeSourceInventory.inventorySha256
          : null,
        unit: "BDRC 德格甘珠尔初印本固定版本顶层文本表达式",
        caveat: "1,114 是可定位到德格初印本卷页的顶层表达式；8 个目录补充项、71 个嵌套子文本、1,193 个德格编号和 844 个链接抽象作品分别计数。它不是跨版本去重后的藏文作品分母，更不是全球佛典覆盖率。",
      },
    },
    sourceFamilies: corpusRegistry.sourceFamilies.map((family) => ({
      id: family.id,
      title: family.title,
      denominatorStatus: family.denominatorStatus,
      denominatorWorks: family.denominatorWorks,
    })),
  };
}

function countDistinctWorks(predicate: (expression: Expression) => boolean) {
  return corpusRegistry.works.filter((work) => work.expressions.some(predicate)).length;
}

export type CoverageSnapshot = ReturnType<typeof buildCoverageSnapshot>;

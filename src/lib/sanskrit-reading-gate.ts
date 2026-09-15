import { getSutra } from "@/data/sutras";
import indicManifestDocument from "../../data/corpus/suttacentral/indic-manifest-v1.3.0.json";
import sourceSnapshotDocument from "../../data/gbcr/dsbc-gretil-source-snapshot-v0.4.0.json";
import gretilRightsDocument from "../../data/gbcr/gretil-sanskrit-file-rights-audit-v0.7.0.json";
import sanskritRightsDocument from "../../data/gbcr/sanskrit-rights-policy-v0.4.0.json";
import indicRightsDocument from "../../data/gbcr/suttacentral-indic-root-rights-audit-v0.8.0.json";

type IndicRecord = {
  id: string;
  slug: string;
  workId: string;
  language: string;
  sourceParts: unknown[];
  presentation: {
    title: string;
    alternateTitle: string;
    tradition: string;
    language: string;
    canonRef: string;
    summary: string;
    sourceUrl: string;
  };
  relationDecision: string;
  verification: {
    segments: number;
    readingUnits: number;
    sourceRecords: number;
    anchors: string[];
    humanSampleVerified: boolean;
  };
};

const indicRecords = indicManifestDocument.files as unknown as IndicRecord[];

const dossierDefinitions = [
  {
    id: "mahavadana",
    slug: "sanskrit-mahavadanasutra",
    label: "梵文阿含见证 · SF 36",
    opening: "mahāvadānasūtram",
    invitation: "从梵文叙事读七佛因缘，再回看巴利传统如何保存同一主题。",
    relationTitle: "可继续读：巴利 DN 14",
    relationHref: "/jingzang/digha-nikaya-dn14/001-dn14-0001-0120#dn14:0.1",
    relationNote: "题名与内容支持平行候选；尚未人工裁定为同一作品，也没有逐段对齐。",
    tone: "saffron",
    expected: {
      id: "SF36",
      workId: "gbcr:work:mahavadanasutra-sanskrit-sf36",
      segments: 942,
      sourceRecords: 1,
      firstFolioKey: "001-sf36-0001-0120",
      firstSegmentId: "sf36:0.1",
      lastSegmentId: "sf36:280.60",
    },
  },
  {
    id: "candra",
    slug: "sanskrit-candrasutra",
    label: "梵文阿含见证 · SF 276",
    opening: "candrasūtram",
    invitation: "用一部短经练习辨读转写、稳定段号与未知关系；25 段可以从头读到尾。",
    relationTitle: "关系状态：保持独立",
    relationHref: "/fugai",
    relationNote: "可能有其他语种平行经；在逐段证据与人工校勘完成前，不凭题名替它认亲。",
    tone: "indigo",
    expected: {
      id: "SF276",
      workId: "gbcr:work:candrasutra-sanskrit-sf276",
      segments: 25,
      sourceRecords: 1,
      firstFolioKey: "001-sf276-0001-0025",
      firstSegmentId: "sf276:0.1",
      lastSegmentId: "sf276:14.1",
    },
  },
  {
    id: "patna",
    slug: "patna-dharmapada",
    label: "俗语法句见证 · PDHP 1–414",
    opening: "manopūrvvaṅgamā dhammā",
    invitation: "读 414 偈的巴特那传本，并把它放回法句文本家族，而不是塞进巴利本的逐句译栏。",
    relationTitle: "可继续读：法句三源档案",
    relationHref: "/xue/faju",
    relationNote: "与巴利、汉译法句本同属文本家族；结构与内容并不完全相同，不声明逐句等值。",
    tone: "green",
    expected: {
      id: "PDHP",
      workId: "gbcr:work:patna-dharmapada-prakrit",
      segments: 942,
      sourceRecords: 22,
      firstFolioKey: "001-pdhp1-13-0001-0034",
      firstSegmentId: "pdhp1:0.0",
      lastSegmentId: "pdhp414:6",
    },
  },
] as const;

export const sanskritReadingDossiers = dossierDefinitions.map((definition) => {
  const record = indicRecords.find((item) => item.slug === definition.slug);
  const sutra = getSutra(definition.slug);
  if (!record || !sutra) throw new Error(`${definition.slug} 梵文原典阅读记录缺失`);

  return {
    ...definition,
    title: record.presentation.title,
    alternateTitle: record.presentation.alternateTitle,
    tradition: record.presentation.tradition,
    language: record.presentation.language,
    canonRef: record.presentation.canonRef,
    summary: record.presentation.summary,
    sourceUrl: record.presentation.sourceUrl,
    relationDecision: record.relationDecision,
    segments: record.verification.segments,
    readingUnits: record.verification.readingUnits,
    sourceRecords: record.verification.sourceRecords,
    firstSegmentId: record.verification.anchors[0],
    lastSegmentId: record.verification.anchors[1],
    readingHref: `/jingzang/${record.slug}/${definition.expected.firstFolioKey}#${record.verification.anchors[0]}`,
    sourceLicense: sutra.sourceLicense,
  };
});

export const sanskritGateSnapshot = {
  readableExpressions: indicManifestDocument.collection.expressionCount,
  representedWorks: indicManifestDocument.collection.workCount,
  sourceFiles: indicRightsDocument.summary.filesAudited,
  sanskritRootFiles: indicRightsDocument.summary.sanskritRootFiles,
  prakritRootFiles: indicRightsDocument.summary.prakritRootFiles,
  stableSegments: indicRightsDocument.summary.stableSegments,
  translationFilesImported: indicRightsDocument.summary.thirdPartyTranslationFilesImported,
  trainingFiles: indicRightsDocument.summary.filesApprovedForModelTraining,
  dsbcCandidateRecords: sourceSnapshotDocument.dsbc.candidateCatalogRecords,
  dsbcSutraRecords: sourceSnapshotDocument.dsbc.groups.sutrapitaka,
  dsbcVinayaRecords: sourceSnapshotDocument.dsbc.groups.vinayapitaka,
  dsbcSastraRecords: sourceSnapshotDocument.dsbc.groups.sastrapitaka,
  gretilCandidateFiles: sourceSnapshotDocument.gretil.candidatePhysicalFiles,
  gretilRepublishingApproved: gretilRightsDocument.summary.filesApprovedForRepublication,
  sourceCommit: indicManifestDocument.source.commit,
};

export const sanskritSourceGates = [
  {
    state: "可读",
    title: "已进入站内原典库",
    count: sanskritGateSnapshot.readableExpressions,
    unit: "个受控文本表达",
    description: `来自 SuttaCentral 的 ${sanskritGateSnapshot.sourceFiles} 个固定源文件，保留 ${sanskritGateSnapshot.stableSegments.toLocaleString("zh-CN")} 个稳定段；来源、版本与许可都能回查。`,
    decision: "可用于站内阅读、研究和带来源的检索；不用于生成式模型训练。",
    href: "https://suttacentral.net/licensing",
    hrefLabel: "查看 SuttaCentral 许可",
    tone: "open",
  },
  {
    state: "只登记",
    title: "DSBC 目录候选",
    count: sanskritGateSnapshot.dsbcCandidateRecords,
    unit: "条罗马字目录记录",
    description: `${sanskritGateSnapshot.dsbcSutraRecords} 条经、${sanskritGateSnapshot.dsbcVinayaRecords} 条律、${sanskritGateSnapshot.dsbcSastraRecords} 条论及其他；只保存汇总与哈希，不复制目录或正文。`,
    decision: "官方政策限制用途并禁止未经许可复制；免费访问不等于允许本站再发布。",
    href: "https://www.dsbcproject.org/pages/usage-policy",
    hrefLabel: "查看 DSBC 用途政策",
    secondaryHref: "https://www.dsbcproject.org/canon-text/browse-by-list/1",
    secondaryLabel: "浏览官方目录",
    tone: "held",
  },
  {
    state: "只链接",
    title: "GRETIL 文件候选",
    count: sanskritGateSnapshot.gretilCandidateFiles,
    unit: "个固定 HTML 文件",
    description: "仓库级许可证未标明；物理文件也不等于去重后的佛经作品，需逐文件核对来源、权利与文本身份。",
    decision: `当前获准再发布 ${sanskritGateSnapshot.gretilRepublishingApproved} 个，因此全部保持元数据、哈希与外链状态。`,
    href: "https://github.com/INDOLOGY/GRETIL-mirror",
    hrefLabel: "查看固定来源仓库",
    tone: "closed",
  },
] as const;

export function verifySanskritReadingGate() {
  if (
    indicManifestDocument.version !== "1.3.0" ||
    indicRightsDocument.version !== "0.8.0" ||
    indicManifestDocument.source.commit !== "eac6c24781dd1eefdc17dc2f787b54bf6fe31719" ||
    sanskritGateSnapshot.readableExpressions !== 3 ||
    sanskritGateSnapshot.representedWorks !== 3 ||
    sanskritGateSnapshot.sourceFiles !== 24 ||
    sanskritGateSnapshot.sanskritRootFiles !== 2 ||
    sanskritGateSnapshot.prakritRootFiles !== 22 ||
    sanskritGateSnapshot.stableSegments !== 1909 ||
    sanskritGateSnapshot.translationFilesImported !== 0 ||
    sanskritGateSnapshot.trainingFiles !== 0 ||
    indicRightsDocument.rightsDecision.rootTexts !== "public_domain_by_official_suttacentral_policy" ||
    indicRightsDocument.rightsDecision.trainingUse !== "prohibited_by_foxue_policy"
  ) {
    throw new Error("SuttaCentral 梵文与俗语原典快照已变化，须重新审核原典门");
  }

  if (
    sourceSnapshotDocument.version !== "0.4.0" ||
    sanskritRightsDocument.version !== "0.4.0" ||
    sanskritGateSnapshot.dsbcCandidateRecords !== 486 ||
    sanskritGateSnapshot.dsbcSutraRecords !== 111 ||
    sanskritGateSnapshot.dsbcVinayaRecords !== 15 ||
    sanskritGateSnapshot.dsbcSastraRecords !== 360 ||
    sourceSnapshotDocument.dsbc.integrity.itemInventoryPublished !== false ||
    !sanskritRightsDocument.dsbc.observedPolicy.noncommercialEducationalAndResearchUse ||
    !sanskritRightsDocument.dsbc.observedPolicy.indexingAndWordSearchPurpose ||
    !sanskritRightsDocument.dsbc.observedPolicy.reproductionWithoutPermissionProhibited
  ) {
    throw new Error("DSBC 目录或用途政策快照已变化，须重新审核来源门槛");
  }

  if (
    gretilRightsDocument.version !== "0.7.0" ||
    sanskritGateSnapshot.gretilCandidateFiles !== 417 ||
    gretilRightsDocument.summary.filesMarkedReferenceOnly !== 417 ||
    gretilRightsDocument.summary.filesRestrictedToMetadataAndExternalLink !== 417 ||
    sanskritGateSnapshot.gretilRepublishingApproved !== 0 ||
    gretilRightsDocument.summary.denominatorImpact !== "none" ||
    sanskritRightsDocument.gretil.repositoryLicenseDetected !== false
  ) {
    throw new Error("GRETIL 权利审计已变化，须重新审核来源门槛");
  }

  for (const dossier of sanskritReadingDossiers) {
    const sutra = getSutra(dossier.slug);
    if (
      dossier.expected.id !== indicRecords.find((record) => record.slug === dossier.slug)?.id ||
      dossier.expected.workId !== indicRecords.find((record) => record.slug === dossier.slug)?.workId ||
      dossier.segments !== dossier.expected.segments ||
      dossier.sourceRecords !== dossier.expected.sourceRecords ||
      dossier.firstSegmentId !== dossier.expected.firstSegmentId ||
      dossier.lastSegmentId !== dossier.expected.lastSegmentId ||
      !sutra ||
      sutra.canonRef !== dossier.canonRef ||
      sutra.sourceUrl !== dossier.sourceUrl ||
      sutra.bibliographicNote !== dossier.relationDecision
    ) {
      throw new Error(`${dossier.slug} 原典资产、锚点或作品身份已变化，须重新审核`);
    }
  }
}

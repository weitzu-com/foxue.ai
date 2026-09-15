import { getWorkExpressionGroup } from "@/data/sutras";
import { parallelEvidenceMetadata } from "@/lib/parallel-evidence";
import evidencePacketDocument from "../../data/gbcr/suttacentral-parallel-p0-evidence-packets-v0.1.0.json";
import reviewQueueDocument from "../../data/gbcr/suttacentral-parallel-review-queue-v0.1.0.json";

type ControlledAsset = {
  firstSegmentId: string | null;
  lastSegmentId: string | null;
  segments: number | null;
};

type EvidencePacket = {
  id: string;
  reviewQueueItemId: string;
  status: string;
  warning: string;
  sourceRelationship: {
    decisionClass: string;
    upstreamRemark: string;
    evidenceSha256: string;
  };
  pali: {
    reference: string;
    title: string;
    workId: string;
    registeredStableSegments: number;
    controlledAssets: ControlledAsset[];
  };
  chinese: {
    reference: string;
    cbetaId: string;
    title: string;
    exactInternalRange: {
      startSegmentId: string;
      endSegmentId: string;
      stableSegments: number;
      boundaryStatus: string;
    };
  };
  humanReviewProgress: {
    completedIndependentReviews: number;
    requiredIndependentReviews: number;
    adjudicated: boolean;
    aiReviewCredits: number;
  };
  automaticWorkMerge: boolean;
  automaticSegmentAlignment: boolean;
  denominatorImpact: string;
};

type ReviewQueueItem = {
  id: string;
  evidenceEdgeId: string;
  reviewState: string;
  reviews: unknown[];
  adjudication: unknown;
  denominatorImpactUntilAdjudicated: string;
};

const evidencePackets = evidencePacketDocument.packets as unknown as EvidencePacket[];
const reviewQueueItems = reviewQueueDocument.items as unknown as ReviewQueueItem[];

const caseDefinitions = [
  {
    id: "wuyun",
    packetId: "gbcr:p0-evidence-packet:aeb12c9551682aa3",
    number: "01",
    eyebrow: "修学入口 · 五蕴与厌离",
    title: "一组四经，能否算作一篇对应经？",
    lead: "从五蕴与厌离入手，观察共同模板怎样跨越巴利单经与汉译经组，同时保留二者不同的文本范围。",
    evidenceReading: "上游关系说明：SA 1 是把四种特征分别应用于五蕴的一组四经，其中由厌离导向离贪的模板与 SN 22.51 相似。",
    openQuestion: "SA 1 的经组边界与 SN 22.51 的单经边界能否支持更强关系，尚待两名真人逐项复核。",
    paliSlug: "samyutta-nikaya-sn22",
    paliHref: "/jingzang/samyutta-nikaya-sn22#sn22.51:0.1",
    englishSlug: "suttacentral-en-sn22",
    englishHref: "/jingzang/suttacentral-en-sn22#sn22.51:0.1",
    chineseSlug: "zaahanjing",
    expectedPaliReference: "sn22.51",
    expectedChineseReference: "sa1",
    expectedChineseStart: "T0099.001.0001a06",
    expectedChineseEnd: "T0099.001.0001a15",
    expectedEvidenceSha256: "1bc381d0f0eecf77180d5355fef330c3aa7ca84de2c121ffcb83670d3922970b",
    tone: "aggregate",
  },
  {
    id: "saw",
    packetId: "gbcr:p0-evidence-packet:1fc7ba6d729c7d8f",
    number: "02",
    eyebrow: "辨义入口 · 锯喻范围",
    title: "同一汉译段落，为什么同时指向两篇巴利经？",
    lead: "从《锯喻经》的修习语境进入，先看共享情节，再看一部汉译内部怎样转向另一篇巴利经的论题。",
    evidenceReading: "上游关系说明：EA 50.8 开头与 MN 21 共享牟利破群和比丘尼的情节；后段的邪见、纠正与蛇喻却更接近 MN 22。",
    openQuestion: "这只能支持部分平行；若把整段直接标成 MN 21 对应文本，会遮蔽后半段最重要的反证。",
    paliSlug: "majjhima-nikaya-mn21",
    paliHref: "/jingzang/majjhima-nikaya-mn21#mn21:0.1",
    englishSlug: "suttacentral-en-mn21",
    englishHref: "/jingzang/suttacentral-en-mn21#mn21:0.1",
    chineseSlug: "zengyiahanjing",
    expectedPaliReference: "mn21",
    expectedChineseReference: "ea50.8",
    expectedChineseStart: "T0125.048.0812c02",
    expectedChineseEnd: "T0125.048.0813b22",
    expectedEvidenceSha256: "33789df7b295659a4fb4284c9bc4b948472ad7345ff623658082167de9bad3cc",
    tone: "saw",
  },
  {
    id: "angulimala",
    packetId: "gbcr:p0-evidence-packet:e2cdf268c6ac3ae3",
    number: "03",
    eyebrow: "叙事入口 · 央掘魔罗",
    title: "相似叙事之外，文本范围还差多少？",
    lead: "从央掘魔罗的强烈叙事进入，比较巴利单经与《杂阿含》内部经文，同时把其他传统的相关材料留在范围说明里。",
    evidenceReading: "固定关系表只登记 MN 86 与 SA 1077 的组件关系；上游另提 T 120 与德格 213 的相关事件，但明确将其排除在该 EBT 呈现范围之外。",
    openQuestion: "叙事重现不自动证明同一作品；其他传统的材料也不能被静默吸收到这一对候选关系里。",
    paliSlug: "majjhima-nikaya-mn86",
    paliHref: "/jingzang/majjhima-nikaya-mn86#mn86:0.1",
    englishSlug: "suttacentral-en-mn86",
    englishHref: "/jingzang/suttacentral-en-mn86#mn86:0.1",
    chineseSlug: "zaahanjing",
    expectedPaliReference: "mn86",
    expectedChineseReference: "sa1077",
    expectedChineseStart: "T0099.039.0284b20",
    expectedChineseEnd: "T0099.039.0284c09",
    expectedEvidenceSha256: "284b6e3b156c52d181abfa5b83aa51072c6289bc91f8aa581d03386e8e956ff4",
    tone: "story",
  },
] as const;

export const ebtEvidenceDeskSnapshot = {
  parallelEdges: parallelEvidenceMetadata.completeLedgerEdges,
  reviewQueueItems: reviewQueueDocument.summary.queueItems,
  p0Packets: evidencePacketDocument.summary.packets,
  completedIndependentReviews: reviewQueueDocument.summary.completedIndependentReviews,
  adjudicatedItems: reviewQueueDocument.summary.adjudicatedItems,
  automaticMerges: reviewQueueDocument.summary.automaticMerges,
};

export const ebtEvidenceCases = caseDefinitions.map((definition) => {
  const packet = evidencePackets.find((item) => item.id === definition.packetId);
  if (!packet) throw new Error(`${definition.packetId} EBT 证据包缺失`);

  const paliAsset = packet.pali.controlledAssets[0];
  const paliSegments = paliAsset?.segments ?? packet.pali.registeredStableSegments;
  const chineseHref = `/jingzang/${definition.chineseSlug}#${packet.chinese.exactInternalRange.startSegmentId}`;

  return {
    ...definition,
    packet,
    paliSegments,
    chineseHref,
  };
});

export function verifyEbtEvidenceDesk() {
  if (
    parallelEvidenceMetadata.version !== "0.1.0" ||
    ebtEvidenceDeskSnapshot.parallelEdges !== 5161 ||
    parallelEvidenceMetadata.automaticWorkMerge !== false ||
    parallelEvidenceMetadata.segmentAlignmentAsserted !== false
  ) {
    throw new Error("汉巴关系证据账本已变化，须重新审核 EBT 书案");
  }

  if (
    evidencePacketDocument.version !== "0.1.0" ||
    reviewQueueDocument.version !== "0.1.0" ||
    ebtEvidenceDeskSnapshot.reviewQueueItems !== 80 ||
    ebtEvidenceDeskSnapshot.p0Packets !== 20 ||
    ebtEvidenceDeskSnapshot.completedIndependentReviews !== 0 ||
    ebtEvidenceDeskSnapshot.adjudicatedItems !== 0 ||
    ebtEvidenceDeskSnapshot.automaticMerges !== 0
  ) {
    throw new Error("汉巴复核队列状态已变化，须重新审核 EBT 书案");
  }

  for (const evidenceCase of ebtEvidenceCases) {
    const { packet } = evidenceCase;
    const queueItem = reviewQueueItems.find((item) => item.id === packet.reviewQueueItemId);
    const expressionGroup = getWorkExpressionGroup(evidenceCase.paliSlug);

    if (
      packet.status !== "machine_prepared_preadjudication_materials_not_human_review" ||
      packet.pali.reference !== evidenceCase.expectedPaliReference ||
      packet.chinese.reference !== evidenceCase.expectedChineseReference ||
      packet.chinese.exactInternalRange.startSegmentId !== evidenceCase.expectedChineseStart ||
      packet.chinese.exactInternalRange.endSegmentId !== evidenceCase.expectedChineseEnd ||
      packet.sourceRelationship.evidenceSha256 !== evidenceCase.expectedEvidenceSha256 ||
      packet.automaticWorkMerge ||
      packet.automaticSegmentAlignment ||
      packet.denominatorImpact !== "none" ||
      packet.humanReviewProgress.completedIndependentReviews !== 0 ||
      packet.humanReviewProgress.requiredIndependentReviews !== 2 ||
      packet.humanReviewProgress.adjudicated ||
      packet.humanReviewProgress.aiReviewCredits !== 0
    ) {
      throw new Error(`${packet.id} EBT 证据边界已变化，须重新审核`);
    }

    if (
      !queueItem ||
      queueItem.reviewState !== "unassigned_pending_two_independent_reviews" ||
      queueItem.reviews.length !== 0 ||
      queueItem.adjudication !== null ||
      queueItem.denominatorImpactUntilAdjudicated !== "none"
    ) {
      throw new Error(`${packet.reviewQueueItemId} 人工复核状态已变化，须重新审核`);
    }

    if (
      !expressionGroup ||
      expressionGroup.workId !== packet.pali.workId ||
      !expressionGroup.expressions.some((expression) => expression.slug === evidenceCase.englishSlug)
    ) {
      throw new Error(`${evidenceCase.englishSlug} 英译作品挂接已变化，须重新审核`);
    }
  }
}

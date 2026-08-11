import registryDocument from "../../data/gbcr/registry-v0.4.0.json";
import sourceSnapshotsDocument from "../../data/gbcr/source-snapshots-v0.2.1.json";

type Expression = (typeof registryDocument.works)[number]["expressions"][number];

export const corpusRegistry = registryDocument;
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
  const cbetaSourceInventory = sourceSnapshotInventory.sources.find(
    (source) => source.id === "cbeta_xml_p5",
  );
  const chineseSubsetInventory = cbetaSourceInventory && "candidateSubsets" in cbetaSourceInventory
    ? cbetaSourceInventory.candidateSubsets?.find(
        (subset) => subset.id === "taisho_chinese_sutra_t01_t17",
      ) ?? null
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

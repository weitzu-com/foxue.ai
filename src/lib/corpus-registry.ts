import registryDocument from "../../data/gbcr/registry-v5.1.0.json";
import sourceSnapshotsDocument from "../../data/gbcr/source-snapshots-v2.1.0.json";

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
      item.qualityStatus === "verified_structure_and_anchors" ||
      item.qualityStatus === "verified_structure_rights_and_anchors",
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
  const chineseT18Denominator = "t18SourceRecordDenominator" in (chineseFamily ?? {})
    ? chineseFamily?.t18SourceRecordDenominator ?? null
    : null;
  const chineseT18Controlled = "t18ControlledSourceRecords" in (chineseFamily ?? {})
    ? chineseFamily?.t18ControlledSourceRecords ?? null
    : null;
  const chineseT19Denominator = "t19SourceRecordDenominator" in (chineseFamily ?? {})
    ? chineseFamily?.t19SourceRecordDenominator ?? null
    : null;
  const chineseT19Controlled = "t19ControlledSourceRecords" in (chineseFamily ?? {})
    ? chineseFamily?.t19ControlledSourceRecords ?? null
    : null;
  const chineseT20Denominator = "t20SourceRecordDenominator" in (chineseFamily ?? {})
    ? chineseFamily?.t20SourceRecordDenominator ?? null
    : null;
  const chineseT20Controlled = "t20ControlledSourceRecords" in (chineseFamily ?? {})
    ? chineseFamily?.t20ControlledSourceRecords ?? null
    : null;
  const chineseT21Denominator = "t21SourceRecordDenominator" in (chineseFamily ?? {})
    ? chineseFamily?.t21SourceRecordDenominator ?? null
    : null;
  const chineseT21Controlled = "t21ControlledSourceRecords" in (chineseFamily ?? {})
    ? chineseFamily?.t21ControlledSourceRecords ?? null
    : null;
  const chineseT22Denominator = "t22SourceRecordDenominator" in (chineseFamily ?? {})
    ? chineseFamily?.t22SourceRecordDenominator ?? null
    : null;
  const chineseT22Controlled = "t22ControlledSourceRecords" in (chineseFamily ?? {})
    ? chineseFamily?.t22ControlledSourceRecords ?? null
    : null;
  const chineseT23Denominator = "t23SourceRecordDenominator" in (chineseFamily ?? {})
    ? chineseFamily?.t23SourceRecordDenominator ?? null
    : null;
  const chineseT23Controlled = "t23ControlledSourceRecords" in (chineseFamily ?? {})
    ? chineseFamily?.t23ControlledSourceRecords ?? null
    : null;
  const chineseT24Denominator = "t24SourceRecordDenominator" in (chineseFamily ?? {})
    ? chineseFamily?.t24SourceRecordDenominator ?? null
    : null;
  const chineseT24Controlled = "t24ControlledSourceRecords" in (chineseFamily ?? {})
    ? chineseFamily?.t24ControlledSourceRecords ?? null
    : null;
  const chineseT25Denominator = "t25SourceRecordDenominator" in (chineseFamily ?? {})
    ? chineseFamily?.t25SourceRecordDenominator ?? null
    : null;
  const chineseT25Controlled = "t25ControlledSourceRecords" in (chineseFamily ?? {})
    ? chineseFamily?.t25ControlledSourceRecords ?? null
    : null;
  const chineseT26Denominator = "t26SourceRecordDenominator" in (chineseFamily ?? {})
    ? chineseFamily?.t26SourceRecordDenominator ?? null
    : null;
  const chineseT26Controlled = "t26ControlledSourceRecords" in (chineseFamily ?? {})
    ? chineseFamily?.t26ControlledSourceRecords ?? null
    : null;
  const chineseT27Denominator = "t27SourceRecordDenominator" in (chineseFamily ?? {})
    ? chineseFamily?.t27SourceRecordDenominator ?? null
    : null;
  const chineseT27Controlled = "t27ControlledSourceRecords" in (chineseFamily ?? {})
    ? chineseFamily?.t27ControlledSourceRecords ?? null
    : null;
  const chineseT28Denominator = "t28SourceRecordDenominator" in (chineseFamily ?? {})
    ? chineseFamily?.t28SourceRecordDenominator ?? null
    : null;
  const chineseT28Controlled = "t28ControlledSourceRecords" in (chineseFamily ?? {})
    ? chineseFamily?.t28ControlledSourceRecords ?? null
    : null;
  const chineseT29Denominator = "t29SourceRecordDenominator" in (chineseFamily ?? {})
    ? chineseFamily?.t29SourceRecordDenominator ?? null
    : null;
  const chineseT29Controlled = "t29ControlledSourceRecords" in (chineseFamily ?? {})
    ? chineseFamily?.t29ControlledSourceRecords ?? null
    : null;
  const chineseT30Denominator = "t30SourceRecordDenominator" in (chineseFamily ?? {})
    ? chineseFamily?.t30SourceRecordDenominator ?? null
    : null;
  const chineseT30Controlled = "t30ControlledSourceRecords" in (chineseFamily ?? {})
    ? chineseFamily?.t30ControlledSourceRecords ?? null
    : null;
  const chineseT31Denominator = "t31SourceRecordDenominator" in (chineseFamily ?? {})
    ? chineseFamily?.t31SourceRecordDenominator ?? null
    : null;
  const chineseT31Controlled = "t31ControlledSourceRecords" in (chineseFamily ?? {})
    ? chineseFamily?.t31ControlledSourceRecords ?? null
    : null;
  const chineseT32Denominator = "t32SourceRecordDenominator" in (chineseFamily ?? {})
    ? chineseFamily?.t32SourceRecordDenominator ?? null
    : null;
  const chineseT32Controlled = "t32ControlledSourceRecords" in (chineseFamily ?? {})
    ? chineseFamily?.t32ControlledSourceRecords ?? null
    : null;
  const chineseT33Denominator = "t33SourceRecordDenominator" in (chineseFamily ?? {})
    ? chineseFamily?.t33SourceRecordDenominator ?? null
    : null;
  const chineseT33Controlled = "t33ControlledSourceRecords" in (chineseFamily ?? {})
    ? chineseFamily?.t33ControlledSourceRecords ?? null
    : null;
  const cbetaSourceInventory = sourceSnapshotInventory.sources.find(
    (source) => source.id === "cbeta_xml_p5",
  );
  const chineseSubsetInventory = cbetaSourceInventory && "candidateSubsets" in cbetaSourceInventory
    ? cbetaSourceInventory.candidateSubsets?.find(
        (subset) => subset.id === "taisho_chinese_sutra_t01_t17",
      ) ?? null
    : null;
  const chineseT18SubsetInventory = cbetaSourceInventory && "candidateSubsets" in cbetaSourceInventory
    ? cbetaSourceInventory.candidateSubsets?.find(
        (subset) => subset.id === "taisho_esoteric_t18",
      ) ?? null
    : null;
  const chineseT19SubsetInventory = cbetaSourceInventory && "candidateSubsets" in cbetaSourceInventory
    ? cbetaSourceInventory.candidateSubsets?.find(
        (subset) => subset.id === "taisho_esoteric_t19",
      ) ?? null
    : null;
  const chineseT20SubsetInventory = cbetaSourceInventory && "candidateSubsets" in cbetaSourceInventory
    ? cbetaSourceInventory.candidateSubsets?.find(
        (subset) => subset.id === "taisho_esoteric_t20",
      ) ?? null
    : null;
  const chineseT21SubsetInventory = cbetaSourceInventory && "candidateSubsets" in cbetaSourceInventory
    ? cbetaSourceInventory.candidateSubsets?.find(
        (subset) => subset.id === "taisho_esoteric_t21",
      ) ?? null
    : null;
  const chineseT22SubsetInventory = cbetaSourceInventory && "candidateSubsets" in cbetaSourceInventory
    ? cbetaSourceInventory.candidateSubsets?.find(
        (subset) => subset.id === "taisho_vinaya_t22",
      ) ?? null
    : null;
  const chineseT23SubsetInventory = cbetaSourceInventory && "candidateSubsets" in cbetaSourceInventory
    ? cbetaSourceInventory.candidateSubsets?.find(
        (subset) => subset.id === "taisho_vinaya_t23",
      ) ?? null
    : null;
  const chineseT24SubsetInventory = cbetaSourceInventory && "candidateSubsets" in cbetaSourceInventory
    ? cbetaSourceInventory.candidateSubsets?.find(
        (subset) => subset.id === "taisho_vinaya_t24",
      ) ?? null
    : null;
  const chineseT25SubsetInventory = cbetaSourceInventory && "candidateSubsets" in cbetaSourceInventory
    ? cbetaSourceInventory.candidateSubsets?.find(
        (subset) => subset.id === "taisho_sutra_commentary_t25",
      ) ?? null
    : null;
  const chineseT26SubsetInventory = cbetaSourceInventory && "candidateSubsets" in cbetaSourceInventory
    ? cbetaSourceInventory.candidateSubsets?.find(
        (subset) => subset.id === "taisho_sutra_commentary_abhidharma_t26",
      ) ?? null
    : null;
  const chineseT27SubsetInventory = cbetaSourceInventory && "candidateSubsets" in cbetaSourceInventory
    ? cbetaSourceInventory.candidateSubsets?.find(
        (subset) => subset.id === "taisho_abhidharma_commentary_t27",
      ) ?? null
    : null;
  const chineseT28SubsetInventory = cbetaSourceInventory && "candidateSubsets" in cbetaSourceInventory
    ? cbetaSourceInventory.candidateSubsets?.find(
        (subset) => subset.id === "taisho_abhidharma_t28",
      ) ?? null
    : null;
  const chineseT29SubsetInventory = cbetaSourceInventory && "candidateSubsets" in cbetaSourceInventory
    ? cbetaSourceInventory.candidateSubsets?.find(
        (subset) => subset.id === "taisho_abhidharma_t29",
      ) ?? null
    : null;
  const chineseT30SubsetInventory = cbetaSourceInventory && "candidateSubsets" in cbetaSourceInventory
    ? cbetaSourceInventory.candidateSubsets?.find(
        (subset) => subset.id === "taisho_madhyamaka_yogacara_t30",
      ) ?? null
    : null;
  const chineseT31SubsetInventory = cbetaSourceInventory && "candidateSubsets" in cbetaSourceInventory
    ? cbetaSourceInventory.candidateSubsets?.find(
        (subset) => subset.id === "taisho_yogacara_t31",
      ) ?? null
    : null;
  const chineseT32SubsetInventory = cbetaSourceInventory && "candidateSubsets" in cbetaSourceInventory
    ? cbetaSourceInventory.candidateSubsets?.find(
        (subset) => subset.id === "taisho_sastra_t32",
      ) ?? null
    : null;
  const chineseT33SubsetInventory = cbetaSourceInventory && "candidateSubsets" in cbetaSourceInventory
    ? cbetaSourceInventory.candidateSubsets?.find(
        (subset) => subset.id === "taisho_sutra_commentary_t33",
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
  const indicControlledWorks = "controlledNonPaliIndicWorks" in (suttacentralFamily ?? {})
    ? suttacentralFamily?.controlledNonPaliIndicWorks ?? null
    : null;
  const indicControlledExpressions = "controlledNonPaliIndicExpressions" in (suttacentralFamily ?? {})
    ? suttacentralFamily?.controlledNonPaliIndicExpressions ?? null
    : null;
  const indicControlledRootRecords = "controlledNonPaliIndicRootRecords" in (suttacentralFamily ?? {})
    ? suttacentralFamily?.controlledNonPaliIndicRootRecords ?? null
    : null;
  const indicControlledRootBytes = "controlledNonPaliIndicRootBytes" in (suttacentralFamily ?? {})
    ? suttacentralFamily?.controlledNonPaliIndicRootBytes ?? null
    : null;
  const indicControlledStableSegments = "controlledNonPaliIndicStableSegments" in (suttacentralFamily ?? {})
    ? suttacentralFamily?.controlledNonPaliIndicStableSegments ?? null
    : null;
  const vinayaControlledWorks = "controlledVinayaWorks" in (suttacentralFamily ?? {})
    ? suttacentralFamily?.controlledVinayaWorks ?? null
    : null;
  const vinayaControlledExpressions = "controlledVinayaExpressions" in (suttacentralFamily ?? {})
    ? suttacentralFamily?.controlledVinayaExpressions ?? null
    : null;
  const vinayaControlledRootRecords = "controlledVinayaRootRecords" in (suttacentralFamily ?? {})
    ? suttacentralFamily?.controlledVinayaRootRecords ?? null
    : null;
  const vinayaControlledRootBytes = "controlledVinayaRootBytes" in (suttacentralFamily ?? {})
    ? suttacentralFamily?.controlledVinayaRootBytes ?? null
    : null;
  const vinayaControlledStableSegments = "controlledVinayaStableSegments" in (suttacentralFamily ?? {})
    ? suttacentralFamily?.controlledVinayaStableSegments ?? null
    : null;
  const abhidhammaControlledWorks = "controlledAbhidhammaWorks" in (suttacentralFamily ?? {})
    ? suttacentralFamily?.controlledAbhidhammaWorks ?? null
    : null;
  const abhidhammaControlledExpressions = "controlledAbhidhammaExpressions" in (suttacentralFamily ?? {})
    ? suttacentralFamily?.controlledAbhidhammaExpressions ?? null
    : null;
  const abhidhammaControlledRootRecords = "controlledAbhidhammaRootRecords" in (suttacentralFamily ?? {})
    ? suttacentralFamily?.controlledAbhidhammaRootRecords ?? null
    : null;
  const abhidhammaControlledRootBytes = "controlledAbhidhammaRootBytes" in (suttacentralFamily ?? {})
    ? suttacentralFamily?.controlledAbhidhammaRootBytes ?? null
    : null;
  const abhidhammaControlledStableSegments = "controlledAbhidhammaStableSegments" in (suttacentralFamily ?? {})
    ? suttacentralFamily?.controlledAbhidhammaStableSegments ?? null
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
  const rktsSourceInventory = sourceSnapshotInventory.sources.find(
    (source) => source.id === "rkts_kangyur_catalogs",
  );
  const rktsConfiguredCatalogs = "rktsConfiguredCatalogs" in (tibetanFamily ?? {})
    ? tibetanFamily?.rktsConfiguredCatalogs ?? null
    : null;
  const rktsAvailableCatalogs = "rktsAvailableCatalogs" in (tibetanFamily ?? {})
    ? tibetanFamily?.rktsAvailableCatalogs ?? null
    : null;
  const rktsMissingConfiguredCatalogs = "rktsMissingConfiguredCatalogs" in (tibetanFamily ?? {})
    ? tibetanFamily?.rktsMissingConfiguredCatalogs ?? null
    : null;
  const rktsCandidateItemRecords = "rktsCandidateItemRecords" in (tibetanFamily ?? {})
    ? tibetanFamily?.rktsCandidateItemRecords ?? null
    : null;
  const rktsCandidateBytes = "rktsCandidateBytes" in (tibetanFamily ?? {})
    ? tibetanFamily?.rktsCandidateBytes ?? null
    : null;
  const sanskritFamily = corpusRegistry.sourceFamilies.find(
    (family) => family.id === "sanskrit_fragments_and_witnesses",
  );
  const dsbcCatalogRecords = "candidateDsbcCatalogRecords" in (sanskritFamily ?? {})
    ? sanskritFamily?.candidateDsbcCatalogRecords ?? null
    : null;
  const dsbcSutrapitakaRecords = "candidateDsbcSutrapitakaRecords" in (sanskritFamily ?? {})
    ? sanskritFamily?.candidateDsbcSutrapitakaRecords ?? null
    : null;
  const dsbcVinayapitakaRecords = "candidateDsbcVinayapitakaRecords" in (sanskritFamily ?? {})
    ? sanskritFamily?.candidateDsbcVinayapitakaRecords ?? null
    : null;
  const dsbcSastrapitakaRecords = "candidateDsbcSastrapitakaRecords" in (sanskritFamily ?? {})
    ? sanskritFamily?.candidateDsbcSastrapitakaRecords ?? null
    : null;
  const gretilPhysicalFiles = "candidateGretilPhysicalFiles" in (sanskritFamily ?? {})
    ? sanskritFamily?.candidateGretilPhysicalFiles ?? null
    : null;
  const gretilBytes = "candidateGretilBytes" in (sanskritFamily ?? {})
    ? sanskritFamily?.candidateGretilBytes ?? null
    : null;
  const dsbcSourceInventory = sourceSnapshotInventory.sources.find(
    (source) => source.id === "dsbc_sanskrit_catalog",
  );
  const gretilSourceInventory = sourceSnapshotInventory.sources.find(
    (source) => source.id === "gretil_sanskrit_buddhist_files",
  );

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
        t18InventorySha256: chineseT18SubsetInventory?.inventorySha256 ?? null,
        t19InventorySha256: chineseT19SubsetInventory?.inventorySha256 ?? null,
        t20InventorySha256: chineseT20SubsetInventory?.inventorySha256 ?? null,
        t21InventorySha256: chineseT21SubsetInventory?.inventorySha256 ?? null,
        t22InventorySha256: chineseT22SubsetInventory?.inventorySha256 ?? null,
        t23InventorySha256: chineseT23SubsetInventory?.inventorySha256 ?? null,
        t24InventorySha256: chineseT24SubsetInventory?.inventorySha256 ?? null,
        t25InventorySha256: chineseT25SubsetInventory?.inventorySha256 ?? null,
        t26InventorySha256: chineseT26SubsetInventory?.inventorySha256 ?? null,
        t27InventorySha256: chineseT27SubsetInventory?.inventorySha256 ?? null,
        t28InventorySha256: chineseT28SubsetInventory?.inventorySha256 ?? null,
        t29InventorySha256: chineseT29SubsetInventory?.inventorySha256 ?? null,
        t30InventorySha256: chineseT30SubsetInventory?.inventorySha256 ?? null,
        t31InventorySha256: chineseT31SubsetInventory?.inventorySha256 ?? null,
        t32InventorySha256: chineseT32SubsetInventory?.inventorySha256 ?? null,
        t33InventorySha256: chineseT33SubsetInventory?.inventorySha256 ?? null,
        unit: "CBETA 大正藏 T01–T33 十七个固定候选子集的来源记录",
        caveat: "这是固定来源中的记录完整性，不是去重作品覆盖率或全球佛典覆盖率；T18–T21 密教部、T22–T24 律部与 T25–T33 释经论、毘昙、中观、瑜伽、论集、经疏部分别容纳译经、仪轨、论造、编集、广律、戒本、羯磨、根本颂、释论、完整论书、部分作品见证、组成部分、节略与分离见证、同本异译、异本、音写、失译、汉地撰成、讲说记录、合注、治定本、再注释与归属争议。",
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
      chineseT18SourceRecords: {
        denominator: chineseT18Denominator,
        controlled: chineseT18Controlled,
        percentage: chineseT18Denominator && chineseT18Controlled !== null
          ? Number(((chineseT18Controlled / chineseT18Denominator) * 100).toFixed(2))
          : null,
        fullSourceTexts: corpusRegistry.cbetaT18BoundaryAudit.fullSourceTexts,
        partialSourceWitnesses: corpusRegistry.cbetaT18BoundaryAudit.partialSourceWitnesses,
        verifiedEditionWitnesses: corpusRegistry.cbetaT18BoundaryAudit.verifiedEditionWitnesses,
        attributionBoundaryRecords: corpusRegistry.cbetaT18BoundaryAudit.attributionBoundaryRecords,
        unit: "CBETA 固定提交大正藏 T18 密教部来源记录",
        caveat: corpusRegistry.cbetaT18BoundaryAudit.caveat,
      },
      chineseT19SourceRecords: {
        denominator: chineseT19Denominator,
        controlled: chineseT19Controlled,
        percentage: chineseT19Denominator && chineseT19Controlled !== null
          ? Number(((chineseT19Controlled / chineseT19Denominator) * 100).toFixed(2))
          : null,
        fullSourceTexts: corpusRegistry.cbetaT19BoundaryAudit.fullSourceTexts,
        partialSourceWitnesses: corpusRegistry.cbetaT19BoundaryAudit.partialSourceWitnesses,
        verifiedEditionWitnesses: corpusRegistry.cbetaT19BoundaryAudit.verifiedEditionWitnesses,
        attributionBoundaryRecords: corpusRegistry.cbetaT19BoundaryAudit.attributionBoundaryRecords,
        irregularJuanSequences: corpusRegistry.cbetaT19BoundaryAudit.irregularJuanSequences,
        unit: "CBETA 固定提交大正藏 T19 密教部来源记录",
        caveat: corpusRegistry.cbetaT19BoundaryAudit.caveat,
      },
      chineseT20SourceRecords: {
        denominator: chineseT20Denominator,
        controlled: chineseT20Controlled,
        percentage: chineseT20Denominator && chineseT20Controlled !== null
          ? Number(((chineseT20Controlled / chineseT20Denominator) * 100).toFixed(2))
          : null,
        fullSourceTexts: corpusRegistry.cbetaT20BoundaryAudit.newFullSourceTexts,
        partialSourceWitnesses: corpusRegistry.cbetaT20BoundaryAudit.newPartialSourceWitnesses,
        verifiedEditionWitnesses: corpusRegistry.cbetaT20BoundaryAudit.verifiedEditionWitnesses,
        attributionBoundaryRecords: corpusRegistry.cbetaT20BoundaryAudit.attributionBoundaryRecords,
        unit: "CBETA 固定提交大正藏 T20 密教部来源记录",
        caveat: corpusRegistry.cbetaT20BoundaryAudit.caveat,
      },
      chineseT21SourceRecords: {
        denominator: chineseT21Denominator,
        controlled: chineseT21Controlled,
        percentage: chineseT21Denominator && chineseT21Controlled !== null
          ? Number(((chineseT21Controlled / chineseT21Denominator) * 100).toFixed(2))
          : null,
        fullSourceTexts: corpusRegistry.cbetaT21BoundaryAudit.newFullSourceTexts,
        partialSourceWitnesses: corpusRegistry.cbetaT21BoundaryAudit.newPartialSourceWitnesses,
        verifiedEditionWitnesses: corpusRegistry.cbetaT21BoundaryAudit.verifiedEditionWitnesses,
        attributionBoundaryRecords: corpusRegistry.cbetaT21BoundaryAudit.attributionBoundaryRecords,
        unit: "CBETA 固定提交大正藏 T21 密教部来源记录",
        caveat: corpusRegistry.cbetaT21BoundaryAudit.caveat,
      },
      chineseT22SourceRecords: {
        denominator: chineseT22Denominator,
        controlled: chineseT22Controlled,
        percentage: chineseT22Denominator && chineseT22Controlled !== null
          ? Number(((chineseT22Controlled / chineseT22Denominator) * 100).toFixed(2))
          : null,
        fullSourceTexts: corpusRegistry.cbetaT22BoundaryAudit.newFullSourceTexts,
        partialSourceWitnesses: corpusRegistry.cbetaT22BoundaryAudit.newPartialSourceWitnesses,
        verifiedEditionWitnesses: corpusRegistry.cbetaT22BoundaryAudit.verifiedEditionWitnesses,
        attributionBoundaryRecords: corpusRegistry.cbetaT22BoundaryAudit.attributionBoundaryRecords,
        unit: "CBETA 固定提交大正藏 T22 律部来源记录",
        caveat: corpusRegistry.cbetaT22BoundaryAudit.caveat,
      },
      chineseT23SourceRecords: {
        denominator: chineseT23Denominator,
        controlled: chineseT23Controlled,
        percentage: chineseT23Denominator && chineseT23Controlled !== null
          ? Number(((chineseT23Controlled / chineseT23Denominator) * 100).toFixed(2))
          : null,
        fullSourceTexts: corpusRegistry.cbetaT23BoundaryAudit.newFullSourceTexts,
        partialSourceWitnesses: corpusRegistry.cbetaT23BoundaryAudit.newPartialSourceWitnesses,
        verifiedEditionWitnesses: corpusRegistry.cbetaT23BoundaryAudit.verifiedEditionWitnesses,
        attributionBoundaryRecords: corpusRegistry.cbetaT23BoundaryAudit.attributionBoundaryRecords,
        unit: "CBETA 固定提交大正藏 T23 律部来源记录",
        caveat: corpusRegistry.cbetaT23BoundaryAudit.caveat,
      },
      chineseT24SourceRecords: {
        denominator: chineseT24Denominator,
        controlled: chineseT24Controlled,
        percentage: chineseT24Denominator && chineseT24Controlled !== null
          ? Number(((chineseT24Controlled / chineseT24Denominator) * 100).toFixed(2))
          : null,
        fullSourceTexts: corpusRegistry.cbetaT24BoundaryAudit.newFullSourceTexts,
        partialSourceWitnesses: corpusRegistry.cbetaT24BoundaryAudit.newPartialSourceWitnesses,
        verifiedSameWorkExpressions: corpusRegistry.cbetaT24BoundaryAudit.verifiedSameWorkExpressions,
        verifiedEditionWitnesses: corpusRegistry.cbetaT24BoundaryAudit.verifiedEditionWitnesses,
        attributionBoundaryRecords: corpusRegistry.cbetaT24BoundaryAudit.attributionBoundaryRecords,
        unit: "CBETA 固定提交大正藏 T24 律部来源记录",
        caveat: corpusRegistry.cbetaT24BoundaryAudit.caveat,
      },
      chineseT25SourceRecords: {
        denominator: chineseT25Denominator,
        controlled: chineseT25Controlled,
        percentage: chineseT25Denominator && chineseT25Controlled !== null
          ? Number(((chineseT25Controlled / chineseT25Denominator) * 100).toFixed(2))
          : null,
        fullSourceTexts: corpusRegistry.cbetaT25BoundaryAudit.newFullSourceTexts,
        partialSourceWitnesses: corpusRegistry.cbetaT25BoundaryAudit.newPartialSourceWitnesses,
        verifiedSameWorkExpressions: corpusRegistry.cbetaT25BoundaryAudit.verifiedSameWorkExpressions,
        verifiedEditionWitnesses: corpusRegistry.cbetaT25BoundaryAudit.verifiedEditionWitnesses,
        attributionBoundaryRecords: corpusRegistry.cbetaT25BoundaryAudit.attributionBoundaryRecords,
        unit: "CBETA 固定提交大正藏 T25 释经论部来源记录",
        caveat: corpusRegistry.cbetaT25BoundaryAudit.caveat,
      },
      chineseT26SourceRecords: {
        denominator: chineseT26Denominator,
        controlled: chineseT26Controlled,
        percentage: chineseT26Denominator && chineseT26Controlled !== null
          ? Number(((chineseT26Controlled / chineseT26Denominator) * 100).toFixed(2))
          : null,
        fullSourceTexts: corpusRegistry.cbetaT26BoundaryAudit.newFullSourceTexts,
        partialSourceWitnesses: corpusRegistry.cbetaT26BoundaryAudit.newPartialSourceWitnesses,
        verifiedSameWorkExpressions: corpusRegistry.cbetaT26BoundaryAudit.verifiedSameWorkExpressions,
        verifiedEditionWitnesses: corpusRegistry.cbetaT26BoundaryAudit.verifiedEditionWitnesses,
        attributionBoundaryRecords: corpusRegistry.cbetaT26BoundaryAudit.attributionBoundaryRecords,
        relationAnnotatedRecords: corpusRegistry.cbetaT26BoundaryAudit.relationAnnotatedRecords,
        unit: "CBETA 固定提交大正藏 T26 释经论与毘昙部来源记录",
        caveat: corpusRegistry.cbetaT26BoundaryAudit.caveat,
      },
      chineseT27SourceRecords: {
        denominator: chineseT27Denominator,
        controlled: chineseT27Controlled,
        percentage: chineseT27Denominator && chineseT27Controlled !== null
          ? Number(((chineseT27Controlled / chineseT27Denominator) * 100).toFixed(2))
          : null,
        fullSourceTexts: corpusRegistry.cbetaT27BoundaryAudit.newFullSourceTexts,
        partialSourceWitnesses: corpusRegistry.cbetaT27BoundaryAudit.newPartialSourceWitnesses,
        verifiedSameWorkExpressions: corpusRegistry.cbetaT27BoundaryAudit.verifiedSameWorkExpressions,
        verifiedEditionWitnesses: corpusRegistry.cbetaT27BoundaryAudit.verifiedEditionWitnesses,
        attributionBoundaryRecords: corpusRegistry.cbetaT27BoundaryAudit.attributionBoundaryRecords,
        relationAnnotatedRecords: corpusRegistry.cbetaT27BoundaryAudit.relationAnnotatedRecords,
        unit: "CBETA 固定提交大正藏 T27 毘昙部《大毘婆沙论》来源记录",
        caveat: corpusRegistry.cbetaT27BoundaryAudit.caveat,
      },
      chineseT28SourceRecords: {
        denominator: chineseT28Denominator,
        controlled: chineseT28Controlled,
        percentage: chineseT28Denominator && chineseT28Controlled !== null
          ? Number(((chineseT28Controlled / chineseT28Denominator) * 100).toFixed(2))
          : null,
        fullSourceTexts: corpusRegistry.cbetaT28BoundaryAudit.newFullSourceTexts,
        partialSourceWitnesses: corpusRegistry.cbetaT28BoundaryAudit.newPartialSourceWitnesses,
        verifiedSameWorkExpressions: corpusRegistry.cbetaT28BoundaryAudit.verifiedSameWorkExpressions,
        verifiedPartialWorkWitnesses: corpusRegistry.cbetaT28BoundaryAudit.verifiedPartialWorkWitnesses,
        verifiedEditionWitnesses: corpusRegistry.cbetaT28BoundaryAudit.verifiedEditionWitnesses,
        attributionBoundaryRecords: corpusRegistry.cbetaT28BoundaryAudit.attributionBoundaryRecords,
        relationAnnotatedRecords: corpusRegistry.cbetaT28BoundaryAudit.relationAnnotatedRecords,
        newWorks: corpusRegistry.cbetaT28BoundaryAudit.newWorks,
        controlledWorks: corpusRegistry.cbetaT28BoundaryAudit.controlledWorks,
        unit: "CBETA 固定提交大正藏 T28 毘昙部来源记录",
        caveat: corpusRegistry.cbetaT28BoundaryAudit.caveat,
      },
      chineseT29SourceRecords: {
        denominator: chineseT29Denominator,
        controlled: chineseT29Controlled,
        percentage: chineseT29Denominator && chineseT29Controlled !== null
          ? Number(((chineseT29Controlled / chineseT29Denominator) * 100).toFixed(2))
          : null,
        fullSourceTexts: corpusRegistry.cbetaT29BoundaryAudit.newFullSourceTexts,
        partialSourceWitnesses: corpusRegistry.cbetaT29BoundaryAudit.newPartialSourceWitnesses,
        verifiedSameWorkExpressions: corpusRegistry.cbetaT29BoundaryAudit.verifiedSameWorkExpressions,
        verifiedPartialWorkWitnesses: corpusRegistry.cbetaT29BoundaryAudit.verifiedPartialWorkWitnesses,
        verifiedEditionWitnesses: corpusRegistry.cbetaT29BoundaryAudit.verifiedEditionWitnesses,
        attributionBoundaryRecords: corpusRegistry.cbetaT29BoundaryAudit.attributionBoundaryRecords,
        relationAnnotatedRecords: corpusRegistry.cbetaT29BoundaryAudit.relationAnnotatedRecords,
        newWorks: corpusRegistry.cbetaT29BoundaryAudit.newWorks,
        controlledWorks: corpusRegistry.cbetaT29BoundaryAudit.controlledWorks,
        unit: "CBETA 固定提交大正藏 T29 毘昙部来源记录",
        caveat: corpusRegistry.cbetaT29BoundaryAudit.caveat,
      },
      chineseT30SourceRecords: {
        denominator: chineseT30Denominator,
        controlled: chineseT30Controlled,
        percentage: chineseT30Denominator && chineseT30Controlled !== null
          ? Number(((chineseT30Controlled / chineseT30Denominator) * 100).toFixed(2))
          : null,
        fullSourceTexts: corpusRegistry.cbetaT30BoundaryAudit.newFullSourceTexts,
        partialSourceWitnesses: corpusRegistry.cbetaT30BoundaryAudit.newPartialSourceWitnesses,
        verifiedSameWorkExpressions: corpusRegistry.cbetaT30BoundaryAudit.verifiedSameWorkExpressions,
        verifiedPartialWorkWitnesses: corpusRegistry.cbetaT30BoundaryAudit.verifiedPartialWorkWitnesses,
        verifiedSplitWorkWitnesses: corpusRegistry.cbetaT30BoundaryAudit.verifiedSplitWorkWitnesses,
        verifiedEditionWitnesses: corpusRegistry.cbetaT30BoundaryAudit.verifiedEditionWitnesses,
        attributionBoundaryRecords: corpusRegistry.cbetaT30BoundaryAudit.attributionBoundaryRecords,
        relationAnnotatedRecords: corpusRegistry.cbetaT30BoundaryAudit.relationAnnotatedRecords,
        newWorks: corpusRegistry.cbetaT30BoundaryAudit.newWorks,
        controlledWorks: corpusRegistry.cbetaT30BoundaryAudit.controlledWorks,
        unit: "CBETA 固定提交大正藏 T30 中观与瑜伽部来源记录",
        caveat: corpusRegistry.cbetaT30BoundaryAudit.caveat,
      },
      chineseT31SourceRecords: {
        denominator: chineseT31Denominator,
        controlled: chineseT31Controlled,
        percentage: chineseT31Denominator && chineseT31Controlled !== null
          ? Number(((chineseT31Controlled / chineseT31Denominator) * 100).toFixed(2))
          : null,
        fullSourceTexts: corpusRegistry.cbetaT31BoundaryAudit.newFullSourceTexts,
        partialSourceWitnesses: corpusRegistry.cbetaT31BoundaryAudit.newPartialSourceWitnesses,
        verifiedSameWorkExpressions: corpusRegistry.cbetaT31BoundaryAudit.verifiedSameWorkExpressions,
        verifiedPartialWorkWitnesses: corpusRegistry.cbetaT31BoundaryAudit.verifiedPartialWorkWitnesses,
        verifiedSplitWorkWitnesses: corpusRegistry.cbetaT31BoundaryAudit.verifiedSplitWorkWitnesses,
        verifiedEditionWitnesses: corpusRegistry.cbetaT31BoundaryAudit.verifiedEditionWitnesses,
        attributionBoundaryRecords: corpusRegistry.cbetaT31BoundaryAudit.attributionBoundaryRecords,
        relationAnnotatedRecords: corpusRegistry.cbetaT31BoundaryAudit.relationAnnotatedRecords,
        newWorks: corpusRegistry.cbetaT31BoundaryAudit.newWorks,
        controlledWorks: corpusRegistry.cbetaT31BoundaryAudit.controlledWorks,
        unit: "CBETA 固定提交大正藏 T31 瑜伽部来源记录",
        caveat: corpusRegistry.cbetaT31BoundaryAudit.caveat,
      },
      chineseT32SourceRecords: {
        denominator: chineseT32Denominator,
        controlled: chineseT32Controlled,
        percentage: chineseT32Denominator && chineseT32Controlled !== null
          ? Number(((chineseT32Controlled / chineseT32Denominator) * 100).toFixed(2))
          : null,
        fullSourceTexts: corpusRegistry.cbetaT32BoundaryAudit.newFullSourceTexts,
        partialSourceWitnesses: corpusRegistry.cbetaT32BoundaryAudit.newPartialSourceWitnesses,
        verifiedSameWorkExpressions: corpusRegistry.cbetaT32BoundaryAudit.verifiedSameWorkExpressions,
        verifiedPartialWorkWitnesses: corpusRegistry.cbetaT32BoundaryAudit.verifiedPartialWorkWitnesses,
        verifiedSplitWorkWitnesses: corpusRegistry.cbetaT32BoundaryAudit.verifiedSplitWorkWitnesses,
        verifiedEditionWitnesses: corpusRegistry.cbetaT32BoundaryAudit.verifiedEditionWitnesses,
        attributionBoundaryRecords: corpusRegistry.cbetaT32BoundaryAudit.attributionBoundaryRecords,
        relationAnnotatedRecords: corpusRegistry.cbetaT32BoundaryAudit.relationAnnotatedRecords,
        newWorks: corpusRegistry.cbetaT32BoundaryAudit.newWorks,
        controlledWorks: corpusRegistry.cbetaT32BoundaryAudit.controlledWorks,
        unit: "CBETA 固定提交大正藏 T32 论集部来源记录",
        caveat: corpusRegistry.cbetaT32BoundaryAudit.caveat,
      },
      chineseT33SourceRecords: {
        denominator: chineseT33Denominator,
        controlled: chineseT33Controlled,
        percentage: chineseT33Denominator && chineseT33Controlled !== null
          ? Number(((chineseT33Controlled / chineseT33Denominator) * 100).toFixed(2))
          : null,
        fullSourceTexts: corpusRegistry.cbetaT33BoundaryAudit.newFullSourceTexts,
        partialSourceWitnesses: corpusRegistry.cbetaT33BoundaryAudit.newPartialSourceWitnesses,
        verifiedSameWorkExpressions: corpusRegistry.cbetaT33BoundaryAudit.verifiedSameWorkExpressions,
        verifiedPartialWorkWitnesses: corpusRegistry.cbetaT33BoundaryAudit.verifiedPartialWorkWitnesses,
        verifiedSplitWorkWitnesses: corpusRegistry.cbetaT33BoundaryAudit.verifiedSplitWorkWitnesses,
        verifiedEditionWitnesses: corpusRegistry.cbetaT33BoundaryAudit.verifiedEditionWitnesses,
        attributionBoundaryRecords: corpusRegistry.cbetaT33BoundaryAudit.attributionBoundaryRecords,
        relationAnnotatedRecords: corpusRegistry.cbetaT33BoundaryAudit.relationAnnotatedRecords,
        newWorks: corpusRegistry.cbetaT33BoundaryAudit.newWorks,
        controlledWorks: corpusRegistry.cbetaT33BoundaryAudit.controlledWorks,
        subcommentaryGroups: corpusRegistry.cbetaT33BoundaryAudit.subcommentaryGroups.length,
        unit: "CBETA 固定提交大正藏 T33 经疏部来源记录",
        caveat: corpusRegistry.cbetaT33BoundaryAudit.caveat,
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
        caveat: "固定提交中的 7,288 个巴利 root 物理文件已全部受控：经藏 5,764 份、律藏 422 份、论藏 1,102 份分别统计。100% 是固定来源内文件完整性，不是作品去重率或全球佛典覆盖率。",
      },
      suttacentralPaliVinayaRoot: {
        denominator: corpusRegistry.suttacentralVinayaRootRightsAudit.filesAudited,
        controlled: vinayaControlledRootRecords,
        percentage: corpusRegistry.suttacentralVinayaRootRightsAudit.filesAudited && vinayaControlledRootRecords !== null
          ? Number(((vinayaControlledRootRecords / corpusRegistry.suttacentralVinayaRootRightsAudit.filesAudited) * 100).toFixed(2))
          : null,
        controlledBytes: vinayaControlledRootBytes,
        controlledWorks: vinayaControlledWorks,
        controlledExpressions: vinayaControlledExpressions,
        stableSegments: vinayaControlledStableSegments,
        omittedEmptySegments: corpusRegistry.suttacentralVinayaRootRightsAudit.omittedEmptySegments,
        filesApprovedForReadingAndRetrieval: corpusRegistry.suttacentralVinayaRootRightsAudit.filesApprovedForReadingAndRetrieval,
        filesApprovedForModelTraining: corpusRegistry.suttacentralVinayaRootRightsAudit.filesApprovedForModelTraining,
        rightsAuditSha256: corpusRegistry.suttacentralVinayaRootRightsAudit.sha256,
        unit: "SuttaCentral 固定提交 root/pli/ms/vinaya 目录物理记录",
        caveat: "422 份物理 root 已逐文件受控，并按戒本、经分别、犍度、附随六个书级集合登记为六个表达；文件数不等于作品数，且不包含任何第三方译文或训练授权。",
      },
      suttacentralPaliAbhidhammaRoot: {
        denominator: corpusRegistry.suttacentralAbhidhammaRootRightsAudit.filesAudited,
        controlled: abhidhammaControlledRootRecords,
        percentage: corpusRegistry.suttacentralAbhidhammaRootRightsAudit.filesAudited && abhidhammaControlledRootRecords !== null
          ? Number(((abhidhammaControlledRootRecords / corpusRegistry.suttacentralAbhidhammaRootRightsAudit.filesAudited) * 100).toFixed(2))
          : null,
        controlledBytes: abhidhammaControlledRootBytes,
        controlledWorks: abhidhammaControlledWorks,
        controlledExpressions: abhidhammaControlledExpressions,
        stableSegments: abhidhammaControlledStableSegments,
        omittedEmptySegments: corpusRegistry.suttacentralAbhidhammaRootRightsAudit.omittedEmptySegments,
        filesApprovedForReadingAndRetrieval: corpusRegistry.suttacentralAbhidhammaRootRightsAudit.filesApprovedForReadingAndRetrieval,
        filesApprovedForModelTraining: corpusRegistry.suttacentralAbhidhammaRootRightsAudit.filesApprovedForModelTraining,
        rightsAuditSha256: corpusRegistry.suttacentralAbhidhammaRootRightsAudit.sha256,
        unit: "SuttaCentral 固定提交 root/pli/ms/abhidhamma 目录物理记录",
        caveat: "1,102 份物理 root 已逐文件受控，并按上座部论藏七论登记为七个书级表达；章节文件不等于作品，论藏属于佛教经典但不据此标作佛陀逐字亲说。",
      },
      suttacentralIndicRoots: {
        controlledWorks: indicControlledWorks,
        controlledExpressions: indicControlledExpressions,
        controlledRootRecords: indicControlledRootRecords,
        controlledRootBytes: indicControlledRootBytes,
        stableSegments: indicControlledStableSegments,
        filesApprovedForReadingAndRetrieval: corpusRegistry.suttacentralIndicRootRightsAudit.filesApprovedForReadingAndRetrieval,
        filesApprovedForModelTraining: corpusRegistry.suttacentralIndicRootRightsAudit.filesApprovedForModelTraining,
        sanskritRootFiles: corpusRegistry.suttacentralIndicRootRightsAudit.sanskritRootFiles,
        prakritRootFiles: corpusRegistry.suttacentralIndicRootRightsAudit.prakritRootFiles,
        omittedEmptyEditorialPlaceholderSegments: corpusRegistry.suttacentralIndicRootRightsAudit.omittedEmptyEditorialPlaceholderSegments,
        rightsAuditSha256: corpusRegistry.suttacentralIndicRootRightsAudit.sha256,
        unit: "SuttaCentral 固定提交中的梵文与俗语 root 原文",
        caveat: "2 份梵文与 22 份俗语物理文件合并为 3 个文本表达。官方许可政策将佛教原语文本列为公共领域；第三方译文未导入，正文不得用于模型训练。物理文件数和题名相似不能替代作品级校勘。",
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
      multiEditionTibetanCatalogs: {
        configuredCatalogs: rktsConfiguredCatalogs,
        availableCatalogs: rktsAvailableCatalogs,
        missingConfiguredCatalogs: rktsMissingConfiguredCatalogs,
        itemRecords: rktsCandidateItemRecords,
        sourceBytes: rktsCandidateBytes,
        inventorySha256: rktsSourceInventory && "inventorySha256" in rktsSourceInventory
          ? rktsSourceInventory.inventorySha256
          : null,
        license: rktsSourceInventory && "rights" in rktsSourceInventory && rktsSourceInventory.rights && "license" in rktsSourceInventory.rights
          ? rktsSourceInventory.rights.license
          : null,
        unit: "rKTs 固定迁移配置中的甘珠尔版本、合集与残片目录 item",
        caveat: "19 个可用目录的 15,069 条 item 会大量跨版本重复，并混合完整版本、合集和残片；Charang/Cx 配置路径在固定提交中缺失。它们不能与 BDRC 德格表达式或其他目录相加为作品分母。",
      },
      rktsKernelAlignment: {
        kernelItemRecords: corpusRegistry.rktsKernelAlignmentAudit.kernelItemRecords,
        kernelUniqueIds: corpusRegistry.rktsKernelAlignmentAudit.kernelUniqueIds,
        duplicateKernelIdGroups: corpusRegistry.rktsKernelAlignmentAudit.duplicateKernelIdGroups,
        exactKernelIds: corpusRegistry.rktsKernelAlignmentAudit.exactKernelIds,
        exactKernelIdsInOneCatalog: corpusRegistry.rktsKernelAlignmentAudit.exactKernelIdsInOneCatalog,
        exactKernelIdsInTwoOrMoreCatalogs: corpusRegistry.rktsKernelAlignmentAudit.exactKernelIdsInTwoOrMoreCatalogs,
        exactKernelIdsInEightOrMoreCatalogs: corpusRegistry.rktsKernelAlignmentAudit.exactKernelIdsInEightOrMoreCatalogs,
        unlinkedKernelIds: corpusRegistry.rktsKernelAlignmentAudit.unlinkedKernelIds,
        unresolvedNormalizedIds: corpusRegistry.rktsKernelAlignmentAudit.unresolvedNormalizedIds,
        denominatorImpact: corpusRegistry.rktsKernelAlignmentAudit.denominatorImpact,
        sha256: corpusRegistry.rktsKernelAlignmentAudit.sha256,
        unit: "固定 rKTs kernel 编号与 19 个可用目录之间的候选标识连接",
        caveat: corpusRegistry.rktsKernelAlignmentAudit.warning,
      },
      sanskritCatalogs: {
        dsbcCatalogRecords,
        dsbcSutrapitakaRecords,
        dsbcVinayapitakaRecords,
        dsbcSastrapitakaRecords,
        gretilPhysicalFiles,
        gretilBytes,
        gretilRightsAuditedFiles: corpusRegistry.gretilFileRightsAudit.filesAudited,
        gretilFilesMarkedReferenceOnly: corpusRegistry.gretilFileRightsAudit.filesMarkedReferenceOnly,
        gretilFilesWithDsbcPermissionStatement: corpusRegistry.gretilFileRightsAudit.filesWithDsbcPermissionStatement,
        gretilFilesWithExplicitCopyrightNotice: corpusRegistry.gretilFileRightsAudit.filesWithExplicitCopyrightNotice,
        gretilFilesWithExplicitOpenLicense: corpusRegistry.gretilFileRightsAudit.filesWithExplicitOpenLicense,
        gretilFilesApprovedForRepublication: corpusRegistry.gretilFileRightsAudit.filesApprovedForRepublication,
        gretilFilesRestrictedToMetadataAndExternalLink: corpusRegistry.gretilFileRightsAudit.filesRestrictedToMetadataAndExternalLink,
        controlledSuttacentralIndicWorks: indicControlledWorks,
        controlledSuttacentralIndicExpressions: indicControlledExpressions,
        controlledSuttacentralIndicRootFiles: indicControlledRootRecords,
        controlledSuttacentralIndicRootBytes: indicControlledRootBytes,
        controlledSuttacentralIndicStableSegments: indicControlledStableSegments,
        suttacentralIndicRightsAuditSha256: corpusRegistry.suttacentralIndicRootRightsAudit.sha256,
        gretilRightsAuditSha256: corpusRegistry.gretilFileRightsAudit.sha256,
        dsbcInventorySha256: dsbcSourceInventory && "inventorySha256" in dsbcSourceInventory
          ? dsbcSourceInventory.inventorySha256
          : null,
        gretilInventorySha256: gretilSourceInventory && "inventorySha256" in gretilSourceInventory
          ? gretilSourceInventory.inventorySha256
          : null,
        unit: "DSBC、GRETIL 梵文候选与 SuttaCentral 受控印度语原文",
        caveat: "DSBC 的 486 条目录记录与 GRETIL 的 417 个物理文件可能互相重叠，也包含同作品多版本、分卷、律藏、密续与论疏。GRETIL 0 份获准镜像；SuttaCentral 的 24 份公有领域 root 已作为 3 个表达受控。它们都不相加为全球作品分母。",
      },
      crossCatalogAlignment: {
        curatedRelationGroups: corpusRegistry.crossCatalogAlignmentAudit.curatedRelationGroups,
        curatedRelationGroupsWithIdentifierJoin: corpusRegistry.crossCatalogAlignmentAudit.curatedRelationGroupsWithIdentifierJoin,
        relationGroupsRequiringManualReview: corpusRegistry.crossCatalogAlignmentAudit.relationGroupsRequiringManualReview,
        gbcrWorksReferenced: corpusRegistry.crossCatalogAlignmentAudit.gbcrWorksReferenced,
        cbetaCitationIdentifiers: corpusRegistry.crossCatalogAlignmentAudit.cbetaCitationIdentifiers,
        tohCitationIdentifiers: corpusRegistry.crossCatalogAlignmentAudit.tohCitationIdentifiers,
        uniqueTohBaseIdentifiers: corpusRegistry.crossCatalogAlignmentAudit.uniqueTohBaseIdentifiers,
        matchedDergeExpressions: corpusRegistry.crossCatalogAlignmentAudit.matchedDergeExpressions,
        matchedBdrcAbstractWorkIds: corpusRegistry.crossCatalogAlignmentAudit.matchedBdrcAbstractWorkIds,
        unmatchedTohBaseIdentifiers: corpusRegistry.crossCatalogAlignmentAudit.unmatchedTohBaseIdentifiers,
        denominatorImpact: corpusRegistry.crossCatalogAlignmentAudit.denominatorImpact,
        sha256: corpusRegistry.crossCatalogAlignmentAudit.sha256,
        unit: "已有人工证据的 GBCR 关系组、84000 Toh 引用与固定德格表达式",
        caveat: corpusRegistry.crossCatalogAlignmentAudit.warning,
      },
      suttacentralChineseParallelEvidence: {
        upstreamRows: corpusRegistry.suttacentralChineseParallelAudit.sourceRows,
        relevantDirectedRows: corpusRegistry.suttacentralChineseParallelAudit.relevantDirectedRows,
        deduplicatedParallelEdges: corpusRegistry.suttacentralChineseParallelAudit.deduplicatedParallelEdges,
        duplicateDirectionsRemoved: corpusRegistry.suttacentralChineseParallelAudit.duplicateDirectionsRemoved,
        decisionClasses: corpusRegistry.suttacentralChineseParallelAudit.decisionClasses,
        upstreamTypes: corpusRegistry.suttacentralChineseParallelAudit.upstreamTypes,
        resemblingEdges: corpusRegistry.suttacentralChineseParallelAudit.resemblingEdges,
        edgesWithRemarks: corpusRegistry.suttacentralChineseParallelAudit.edgesWithRemarks,
        paliWorksReferenced: corpusRegistry.suttacentralChineseParallelAudit.paliWorksReferenced,
        chineseWorksReferenced: corpusRegistry.suttacentralChineseParallelAudit.chineseWorksReferenced,
        directTaishoWorksReferenced: corpusRegistry.suttacentralChineseParallelAudit.directTaishoWorksReferenced,
        agamaContainerWorksReferenced: corpusRegistry.suttacentralChineseParallelAudit.agamaContainerWorksReferenced,
        denominatorImpact: corpusRegistry.suttacentralChineseParallelAudit.denominatorImpact,
        sha256: corpusRegistry.suttacentralChineseParallelAudit.sha256,
        unit: "SuttaCentral 固定关系表中与站内巴利及汉译作品可定位的去重证据边",
        caveat: corpusRegistry.suttacentralChineseParallelAudit.warning,
      },
      suttacentralParallelReviewQueue: {
        queueItems: corpusRegistry.suttacentralParallelReviewQueue.queueItems,
        p0ScopeCaveatOrCounterevidence: corpusRegistry.suttacentralParallelReviewQueue.p0ScopeCaveatOrCounterevidence,
        p1UpstreamFullStandalonePairs: corpusRegistry.suttacentralParallelReviewQueue.p1UpstreamFullStandalonePairs,
        assignedItems: corpusRegistry.suttacentralParallelReviewQueue.assignedItems,
        completedIndependentReviews: corpusRegistry.suttacentralParallelReviewQueue.completedIndependentReviews,
        adjudicatedItems: corpusRegistry.suttacentralParallelReviewQueue.adjudicatedItems,
        automaticMerges: corpusRegistry.suttacentralParallelReviewQueue.automaticMerges,
        minimumIndependentReviews: corpusRegistry.suttacentralParallelReviewQueue.minimumIndependentReviews,
        denominatorImpact: corpusRegistry.suttacentralParallelReviewQueue.denominatorImpact,
        sha256: corpusRegistry.suttacentralParallelReviewQueue.sha256,
        unit: "需由两名独立复核者完成证据核对并在分歧时仲裁的汉—巴作品关系候选",
        caveat: corpusRegistry.suttacentralParallelReviewQueue.warning,
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

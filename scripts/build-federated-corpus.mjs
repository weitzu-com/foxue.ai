import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const inputs = {
  base: "data/gbcr/registry-v2.1.0.json",
  snapshots: "data/gbcr/source-snapshots-v2.4.0.json",
  inventory: "data/gbcr/cbeta-taisho-sutra-inventory-v0.2.1.json",
  t18Inventory: "data/gbcr/cbeta-taisho-t18-inventory-v0.1.0.json",
  t19Inventory: "data/gbcr/cbeta-taisho-t19-inventory-v0.1.0.json",
  t20Inventory: "data/gbcr/cbeta-taisho-t20-inventory-v0.1.0.json",
  t21Inventory: "data/gbcr/cbeta-taisho-t21-inventory-v0.1.0.json",
  t22Inventory: "data/gbcr/cbeta-taisho-t22-inventory-v0.1.0.json",
  t23Inventory: "data/gbcr/cbeta-taisho-t23-inventory-v0.1.0.json",
  t24Inventory: "data/gbcr/cbeta-taisho-t24-inventory-v0.1.0.json",
  t25Inventory: "data/gbcr/cbeta-taisho-t25-inventory-v0.1.0.json",
  t26Inventory: "data/gbcr/cbeta-taisho-t26-inventory-v0.1.0.json",
  t27Inventory: "data/gbcr/cbeta-taisho-t27-inventory-v0.1.0.json",
  t28Inventory: "data/gbcr/cbeta-taisho-t28-inventory-v0.1.0.json",
  t29Inventory: "data/gbcr/cbeta-taisho-t29-inventory-v0.1.0.json",
  t30Inventory: "data/gbcr/cbeta-taisho-t30-inventory-v0.1.0.json",
  t31Inventory: "data/gbcr/cbeta-taisho-t31-inventory-v0.1.0.json",
  t32Inventory: "data/gbcr/cbeta-taisho-t32-inventory-v0.1.0.json",
  t33Inventory: "data/gbcr/cbeta-taisho-t33-inventory-v0.1.0.json",
  t34Inventory: "data/gbcr/cbeta-taisho-t34-inventory-v0.1.0.json",
  t35Inventory: "data/gbcr/cbeta-taisho-t35-inventory-v0.1.0.json",
  t36Inventory: "data/gbcr/cbeta-taisho-t36-inventory-v0.1.0.json",
  dergeInventory: "data/gbcr/bdrc-derge-kangyur-inventory-v0.3.0.json",
  rights84000: "data/gbcr/84000-rights-policy-v0.3.0.json",
  sanskritEvidence: "data/gbcr/dsbc-gretil-source-snapshot-v0.4.0.json",
  sanskritRights: "data/gbcr/sanskrit-rights-policy-v0.4.0.json",
  gretilFileRightsAudit: "data/gbcr/gretil-sanskrit-file-rights-audit-v0.7.0.json",
  suttacentralIndicRightsAudit: "data/gbcr/suttacentral-indic-root-rights-audit-v0.8.0.json",
  suttacentralVinayaRightsAudit: "data/gbcr/suttacentral-vinaya-root-rights-audit-v0.9.0.json",
  suttacentralAbhidhammaRightsAudit: "data/gbcr/suttacentral-abhidhamma-root-rights-audit-v1.0.0.json",
  suttacentralChineseParallels: "data/gbcr/suttacentral-chinese-parallels-v0.7.0.json",
  suttacentralParallelReviewQueue: "data/gbcr/suttacentral-parallel-review-queue-v0.1.0.json",
  suttacentralParallelP0EvidencePackets: "data/gbcr/suttacentral-parallel-p0-evidence-packets-v0.1.0.json",
  crossCatalogAlignments: "data/gbcr/cross-catalog-alignments-v0.5.0.json",
  rktsEvidence: "data/gbcr/rkts-kangyur-catalog-snapshot-v0.5.0.json",
  rktsKernelAlignments: "data/gbcr/rkts-kernel-alignment-audit-v0.6.0.json",
  cbetaT12Batch: "data/corpus/cbeta/batch-v1.9.0.json",
  cbetaT13Batch: "data/corpus/cbeta/batch-v2.0.0.json",
  cbetaT14Batch: "data/corpus/cbeta/batch-v2.1.0.json",
  cbetaT15Batch: "data/corpus/cbeta/batch-v2.2.0.json",
  cbetaT16Batch: "data/corpus/cbeta/batch-v2.3.0.json",
  cbetaT17Batch: "data/corpus/cbeta/batch-v2.4.0.json",
  cbetaT18Batch: "data/corpus/cbeta/batch-v2.5.0.json",
  cbetaT19Batch: "data/corpus/cbeta/batch-v2.6.0.json",
  cbetaT20Batch: "data/corpus/cbeta/batch-v2.7.0.json",
  cbetaT21Batch: "data/corpus/cbeta/batch-v2.8.0.json",
  cbetaT22Batch: "data/corpus/cbeta/batch-v2.9.0.json",
  cbetaT23Batch: "data/corpus/cbeta/batch-v3.0.0.json",
  cbetaT24Batch: "data/corpus/cbeta/batch-v3.1.0.json",
  cbetaT25Batch: "data/corpus/cbeta/batch-v3.2.0.json",
  cbetaT26Batch: "data/corpus/cbeta/batch-v3.3.0.json",
  cbetaT27Batch: "data/corpus/cbeta/batch-v3.4.0.json",
  cbetaT28Batch: "data/corpus/cbeta/batch-v3.5.0.json",
  cbetaT29Batch: "data/corpus/cbeta/batch-v3.6.0.json",
  cbetaT30Batch: "data/corpus/cbeta/batch-v3.7.0.json",
  cbetaT31Batch: "data/corpus/cbeta/batch-v3.8.0.json",
  cbetaT32Batch: "data/corpus/cbeta/batch-v3.9.0.json",
  cbetaT33Batch: "data/corpus/cbeta/batch-v4.0.0.json",
  cbetaT34Batch: "data/corpus/cbeta/batch-v4.1.0.json",
  cbetaT35Batch: "data/corpus/cbeta/batch-v4.2.0.json",
  cbetaBatch: "data/corpus/cbeta/batch-v4.3.0.json",
  cbetaCatalog: "data/corpus/cbeta/catalog-v4.3.0.json",
  cbetaManifest: "data/corpus/cbeta/manifest-v4.3.0.json",
  cbetaRegistry: "data/gbcr/registry-cbeta-v4.3.0.json",
  dhammapadaBatch: "data/corpus/suttacentral/batch-v0.7.0.json",
  dhammapadaManifest: "data/corpus/suttacentral/manifest-v0.7.0.json",
  dighaBatch: "data/corpus/suttacentral/dn-batch-v0.8.0.json",
  dighaManifest: "data/corpus/suttacentral/dn-manifest-v0.8.0.json",
  majjhimaBatch: "data/corpus/suttacentral/mn-batch-v0.9.0.json",
  majjhimaManifest: "data/corpus/suttacentral/mn-manifest-v0.9.0.json",
  samyuttaBatch: "data/corpus/suttacentral/sn-batch-v1.0.0.json",
  samyuttaManifest: "data/corpus/suttacentral/sn-manifest-v1.0.0.json",
  anguttaraBatch: "data/corpus/suttacentral/an-batch-v1.1.0.json",
  anguttaraManifest: "data/corpus/suttacentral/an-manifest-v1.1.0.json",
  khuddakaBatch: "data/corpus/suttacentral/kn-batch-v1.2.0.json",
  khuddakaManifest: "data/corpus/suttacentral/kn-manifest-v1.2.0.json",
  indicBatch: "data/corpus/suttacentral/indic-batch-v1.3.0.json",
  indicManifest: "data/corpus/suttacentral/indic-manifest-v1.3.0.json",
  vinayaBatch: "data/corpus/suttacentral/vinaya-batch-v1.4.0.json",
  vinayaManifest: "data/corpus/suttacentral/vinaya-manifest-v1.4.0.json",
  abhidhammaBatch: "data/corpus/suttacentral/abhidhamma-batch-v1.5.0.json",
  abhidhammaManifest: "data/corpus/suttacentral/abhidhamma-manifest-v1.5.0.json",
};
const entries = await Promise.all(Object.entries(inputs).map(async ([id, relativePath]) => [
  id,
  relativePath,
  await readFile(resolve(root, relativePath), "utf8"),
]));
const rawById = Object.fromEntries(entries.map(([id, , raw]) => [id, raw]));
const base = JSON.parse(rawById.base);
const snapshots = JSON.parse(rawById.snapshots);
const dergeInventory = JSON.parse(rawById.dergeInventory);
const rights84000 = JSON.parse(rawById.rights84000);
const sanskritEvidence = JSON.parse(rawById.sanskritEvidence);
const sanskritRights = JSON.parse(rawById.sanskritRights);
const gretilFileRightsAudit = JSON.parse(rawById.gretilFileRightsAudit);
const suttacentralIndicRightsAudit = JSON.parse(rawById.suttacentralIndicRightsAudit);
const suttacentralVinayaRightsAudit = JSON.parse(rawById.suttacentralVinayaRightsAudit);
const suttacentralAbhidhammaRightsAudit = JSON.parse(rawById.suttacentralAbhidhammaRightsAudit);
const suttacentralChineseParallels = JSON.parse(rawById.suttacentralChineseParallels);
const suttacentralParallelReviewQueue = JSON.parse(rawById.suttacentralParallelReviewQueue);
const suttacentralParallelP0EvidencePackets = JSON.parse(rawById.suttacentralParallelP0EvidencePackets);
const crossCatalogAlignments = JSON.parse(rawById.crossCatalogAlignments);
const rktsEvidence = JSON.parse(rawById.rktsEvidence);
const rktsKernelAlignments = JSON.parse(rawById.rktsKernelAlignments);
const cbetaT18Batch = JSON.parse(rawById.cbetaT18Batch);
const cbetaT19Batch = JSON.parse(rawById.cbetaT19Batch);
const cbetaT20Batch = JSON.parse(rawById.cbetaT20Batch);
const cbetaT21Batch = JSON.parse(rawById.cbetaT21Batch);
const cbetaT22Batch = JSON.parse(rawById.cbetaT22Batch);
const cbetaT23Batch = JSON.parse(rawById.cbetaT23Batch);
const cbetaT24Batch = JSON.parse(rawById.cbetaT24Batch);
const cbetaT25Batch = JSON.parse(rawById.cbetaT25Batch);
const cbetaT26Batch = JSON.parse(rawById.cbetaT26Batch);
const cbetaT27Batch = JSON.parse(rawById.cbetaT27Batch);
const cbetaT28Batch = JSON.parse(rawById.cbetaT28Batch);
const cbetaT29Batch = JSON.parse(rawById.cbetaT29Batch);
const cbetaT30Batch = JSON.parse(rawById.cbetaT30Batch);
const cbetaT31Batch = JSON.parse(rawById.cbetaT31Batch);
const cbetaT32Batch = JSON.parse(rawById.cbetaT32Batch);
const cbetaT33Batch = JSON.parse(rawById.cbetaT33Batch);
const cbetaT34Batch = JSON.parse(rawById.cbetaT34Batch);
const cbetaT35Batch = JSON.parse(rawById.cbetaT35Batch);
const cbetaBatch = JSON.parse(rawById.cbetaBatch);
const cbetaCatalog = JSON.parse(rawById.cbetaCatalog);
const cbetaManifest = JSON.parse(rawById.cbetaManifest);
const cbetaRegistry = JSON.parse(rawById.cbetaRegistry);
const dighaBatch = JSON.parse(rawById.dighaBatch);
const dighaManifest = JSON.parse(rawById.dighaManifest);
const majjhimaBatch = JSON.parse(rawById.majjhimaBatch);
const majjhimaManifest = JSON.parse(rawById.majjhimaManifest);
const samyuttaBatch = JSON.parse(rawById.samyuttaBatch);
const samyuttaManifest = JSON.parse(rawById.samyuttaManifest);
const anguttaraBatch = JSON.parse(rawById.anguttaraBatch);
const anguttaraManifest = JSON.parse(rawById.anguttaraManifest);
const khuddakaBatch = JSON.parse(rawById.khuddakaBatch);
const khuddakaManifest = JSON.parse(rawById.khuddakaManifest);
const indicBatch = JSON.parse(rawById.indicBatch);
const indicManifest = JSON.parse(rawById.indicManifest);
const vinayaBatch = JSON.parse(rawById.vinayaBatch);
const vinayaManifest = JSON.parse(rawById.vinayaManifest);
const abhidhammaBatch = JSON.parse(rawById.abhidhammaBatch);
const abhidhammaManifest = JSON.parse(rawById.abhidhammaManifest);
const outputPath = resolve(root, "data/gbcr/registry-v5.4.0.json");
const checksumPath = resolve(root, "data/gbcr/checksums-v5.4.0.sha256");
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

if (
  dighaManifest.source.commit !== dighaBatch.source.commit ||
  dighaManifest.files.length !== 34 ||
  dighaManifest.collection.stableSegments !== 16401 ||
  dighaManifest.collection.sourceBytes !== 1820223
) {
  throw new Error("SuttaCentral 《长部》固定批次、清单或结构统计不一致");
}
if (
  majjhimaManifest.source.commit !== majjhimaBatch.source.commit ||
  majjhimaManifest.source.commit !== dighaManifest.source.commit ||
  majjhimaManifest.files.length !== 152 ||
  majjhimaManifest.collection.stableSegments !== 27195 ||
  majjhimaManifest.collection.sourceBytes !== 3072235
) {
  throw new Error("SuttaCentral 《中部》固定批次、清单或结构统计不一致");
}
if (
  samyuttaManifest.source.commit !== samyuttaBatch.source.commit ||
  samyuttaManifest.source.commit !== dighaManifest.source.commit ||
  samyuttaManifest.files.length !== 56 ||
  samyuttaManifest.collection.recordCount !== 1819 ||
  samyuttaManifest.collection.representedSuttas !== 3024 ||
  samyuttaManifest.collection.stableSegments !== 43466 ||
  samyuttaManifest.collection.sourceBytes !== 3765299 ||
  samyuttaManifest.collection.emptySegmentIds !== 2
) {
  throw new Error("SuttaCentral 《相应部》固定批次、清单或结构统计不一致");
}
if (
  anguttaraManifest.source.commit !== anguttaraBatch.source.commit ||
  anguttaraManifest.source.commit !== dighaManifest.source.commit ||
  anguttaraManifest.files.length !== 11 ||
  anguttaraManifest.collection.recordCount !== 1408 ||
  anguttaraManifest.collection.representedSuttas !== 8122 ||
  anguttaraManifest.collection.stableSegments !== 41839 ||
  anguttaraManifest.collection.sourceBytes !== 4074931 ||
  anguttaraManifest.collection.emptySegmentIds !== 4
) {
  throw new Error("SuttaCentral 《增支部》固定批次、清单或结构统计不一致");
}
if (
  khuddakaManifest.source.commit !== khuddakaBatch.source.commit ||
  khuddakaManifest.source.commit !== dighaManifest.source.commit ||
  khuddakaManifest.files.length !== 19 ||
  khuddakaManifest.collection.bookCount !== 20 ||
  khuddakaManifest.collection.newBookCount !== 19 ||
  khuddakaManifest.collection.recordCount !== 2351 ||
  khuddakaManifest.collection.newRecordCount !== 2325 ||
  khuddakaManifest.collection.sourceBytes !== 10053548 ||
  khuddakaManifest.collection.newSourceBytes !== 9953598 ||
  khuddakaManifest.collection.stableSegments !== 155801 ||
  khuddakaManifest.collection.newStableSegments !== 153567
) {
  throw new Error("SuttaCentral 《小部》固定批次、清单或结构统计不一致");
}
if (
  indicManifest.source.commit !== indicBatch.source.commit ||
  indicManifest.source.commit !== khuddakaManifest.source.commit ||
  indicBatch.version !== "1.3.0" || indicManifest.version !== "1.3.0" ||
  indicManifest.files.length !== 3 || indicBatch.files.length !== 24 ||
  indicBatch.collection.workCount !== 3 ||
  indicBatch.collection.sourceRecordCount !== 24 ||
  indicBatch.collection.sourceBytes !== 216385 ||
  indicBatch.collection.sourceSegments !== 1910 ||
  indicBatch.collection.stableSegments !== 1909 ||
  indicBatch.collection.omittedEmptyEditorialPlaceholderSegments !== 1 ||
  suttacentralIndicRightsAudit.version !== "0.8.0" ||
  suttacentralIndicRightsAudit.source?.commit !== indicBatch.source.commit ||
  suttacentralIndicRightsAudit.summary?.filesAudited !== 24 ||
  suttacentralIndicRightsAudit.summary?.filesApprovedForReadingAndRetrieval !== 24 ||
  suttacentralIndicRightsAudit.summary?.filesApprovedForModelTraining !== 0 ||
  suttacentralIndicRightsAudit.summary?.sanskritRootFiles !== 2 ||
  suttacentralIndicRightsAudit.summary?.prakritRootFiles !== 22 ||
  suttacentralIndicRightsAudit.summary?.representedWorks !== 3 ||
  suttacentralIndicRightsAudit.summary?.stableSegments !== 1909 ||
  suttacentralIndicRightsAudit.integrity?.translationBodiesPublished !== false
) throw new Error("SuttaCentral 梵文与俗语 root 权利批次、清单或结构统计不一致");
if (
  vinayaManifest.source.commit !== vinayaBatch.source.commit ||
  vinayaManifest.source.commit !== indicManifest.source.commit ||
  vinayaBatch.version !== "1.4.0" || vinayaManifest.version !== "1.4.0" ||
  vinayaManifest.files.length !== 6 || vinayaBatch.files.length !== 422 ||
  vinayaBatch.collection.workCount !== 6 ||
  vinayaBatch.collection.sourceRecordCount !== 422 ||
  vinayaBatch.collection.sourceBytes !== 6710444 ||
  vinayaBatch.collection.sourceSegments !== 71565 ||
  vinayaBatch.collection.stableSegments !== 71557 ||
  vinayaBatch.collection.omittedEmptySegments !== 8 ||
  suttacentralVinayaRightsAudit.version !== "0.9.0" ||
  suttacentralVinayaRightsAudit.source?.commit !== vinayaBatch.source.commit ||
  suttacentralVinayaRightsAudit.summary?.filesAudited !== 422 ||
  suttacentralVinayaRightsAudit.summary?.filesApprovedForReadingAndRetrieval !== 422 ||
  suttacentralVinayaRightsAudit.summary?.filesApprovedForModelTraining !== 0 ||
  suttacentralVinayaRightsAudit.summary?.representedWorks !== 6 ||
  suttacentralVinayaRightsAudit.summary?.stableSegments !== 71557 ||
  suttacentralVinayaRightsAudit.integrity?.translationBodiesPublished !== false
) throw new Error("SuttaCentral 巴利律藏 root 权利批次、清单或结构统计不一致");
if (
  abhidhammaManifest.source.commit !== abhidhammaBatch.source.commit ||
  abhidhammaManifest.source.commit !== vinayaManifest.source.commit ||
  abhidhammaBatch.version !== "1.5.0" || abhidhammaManifest.version !== "1.5.0" ||
  abhidhammaManifest.files.length !== 7 || abhidhammaBatch.files.length !== 1102 ||
  abhidhammaBatch.collection.workCount !== 7 ||
  abhidhammaBatch.collection.sourceRecordCount !== 1102 ||
  abhidhammaBatch.collection.sourceBytes !== 11192917 ||
  abhidhammaBatch.collection.sourceSegments !== 88414 ||
  abhidhammaBatch.collection.stableSegments !== 88414 ||
  abhidhammaBatch.collection.omittedEmptySegments !== 0 ||
  suttacentralAbhidhammaRightsAudit.version !== "1.0.0" ||
  suttacentralAbhidhammaRightsAudit.source?.commit !== abhidhammaBatch.source.commit ||
  suttacentralAbhidhammaRightsAudit.summary?.filesAudited !== 1102 ||
  suttacentralAbhidhammaRightsAudit.summary?.filesApprovedForReadingAndRetrieval !== 1102 ||
  suttacentralAbhidhammaRightsAudit.summary?.filesApprovedForModelTraining !== 0 ||
  suttacentralAbhidhammaRightsAudit.summary?.representedWorks !== 7 ||
  suttacentralAbhidhammaRightsAudit.summary?.stableSegments !== 88414 ||
  suttacentralAbhidhammaRightsAudit.integrity?.translationBodiesPublished !== false
) throw new Error("SuttaCentral 巴利论藏 root 权利批次、清单或结构统计不一致");
if (
  suttacentralChineseParallels.version !== "0.7.0" ||
  suttacentralChineseParallels.source?.commit !== "80b2a63d8442517c1f8be90c4b597088eb855852" ||
  suttacentralChineseParallels.source?.sha256 !== "8481c812e38d2318a0bf70e9d7ea2320f2fe003e47d121f639966ac107736c80" ||
  suttacentralChineseParallels.summary?.upstreamRows !== 421159 ||
  suttacentralChineseParallels.summary?.relevantDirectedRows !== 10596 ||
  suttacentralChineseParallels.summary?.deduplicatedParallelEdges !== 5161 ||
  suttacentralChineseParallels.summary?.decisionClasses?.full_parallel_without_automatic_work_merge !== 60 ||
  suttacentralChineseParallels.summary?.decisionClasses?.component_parallel_within_registered_work !== 3345 ||
  suttacentralChineseParallels.summary?.decisionClasses?.resembling_or_partial_parallel !== 1130 ||
  suttacentralChineseParallels.summary?.decisionClasses?.citation_or_mention_only !== 626 ||
  suttacentralChineseParallels.summary?.denominatorImpact !== "none" ||
  suttacentralChineseParallels.policy?.automaticWorkMerge !== false ||
  suttacentralChineseParallels.policy?.segmentEquivalenceAsserted !== false
) throw new Error("SuttaCentral 汉巴平行证据账本或作品边界不一致");
if (
  suttacentralParallelReviewQueue.version !== "0.1.0" ||
  suttacentralParallelReviewQueue.generatedFrom?.sha256 !== sha256(rawById.suttacentralChineseParallels) ||
  suttacentralParallelReviewQueue.summary?.queueItems !== 80 ||
  suttacentralParallelReviewQueue.summary?.p0ScopeCaveatOrCounterevidence !== 20 ||
  suttacentralParallelReviewQueue.summary?.p1UpstreamFullStandalonePairs !== 60 ||
  suttacentralParallelReviewQueue.summary?.completedIndependentReviews !== 0 ||
  suttacentralParallelReviewQueue.summary?.adjudicatedItems !== 0 ||
  suttacentralParallelReviewQueue.summary?.automaticMerges !== 0 ||
  suttacentralParallelReviewQueue.summary?.denominatorImpact !== "none" ||
  suttacentralParallelReviewQueue.governance?.minimumIndependentReviews !== 2 ||
  suttacentralParallelReviewQueue.governance?.automaticWorkMerge !== false
) throw new Error("SuttaCentral 汉巴作品裁决队列或双人复核边界不一致");
if (
  suttacentralParallelP0EvidencePackets.version !== "0.1.0" ||
  suttacentralParallelP0EvidencePackets.summary?.packets !== 20 ||
  suttacentralParallelP0EvidencePackets.summary?.exactPaliStandaloneOrSourcePartAssets !== 20 ||
  suttacentralParallelP0EvidencePackets.summary?.exactChineseInternalTeiRangesMachineLocated !== 20 ||
  suttacentralParallelP0EvidencePackets.summary?.chineseInternalRangesPendingHumanBoundaryCheck !== 20 ||
  suttacentralParallelP0EvidencePackets.summary?.automaticWorkMerges !== 0 ||
  suttacentralParallelP0EvidencePackets.summary?.denominatorImpact !== "none"
) throw new Error("SuttaCentral 汉巴 P0 审前证据包边界不一致");
if (
  cbetaT18Batch.version !== "2.5.0" || cbetaT18Batch.files.length !== 76 ||
  cbetaT18Batch.collection.sourceRecordDenominator !== 76 ||
  cbetaT18Batch.collection.controlledSourceRecords !== 76 ||
  cbetaT18Batch.collection.newStableSegments !== 77825
) throw new Error("CBETA T18 固定批次统计不一致");
if (
  cbetaT19Batch.version !== "2.6.0" || cbetaT19Batch.files.length !== 125 ||
  cbetaT19Batch.collection.sourceRecordDenominator !== 126 ||
  cbetaT19Batch.collection.previouslyControlledSourceRecords !== 1 ||
  cbetaT19Batch.collection.controlledSourceRecords !== 126 ||
  cbetaT19Batch.collection.newSourceBytes !== 18161693 ||
  cbetaT19Batch.collection.newStableSegments !== 56685 ||
  cbetaT19Batch.collection.fullSourceTexts !== 120 ||
  cbetaT19Batch.collection.partialSourceWitnesses !== 6 ||
  cbetaT19Batch.collection.verifiedEditionWitnesses !== 8 ||
  cbetaT19Batch.collection.newWorks !== 121
) throw new Error("CBETA T19 固定批次、目录、清单或登记册统计不一致");
if (
  cbetaT20Batch.version !== "2.7.0" || cbetaT20Batch.files.length !== 184 ||
  cbetaT20Batch.collection.sourceRecordDenominator !== 184 ||
  cbetaT20Batch.collection.previouslyControlledSourceRecords !== 0 ||
  cbetaT20Batch.collection.controlledSourceRecords !== 184 ||
  cbetaT20Batch.collection.newSourceBytes !== 24220376 ||
  cbetaT20Batch.collection.newStableSegments !== 76527 ||
  cbetaT20Batch.collection.newFullSourceTexts !== 179 ||
  cbetaT20Batch.collection.newPartialSourceWitnesses !== 5 ||
  cbetaT20Batch.collection.verifiedEditionWitnesses !== 14 ||
  cbetaT20Batch.collection.newWorks !== 177
) throw new Error("CBETA T20 固定批次统计不一致");
if (
  cbetaT21Batch.version !== "2.8.0" || cbetaT21Batch.files.length !== 228 ||
  cbetaT21Batch.collection.sourceRecordDenominator !== 228 ||
  cbetaT21Batch.collection.previouslyControlledSourceRecords !== 0 ||
  cbetaT21Batch.collection.controlledSourceRecords !== 228 ||
  cbetaT21Batch.collection.newSourceBytes !== 21264046 ||
  cbetaT21Batch.collection.newStableSegments !== 78342 ||
  cbetaT21Batch.collection.newFullSourceTexts !== 222 ||
  cbetaT21Batch.collection.newPartialSourceWitnesses !== 6 ||
  cbetaT21Batch.collection.verifiedEditionWitnesses !== 12 ||
  cbetaT21Batch.collection.newWorks !== 222
) throw new Error("CBETA T21 固定批次、目录、清单或登记册统计不一致");
if (
  cbetaT22Batch.version !== "2.9.0" || cbetaT22Batch.files.length !== 15 ||
  cbetaT22Batch.collection.sourceRecordDenominator !== 15 ||
  cbetaT22Batch.collection.previouslyControlledSourceRecords !== 0 ||
  cbetaT22Batch.collection.controlledSourceRecords !== 15 ||
  cbetaT22Batch.collection.newSourceBytes !== 24063535 ||
  cbetaT22Batch.collection.newStableSegments !== 91307 ||
  cbetaT22Batch.collection.newFullSourceTexts !== 15 ||
  cbetaT22Batch.collection.newPartialSourceWitnesses !== 0 ||
  cbetaT22Batch.collection.verifiedEditionWitnesses !== 2 ||
  cbetaT22Batch.collection.newWorks !== 14
) throw new Error("CBETA T22 固定批次、目录、清单或登记册统计不一致");
if (
  cbetaT23Batch.version !== "3.0.0" || cbetaT23Batch.files.length !== 13 ||
  cbetaT23Batch.collection.sourceRecordDenominator !== 13 ||
  cbetaT23Batch.collection.previouslyControlledSourceRecords !== 0 ||
  cbetaT23Batch.collection.controlledSourceRecords !== 13 ||
  cbetaT23Batch.collection.newSourceBytes !== 18890532 ||
  cbetaT23Batch.collection.newStableSegments !== 90632 ||
  cbetaT23Batch.collection.newFullSourceTexts !== 13 ||
  cbetaT23Batch.collection.newPartialSourceWitnesses !== 0 ||
  cbetaT23Batch.collection.verifiedEditionWitnesses !== 0 ||
  cbetaT23Batch.collection.newWorks !== 13
) throw new Error("CBETA T23 固定批次、目录、清单或登记册统计不一致");
if (
  cbetaT24Batch.version !== "3.1.0" || cbetaT24Batch.files.length !== 59 ||
  cbetaT24Batch.collection.sourceRecordDenominator !== 59 ||
  cbetaT24Batch.collection.previouslyControlledSourceRecords !== 0 ||
  cbetaT24Batch.collection.controlledSourceRecords !== 59 ||
  cbetaT24Batch.collection.newSourceBytes !== 19745486 ||
  cbetaT24Batch.collection.newStableSegments !== 95817 ||
  cbetaT24Batch.collection.newFolios !== 3502 ||
  cbetaT24Batch.collection.newFullSourceTexts !== 58 ||
  cbetaT24Batch.collection.newPartialSourceWitnesses !== 1 ||
  cbetaT24Batch.collection.verifiedSameWorkExpressions !== 2 ||
  cbetaT24Batch.collection.verifiedEditionWitnesses !== 4 ||
  cbetaT24Batch.collection.provisionalRecords !== 53 ||
  cbetaT24Batch.collection.newWorks !== 56
) throw new Error("CBETA T24 固定批次统计不一致");
if (
  cbetaT25Batch.version !== "3.2.0" || cbetaT25Batch.files.length !== 15 ||
  cbetaT25Batch.collection.sourceRecordDenominator !== 15 ||
  cbetaT25Batch.collection.previouslyControlledSourceRecords !== 0 ||
  cbetaT25Batch.collection.controlledSourceRecords !== 15 ||
  cbetaT25Batch.collection.newSourceBytes !== 20558857 ||
  cbetaT25Batch.collection.newStableSegments !== 77880 ||
  cbetaT25Batch.collection.newFolios !== 2816 ||
  cbetaT25Batch.collection.newFullSourceTexts !== 15 ||
  cbetaT25Batch.collection.newPartialSourceWitnesses !== 0 ||
  cbetaT25Batch.collection.verifiedSameWorkExpressions !== 4 ||
  cbetaT25Batch.collection.verifiedEditionWitnesses !== 2 ||
  cbetaT25Batch.collection.provisionalRecords !== 9 ||
  cbetaT25Batch.collection.newWorks !== 12
) throw new Error("CBETA T25 固定批次、目录、清单或登记册统计不一致");
if (
  cbetaT26Batch.version !== "3.3.0" || cbetaT26Batch.files.length !== 26 ||
  cbetaT26Batch.collection.sourceRecordDenominator !== 26 ||
  cbetaT26Batch.collection.previouslyControlledSourceRecords !== 0 ||
  cbetaT26Batch.collection.controlledSourceRecords !== 26 ||
  cbetaT26Batch.collection.newSourceBytes !== 14495358 ||
  cbetaT26Batch.collection.newStableSegments !== 88216 ||
  cbetaT26Batch.collection.newFolios !== 3213 ||
  cbetaT26Batch.collection.newFullSourceTexts !== 26 ||
  cbetaT26Batch.collection.newPartialSourceWitnesses !== 0 ||
  cbetaT26Batch.collection.verifiedSameWorkExpressions !== 6 ||
  cbetaT26Batch.collection.verifiedEditionWitnesses !== 0 ||
  cbetaT26Batch.collection.provisionalRecords !== 20 ||
  cbetaT26Batch.collection.newWorks !== 23
) throw new Error("CBETA T26 固定批次统计不一致");
if (
  cbetaT27Batch.version !== "3.4.0" || cbetaT27Batch.files.length !== 1 ||
  cbetaT27Batch.collection.sourceRecordDenominator !== 1 ||
  cbetaT27Batch.collection.controlledSourceRecords !== 1 ||
  cbetaT27Batch.collection.newSourceBytes !== 9552926 ||
  cbetaT27Batch.collection.newStableSegments !== 86292 ||
  cbetaT27Batch.collection.newWorks !== 1
) throw new Error("CBETA T27 固定批次统计不一致");
if (
  cbetaT28Batch.version !== "3.5.0" || cbetaT28Batch.files.length !== 12 ||
  cbetaT28Batch.collection.sourceRecordDenominator !== 12 ||
  cbetaT28Batch.collection.controlledSourceRecords !== 12 ||
  cbetaT28Batch.collection.newSourceBytes !== 14447693 ||
  cbetaT28Batch.collection.newStableSegments !== 85917 ||
  cbetaT28Batch.collection.newWorks !== 10
) throw new Error("CBETA T28 固定批次统计不一致");
if (
  cbetaT29Batch.version !== "3.6.0" || cbetaT29Batch.files.length !== 6 ||
  cbetaT29Batch.collection.sourceRecordDenominator !== 6 ||
  cbetaT29Batch.collection.previouslyControlledSourceRecords !== 0 ||
  cbetaT29Batch.collection.controlledSourceRecords !== 6 ||
  cbetaT29Batch.collection.newSourceBytes !== 11019060 ||
  cbetaT29Batch.collection.newStableSegments !== 83885 ||
  cbetaT29Batch.collection.newFolios !== 3042 ||
  cbetaT29Batch.collection.newFullSourceTexts !== 5 ||
  cbetaT29Batch.collection.newPartialSourceWitnesses !== 1 ||
  cbetaT29Batch.collection.verifiedSameWorkExpressions !== 2 ||
  cbetaT29Batch.collection.verifiedPartialWorkWitnesses !== 1 ||
  cbetaT29Batch.collection.verifiedEditionWitnesses !== 0 ||
  cbetaT29Batch.collection.provisionalRecords !== 0 ||
  cbetaT29Batch.collection.newWorks !== 5
) throw new Error("CBETA T29 固定批次、目录、清单或登记册统计不一致");
if (
  cbetaT30Batch.version !== "3.7.0" || cbetaT30Batch.files.length !== 21 ||
  cbetaT30Batch.collection.sourceRecordDenominator !== 21 ||
  cbetaT30Batch.collection.previouslyControlledSourceRecords !== 0 ||
  cbetaT30Batch.collection.controlledSourceRecords !== 21 ||
  cbetaT30Batch.collection.newSourceBytes !== 13938106 ||
  cbetaT30Batch.collection.newStableSegments !== 88664 ||
  cbetaT30Batch.collection.newFolios !== 3222 ||
  cbetaT30Batch.collection.newFullSourceTexts !== 15 ||
  cbetaT30Batch.collection.newPartialSourceWitnesses !== 6 ||
  cbetaT30Batch.collection.verifiedSameWorkExpressions !== 0 ||
  cbetaT30Batch.collection.verifiedPartialWorkWitnesses !== 6 ||
  cbetaT30Batch.collection.verifiedSplitWorkWitnesses !== 2 ||
  cbetaT30Batch.collection.verifiedEditionWitnesses !== 0 ||
  cbetaT30Batch.collection.provisionalRecords !== 0 ||
  cbetaT30Batch.collection.newWorks !== 20
) throw new Error("CBETA T30 固定批次统计不一致");
if (
  cbetaT31Batch.version !== "3.8.0" || cbetaT31Batch.files.length !== 43 ||
  cbetaT31Batch.collection.sourceRecordDenominator !== 43 ||
  cbetaT31Batch.collection.previouslyControlledSourceRecords !== 0 ||
  cbetaT31Batch.collection.controlledSourceRecords !== 43 ||
  cbetaT31Batch.collection.newSourceBytes !== 11039332 ||
  cbetaT31Batch.collection.newStableSegments !== 76949 ||
  cbetaT31Batch.collection.newFolios !== 2799 ||
  cbetaT31Batch.collection.newJuans !== 164 ||
  cbetaT31Batch.collection.newFullSourceTexts !== 43 ||
  cbetaT31Batch.collection.newPartialSourceWitnesses !== 0 ||
  cbetaT31Batch.collection.verifiedSameWorkExpressions !== 21 ||
  cbetaT31Batch.collection.verifiedPartialWorkWitnesses !== 0 ||
  cbetaT31Batch.collection.verifiedSplitWorkWitnesses !== 0 ||
  cbetaT31Batch.collection.verifiedEditionWitnesses !== 0 ||
  cbetaT31Batch.collection.provisionalRecords !== 0 ||
  cbetaT31Batch.collection.newWorks !== 31
) throw new Error("CBETA T31 固定批次、目录、清单或登记册统计不一致");
if (
  cbetaT32Batch.version !== "3.9.0" || cbetaT32Batch.files.length !== 66 ||
  cbetaT32Batch.collection.sourceRecordDenominator !== 66 ||
  cbetaT32Batch.collection.previouslyControlledSourceRecords !== 0 ||
  cbetaT32Batch.collection.controlledSourceRecords !== 66 ||
  cbetaT32Batch.collection.newSourceBytes !== 11121227 ||
  cbetaT32Batch.collection.newStableSegments !== 67621 ||
  cbetaT32Batch.collection.newFolios !== 2509 ||
  cbetaT32Batch.collection.newJuans !== 201 ||
  cbetaT32Batch.collection.newFullSourceTexts !== 65 ||
  cbetaT32Batch.collection.newPartialSourceWitnesses !== 1 ||
  cbetaT32Batch.collection.verifiedSameWorkExpressions !== 13 ||
  cbetaT32Batch.collection.verifiedPartialWorkWitnesses !== 1 ||
  cbetaT32Batch.collection.verifiedSplitWorkWitnesses !== 0 ||
  cbetaT32Batch.collection.verifiedEditionWitnesses !== 0 ||
  cbetaT32Batch.collection.provisionalRecords !== 0 ||
  cbetaT32Batch.collection.newWorks !== 59
) throw new Error("CBETA T32 固定批次、目录、清单或登记册统计不一致");
if (
  cbetaT33Batch.version !== "4.0.0" || cbetaT33Batch.files.length !== 25 ||
  cbetaT33Batch.collection.sourceRecordDenominator !== 25 ||
  cbetaT33Batch.collection.previouslyControlledSourceRecords !== 0 ||
  cbetaT33Batch.collection.controlledSourceRecords !== 25 ||
  cbetaT33Batch.collection.newSourceBytes !== 12016019 ||
  cbetaT33Batch.collection.newStableSegments !== 82527 ||
  cbetaT33Batch.collection.newFolios !== 2930 ||
  cbetaT33Batch.collection.newJuans !== 90 ||
  cbetaT33Batch.collection.newFullSourceTexts !== 25 ||
  cbetaT33Batch.collection.newPartialSourceWitnesses !== 0 ||
  cbetaT33Batch.collection.verifiedSameWorkExpressions !== 0 ||
  cbetaT33Batch.collection.verifiedPartialWorkWitnesses !== 0 ||
  cbetaT33Batch.collection.verifiedSplitWorkWitnesses !== 0 ||
  cbetaT33Batch.collection.verifiedEditionWitnesses !== 0 ||
  cbetaT33Batch.collection.provisionalRecords !== 0 ||
  cbetaT33Batch.collection.newWorks !== 25
) throw new Error("CBETA T33 固定批次统计不一致");
if (
  cbetaT34Batch.version !== "4.1.0" || cbetaT34Batch.files.length !== 13 ||
  cbetaT34Batch.collection.sourceRecordDenominator !== 13 ||
  cbetaT34Batch.collection.previouslyControlledSourceRecords !== 0 ||
  cbetaT34Batch.collection.controlledSourceRecords !== 13 ||
  cbetaT34Batch.collection.newSourceBytes !== 13196188 ||
  cbetaT34Batch.collection.newStableSegments !== 86768 ||
  cbetaT34Batch.collection.newFolios !== 3058 ||
  cbetaT34Batch.collection.newJuans !== 70 ||
  cbetaT34Batch.collection.newFullSourceTexts !== 13 ||
  cbetaT34Batch.collection.newPartialSourceWitnesses !== 0 ||
  cbetaT34Batch.collection.verifiedSameWorkExpressions !== 0 ||
  cbetaT34Batch.collection.verifiedPartialWorkWitnesses !== 0 ||
  cbetaT34Batch.collection.verifiedSplitWorkWitnesses !== 0 ||
  cbetaT34Batch.collection.verifiedEditionWitnesses !== 0 ||
  cbetaT34Batch.collection.provisionalRecords !== 0 ||
  cbetaT34Batch.collection.newWorks !== 13
) throw new Error("CBETA T34 固定批次、目录、清单或登记册统计不一致");
if (
  cbetaT35Batch.version !== "4.2.0" || cbetaT35Batch.files.length !== 5 ||
  cbetaT35Batch.collection.sourceRecordDenominator !== 5 ||
  cbetaT35Batch.collection.previouslyControlledSourceRecords !== 0 ||
  cbetaT35Batch.collection.controlledSourceRecords !== 5 ||
  cbetaT35Batch.collection.newSourceBytes !== 11056559 ||
  cbetaT35Batch.collection.newStableSegments !== 82994 ||
  cbetaT35Batch.collection.newFolios !== 2938 ||
  cbetaT35Batch.collection.newJuans !== 87 ||
  cbetaT35Batch.collection.newFullSourceTexts !== 5 ||
  cbetaT35Batch.collection.newPartialSourceWitnesses !== 0 ||
  cbetaT35Batch.collection.verifiedSameWorkExpressions !== 0 ||
  cbetaT35Batch.collection.verifiedPartialWorkWitnesses !== 0 ||
  cbetaT35Batch.collection.verifiedSplitWorkWitnesses !== 0 ||
  cbetaT35Batch.collection.verifiedEditionWitnesses !== 0 ||
  cbetaT35Batch.collection.provisionalRecords !== 0 ||
  cbetaT35Batch.collection.newWorks !== 5
) throw new Error("CBETA T35 固定批次、目录、清单或登记册统计不一致");
if (
  cbetaBatch.version !== "4.3.0" || cbetaBatch.files.length !== 8 ||
  cbetaBatch.collection.sourceRecordDenominator !== 8 ||
  cbetaBatch.collection.previouslyControlledSourceRecords !== 0 ||
  cbetaBatch.collection.controlledSourceRecords !== 8 ||
  cbetaBatch.collection.newSourceBytes !== 14520834 ||
  cbetaBatch.collection.newStableSegments !== 91748 ||
  cbetaBatch.collection.newFolios !== 3288 ||
  cbetaBatch.collection.newJuans !== 140 ||
  cbetaBatch.collection.newFullSourceTexts !== 8 ||
  cbetaBatch.collection.newPartialSourceWitnesses !== 0 ||
  cbetaBatch.collection.verifiedSameWorkExpressions !== 0 ||
  cbetaBatch.collection.verifiedPartialWorkWitnesses !== 0 ||
  cbetaBatch.collection.verifiedSplitWorkWitnesses !== 0 ||
  cbetaBatch.collection.verifiedEditionWitnesses !== 0 ||
  cbetaBatch.collection.provisionalRecords !== 0 ||
  cbetaBatch.collection.newWorks !== 8 ||
  cbetaCatalog.files.length !== 1809 || cbetaManifest.files.length !== 1809 ||
  cbetaRegistry.registry.version !== "4.3.0" || cbetaRegistry.works.length !== 1591 ||
  cbetaRegistry.works.flatMap((work) => work.expressions).length !== 1809
) throw new Error("CBETA T36 固定批次、目录、清单或登记册统计不一致");

const cbetaFamily = cbetaRegistry.sourceFamilies.find((family) => family.id === "cbeta_chinese");
if (
  cbetaFamily?.controlledExpressionRecords !== 1823 ||
  cbetaFamily?.controlledExpressionBytes !== 554372038
) throw new Error("CBETA 汉译经藏受控来源记录统计不一致");
const dergeSource = snapshots.sources.find((source) => source.id === "bdrc_derge_kangyur");
const rktsSource = snapshots.sources.find((source) => source.id === "rkts_kangyur_catalogs");
if (
  snapshots.version !== "2.4.0" || snapshots.denominatorReady !== false ||
  dergeSource?.candidateRecordCount !== 1114 ||
  dergeInventory.totals?.topLevelCatalogRecords !== 1122 ||
  dergeInventory.totals?.topLevelExpressionRecords !== 1114 ||
  dergeInventory.totals?.excludedCatalogOnlyRecords !== 8 ||
  dergeInventory.totals?.nestedTextPartRecords !== 71 ||
  dergeInventory.totals?.dergeIdentifierRecords !== 1193 ||
  dergeInventory.totals?.linkedAbstractWorkIds !== 844 ||
  dergeInventory.totals?.volumeManifests !== 103 ||
  rights84000.policy?.publishedTranslations?.license !== "CC BY-NC-ND 4.0" ||
  rights84000.policy?.translationMetadata?.license !== "CC BY 4.0" ||
  rights84000.policy?.api?.open !== false
) throw new Error("BDRC 德格甘珠尔快照或 84000 权利边界不一致");
if (
  rktsEvidence.version !== "0.5.0" ||
  rktsEvidence.upstream?.submoduleVerified !== true ||
  rktsEvidence.totals?.configuredCatalogs !== 20 ||
  rktsEvidence.totals?.availableCatalogs !== 19 ||
  rktsEvidence.totals?.missingConfiguredCatalogs !== 1 ||
  rktsEvidence.totals?.itemRecords !== 15069 ||
  rktsEvidence.totals?.sourceBytes !== 15544576 ||
  rktsEvidence.rights?.sourceDataLicense !== "CC0-1.0" ||
  rktsEvidence.integrity?.itemInventoryPublished !== false ||
  rktsSource?.candidateRecordCount !== 15069
) throw new Error("rKTs 多版本甘珠尔目录快照或权利边界不一致");
if (
  rktsKernelAlignments.version !== "0.6.0" ||
  rktsKernelAlignments.policy?.automaticWorkMerge !== false ||
  rktsKernelAlignments.policy?.denominatorImpact !== "none" ||
  rktsKernelAlignments.kernel?.itemRecords !== 1570 ||
  rktsKernelAlignments.kernel?.uniqueIds !== 1562 ||
  rktsKernelAlignments.summary?.exactKernelIds !== 1143 ||
  rktsKernelAlignments.summary?.exactKernelIdsInTwoOrMoreCatalogs !== 971 ||
  rktsKernelAlignments.summary?.unresolvedNormalizedIds !== 8
) throw new Error("rKTs kernel 跨版本候选对齐账本不一致");
const dsbcSource = snapshots.sources.find((source) => source.id === "dsbc_sanskrit_catalog");
const gretilSource = snapshots.sources.find((source) => source.id === "gretil_sanskrit_buddhist_files");
if (
  dsbcSource?.candidateRecordCount !== 486 ||
  gretilSource?.candidateRecordCount !== 417 ||
  sanskritEvidence.dsbc?.groups?.sutrapitaka !== 111 ||
  sanskritEvidence.dsbc?.groups?.vinayapitaka !== 15 ||
  sanskritEvidence.dsbc?.groups?.sastrapitaka !== 360 ||
  sanskritEvidence.gretil?.candidatePhysicalFiles !== 417 ||
  sanskritEvidence.gretil?.candidateBytes !== 62432484 ||
  sanskritRights.dsbc?.observedPolicy?.reproductionWithoutPermissionProhibited !== true ||
  sanskritRights.gretil?.repositoryLicenseDetected !== false ||
  gretilFileRightsAudit.version !== "0.7.0" ||
  gretilFileRightsAudit.source?.commit !== sanskritEvidence.gretil?.commit ||
  gretilFileRightsAudit.source?.tree !== sanskritEvidence.gretil?.tree ||
  gretilFileRightsAudit.summary?.filesAudited !== 417 ||
  gretilFileRightsAudit.summary?.sourceBytes !== 62432484 ||
  gretilFileRightsAudit.summary?.filesMarkedReferenceOnly !== 417 ||
  gretilFileRightsAudit.summary?.filesDeferringTermsToSource !== 417 ||
  gretilFileRightsAudit.summary?.filesWithDsbcPermissionStatement !== 179 ||
  gretilFileRightsAudit.summary?.filesWithExplicitCopyrightNotice !== 26 ||
  gretilFileRightsAudit.summary?.filesWithExplicitOpenLicense !== 0 ||
  gretilFileRightsAudit.summary?.filesApprovedForRepublication !== 0 ||
  gretilFileRightsAudit.summary?.filesRestrictedToMetadataAndExternalLink !== 417 ||
  gretilFileRightsAudit.integrity?.rawSourceBodiesPublished !== false
) throw new Error("DSBC 或 GRETIL 梵文来源快照与权利边界不一致");
if (
  crossCatalogAlignments.version !== "0.5.0" ||
  crossCatalogAlignments.policy?.automaticWorkMerge !== false ||
  crossCatalogAlignments.summary?.curatedRelationGroups !== 29 ||
  crossCatalogAlignments.summary?.gbcrWorksReferenced !== 57 ||
  crossCatalogAlignments.summary?.matchedDergeExpressions !== 29 ||
  crossCatalogAlignments.summary?.unmatchedTohBaseIdentifiers !== 0 ||
  crossCatalogAlignments.summary?.denominatorImpact !== "none"
) throw new Error("Toh—德格—CBETA 跨目录对齐账本不一致");
const nonCbetaWorks = base.works.filter((work) =>
  !(work.expressions ?? []).some((expression) => expression.sourceSnapshotId === "cbeta_xml_p5"),
);
if (nonCbetaWorks.length !== 273) throw new Error("v1.2 非 CBETA 作品基线漂移");
const baseCbetaById = new Map(base.works
  .filter((work) => (work.expressions ?? []).some((expression) => expression.sourceSnapshotId === "cbeta_xml_p5"))
  .map((work) => [work.id, work]));
const cbetaWorks = cbetaRegistry.works.map((work) => {
  const existing = baseCbetaById.get(work.id);
  return existing ? {
    ...work,
    ...existing,
    traditions: work.traditions,
    externalIds: work.externalIds,
    sourceRoles: work.sourceRoles,
    bibliographicRelations: work.bibliographicRelations,
    expressions: work.expressions,
  } : work;
});
const indicWorks = indicManifest.files.map((file) => {
  const sourceAssets = file.sourceParts.map((source) => ({
    part: source.part,
    id: source.id,
    path: source.localPath,
    format: source.format,
    sha256: source.localSha256,
    rightsStatus: source.rightsStatus,
  }));
  return {
    id: file.workId,
    ...(file.textFamilyId ? { textFamilyId: file.textFamilyId } : {}),
    workType: file.id === "PDHP" ? "distinct_recension" : "provisional_cross_language_witness",
    canonicalTitle: file.presentation.alternateTitle,
    canonicalTitleZh: file.presentation.title,
    traditions: [file.presentation.tradition.split(" · ")[0]],
    externalIds: { suttacentral: [file.id.toLowerCase()] },
    relationDecision: file.relationDecision,
    expressions: [{
      id: `gbcr:expression:${file.id}-${file.language}-sc`,
      language: file.language,
      title: file.presentation.alternateTitle,
      edition: file.presentation.translator,
      sourceSnapshotId: "suttacentral_bilara",
      localSlug: file.slug,
      cataloged: true,
      fullSourceText: true,
      sampled: false,
      stableSegments: file.verification.segments,
      omittedEmptyEditorialPlaceholderSegments: file.sourceParts.reduce(
        (sum, source) => sum + (source.emptyEditorialPlaceholderSegments ?? 0),
        0,
      ),
      rightsReviewed: true,
      trainingUse: "prohibited_by_foxue_policy",
      qualityStatus: "verified_structure_rights_and_anchors",
      ...(sourceAssets.length === 1
        ? { sourceTextAsset: sourceAssets[0] }
        : { sourceTextAssets: sourceAssets }),
    }],
  };
});
const vinayaWorks = vinayaManifest.files.map((file) => {
  const sourceAssets = file.sourceParts.map((source) => ({
    part: source.part,
    id: source.id,
    path: source.localPath,
    format: source.format,
    sha256: source.localSha256,
    rightsStatus: source.rightsStatus,
  }));
  return {
    id: file.workId,
    workType: "canonical_text_collection",
    canonicalTitle: file.presentation.alternateTitle,
    canonicalTitleZh: file.presentation.title,
    traditions: ["上座部佛教"],
    externalIds: { suttacentral: [file.id.toLowerCase()] },
    relationDecision: file.relationDecision,
    expressions: [{
      id: `gbcr:expression:${file.id}-pi-Latn-sc`,
      language: file.language,
      title: file.presentation.alternateTitle,
      edition: file.presentation.translator,
      sourceSnapshotId: "suttacentral_bilara",
      localSlug: file.slug,
      cataloged: true,
      fullSourceText: true,
      sampled: false,
      stableSegments: file.verification.segments,
      omittedEmptySegments: file.verification.omittedEmptySegmentIds.length,
      rightsReviewed: true,
      trainingUse: "prohibited_by_foxue_policy",
      qualityStatus: "verified_structure_rights_and_anchors",
      sourceTextAssets: sourceAssets,
    }],
  };
});
const abhidhammaWorks = abhidhammaManifest.files.map((file) => {
  const sourceAssets = file.sourceParts.map((source) => ({
    part: source.part,
    id: source.id,
    path: source.localPath,
    format: source.format,
    sha256: source.localSha256,
    rightsStatus: source.rightsStatus,
  }));
  return {
    id: file.workId,
    workType: "canonical_text_collection",
    canonicalTitle: file.presentation.alternateTitle,
    canonicalTitleZh: file.presentation.title,
    traditions: ["上座部佛教"],
    externalIds: { suttacentral: [file.id.toLowerCase()] },
    relationDecision: file.relationDecision,
    attributionDecision: "论藏属于上座部佛教经典；本登记不据此声称其为佛陀逐字亲说。",
    expressions: [{
      id: `gbcr:expression:${file.id}-pi-Latn-sc`,
      language: file.language,
      title: file.presentation.alternateTitle,
      edition: file.presentation.translator,
      sourceSnapshotId: "suttacentral_bilara",
      localSlug: file.slug,
      cataloged: true,
      fullSourceText: true,
      sampled: false,
      stableSegments: file.verification.segments,
      omittedEmptySegments: file.verification.omittedEmptySegmentIds.length,
      rightsReviewed: true,
      trainingUse: "prohibited_by_foxue_policy",
      qualityStatus: "verified_structure_rights_and_anchors",
      sourceTextAssets: sourceAssets,
    }],
  };
});
const sourceFamilies = base.sourceFamilies.map((family) => {
  if (family.id === "cbeta_chinese") return {
    ...cbetaFamily,
    suttacentralParallelEdges: suttacentralChineseParallels.summary.deduplicatedParallelEdges,
    suttacentralParallelChineseWorksReferenced: suttacentralChineseParallels.summary.chineseWorksReferenced,
    suttacentralParallelEvidenceFile: inputs.suttacentralChineseParallels,
    suttacentralParallelEvidenceSha256: sha256(rawById.suttacentralChineseParallels),
    suttacentralParallelReviewQueueItems: suttacentralParallelReviewQueue.summary.queueItems,
    suttacentralParallelAdjudicatedItems: suttacentralParallelReviewQueue.summary.adjudicatedItems,
    suttacentralParallelReviewQueueFile: inputs.suttacentralParallelReviewQueue,
    suttacentralParallelReviewQueueSha256: sha256(rawById.suttacentralParallelReviewQueue),
    denominatorNote: `${cbetaFamily.denominatorNote} SuttaCentral 官方关系表新增 5,161 条汉—巴证据边，但整经、合集组件、近似与提及已分层，关系边不自动合并作品或改变全球分母。`,
  };
  if (family.id === "tibetan_kangyur_tengyur") {
    return {
      ...family,
      primarySources: ["bdrc_derge_kangyur", "rkts_kangyur_catalogs", "bdrc_linked_data", "bdrc_iiif", "84000_progress"],
      denominatorStatus: "multi_edition_catalog_snapshots_ready_alignment_pending",
      denominatorWorks: null,
      candidateEditionId: dergeInventory.source.instanceId,
      candidateEditionTitle: dergeInventory.source.titleZh,
      candidateTopLevelCatalogRecords: dergeInventory.totals.topLevelCatalogRecords,
      candidateExpressionRecords: dergeInventory.totals.topLevelExpressionRecords,
      excludedCatalogOnlyRecords: dergeInventory.totals.excludedCatalogOnlyRecords,
      nestedTextPartRecords: dergeInventory.totals.nestedTextPartRecords,
      dergeIdentifierRecords: dergeInventory.totals.dergeIdentifierRecords,
      candidateLinkedAbstractWorkIds: dergeInventory.totals.linkedAbstractWorkIds,
      curatedCrossCatalogRelationGroups: crossCatalogAlignments.summary.curatedRelationGroups,
      curatedCrossCatalogGbcrWorks: crossCatalogAlignments.summary.gbcrWorksReferenced,
      curatedTohBaseIdentifiers: crossCatalogAlignments.summary.uniqueTohBaseIdentifiers,
      matchedDergeExpressions: crossCatalogAlignments.summary.matchedDergeExpressions,
      crossCatalogAlignmentFile: inputs.crossCatalogAlignments,
      crossCatalogAlignmentSha256: sha256(rawById.crossCatalogAlignments),
      rktsConfiguredCatalogs: rktsEvidence.totals.configuredCatalogs,
      rktsAvailableCatalogs: rktsEvidence.totals.availableCatalogs,
      rktsMissingConfiguredCatalogs: rktsEvidence.totals.missingConfiguredCatalogs,
      rktsCandidateItemRecords: rktsEvidence.totals.itemRecords,
      rktsCandidateBytes: rktsEvidence.totals.sourceBytes,
      rktsCatalogSnapshotFile: inputs.rktsEvidence,
      rktsCatalogSnapshotSha256: sha256(rawById.rktsEvidence),
      rktsKernelItemRecords: rktsKernelAlignments.kernel.itemRecords,
      rktsKernelUniqueIds: rktsKernelAlignments.kernel.uniqueIds,
      rktsKernelDuplicateIdGroups: rktsKernelAlignments.kernel.duplicateIds.length,
      rktsExactKernelIds: rktsKernelAlignments.summary.exactKernelIds,
      rktsExactKernelIdsInTwoOrMoreCatalogs: rktsKernelAlignments.summary.exactKernelIdsInTwoOrMoreCatalogs,
      rktsExactKernelIdsInEightOrMoreCatalogs: rktsKernelAlignments.summary.exactKernelIdsInEightOrMoreCatalogs,
      rktsUnlinkedKernelIds: rktsKernelAlignments.summary.unlinkedKernelIds,
      rktsUnresolvedNormalizedIds: rktsKernelAlignments.summary.unresolvedNormalizedIds,
      rktsKernelAlignmentFile: inputs.rktsKernelAlignments,
      rktsKernelAlignmentSha256: sha256(rawById.rktsKernelAlignments),
      volumeManifests: dergeInventory.totals.volumeManifests,
      inventoryFile: dergeSource.inventoryFile,
      inventorySha256: dergeSource.inventorySha256,
      denominatorNote: "德格甘珠尔初印本固定版本已冻结 1,122 个顶层目录项；其中 1,114 个可定位表达式、8 个无法定位到初印本的目录补充项。rKTs 的 19 个可用目录共有 15,069 条 item；按上游迁移规则规范前缀后，1,143 个 kernel 编号有精确连接，971 个见于至少两个目录。kernel 自身却有 1,570 条记录、1,562 个唯一编号，835 重复九次，且 835-1 至 835-8 保持未决。编号只生成候选边，不足以裁决作品同一性，因此作品分母继续保持未知。",
    };
  }
  if (family.id === "suttacentral_early_buddhist_texts") {
    return {
      ...family,
      primarySources: [...new Set([...(family.primarySources ?? []), "suttacentral_relationship_edges"])],
      denominatorStatus: "candidate_snapshot_with_all_pali_roots_and_controlled_indic_roots",
      controlledWorks: 286,
      controlledExpressions: 286,
      controlledRootRecords: 7288,
      controlledRootBytes: 40689597,
      controlledAllLanguageWorks: 289,
      controlledAllLanguageExpressions: 289,
      controlledAllLanguageRootRecords: 7312,
      controlledAllLanguageRootBytes: 40905982,
      controlledVinayaWorks: vinayaBatch.collection.workCount,
      controlledVinayaExpressions: vinayaBatch.collection.expressionCount,
      controlledVinayaRootRecords: vinayaBatch.collection.sourceRecordCount,
      controlledVinayaRootBytes: vinayaBatch.collection.sourceBytes,
      controlledVinayaStableSegments: vinayaBatch.collection.stableSegments,
      controlledVinayaOmittedEmptySegments: vinayaBatch.collection.omittedEmptySegments,
      vinayaRightsAuditFile: inputs.suttacentralVinayaRightsAudit,
      vinayaRightsAuditSha256: sha256(rawById.suttacentralVinayaRightsAudit),
      controlledAbhidhammaWorks: abhidhammaBatch.collection.workCount,
      controlledAbhidhammaExpressions: abhidhammaBatch.collection.expressionCount,
      controlledAbhidhammaRootRecords: abhidhammaBatch.collection.sourceRecordCount,
      controlledAbhidhammaRootBytes: abhidhammaBatch.collection.sourceBytes,
      controlledAbhidhammaStableSegments: abhidhammaBatch.collection.stableSegments,
      controlledAbhidhammaOmittedEmptySegments: abhidhammaBatch.collection.omittedEmptySegments,
      abhidhammaRightsAuditFile: inputs.suttacentralAbhidhammaRightsAudit,
      abhidhammaRightsAuditSha256: sha256(rawById.suttacentralAbhidhammaRightsAudit),
      controlledNonPaliIndicWorks: indicBatch.collection.workCount,
      controlledNonPaliIndicExpressions: indicBatch.collection.expressionCount,
      controlledNonPaliIndicRootRecords: indicBatch.collection.sourceRecordCount,
      controlledNonPaliIndicRootBytes: indicBatch.collection.sourceBytes,
      controlledNonPaliIndicStableSegments: indicBatch.collection.stableSegments,
      controlledNonPaliIndicOmittedPlaceholders: indicBatch.collection.omittedEmptyEditorialPlaceholderSegments,
      chineseParallelEdges: suttacentralChineseParallels.summary.deduplicatedParallelEdges,
      chineseParallelPaliWorksReferenced: suttacentralChineseParallels.summary.paliWorksReferenced,
      chineseParallelEvidenceFile: inputs.suttacentralChineseParallels,
      chineseParallelEvidenceSha256: sha256(rawById.suttacentralChineseParallels),
      chineseParallelReviewQueueItems: suttacentralParallelReviewQueue.summary.queueItems,
      chineseParallelAdjudicatedItems: suttacentralParallelReviewQueue.summary.adjudicatedItems,
      chineseParallelReviewQueueFile: inputs.suttacentralParallelReviewQueue,
      chineseParallelReviewQueueSha256: sha256(rawById.suttacentralParallelReviewQueue),
      indicRightsAuditFile: inputs.suttacentralIndicRightsAudit,
      indicRightsAuditSha256: sha256(rawById.suttacentralIndicRightsAudit),
      denominatorNote: "固定提交的 7,288 条巴利 root 已全部逐文件受控：经藏 5,764 份、律藏 422 份、论藏 1,102 份；分别按经级或书级边界登记为 286 个表达。另受控 2 份梵文与 22 份俗语 root，按 sf36、sf276、pdhp 登记为 3 个表达。SuttaCentral 官方关系表的 5,161 条汉—巴证据边已分成整经、合集组件、近似与提及，不自动归并作品。物理文件或关系边不冒充作品，固定来源内 100% 不能外推为全球佛典覆盖率。",
    };
  }
  if (family.id === "sanskrit_fragments_and_witnesses") {
    return {
      ...family,
      primarySources: ["dsbc_sanskrit_catalog", "gretil_sanskrit_buddhist_files", "suttacentral_bilara"],
      denominatorStatus: "catalog_and_file_snapshots_ready_three_public_domain_indic_expressions_controlled_alignment_pending",
      denominatorWorks: null,
      controlledSuttacentralIndicWorks: indicBatch.collection.workCount,
      controlledSuttacentralIndicExpressions: indicBatch.collection.expressionCount,
      controlledSuttacentralIndicRootFiles: indicBatch.collection.sourceRecordCount,
      controlledSuttacentralIndicRootBytes: indicBatch.collection.sourceBytes,
      controlledSuttacentralIndicStableSegments: indicBatch.collection.stableSegments,
      controlledSuttacentralSanskritRootFiles: suttacentralIndicRightsAudit.summary.sanskritRootFiles,
      controlledSuttacentralPrakritRootFiles: suttacentralIndicRightsAudit.summary.prakritRootFiles,
      suttacentralIndicRightsAuditFile: inputs.suttacentralIndicRightsAudit,
      suttacentralIndicRightsAuditSha256: sha256(rawById.suttacentralIndicRightsAudit),
      candidateDsbcCatalogRecords: sanskritEvidence.dsbc.candidateCatalogRecords,
      candidateDsbcSutrapitakaRecords: sanskritEvidence.dsbc.groups.sutrapitaka,
      candidateDsbcVinayapitakaRecords: sanskritEvidence.dsbc.groups.vinayapitaka,
      candidateDsbcSastrapitakaRecords: sanskritEvidence.dsbc.groups.sastrapitaka,
      candidateGretilPhysicalFiles: sanskritEvidence.gretil.candidatePhysicalFiles,
      candidateGretilBytes: sanskritEvidence.gretil.candidateBytes,
      gretilRightsAuditedFiles: gretilFileRightsAudit.summary.filesAudited,
      gretilFilesMarkedReferenceOnly: gretilFileRightsAudit.summary.filesMarkedReferenceOnly,
      gretilFilesWithDsbcPermissionStatement: gretilFileRightsAudit.summary.filesWithDsbcPermissionStatement,
      gretilFilesWithExplicitCopyrightNotice: gretilFileRightsAudit.summary.filesWithExplicitCopyrightNotice,
      gretilFilesWithExplicitOpenLicense: gretilFileRightsAudit.summary.filesWithExplicitOpenLicense,
      gretilFilesApprovedForRepublication: gretilFileRightsAudit.summary.filesApprovedForRepublication,
      gretilFilesRestrictedToMetadataAndExternalLink: gretilFileRightsAudit.summary.filesRestrictedToMetadataAndExternalLink,
      gretilRightsAuditFile: inputs.gretilFileRightsAudit,
      gretilRightsAuditSha256: sha256(rawById.gretilFileRightsAudit),
      candidateInventoryFile: dsbcSource.inventoryFile,
      candidateInventorySha256: dsbcSource.inventorySha256,
      denominatorNote: "DSBC 的 486 条目录记录和 GRETIL 的 417 个物理文件已冻结，但两者会互相重叠，也包含同作品多版本、分卷、律藏、密续与论疏。GRETIL 417/417 仍只发布元数据、哈希与固定外链。SuttaCentral 固定提交中的 2 份梵文和 22 份俗语原文已通过官方公共领域政策与逐出版记录复核，作为 3 个表达进入受控阅读；这三个表达不据物理文件数或题名推导全球作品分母。",
    };
  }
  return family;
});
const sourceSnapshots = [
  ...base.sourceSnapshots.map((source) => source.id === "cbeta_xml_p5" ? {
    ...source,
    snapshot: { ...source.snapshot, capturedAt: snapshots.capturedAt },
    inventory: {
      candidateSubsets: snapshots.sources.find((candidate) => candidate.id === "cbeta_xml_p5")?.candidateSubsets,
      controlledSourceRecords: cbetaFamily.controlledExpressionRecords,
      controlledSourceBytes: cbetaFamily.controlledExpressionBytes,
    },
  } : source.id === "suttacentral_bilara" ? {
    ...source,
    inventory: {
      candidateRootRecords: snapshots.sources.find((candidate) => candidate.id === "suttacentral_bilara")?.candidateRecordCount,
      controlledRootRecords: 7312,
      controlledPaliRootRecords: 7288,
      controlledVinayaRootRecords: vinayaBatch.collection.sourceRecordCount,
      controlledVinayaRootBytes: vinayaBatch.collection.sourceBytes,
      controlledNonPaliIndicRootRecords: indicBatch.collection.sourceRecordCount,
      controlledNonPaliIndicRootBytes: indicBatch.collection.sourceBytes,
      rightsAuditFile: inputs.suttacentralIndicRightsAudit,
      rightsAuditSha256: sha256(rawById.suttacentralIndicRightsAudit),
      vinayaRightsAuditFile: inputs.suttacentralVinayaRightsAudit,
      vinayaRightsAuditSha256: sha256(rawById.suttacentralVinayaRightsAudit),
      controlledAbhidhammaRootRecords: abhidhammaBatch.collection.sourceRecordCount,
      controlledAbhidhammaRootBytes: abhidhammaBatch.collection.sourceBytes,
      abhidhammaRightsAuditFile: inputs.suttacentralAbhidhammaRightsAudit,
      abhidhammaRightsAuditSha256: sha256(rawById.suttacentralAbhidhammaRightsAudit),
    },
    rights: {
      status: "mixed_item_level_with_audited_public_domain_roots",
      summary: "SuttaCentral 材料权利逐项处理。5,764 份巴利经藏、422 份巴利律藏、1,102 份巴利论藏、2 份梵文和 22 份俗语 root 由官方许可政策列为公共领域；第三方译文未导入，保留来源署名，禁止用于模型训练。",
    },
  } : source.id === "84000_progress" ? {
    ...source,
    dataUrl: "https://scholar.84000.co/",
    licenseUrl: rights84000.source.url,
    snapshot: {
      type: "web_sha256",
      ref: rights84000.source.responseSha256,
      capturedAt: rights84000.capturedAt,
    },
    rights: {
      status: "metadata_cc_by_translation_by_nc_nd_api_agreement_required",
      summary: "84000 公开译文为 CC BY-NC-ND 4.0，元数据为 CC BY 4.0；官方不提供开放 API，接口接入须书面协议。foxue.ai 当前只保存权利证据和深链接，不抓取或改写译文。",
    },
  } : source),
  {
    id: "bdrc_derge_kangyur",
    name: "BDRC 德格甘珠尔初印本目录",
    role: "德格甘珠尔固定版本的顶层表达式、嵌套子文本、德格编号与 IIIF 卷级导航候选源",
    homepage: dergeInventory.source.homepage,
    dataUrl: "https://ldspdi.bdrc.io/query/graph/Outline_for_w?R_RES=bdr:MW22084",
    licenseUrl: "https://www.bdrc.io/access-policies/",
    formatUrl: "https://github.com/buda-base/lds-pdi/blob/master/API.md",
    snapshot: {
      type: "api_revision",
      ref: dergeInventory.revisions.outlineRevision,
      capturedAt: dergeInventory.capturedAt,
      relatedRefs: {
        instanceRevision: dergeInventory.revisions.instanceRevision,
        outlineRevision: dergeInventory.revisions.outlineRevision,
      },
    },
    inventory: {
      file: dergeSource.inventoryFile,
      sha256: dergeSource.inventorySha256,
      candidateExpressionRecords: dergeSource.candidateRecordCount,
    },
    rights: {
      status: "public_domain_collection_metadata_only",
      summary: "本登记只保存事实性目录元数据和 BDRC 导航；IIIF 集合标注 Public Domain Mark，但任何图像或全文再分发仍逐对象核对 BDRC 访问政策。",
    },
  },
  {
    id: "dsbc_sanskrit_catalog",
    name: "Digital Sanskrit Buddhist Canon Romanized 目录",
    role: "梵文佛典目录记录、版本页面与经律论分类候选源",
    homepage: "https://dsbcproject.org/",
    dataUrl: sanskritEvidence.dsbc.catalogUrl,
    licenseUrl: sanskritRights.dsbc.url,
    snapshot: {
      type: "web_sha256",
      ref: sanskritEvidence.dsbc.responseSha256,
      capturedAt: sanskritEvidence.capturedAt,
    },
    inventory: {
      file: dsbcSource.inventoryFile,
      sha256: dsbcSource.inventorySha256,
      candidateCatalogRecords: dsbcSource.candidateRecordCount,
      itemInventoryPublished: false,
    },
    rights: {
      status: "aggregate_metadata_only_reproduction_permission_required",
      summary: "DSBC 只允许非商业教育研究用途，并禁止未经许可复制内容；foxue.ai 仅发布汇总计数、页面哈希和记录标识集合摘要，不复制目录逐条内容或正文。",
    },
  },
  {
    id: "gretil_sanskrit_buddhist_files",
    name: "GRETIL 梵文佛教文献长期镜像",
    role: "固定 Git 提交中的梵文佛教物理文件、blob 与字节候选源",
    homepage: "https://github.com/INDOLOGY/GRETIL-mirror",
    dataUrl: `https://github.com/INDOLOGY/GRETIL-mirror/tree/${sanskritEvidence.gretil.commit}/gretil.sub.uni-goettingen.de/gretil/1_sanskr`,
    licenseUrl: "https://github.com/INDOLOGY/GRETIL-mirror",
    snapshot: {
      type: "git",
      ref: sanskritEvidence.gretil.commit,
      capturedAt: sanskritEvidence.capturedAt,
      relatedRefs: { tree: sanskritEvidence.gretil.tree },
    },
    inventory: {
      file: gretilSource.inventoryFile,
      sha256: gretilSource.inventorySha256,
      candidatePhysicalFiles: gretilSource.candidateRecordCount,
      candidateBytes: gretilSource.candidateBytes,
      rightsAuditFile: inputs.gretilFileRightsAudit,
      rightsAuditSha256: sha256(rawById.gretilFileRightsAudit),
      rightsAuditedFiles: gretilFileRightsAudit.summary.filesAudited,
      filesApprovedForRepublication: gretilFileRightsAudit.summary.filesApprovedForRepublication,
    },
    rights: {
      status: "file_level_audited_metadata_and_external_link_only",
      summary: "GRETIL 镜像没有仓库级许可证；417/417 文件已逐一核对权利措辞，全部仅供参考并回指来源条款，0 份获得 foxue.ai 正文再发布授权。当前只发布路径、题名、Git 指纹、哈希、分类和固定外链。",
    },
  },
  {
    id: "rkts_kangyur_catalogs",
    name: "rKTs 多版本甘珠尔目录",
    role: "固定迁移配置中的甘珠尔版本、合集与残片目录 item、rKTs kernel 链接及 BDRC 实例标识候选源",
    homepage: "https://www.istb.univie.ac.at/kanjur/rktsneu/sub/index.php",
    dataUrl: `https://github.com/${rktsEvidence.upstream.sourceRepository}/tree/${rktsEvidence.upstream.sourceCommit}`,
    licenseUrl: rktsEvidence.rights.sourceLicenseEvidenceUrl,
    formatUrl: `https://github.com/${rktsEvidence.upstream.sourceRepository}/blob/${rktsEvidence.upstream.sourceCommit}/README.md`,
    snapshot: {
      type: "git",
      ref: rktsEvidence.upstream.sourceCommit,
      capturedAt: rktsEvidence.capturedAt,
      relatedRefs: {
        tree: rktsEvidence.upstream.sourceTree,
        migrationCommit: rktsEvidence.upstream.migrationCommit,
        migrationTree: rktsEvidence.upstream.migrationTree,
      },
    },
    inventory: {
      file: rktsSource.inventoryFile,
      sha256: rktsSource.inventorySha256,
      configuredCatalogs: rktsEvidence.totals.configuredCatalogs,
      availableCatalogs: rktsEvidence.totals.availableCatalogs,
      missingConfiguredCatalogs: rktsEvidence.totals.missingConfiguredCatalogs,
      candidateItemRecords: rktsEvidence.totals.itemRecords,
      candidateBytes: rktsEvidence.totals.sourceBytes,
      itemInventoryPublished: false,
    },
    rights: {
      status: "cc0_catalog_metadata_aggregate_only",
      summary: "rKTs 数据 README 声明 CC0，并请求引用项目与仓库。foxue.ai 当前只发布固定版本级汇总、路径和 Git blob 指纹；不把跨版本 item 相加为作品分母。",
    },
  },
  {
    id: "suttacentral_relationship_edges",
    name: "SuttaCentral 汉—巴平行关系证据",
    role: "固定提交中的巴利—汉译平行、组件、近似与提及关系候选源",
    homepage: "https://github.com/suttacentral/relationship_edges",
    dataUrl: suttacentralChineseParallels.source.sourceUrl,
    licenseUrl: `https://github.com/suttacentral/relationship_edges/blob/${suttacentralChineseParallels.source.commit}/LICENSE`,
    snapshot: {
      type: "git_commit_file_sha256",
      ref: suttacentralChineseParallels.source.commit,
      capturedAt: suttacentralChineseParallels.capturedAt,
      relatedRefs: { tree: suttacentralChineseParallels.source.tree },
    },
    inventory: {
      file: inputs.suttacentralChineseParallels,
      sha256: sha256(rawById.suttacentralChineseParallels),
      upstreamRows: suttacentralChineseParallels.summary.upstreamRows,
      relevantDirectedRows: suttacentralChineseParallels.summary.relevantDirectedRows,
      deduplicatedParallelEdges: suttacentralChineseParallels.summary.deduplicatedParallelEdges,
    },
    rights: {
      status: "mit_parallel_metadata_with_no_automatic_work_merge",
      summary: "上游关系数据按 MIT 许可固定；foxue.ai 发布证据摘要与关系账本，并保持整经、组件、近似和提及边界。",
    },
  },
];

const registry = {
  ...base,
  registry: { ...base.registry, version: "5.4.0", publishedAt: "2026-08-15" },
  sourceFamilies,
  sourceSnapshots,
  crossCatalogAlignmentAudit: {
    version: crossCatalogAlignments.version,
    status: crossCatalogAlignments.status,
    file: inputs.crossCatalogAlignments,
    sha256: sha256(rawById.crossCatalogAlignments),
    ...crossCatalogAlignments.summary,
    warning: crossCatalogAlignments.warning,
  },
  rktsKernelAlignmentAudit: {
    version: rktsKernelAlignments.version,
    status: rktsKernelAlignments.status,
    file: inputs.rktsKernelAlignments,
    sha256: sha256(rawById.rktsKernelAlignments),
    kernelItemRecords: rktsKernelAlignments.kernel.itemRecords,
    kernelUniqueIds: rktsKernelAlignments.kernel.uniqueIds,
    duplicateKernelIdGroups: rktsKernelAlignments.kernel.duplicateIds.length,
    ...rktsKernelAlignments.summary,
    warning: rktsKernelAlignments.warning,
  },
  gretilFileRightsAudit: {
    version: gretilFileRightsAudit.version,
    status: gretilFileRightsAudit.status,
    file: inputs.gretilFileRightsAudit,
    sha256: sha256(rawById.gretilFileRightsAudit),
    inventorySha256: gretilFileRightsAudit.integrity.inventorySha256,
    ...gretilFileRightsAudit.summary,
    warning: gretilFileRightsAudit.warning,
  },
  suttacentralIndicRootRightsAudit: {
    version: suttacentralIndicRightsAudit.version,
    status: suttacentralIndicRightsAudit.status,
    file: inputs.suttacentralIndicRightsAudit,
    sha256: sha256(rawById.suttacentralIndicRightsAudit),
    inventorySha256: suttacentralIndicRightsAudit.integrity.inventorySha256,
    ...suttacentralIndicRightsAudit.summary,
    warning: suttacentralIndicRightsAudit.warning,
  },
  suttacentralVinayaRootRightsAudit: {
    version: suttacentralVinayaRightsAudit.version,
    status: suttacentralVinayaRightsAudit.status,
    file: inputs.suttacentralVinayaRightsAudit,
    sha256: sha256(rawById.suttacentralVinayaRightsAudit),
    inventorySha256: suttacentralVinayaRightsAudit.integrity.inventorySha256,
    ...suttacentralVinayaRightsAudit.summary,
    warning: suttacentralVinayaRightsAudit.warning,
  },
  suttacentralAbhidhammaRootRightsAudit: {
    version: suttacentralAbhidhammaRightsAudit.version,
    status: suttacentralAbhidhammaRightsAudit.status,
    file: inputs.suttacentralAbhidhammaRightsAudit,
    sha256: sha256(rawById.suttacentralAbhidhammaRightsAudit),
    inventorySha256: suttacentralAbhidhammaRightsAudit.integrity.inventorySha256,
    ...suttacentralAbhidhammaRightsAudit.summary,
    warning: suttacentralAbhidhammaRightsAudit.warning,
  },
  suttacentralChineseParallelAudit: {
    version: suttacentralChineseParallels.version,
    status: suttacentralChineseParallels.status,
    file: inputs.suttacentralChineseParallels,
    sha256: sha256(rawById.suttacentralChineseParallels),
    sourceCommit: suttacentralChineseParallels.source.commit,
    sourceRows: suttacentralChineseParallels.source.rows,
    ...suttacentralChineseParallels.summary,
    warning: suttacentralChineseParallels.warning,
  },
  suttacentralParallelReviewQueue: {
    version: suttacentralParallelReviewQueue.version,
    status: suttacentralParallelReviewQueue.status,
    file: inputs.suttacentralParallelReviewQueue,
    sha256: sha256(rawById.suttacentralParallelReviewQueue),
    ...suttacentralParallelReviewQueue.summary,
    minimumIndependentReviews: suttacentralParallelReviewQueue.governance.minimumIndependentReviews,
    warning: suttacentralParallelReviewQueue.warning,
  },
  suttacentralParallelP0EvidencePackets: {
    version: suttacentralParallelP0EvidencePackets.version,
    status: suttacentralParallelP0EvidencePackets.status,
    file: inputs.suttacentralParallelP0EvidencePackets,
    sha256: sha256(rawById.suttacentralParallelP0EvidencePackets),
    ...suttacentralParallelP0EvidencePackets.summary,
    warning: suttacentralParallelP0EvidencePackets.warning,
  },
  cbetaT18BoundaryAudit: {
    version: cbetaT18Batch.version,
    status: cbetaT18Batch.boundaryAudit.status,
    file: inputs.cbetaT18Batch,
    sha256: sha256(rawById.cbetaT18Batch),
    ...cbetaT18Batch.collection,
    candidateRelationsNotMerged: cbetaT18Batch.boundaryAudit.candidateRelationsNotMerged,
    caveat: cbetaT18Batch.boundaryAudit.caveat,
  },
  cbetaT19BoundaryAudit: {
    version: cbetaT19Batch.version,
    status: cbetaT19Batch.boundaryAudit.status,
    file: inputs.cbetaT19Batch,
    sha256: sha256(rawById.cbetaT19Batch),
    ...cbetaT19Batch.collection,
    candidateRelationsNotMerged: cbetaT19Batch.boundaryAudit.candidateRelationsNotMerged,
    irregularJuanSequences: cbetaT19Batch.boundaryAudit.irregularJuanSequences,
    caveat: cbetaT19Batch.boundaryAudit.caveat,
  },
  cbetaT20BoundaryAudit: {
    version: cbetaT20Batch.version,
    status: cbetaT20Batch.boundaryAudit.status,
    file: inputs.cbetaT20Batch,
    sha256: sha256(rawById.cbetaT20Batch),
    ...cbetaT20Batch.collection,
    candidateRelationsNotMerged: cbetaT20Batch.boundaryAudit.candidateRelationsNotMerged,
    caveat: cbetaT20Batch.boundaryAudit.caveat,
  },
  cbetaT21BoundaryAudit: {
    version: cbetaT21Batch.version,
    status: cbetaT21Batch.boundaryAudit.status,
    file: inputs.cbetaT21Batch,
    sha256: sha256(rawById.cbetaT21Batch),
    ...cbetaT21Batch.collection,
    candidateRelationsNotMerged: cbetaT21Batch.boundaryAudit.candidateRelationsNotMerged,
    caveat: cbetaT21Batch.boundaryAudit.caveat,
  },
  cbetaT22BoundaryAudit: {
    version: cbetaT22Batch.version,
    status: cbetaT22Batch.boundaryAudit.status,
    file: inputs.cbetaT22Batch,
    sha256: sha256(rawById.cbetaT22Batch),
    ...cbetaT22Batch.collection,
    candidateRelationsNotMerged: cbetaT22Batch.boundaryAudit.candidateRelationsNotMerged,
    caveat: cbetaT22Batch.boundaryAudit.caveat,
  },
  cbetaT23BoundaryAudit: {
    version: cbetaT23Batch.version,
    status: cbetaT23Batch.boundaryAudit.status,
    file: inputs.cbetaT23Batch,
    sha256: sha256(rawById.cbetaT23Batch),
    ...cbetaT23Batch.collection,
    candidateRelationsNotMerged: cbetaT23Batch.boundaryAudit.candidateRelationsNotMerged,
    caveat: cbetaT23Batch.boundaryAudit.caveat,
  },
  cbetaT24BoundaryAudit: {
    version: cbetaT24Batch.version,
    status: cbetaT24Batch.boundaryAudit.status,
    file: inputs.cbetaT24Batch,
    sha256: sha256(rawById.cbetaT24Batch),
    ...cbetaT24Batch.collection,
    editionOrRecensionGroups: cbetaT24Batch.boundaryAudit.editionOrRecensionGroups,
    verifiedTranslationGroups: cbetaT24Batch.boundaryAudit.verifiedTranslationGroups,
    candidateRelationsNotMerged: cbetaT24Batch.boundaryAudit.candidateRelationsNotMerged,
    caveat: cbetaT24Batch.boundaryAudit.caveat,
  },
  cbetaT25BoundaryAudit: {
    version: cbetaT25Batch.version,
    status: cbetaT25Batch.boundaryAudit.status,
    file: inputs.cbetaT25Batch,
    sha256: sha256(rawById.cbetaT25Batch),
    ...cbetaT25Batch.collection,
    editionOrRecensionGroups: cbetaT25Batch.boundaryAudit.editionOrRecensionGroups,
    verifiedTranslationGroups: cbetaT25Batch.boundaryAudit.verifiedTranslationGroups,
    rootTextCommentaryGroups: cbetaT25Batch.boundaryAudit.rootTextCommentaryGroups,
    candidateRelationsNotMerged: cbetaT25Batch.boundaryAudit.candidateRelationsNotMerged,
    caveat: cbetaT25Batch.boundaryAudit.caveat,
  },
  cbetaT26BoundaryAudit: {
    version: cbetaT26Batch.version,
    status: cbetaT26Batch.boundaryAudit.status,
    file: inputs.cbetaT26Batch,
    sha256: sha256(rawById.cbetaT26Batch),
    ...cbetaT26Batch.collection,
    editionOrRecensionGroups: cbetaT26Batch.boundaryAudit.editionOrRecensionGroups,
    verifiedTranslationGroups: cbetaT26Batch.boundaryAudit.verifiedTranslationGroups,
    rootTextCommentaryGroups: cbetaT26Batch.boundaryAudit.rootTextCommentaryGroups,
    candidateRelationsNotMerged: cbetaT26Batch.boundaryAudit.candidateRelationsNotMerged,
    caveat: cbetaT26Batch.boundaryAudit.caveat,
  },
  cbetaT27BoundaryAudit: {
    version: cbetaT27Batch.version,
    status: cbetaT27Batch.boundaryAudit.status,
    file: inputs.cbetaT27Batch,
    sha256: sha256(rawById.cbetaT27Batch),
    ...cbetaT27Batch.collection,
    rootTreatiseCommentaryGroups: cbetaT27Batch.boundaryAudit.rootTreatiseCommentaryGroups,
    candidateRelationsNotMerged: cbetaT27Batch.boundaryAudit.candidateRelationsNotMerged,
    caveat: cbetaT27Batch.boundaryAudit.caveat,
  },
  cbetaT28BoundaryAudit: {
    version: cbetaT28Batch.version,
    status: cbetaT28Batch.boundaryAudit.status,
    file: inputs.cbetaT28Batch,
    sha256: sha256(rawById.cbetaT28Batch),
    ...cbetaT28Batch.collection,
    editionOrRecensionGroups: cbetaT28Batch.boundaryAudit.editionOrRecensionGroups,
    verifiedTranslationGroups: cbetaT28Batch.boundaryAudit.verifiedTranslationGroups,
    rootTreatiseCommentaryGroups: cbetaT28Batch.boundaryAudit.rootTreatiseCommentaryGroups,
    candidateRelationsNotMerged: cbetaT28Batch.boundaryAudit.candidateRelationsNotMerged,
    partialWorkWitnesses: cbetaT28Batch.boundaryAudit.partialWorkWitnesses,
    caveat: cbetaT28Batch.boundaryAudit.caveat,
  },
  cbetaT29BoundaryAudit: {
    version: cbetaT29Batch.version,
    status: cbetaT29Batch.boundaryAudit.status,
    file: inputs.cbetaT29Batch,
    sha256: sha256(rawById.cbetaT29Batch),
    ...cbetaT29Batch.collection,
    editionOrRecensionGroups: cbetaT29Batch.boundaryAudit.editionOrRecensionGroups,
    verifiedTranslationGroups: cbetaT29Batch.boundaryAudit.verifiedTranslationGroups,
    rootTreatiseCommentaryGroups: cbetaT29Batch.boundaryAudit.rootTreatiseCommentaryGroups,
    candidateRelationsNotMerged: cbetaT29Batch.boundaryAudit.candidateRelationsNotMerged,
    partialWorkWitnesses: cbetaT29Batch.boundaryAudit.partialWorkWitnesses,
    caveat: cbetaT29Batch.boundaryAudit.caveat,
  },
  cbetaT30BoundaryAudit: {
    version: cbetaT30Batch.version,
    status: cbetaT30Batch.boundaryAudit.status,
    file: inputs.cbetaT30Batch,
    sha256: sha256(rawById.cbetaT30Batch),
    ...cbetaT30Batch.collection,
    editionOrRecensionGroups: cbetaT30Batch.boundaryAudit.editionOrRecensionGroups,
    verifiedTranslationGroups: cbetaT30Batch.boundaryAudit.verifiedTranslationGroups,
    rootTreatiseCommentaryGroups: cbetaT30Batch.boundaryAudit.rootTreatiseCommentaryGroups,
    candidateRelationsNotMerged: cbetaT30Batch.boundaryAudit.candidateRelationsNotMerged,
    partialWorkWitnesses: cbetaT30Batch.boundaryAudit.partialWorkWitnesses,
    caveat: cbetaT30Batch.boundaryAudit.caveat,
  },
  cbetaT31BoundaryAudit: {
    version: cbetaT31Batch.version,
    status: cbetaT31Batch.boundaryAudit.status,
    file: inputs.cbetaT31Batch,
    sha256: sha256(rawById.cbetaT31Batch),
    ...cbetaT31Batch.collection,
    verifiedTranslationGroups: cbetaT31Batch.boundaryAudit.verifiedTranslationGroups,
    rootTreatiseCommentaryGroups: cbetaT31Batch.boundaryAudit.rootTreatiseCommentaryGroups,
    componentGroups: cbetaT31Batch.boundaryAudit.componentGroups,
    candidateRelationsNotMerged: cbetaT31Batch.boundaryAudit.candidateRelationsNotMerged,
    partialWorkWitnesses: cbetaT31Batch.boundaryAudit.partialWorkWitnesses,
    caveat: cbetaT31Batch.boundaryAudit.caveat,
  },
  cbetaT32BoundaryAudit: {
    version: cbetaT32Batch.version,
    status: cbetaT32Batch.boundaryAudit.status,
    file: inputs.cbetaT32Batch,
    sha256: sha256(rawById.cbetaT32Batch),
    ...cbetaT32Batch.collection,
    verifiedTranslationGroups: cbetaT32Batch.boundaryAudit.verifiedTranslationGroups,
    rootTreatiseCommentaryGroups: cbetaT32Batch.boundaryAudit.rootTreatiseCommentaryGroups,
    relatedDistinctWorkGroups: cbetaT32Batch.boundaryAudit.relatedDistinctWorkGroups,
    candidateRelationsNotMerged: cbetaT32Batch.boundaryAudit.candidateRelationsNotMerged,
    partialWorkWitnesses: cbetaT32Batch.boundaryAudit.partialWorkWitnesses,
    caveat: cbetaT32Batch.boundaryAudit.caveat,
  },
  cbetaT33BoundaryAudit: {
    version: cbetaT33Batch.version,
    status: cbetaT33Batch.boundaryAudit.status,
    file: inputs.cbetaT33Batch,
    sha256: sha256(rawById.cbetaT33Batch),
    ...cbetaT33Batch.collection,
    rootTreatiseCommentaryGroups: cbetaT33Batch.boundaryAudit.rootTreatiseCommentaryGroups,
    subcommentaryGroups: cbetaT33Batch.boundaryAudit.subcommentaryGroups,
    relatedDistinctWorkGroups: cbetaT33Batch.boundaryAudit.relatedDistinctWorkGroups,
    candidateRelationsNotMerged: cbetaT33Batch.boundaryAudit.candidateRelationsNotMerged,
    partialWorkWitnesses: cbetaT33Batch.boundaryAudit.partialWorkWitnesses,
    sourceRoles: cbetaT33Batch.boundaryAudit.sourceRoles,
    caveat: cbetaT33Batch.boundaryAudit.caveat,
  },
  cbetaT34BoundaryAudit: {
    version: cbetaT34Batch.version,
    status: cbetaT34Batch.boundaryAudit.status,
    file: inputs.cbetaT34Batch,
    sha256: sha256(rawById.cbetaT34Batch),
    ...cbetaT34Batch.collection,
    rootTreatiseCommentaryGroups: cbetaT34Batch.boundaryAudit.rootTreatiseCommentaryGroups,
    subcommentaryGroups: cbetaT34Batch.boundaryAudit.subcommentaryGroups,
    relatedDistinctWorkGroups: cbetaT34Batch.boundaryAudit.relatedDistinctWorkGroups,
    candidateRelationsNotMerged: cbetaT34Batch.boundaryAudit.candidateRelationsNotMerged,
    partialWorkWitnesses: cbetaT34Batch.boundaryAudit.partialWorkWitnesses,
    sourceRoles: cbetaT34Batch.boundaryAudit.sourceRoles,
    caveat: cbetaT34Batch.boundaryAudit.caveat,
  },
  cbetaT35BoundaryAudit: {
    version: cbetaT35Batch.version,
    status: cbetaT35Batch.boundaryAudit.status,
    file: inputs.cbetaT35Batch,
    sha256: sha256(rawById.cbetaT35Batch),
    ...cbetaT35Batch.collection,
    rootTreatiseCommentaryGroups: cbetaT35Batch.boundaryAudit.rootTreatiseCommentaryGroups,
    subcommentaryGroups: cbetaT35Batch.boundaryAudit.subcommentaryGroups,
    relatedDistinctWorkGroups: cbetaT35Batch.boundaryAudit.relatedDistinctWorkGroups,
    candidateRelationsNotMerged: cbetaT35Batch.boundaryAudit.candidateRelationsNotMerged,
    partialWorkWitnesses: cbetaT35Batch.boundaryAudit.partialWorkWitnesses,
    sourceRoles: cbetaT35Batch.boundaryAudit.sourceRoles,
    caveat: cbetaT35Batch.boundaryAudit.caveat,
  },
  cbetaT36BoundaryAudit: {
    version: cbetaBatch.version,
    status: cbetaBatch.boundaryAudit.status,
    file: inputs.cbetaBatch,
    sha256: sha256(rawById.cbetaBatch),
    ...cbetaBatch.collection,
    rootTreatiseCommentaryGroups: cbetaBatch.boundaryAudit.rootTreatiseCommentaryGroups,
    subcommentaryGroups: cbetaBatch.boundaryAudit.subcommentaryGroups,
    relatedDistinctWorkGroups: cbetaBatch.boundaryAudit.relatedDistinctWorkGroups,
    candidateRelationsNotMerged: cbetaBatch.boundaryAudit.candidateRelationsNotMerged,
    partialWorkWitnesses: cbetaBatch.boundaryAudit.partialWorkWitnesses,
    sourceRoles: cbetaBatch.boundaryAudit.sourceRoles,
    caveat: cbetaBatch.boundaryAudit.caveat,
  },
  works: [...nonCbetaWorks, ...indicWorks, ...vinayaWorks, ...abhidhammaWorks, ...cbetaWorks],
};
if (
  registry.works.length !== 1880 ||
  registry.works.flatMap((work) => work.expressions).length !== 2098 ||
  new Set(registry.works.map((work) => work.id)).size !== registry.works.length
) throw new Error("跨语种登记册 v5.4.0 作品或文本表达统计不一致");
const registryRaw = `${JSON.stringify(registry, null, 2)}\n`;
const checksumRaw = [
  `${sha256(registryRaw)}  registry-v5.4.0.json`,
  ...entries.slice(1).map(([, relativePath, raw]) => `${sha256(raw)}  ${relativePath.split("/").at(-1)}`),
].join("\n") + "\n";

if (process.argv.includes("--verify")) {
  if (await readFile(outputPath, "utf8") !== registryRaw) throw new Error("registry-v5.4.0.json 不可复现");
  if (await readFile(checksumPath, "utf8") !== checksumRaw) throw new Error("checksums-v5.4.0.sha256 不可复现");
  console.log("跨语种登记册 v5.4.0 可复现：T36 8/8 固定来源已完成八十卷根经、直接注疏、再注释、略策、章释、经论、纲目与宫廷讲义边界审计；全球作品分母保持未知。");
} else {
  await writeFile(outputPath, registryRaw, "utf8");
  await writeFile(checksumPath, checksumRaw, "utf8");
  console.log("跨语种登记册 v5.4.0 已生成：T36 新增 8 个华严经疏作品与 8 个完整表达；八十卷根经、直接注疏、再注释、略策、章释、经论、纲目与宫廷讲义保持可审计边界。");
}

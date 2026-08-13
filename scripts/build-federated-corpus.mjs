import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const inputs = {
  base: "data/gbcr/registry-v2.1.0.json",
  snapshots: "data/gbcr/source-snapshots-v0.3.0.json",
  inventory: "data/gbcr/cbeta-taisho-sutra-inventory-v0.2.1.json",
  dergeInventory: "data/gbcr/bdrc-derge-kangyur-inventory-v0.3.0.json",
  rights84000: "data/gbcr/84000-rights-policy-v0.3.0.json",
  cbetaT12Batch: "data/corpus/cbeta/batch-v1.9.0.json",
  cbetaT13Batch: "data/corpus/cbeta/batch-v2.0.0.json",
  cbetaT14Batch: "data/corpus/cbeta/batch-v2.1.0.json",
  cbetaT15Batch: "data/corpus/cbeta/batch-v2.2.0.json",
  cbetaT16Batch: "data/corpus/cbeta/batch-v2.3.0.json",
  cbetaBatch: "data/corpus/cbeta/batch-v2.4.0.json",
  cbetaCatalog: "data/corpus/cbeta/catalog-v2.4.0.json",
  cbetaManifest: "data/corpus/cbeta/manifest-v2.4.0.json",
  cbetaRegistry: "data/gbcr/registry-cbeta-v2.4.0.json",
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
const outputPath = resolve(root, "data/gbcr/registry-v2.5.0.json");
const checksumPath = resolve(root, "data/gbcr/checksums-v2.5.0.sha256");
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
  cbetaBatch.version !== "2.4.0" || cbetaBatch.files.length !== 129 ||
  cbetaBatch.collection.sourceRecordDenominator !== 131 ||
  cbetaBatch.collection.previouslyControlledSourceRecords !== 2 ||
  cbetaBatch.collection.controlledSourceRecords !== 131 ||
  cbetaBatch.collection.newSourceBytes !== 14726248 ||
  cbetaBatch.collection.newStableSegments !== 81274 ||
  cbetaCatalog.files.length !== 868 || cbetaManifest.files.length !== 868 ||
  cbetaRegistry.registry.version !== "2.4.0" || cbetaRegistry.works.length !== 705 ||
  cbetaRegistry.works.flatMap((work) => work.expressions).length !== 868
) throw new Error("CBETA T17 固定批次、目录、清单或登记册统计不一致");

const cbetaFamily = cbetaRegistry.sourceFamilies.find((family) => family.id === "cbeta_chinese");
if (
  cbetaFamily?.controlledExpressionRecords !== 881 ||
  cbetaFamily?.controlledExpressionBytes !== 247280257
) throw new Error("CBETA 汉译经藏受控来源记录统计不一致");
const dergeSource = snapshots.sources.find((source) => source.id === "bdrc_derge_kangyur");
if (
  snapshots.version !== "0.3.0" || snapshots.denominatorReady !== false ||
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
const sourceFamilies = base.sourceFamilies.map((family) => {
  if (family.id === "cbeta_chinese") return cbetaFamily;
  if (family.id !== "tibetan_kangyur_tengyur") return family;
  return {
    ...family,
    primarySources: ["bdrc_derge_kangyur", "bdrc_linked_data", "bdrc_iiif", "84000_progress"],
    denominatorStatus: "fixed_edition_expression_snapshot_ready",
    denominatorWorks: null,
    candidateEditionId: dergeInventory.source.instanceId,
    candidateEditionTitle: dergeInventory.source.titleZh,
    candidateTopLevelCatalogRecords: dergeInventory.totals.topLevelCatalogRecords,
    candidateExpressionRecords: dergeInventory.totals.topLevelExpressionRecords,
    excludedCatalogOnlyRecords: dergeInventory.totals.excludedCatalogOnlyRecords,
    nestedTextPartRecords: dergeInventory.totals.nestedTextPartRecords,
    dergeIdentifierRecords: dergeInventory.totals.dergeIdentifierRecords,
    candidateLinkedAbstractWorkIds: dergeInventory.totals.linkedAbstractWorkIds,
    volumeManifests: dergeInventory.totals.volumeManifests,
    inventoryFile: dergeSource.inventoryFile,
    inventorySha256: dergeSource.inventorySha256,
    denominatorNote: "德格甘珠尔初印本固定版本已冻结 1,122 个顶层目录项；其中 1,114 个可定位表达式、8 个无法定位到初印本的目录补充项，另有 71 个嵌套子文本。BDRC 当前关联出 844 个抽象作品标识，但尚未完成跨版本、跨目录和跨语言独立复核，因此作品分母继续保持未知。",
  };
});
const sourceSnapshots = [
  ...base.sourceSnapshots.map((source) => source.id === "84000_progress" ? {
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
];

const registry = {
  ...base,
  registry: { ...base.registry, version: "2.5.0", publishedAt: "2026-08-13" },
  sourceFamilies,
  sourceSnapshots,
  works: [...nonCbetaWorks, ...cbetaWorks],
};
if (
  registry.works.length !== 978 ||
  registry.works.flatMap((work) => work.expressions).length !== 1141 ||
  new Set(registry.works.map((work) => work.id)).size !== registry.works.length
) throw new Error("跨语种登记册 v2.5.0 作品或文本表达统计不一致");
const registryRaw = `${JSON.stringify(registry, null, 2)}\n`;
const checksumRaw = [
  `${sha256(registryRaw)}  registry-v2.5.0.json`,
  ...entries.slice(1).map(([, relativePath, raw]) => `${sha256(raw)}  ${relativePath.split("/").at(-1)}`),
].join("\n") + "\n";

if (process.argv.includes("--verify")) {
  if (await readFile(outputPath, "utf8") !== registryRaw) throw new Error("registry-v2.5.0.json 不可复现");
  if (await readFile(checksumPath, "utf8") !== checksumRaw) throw new Error("checksums-v2.5.0.sha256 不可复现");
  console.log("跨语种登记册 v2.5.0 可复现：978 个受控作品实体、1141 个受控表达；德格甘珠尔 1114 个固定版本候选表达。");
} else {
  await writeFile(outputPath, registryRaw, "utf8");
  await writeFile(checksumPath, checksumRaw, "utf8");
  console.log("跨语种登记册 v2.5.0 已生成：德格甘珠尔 1114 个可定位固定版本候选表达进入全球分母账本。");
}

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const inputs = {
  base: "data/gbcr/registry-v2.1.0.json",
  snapshots: "data/gbcr/source-snapshots-v0.2.1.json",
  inventory: "data/gbcr/cbeta-taisho-sutra-inventory-v0.2.1.json",
  cbetaT12Batch: "data/corpus/cbeta/batch-v1.9.0.json",
  cbetaT13Batch: "data/corpus/cbeta/batch-v2.0.0.json",
  cbetaT14Batch: "data/corpus/cbeta/batch-v2.1.0.json",
  cbetaT15Batch: "data/corpus/cbeta/batch-v2.2.0.json",
  cbetaBatch: "data/corpus/cbeta/batch-v2.3.0.json",
  cbetaCatalog: "data/corpus/cbeta/catalog-v2.3.0.json",
  cbetaManifest: "data/corpus/cbeta/manifest-v2.3.0.json",
  cbetaRegistry: "data/gbcr/registry-cbeta-v2.3.0.json",
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
const outputPath = resolve(root, "data/gbcr/registry-v2.3.0.json");
const checksumPath = resolve(root, "data/gbcr/checksums-v2.3.0.sha256");
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
  cbetaBatch.version !== "2.3.0" || cbetaBatch.files.length !== 62 ||
  cbetaBatch.collection.sourceRecordDenominator !== 65 ||
  cbetaBatch.collection.previouslyControlledSourceRecords !== 3 ||
  cbetaBatch.collection.controlledSourceRecords !== 65 ||
  cbetaBatch.collection.newSourceBytes !== 11363551 ||
  cbetaBatch.collection.newStableSegments !== 59284 ||
  cbetaCatalog.files.length !== 739 || cbetaManifest.files.length !== 739 ||
  cbetaRegistry.registry.version !== "2.3.0" || cbetaRegistry.works.length !== 596 ||
  cbetaRegistry.works.flatMap((work) => work.expressions).length !== 739
) throw new Error("CBETA T16 固定批次、目录、清单或登记册统计不一致");

const cbetaFamily = cbetaRegistry.sourceFamilies.find((family) => family.id === "cbeta_chinese");
if (
  cbetaFamily?.controlledExpressionRecords !== 752 ||
  cbetaFamily?.controlledExpressionBytes !== 232554009
) throw new Error("CBETA 汉译经藏受控来源记录统计不一致");
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
const sourceFamilies = base.sourceFamilies.map((family) =>
  family.id === "cbeta_chinese" ? cbetaFamily : family,
);

const registry = {
  ...base,
  registry: { ...base.registry, version: "2.3.0", publishedAt: "2026-08-12" },
  sourceFamilies,
  works: [...nonCbetaWorks, ...cbetaWorks],
};
if (
  registry.works.length !== 869 ||
  registry.works.flatMap((work) => work.expressions).length !== 1012 ||
  new Set(registry.works.map((work) => work.id)).size !== registry.works.length
) throw new Error("跨语种登记册 v2.3.0 作品或文本表达统计不一致");
const registryRaw = `${JSON.stringify(registry, null, 2)}\n`;
const checksumRaw = [
  `${sha256(registryRaw)}  registry-v2.3.0.json`,
  ...entries.slice(1).map(([, relativePath, raw]) => `${sha256(raw)}  ${relativePath.split("/").at(-1)}`),
].join("\n") + "\n";

if (process.argv.includes("--verify")) {
  if (await readFile(outputPath, "utf8") !== registryRaw) throw new Error("registry-v2.3.0.json 不可复现");
  if (await readFile(checksumPath, "utf8") !== checksumRaw) throw new Error("checksums-v2.3.0.sha256 不可复现");
  console.log("跨语种登记册 v2.3.0 可复现：869 个作品实体、1012 个文本表达或见证。");
} else {
  await writeFile(outputPath, registryRaw, "utf8");
  await writeFile(checksumPath, checksumRaw, "utf8");
  console.log("跨语种登记册 v2.3.0 已生成：CBETA T16 经集部固定来源记录完成 65/65。");
}

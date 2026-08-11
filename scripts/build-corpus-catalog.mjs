import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { buildPageNavigation, parseCbetaReadingLines } from "../src/lib/cbeta-tei.mjs";

const root = process.cwd();
const outputVersion = "0.5.0";
const catalogPath = resolve(root, "data/corpus/cbeta/catalog-v0.5.0.json");
const snapshotPath = resolve(root, "data/gbcr/source-snapshots-v0.2.1.json");
const inventoryPath = resolve(root, "data/gbcr/cbeta-taisho-sutra-inventory-v0.2.1.json");
const previousRegistryPath = resolve(root, "data/gbcr/registry-v0.1.0.json");
const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
const snapshots = JSON.parse(await readFile(snapshotPath, "utf8"));
const inventoryRaw = await readFile(inventoryPath, "utf8");
const inventory = JSON.parse(inventoryRaw);
const previousRegistry = JSON.parse(await readFile(previousRegistryPath, "utf8"));
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const requireUnique = (values, label) => {
  if (new Set(values).size !== values.length) throw new Error(`${label} 存在重复值`);
};

requireUnique(catalog.files.map((file) => file.id), "经号");
requireUnique(catalog.files.map((file) => file.slug), "阅读 slug");
requireUnique(catalog.files.map((file) => file.localPath), "本地路径");
requireUnique(catalog.files.map((file) => file.upstreamPath), "上游路径");
const cbetaSnapshotSource = snapshots.sources.find((source) => source.id === "cbeta_xml_p5");
const registrySnapshotSource = previousRegistry.sourceSnapshots.find((source) => source.id === "cbeta_xml_p5");
if (
  catalog.source.commit !== cbetaSnapshotSource?.commit ||
  catalog.source.commit !== registrySnapshotSource?.snapshot.ref
) {
  throw new Error("受控目录、来源快照与登记册的 CBETA 提交不一致");
}
const cbetaSubsetSnapshot = cbetaSnapshotSource.candidateSubsets.find(
  (subset) => subset.id === "taisho_chinese_sutra_t01_t17",
);
if (
  inventory.source.commit !== catalog.source.commit ||
  inventory.totals.records !== cbetaSubsetSnapshot?.candidateRecordCount ||
  inventory.totals.upstreamBytes !== cbetaSubsetSnapshot?.candidateBytes ||
  sha256(inventoryRaw) !== cbetaSubsetSnapshot?.inventorySha256
) {
  throw new Error("汉译经藏逐文件清单与来源快照不一致");
}
const inventoryByPath = new Map(inventory.records.map((record) => [record.upstreamPath, record]));

const files = [];
const worksById = new Map();
for (const entry of catalog.files) {
  const bytes = await readFile(resolve(root, entry.localPath));
  if (bytes.length !== entry.localBytes || sha256(bytes) !== entry.localSha256) {
    throw new Error(`${entry.id} 本地受控文件与目录哈希不一致`);
  }
  const segments = parseCbetaReadingLines(bytes.toString("utf8"), { canonId: entry.id });
  const navigation = buildPageNavigation(segments);
  const juans = [...new Set(segments.map((segment) => segment.juan))];
  if (
    segments.length !== entry.verification.segments ||
    navigation.length !== entry.verification.folios ||
    JSON.stringify(juans) !== JSON.stringify(entry.verification.juans) ||
    !entry.verification.anchors.every((anchor) => segments.some((segment) => segment.id === anchor))
  ) {
    throw new Error(`${entry.id} 结构或稳定锚点与受控目录不一致`);
  }

  files.push(Object.fromEntries(Object.entries(entry).filter(([key]) => !["presentation", "verification", "workTitle"].includes(key))));
  const tradition = entry.presentation.tradition.split(" · ")[0];
  const work = worksById.get(entry.workId) ?? {
    id: entry.workId,
    canonicalTitle: entry.workTitle ?? entry.presentation.title,
    traditions: [],
    externalIds: { cbeta: [] },
    expressions: []
  };
  if (!work.traditions.includes(tradition)) work.traditions.push(tradition);
  work.externalIds.cbeta.push(entry.id);
  work.expressions.push({
      id: `gbcr:expression:${entry.id}-zh-Hant`,
      language: "lzh-Hant",
      title: entry.presentation.title,
      translator: entry.presentation.translator,
      sourceSnapshotId: "cbeta_xml_p5",
      localSlug: entry.slug,
      cataloged: true,
      fullSourceText: true,
      sourceTextAsset: {
        path: entry.localPath,
        format: entry.format,
        sha256: entry.localSha256,
        rightsStatus: "restricted_noncommercial"
      },
      sampled: entry.verification.humanSampleVerified,
      stableSegments: segments.length,
      rightsReviewed: true,
      qualityStatus: entry.verification.humanSampleVerified ? "verified_sample" : "verified_structure_and_anchors"
  });
  worksById.set(entry.workId, work);
}
const works = [...worksById.values()];

const manifest = {
  schema: "https://foxue.ai/schemas/corpus-asset-manifest-v0.2",
  version: outputVersion,
  source: catalog.source,
  rightsDecision: catalog.rightsDecision,
  normalization: catalog.normalization,
  files
};

const cbetaSubset = snapshots.sources
  .find((source) => source.id === "cbeta_xml_p5")
  ?.candidateSubsets?.find((subset) => subset.id === "taisho_chinese_sutra_t01_t17");
if (!cbetaSubset) throw new Error("缺少汉译经藏候选子集快照");
const controlledSubsetRecords = files.filter((file) => /^T\/T(0[1-9]|1[0-7])\//.test(file.upstreamPath)).length;
const controlledSubsetFiles = files.filter((file) => /^T\/T(0[1-9]|1[0-7])\//.test(file.upstreamPath));
for (const file of controlledSubsetFiles) {
  const inventoryRecord = inventoryByPath.get(file.upstreamPath);
  if (
    !inventoryRecord ||
    inventoryRecord.upstreamGitBlobSha1 !== file.upstreamGitBlobSha1 ||
    inventoryRecord.upstreamBytes !== file.upstreamBytes
  ) {
    throw new Error(`${file.id} 与汉译经藏逐文件清单不一致`);
  }
}
const controlledSubsetBytes = controlledSubsetFiles.reduce((sum, file) => sum + file.upstreamBytes, 0);
const sourceFamilies = previousRegistry.sourceFamilies.map((family) => family.id === "cbeta_chinese"
  ? {
      ...family,
      denominatorStatus: "candidate_expression_snapshot_ready",
      candidateSubsetId: cbetaSubset.id,
      candidateExpressionRecords: cbetaSubset.candidateRecordCount,
      controlledExpressionRecords: controlledSubsetRecords,
      candidateExpressionBytes: cbetaSubset.candidateBytes,
      controlledExpressionBytes: controlledSubsetBytes,
      denominatorWorks: null,
      denominatorNote: "881 是大正藏 T01–T17 汉译经藏候选文本记录，不是去重后的全球作品数。"
    }
  : family);
const registry = {
  ...previousRegistry,
  registry: { ...previousRegistry.registry, version: outputVersion, publishedAt: catalog.publishedAt },
  sourceFamilies,
  works
};

const serialize = (value) => `${JSON.stringify(value, null, 2)}\n`;
const manifestRaw = serialize(manifest);
const registryRaw = serialize(registry);
const snapshotRaw = await readFile(snapshotPath, "utf8");
const checksumRaw = `${sha256(registryRaw)}  registry-v0.5.0.json\n${sha256(snapshotRaw)}  source-snapshots-v0.2.1.json\n${sha256(inventoryRaw)}  cbeta-taisho-sutra-inventory-v0.2.1.json\n`;
const outputs = [
  [resolve(root, "data/corpus/cbeta/manifest-v0.5.0.json"), manifestRaw],
  [resolve(root, "data/gbcr/registry-v0.5.0.json"), registryRaw],
  [resolve(root, "data/gbcr/checksums-v0.5.0.sha256"), checksumRaw],
];
const expressionCount = works.reduce((sum, work) => sum + work.expressions.length, 0);
const segmentCount = works.flatMap((work) => work.expressions).reduce((sum, expression) => sum + expression.stableSegments, 0);
if (process.argv.includes("--verify")) {
  for (const [path, expected] of outputs) {
    if (await readFile(path, "utf8") !== expected) {
      throw new Error(`${path} 与受控目录确定性输出不一致`);
    }
  }
  console.log(`语料目录 v${outputVersion} 可复现：${works.length} 部作品、${expressionCount} 个完整文本，${segmentCount} 个稳定行段。`);
} else {
  for (const [path, content] of outputs) await writeFile(path, content, "utf8");
  console.log(`语料目录 v${outputVersion} 已生成：${works.length} 部作品、${expressionCount} 个完整文本，${segmentCount} 个稳定行段。`);
}

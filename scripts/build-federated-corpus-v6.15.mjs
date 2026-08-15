import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const verifyMode = process.argv.includes("--verify");
const basePath = "data/gbcr/registry-v6.14.0.json";
const manifestPath = "data/corpus/derge/manifest-v0.1.0.json";
const inventoryPath = "data/gbcr/esukhia-derge-kangyur-inventory-v0.8.0.json";
const sourceSnapshotsPath = "data/gbcr/source-snapshots-v4.5.0.json";
const outputPath = "data/gbcr/registry-v6.15.0.json";
const checksumPath = "data/gbcr/checksums-v6.15.0.sha256";
const metadataPath = "src/lib/corpus-registry-metadata.ts";
const [baseBytes, manifestBytes, inventoryBytes, sourceSnapshotsBytes] = await Promise.all(
  [basePath, manifestPath, inventoryPath, sourceSnapshotsPath].map((path) => readFile(resolve(root, path))),
);
const base = JSON.parse(baseBytes.toString("utf8"));
const manifest = JSON.parse(manifestBytes.toString("utf8"));
const inventory = JSON.parse(inventoryBytes.toString("utf8"));
const sourceSnapshots = JSON.parse(sourceSnapshotsBytes.toString("utf8"));
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const jsonRaw = (value) => `${JSON.stringify(value, null, 2)}\n`;

if (base.registry.version !== "6.14.0" || base.works.length !== 2526) throw new Error("GBCR v6.14 基线漂移");
if (manifest.files.length !== 1122 || inventory.totals.linkedAbstractWorkIds !== 851) throw new Error("德格受控清单统计漂移");
if (sourceSnapshots.version !== "4.5.0") throw new Error("来源快照必须为 v4.5.0");

const grouped = new Map();
for (const file of manifest.files) {
  const files = grouped.get(file.workId) ?? [];
  files.push(file);
  grouped.set(file.workId, files);
}
const baseIds = new Set(base.works.map((work) => work.id));
for (const workId of grouped.keys()) if (baseIds.has(workId)) throw new Error(`德格作品标识与既有登记册冲突：${workId}`);

const dergeWorks = [...grouped.entries()].map(([workId, files]) => {
  const first = files[0];
  const canonIds = files.map((file) => file.id);
  return {
    id: workId,
    workType: "catalog_authority_candidate",
    canonicalTitle: first.presentation.alternateTitle,
    canonicalTitleZh: canonIds.length === 1
      ? `德格《甘珠尔》${canonIds[0]}`
      : `德格《甘珠尔》${canonIds[0]} 等 ${canonIds.length} 个目录表达`,
    traditions: ["藏传佛教"],
    externalIds: {
      bdrcAbstractWork: [first.catalogAlignment.linkedAbstractWorkId],
      derge: canonIds,
      bdrcExpression: files.map((file) => file.catalogAlignment.expressionId),
    },
    relationDecision: "BDRC 链接抽象作品标识作为本批次的作品层目录权威候选；同一标识下的多个德格编号分别保存为文本表达。跨版本、跨目录与跨传统同一性仍须独立复核。",
    attributionDecision: "传统《甘珠尔》规范位置不自动等于佛陀逐字亲说；每项说者、作者、译者与编集责任等待逐条审计。",
    expressions: files.map((file) => ({
      id: `gbcr:expression:${file.id}-bo-Tibt-esukhia-a582cf471b7c`,
      language: "bo-Tibt",
      title: file.presentation.alternateTitle,
      edition: "Esukhia Digital Derge Kangyur；以 LOC W4CZ5369 为主要校勘图像来源",
      sourceSnapshotId: "esukhia_derge_kangyur",
      localSlug: file.slug,
      cataloged: true,
      fullSourceText: true,
      sampled: false,
      stableSegments: file.verification.segments,
      rightsReviewed: true,
      qualityStatus: "verified_structure_rights_and_anchors",
      completenessDecision: "固定数字版中该顶层德格目录表达完整；不外推为跨版本规范作品完整性。",
      attributionDecision: file.attributionDecision,
      sourceTextAssets: file.sourceParts.map((source) => ({
        part: source.part,
        id: source.id,
        volume: source.volume,
        path: source.localPath,
        format: source.format,
        bytes: source.localBytes,
        sha256: source.localSha256,
        byteRange: source.byteRange,
        upstreamPath: source.upstreamPath,
        upstreamGitBlobSha1: source.upstreamGitBlobSha1,
        rightsStatus: "public_domain",
      })),
    })),
  };
});
if (dergeWorks.length !== 851) throw new Error(`德格作品分组应为 851，实际 ${dergeWorks.length}`);

const sourceFamilies = base.sourceFamilies.map((family) => family.id !== "tibetan_kangyur_tengyur" ? family : {
  ...family,
  primarySources: [...new Set([...family.primarySources, "esukhia_derge_kangyur"])],
  denominatorStatus: "multi_edition_catalog_snapshots_with_one_complete_public_domain_derge_text_witness",
  candidateTopLevelCatalogRecords: 1122,
  candidateExpressionRecords: 1122,
  parphudLocatedExpressionRecords: 1114,
  parphudExcludedOrUnlocatedCatalogRecords: 8,
  controlledDergeExpressions: 1122,
  controlledDergeLinkedWorkCandidates: 851,
  controlledDergeVolumes: 102,
  controlledDergeSourceBytes: manifest.collection.sourceBytes,
  controlledDergeStableSegments: manifest.collection.stableSegments,
  controlledDergeReadingUnits: manifest.collection.readingUnits,
  nestedTextPartRecords: 76,
  bdrcParphudNestedTextPartRecords: 71,
  dergeIdentifierRecords: 1198,
  candidateLinkedAbstractWorkIds: 851,
  esukhiaInventoryFile: inventoryPath,
  esukhiaInventorySha256: sha256(inventoryBytes),
  esukhiaManifestFile: manifestPath,
  esukhiaManifestSha256: sha256(manifestBytes),
  denominatorNote: "Esukhia 固定提交中的 001–102 卷已按 1,122 个顶层德格编号完整受控，映射到 851 个 BDRC 链接作品候选并生成 458,913 个稳定行段；第 103 卷目录与 76 个组件标记只作结构证据。该 100% 只适用于一个固定德格数字见证，不是全球藏文佛典、跨版本去重作品或佛陀亲说分母。BDRC 初印本目录与 LOC 导向 Esukhia 文本的版本差异保持公开，作品分母继续未知。",
});

const esukhiaSnapshot = {
  id: "esukhia_derge_kangyur",
  name: "Esukhia Digital Derge Kangyur",
  role: "德格《甘珠尔》固定公开领域全文、版页行号与顶层目录表达源",
  homepage: "https://github.com/Esukhia/derge-kangyur",
  dataUrl: `https://github.com/Esukhia/derge-kangyur/tree/${manifest.source.commit}/text`,
  licenseUrl: `https://github.com/Esukhia/derge-kangyur/blob/${manifest.source.commit}/README.md#license`,
  formatUrl: `https://github.com/Esukhia/derge-kangyur/blob/${manifest.source.commit}/README.md#format`,
  snapshot: {
    type: "git",
    ref: manifest.source.commit,
    capturedAt: "2026-08-16",
    relatedRefs: { tree: manifest.source.tree, textTree: manifest.source.textTree },
  },
  inventory: {
    file: inventoryPath,
    sha256: sha256(inventoryBytes),
    manifestFile: manifestPath,
    manifestSha256: sha256(manifestBytes),
    canonicalVolumes: 102,
    controlledTopLevelExpressions: 1122,
    linkedWorkCandidates: 851,
    controlledSourceBytes: manifest.collection.sourceBytes,
    stableSegments: manifest.collection.stableSegments,
    readingUnits: manifest.collection.readingUnits,
  },
  rights: {
    status: "public_domain",
    summary: "上游 README 明确声明该机械复制本属于 Public Domain；foxue.ai 固定提交与 README blob，保留来源署名、版本边界和可逆字节切片证据，并按政策禁止用于生成式模型训练。",
  },
};
if (base.sourceSnapshots.some((source) => source.id === esukhiaSnapshot.id)) throw new Error("GBCR 基线已包含 Esukhia 来源");

const registry = {
  ...base,
  registry: { ...base.registry, version: "6.15.0", publishedAt: "2026-08-16" },
  sourceFamilies,
  sourceSnapshots: [...base.sourceSnapshots, esukhiaSnapshot],
  works: [...base.works, ...dergeWorks],
  dergeKangyurFullTextAudit: {
    status: "complete_fixed_digital_witness_with_global_denominator_unknown",
    sourceSnapshotId: "esukhia_derge_kangyur",
    canonicalVolumes: 102,
    referenceCatalogVolumes: 1,
    topLevelExpressions: 1122,
    linkedWorkCandidates: 851,
    componentMarkers: 76,
    stableSegments: manifest.collection.stableSegments,
    readingUnits: manifest.collection.readingUnits,
    sourceBytes: manifest.collection.sourceBytes,
    publicDomain: true,
    byteReconstructionVerified: true,
    inventoryFile: inventoryPath,
    inventorySha256: sha256(inventoryBytes),
    manifestFile: manifestPath,
    manifestSha256: sha256(manifestBytes),
    caveat: "本审计证明固定 Esukhia 德格数字见证的来源完整性、权利和结构完整性；不证明跨版本作品去重、每项佛陀逐字亲说归属或全球 99% 覆盖。",
  },
};

const expressions = registry.works.flatMap((work) => work.expressions);
const totals = {
  works: registry.works.length,
  expressions: expressions.length,
  fullSourceExpressions: expressions.filter((expression) => expression.fullSourceText).length,
  worksWithFullSource: registry.works.filter((work) => work.expressions.some((expression) => expression.fullSourceText)).length,
  stableSegments: expressions.reduce((sum, expression) => sum + (expression.stableSegments ?? 0), 0),
};
const expected = {
  works: 3377,
  expressions: 3868,
  fullSourceExpressions: 3825,
  worksWithFullSource: 3350,
  stableSegments: 5618245,
};
if (JSON.stringify(totals) !== JSON.stringify(expected)) throw new Error(`GBCR v6.15 统计不一致：${JSON.stringify(totals)}`);

const registryRaw = jsonRaw(registry);
const checksumRaw = [
  `${sha256(Buffer.from(registryRaw))}  registry-v6.15.0.json`,
  `${sha256(manifestBytes)}  ../corpus/derge/manifest-v0.1.0.json`,
  `${sha256(inventoryBytes)}  esukhia-derge-kangyur-inventory-v0.8.0.json`,
  `${sha256(sourceSnapshotsBytes)}  source-snapshots-v4.5.0.json`,
].join("\n") + "\n";
const metadataRaw = `// Generated by scripts/build-federated-corpus-v6.15.mjs. Do not edit manually.\nexport const CORPUS_REGISTRY_VERSION = "6.15.0" as const;\n`;

if (verifyMode) {
  for (const [path, expectedRaw] of [[outputPath, registryRaw], [checksumPath, checksumRaw], [metadataPath, metadataRaw]]) {
    if (await readFile(resolve(root, path), "utf8") !== expectedRaw) throw new Error(`${path} 不可复现`);
  }
  console.log(`GBCR v6.15 可复现：${totals.works} 个作品候选、${totals.expressions} 个表达、${totals.stableSegments} 个稳定行段；全球分母保持未知。`);
} else {
  await Promise.all([
    writeFile(resolve(root, outputPath), registryRaw),
    writeFile(resolve(root, checksumPath), checksumRaw),
    writeFile(resolve(root, metadataPath), metadataRaw),
  ]);
  console.log(`GBCR v6.15 已生成：新增 851 个 BDRC 链接作品候选与 1,122 个德格完整表达；共 ${totals.stableSegments} 个稳定行段。`);
}

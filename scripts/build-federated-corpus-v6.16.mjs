import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const verifyMode = process.argv.includes("--verify");
const basePath = "data/gbcr/registry-v6.15.0.json";
const manifestPath = "data/corpus/suttacentral/lzh-manifest-v1.6.0.json";
const batchPath = "data/corpus/suttacentral/lzh-batch-v1.6.0.json";
const auditPath = "data/gbcr/suttacentral-lzh-root-rights-audit-v1.1.0.json";
const outputPath = "data/gbcr/registry-v6.16.0.json";
const checksumPath = "data/gbcr/checksums-v6.16.0.sha256";
const metadataPath = "src/lib/corpus-registry-metadata.ts";
const [baseBytes, manifestBytes, batchBytes, auditBytes] = await Promise.all(
  [basePath, manifestPath, batchPath, auditPath].map((path) => readFile(resolve(root, path))),
);
const base = JSON.parse(baseBytes.toString("utf8"));
const manifest = JSON.parse(manifestBytes.toString("utf8"));
const batch = JSON.parse(batchBytes.toString("utf8"));
const audit = JSON.parse(auditBytes.toString("utf8"));
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const jsonRaw = (value) => `${JSON.stringify(value, null, 2)}\n`;

if (base.registry.version !== "6.15.0" || base.works.length !== 3377) throw new Error("GBCR v6.15 基线漂移");
if (manifest.version !== "1.6.0" || manifest.files.length !== 7) throw new Error("古汉译 root 清单漂移");
if (batch.collection.sourceRecordCount !== 272 || audit.summary.stableSegments !== 38644) throw new Error("古汉译 root 批次或审计统计漂移");
if (batch.rightsAudit.sha256 !== sha256(auditBytes)) throw new Error("古汉译批次引用的权利审计指纹漂移");

const filesByWorkId = new Map();
for (const file of manifest.files) {
  if (filesByWorkId.has(file.workId)) throw new Error(`古汉译见证重复指向作品：${file.workId}`);
  filesByWorkId.set(file.workId, file);
}
if (filesByWorkId.size !== 7) throw new Error("古汉译见证必须复用七个既有作品");

const works = base.works.map((work) => {
  const file = filesByWorkId.get(work.id);
  if (!file) return work;
  const expressionId = `gbcr:expression:${file.id}-zh-Hant-suttacentral-eac6c24781dd`;
  if (work.expressions.some((expression) => expression.id === expressionId)) throw new Error(`${expressionId} 已存在`);
  return {
    ...work,
    expressions: [...work.expressions, {
      id: expressionId,
      language: "zh-Hant",
      title: file.presentation.alternateTitle,
      edition: file.presentation.translator,
      sourceSnapshotId: "suttacentral_bilara",
      localSlug: file.slug,
      cataloged: true,
      fullSourceText: file.fullSourceText,
      sampled: false,
      stableSegments: file.verification.segments,
      rightsReviewed: true,
      qualityStatus: "verified_structure_rights_and_anchors",
      completenessDecision: file.fullSourceText
        ? "固定 SuttaCentral 提交中的该 sct 古汉译 root 表达完整；不外推为跨版本规范作品完整性。"
        : "固定提交中的全部已发布来源文件均已保存，但只覆盖该作品的局部选段，因此 fullSourceText 保持 false。",
      relationDecision: file.relationDecision,
      sourceTextAssets: file.sourceParts.map((source) => ({
        part: source.part,
        id: source.id,
        path: source.localPath,
        format: source.format,
        bytes: source.localBytes,
        sha256: source.localSha256,
        upstreamPath: source.upstreamPath,
        upstreamGitBlobSha1: source.upstreamGitBlobSha1,
        rightsStatus: source.rightsStatus,
      })),
    }],
  };
});
if (works.filter((work, index) => work !== base.works[index]).length !== 7) throw new Error("未能定位全部七个既有作品");

const sourceFamilies = base.sourceFamilies.map((family) => family.id !== "suttacentral_early_buddhist_texts" ? family : {
  ...family,
  denominatorStatus: "candidate_snapshot_with_all_pali_lzh_and_controlled_indic_roots",
  controlledAllLanguageWorks: 296,
  controlledAllLanguageExpressions: 296,
  controlledAllLanguageRootRecords: 7584,
  controlledAllLanguageRootBytes: 43828843,
  controlledClassicalChineseWitnessWorks: 7,
  controlledClassicalChineseExpressions: 7,
  controlledClassicalChineseCompleteExpressions: 4,
  controlledClassicalChinesePartialWitnessGroups: 3,
  controlledClassicalChineseRootRecords: 272,
  controlledClassicalChineseRootBytes: 2922861,
  controlledClassicalChineseStableSegments: 38644,
  controlledClassicalChineseOmittedPlaceholders: 2,
  classicalChineseRightsAuditFile: auditPath,
  classicalChineseRightsAuditSha256: sha256(auditBytes),
  denominatorNote: "固定提交中 7,288 份巴利 root、272 份古汉译 lzh/sct root、2 份梵文和 22 份俗语 root 均已逐文件受控。古汉译文件复用七个既有 GBCR 作品：T0765、T1536、T1537、T1548 为完整数字表达，MA、SA、EA 为局部见证；不新增作品。物理文件、数字见证和平行关系不冒充独立作品，固定来源内的文件控制率不能外推为全球佛典覆盖率。",
});

const sourceSnapshots = base.sourceSnapshots.map((source) => source.id !== "suttacentral_bilara" ? source : {
  ...source,
  role: "经文、原生段落标识、古汉译数字见证与平行关系候选源",
  rights: {
    ...source.rights,
    summary: "SuttaCentral 材料权利逐项处理。7,288 份巴利、272 份古汉译、2 份梵文和 22 份俗语 root 由官方政策列为公共领域；第三方译文未导入，保留来源署名，禁止用于模型训练。",
  },
  inventory: {
    ...source.inventory,
    controlledRootRecords: 7584,
    controlledClassicalChineseRootRecords: 272,
    controlledClassicalChineseRootBytes: 2922861,
    controlledClassicalChineseStableSegments: 38644,
    classicalChineseRightsAuditFile: auditPath,
    classicalChineseRightsAuditSha256: sha256(auditBytes),
  },
});

const registry = {
  ...base,
  registry: { ...base.registry, version: "6.16.0", publishedAt: "2026-08-16" },
  sourceFamilies,
  sourceSnapshots,
  works,
  suttacentralClassicalChineseRootAudit: {
    status: "seven_existing_work_witnesses_controlled_global_denominator_unknown",
    sourceSnapshotId: "suttacentral_bilara",
    sourceRecords: 272,
    sourceBytes: 2922861,
    sourceSegments: 38646,
    stableSegments: 38644,
    omittedEmptyEditorialPlaceholderSegments: 2,
    completeExpressions: 4,
    partialWitnessGroups: 3,
    existingWorksReused: 7,
    newWorksCreated: 0,
    rightsReviewed: true,
    thirdPartyTranslationsImported: false,
    modelTrainingApproved: false,
    byteReconstructionVerified: true,
    auditFile: auditPath,
    auditSha256: sha256(auditBytes),
    batchFile: batchPath,
    batchSha256: sha256(batchBytes),
    manifestFile: manifestPath,
    manifestSha256: sha256(manifestBytes),
    caveat: "本审计证明固定 SuttaCentral 提交中 272 份古汉译 root 的来源、权利、字节和段落结构；不证明 MA、SA、EA 全经完整，也不建立全球去重作品分母或 99% 覆盖。",
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
const expected = { works: 3377, expressions: 3875, fullSourceExpressions: 3829, worksWithFullSource: 3350, stableSegments: 5656889 };
if (JSON.stringify(totals) !== JSON.stringify(expected)) throw new Error(`GBCR v6.16 统计不一致：${JSON.stringify(totals)}`);
if (
  registry.claimPolicy.publishable !== false ||
  Object.entries(registry.globalDenominators)
    .filter(([key]) => key !== "status" && key !== "unknownMeans")
    .some(([, value]) => value !== null)
) {
  throw new Error("全球覆盖声明必须保持不可发布且全部全局分母为 null");
}

const registryRaw = jsonRaw(registry);
const checksumRaw = [
  `${sha256(Buffer.from(registryRaw))}  registry-v6.16.0.json`,
  `${sha256(baseBytes)}  registry-v6.15.0.json`,
  `${sha256(manifestBytes)}  ../corpus/suttacentral/lzh-manifest-v1.6.0.json`,
  `${sha256(batchBytes)}  ../corpus/suttacentral/lzh-batch-v1.6.0.json`,
  `${sha256(auditBytes)}  suttacentral-lzh-root-rights-audit-v1.1.0.json`,
].join("\n") + "\n";
const metadataRaw = `// Generated by scripts/build-federated-corpus-v6.16.mjs. Do not edit manually.\nexport const CORPUS_REGISTRY_VERSION = "6.16.0" as const;\n`;

if (verifyMode) {
  // v6.16 is now a historical release. Reproduce and verify its immutable
  // registry and checksums without requiring the mutable current-version
  // pointer to move backwards from v6.17.
  for (const [path, expectedRaw] of [[outputPath, registryRaw], [checksumPath, checksumRaw]]) {
    if (await readFile(resolve(root, path), "utf8") !== expectedRaw) throw new Error(`${path} 不可复现`);
  }
  console.log(`GBCR v6.16 可复现：${totals.works} 个作品、${totals.expressions} 个表达、${totals.stableSegments} 个稳定段落；全球分母保持未知。`);
} else {
  await Promise.all([writeFile(resolve(root, outputPath), registryRaw), writeFile(resolve(root, checksumPath), checksumRaw), writeFile(resolve(root, metadataPath), metadataRaw)]);
  console.log(`GBCR v6.16 已生成：新增 7 个既有作品的古汉译数字见证、38,644 个稳定段落，0 个新增作品。`);
}

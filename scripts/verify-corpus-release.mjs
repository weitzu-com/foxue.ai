import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { loadCorpusReleaseContext } from "./corpus-release-context.mjs";

const root = process.cwd();
const { releaseFingerprint, releaseId, sourceManifests } = await loadCorpusReleaseContext(root);
const registry = JSON.parse(
  await readFile(resolve(root, "data/gbcr/registry-v3.3.0.json"), "utf8"),
);
const workerConfig = JSON.parse(
  await readFile(resolve(root, "infra/corpus-edge/wrangler.jsonc"), "utf8"),
);
const outputRoot = resolve(root, "artifacts", "corpus-release", releaseId);
const uploadPlan = JSON.parse(await readFile(resolve(outputRoot, "upload-plan.json"), "utf8"));
const errors = [];
const requireValue = (condition, message) => {
  if (!condition) errors.push(message);
};
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const sourceUnits = (file) => file.sourceParts ?? [file];
const expressionSourcePaths = (expression) => expression?.sourceTextAssets?.map((asset) => asset.path) ??
  [expression?.sourceTextAsset?.path].filter(Boolean);
const controlledFiles = sourceManifests.flatMap((source) =>
  source.manifest.files.map((file) => ({ file, source })));

requireValue(uploadPlan.releaseId === releaseId, "上传计划 releaseId 不一致");
requireValue(workerConfig.vars?.RELEASE_ID === releaseId, "Worker RELEASE_ID 与发布包不一致");
requireValue(uploadPlan.bucket === "foxue-ai-corpus", "上传计划存储桶不一致");
requireValue(uploadPlan.entries.at(-1)?.key === "v1/latest.json", "latest 指针必须最后发布");

const planByKey = new Map();
for (const entry of uploadPlan.entries) {
  requireValue(!planByKey.has(entry.key), `对象键重复：${entry.key}`);
  requireValue(!entry.key.includes("..") && !entry.key.startsWith("/"), `对象键不安全：${entry.key}`);
  planByKey.set(entry.key, entry);
  const bytes = await readFile(resolve(outputRoot, entry.relativePath));
  requireValue(bytes.length === entry.bytes, `对象字节数漂移：${entry.key}`);
  requireValue(sha256(bytes) === entry.sha256, `对象 SHA-256 漂移：${entry.key}`);
}

const manifestKey = `v1/releases/${releaseId}/manifest.json`;
const releaseManifest = JSON.parse(await readFile(resolve(outputRoot, manifestKey), "utf8"));
const expectedSegments = controlledFiles.reduce((sum, { file: sourceFile }) => {
  const work = registry.works.find((candidate) => candidate.id === sourceFile.workId);
  requireValue(Boolean(work), `${sourceFile.id} 在 GBCR 中缺少作品记录`);
  const expression = work?.expressions.find(
    (candidate) => JSON.stringify(expressionSourcePaths(candidate)) ===
      JSON.stringify(sourceUnits(sourceFile).map((source) => source.localPath)),
  );
  requireValue(Boolean(expression), `${sourceFile.id} 在 GBCR 中缺少对应文本表达`);
  return sum + (expression?.stableSegments ?? 0);
}, 0);
requireValue(releaseManifest.releaseId === releaseId, "发布清单 releaseId 不一致");
requireValue(releaseManifest.releaseFingerprint === releaseFingerprint, "发布清单构建指纹不一致");
requireValue(releaseManifest.sourceSnapshots?.length === sourceManifests.length, "发布来源快照数量不一致");
for (const source of sourceManifests) {
  const recorded = releaseManifest.sourceSnapshots?.find((item) => item.id === source.id);
  requireValue(recorded?.commit === source.manifest.source.commit, `${source.id} 发布来源提交不一致`);
  requireValue(recorded?.manifestSha256 === sha256(source.bytes), `${source.id} 发布来源清单哈希不一致`);
}
requireValue(releaseManifest.totals.expressions === controlledFiles.length, "发布文本表达数不一致");
requireValue(releaseManifest.totals.segments === expectedSegments, "发布行段数与 GBCR 不一致");
requireValue(releaseManifest.objects.length === releaseManifest.totals.immutableObjects, "不可变对象计数不一致");

const stableIds = new Set();
let verifiedSegments = 0;
let verifiedFolios = 0;

for (const work of releaseManifest.expressions) {
  const controlled = controlledFiles.find(({ file }) => file.id === work.canonId);
  const sourceFile = controlled?.file;
  requireValue(Boolean(sourceFile), `发布作品没有受控来源：${work.canonId}`);
  if (!sourceFile) continue;
  requireValue(work.slug === sourceFile.slug, `${work.canonId} slug 不一致`);

  const index = JSON.parse(await readFile(resolve(outputRoot, work.indexObjectKey), "utf8"));
  requireValue(
    sha256(await readFile(resolve(outputRoot, work.indexObjectKey))) === work.indexSha256,
    `${work.canonId} 索引哈希不一致`,
  );
  requireValue(index.releaseId === releaseId, `${work.canonId} 索引版本不一致`);
  requireValue(index.sourceSnapshotId === controlled?.source.id, `${work.canonId} 来源快照标识不一致`);
  requireValue(index.parser === (sourceFile.parser ?? "cbeta_tei"), `${work.canonId} 解析器标识不一致`);
  requireValue(index.navigation.length === index.totals.folios, `${work.canonId} 版页数不一致`);
  requireValue(index.totals.segments === work.segments, `${work.canonId} 行段数不一致`);

  const expectedSources = sourceUnits(sourceFile);
  requireValue(index.sources?.length === expectedSources.length, `${work.canonId} 来源资产数量不一致`);
  for (const [position, expectedSource] of expectedSources.entries()) {
    const source = index.sources?.[position];
    requireValue(source?.part === (expectedSource.part ?? position + 1), `${expectedSource.id} 来源分片顺序不一致`);
    requireValue(source?.id === expectedSource.id, `${expectedSource.id} 来源资产标识不一致`);
    requireValue(source?.upstreamPath === expectedSource.upstreamPath, `${expectedSource.id} 上游路径不一致`);
    const sourceBytes = source?.objectKey
      ? await readFile(resolve(outputRoot, source.objectKey))
      : Buffer.alloc(0);
    requireValue(sha256(sourceBytes) === expectedSource.localSha256, `${expectedSource.id} 来源哈希不一致`);
    if ((sourceFile.parser ?? "cbeta_tei") === "cbeta_tei") {
      requireValue(sourceBytes.includes(Buffer.from("<teiHeader>")), `${expectedSource.id} TEI 头部缺失`);
    } else {
      try {
        const value = JSON.parse(sourceBytes.toString("utf8"));
        requireValue(Boolean(value[expectedSource.firstSegmentId]), `${expectedSource.id} JSON 首段缺失`);
        requireValue(Boolean(value[expectedSource.lastSegmentId]), `${expectedSource.id} JSON 末段缺失`);
      } catch {
        requireValue(false, `${expectedSource.id} 不是有效 JSON`);
      }
    }
  }

  let workSegments = 0;
  for (const [position, navigation] of index.navigation.entries()) {
    requireValue(navigation.position === position + 1, `${work.canonId} 导航顺序不连续`);
    const folioBytes = await readFile(resolve(outputRoot, navigation.objectKey));
    requireValue(sha256(folioBytes) === navigation.sha256, `${navigation.key} 版页哈希不一致`);
    const folio = JSON.parse(folioBytes.toString("utf8"));
    requireValue(folio.folio.key === navigation.key, `${navigation.key} 版页键不一致`);
    requireValue(folio.folio.firstSegmentId === navigation.id, `${navigation.key} 首行锚点不一致`);
    requireValue(folio.segments.length > 0, `${navigation.key} 没有正文行段`);

    for (const segment of folio.segments) {
      requireValue(!stableIds.has(segment.id), `稳定行号重复：${segment.id}`);
      stableIds.add(segment.id);
      requireValue(segment.juan === navigation.juan, `${segment.id} 卷号与版页不一致`);
      requireValue(segment.page === (navigation.sourcePage ?? navigation.label), `${segment.id} 页码与导航不一致`);
      if ((sourceFile.parser ?? "cbeta_tei") === "bilara_root_json") {
        requireValue(/^dhp\d+:\d+(?:\.\d+)?$/.test(segment.id), `${segment.id} Bilara 原生标识无效`);
      } else if (sourceFile.parser === "bilara_single_root_json") {
        requireValue(/^(?:dn|mn)\d+:\d+(?:[.-]\d+)*$/.test(segment.id), `${segment.id} Bilara 单经原生标识无效`);
      } else if (sourceFile.parser === "bilara_collection_root_json") {
        requireValue(/^(?:sn|an)\d+\.\d+(?:-\d+)?:\d+(?:[.-]\d+)*$/.test(segment.id), `${segment.id} Bilara 经集原生标识无效`);
      } else if (sourceFile.parser === "bilara_series_root_json") {
        requireValue(/^[a-z][a-z0-9.-]*:\d+(?:[.-]\d+)*$/.test(segment.id), `${segment.id} Bilara 多文件文本原生标识无效`);
      } else {
        requireValue(segment.id === `${work.canonId}.${segment.juan}.${segment.sourceLine}`, `${segment.id} 行号结构不一致`);
      }
    }
    workSegments += folio.segments.length;
    verifiedFolios += 1;
  }
  requireValue(workSegments === index.totals.segments, `${work.canonId} 分页行段合计不一致`);
  verifiedSegments += workSegments;
}

const latest = JSON.parse(await readFile(resolve(outputRoot, "v1/latest.json"), "utf8"));
requireValue(latest.releaseId === releaseId, "latest 发布 ID 不一致");
requireValue(latest.manifestObjectKey === manifestKey, "latest 清单路径不一致");
requireValue(latest.manifestSha256 === planByKey.get(manifestKey)?.sha256, "latest 清单哈希不一致");
requireValue(verifiedSegments === releaseManifest.totals.segments, "逐版页复算行段总数不一致");
requireValue(verifiedFolios === releaseManifest.totals.folios, "逐版页复算版页总数不一致");

for (const object of releaseManifest.objects) {
  const planObject = planByKey.get(object.key);
  requireValue(Boolean(planObject), `发布清单对象不在上传计划：${object.key}`);
  requireValue(planObject?.sha256 === object.sha256, `发布清单对象哈希不一致：${object.key}`);
}

if (errors.length > 0) {
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  process.exit(1);
}

console.log(
  `佛典发布包校验通过：${releaseManifest.totals.expressions} 个文本表达、${verifiedFolios} 阅读单元、${verifiedSegments} 稳定行段、${uploadPlan.entries.length} 个待发布对象。`,
);

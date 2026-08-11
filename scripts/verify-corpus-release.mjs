import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { loadCorpusReleaseContext } from "./corpus-release-context.mjs";

const root = process.cwd();
const { releaseFingerprint, releaseId, sourceManifest } = await loadCorpusReleaseContext(root);
const registry = JSON.parse(
  await readFile(resolve(root, "data/gbcr/registry-v0.3.0.json"), "utf8"),
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
const expectedSegments = sourceManifest.files.reduce((sum, sourceFile) => {
  const work = registry.works.find((candidate) => candidate.id === sourceFile.workId);
  requireValue(Boolean(work), `${sourceFile.id} 在 GBCR 中缺少作品记录`);
  const expression = work?.expressions.find(
    (candidate) => candidate.sourceTextAsset?.path === sourceFile.localPath,
  );
  requireValue(Boolean(expression), `${sourceFile.id} 在 GBCR 中缺少对应文本表达`);
  return sum + (expression?.stableSegments ?? 0);
}, 0);
requireValue(releaseManifest.releaseId === releaseId, "发布清单 releaseId 不一致");
requireValue(
  releaseManifest.sourceSnapshot.releaseFingerprint === releaseFingerprint,
  "发布清单构建指纹不一致",
);
requireValue(releaseManifest.totals.works === sourceManifest.files.length, "发布作品数不一致");
requireValue(releaseManifest.totals.segments === expectedSegments, "发布行段数与 GBCR 不一致");
requireValue(releaseManifest.objects.length === releaseManifest.totals.immutableObjects, "不可变对象计数不一致");

const stableIds = new Set();
let verifiedSegments = 0;
let verifiedFolios = 0;

for (const work of releaseManifest.works) {
  const sourceFile = sourceManifest.files.find((file) => file.id === work.canonId);
  requireValue(Boolean(sourceFile), `发布作品没有受控来源：${work.canonId}`);
  if (!sourceFile) continue;
  requireValue(work.slug === sourceFile.slug, `${work.canonId} slug 不一致`);

  const index = JSON.parse(await readFile(resolve(outputRoot, work.indexObjectKey), "utf8"));
  requireValue(
    sha256(await readFile(resolve(outputRoot, work.indexObjectKey))) === work.indexSha256,
    `${work.canonId} 索引哈希不一致`,
  );
  requireValue(index.releaseId === releaseId, `${work.canonId} 索引版本不一致`);
  requireValue(index.navigation.length === index.totals.folios, `${work.canonId} 版页数不一致`);
  requireValue(index.totals.segments === work.segments, `${work.canonId} 行段数不一致`);

  const sourceBytes = await readFile(resolve(outputRoot, index.source.objectKey));
  requireValue(sha256(sourceBytes) === sourceFile.localSha256, `${work.canonId} TEI 来源哈希不一致`);
  requireValue(sourceBytes.includes(Buffer.from("<teiHeader>")), `${work.canonId} TEI 头部缺失`);

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
      requireValue(segment.page === navigation.label, `${segment.id} 页码与版页不一致`);
      requireValue(segment.id === `${work.canonId}.${segment.juan}.${segment.sourceLine}`, `${segment.id} 行号结构不一致`);
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
  `佛典发布包校验通过：${releaseManifest.totals.works} 部、${verifiedFolios} 版页、${verifiedSegments} 稳定行段、${uploadPlan.entries.length} 个待发布对象。`,
);

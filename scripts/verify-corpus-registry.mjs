import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const registryPath = resolve(root, "data/gbcr/registry-v0.5.0.json");
const sourceSnapshotsPath = resolve(root, "data/gbcr/source-snapshots-v0.2.1.json");
const inventoryPath = resolve(root, "data/gbcr/cbeta-taisho-sutra-inventory-v0.2.1.json");
const checksumPath = resolve(root, "data/gbcr/checksums-v0.5.0.sha256");
const raw = await readFile(registryPath, "utf8");
const sourceSnapshotsRaw = await readFile(sourceSnapshotsPath, "utf8");
const inventoryRaw = await readFile(inventoryPath, "utf8");
const registry = JSON.parse(raw);
const sourceSnapshots = JSON.parse(sourceSnapshotsRaw);
const inventory = JSON.parse(inventoryRaw);
const errors = [];

const requireValue = (condition, message) => {
  if (!condition) errors.push(message);
};

requireValue(registry.schema === "https://foxue.ai/schemas/gbcr/registry-v0.1", "schema 版本不匹配");
requireValue(registry.registry?.version === "0.5.0", "登记册版本不匹配");
requireValue(registry.claimPolicy?.publishable === false, "全球分母未完成时不得发布 99% 声明");

const denominatorValues = [
  registry.globalDenominators?.catalogWorks,
  registry.globalDenominators?.fullSourceTextWorks,
  registry.globalDenominators?.translationWorks,
  registry.globalDenominators?.rightsPublishableWorks,
  registry.globalDenominators?.qualityApprovedWorks,
];
requireValue(denominatorValues.every((value) => value === null), "全球作品分母必须保持 null");

const unique = (values, label) => {
  requireValue(new Set(values).size === values.length, `${label} 存在重复标识`);
};

unique(registry.sourceFamilies.map((item) => item.id), "sourceFamilies");
unique(registry.sourceSnapshots.map((item) => item.id), "sourceSnapshots");
unique(registry.works.map((item) => item.id), "works");

const sourceIds = new Set(registry.sourceSnapshots.map((item) => item.id));
const expressionIds = [];
for (const work of registry.works) {
  requireValue(Object.keys(work.externalIds ?? {}).length > 0, `${work.id} 缺少外部目录标识`);
  for (const expression of work.expressions ?? []) {
    expressionIds.push(expression.id);
    requireValue(sourceIds.has(expression.sourceSnapshotId), `${expression.id} 引用了未知来源快照`);
    requireValue(Number.isInteger(expression.stableSegments) && expression.stableSegments >= 0, `${expression.id} 段落数无效`);
    if (expression.fullSourceText) {
      requireValue(expression.sourceTextAsset?.path, `${expression.id} 标为完整原文但没有受控资产路径`);
      requireValue(/^[a-f0-9]{64}$/.test(expression.sourceTextAsset?.sha256 ?? ""), `${expression.id} 完整原文缺少 SHA-256`);
    }
  }
}
unique(expressionIds, "expressions");

for (const source of registry.sourceSnapshots) {
  if (source.snapshot.type === "git") {
    requireValue(/^[a-f0-9]{40}$/.test(source.snapshot.ref), `${source.id} 未冻结到完整 Git 提交号`);
  }
  requireValue(source.rights?.status && source.rights?.summary, `${source.id} 缺少权利审核状态`);
}

requireValue(sourceSnapshots.denominatorReady === false, "候选来源记录尚未去重，不得标为分母就绪");
requireValue(sourceSnapshots.sources?.length === 2, "首版来源候选快照必须包含 CBETA 与 SuttaCentral");
for (const snapshot of sourceSnapshots.sources ?? []) {
  const registrySource = registry.sourceSnapshots.find((item) => item.id === snapshot.id);
  requireValue(registrySource?.snapshot.ref === snapshot.commit, `${snapshot.id} 的来源提交与登记册不一致`);
  requireValue(snapshot.treeTruncated === false, `${snapshot.id} 的 Git tree 快照被截断`);
  requireValue(snapshot.candidateRecordCount > 0, `${snapshot.id} 没有候选记录`);
  requireValue(/^[a-f0-9]{64}$/.test(snapshot.candidatePathSha256), `${snapshot.id} 缺少候选路径摘要`);
}
const chineseSubset = sourceSnapshots.sources
  .find((source) => source.id === "cbeta_xml_p5")
  ?.candidateSubsets?.find((subset) => subset.id === "taisho_chinese_sutra_t01_t17");
requireValue(chineseSubset?.candidateRecordCount === 881, "汉译经藏候选记录分母漂移");
requireValue(chineseSubset?.candidateBytes === 247280257, "汉译经藏候选字节数漂移");
requireValue(
  chineseSubset?.candidatePathSha256 === "69eb2530ae53000a606478824eec70e21fb238b495c0ee6c703e2e44f161cf44",
  "汉译经藏候选路径摘要漂移",
);
requireValue(chineseSubset?.inventoryFile === "data/gbcr/cbeta-taisho-sutra-inventory-v0.2.1.json", "汉译经藏逐文件清单路径不匹配");
requireValue(chineseSubset?.inventorySha256 === createHash("sha256").update(inventoryRaw).digest("hex"), "汉译经藏逐文件清单摘要不匹配");
requireValue(inventory?.totals?.records === 881, "汉译经藏逐文件清单记录数漂移");
requireValue(inventory?.totals?.upstreamBytes === 247280257, "汉译经藏逐文件清单字节数漂移");
requireValue(inventory?.records?.length === 881, "汉译经藏逐文件清单不完整");
unique(inventory.records.map((record) => record.sourceRecordId), "汉译经藏来源记录");
unique(inventory.records.map((record) => record.upstreamPath), "汉译经藏上游路径");
const chineseFamily = registry.sourceFamilies.find((family) => family.id === "cbeta_chinese");
requireValue(chineseFamily?.candidateExpressionRecords === 881, "汉译经藏候选记录未写入来源族");
requireValue(chineseFamily?.controlledExpressionRecords === 23, "汉译经藏受控记录数不匹配");
requireValue(chineseFamily?.candidateExpressionBytes === 247280257, "汉译经藏候选字节数未写入来源族");
requireValue(chineseFamily?.controlledExpressionBytes === 58444300, "汉译经藏受控字节数不匹配");

const checksumLines = (await readFile(checksumPath, "utf8")).trim().split("\n");
const checksums = new Map(checksumLines.map((line) => {
  const [hash, file] = line.trim().split(/\s+/);
  return [file, hash];
}));
const controlledFiles = [
  ["registry-v0.5.0.json", raw],
  ["source-snapshots-v0.2.1.json", sourceSnapshotsRaw],
  ["cbeta-taisho-sutra-inventory-v0.2.1.json", inventoryRaw],
];
for (const [file, content] of controlledFiles) {
  const actualHash = createHash("sha256").update(content).digest("hex");
  requireValue(checksums.get(file) === actualHash, `${file} 的 SHA-256 校验和不匹配`);
}

if (errors.length > 0) {
  console.error(errors.map((item) => `- ${item}`).join("\n"));
  process.exit(1);
}

const expressions = registry.works.flatMap((work) => work.expressions);
const segmentCount = expressions.reduce((sum, item) => sum + item.stableSegments, 0);
const candidateCount = sourceSnapshots.sources.reduce((sum, source) => sum + source.candidateRecordCount, 0);
const lankavatara = registry.works.find((work) => work.id === "gbcr:work:lankavatara-t0670");
const avatamsaka = registry.works.find((work) => work.id === "gbcr:work:avatamsaka-t0278");
const mahaparinirvana = registry.works.find((work) => work.id === "gbcr:work:mahaparinirvana-t0374");
requireValue(registry.works.length === 20, "v0.5 必须登记 20 部去重作品");
requireValue(expressions.length === 24, "v0.5 必须登记 24 个完整文本表达");
requireValue(segmentCount === 323555, "v0.5 稳定行段总数漂移");
requireValue(
  JSON.stringify(lankavatara?.externalIds?.cbeta) === JSON.stringify(["T0670", "T0671", "T0672"]),
  "《楞伽经》三个汉译文本未正确归并",
);
requireValue(lankavatara?.expressions?.length === 3, "《楞伽经》必须保留三个独立文本表达");
requireValue(
  JSON.stringify(avatamsaka?.externalIds?.cbeta) === JSON.stringify(["T0278", "T0279"]),
  "《华严经》六十卷本与八十卷本未正确归并",
);
requireValue(avatamsaka?.expressions?.length === 2, "《华严经》必须保留两个独立文本表达");
requireValue(
  JSON.stringify(mahaparinirvana?.externalIds?.cbeta) === JSON.stringify(["T0374", "T0375"]),
  "《大般涅槃经》北本与南本未正确归并",
);
requireValue(mahaparinirvana?.expressions?.length === 2, "《大般涅槃经》必须保留两个独立文本表达");
if (errors.length > 0) {
  console.error(errors.map((item) => `- ${item}`).join("\n"));
  process.exit(1);
}
console.log(`GBCR ${registry.registry.version} 已通过校验：${registry.works.length} 部作品、${expressions.length} 个完整文本，${segmentCount} 个稳定行段，${candidateCount} 条上游候选记录。`);

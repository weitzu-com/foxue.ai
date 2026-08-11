import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const registryPath = resolve(root, "data/gbcr/registry-v1.5.0.json");
const sourceSnapshotsPath = resolve(root, "data/gbcr/source-snapshots-v0.2.1.json");
const inventoryPath = resolve(root, "data/gbcr/cbeta-taisho-sutra-inventory-v0.2.1.json");
const checksumPath = resolve(root, "data/gbcr/checksums-v1.5.0.sha256");
const agamaBatchPath = resolve(root, "data/corpus/cbeta/batch-v1.3.0.json");
const benyuanBatchPath = resolve(root, "data/corpus/cbeta/batch-v1.4.0.json");
const prajnaparamitaBatchPath = resolve(root, "data/corpus/cbeta/batch-v1.5.0.json");
const cbetaCatalogPath = resolve(root, "data/corpus/cbeta/catalog-v1.5.0.json");
const cbetaManifestPath = resolve(root, "data/corpus/cbeta/manifest-v1.5.0.json");
const cbetaRegistryPath = resolve(root, "data/gbcr/registry-cbeta-v1.5.0.json");
const suttacentralBatchPath = resolve(root, "data/corpus/suttacentral/batch-v0.7.0.json");
const suttacentralManifestPath = resolve(root, "data/corpus/suttacentral/manifest-v0.7.0.json");
const dighaBatchPath = resolve(root, "data/corpus/suttacentral/dn-batch-v0.8.0.json");
const dighaManifestPath = resolve(root, "data/corpus/suttacentral/dn-manifest-v0.8.0.json");
const majjhimaBatchPath = resolve(root, "data/corpus/suttacentral/mn-batch-v0.9.0.json");
const majjhimaManifestPath = resolve(root, "data/corpus/suttacentral/mn-manifest-v0.9.0.json");
const samyuttaBatchPath = resolve(root, "data/corpus/suttacentral/sn-batch-v1.0.0.json");
const samyuttaManifestPath = resolve(root, "data/corpus/suttacentral/sn-manifest-v1.0.0.json");
const anguttaraBatchPath = resolve(root, "data/corpus/suttacentral/an-batch-v1.1.0.json");
const anguttaraManifestPath = resolve(root, "data/corpus/suttacentral/an-manifest-v1.1.0.json");
const khuddakaBatchPath = resolve(root, "data/corpus/suttacentral/kn-batch-v1.2.0.json");
const khuddakaManifestPath = resolve(root, "data/corpus/suttacentral/kn-manifest-v1.2.0.json");
const raw = await readFile(registryPath, "utf8");
const sourceSnapshotsRaw = await readFile(sourceSnapshotsPath, "utf8");
const inventoryRaw = await readFile(inventoryPath, "utf8");
const agamaBatchRaw = await readFile(agamaBatchPath, "utf8");
const benyuanBatchRaw = await readFile(benyuanBatchPath, "utf8");
const prajnaparamitaBatchRaw = await readFile(prajnaparamitaBatchPath, "utf8");
const cbetaCatalogRaw = await readFile(cbetaCatalogPath, "utf8");
const cbetaManifestRaw = await readFile(cbetaManifestPath, "utf8");
const cbetaRegistryRaw = await readFile(cbetaRegistryPath, "utf8");
const suttacentralBatchRaw = await readFile(suttacentralBatchPath, "utf8");
const suttacentralManifestRaw = await readFile(suttacentralManifestPath, "utf8");
const dighaBatchRaw = await readFile(dighaBatchPath, "utf8");
const dighaManifestRaw = await readFile(dighaManifestPath, "utf8");
const majjhimaBatchRaw = await readFile(majjhimaBatchPath, "utf8");
const majjhimaManifestRaw = await readFile(majjhimaManifestPath, "utf8");
const samyuttaBatchRaw = await readFile(samyuttaBatchPath, "utf8");
const samyuttaManifestRaw = await readFile(samyuttaManifestPath, "utf8");
const anguttaraBatchRaw = await readFile(anguttaraBatchPath, "utf8");
const anguttaraManifestRaw = await readFile(anguttaraManifestPath, "utf8");
const khuddakaBatchRaw = await readFile(khuddakaBatchPath, "utf8");
const khuddakaManifestRaw = await readFile(khuddakaManifestPath, "utf8");
const registry = JSON.parse(raw);
const sourceSnapshots = JSON.parse(sourceSnapshotsRaw);
const inventory = JSON.parse(inventoryRaw);
const agamaBatch = JSON.parse(agamaBatchRaw);
const benyuanBatch = JSON.parse(benyuanBatchRaw);
const prajnaparamitaBatch = JSON.parse(prajnaparamitaBatchRaw);
const cbetaCatalog = JSON.parse(cbetaCatalogRaw);
const cbetaManifest = JSON.parse(cbetaManifestRaw);
const cbetaRegistry = JSON.parse(cbetaRegistryRaw);
const suttacentralBatch = JSON.parse(suttacentralBatchRaw);
const suttacentralManifest = JSON.parse(suttacentralManifestRaw);
const dighaBatch = JSON.parse(dighaBatchRaw);
const dighaManifest = JSON.parse(dighaManifestRaw);
const majjhimaBatch = JSON.parse(majjhimaBatchRaw);
const majjhimaManifest = JSON.parse(majjhimaManifestRaw);
const samyuttaBatch = JSON.parse(samyuttaBatchRaw);
const samyuttaManifest = JSON.parse(samyuttaManifestRaw);
const anguttaraBatch = JSON.parse(anguttaraBatchRaw);
const anguttaraManifest = JSON.parse(anguttaraManifestRaw);
const khuddakaBatch = JSON.parse(khuddakaBatchRaw);
const khuddakaManifest = JSON.parse(khuddakaManifestRaw);
const errors = [];

const requireValue = (condition, message) => {
  if (!condition) errors.push(message);
};

requireValue(registry.schema === "https://foxue.ai/schemas/gbcr/registry-v0.1", "schema 版本不匹配");
requireValue(registry.registry?.version === "1.5.0", "登记册版本不匹配");
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
      const assets = expression.sourceTextAssets ?? [expression.sourceTextAsset].filter(Boolean);
      requireValue(assets.length > 0, `${expression.id} 标为完整原文但没有受控资产路径`);
      requireValue(assets.every((asset) => asset.path), `${expression.id} 完整原文资产缺少路径`);
      requireValue(assets.every((asset) => /^[a-f0-9]{64}$/.test(asset.sha256 ?? "")), `${expression.id} 完整原文缺少 SHA-256`);
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
requireValue(chineseFamily?.controlledExpressionRecords === 299, "汉译经藏受控记录数不匹配");
requireValue(chineseFamily?.candidateExpressionBytes === 247280257, "汉译经藏候选字节数未写入来源族");
requireValue(chineseFamily?.controlledExpressionBytes === 142623438, "汉译经藏受控字节数不匹配");
requireValue(chineseFamily?.agamaSourceRecordDenominator === 155, "汉译阿含部固定来源分母不匹配");
requireValue(chineseFamily?.agamaControlledSourceRecords === 155, "汉译阿含部固定来源未完整受控");
requireValue(chineseFamily?.agamaSourceRecordPercentage === 100, "汉译阿含部固定来源完成率不匹配");
requireValue(agamaBatch?.files?.length === 151, "CBETA T01–T02 新增来源记录数漂移");
requireValue(agamaBatch?.collection?.sourceRecordDenominator === 155, "CBETA T01–T02 固定来源分母漂移");
requireValue(agamaBatch?.collection?.controlledSourceRecords === 155, "CBETA T01–T02 固定来源未完整受控");
requireValue(agamaBatch?.collection?.newSourceBytes === 10508944, "CBETA T01–T02 新增来源字节数漂移");
requireValue(agamaBatch?.collection?.newStableSegments === 52551, "CBETA T01–T02 新增稳定行段数漂移");
requireValue(chineseFamily?.benyuanSourceRecordDenominator === 72, "汉译本缘部固定来源分母不匹配");
requireValue(chineseFamily?.benyuanControlledSourceRecords === 72, "汉译本缘部固定来源未完整受控");
requireValue(chineseFamily?.benyuanSourceRecordPercentage === 100, "汉译本缘部固定来源完成率不匹配");
requireValue(benyuanBatch?.files?.length === 71, "CBETA T03–T04 新增来源记录数漂移");
requireValue(benyuanBatch?.collection?.sourceRecordDenominator === 72, "CBETA T03–T04 固定来源分母漂移");
requireValue(benyuanBatch?.collection?.controlledSourceRecords === 72, "CBETA T03–T04 固定来源未完整受控");
requireValue(benyuanBatch?.collection?.newSourceBytes === 33152203, "CBETA T03–T04 新增来源字节数漂移");
requireValue(benyuanBatch?.collection?.newStableSegments === 150383, "CBETA T03–T04 新增稳定行段数漂移");
requireValue(benyuanBatch?.collection?.attributedAuthoredOrCompiledRecords === 8, "CBETA T03–T04 造撰集类边界漂移");
requireValue(benyuanBatch?.collection?.relationAnnotatedRecords === 17, "CBETA T03–T04 关系证据记录数漂移");
requireValue(benyuanBatch?.boundaryAudit?.status === "relation_candidates_recorded_work_dedup_pending", "CBETA T03–T04 作品边界状态不匹配");
requireValue(chineseFamily?.prajnaparamitaSourceRecordDenominator === 57, "汉译般若部固定来源分母不匹配");
requireValue(chineseFamily?.prajnaparamitaControlledSourceRecords === 57, "汉译般若部固定来源未完整受控");
requireValue(chineseFamily?.prajnaparamitaSourceRecordPercentage === 100, "汉译般若部固定来源完成率不匹配");
requireValue(prajnaparamitaBatch?.files?.length === 39, "CBETA T05–T08 新增来源记录数漂移");
requireValue(prajnaparamitaBatch?.collection?.sourceRecordDenominator === 57, "CBETA T05–T08 固定来源分母漂移");
requireValue(prajnaparamitaBatch?.collection?.controlledSourceRecords === 57, "CBETA T05–T08 固定来源未完整受控");
requireValue(prajnaparamitaBatch?.collection?.newSourceBytes === 11312892, "CBETA T05–T08 新增来源字节数漂移");
requireValue(prajnaparamitaBatch?.collection?.newStableSegments === 60230, "CBETA T05–T08 新增稳定行段数漂移");
requireValue(prajnaparamitaBatch?.collection?.verifiedSameWorkExpressions === 11, "CBETA T05–T08 已验证同作品表达数漂移");
requireValue(prajnaparamitaBatch?.collection?.provisionalRecords === 28, "CBETA T05–T08 暂定书目记录数漂移");
requireValue(prajnaparamitaBatch?.collection?.relationAnnotatedRecords === 35, "CBETA T05–T08 关系证据记录数漂移");
requireValue(prajnaparamitaBatch?.collection?.attributionBoundaryRecords === 3, "CBETA T05–T08 署名角色边界漂移");
requireValue(
  prajnaparamitaBatch?.boundaryAudit?.status === "verified_translation_groups_and_relation_candidates_recorded",
  "CBETA T05–T08 作品边界状态不匹配",
);
requireValue(cbetaCatalog?.files?.length === 286, "CBETA 受控目录文本记录数漂移");
requireValue(cbetaManifest?.files?.length === 286, "CBETA 资产清单文本记录数漂移");
requireValue(cbetaRegistry?.works?.length === 271, "CBETA 书目实体数漂移");
const suttacentralFamily = registry.sourceFamilies.find(
  (family) => family.id === "suttacentral_early_buddhist_texts",
);
requireValue(suttacentralFamily?.controlledWorks === 273, "巴利受控作品数不匹配");
requireValue(suttacentralFamily?.controlledExpressions === 273, "巴利受控表达数不匹配");
requireValue(suttacentralFamily?.controlledRootRecords === 5764, "巴利受控 root 记录数不匹配");
requireValue(suttacentralFamily?.controlledRootBytes === 22786236, "巴利受控 root 字节数不匹配");
requireValue(suttacentralFamily?.controlledSuttaRootRecords === 5764, "巴利经藏受控 root 记录数不匹配");
requireValue(suttacentralFamily?.suttaRootRecordDenominator === 5764, "巴利经藏 root 分母不匹配");
requireValue(suttacentralFamily?.suttaRootRecordPercentage === 100, "巴利经藏固定来源完成率不匹配");
requireValue(suttacentralManifest?.files?.[0]?.verification?.segments === 2234, "巴利原生段落数漂移");
requireValue(suttacentralManifest?.files?.[0]?.sourceParts?.length === 26, "巴利来源资产数漂移");
requireValue(suttacentralBatch?.source?.commit === "eac6c24781dd1eefdc17dc2f787b54bf6fe31719", "巴利来源提交漂移");
requireValue(dighaBatch?.source?.commit === suttacentralBatch?.source?.commit, "《长部》来源提交漂移");
requireValue(dighaManifest?.files?.length === 34, "《长部》必须包含 34 部完整原文");
requireValue(dighaManifest?.collection?.stableSegments === 16401, "《长部》原生段落数漂移");
requireValue(majjhimaBatch?.source?.commit === suttacentralBatch?.source?.commit, "《中部》来源提交漂移");
requireValue(majjhimaManifest?.files?.length === 152, "《中部》必须包含 152 部完整原文");
requireValue(majjhimaManifest?.collection?.sourceBytes === 3072235, "《中部》来源字节数漂移");
requireValue(majjhimaManifest?.collection?.stableSegments === 27195, "《中部》原生段落数漂移");
requireValue(samyuttaBatch?.source?.commit === suttacentralBatch?.source?.commit, "《相应部》来源提交漂移");
requireValue(samyuttaManifest?.files?.length === 56, "《相应部》必须包含 56 个相应级经集");
requireValue(samyuttaManifest?.collection?.recordCount === 1819, "《相应部》物理 root 记录数漂移");
requireValue(samyuttaManifest?.collection?.representedSuttas === 3024, "《相应部》连续经号数漂移");
requireValue(samyuttaManifest?.collection?.sourceBytes === 3765299, "《相应部》来源字节数漂移");
requireValue(samyuttaManifest?.collection?.stableSegments === 43466, "《相应部》原生段落数漂移");
requireValue(samyuttaManifest?.collection?.emptySegmentIds === 2, "《相应部》空白占位段落数漂移");
requireValue(anguttaraBatch?.source?.commit === suttacentralBatch?.source?.commit, "《增支部》来源提交漂移");
requireValue(anguttaraManifest?.files?.length === 11, "《增支部》必须包含 11 个集级经集");
requireValue(anguttaraManifest?.collection?.recordCount === 1408, "《增支部》物理 root 记录数漂移");
requireValue(anguttaraManifest?.collection?.representedSuttas === 8122, "《增支部》连续经号数漂移");
requireValue(anguttaraManifest?.collection?.sourceBytes === 4074931, "《增支部》来源字节数漂移");
requireValue(anguttaraManifest?.collection?.stableSegments === 41839, "《增支部》原生段落数漂移");
requireValue(anguttaraManifest?.collection?.emptySegmentIds === 4, "《增支部》空白占位段落数漂移");
requireValue(khuddakaBatch?.source?.commit === suttacentralBatch?.source?.commit, "《小部》来源提交漂移");
requireValue(khuddakaManifest?.files?.length === 19, "《小部》必须新增 19 个书级文本集合");
requireValue(khuddakaManifest?.books?.length === 20, "《小部》必须审计 20 个书级集合（含既有《法句》）");
requireValue(khuddakaManifest?.collection?.recordCount === 2351, "《小部》物理 root 记录数漂移");
requireValue(khuddakaManifest?.collection?.newRecordCount === 2325, "《小部》新增物理 root 记录数漂移");
requireValue(khuddakaManifest?.collection?.sourceBytes === 10053548, "《小部》来源字节数漂移");
requireValue(khuddakaManifest?.collection?.newSourceBytes === 9953598, "《小部》新增来源字节数漂移");
requireValue(khuddakaManifest?.collection?.stableSegments === 155801, "《小部》原生段落数漂移");
requireValue(khuddakaManifest?.collection?.newStableSegments === 153567, "《小部》新增原生段落数漂移");
requireValue(khuddakaManifest?.collection?.newReadingUnits === 2946, "《小部》新增阅读单元数漂移");

const checksumLines = (await readFile(checksumPath, "utf8")).trim().split("\n");
const checksums = new Map(checksumLines.map((line) => {
  const [hash, file] = line.trim().split(/\s+/);
  return [file, hash];
}));
const controlledFiles = [
  ["registry-v1.5.0.json", raw],
  ["source-snapshots-v0.2.1.json", sourceSnapshotsRaw],
  ["cbeta-taisho-sutra-inventory-v0.2.1.json", inventoryRaw],
  ["batch-v1.5.0.json", prajnaparamitaBatchRaw],
  ["catalog-v1.5.0.json", cbetaCatalogRaw],
  ["manifest-v1.5.0.json", cbetaManifestRaw],
  ["registry-cbeta-v1.5.0.json", cbetaRegistryRaw],
  ["batch-v0.7.0.json", suttacentralBatchRaw],
  ["manifest-v0.7.0.json", suttacentralManifestRaw],
  ["dn-batch-v0.8.0.json", dighaBatchRaw],
  ["dn-manifest-v0.8.0.json", dighaManifestRaw],
  ["mn-batch-v0.9.0.json", majjhimaBatchRaw],
  ["mn-manifest-v0.9.0.json", majjhimaManifestRaw],
  ["sn-batch-v1.0.0.json", samyuttaBatchRaw],
  ["sn-manifest-v1.0.0.json", samyuttaManifestRaw],
  ["an-batch-v1.1.0.json", anguttaraBatchRaw],
  ["an-manifest-v1.1.0.json", anguttaraManifestRaw],
  ["kn-batch-v1.2.0.json", khuddakaBatchRaw],
  ["kn-manifest-v1.2.0.json", khuddakaManifestRaw],
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
const mahaPrajnaparamita = registry.works.find((work) => work.id === "gbcr:work:maha-prajnaparamita-t0220");
const paliDhammapada = registry.works.find((work) => work.id === "gbcr:work:dhammapada-pali");
const chineseDharmapada = registry.works.find((work) => work.id === "gbcr:work:dharmapada-t0210");
const dhammapadaFamily = registry.textFamilies?.find((family) => family.id === "gbcr:text-family:dhammapada");
requireValue(registry.works.length === 544, "v1.5 必须登记 544 个可追踪作品实体");
requireValue(expressions.length === 559, "v1.5 必须登记 559 个完整文本表达");
requireValue(segmentCount === 1150898, "v1.5 稳定行段总数漂移");
const provisionalCbetaWorks = registry.works.filter((work) =>
  work.workType === "provisional_bibliographic_entity" && /^gbcr:work:taisho-t/.test(work.id),
);
requireValue(provisionalCbetaWorks.length === 250, "T01–T08 新增经号必须保留 250 个暂定书目实体");
requireValue(
  provisionalCbetaWorks.every((work) => work.relationDecision?.includes("不据此声称已经完成作品级去重")),
  "T01–T08 暂定书目实体缺少作品去重边界",
);
const benyuanRelatedWorkIds = new Set(benyuanBatch.files
  .filter((file) => file.bibliographicRelations?.length)
  .map((file) => file.workId));
const relationAnnotatedBenyuanWorks = provisionalCbetaWorks.filter((work) => benyuanRelatedWorkIds.has(work.id));
const attributedBenyuanWorks = provisionalCbetaWorks.filter((work) =>
  work.sourceRoles?.includes("attributed_authored_or_compiled_text"),
);
requireValue(relationAnnotatedBenyuanWorks.length === 17, "T03–T04 关系证据未完整进入登记册");
requireValue(attributedBenyuanWorks.length === 8, "T03–T04 造撰集类文本未保持来源角色边界");
const prajnaparamitaProvisionalWorkIds = new Set(prajnaparamitaBatch.files
  .filter((file) => file.workIdentityStatus === "provisional_canon_record")
  .map((file) => file.workId));
const prajnaparamitaProvisionalWorks = provisionalCbetaWorks.filter((work) =>
  prajnaparamitaProvisionalWorkIds.has(work.id));
const prajnaparamitaRelatedIds = new Set(prajnaparamitaBatch.files
  .filter((file) => file.bibliographicRelations?.length)
  .map((file) => file.id));
const prajnaparamitaRelatedExpressions = expressions.filter((expression) =>
  prajnaparamitaRelatedIds.has(expression.id.replace(/^gbcr:expression:(T[^-]+)-zh-Hant$/, "$1")));
requireValue(prajnaparamitaProvisionalWorks.length === 28, "T05–T08 暂定书目实体没有保持 28 个可复核边界");
requireValue(prajnaparamitaRelatedExpressions.length === 35, "T05–T08 关系证据未完整进入文本表达");
const vajracchedika = registry.works.find((work) => work.id === "gbcr:work:vajracchedika-prajnaparamita");
const hrdaya = registry.works.find((work) => work.id === "gbcr:work:prajnaparamita-hrdaya");
const sameMembers = (actual, expected) => actual?.length === expected.length &&
  expected.every((id) => actual.includes(id));
requireValue(
  sameMembers(vajracchedika?.externalIds?.cbeta, ["T0235", "T0236a", "T0236b", "T0237", "T0238", "T0239"]),
  "《金刚经》六个汉译表达未正确归入同一作品",
);
requireValue(vajracchedika?.expressions?.length === 6, "《金刚经》必须保留六个独立汉译表达");
requireValue(
  sameMembers(hrdaya?.externalIds?.cbeta, ["T0250", "T0251", "T0252", "T0253", "T0254", "T0255", "T0257"]),
  "《心经》七个长短本表达未正确归入同一作品",
);
requireValue(hrdaya?.expressions?.length === 7, "《心经》必须保留七个独立汉译表达");
requireValue(
  expressions.filter((expression) => expression.sourceRole === "traditional_translation_attribution_disputed").length === 2,
  "传统译者署名争议必须精确保留两条",
);
requireValue(
  expressions.filter((expression) => expression.sourceRole === "liturgical_transliteration_witness").length === 1,
  "梵汉对音读诵见证必须保持独立来源角色",
);
requireValue(paliDhammapada?.expressions?.length === 1, "巴利《法句经》必须登记为一个文本表达");
requireValue(paliDhammapada?.expressions?.[0]?.sourceTextAssets?.length === 26, "巴利《法句经》必须保留 26 个来源资产");
requireValue(paliDhammapada?.expressions?.[0]?.stableSegments === 2234, "巴利《法句经》原生段落数漂移");
requireValue(chineseDharmapada?.textFamilyId === dhammapadaFamily?.id, "汉译《法句经》未进入法句文本家族");
requireValue(paliDhammapada?.textFamilyId === dhammapadaFamily?.id, "巴利《法句经》未进入法句文本家族");
requireValue(dhammapadaFamily?.alignmentStatus === "family_level_only", "法句文本家族不得伪造逐段对齐");
requireValue(registry.parallelRelations?.[0]?.segmentAlignment === "not_asserted", "未复核的平行段落关系不得发布");
const dighaWorks = registry.works.filter((work) => /^gbcr:work:digha-nikaya-dn\d+-pali$/.test(work.id));
requireValue(dighaWorks.length === 34, "《长部》34 经的作品记录不完整");
requireValue(dighaWorks.every((work) => work.expressions?.length === 1), "《长部》每经应有一个巴利文本表达");
const majjhimaWorks = registry.works.filter((work) => /^gbcr:work:majjhima-nikaya-mn\d+-pali$/.test(work.id));
requireValue(majjhimaWorks.length === 152, "《中部》152 经的作品记录不完整");
requireValue(majjhimaWorks.every((work) => work.expressions?.length === 1), "《中部》每经应有一个巴利文本表达");
const samyuttaWorks = registry.works.filter((work) => /^gbcr:work:samyutta-nikaya-sn\d+-pali$/.test(work.id));
requireValue(samyuttaWorks.length === 56, "《相应部》56 个相应级经集的作品记录不完整");
requireValue(samyuttaWorks.every((work) => work.expressions?.length === 1), "《相应部》每个相应应有一个巴利文本表达");
requireValue(
  samyuttaWorks.reduce((sum, work) => sum + (work.expressions?.[0]?.sourceTextAssets?.length ?? 0), 0) === 1819,
  "《相应部》必须保留 1,819 个可独立校验的来源资产",
);
const anguttaraWorks = registry.works.filter((work) => /^gbcr:work:anguttara-nikaya-an\d+-pali$/.test(work.id));
requireValue(anguttaraWorks.length === 11, "《增支部》11 个集级经集的作品记录不完整");
requireValue(anguttaraWorks.every((work) => work.expressions?.length === 1), "《增支部》每个集应有一个巴利文本表达");
requireValue(
  anguttaraWorks.reduce((sum, work) => sum + (work.expressions?.[0]?.sourceTextAssets?.length ?? 0), 0) === 1408,
  "《增支部》必须保留 1,408 个可独立校验的来源资产",
);
const khuddakaWorks = registry.works.filter((work) => /^gbcr:work:khuddaka-nikaya-(?!dhp)[a-z-]+-pali$/.test(work.id));
requireValue(khuddakaWorks.length === 19, "《小部》新增 19 个书级作品记录不完整");
requireValue(khuddakaWorks.every((work) => work.expressions?.length === 1), "《小部》每书应有一个巴利文本表达");
requireValue(
  khuddakaWorks.reduce((sum, work) => sum + (work.expressions?.[0]?.sourceTextAssets?.length ?? 0), 0) === 2325,
  "《小部》新增书级作品必须保留 2,325 个可独立校验的来源资产",
);
requireValue(
  khuddakaWorks.every((work) => work.relationDecision?.includes("不因其位于同一目录就声称全部为佛陀亲说")),
  "《小部》体裁与佛说归属边界未写入作品裁决",
);
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
requireValue(
  JSON.stringify(mahaPrajnaparamita?.externalIds?.cbeta) === JSON.stringify(["T0220"]),
  "《大般若经》必须登记为一个目录学文本表达",
);
requireValue(mahaPrajnaparamita?.expressions?.length === 1, "《大般若经》不得按物理文件拆成多个文本表达");
requireValue(mahaPrajnaparamita?.bibliographicRelations?.length === 7, "《大般若经》七组经会与文本家族关系未完整保留");
requireValue(
  mahaPrajnaparamita?.expressions?.[0]?.sourceTextAssets?.length === 15,
  "《大般若经》必须保留 15 个可独立校验的来源资产",
);
if (errors.length > 0) {
  console.error(errors.map((item) => `- ${item}`).join("\n"));
  process.exit(1);
}
console.log(`GBCR ${registry.registry.version} 已通过校验：${registry.works.length} 个作品实体、${expressions.length} 个完整文本，${segmentCount} 个稳定行段，${candidateCount} 条上游候选记录。`);

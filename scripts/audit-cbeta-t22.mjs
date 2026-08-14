import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { buildPageNavigation, parseCbetaReadingLines } from "../src/lib/cbeta-tei.mjs";

const root = process.cwd();
const version = "2.9.0";
const expectedCommit = "2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9";
const sourceArgument = process.argv.find((argument) => argument.startsWith("--source-dir="));
if (!sourceArgument) {
  console.error("用法：node scripts/audit-cbeta-t22.mjs --source-dir=/固定提交的/xml-p5");
  process.exit(1);
}
const sourceRoot = resolve(sourceArgument.slice("--source-dir=".length));
const actualCommit = execFileSync("git", ["-C", sourceRoot, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (actualCommit !== expectedCommit) throw new Error(`上游工作树必须固定到 ${expectedCommit}`);

const inventoryPath = "data/gbcr/cbeta-taisho-t22-inventory-v0.1.0.json";
const inventory = JSON.parse(await readFile(resolve(root, inventoryPath), "utf8"));
const baseCatalogPath = "data/corpus/cbeta/catalog-v2.8.0.json";
const baseCatalog = JSON.parse(await readFile(resolve(root, baseCatalogPath), "utf8"));
const sourceUnits = (file) => file.sourceParts ?? [file];
const controlledPaths = new Set(baseCatalog.files.flatMap(sourceUnits).map((file) => file.upstreamPath));
const candidates = inventory.records.filter((record) => !controlledPaths.has(record.upstreamPath));
if (inventory.totals.records !== 15 || inventory.totals.upstreamBytes !== 24063535 || candidates.length !== 15) {
  throw new Error(`T22 固定来源分母或新增记录漂移：${inventory.totals.records}/${candidates.length}`);
}

const relation = (type, groupId, label, evidence, ids) => ({
  type, groupId, label, evidence, externalIds: { cbeta: ids },
});
const editionGroups = [
  {
    ids: ["T1422a", "T1422b"],
    workId: "gbcr:work:taisho-t1422-edition-group",
    relation: relation(
      "same_work_edition_or_recension_group_verified",
      "t1422-edition-recension-witnesses",
      "弥沙塞五分戒本 T1422 a/b 版本见证",
      "同一基础经号、佛陀什等译题记与比丘戒本核心题名一致；较短本五字片段覆盖 30.5%，共享作品实体并保留独立版本见证。",
      ["T1422a", "T1422b"],
    ),
  },
];
const candidateRelations = [
  relation(
    "vinaya_collection_component_family_candidate_unmerged",
    "mahisasaka-vinaya-t1421-t1424",
    "弥沙塞部五分律、戒本与羯磨文本家族",
    "T1421 是三十卷部派广律，T1422 a/b 是同号比丘戒本版本，T1423 为明徽所集比丘尼戒本，T1424 为爱同所录羯磨本；部派、结构与片段重合支持组件家族，不支持把五份记录合成一个作品。",
    ["T1421", "T1422a", "T1422b", "T1423", "T1424"],
  ),
  relation(
    "vinaya_collection_component_family_candidate_unmerged",
    "mahasamghika-vinaya-t1425-t1427",
    "摩诃僧祇律与僧尼戒本家族",
    "四十卷广律、比丘戒本与比丘尼戒本分别保留；戒本对广律五字片段覆盖为 47.1% 与 58.8%，可证明紧密文本关系但不等于同一书目作品。",
    ["T1425", "T1426", "T1427"],
  ),
  relation(
    "vinaya_collection_component_family_candidate_unmerged",
    "dharmaguptaka-vinaya-t1428-t1434",
    "四分律、戒本与羯磨文本家族",
    "六十卷《四分律》与僧尼戒本、两种僧尼羯磨及比丘尼羯磨法分别登记；共同部派归属、篇章结构和正文重合只证明组件或传本家族，不自动归并作品。",
    ["T1428", "T1429", "T1430", "T1431", "T1432", "T1433", "T1434"],
  ),
  relation(
    "same_tradition_pratimoksa_recension_candidate_unmerged",
    "dharmaguptaka-bhiksu-pratimoksa-t1429-t1430",
    "四分律比丘戒本 T1429/T1430 传本候选",
    "两者均署佛陀耶舍译且较短本五字片段覆盖 66.7%，但经号独立，T1429 另载怀素集序；缺少跨经号版本裁决前保留为候选关系。",
    ["T1429", "T1430"],
  ),
  relation(
    "karmavacana_translation_or_recension_candidate_unmerged",
    "dharmaguptaka-karmavacana-t1432-t1434",
    "昙无德律部羯磨传本候选",
    "T1432 与 T1433 分署康僧铠、昙谛译，较短本五字片段覆盖 65.2%；T1434 只载比丘尼羯磨法。三者范围与译传边界不同，不据相似度强制合并。",
    ["T1432", "T1433", "T1434"],
  ),
];

const decisionByCanonId = new Map();
const relationsByCanonId = new Map();
const addRelation = (ids, item) => {
  for (const id of ids) relationsByCanonId.set(id, [...(relationsByCanonId.get(id) ?? []), item]);
};
for (const group of editionGroups) {
  for (const id of group.ids) decisionByCanonId.set(id, { workId: group.workId, status: "verified_edition_witness" });
  addRelation(group.ids, group.relation);
}
for (const item of candidateRelations) addRelation(item.externalIds.cbeta, item);

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const gitBlobSha1 = (value) => createHash("sha1").update(`blob ${value.length}\0`).update(value).digest("hex");
const matchRequired = (text, pattern, label, id) => {
  const value = text.match(pattern)?.[1]?.trim();
  if (!value) throw new Error(`${id} 缺少 ${label}`);
  return value;
};
const stripXml = (value) => value.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
const displayNumber = (canonId) => canonId.slice(1).replace(/^0+(?=\d)/, "");
const classifyAttribution = (author, compilerByline) => {
  if (compilerByline) {
    return {
      sourceRole: "translated_and_compiled_vinaya_text",
      label: `${author.replace(/\s+/g, " · ")}；${compilerByline}`,
      boundary: true,
    };
  }
  if (/[集錄]/.test(author)) {
    return {
      sourceRole: "compiled_or_recorded_vinaya_text",
      label: author.replace(/\s+/g, " · "),
      boundary: true,
    };
  }
  return {
    sourceRole: "translated_vinaya_canonical_record",
    label: author.replace(/\s+/g, " · "),
    boundary: false,
  };
};
const normalizedBodies = new Map();
const files = [];

for (const record of candidates) {
  const upstream = execFileSync("git", ["-C", sourceRoot, "show", `HEAD:${record.upstreamPath}`], {
    encoding: "buffer",
    maxBuffer: Math.max(record.upstreamBytes + 1024, 32 * 1024 * 1024),
  });
  if (upstream.length !== record.upstreamBytes || gitBlobSha1(upstream) !== record.upstreamGitBlobSha1 || upstream.at(-1) === 10) {
    throw new Error(`${record.sourceRecordId} 固定 Git 对象、字节数或换行假设不一致`);
  }
  const text = upstream.toString("utf8");
  const teiId = matchRequired(text, /<TEI[^>]+xml:id="([^"]+)"/, "TEI 标识", record.sourceRecordId);
  if (teiId !== record.sourceRecordId) throw new Error(`${record.sourceRecordId} TEI 标识漂移`);
  if (!text.includes("Available for non-commercial use when distributed with this header intact.")) {
    throw new Error(`${record.sourceRecordId} 缺少非商业与保留头部声明`);
  }
  const title = stripXml(matchRequired(text, /<title level="m" xml:lang="zh-Hant">([\s\S]*?)<\/title>/, "正藏题名", record.sourceRecordId));
  const author = stripXml(matchRequired(text, /<author>([\s\S]*?)<\/author>/, "署名", record.sourceRecordId));
  const compilerByline = stripXml(text.match(/<byline cb:type="author">([\s\S]*?)<\/byline>/)?.[1] ?? "");
  const attribution = classifyAttribution(author, compilerByline);
  const extent = matchRequired(text, /<extent>([^<]+)<\/extent>/, "卷数", record.sourceRecordId);
  const canonId = record.canonWitnessId;
  const segments = parseCbetaReadingLines(text, { canonId });
  const navigation = buildPageNavigation(segments);
  const juans = [...new Set(segments.map((segment) => segment.juan))];
  const numericJuans = juans.map(Number);
  if (numericJuans.some((juan, index) => !Number.isSafeInteger(juan) || juan < 1 || (index > 0 && juan !== numericJuans[index - 1] + 1))) {
    throw new Error(`${canonId} 卷次不是连续正整数`);
  }
  normalizedBodies.set(canonId, segments.map((segment) => segment.text).join("").replace(/[\s，。；：、！？「」『』（）]/g, ""));
  const normalized = Buffer.concat([upstream, Buffer.from("\n")]);
  const localPath = `data/corpus/cbeta/${record.sourceRecordId}.xml`;
  const destination = resolve(root, localPath);
  await mkdir(dirname(destination), { recursive: true });
  try {
    const existing = await readFile(destination);
    if (!existing.equals(normalized)) throw new Error(`${localPath} 已存在但内容不同`);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
    await writeFile(destination, normalized, { flag: "wx" });
  }

  const decision = decisionByCanonId.get(canonId);
  const boundarySummary = attribution.sourceRole === "translated_vinaya_canonical_record"
    ? "目录署为翻译；律部位置、同一部派或与广律正文重合只能证明律藏关系，不能单独证明同一书目作品或佛陀逐字亲说；"
    : attribution.sourceRole === "translated_and_compiled_vinaya_text"
      ? "目录保留佛陀耶舍译题记，正文序同时明确记载怀素集；平台并列保存翻译与后世编集责任，不把编集本降格为无差别译本；"
      : "题记明确为集或录，平台保留后世编集、辑录与部派传承角色，不改写成匿名译经或佛陀逐字亲说；";
  files.push({
    id: canonId,
    slug: `taisho-${canonId.toLowerCase()}`,
    workId: decision?.workId ?? `gbcr:work:taisho-${canonId.toLowerCase()}`,
    workIdentityStatus: decision?.status ?? "provisional_canon_record",
    sourceRole: attribution.sourceRole,
    bibliographicRelations: relationsByCanonId.get(canonId),
    localPath,
    upstreamPath: record.upstreamPath,
    upstreamGitBlobSha1: record.upstreamGitBlobSha1,
    upstreamBytes: upstream.length,
    upstreamSha256: sha256(upstream),
    localBytes: normalized.length,
    localSha256: sha256(normalized),
    format: "application/tei+xml",
    completeness: "complete_source_file",
    presentation: {
      title,
      alternateTitle: title,
      tradition: "漢傳佛教 · 律部",
      language: "漢文",
      canonRef: `大正藏 T22, no. ${displayNumber(canonId)}`,
      translator: attribution.label,
      summary: `${extent}。本站完整保存 ${canonId} 的固定 CBETA TEI 来源记录与可校验页栏行锚点；${boundarySummary}物理记录、作品、表达、版本见证与广律组件关系分层计数。`,
      sourceUrl: `https://cbetaonline.dila.edu.tw/zh/${canonId}_001`,
    },
    verification: {
      segments: segments.length,
      folios: navigation.length,
      juanRange: [numericJuans[0], numericJuans.at(-1)],
      anchors: [segments[0].id, segments.at(-1).id],
      humanSampleVerified: false,
    },
  });
}

const grams = (value, size = 5) => {
  const values = new Set();
  for (let index = 0; index <= value.length - size; index += 1) values.add(value.slice(index, index + size));
  return values;
};
const compareBodies = (leftId, rightId) => {
  const leftText = normalizedBodies.get(leftId);
  const rightText = normalizedBodies.get(rightId);
  const left = grams(leftText);
  const right = grams(rightText);
  let shared = 0;
  for (const value of left) if (right.has(value)) shared += 1;
  return {
    pair: [leftId, rightId],
    normalizedCharacters: [leftText.length, rightText.length],
    fiveGramContainmentOfShorter: Number((shared / Math.min(left.size, right.size)).toFixed(6)),
    fiveGramJaccard: Number((shared / (left.size + right.size - shared)).toFixed(6)),
  };
};
const comparisonPairs = [
  ["T1422a", "T1422b"], ["T1429", "T1430"], ["T1432", "T1433"],
  ["T1421", "T1422a"], ["T1421", "T1422b"], ["T1421", "T1423"], ["T1421", "T1424"],
  ["T1425", "T1426"], ["T1425", "T1427"],
  ["T1428", "T1429"], ["T1428", "T1430"], ["T1428", "T1431"],
  ["T1428", "T1432"], ["T1428", "T1433"], ["T1428", "T1434"],
].map(([left, right]) => compareBodies(left, right));
const comparisonByPair = new Map(comparisonPairs.map((item) => [item.pair.join("/"), item]));
if (
  comparisonByPair.get("T1422a/T1422b").fiveGramContainmentOfShorter < 0.30 ||
  comparisonByPair.get("T1429/T1430").fiveGramContainmentOfShorter < 0.66 ||
  comparisonByPair.get("T1432/T1433").fiveGramContainmentOfShorter < 0.65 ||
  comparisonByPair.get("T1421/T1422a").fiveGramContainmentOfShorter < 0.69 ||
  comparisonByPair.get("T1421/T1423").fiveGramContainmentOfShorter < 0.78 ||
  comparisonByPair.get("T1428/T1429").fiveGramContainmentOfShorter < 0.67 ||
  comparisonByPair.get("T1428/T1431").fiveGramContainmentOfShorter < 0.73
) throw new Error("T22 高风险版本、戒本或羯磨正文比较漂移");

const batch = {
  schema: "https://foxue.ai/schemas/cbeta-controlled-batch-v1.0",
  version,
  publishedAt: "2026-08-14",
  baseCatalog: baseCatalogPath,
  inventory: inventoryPath,
  rightsCategory: "Individually reviewed CBETA TEI files in Taishō volumes T01–T22; T22 source-record closure",
  workOverrides: {},
  fileOverrides: {},
  collection: {
    id: "CBETA-TAISHO-T22",
    title: "大正藏 T22 律部固定来源记录",
    sourceRecordDenominator: 15,
    previouslyControlledSourceRecords: 0,
    newSourceRecords: files.length,
    controlledSourceRecords: files.length,
    newSourceBytes: files.reduce((sum, file) => sum + file.upstreamBytes, 0),
    newStableSegments: files.reduce((sum, file) => sum + file.verification.segments, 0),
    newFolios: files.reduce((sum, file) => sum + file.verification.folios, 0),
    verifiedEditionWitnesses: files.filter((file) => file.workIdentityStatus === "verified_edition_witness").length,
    provisionalRecords: files.filter((file) => file.workIdentityStatus === "provisional_canon_record").length,
    newFullSourceTexts: files.filter((file) => file.completeness === "complete_source_file").length,
    newPartialSourceWitnesses: files.filter((file) => file.completeness === "complete_source_file_partial_work_witness").length,
    relationAnnotatedRecords: files.filter((file) => file.bibliographicRelations?.length).length,
    attributionBoundaryRecords: files.filter((file) => file.sourceRole !== "translated_vinaya_canonical_record").length,
    newWorks: 14,
    controlledWorks: 14,
    workCountingDecision: "T22 共 15 条固定来源记录。T1422 a/b 按同一基础经号、译者题记、核心题名与正文证据归入 1 个作品并保留 2 个版本见证，其余 13 条暂按独立书目实体登记，共新增 14 个作品；广律、戒本、羯磨本、跨经号高相似传本及后世编集关系只作分层候选，不自动归并。",
  },
  boundaryAudit: {
    status: "verified_source_integrity_edition_attribution_vinaya_component_and_recension_boundaries_recorded",
    existingControlledRecords: [],
    editionOrRecensionGroups: editionGroups.map((item) => item.relation.groupId),
    candidateRelationsNotMerged: candidateRelations.map((item) => item.groupId),
    partialWorkWitnesses: [],
    translatedRecords: files.filter((file) => file.sourceRole === "translated_vinaya_canonical_record").map((file) => file.id),
    translatedAndCompiledRecords: files.filter((file) => file.sourceRole === "translated_and_compiled_vinaya_text").map((file) => file.id),
    compiledOrRecordedRecords: files.filter((file) => file.sourceRole === "compiled_or_recorded_vinaya_text").map((file) => file.id),
    textualComparison: {
      algorithm: "Unicode text from stable reading lines; punctuation/space removed; unique character 5-gram containment and Jaccard. Machine comparison records component or recension evidence but never decides cross-number work identity by itself.",
      pairs: comparisonPairs,
    },
    authoritySources: [
      "https://github.com/cbeta-org/xml-p5/tree/2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9/T/T22",
      "https://cbetaonline.dila.edu.tw/zh/T1422a_001",
      "https://cbetaonline.dila.edu.tw/zh/T1429_001",
      "https://cbetaonline.dila.edu.tw/zh/T1432_001",
    ],
    caveat: "T22 同时容纳完整部派律、比丘与比丘尼戒本、羯磨文本、同号版本及后世编集或辑录本。平台完整保存固定来源，但不把同一部派、目录邻接、篇章结构、题名相似或机器文本重合单独当成同一作品、独立翻译或佛陀逐字亲说的证明。",
  },
  files,
};

if (
  batch.collection.newSourceRecords !== 15 ||
  batch.collection.newSourceBytes !== 24063535 ||
  batch.collection.newStableSegments !== 91307 ||
  batch.collection.newFolios !== 3301 ||
  batch.collection.verifiedEditionWitnesses !== 2 ||
  batch.collection.provisionalRecords !== 13 ||
  batch.collection.newFullSourceTexts !== 15 ||
  batch.collection.newPartialSourceWitnesses !== 0 ||
  batch.collection.relationAnnotatedRecords !== 15 ||
  batch.collection.attributionBoundaryRecords !== 4 ||
  batch.collection.newWorks !== 14
) throw new Error(`T22 关系、归属或作品边界统计漂移：${JSON.stringify(batch.collection)}`);

await writeFile(resolve(root, `data/corpus/cbeta/batch-v${version}.json`), `${JSON.stringify(batch, null, 2)}\n`, "utf8");
console.log(`CBETA T22 审计完成：15/15 个固定来源记录；新增 ${batch.collection.newWorks} 个作品、${batch.collection.newSourceRecords} 个表达或见证、${batch.collection.newStableSegments} 个稳定行段。`);

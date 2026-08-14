import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { buildPageNavigation, parseCbetaReadingLines } from "../src/lib/cbeta-tei.mjs";

const root = process.cwd();
const version = "3.0.0";
const expectedCommit = "2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9";
const sourceArgument = process.argv.find((argument) => argument.startsWith("--source-dir="));
if (!sourceArgument) {
  console.error("用法：node scripts/audit-cbeta-t23.mjs --source-dir=/固定提交的/xml-p5");
  process.exit(1);
}
const sourceRoot = resolve(sourceArgument.slice("--source-dir=".length));
const actualCommit = execFileSync("git", ["-C", sourceRoot, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (actualCommit !== expectedCommit) throw new Error(`上游工作树必须固定到 ${expectedCommit}`);

const inventoryPath = "data/gbcr/cbeta-taisho-t23-inventory-v0.1.0.json";
const inventory = JSON.parse(await readFile(resolve(root, inventoryPath), "utf8"));
const baseCatalogPath = "data/corpus/cbeta/catalog-v2.9.0.json";
const baseCatalog = JSON.parse(await readFile(resolve(root, baseCatalogPath), "utf8"));
const sourceUnits = (file) => file.sourceParts ?? [file];
const controlledPaths = new Set(baseCatalog.files.flatMap(sourceUnits).map((file) => file.upstreamPath));
const candidates = inventory.records.filter((record) => !controlledPaths.has(record.upstreamPath));
if (inventory.totals.records !== 13 || inventory.totals.upstreamBytes !== 18890532 || candidates.length !== 13) {
  throw new Error(`T23 固定来源分母或新增记录漂移：${inventory.totals.records}/${candidates.length}`);
}

const relation = (type, groupId, label, evidence, ids) => ({
  type, groupId, label, evidence, externalIds: { cbeta: ids },
});
const candidateRelations = [
  relation(
    "vinaya_collection_component_family_candidate_unmerged",
    "sarvastivada-dasadhyaya-vinaya-t1435-t1439",
    "十诵律、僧尼戒本与羯磨文本家族",
    "T1435 是六十一卷《十诵律》，T1436/T1437 分别为比丘与比丘尼戒本，T1438/T1439 为羯磨法或要用；戒本与羯磨对广律的五字片段覆盖从 22.3% 至 50.7% 不等，只支持组件家族，不支持把五份记录合成一个书目作品。",
    ["T1435", "T1436", "T1437", "T1438", "T1439"],
  ),
  relation(
    "vinaya_exegesis_or_matrka_family_candidate_unmerged",
    "sarvastivada-vinaya-exegesis-t1435-t1441",
    "十诵律、毘尼毘婆沙与摩得勒伽解释传统",
    "T1440《薩婆多毘尼毘婆沙》解释《十诵律》，T1441 是毘尼摩得勒伽；与 T1435 的目录和正文关系支持同一律学传统，但解释书、纲要与广律不是同一作品。",
    ["T1435", "T1440", "T1441"],
  ),
  relation(
    "mulasarvastivada_vinaya_component_family_candidate_unmerged",
    "mulasarvastivada-vinaya-t1442-t1447",
    "根本说一切有部毘奈耶与事部文本家族",
    "T1442/T1443 分别保存苾刍与苾刍尼毘奈耶，T1444–T1447 分别保存出家、安居、随意与皮革事；共同译者、部派和结构证明同一律藏家族，不把僧尼律与各事部组件机械合成一个表达或作品。",
    ["T1442", "T1443", "T1444", "T1445", "T1446", "T1447"],
  ),
  relation(
    "bhiksu_bhiksuni_vinaya_parallel_candidate_unmerged",
    "mulasarvastivada-bhiksu-bhiksuni-vinaya-t1442-t1443",
    "根本说一切有部僧尼毘奈耶平行候选",
    "T1442 与 T1443 同署义净译，僧尼戒条结构使较短本五字片段覆盖 51.3%；两者适用对象与文本范围不同，保留为平行候选而非版本见证。",
    ["T1442", "T1443"],
  ),
];
const relationsByCanonId = new Map();
for (const item of candidateRelations) {
  for (const id of item.externalIds.cbeta) {
    relationsByCanonId.set(id, [...(relationsByCanonId.get(id) ?? []), item]);
  }
}

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const gitBlobSha1 = (value) => createHash("sha1").update(`blob ${value.length}\0`).update(value).digest("hex");
const matchRequired = (text, pattern, label, id) => {
  const value = text.match(pattern)?.[1]?.trim();
  if (!value) throw new Error(`${id} 缺少 ${label}`);
  return value;
};
const stripXml = (value) => value.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
const displayNumber = (canonId) => canonId.slice(1).replace(/^0+(?=\d)/, "");
const classifyAttribution = (canonId, author, text) => {
  if (canonId === "T1437" || canonId === "T1439") {
    return {
      sourceRole: "compiled_or_extracted_vinaya_text",
      label: author.replace(/\s+/g, " · "),
      boundary: true,
      summary: "题记明确为集出或依律撰出；平台保留摘集、编撰与部派传承责任，不改写成独立古译或佛陀逐字亲说；",
    };
  }
  if (canonId === "T1438") {
    if (author) throw new Error("T1438 预期为空署名");
    return {
      sourceRole: "unattributed_vinaya_procedure_text",
      label: "题记未载作者或译者",
      boundary: true,
      summary: "题记未载作者或译者；平台保存羯磨法文本但不补造译者、编者、印度来源或佛陀逐字亲说归属；",
    };
  }
  if (canonId === "T1440") {
    if (author !== "失譯" || !text.includes("西京東禪定沙門智首撰")) {
      throw new Error("T1440 失译与智首续序边界漂移");
    }
    return {
      sourceRole: "lost_translation_with_appended_vinaya_preface",
      label: "失譯；西京東禪定沙門智首撰續序",
      boundary: true,
      summary: "目录保留失译状态，卷九前另附智首所撰续序；平台并列保存未知译者与后世序作者，不把序文责任扩张到九卷正文；",
    };
  }
  return {
    sourceRole: "translated_vinaya_canonical_record",
    label: author.replace(/\s+/g, " · "),
    boundary: false,
    summary: "目录署为翻译；律部位置、同一部派或正文重合只能证明律藏关系，不能单独证明同一书目作品或佛陀逐字亲说；",
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
  const author = stripXml(text.match(/<author>([\s\S]*?)<\/author>/)?.[1] ?? "");
  const extent = matchRequired(text, /<extent>([^<]+)<\/extent>/, "卷数", record.sourceRecordId);
  const canonId = record.canonWitnessId;
  const attribution = classifyAttribution(canonId, author, text);
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

  files.push({
    id: canonId,
    slug: `taisho-${canonId.toLowerCase()}`,
    workId: `gbcr:work:taisho-${canonId.toLowerCase()}`,
    workIdentityStatus: "provisional_canon_record",
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
      canonRef: `大正藏 T23, no. ${displayNumber(canonId)}`,
      translator: attribution.label,
      summary: `${extent}。本站完整保存 ${canonId} 的固定 CBETA TEI 来源记录与可校验页栏行锚点；${attribution.summary}物理记录、作品、表达、解释书、事部组件与责任边界分层计数。`,
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
  ["T1435", "T1436"], ["T1435", "T1437"], ["T1435", "T1438"], ["T1435", "T1439"],
  ["T1435", "T1440"], ["T1435", "T1441"], ["T1438", "T1439"],
  ["T1442", "T1443"], ["T1442", "T1444"], ["T1442", "T1445"], ["T1442", "T1446"], ["T1442", "T1447"],
].map(([left, right]) => compareBodies(left, right));
const comparisonByPair = new Map(comparisonPairs.map((item) => [item.pair.join("/"), item]));
if (
  comparisonByPair.get("T1435/T1437").fiveGramContainmentOfShorter < 0.50 ||
  comparisonByPair.get("T1435/T1439").fiveGramContainmentOfShorter < 0.49 ||
  comparisonByPair.get("T1435/T1438").fiveGramContainmentOfShorter < 0.25 ||
  comparisonByPair.get("T1435/T1436").fiveGramContainmentOfShorter < 0.22 ||
  comparisonByPair.get("T1442/T1443").fiveGramContainmentOfShorter < 0.51 ||
  comparisonByPair.get("T1442/T1445").fiveGramContainmentOfShorter < 0.07
) throw new Error("T23 高风险戒本、羯磨、僧尼律或事部正文比较漂移");

const batch = {
  schema: "https://foxue.ai/schemas/cbeta-controlled-batch-v1.0",
  version,
  publishedAt: "2026-08-14",
  baseCatalog: baseCatalogPath,
  inventory: inventoryPath,
  rightsCategory: "Individually reviewed CBETA TEI files in Taishō volumes T01–T23; T23 source-record closure",
  workOverrides: {},
  fileOverrides: {},
  collection: {
    id: "CBETA-TAISHO-T23",
    title: "大正藏 T23 律部固定来源记录",
    sourceRecordDenominator: 13,
    previouslyControlledSourceRecords: 0,
    newSourceRecords: files.length,
    controlledSourceRecords: files.length,
    newSourceBytes: files.reduce((sum, file) => sum + file.upstreamBytes, 0),
    newStableSegments: files.reduce((sum, file) => sum + file.verification.segments, 0),
    newFolios: files.reduce((sum, file) => sum + file.verification.folios, 0),
    verifiedEditionWitnesses: 0,
    provisionalRecords: files.length,
    newFullSourceTexts: files.length,
    newPartialSourceWitnesses: 0,
    relationAnnotatedRecords: files.filter((file) => file.bibliographicRelations?.length).length,
    attributionBoundaryRecords: files.filter((file) => file.sourceRole !== "translated_vinaya_canonical_record").length,
    newWorks: 13,
    controlledWorks: 13,
    workCountingDecision: "T23 共 13 条固定来源记录。没有仅凭题名、同一部派、共同译者或机器相似度即可裁定为同一作品多个版本的记录，因此 13 条均暂按独立书目实体登记；十诵律组件、毘尼解释、根本说一切有部僧尼律与事部关系只作分层候选，不自动归并。",
  },
  boundaryAudit: {
    status: "verified_source_integrity_attribution_vinaya_component_exegesis_and_procedural_boundaries_recorded",
    existingControlledRecords: [],
    editionOrRecensionGroups: [],
    candidateRelationsNotMerged: candidateRelations.map((item) => item.groupId),
    partialWorkWitnesses: [],
    translatedRecords: files.filter((file) => file.sourceRole === "translated_vinaya_canonical_record").map((file) => file.id),
    compiledOrExtractedRecords: files.filter((file) => file.sourceRole === "compiled_or_extracted_vinaya_text").map((file) => file.id),
    unattributedProcedureRecords: files.filter((file) => file.sourceRole === "unattributed_vinaya_procedure_text").map((file) => file.id),
    lostTranslationWithPrefaceRecords: files.filter((file) => file.sourceRole === "lost_translation_with_appended_vinaya_preface").map((file) => file.id),
    textualComparison: {
      algorithm: "Unicode text from stable reading lines; punctuation/space removed; unique character 5-gram containment and Jaccard. Machine comparison records component, parallel or explanatory evidence but never decides work identity by itself.",
      pairs: comparisonPairs,
    },
    authoritySources: [
      "https://github.com/cbeta-org/xml-p5/tree/2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9/T/T23",
      "https://cbetaonline.dila.edu.tw/zh/T1435_001",
      "https://cbetaonline.dila.edu.tw/zh/T1440_001",
      "https://cbetaonline.dila.edu.tw/zh/T1442_001",
    ],
    caveat: "T23 同时容纳十诵律及僧尼戒本、羯磨、毘尼解释、摩得勒伽、根本说一切有部僧尼律与事部组件，也含集出、撰出、无署名与失译附序材料。平台完整保存固定来源，但不把同一部派、目录邻接、共同译者、题名或机器文本重合单独当成同一作品、独立翻译或佛陀逐字亲说的证明。",
  },
  files,
};

if (
  batch.collection.newSourceRecords !== 13 ||
  batch.collection.newSourceBytes !== 18890532 ||
  batch.collection.newStableSegments !== 90632 ||
  batch.collection.newFolios !== 3285 ||
  batch.collection.verifiedEditionWitnesses !== 0 ||
  batch.collection.provisionalRecords !== 13 ||
  batch.collection.newFullSourceTexts !== 13 ||
  batch.collection.newPartialSourceWitnesses !== 0 ||
  batch.collection.relationAnnotatedRecords !== 13 ||
  batch.collection.attributionBoundaryRecords !== 4 ||
  batch.collection.newWorks !== 13
) throw new Error(`T23 关系、归属或作品边界统计漂移：${JSON.stringify(batch.collection)}`);

await writeFile(resolve(root, `data/corpus/cbeta/batch-v${version}.json`), `${JSON.stringify(batch, null, 2)}\n`, "utf8");
console.log(`CBETA T23 审计完成：13/13 个固定来源记录；新增 ${batch.collection.newWorks} 个作品、${batch.collection.newSourceRecords} 个表达或见证、${batch.collection.newStableSegments} 个稳定行段。`);

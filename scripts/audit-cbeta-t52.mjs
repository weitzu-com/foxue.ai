import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { buildPageNavigation, parseCbetaReadingLines } from "../src/lib/cbeta-tei.mjs";

const root = process.cwd();
const version = "4.19.0";
const expectedCommit = "2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9";
const sourceArgument = process.argv.find((argument) => argument.startsWith("--source-dir="));
if (!sourceArgument) {
  console.error("用法：node scripts/audit-cbeta-t52.mjs --source-dir=/固定提交的/xml-p5");
  process.exit(1);
}
const sourceRoot = resolve(sourceArgument.slice("--source-dir=".length));
const actualCommit = execFileSync("git", ["-C", sourceRoot, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (actualCommit !== expectedCommit) throw new Error(`上游工作树必须固定到 ${expectedCommit}`);

const inventoryPath = "data/gbcr/cbeta-taisho-t52-inventory-v0.1.0.json";
const inventory = JSON.parse(await readFile(resolve(root, inventoryPath), "utf8"));
const baseCatalogPath = "data/corpus/cbeta/catalog-v4.18.0.json";
const baseCatalog = JSON.parse(await readFile(resolve(root, baseCatalogPath), "utf8"));
const sourceUnits = (file) => file.sourceParts ?? [file];
const controlledPaths = new Set(baseCatalog.files.flatMap(sourceUnits).map((file) => file.upstreamPath));
const candidates = inventory.records.filter((record) => !controlledPaths.has(record.upstreamPath));
if (inventory.totals.records !== 19 || inventory.totals.upstreamBytes !== 18836743 || candidates.length !== 19) {
  throw new Error(`T52 固定来源分母或新增记录漂移：${inventory.totals.records}/${candidates.length}`);
}

const relation = (type, groupId, label, evidence, ids) => ({
  type,
  groupId,
  label,
  evidence,
  externalIds: { cbeta: ids },
});
const relationGroups = [
  relation(
    "apologetic_anthology_continuation_distinct",
    "hongming-anthology-series-t2102-t2103",
    "《弘明集》与《广弘明集》续编边界",
    "T2102 为僧祐编十四卷早期护法文集，T2103 为道宣编三十卷广集；后者承续并扩展护法文献传统，但编者、时代、篇目范围、结构及 DILA/CBC 作品入口不同。篇章复用或续编题名不构成同一表达。",
    ["T2102", "T2103"],
  ),
  relation(
    "buddhist_daoist_debate_continuation_distinct",
    "buddhist-daoist-debate-series-t2104-t2105",
    "《集古今佛道论衡》与续集边界",
    "T2104 为道宣编四卷佛道论衡史料，T2105 为智昇续编一卷；续集继承议题和体例，却有不同编者、范围、年代与独立权威作品号，必须作为相关异作保存。",
    ["T2104", "T2105"],
  ),
  relation(
    "same_author_revelation_records_distinct",
    "daoxuan-miracle-revelation-records-t2106-t2107",
    "道宣三宝感通录与个人感通录范围边界",
    "T2106 汇集神州三宝感通事迹，T2107 记录道宣律师个人感通叙事；两者同属道宣责任脉络并共享感通语汇，但对象、结构、卷数、题名及权威入口不同。",
    ["T2106", "T2107"],
  ),
  relation(
    "same_author_companion_works_distinct",
    "daoxuan-t52-companion-works-t2103-t2104-t2106-t2107",
    "道宣护法文集、佛道论衡与感通录伴随著作边界",
    "T2103、T2104、T2106、T2107 均与道宣责任相关，却分别是护法文集、佛道论衡史料、三宝感通汇编与个人感通录；共同作者不能消除四个独立作品、文类和范围。",
    ["T2103", "T2104", "T2106", "T2107"],
  ),
  relation(
    "anthology_source_reuse_distinct",
    "guang-hongming-lunheng-source-reuse-t2103-t2104",
    "《广弘明集》与《集古今佛道论衡》显著材料复用边界",
    "两部道宣责任著作的规范化正文五字组对较短 T2104 的包含度约 0.341951，显示显著共同材料或引文；但题名、文集与论衡编纂范围、卷数及 DILA/CBC 作品入口不同。重叠只登记为可复核的材料复用，不自动合并作品。",
    ["T2103", "T2104"],
  ),
  relation(
    "same_author_apologetic_treatises_distinct",
    "falin-apologetic-treatises-t2109-t2110",
    "法琳《破邪论》与《辩正论》伴随著作边界",
    "T2109 两卷《破邪论》与 T2110 八卷《辩正论》同为法琳护法著作，但题名、篇章结构、论证范围、卷数以及 DILA/CBC 作品入口不同；相同作者、论敌或论证材料不证明同一作品。",
    ["T2109", "T2110"],
  ),
  relation(
    "apologetic_treatise_scope_distinct",
    "east-asian-apologetic-treatises-t2109-t2118",
    "唐宋元护法与三教论辩著作范围边界",
    "T2109–T2118 横跨破邪、辩正、辩惑、甄正、北山录、护法论、个人文集、辩伪、三教平心与折疑等不同作品。作者、时代、体裁、对象、范围与十个权威入口不同，护法或三教论辩主题只能建立关联。",
    ["T2109", "T2110", "T2111", "T2112", "T2113", "T2114", "T2115", "T2116", "T2117", "T2118"],
  ),
  relation(
    "layered_compilation_responsibility_distinct",
    "multi-author-compilations-t2102-t2103-t2108-t2120",
    "多作者篇章、编者与表制原责任分层",
    "T2102、T2103、T2108 与 T2120 都由编者汇集多位作者、臣僧或朝廷的原始篇章。平台分别保留 TEI 的总集责任与篇内原责任，不把编者等同于全部篇章作者，也不因汇编结构合并四部作品。",
    ["T2102", "T2103", "T2108", "T2120"],
  ),
  relation(
    "court_memorial_collections_scope_distinct",
    "monastic-court-documents-t2108-t2119-t2120",
    "沙门礼制、玄奘上表与不空表制文书范围边界",
    "T2108 汇集沙门不拜王者等礼制争论，T2119 保存玄奘相关上表而总集责任未署名，T2120 由圆照汇集不空及代宗朝表制。三者人物、时代、制度议题、编纂责任、卷数和权威入口不同。",
    ["T2108", "T2119", "T2120"],
  ),
  relation(
    "same_author_cross_volume_companion_distinct",
    "qisong-cross-volume-works-t2078-t2080-t2115",
    "契嵩传法正宗三书与《镡津文集》跨卷伴随著作边界",
    "T2115《镡津文集》与 T2078–T2080 的传法正宗记、定祖图、宗论同属契嵩责任脉络，但文集、史记、谱系图与宗论的编纂单位、范围及权威作品号各自独立。",
    ["T2078", "T2079", "T2080", "T2115"],
  ),
  relation(
    "central_figure_cross_genre_distinct",
    "xuanzang-travel-and-memorial-records-t2087-t2119",
    "玄奘西域地理编纂与上表文书跨文类边界",
    "T2087《大唐西域记》是玄奘口述、辩机编次的地理记录，T2119 是玄奘相关上表汇集且总集责任未署名；共同中心人物不构成相同作品或作者归属。",
    ["T2087", "T2119"],
  ),
  relation(
    "central_figure_cross_genre_distinct",
    "bukong-lineage-and-court-documents-t2081-t2120",
    "不空师资付法记录与代宗朝表制文书跨文类边界",
    "T2081 保存两部大法师资付法记，T2120 汇集不空及其弟子与朝廷往来表制；人物和密教史背景相关，但文类、责任、范围与权威作品号不同。",
    ["T2081", "T2120"],
  ),
];

const authorityIds = {
  T2102: "CA0001338", T2103: "CA0001290", T2104: "CA0001501", T2105: "CA0003647",
  T2106: "CA0001505", T2107: "CA0000740", T2108: "CA0001504", T2109: "CA0002420",
  T2110: "CA0000316", T2111: "CA0003064", T2112: "CA0004046", T2113: "CA0000289",
  T2114: "CA0001343", T2115: "CA0003217", T2116: "CA0000314", T2117: "CA0002718",
  T2118: "CA0003531", T2119: "CA0003661", T2120: "CA0000322",
};
const cbcTextIds = {
  T2102: 1226, T2103: 1222, T2104: 1224, T2105: 1235, T2106: 1239,
  T2107: 1225, T2108: 1232, T2109: 1223, T2110: 1230, T2111: 1228,
  T2112: 1234, T2113: 1231, T2114: 1227, T2115: 1229, T2116: 1240,
  T2117: 1236, T2118: 1237, T2119: 1233, T2120: 1238,
};
if (
  Object.keys(authorityIds).length !== 19 || new Set(Object.values(authorityIds)).size !== 19 ||
  Object.keys(cbcTextIds).length !== 19 || new Set(Object.values(cbcTextIds)).size !== 19
) throw new Error("T52 必须保留 19 个唯一 DILA 作品号与 19 个唯一 CBC 作品入口");

const familyFor = (id) => {
  const number = Number(id.slice(1));
  if (number <= 2103) return { code: "buddhist-apologetic-anthology", role: "east_asian_buddhist_apologetic_anthology", tradition: "汉传佛教 · 护法文集" };
  if (number <= 2105) return { code: "buddhist-daoist-debate-chronicle", role: "east_asian_buddhist_daoist_debate_chronicle", tradition: "汉传佛教 · 佛道论衡" };
  if (number <= 2107) return { code: "buddhist-miracle-revelation-record", role: "east_asian_buddhist_miracle_or_revelation_record", tradition: "汉传佛教 · 三宝与感通录" };
  if (number === 2108) return { code: "monastic-court-ritual-documents", role: "east_asian_monastic_court_ritual_document_collection", tradition: "汉传佛教 · 沙门礼制文书" };
  if (number <= 2118) return { code: "buddhist-apologetic-treatise", role: "east_asian_buddhist_apologetic_or_three_teachings_treatise", tradition: "东亚佛教 · 护法与三教论辩" };
  return { code: "buddhist-court-memorial-collection", role: "east_asian_buddhist_court_memorial_collection", tradition: "汉传佛教 · 表制文书" };
};
const roleOverrides = {
  T2103: "daoxuan_expanded_buddhist_apologetic_anthology",
  T2105: "zhisheng_buddhist_daoist_debate_continuation",
  T2106: "daoxuan_three_jewels_miracle_compilation",
  T2107: "daoxuan_personal_revelation_record",
  T2108: "yanzong_monastic_court_ritual_document_compilation",
  T2109: "falin_buddhist_apologetic_treatise",
  T2110: "falin_extended_buddhist_apologetic_treatise",
  T2113: "shenqing_huibao_authored_annotated_apologetic_record",
  T2115: "qisong_buddhist_literary_collection",
  T2119: "unattributed_xuanzang_court_memorial_collection",
  T2120: "yuanzhao_bukong_court_document_compilation",
};
const statusOverrides = {
  T2102: "verified_distinct_multi_author_compilation",
  T2103: "verified_distinct_continuation_and_multi_author_compilation",
  T2105: "verified_distinct_continuation_work",
  T2106: "verified_distinct_same_author_companion_work",
  T2107: "verified_distinct_same_author_companion_work",
  T2108: "verified_distinct_layered_compilation_responsibility",
  T2109: "verified_distinct_same_author_companion_work",
  T2110: "verified_distinct_same_author_companion_work",
  T2113: "verified_distinct_composite_author_commentator_responsibility",
  T2115: "verified_distinct_cross_volume_same_author_companion_work",
  T2119: "verified_distinct_unsigned_compilation_responsibility",
  T2120: "verified_distinct_layered_compilation_responsibility",
};

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const gitBlobSha1 = (value) => createHash("sha1").update(`blob ${value.length}\0`).update(value).digest("hex");
const required = (value, label, id) => {
  if (!value?.trim()) throw new Error(`${id} 缺少 ${label}`);
  return value.trim();
};
const stripXml = (value) => value.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
const normalizeBody = (segments) => segments.map((segment) => segment.text).join("").replace(/[\s，。；：、！？「」『』（）]/g, "");
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
  const teiId = required(text.match(/<TEI[^>]+xml:id="([^"]+)"/)?.[1], "TEI 标识", record.sourceRecordId);
  if (teiId !== record.sourceRecordId) throw new Error(`${record.sourceRecordId} TEI 标识漂移`);
  if (!text.includes("Available for non-commercial use when distributed with this header intact.")) {
    throw new Error(`${record.sourceRecordId} 缺少非商业与保留头部声明`);
  }
  const title = stripXml(required(text.match(/<title level="m" xml:lang="zh-Hant">([\s\S]*?)<\/title>/)?.[1], "正藏题名", record.sourceRecordId));
  const rawAuthor = stripXml(text.match(/<author>([\s\S]*?)<\/author>/)?.[1] ?? "");
  const author = rawAuthor || "传统责任题记未署名";
  const extent = required(text.match(/<extent>([^<]+)<\/extent>/)?.[1], "卷数", record.sourceRecordId);
  const canonId = record.canonWitnessId;
  const family = familyFor(canonId);
  const relations = relationGroups.filter((group) => group.externalIds.cbeta.includes(canonId));
  if (!authorityIds[canonId] || !cbcTextIds[canonId] || relations.length === 0) {
    throw new Error(`${canonId} 缺少权威号、CBC 入口或关系裁决`);
  }

  const segments = parseCbetaReadingLines(text, { canonId });
  const navigation = buildPageNavigation(segments);
  const juans = [...new Set(segments.map((segment) => segment.juan))];
  const numericJuans = juans.map(Number);
  if (numericJuans.some((juan, index) => !Number.isSafeInteger(juan) || juan < 1 || (index > 0 && juan !== numericJuans[index - 1] + 1))) {
    throw new Error(`${canonId} 卷次不是连续正整数`);
  }
  normalizedBodies.set(canonId, normalizeBody(segments));
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
    workId: `gbcr:work:taisho-${canonId.toLowerCase()}-${family.code}`,
    workIdentityStatus: statusOverrides[canonId] ?? "verified_distinct_canonical_buddhist_work",
    workTitle: title,
    sourceRole: roleOverrides[canonId] ?? family.role,
    bibliographicRelations: relations,
    authorityIds: { dilaCatalog: authorityIds[canonId], cbcText: String(cbcTextIds[canonId]) },
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
      tradition: family.tradition,
      language: "汉文",
      canonRef: `大正藏 T52, no. ${canonId.slice(1)}`,
      translator: author.replace(/\s+/g, " · "),
      summary: `${extent}。完整保存固定 CBETA TEI、校勘与责任题记；作为独立护法文集、佛道论衡、感通录、论著、个人文集或表制文书建模，不标成佛陀逐字亲说。传统责任题记：${author}。`,
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
  ["T2102", "T2103"], ["T2104", "T2105"], ["T2106", "T2107"],
  ["T2103", "T2104"], ["T2103", "T2106"], ["T2104", "T2106"],
  ["T2109", "T2110"], ["T2111", "T2112"], ["T2114", "T2115"],
  ["T2116", "T2117"], ["T2116", "T2118"], ["T2117", "T2118"],
  ["T2108", "T2119"], ["T2108", "T2120"], ["T2119", "T2120"],
].map(([left, right]) => compareBodies(left, right));
const comparisonByPair = new Map(comparisonPairs.map((item) => [item.pair.join("/"), item]));
if (
  comparisonByPair.get("T2103/T2104").fiveGramContainmentOfShorter < 0.34 ||
  comparisonByPair.get("T2104/T2105").fiveGramContainmentOfShorter < 0.07
) throw new Error("T52 广弘明集—论衡材料复用或论衡续集正文比较漂移");

const sourceRoles = Object.fromEntries([...new Set(files.map((file) => file.sourceRole))].sort().map((role) => [
  role,
  files.filter((file) => file.sourceRole === role).map((file) => file.id),
]));
const batchWorkIds = new Set(files.map((file) => file.workId));
const batch = {
  schema: "https://foxue.ai/schemas/cbeta-controlled-batch-v1.0",
  version,
  publishedAt: "2026-08-15",
  baseCatalog: baseCatalogPath,
  inventory: inventoryPath,
  rightsCategory: "Individually reviewed CBETA TEI files in Taishō volumes T01–T52; T52 source-record closure",
  workOverrides: {},
  fileOverrides: {},
  collection: {
    id: "CBETA-TAISHO-T52",
    title: "大正藏 T52 护法论辩、三教交涉、感通录与表制文书固定来源记录",
    sourceRecordDenominator: 19,
    previouslyControlledSourceRecords: 0,
    newSourceRecords: files.length,
    controlledSourceRecords: files.length,
    newSourceBytes: files.reduce((sum, file) => sum + file.upstreamBytes, 0),
    newStableSegments: files.reduce((sum, file) => sum + file.verification.segments, 0),
    newFolios: files.reduce((sum, file) => sum + file.verification.folios, 0),
    newJuans: files.reduce((sum, file) => sum + file.verification.juanRange[1] - file.verification.juanRange[0] + 1, 0),
    verifiedSameWorkExpressions: 0,
    verifiedPartialWorkWitnesses: 0,
    verifiedSplitWorkWitnesses: 0,
    verifiedEditionWitnesses: 0,
    provisionalRecords: 0,
    newFullSourceTexts: files.length,
    newPartialSourceWitnesses: 0,
    relationAnnotatedRecords: files.filter((file) => file.bibliographicRelations?.length).length,
    attributionBoundaryRecords: files.length,
    unsignedResponsibilityRecords: files.filter((file) => file.presentation.translator === "传统责任题记未署名").length,
    lostTranslatorResponsibilityRecords: files.filter((file) => file.presentation.translator === "失譯").length,
    newWorks: batchWorkIds.size,
    controlledWorks: batchWorkIds.size,
    workCountingDecision: "T52 的 19 份固定来源记录登记为 19 个完整表达和 19 个独立作品。DILA 返回 19 个不同 CA 作品号，CBC 也给出 19 个不同作品入口；弘明集续编、佛道论衡续集、道宣与法琳伴随著作、契嵩跨卷作品、玄奘和不空表制文书只建立关系，不据共同作者、中心人物、续集题名、汇编篇章或护法主题自动合并。",
  },
  boundaryAudit: {
    status: "verified_source_integrity_apologetic_debate_revelation_memorial_compilation_responsibility_continuation_and_cross_volume_boundaries_recorded",
    existingControlledRecords: ["T2078", "T2079", "T2080", "T2081", "T2087"],
    verifiedTranslationGroups: [],
    rootVinayaCommentaryGroups: [],
    rootTreatiseCommentaryGroups: [],
    rootEditionBoundaryGroups: [],
    editionOrRecensionGroups: [],
    subcommentaryGroups: [],
    sameNumberBoundaryGroups: [],
    layeredAttributionGroups: ["multi-author-compilations-t2102-t2103-t2108-t2120", "monastic-court-documents-t2108-t2119-t2120"],
    scopeBoundaryGroups: ["east-asian-apologetic-treatises-t2109-t2118", "monastic-court-documents-t2108-t2119-t2120"],
    continuationBoundaryGroups: ["hongming-anthology-series-t2102-t2103", "buddhist-daoist-debate-series-t2104-t2105"],
    sourceReuseBoundaryGroups: ["hongming-anthology-series-t2102-t2103", "buddhist-daoist-debate-series-t2104-t2105", "guang-hongming-lunheng-source-reuse-t2103-t2104"],
    sameAuthorCompanionWorkGroups: ["daoxuan-miracle-revelation-records-t2106-t2107", "daoxuan-t52-companion-works-t2103-t2104-t2106-t2107", "falin-apologetic-treatises-t2109-t2110", "qisong-cross-volume-works-t2078-t2080-t2115"],
    crossVolumeRelationGroups: ["qisong-cross-volume-works-t2078-t2080-t2115", "xuanzang-travel-and-memorial-records-t2087-t2119", "bukong-lineage-and-court-documents-t2081-t2120"],
    relatedDistinctWorkGroups: relationGroups.map((group) => group.groupId),
    candidateRelationsNotMerged: [
      "T2102/T2103 是护法总集本编—广集关系；编者、时代、篇目范围、结构和两个权威作品入口保持分立",
      "T2104/T2105 是佛道论衡本编—续集关系；道宣与智昇责任、卷数和作品号不同",
      "T2103/T2104 的五字组对较短文本包含度约 0.341951，显著材料复用不消除文集与论衡的不同编纂范围和两个作品号",
      "T2103、T2104、T2106、T2107 同属道宣责任脉络但为四部不同文类作品；T2106/T2107 的三宝汇编与个人感通范围不等同",
      "T2109/T2110 同为法琳护法著作，但两卷破邪论与八卷辩正论保持两部作品",
      "T2102、T2103、T2108、T2120 的总集编者与篇内作者、臣僧或朝廷原责任分层保存",
      "T2115 与 T2078–T2080 同属契嵩，却是文集、史记、谱系图和宗论四个跨卷独立作品",
      "T2119 传统责任题记、DILA 与 CBC 均未署总集责任，不因题名含玄奘而推定玄奘为编者",
      "T2119 与 T2087 共享玄奘人物、T2120 与 T2081 共享不空相关语境，都只建立跨文类关系",
    ],
    partialWorkWitnesses: [],
    editionWitnesses: [],
    sourceRoles,
    textualComparison: {
      algorithm: "Unicode text from stable reading lines; punctuation/space removed; unique character 5-gram containment and Jaccard. Overlap records continuation, source reuse, common authors or document formulae; distinct DILA/CBC work entries, title, responsibility, genre and scope prevent automatic work merge.",
      pairs: comparisonPairs,
    },
    authoritySources: [
      "https://github.com/cbeta-org/xml-p5/tree/2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9/T/T52",
      ...Object.values(authorityIds).map((code) => `https://authority.dila.edu.tw/catalog/search.php?code=${code}`),
      ...Object.values(cbcTextIds).map((id) => `https://dazangthings.nz/cbc/text/${id}/`),
    ],
    caveat: "T52 是汉地护法文集、佛道与三教论辩、感通录、个人文集及朝廷表制文书的集合，不是佛陀逐字亲说的单一经藏集合。平台完整保存固定 CBETA TEI、校勘、总集与篇内责任层级，同时分离作品、表达、续编、伴随著作、跨卷人物关系和未署名责任；相邻经号、共同作者、续集题名、论敌、人物、制度语境或机器相似度都不能单独证明作品相同。",
  },
  files,
};

if (
  files.length !== 19 || batchWorkIds.size !== 19 ||
  batch.collection.newSourceBytes !== 18836743 ||
  batch.collection.newStableSegments !== 70393 ||
  batch.collection.newFolios !== 2654 ||
  batch.collection.newJuans !== 124 ||
  batch.collection.verifiedEditionWitnesses !== 0 ||
  batch.collection.unsignedResponsibilityRecords !== 1 ||
  batch.collection.lostTranslatorResponsibilityRecords !== 0 ||
  batch.collection.relationAnnotatedRecords !== 19 ||
  new Set(batch.boundaryAudit.authoritySources).size !== 39
) throw new Error(`T52 来源、作品、权威、关系或责任计数漂移：${JSON.stringify(batch.collection)}`);

const outputPath = resolve(root, `data/corpus/cbeta/batch-v${version}.json`);
await writeFile(outputPath, `${JSON.stringify(batch, null, 2)}\n`, "utf8");
console.log(`CBETA T52 审计完成：${files.length}/${inventory.totals.records} 个固定来源记录；新增 ${batchWorkIds.size} 个作品与完整表达、${batch.collection.newStableSegments} 个稳定行段、${batch.collection.newFolios} 个版页单元、${batch.collection.newJuans} 卷。`);

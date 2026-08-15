import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { buildPageNavigation, parseCbetaReadingLines } from "../src/lib/cbeta-tei.mjs";

const root = process.cwd();
const version = "4.22.0";
const expectedCommit = "2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9";
const sourceArgument = process.argv.find((argument) => argument.startsWith("--source-dir="));
if (!sourceArgument) {
  console.error("用法：node scripts/audit-cbeta-t55.mjs --source-dir=/固定提交的/xml-p5");
  process.exit(1);
}
const sourceRoot = resolve(sourceArgument.slice("--source-dir=".length));
const actualCommit = execFileSync("git", ["-C", sourceRoot, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (actualCommit !== expectedCommit) throw new Error(`上游工作树必须固定到 ${expectedCommit}`);

const inventoryPath = "data/gbcr/cbeta-taisho-t55-inventory-v0.1.0.json";
const inventory = JSON.parse(await readFile(resolve(root, inventoryPath), "utf8"));
const baseCatalogPath = "data/corpus/cbeta/catalog-v4.21.0.json";
const baseCatalog = JSON.parse(await readFile(resolve(root, baseCatalogPath), "utf8"));
const sourceUnits = (file) => file.sourceParts ?? [file];
const controlledPaths = new Set(baseCatalog.files.flatMap(sourceUnits).map((file) => file.upstreamPath));
const candidates = inventory.records.filter((record) => !controlledPaths.has(record.upstreamPath));
if (inventory.totals.records !== 42 || inventory.totals.upstreamBytes !== 25586209 || candidates.length !== 42) {
  throw new Error(`T55 固定来源分母或新增记录漂移：${inventory.totals.records}/${candidates.length}`);
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
    "buddhist_catalogue_reference_works_distinct",
    "t55-buddhist-catalogues-and-bibliographies",
    "T55 佛教目录学与知识史原典边界",
    "T2145–T2184 的 42 份记录均是佛教经录、请来目录或宗派章疏目录。它们保存佛典传播、编藏和知识分类史，但不是佛陀逐字亲说；平台按 42 个独立作品建模。",
    candidates.map((record) => record.canonWitnessId),
  ),
  relation(
    "successive_chinese_canon_catalogues_distinct",
    "early-chinese-and-sui-tang-canon-catalogues-t2145-t2158",
    "汉地历代经录与续录、略出边界",
    "T2145–T2158 横跨梁、隋、唐与南唐，题名相近且常承用前录，却有不同编者、年代、收录范围和编排目的；续录、略出及新定目录均保持独立作品。",
    candidates.slice(0, 14).map((record) => record.canonWitnessId),
  ),
  relation(
    "similar_title_successive_catalogues_distinct",
    "zhongjing-mulu-t2146-t2148",
    "三部《众经目录》同题异作边界",
    "T2146、T2147、T2148 的规范化五字组显示承袭关系，但法经、彦琮、静泰三录的责任、时代、卷数和 DILA/CBC 入口各异，不因同题或正文重合归并。",
    ["T2146", "T2147", "T2148"],
  ),
  relation(
    "main_catalogue_supplement_distinct",
    "datang-neidianlu-t2149-t2150",
    "《大唐内典录》与续录边界",
    "T2149 十卷本录与 T2150 一卷续录同署道宣并有材料关联，续录仍有独立题名、范围、权威入口及完整来源记录，登记为两个相关作品。",
    ["T2149", "T2150"],
  ),
  relation(
    "translation_history_continuation_distinct",
    "gujin-yijing-tuji-t2151-t2152",
    "《古今译经图纪》与续编边界",
    "T2151 为靖迈四卷本编，T2152 为智昇一卷续编；共同文类不消除编者、范围和作品身份。",
    ["T2151", "T2152"],
  ),
  relation(
    "full_catalogue_abridgement_distinct",
    "kaiyuan-shijiao-lu-t2154-t2155",
    "《开元释教录》本录与略出边界",
    "T2154 二十卷本录与 T2155 四卷略出同署智昇并高度相关；略出具有独立题名、结构、范围和权威入口，保持两个作品。",
    ["T2154", "T2155"],
  ),
  relation(
    "successive_zhenyuan_catalogues_distinct",
    "zhenyuan-catalogues-t2156-t2158",
    "贞元续录、新定目录与后续目录边界",
    "T2156、T2157、T2158 构成续修谱系，但圆照集录、新定三十卷目录与南唐恒安续录的责任、时代和范围不同，不自动合并。",
    ["T2156", "T2157", "T2158"],
  ),
  relation(
    "japanese_import_catalogues_distinct",
    "japanese-import-and-acquisition-catalogues-t2159-t2176",
    "日本入唐请来与求法目录边界",
    "T2159–T2176 记录最澄、空海、常晓、圆行、圆仁、惠运、圆珍、宗叡、安然等人的请来、求法和密教目录。共同网络与体例建立历史关联，但每份目录的责任、时间、取得范围和权威入口不同。",
    candidates.slice(14, 34).map((record) => record.canonWitnessId),
  ),
  relation(
    "same_number_distinct_catalogue_works",
    "taisho-t2168a-b-distinct-works",
    "T2168A/B 同数字经号异作边界",
    "T2168A《惠运禅师将来教法目录》与 T2168B《惠运律师书目录》虽共享 DILA 基础号 CA0001493 并同署惠运，题名、正文、CBC 入口与来源记录不同；五字组包含度 0.243802，不足以证明版本关系，保留两个作品。",
    ["T2168A", "T2168B"],
  ),
  relation(
    "same_number_distinct_catalogue_works",
    "taisho-t2174a-b-distinct-works",
    "T2174A/B 同数字经号异作边界",
    "T2174A《新书写请来法门等目录》署宗叡撰，T2174B《禅林寺宗叡僧正目录》顶层未署名；二者题名、责任、DILA 作品号、CBC 入口和正文均不同，保留两个作品。",
    ["T2174A", "T2174B"],
  ),
  relation(
    "same_compiler_multiple_catalogues_distinct",
    "yuanren-catalogues-t2165-t2167",
    "圆仁三份请来与求法目录边界",
    "T2165–T2167 同署圆仁且部分内容复用，但分别记录不同时间与范围的在唐取得、送进和新求圣教，三个权威入口与题名支持独立作品。",
    ["T2165", "T2166", "T2167"],
  ),
  relation(
    "same_compiler_multiple_catalogues_distinct",
    "yuanzhen-catalogues-t2169-t2173",
    "圆珍五份求法目录边界",
    "T2169–T2173 同属圆珍求法文献，分别对应开元寺、福州温州台州、青龙寺、入唐求法总录与智证大师请来录；地点、范围、题名和权威入口均不同。",
    ["T2169", "T2170", "T2171", "T2172", "T2173"],
  ),
  relation(
    "sectarian_bibliographies_distinct",
    "sectarian-and-comprehensive-bibliographies-t2177-t2184",
    "宗派章疏目录与综合目录边界",
    "T2177–T2182 分录华严、天台、三论、法相与律宗章疏，T2183–T2184 为传灯与诸宗教藏综合目录。共同书目功能不构成同一作品。",
    candidates.slice(34).map((record) => record.canonWitnessId),
  ),
  relation(
    "same_school_successive_bibliographies_distinct",
    "faxiang-bibliographies-t2180-t2181",
    "法相宗两部章疏目录边界",
    "T2180《法相宗章疏》与 T2181《注进法相宗章疏》同属法相书目，责任、篇幅、题名、权威入口和正文范围不同，保持独立作品。",
    ["T2180", "T2181"],
  ),
];

const authorityIds = {
  T2145: "CA0000496", T2146: "CA0000673", T2147: "CA0002872", T2148: "CA0004188",
  T2149: "CA0000684", T2150: "CA0003641", T2151: "CA0001175", T2152: "CA0001176",
  T2153: "CA0003455", T2154: "CA0001913", T2155: "CA0001914", T2156: "CA0003648",
  T2157: "CA0004047", T2158: "CA0003653", T2159: "CA0004176", T2160: "CA0004189",
  T2161: "CA0004190", T2162: "CA0001145", T2163: "CA0000437", T2164: "CA0002080",
  T2165: "CA0002687", T2166: "CA0004191", T2167: "CA0002689", T2168A: "CA0001493A",
  T2168B: "CA0001493B", T2169: "CA0001911", T2170: "CA0001113", T2171: "CA0002585",
  T2172: "CA0002688", T2173: "CA0004096", T2174A: "CA0003587", T2174B: "CA0000400",
  T2175: "CA0002129", T2176: "CA0004120", T2177: "CA0001467", T2178: "CA0003249",
  T2179: "CA0002727", T2180: "CA0000944", T2181: "CA0000945", T2182: "CA0002139",
  T2183: "CA0000786", T2184: "CA0004146",
};
const cbcTextIds = {
  T2145: 436, T2146: 424, T2147: 416, T2148: 417, T2149: 429, T2150: 415, T2151: 420,
  T2152: 426, T2153: 433, T2154: 430, T2155: 434, T2156: 435, T2157: 428, T2158: 423,
  T2159: 432, T2160: 414, T2161: 439, T2162: 418, T2163: 444, T2164: 448, T2165: 419,
  T2166: 437, T2167: 412, T2168A: 438, T2168B: 431, T2169: 446, T2170: 422, T2171: 413,
  T2172: 450, T2173: 421, T2174A: 425, T2174B: 411, T2175: 452, T2176: 445, T2177: 449,
  T2178: 442, T2179: 427, T2180: 440, T2181: 447, T2182: 451, T2183: 443, T2184: 441,
};
const unsignedIds = new Set(["T2162", "T2174B", "T2175"]);
const baseAuthorityIds = Object.values(authorityIds).map((id) => id.replace(/[AB]$/, ""));
if (
  Object.keys(authorityIds).length !== 42 || new Set(Object.values(authorityIds)).size !== 42 ||
  new Set(baseAuthorityIds).size !== 41 || Object.keys(cbcTextIds).length !== 42 ||
  new Set(Object.values(cbcTextIds)).size !== 42
) throw new Error("T55 必须保留 42 个 DILA 表达记录、41 个基础号、42 个独立作品与 42 个 CBC 入口");

const familyFor = (id) => {
  const number = Number(id.match(/^T(\d+)/)?.[1]);
  if (number <= 2158) return { code: "chinese-buddhist-canon-catalogue", role: "chinese_buddhist_canon_catalogue", tradition: "汉传佛教 · 经录与编藏史" };
  if (number <= 2176) return { code: "japanese-import-acquisition-catalogue", role: "japanese_buddhist_import_or_acquisition_catalogue", tradition: "日本佛教 · 入唐请来与求法目录" };
  if (number <= 2182) return { code: "sectarian-buddhist-bibliography", role: "east_asian_buddhist_sectarian_bibliography", tradition: "东亚佛教 · 宗派章疏目录" };
  return { code: "comprehensive-buddhist-bibliography", role: "east_asian_buddhist_comprehensive_bibliography", tradition: "东亚佛教 · 综合目录与传灯书目" };
};
const roleOverrides = {
  T2145: "sengyou_early_chinese_canon_catalogue", T2149: "daoxuan_datang_neidianlu_catalogue",
  T2150: "daoxuan_datang_neidianlu_supplement", T2154: "zhisheng_kaiyuan_canon_catalogue",
  T2155: "zhisheng_kaiyuan_canon_catalogue_abridgement", T2168A: "huiyun_imported_teachings_catalogue",
  T2168B: "huiyun_book_catalogue", T2174A: "zongrui_newly_copied_import_catalogue",
  T2174B: "zenrinji_zongrui_catalogue_unsigned", T2175: "extra_canonical_text_catalogue_unsigned",
  T2183: "east_asian_transmission_bibliography", T2184: "goryeo_comprehensive_buddhist_bibliography",
};
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const gitBlobSha1 = (value) => createHash("sha1").update(`blob ${value.length}\0`).update(value).digest("hex");
const required = (value, label, id) => {
  if (!value?.trim()) throw new Error(`${id} 缺少 ${label}`);
  return value.trim();
};
const stripXml = (value) => value.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
const normalizeBody = (segments) => segments.map((segment) => segment.text).join("").replace(/[\s，。；：、！？「」『』（）\[\]〔〕]/g, "");
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
  if (unsignedIds.has(canonId) !== !rawAuthor) throw new Error(`${canonId} 顶层责任署名边界漂移`);
  const family = familyFor(canonId);
  const relations = relationGroups.filter((group) => group.externalIds.cbeta.includes(canonId));
  if (!authorityIds[canonId] || !cbcTextIds[canonId] || relations.length < 2) throw new Error(`${canonId} 缺少权威号、CBC 入口或关系裁决`);

  const segments = parseCbetaReadingLines(text, { canonId });
  const navigation = buildPageNavigation(segments);
  const numericJuans = [...new Set(segments.map((segment) => segment.juan))].map(Number);
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
    workIdentityStatus: "verified_distinct_buddhist_catalogue_work",
    workTitle: title,
    sourceRole: roleOverrides[canonId] ?? family.role,
    canonicalStatus: "buddhist_catalogue_reference_work_not_claimed_as_buddha_word",
    buddhaWordStatus: "not_claimed_buddha_word",
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
      canonRef: `大正藏 T55, no. ${canonId.slice(1)}`,
      translator: author.replace(/\s+/g, " · "),
      summary: `${extent}。完整保存固定 CBETA TEI、校勘、责任题记与原始卷序；作为独立佛教目录学与知识史原典建模，不标成佛陀逐字亲说。传统责任题记：${author}。`,
      sourceUrl: `https://cbetaonline.dila.edu.tw/zh/${canonId}_001`,
    },
    verification: {
      segments: segments.length,
      folios: navigation.length,
      juanRange: [numericJuans[0], numericJuans.at(-1)],
      juanSequence: numericJuans,
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
    uniqueFiveGrams: [left.size, right.size],
    sharedFiveGrams: shared,
    fiveGramContainmentOfShorter: Number((shared / Math.min(left.size, right.size)).toFixed(6)),
    fiveGramJaccard: Number((shared / (left.size + right.size - shared)).toFixed(6)),
  };
};
const comparisonPairIds = [
  ["T2146", "T2147"], ["T2146", "T2148"], ["T2147", "T2148"], ["T2149", "T2150"],
  ["T2151", "T2152"], ["T2154", "T2155"], ["T2156", "T2157"], ["T2157", "T2158"],
  ["T2159", "T2160"], ["T2165", "T2166"], ["T2165", "T2167"], ["T2166", "T2167"],
  ["T2168A", "T2168B"], ["T2169", "T2170"], ["T2169", "T2171"], ["T2169", "T2172"],
  ["T2169", "T2173"], ["T2174A", "T2174B"], ["T2180", "T2181"],
];
const comparisonPairs = comparisonPairIds.map(([left, right]) => compareBodies(left, right));
const comparisonByPair = new Map(comparisonPairs.map((item) => [item.pair.join("/"), item]));
if (
  comparisonByPair.get("T2147/T2148").fiveGramContainmentOfShorter !== 0.772395 ||
  comparisonByPair.get("T2154/T2155").fiveGramContainmentOfShorter !== 0.671745 ||
  comparisonByPair.get("T2168A/T2168B").fiveGramContainmentOfShorter !== 0.243802
) throw new Error("T55 目录承袭、略出或 A/B 异作正文比较漂移");

const sourceRoles = Object.fromEntries([...new Set(files.map((file) => file.sourceRole))].sort().map((role) => [
  role,
  files.filter((file) => file.sourceRole === role).map((file) => file.id),
]));
const batchWorkIds = new Set(files.map((file) => file.workId));
const batch = {
  schema: "https://foxue.ai/schemas/cbeta-controlled-batch-v1.0",
  version,
  publishedAt: "2026-08-16",
  baseCatalog: baseCatalogPath,
  inventory: inventoryPath,
  rightsCategory: "Individually reviewed CBETA TEI files in Taishō volumes T01–T55; T55 source-record closure",
  workOverrides: {},
  fileOverrides: {},
  collection: {
    id: "CBETA-TAISHO-T55",
    title: "大正藏 T55 汉地经录、日本入唐请来目录与宗派章疏目录固定来源记录",
    sourceRecordDenominator: 42,
    previouslyControlledSourceRecords: 0,
    newSourceRecords: files.length,
    controlledSourceRecords: files.length,
    newSourceBytes: files.reduce((sum, file) => sum + file.upstreamBytes, 0),
    newStableSegments: files.reduce((sum, file) => sum + file.verification.segments, 0),
    newFolios: files.reduce((sum, file) => sum + file.verification.folios, 0),
    newJuans: files.reduce((sum, file) => sum + file.verification.juanSequence.length, 0),
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
    lostTranslatorResponsibilityRecords: 0,
    nonBuddhistReferenceRecords: 0,
    newWorks: batchWorkIds.size,
    controlledWorks: batchWorkIds.size,
    workCountingDecision: "T55 的 42 份固定来源记录登记为 42 个完整表达与 42 个作品。全部属于佛教目录学和知识史原典，但均不标为佛陀逐字亲说。T2168A/B 虽共享 DILA 基础号 CA0001493，题名、内容和 CBC 入口支持两个作品；T2174A/B 亦为异作。续录、略出、同编者目录及同宗书目只建立关系，不自动归并。",
  },
  boundaryAudit: {
    status: "verified_source_integrity_catalogue_succession_same_number_responsibility_and_buddha_word_boundaries_recorded",
    existingControlledRecords: [],
    verifiedTranslationGroups: [],
    rootVinayaCommentaryGroups: [],
    rootTreatiseCommentaryGroups: [],
    rootEditionBoundaryGroups: [],
    editionOrRecensionGroups: [],
    subcommentaryGroups: [],
    sameNumberBoundaryGroups: ["taisho-t2168a-b-distinct-works", "taisho-t2174a-b-distinct-works"],
    layeredAttributionGroups: [],
    scopeBoundaryGroups: ["t55-buddhist-catalogues-and-bibliographies", "early-chinese-and-sui-tang-canon-catalogues-t2145-t2158", "japanese-import-and-acquisition-catalogues-t2159-t2176", "sectarian-and-comprehensive-bibliographies-t2177-t2184"],
    continuationBoundaryGroups: ["datang-neidianlu-t2149-t2150", "gujin-yijing-tuji-t2151-t2152", "kaiyuan-shijiao-lu-t2154-t2155", "zhenyuan-catalogues-t2156-t2158"],
    sourceReuseBoundaryGroups: ["zhongjing-mulu-t2146-t2148", "kaiyuan-shijiao-lu-t2154-t2155", "yuanren-catalogues-t2165-t2167"],
    sameAuthorCompanionWorkGroups: ["yuanren-catalogues-t2165-t2167", "yuanzhen-catalogues-t2169-t2173"],
    crossVolumeRelationGroups: [],
    irregularJuanSequenceGroups: [],
    nonBuddhistReferenceGroups: [],
    relatedDistinctWorkGroups: relationGroups.map((group) => group.groupId),
    candidateRelationsNotMerged: [
      "T2146–T2148 同题且有显著正文承袭，但责任、时代、范围与权威入口支持三个作品",
      "T2149/T2150、T2151/T2152、T2154/T2155、T2156–T2158 的本编、续录、略出关系不等同于同一版本",
      "T2165–T2167 与 T2169–T2173 的共同编者和求法网络只建立关系，不消除各目录作品身份",
      "T2168A/B 共享 DILA 基础号，但题名、内容、CBC 入口和 0.243802 五字组包含度支持两个作品",
      "T2174A/B 共用数字经号，但题名、顶层责任与 DILA/CBC 入口支持两个作品",
      "T2177–T2184 的宗派与综合目录按各自责任、范围和权威号保持独立",
      "42 份记录均属佛教知识史原典，但不计作佛陀逐字亲说",
    ],
    partialWorkWitnesses: [],
    editionWitnesses: [],
    sourceRoles,
    textualComparison: {
      algorithm: "Unicode text from stable reading lines; punctuation/space removed; unique character 5-gram containment and Jaccard. Overlap records catalogue succession, reuse or shared terminology; authority, title, responsibility, date and scope determine work boundaries.",
      pairs: comparisonPairs,
    },
    authoritySources: [
      "https://github.com/cbeta-org/xml-p5/tree/2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9/T/T55",
      ...Object.values(authorityIds).map((code) => `https://authority.dila.edu.tw/catalog/search.php?code=${code}`),
      ...Object.values(cbcTextIds).map((id) => `https://dazangthings.nz/cbc/text/${id}/`),
      "https://archive2.cbeta.org/zh-cn/node/6519",
    ],
    caveat: "T55 是佛教经录、请来目录与章疏书目的集合，是理解佛典编藏、流通和知识分类不可替代的原典，但不是佛陀逐字亲说。平台完整保存固定 CBETA TEI、校勘、责任题记和卷序；相似题名、同编者、续录或略出、共享数字经号、DILA 基础号或机器重叠均不能单独证明同一作品。",
  },
  files,
};

if (
  files.length !== 42 || batchWorkIds.size !== 42 ||
  batch.collection.newSourceBytes !== 25586209 || batch.collection.newStableSegments !== 94016 ||
  batch.collection.newFolios !== 3631 || batch.collection.newJuans !== 152 ||
  batch.collection.verifiedEditionWitnesses !== 0 || batch.collection.unsignedResponsibilityRecords !== 3 ||
  batch.collection.nonBuddhistReferenceRecords !== 0 || batch.collection.relationAnnotatedRecords !== 42 ||
  new Set(batch.boundaryAudit.authoritySources).size !== 86
) throw new Error(`T55 来源、作品、权威、关系、卷序或责任边界计数漂移：${JSON.stringify(batch.collection)}`);

const outputPath = resolve(root, `data/corpus/cbeta/batch-v${version}.json`);
await writeFile(outputPath, `${JSON.stringify(batch, null, 2)}\n`, "utf8");
console.log(`CBETA T55 审计完成：${files.length}/${inventory.totals.records} 个固定来源记录；新增 ${batchWorkIds.size} 个作品与 ${files.length} 个完整表达、${batch.collection.newStableSegments} 个稳定行段、${batch.collection.newFolios} 个版页单元、${batch.collection.newJuans} 个卷单元；全部保持佛教目录学原典而非佛陀逐字亲说边界。`);

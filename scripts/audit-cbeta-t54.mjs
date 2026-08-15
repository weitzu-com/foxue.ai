import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { buildPageNavigation, parseCbetaReadingLines } from "../src/lib/cbeta-tei.mjs";

const root = process.cwd();
const version = "4.21.0";
const expectedCommit = "2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9";
const sourceArgument = process.argv.find((argument) => argument.startsWith("--source-dir="));
if (!sourceArgument) {
  console.error("用法：node scripts/audit-cbeta-t54.mjs --source-dir=/固定提交的/xml-p5");
  process.exit(1);
}
const sourceRoot = resolve(sourceArgument.slice("--source-dir=".length));
const actualCommit = execFileSync("git", ["-C", sourceRoot, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (actualCommit !== expectedCommit) throw new Error(`上游工作树必须固定到 ${expectedCommit}`);

const inventoryPath = "data/gbcr/cbeta-taisho-t54-inventory-v0.1.0.json";
const inventory = JSON.parse(await readFile(resolve(root, inventoryPath), "utf8"));
const baseCatalogPath = "data/corpus/cbeta/catalog-v4.20.0.json";
const baseCatalog = JSON.parse(await readFile(resolve(root, baseCatalogPath), "utf8"));
const sourceUnits = (file) => file.sourceParts ?? [file];
const controlledPaths = new Set(baseCatalog.files.flatMap(sourceUnits).map((file) => file.upstreamPath));
const candidates = inventory.records.filter((record) => !controlledPaths.has(record.upstreamPath));
if (inventory.totals.records !== 24 || inventory.totals.upstreamBytes !== 25078637 || candidates.length !== 24) {
  throw new Error(`T54 固定来源分母或新增记录漂移：${inventory.totals.records}/${candidates.length}`);
}

const relation = (type, groupId, label, evidence, ids) => ({
  type,
  groupId,
  label,
  evidence,
  externalIds: { cbeta: ids },
});
const buddhistReferenceIds = [
  "T2123", "T2124", "T2125", "T2126", "T2127", "T2128", "T2129", "T2130",
  "T2131", "T2132", "T2133A", "T2133B", "T2134", "T2135", "T2136",
];
const nonBuddhistReferenceIds = ["T2137", "T2138", "T2139", "T2140", "T2141A", "T2141B", "T2142", "T2143", "T2144"];
const relationGroups = [
  relation(
    "buddhist_reference_genres_distinct",
    "t54-buddhist-compendia-history-and-language-reference-works",
    "T54 佛教类书、制度史、音义与梵汉语文学资料边界",
    "T2123–T2136 横跨类书、名义集、求法传、僧史、制度参考书、佛典音义、译名集、悉昙与梵汉教材。共同服务佛教知识整理或语言学习，不构成同一作品，也不把后世编集标成佛陀逐字亲说。",
    buddhistReferenceIds,
  ),
  relation(
    "expanded_compendium_source_reuse_distinct",
    "daoshi-compendia-t2122-t2123",
    "道世《法苑珠林》与《诸经要集》扩充、材料复用边界",
    "T2123《诸经要集》二十卷成于 659 年，T2122《法苑珠林》一百卷为其后扩充的大型类书。两书规范化五字组对较短 T2123 的包含度为 0.877805，证明大量材料复用；不同题名、范围、结构、完成年代和 DILA/CBC 入口仍支持两个相关作品。",
    ["T2122", "T2123"],
  ),
  relation(
    "lexicon_continuation_distinct",
    "canonical-pronunciation-lexicons-t2128-t2129",
    "《一切经音义》与《续一切经音义》本编、续编边界",
    "T2128 为慧琳百卷佛典音义总集，T2129 为希麟十卷续编，补充后出经典。续编关系和共同体例建立书目关联，但作者、时代、收词范围、卷数与权威作品号均不同。",
    ["T2128", "T2129"],
  ),
  relation(
    "compiler_and_embedded_source_responsibility_layered",
    "huilin-lexicon-layered-responsibility-t2128",
    "慧琳总集责任与所收前代音义责任分层",
    "T2128 总集责任为慧琳撰，正文又明确保存玄应、景审、顾齐之等序跋、旧音义与分卷责任。平台保留全部题记，但不把篇内责任人误作百卷总集的共同作者。",
    ["T2128"],
  ),
  relation(
    "same_work_edition_witness",
    "sanskrit-thousand-character-primer-t2133a-b",
    "《梵语千字文》东洋文库本与敬光刊本版本组",
    "DILA 将 T2133A/B 登记为 CA0001000A/B，同题同署义净撰；CBETA 说明 A 本以东洋文库藏本为底本，B 本以日本安永二年敬光刊本为底本。两份完整 TEI 共享一个作品实体，保留两个版本表达、各自附录与稳定锚点。",
    ["T2133A", "T2133B"],
  ),
  relation(
    "sanskrit_chinese_language_works_distinct",
    "sanskrit-language-materials-t2132-t2136",
    "悉昙字记、千字文与梵汉词汇资料范围边界",
    "T2132–T2136 分别承担悉昙字母说明、千字韵文、唐梵词汇、杂名与双语对集等不同功能。T2133A/B 之外，其余题名、责任、体例、正文重合度与权威号均不支持作品合并。",
    ["T2132", "T2133A", "T2133B", "T2134", "T2135", "T2136"],
  ),
  relation(
    "same_author_cross_genre_distinct",
    "yijing-travel-and-language-works-t2125-t2133",
    "义净求法传与梵语教材跨文类伴随著作",
    "T2125《南海寄归内法传》记录求法见闻与僧团制度，T2133A/B《梵语千字文》是梵汉语学习材料；共同撰者义净与语言文化语境只建立人物关联，不消除作品和版本层级。",
    ["T2125", "T2133A", "T2133B"],
  ),
  relation(
    "non_buddhist_reference_texts_excluded_from_buddha_word",
    "t54-non-buddhist-reference-boundary-t2137-t2144",
    "外教部九份非佛教参照文本边界",
    "T2137–T2144 的九份记录涵盖印度数论与胜论、道教、摩尼教及景教文献。它们因佛教译者、敦煌文献史、宗教交流或《大正藏》编纂语境而具有研究价值，但不是佛教经典，更不是佛陀逐字亲说；平台允许阅读而从佛经覆盖分子中排除。",
    nonBuddhistReferenceIds,
  ),
  relation(
    "indian_non_buddhist_philosophies_distinct",
    "samkhya-vaisesika-t2137-t2138",
    "汉译数论与胜论文献学派边界",
    "T2137《金七十论》属数论传统，传统题记真谛译；T2138《胜宗十句义论》属胜论传统，题记慧月造、玄奘译。两者均由佛教翻译活动保存，却是不同学派、作者、译者与作品。",
    ["T2137", "T2138"],
  ),
  relation(
    "same_number_distinct_non_buddhist_works",
    "taisho-t2141a-b-distinct-works",
    "T2141A/B 同数字经号异作边界",
    "T2141A《摩尼光佛教法仪略》与 T2141B《波斯教残经》题名、范围、传统责任、DILA 基础作品号及 CBC 入口均不同。A/B 是《大正藏》编排标识，不是同一作品的版本证据。",
    ["T2141A", "T2141B"],
  ),
  relation(
    "manichaean_texts_distinct",
    "manichaean-chinese-texts-t2140-t2141",
    "摩尼教赞颂、仪略与残经作品边界",
    "T2140、T2141A、T2141B 同属汉语摩尼教文献语境，却分别为赞颂集、教法仪略与残经，责任层级、体例、范围及三个权威入口各异。共同宗教传统不构成同一作品。",
    ["T2140", "T2141A", "T2141B"],
  ),
  relation(
    "church_of_the_east_texts_distinct",
    "church-of-the-east-chinese-texts-t2142-t2144",
    "景教经、赞与碑颂作品边界",
    "T2142《序听迷诗所经》、T2143《景教三威蒙度赞》与 T2144《大秦景教流行中国碑颂》分别是经文、赞颂与碑铭；共同景教语境不能消除三种文类和作品边界。",
    ["T2142", "T2143", "T2144"],
  ),
  relation(
    "irregular_extant_juan_sequence_preserved",
    "laozi-huahu-jing-extant-juan-1-10-t2139",
    "《老子化胡经》残存卷一、卷十编码边界",
    "固定 TEI 的 extent 标 2 卷，稳定里程碑实际为卷一与卷十。平台按两个残存卷保存原始卷号与锚点，不改写成连续卷一、卷二，也不把缺卷误作完整十卷。",
    ["T2139"],
  ),
];

const authorityIds = {
  T2123: "CA0004139", T2124: "CA0000936", T2125: "CA0002323", T2126: "CA0002761",
  T2127: "CA0003157", T2128: "CA0003719", T2129: "CA0003651", T2130: "CA0000959",
  T2131: "CA0000960", T2132: "CA0003530", T2133A: "CA0001000A", T2133B: "CA0001000B",
  T2134: "CA0003221", T2135: "CA0001001", T2136: "CA0003220", T2137: "CA0001800",
  T2138: "CA0003010", T2139: "CA0001935", T2140: "CA0002298", T2141A: "CA0002297",
  T2141B: "CA0000332", T2142: "CA0003655", T2143: "CA0001819", T2144: "CA0000660",
};
const cbcTextIds = {
  T2123: 2264, T2124: 2262, T2125: 2255, T2126: 2265, T2127: 2267, T2128: 2266,
  T2129: 2273, T2130: 2276, T2131: 2258, T2132: 2272, T2133A: 2269, T2133B: 2268,
  T2134: 2277, T2135: 2275, T2136: 2271, T2137: 2274, T2138: 2270, T2139: 2260,
  T2140: 2259, T2141A: 2278, T2141B: 2261, T2142: 2256, T2143: 2263, T2144: 2257,
};
const baseAuthorityIds = Object.values(authorityIds).map((id) => id.replace(/[AB]$/, ""));
if (
  Object.keys(authorityIds).length !== 24 || new Set(Object.values(authorityIds)).size !== 24 ||
  new Set(baseAuthorityIds).size !== 23 || Object.keys(cbcTextIds).length !== 24 ||
  new Set(Object.values(cbcTextIds)).size !== 24
) throw new Error("T54 必须保留 24 个 DILA 表达记录、23 个基础作品号与 24 个 CBC 入口");

const familyFor = (id) => {
  const number = Number(id.match(/^T(\d+)/)?.[1]);
  if (number <= 2124) return { code: "buddhist-reference-compendium", role: "east_asian_buddhist_reference_compendium", tradition: "汉传佛教 · 类书与名义集" };
  if (number <= 2127) return { code: "buddhist-travel-institutional-history", role: "east_asian_buddhist_travel_or_institutional_history", tradition: "汉传佛教 · 求法与制度史" };
  if (number <= 2131) return { code: "buddhist-lexicographic-reference", role: "east_asian_buddhist_pronunciation_or_terminology_lexicon", tradition: "汉传佛教 · 音义与译名" };
  if (number <= 2136) return { code: "sanskrit-chinese-language-reference", role: "sanskrit_chinese_buddhist_language_reference", tradition: "汉传佛教 · 悉昙与梵汉语文学" };
  if (number <= 2138) return { code: "translated-indian-non-buddhist-philosophy", role: "translated_indian_non_buddhist_philosophy_reference", tradition: "印度哲学 · 外教参照" };
  if (number === 2139) return { code: "daoist-reference-text", role: "daoist_non_buddhist_reference_text", tradition: "道教文献 · 外教参照" };
  if (number <= 2141) return { code: "manichaean-reference-text", role: "manichaean_non_buddhist_reference_text", tradition: "摩尼教文献 · 外教参照" };
  return { code: "church-of-the-east-reference-text", role: "church_of_the_east_non_buddhist_reference_text", tradition: "景教文献 · 外教参照" };
};
const roleOverrides = {
  T2123: "daoshi_buddhist_compendium", T2125: "yijing_indian_monastic_practice_travel_record",
  T2128: "huilin_buddhist_canonical_pronunciation_lexicon", T2129: "xilin_buddhist_canonical_pronunciation_supplement",
  T2130: "anonymous_sanskrit_chinese_lexicon", T2131: "fayun_buddhist_translation_terminology_lexicon",
  T2132: "zhiguang_siddham_orthographic_treatise", T2133A: "yijing_sanskrit_thousand_character_primer",
  T2133B: "yijing_sanskrit_thousand_character_primer", T2141A: "manichaean_doctrinal_compendium_traditional_translation_attribution",
  T2141B: "manichaean_fragment_unattributed", T2144: "church_of_the_east_stele_text",
};
const unsignedIds = new Set(["T2130", "T2139", "T2140", "T2141B", "T2142", "T2143"]);
const irregularJuanSequences = { T2139: [1, 10] };

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
  if (!authorityIds[canonId] || !cbcTextIds[canonId] || relations.length === 0) {
    throw new Error(`${canonId} 缺少权威号、CBC 入口或关系裁决`);
  }

  const segments = parseCbetaReadingLines(text, { canonId });
  const navigation = buildPageNavigation(segments);
  const numericJuans = [...new Set(segments.map((segment) => segment.juan))].map(Number);
  const expectedIrregular = irregularJuanSequences[canonId];
  if (expectedIrregular) {
    if (numericJuans.join(",") !== expectedIrregular.join(",")) throw new Error(`${canonId} 残存卷序漂移`);
  } else if (numericJuans.some((juan, index) => !Number.isSafeInteger(juan) || juan < 1 || (index > 0 && juan !== numericJuans[index - 1] + 1))) {
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
  const isEditionWitness = canonId === "T2133A" || canonId === "T2133B";
  const isNonBuddhistReference = nonBuddhistReferenceIds.includes(canonId);
  const workId = isEditionWitness
    ? "gbcr:work:taisho-t2133-sanskrit-thousand-character-primer"
    : `gbcr:work:taisho-${canonId.toLowerCase()}-${family.code}`;
  files.push({
    id: canonId,
    slug: `taisho-${canonId.toLowerCase()}`,
    workId,
    workIdentityStatus: isEditionWitness ? "verified_edition_witness" : "verified_distinct_reference_work",
    workTitle: title,
    sourceRole: roleOverrides[canonId] ?? family.role,
    canonicalStatus: isNonBuddhistReference ? "non_buddhist_reference_text" : "buddhist_reference_work_not_claimed_as_buddha_word",
    buddhaWordStatus: isNonBuddhistReference ? "excluded_non_buddhist_reference" : "not_claimed_buddha_word",
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
      canonRef: `大正藏 T54, no. ${canonId.slice(1)}`,
      translator: author.replace(/\s+/g, " · "),
      summary: `${extent}。完整保存固定 CBETA TEI、校勘、责任题记与原始卷序；${isNonBuddhistReference ? "作为非佛教参照文献开放研究，不计作佛教经典或佛陀逐字亲说" : isEditionWitness ? "作为同一《梵语千字文》作品的独立版本见证" : "作为独立佛教类书、史传、音义或梵汉语文学资料建模，不标成佛陀逐字亲说"}。传统责任题记：${author}。`,
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

const t2122Text = await readFile(resolve(root, "data/corpus/cbeta/T53n2122.xml"), "utf8");
normalizedBodies.set("T2122", normalizeBody(parseCbetaReadingLines(t2122Text, { canonId: "T2122" })));
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
const comparisonPairs = [
  ["T2122", "T2123"], ["T2128", "T2129"], ["T2133A", "T2133B"],
  ["T2134", "T2135"], ["T2134", "T2136"], ["T2135", "T2136"],
  ["T2140", "T2141A"], ["T2140", "T2141B"], ["T2141A", "T2141B"],
  ["T2142", "T2143"], ["T2142", "T2144"], ["T2143", "T2144"],
].map(([left, right]) => compareBodies(left, right));
const comparisonByPair = new Map(comparisonPairs.map((item) => [item.pair.join("/"), item]));
if (
  comparisonByPair.get("T2122/T2123").fiveGramContainmentOfShorter !== 0.877805 ||
  comparisonByPair.get("T2133A/T2133B").fiveGramContainmentOfShorter !== 0.154937
) throw new Error("T54 类书扩充或《梵语千字文》版本正文比较漂移");

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
  rightsCategory: "Individually reviewed CBETA TEI files in Taishō volumes T01–T54; T54 source-record closure",
  workOverrides: {},
  fileOverrides: {},
  collection: {
    id: "CBETA-TAISHO-T54",
    title: "大正藏 T54 佛教类书、求法与制度史、语文学资料及外教文献固定来源记录",
    sourceRecordDenominator: 24,
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
    verifiedEditionWitnesses: files.filter((file) => file.workIdentityStatus === "verified_edition_witness").length,
    provisionalRecords: 0,
    newFullSourceTexts: files.length,
    newPartialSourceWitnesses: 0,
    relationAnnotatedRecords: files.filter((file) => file.bibliographicRelations?.length).length,
    attributionBoundaryRecords: files.length,
    unsignedResponsibilityRecords: files.filter((file) => file.presentation.translator === "传统责任题记未署名").length,
    lostTranslatorResponsibilityRecords: 0,
    nonBuddhistReferenceRecords: files.filter((file) => file.canonicalStatus === "non_buddhist_reference_text").length,
    newWorks: batchWorkIds.size,
    controlledWorks: batchWorkIds.size,
    workCountingDecision: "T54 的 24 份固定来源记录登记为 24 个完整表达和 23 个作品。T2133A/B 由 DILA 的 CA0001000A/B 与 CBETA 底本说明确认为同一《梵语千字文》的两个版本见证；其余记录保留独立作品。T2137–T2144 共 9 份外教资料可检索阅读但从佛教经典与佛陀亲说覆盖分子中排除；T2139 原样保存卷一、卷十两个残存卷号。",
  },
  boundaryAudit: {
    status: "verified_source_integrity_edition_expansion_language_layered_responsibility_irregular_juan_and_non_buddhist_reference_boundaries_recorded",
    existingControlledRecords: ["T2122"],
    verifiedTranslationGroups: [],
    rootVinayaCommentaryGroups: [],
    rootTreatiseCommentaryGroups: [],
    rootEditionBoundaryGroups: ["sanskrit-thousand-character-primer-t2133a-b"],
    editionOrRecensionGroups: ["sanskrit-thousand-character-primer-t2133a-b"],
    subcommentaryGroups: [],
    sameNumberBoundaryGroups: ["sanskrit-thousand-character-primer-t2133a-b", "taisho-t2141a-b-distinct-works"],
    layeredAttributionGroups: ["huilin-lexicon-layered-responsibility-t2128"],
    scopeBoundaryGroups: ["t54-buddhist-compendia-history-and-language-reference-works", "t54-non-buddhist-reference-boundary-t2137-t2144"],
    continuationBoundaryGroups: ["daoshi-compendia-t2122-t2123", "canonical-pronunciation-lexicons-t2128-t2129"],
    sourceReuseBoundaryGroups: ["daoshi-compendia-t2122-t2123"],
    sameAuthorCompanionWorkGroups: ["yijing-travel-and-language-works-t2125-t2133"],
    crossVolumeRelationGroups: ["daoshi-compendia-t2122-t2123"],
    irregularJuanSequenceGroups: ["laozi-huahu-jing-extant-juan-1-10-t2139"],
    nonBuddhistReferenceGroups: ["t54-non-buddhist-reference-boundary-t2137-t2144", "samkhya-vaisesika-t2137-t2138", "manichaean-chinese-texts-t2140-t2141", "church-of-the-east-chinese-texts-t2142-t2144"],
    relatedDistinctWorkGroups: relationGroups.filter((group) => group.type !== "same_work_edition_witness").map((group) => group.groupId),
    candidateRelationsNotMerged: [
      "T2122/T2123 五字组对较短文本包含度 0.877805，记录扩充与材料复用关系；一百卷《法苑珠林》和二十卷《诸经要集》仍为两个作品",
      "T2128/T2129 是佛典音义本编与续编，慧琳和希麟责任、时代、范围及作品号不同",
      "T2133A/B 共享一个作品，但保留东洋文库藏本与敬光刊本两个完整版本表达",
      "T2132–T2136 的悉昙、千字文与词汇材料除 T2133A/B 外不据语言功能或低量正文重合合并",
      "T2137–T2144 是九份非佛教参照文本，不因收录于《大正藏》而改标佛经或佛说",
      "T2141A/B 共用数字经号但为摩尼教仪略与残经两个作品",
      "T2139 extent 标 2 卷而编码卷序为 1、10，按两个残存卷保存，不重排为 1、2",
    ],
    partialWorkWitnesses: [],
    editionWitnesses: ["T2133A", "T2133B"],
    sourceRoles,
    textualComparison: {
      algorithm: "Unicode text from stable reading lines; punctuation/space removed; unique character 5-gram containment and Jaccard. Overlap records expansion, continuation, edition, shared terminology or religious vocabulary; authority, title, responsibility, genre and scope determine work boundaries.",
      pairs: comparisonPairs,
    },
    authoritySources: [
      "https://github.com/cbeta-org/xml-p5/tree/2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9/T/T54",
      ...Object.values(authorityIds).map((code) => `https://authority.dila.edu.tw/catalog/search.php?code=${code}`),
      ...Object.values(cbcTextIds).map((id) => `https://dazangthings.nz/cbc/text/${id}/`),
      "https://archive2.cbeta.org/ko/node/6519",
    ],
    caveat: "T54 同时包含佛教类书、史传、音义、梵汉语文学资料与九份外教文献，不是佛陀逐字亲说的单一经藏集合。平台完整保存固定 CBETA TEI、校勘、版本、篇内责任与原始残存卷序；T2133A/B 共享作品但保留两个版本，T2137–T2144 明确排除于佛教经典覆盖分子。共同作者、语言功能、续编题名、宗教语汇、相邻经号或机器重叠都不能单独证明作品相同。",
  },
  files,
};

if (
  files.length !== 24 || batchWorkIds.size !== 23 ||
  batch.collection.newSourceBytes !== 25078637 ||
  batch.collection.newStableSegments !== 91138 ||
  batch.collection.newFolios !== 3981 ||
  batch.collection.newJuans !== 176 ||
  batch.collection.verifiedEditionWitnesses !== 2 ||
  batch.collection.unsignedResponsibilityRecords !== 6 ||
  batch.collection.nonBuddhistReferenceRecords !== 9 ||
  batch.collection.relationAnnotatedRecords !== 24 ||
  new Set(batch.boundaryAudit.authoritySources).size !== 50
) throw new Error(`T54 来源、作品、权威、关系、卷序或外教边界计数漂移：${JSON.stringify(batch.collection)}`);

const outputPath = resolve(root, `data/corpus/cbeta/batch-v${version}.json`);
await writeFile(outputPath, `${JSON.stringify(batch, null, 2)}\n`, "utf8");
console.log(`CBETA T54 审计完成：${files.length}/${inventory.totals.records} 个固定来源记录；新增 ${batchWorkIds.size} 个作品、${files.length} 个完整表达、${batch.collection.newStableSegments} 个稳定行段、${batch.collection.newFolios} 个版页单元、${batch.collection.newJuans} 个残存卷单元；${batch.collection.nonBuddhistReferenceRecords} 份外教参照文本已从佛经覆盖分子排除。`);

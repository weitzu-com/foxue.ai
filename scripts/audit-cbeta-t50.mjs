import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { buildPageNavigation, parseCbetaReadingLines } from "../src/lib/cbeta-tei.mjs";

const root = process.cwd();
const version = "4.17.0";
const expectedCommit = "2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9";
const sourceArgument = process.argv.find((argument) => argument.startsWith("--source-dir="));
if (!sourceArgument) {
  console.error("用法：node scripts/audit-cbeta-t50.mjs --source-dir=/固定提交的/xml-p5");
  process.exit(1);
}
const sourceRoot = resolve(sourceArgument.slice("--source-dir=".length));
const actualCommit = execFileSync("git", ["-C", sourceRoot, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (actualCommit !== expectedCommit) throw new Error(`上游工作树必须固定到 ${expectedCommit}`);

const inventoryPath = "data/gbcr/cbeta-taisho-t50-inventory-v0.1.0.json";
const inventory = JSON.parse(await readFile(resolve(root, inventoryPath), "utf8"));
const baseCatalogPath = "data/corpus/cbeta/catalog-v4.16.0.json";
const baseCatalog = JSON.parse(await readFile(resolve(root, baseCatalogPath), "utf8"));
const sourceUnits = (file) => file.sourceParts ?? [file];
const controlledPaths = new Set(baseCatalog.files.flatMap(sourceUnits).map((file) => file.upstreamPath));
const candidates = inventory.records.filter((record) => !controlledPaths.has(record.upstreamPath));
if (inventory.totals.records !== 27 || inventory.totals.upstreamBytes !== 19479473 || candidates.length !== 27) {
  throw new Error(`T50 固定来源分母或新增记录漂移：${inventory.totals.records}/${candidates.length}`);
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
    "buddha_biographical_genealogies_scope_distinct",
    "buddha-genealogies-t2040-t2041",
    "《释迦谱》与《释迦氏谱》作品边界",
    "T2040 与 T2041 都编述释迦世系与生平，但分别由梁僧祐和唐道宣撰，卷数、结构、内容范围及 DILA 作品号 CA0003119/CA0003126 不同；五字组较短一方包含度约 0.090468，只建立主题与资料关系，不合并作品。",
    ["T2040", "T2041"],
  ),
  relation(
    "ashoka_narrative_translation_and_episode_scope_distinct",
    "ashoka-narratives-t2042-t2045",
    "阿育王传记、经译与譬喻因缘作品边界",
    "T2042《阿育王传》与 T2043《阿育王经》是相关而不同的完整汉译传统，T2044/T2045 是题名与范围独立的譬喻、坏目因缘记录。四个 DILA 作品号、责任题记、卷数和正文范围不同；两部长本五字组包含度仅约 0.016720。",
    ["T2042", "T2043", "T2044", "T2045"],
  ),
  relation(
    "indian_master_biographies_person_scope_distinct",
    "indian-master-biographies-t2046-t2049",
    "马鸣、龙树、提婆与婆薮槃豆传记人物边界",
    "T2046–T2049 分别传述马鸣、龙树、提婆与婆薮槃豆。人物、题名和 DILA 作品号不同，不能因同属印度论师传或共享传统译者而合并；唯 T2047a/b 另依同基础权威号与正文证据归为同一作品的两个版本见证。",
    ["T2046", "T2047a", "T2047b", "T2048", "T2049"],
  ),
  relation(
    "same_work_edition_or_recension_group_verified",
    "nagarjuna-biography-t2047a-b",
    "《龙树菩萨传》T2047a/b 版本见证",
    "两份 TEI 的核心题名、鸠摩罗什传统译者与基础经号相同；DILA 分配 CA0002117a/b 并指向同一 CBC 作品入口，五字组较短一方包含度约 0.618960、Jaccard 约 0.422018。平台共享作品实体，同时保留两个完整版本见证、独立来源校验与阅读路线。",
    ["T2047a", "T2047b"],
  ),
  relation(
    "east_asian_individual_monk_biographies_scope_distinct",
    "east-asian-monk-biographies-t2050-t2057",
    "智者、法琳、玄奘、法藏、善无畏与不空史传边界",
    "T2050–T2057 记录不同人物、作者、时代和寺院网络；即使共享行状、别传体例或史料，八个完整记录仍按各自题名、责任题记、全文范围与 DILA 作品号建模。T2057 传统责任题记未署名，不从相邻记录补造作者。",
    ["T2050", "T2051", "T2052", "T2053", "T2054", "T2055", "T2056", "T2057"],
  ),
  relation(
    "short_acts_and_full_biography_scope_distinct",
    "xuanzang-biographies-t2052-t2053",
    "玄奘行状与十卷传记范围边界",
    "T2052《行状》一卷、冥详撰，T2053《大慈恩寺三藏法师传》十卷、慧立本与彦悰笺；五字组较短一方包含度约 0.206132，说明共享生平资料但不消除题名、作者、体量、编纂层和 DILA 作品号差异。",
    ["T2052", "T2053"],
  ),
  relation(
    "dharma_transmission_and_collective_biographies_scope_distinct",
    "transmission-collective-biographies-t2058-t2065",
    "付法传承与历代僧尼合集作品边界",
    "T2058 是汉译付法因缘传，T2059–T2065 是时代、地域、性别或神异主题各异的僧尼传记合集。相邻经号与人物资料交叉只构成研究关系，八个题名、责任题记、范围和 DILA 作品号保持独立。",
    ["T2058", "T2059", "T2060", "T2061", "T2062", "T2063", "T2064", "T2065"],
  ),
  relation(
    "high_monk_biography_series_and_continuations_distinct",
    "high-monk-series-t2059-t2062",
    "《高僧传》历代本编、续编与后代汇编边界",
    "T2059《高僧传》、T2060《续高僧传》、T2061《宋高僧传》与 T2062《大明高僧传》形成历代续修系列，但由不同作者在不同时代编纂，卷数与收录范围不同；相互五字组包含度均低于 0.006，续修关系不等于同一作品。",
    ["T2059", "T2060", "T2061", "T2062"],
  ),
  relation(
    "collective_biography_source_reuse_without_work_merge",
    "collective-biography-reuse-t2059-t2061-t2064",
    "《神僧传》对历代高僧传资料复用边界",
    "T2064《神僧传》与 T2059–T2061 共享人物和传记材料，五字组较短一方包含度约 0.203935、0.169042、0.168946；这证明选录与史料复用，不足以覆盖《神僧传》的神异选编范围、未署名责任和独立 DILA 作品号。",
    ["T2059", "T2060", "T2061", "T2064"],
  ),
  relation(
    "gender_miracle_and_regional_collective_biographies_distinct",
    "specialized-collective-biographies-t2063-t2065",
    "比丘尼、神僧与海东高僧专门传集边界",
    "T2063 以比丘尼为收录范围，T2064 以神异僧传为主题，T2065 以高丽海东佛教为地域范围；三者对象、编者状态、地域、全文和 DILA 作品号均不同，不能因共同传记体裁合并。",
    ["T2063", "T2064", "T2065"],
  ),
];

const authorityIds = {
  T2040: "CA0003119", T2041: "CA0003126", T2042: "CA0000076", T2043: "CA0000073",
  T2044: "CA0000074", T2045: "CA0000075", T2046: "CA0002157", T2047a: "CA0002117a",
  T2047b: "CA0002117b", T2048: "CA0003224", T2049: "CA0002416", T2050: "CA0003250",
  T2051: "CA0000934", T2052: "CA0003659", T2053: "CA0000566", T2054: "CA0000955",
  T2055: "CA0002914", T2056: "CA0000355", T2057: "CA0001492", T2058: "CA0001120",
  T2059: "CA0001136", T2060: "CA0001137", T2061: "CA0001140", T2062: "CA0001141",
  T2063: "CA0000300", T2064: "CA0002948", T2065: "CA0001142",
};
const authorityValues = Object.values(authorityIds);
const authorityWorkBases = new Set(authorityValues.map((value) => value.replace(/[ab]$/, "")));
if (Object.keys(authorityIds).length !== 27 || new Set(authorityValues).size !== 27 || authorityWorkBases.size !== 26) {
  throw new Error("T50 DILA 权威记录必须为 27 个唯一记录号和 26 个作品基础号");
}

const familyFor = (id) => {
  const number = Number(id.match(/\d+/)?.[0]);
  if (number <= 2041) return { code: "buddha-biographical-genealogy", role: "sinitic_buddha_biographical_genealogy", tradition: "汉传佛教 · 佛传谱系" };
  if (number <= 2045) return { code: "ashoka-narrative", role: "translated_ashoka_narrative", tradition: "汉传佛教 · 阿育王传记与因缘" };
  if (number <= 2049) return { code: "indian-master-biography", role: "translated_indian_master_biography", tradition: "汉传佛教 · 印度论师传" };
  if (number <= 2057) return { code: "east-asian-monk-biography", role: "east_asian_individual_monk_biography", tradition: "东亚佛教 · 高僧别传与行状" };
  if (number === 2058) return { code: "dharma-transmission-lineage", role: "translated_dharma_transmission_lineage", tradition: "汉传佛教 · 付法传承" };
  return { code: "collective-monastic-biography", role: "east_asian_collective_monastic_biography", tradition: "东亚佛教 · 僧尼传记合集" };
};
const roleOverrides = {
  T2040: "liang_compiled_buddha_biographical_genealogy",
  T2041: "tang_compiled_buddha_biographical_genealogy",
  T2042: "translated_asokarajavadana_biography",
  T2043: "translated_ashoka_scripture_narrative",
  T2044: "lost_translator_ashoka_parable",
  T2045: "translated_ashoka_eye_episode",
  T2046: "translated_asvaghosa_biography",
  T2047a: "kumarajiva_traditional_translation_nagarjuna_biography_edition_witness",
  T2047b: "kumarajiva_traditional_translation_nagarjuna_biography_edition_witness",
  T2048: "translated_aryadeva_biography",
  T2049: "translated_vasubandhu_biography",
  T2050: "sui_zhiyi_individual_biography",
  T2051: "tang_falin_individual_biography",
  T2052: "tang_xuanzang_short_acts",
  T2053: "tang_xuanzang_full_biography",
  T2054: "silla_fazang_individual_biography",
  T2055: "tang_subhakarasimha_acts",
  T2056: "tang_amoghavajra_acts",
  T2057: "unattributed_amoghavajra_related_acts",
  T2058: "translated_dharma_transmission_lineage",
  T2059: "liang_compiled_high_monk_biographies",
  T2060: "tang_compiled_continuation_high_monk_biographies",
  T2061: "song_compiled_high_monk_biographies",
  T2062: "ming_compiled_high_monk_biographies",
  T2063: "liang_compiled_buddhist_nun_biographies",
  T2064: "unattributed_miracle_monk_anthology",
  T2065: "goryeo_compiled_korean_high_monk_biographies",
};
const editionGroups = new Map([
  ["T2047a", { workId: "gbcr:work:nagarjuna-biography-t2047", status: "verified_edition_witness" }],
  ["T2047b", { workId: "gbcr:work:nagarjuna-biography-t2047", status: "verified_edition_witness" }],
]);
const statusOverrides = {
  T2042: "verified_distinct_related_ashoka_translation",
  T2043: "verified_distinct_related_ashoka_translation",
  T2052: "verified_distinct_short_biographical_acts",
  T2053: "verified_distinct_full_biography",
  T2059: "verified_distinct_high_monk_base_compilation",
  T2060: "verified_distinct_high_monk_continuation",
  T2061: "verified_distinct_dynastic_high_monk_compilation",
  T2062: "verified_distinct_dynastic_high_monk_compilation",
  T2063: "verified_distinct_gender_scoped_collective_biography",
  T2064: "verified_distinct_unattributed_miracle_monk_anthology",
  T2065: "verified_distinct_regional_collective_biography",
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
  if (!authorityIds[canonId] || relations.length === 0) throw new Error(`${canonId} 缺少权威号或关系裁决`);

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
  const identity = editionGroups.get(canonId) ?? {
    workId: `gbcr:work:taisho-${canonId.toLowerCase()}-${family.code}`,
    status: statusOverrides[canonId] ?? "verified_distinct_canonical_buddhist_work",
  };
  files.push({
    id: canonId,
    slug: `taisho-${canonId.toLowerCase()}`,
    workId: identity.workId,
    workIdentityStatus: identity.status,
    workTitle: title,
    sourceRole: roleOverrides[canonId] ?? family.role,
    bibliographicRelations: relations,
    authorityIds: { dilaCatalog: authorityIds[canonId] },
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
      canonRef: `大正藏 T50, no. ${canonId.slice(1)}`,
      translator: author.replace(/\s+/g, " · "),
      summary: `${extent}。完整保存固定 CBETA TEI、校勘与责任题记；${identity.status === "verified_edition_witness" ? "作为同一《龙树菩萨传》作品的独立完整版本见证" : "作为独立佛教传记、行状、传承或史传汇编"}建模，不标成佛陀逐字亲说。传统责任题记：${author}。`,
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
  ["T2040", "T2041"],
  ["T2042", "T2043"], ["T2042", "T2044"], ["T2042", "T2045"], ["T2043", "T2044"], ["T2043", "T2045"], ["T2044", "T2045"],
  ["T2047a", "T2047b"], ["T2052", "T2053"],
  ["T2059", "T2060"], ["T2059", "T2061"], ["T2060", "T2061"], ["T2061", "T2062"],
  ["T2059", "T2063"], ["T2059", "T2064"], ["T2060", "T2064"], ["T2061", "T2064"],
].map(([left, right]) => compareBodies(left, right));
const comparisonByPair = new Map(comparisonPairs.map((item) => [item.pair.join("/"), item]));
if (
  comparisonByPair.get("T2047a/T2047b").fiveGramContainmentOfShorter < 0.61 ||
  comparisonByPair.get("T2052/T2053").fiveGramContainmentOfShorter < 0.20 ||
  comparisonByPair.get("T2059/T2064").fiveGramContainmentOfShorter < 0.20
) throw new Error("T50 高风险版本、传记或史料复用正文比较漂移");

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
  rightsCategory: "Individually reviewed CBETA TEI files in Taishō volumes T01–T50; T50 source-record closure",
  workOverrides: {},
  fileOverrides: {},
  collection: {
    id: "CBETA-TAISHO-T50",
    title: "大正藏 T50 佛传、论师与僧尼史传固定来源记录",
    sourceRecordDenominator: 27,
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
    verifiedEditionWitnesses: files.filter((file) => file.workIdentityStatus === "verified_edition_witness").length,
    provisionalRecords: 0,
    newFullSourceTexts: files.length,
    newPartialSourceWitnesses: 0,
    relationAnnotatedRecords: files.filter((file) => file.bibliographicRelations?.length).length,
    attributionBoundaryRecords: files.length,
    unsignedResponsibilityRecords: files.filter((file) => file.presentation.translator === "传统责任题记未署名").length,
    lostTranslatorResponsibilityRecords: files.filter((file) => file.presentation.translator === "失譯").length,
    newWorks: batchWorkIds.size,
    controlledWorks: batchWorkIds.size,
    workCountingDecision: "T50 的 27 份固定来源记录登记为 27 个完整表达或版本见证和 26 个作品。T2047a/b 共享题名、传统译者、DILA 基础号 CA0002117 与 CBC 作品入口，正文高度重合，归为《龙树菩萨传》一个作品的两个完整版本见证；其余 25 条按独立佛传、论师传、行状、付法传承或僧尼传集建模。阿育王长短叙事、玄奘行状与传记、历代高僧传续修及《神僧传》史料复用只建立关系，不据主题、人物、相邻经号或机器重叠自动合并。",
  },
  boundaryAudit: {
    status: "verified_source_integrity_biographical_subject_same_work_edition_responsibility_continuation_gender_regional_and_source_reuse_boundaries_recorded",
    existingControlledRecords: [],
    verifiedTranslationGroups: [],
    rootVinayaCommentaryGroups: [],
    rootTreatiseCommentaryGroups: [],
    rootEditionBoundaryGroups: ["nagarjuna-biography-t2047a-b"],
    editionOrRecensionGroups: ["nagarjuna-biography-t2047a-b"],
    subcommentaryGroups: [],
    sameNumberBoundaryGroups: ["nagarjuna-biography-t2047a-b"],
    layeredAttributionGroups: ["east-asian-monk-biographies-t2050-t2057", "specialized-collective-biographies-t2063-t2065"],
    scopeBoundaryGroups: [
      "buddha-genealogies-t2040-t2041", "ashoka-narratives-t2042-t2045", "indian-master-biographies-t2046-t2049",
      "east-asian-monk-biographies-t2050-t2057", "transmission-collective-biographies-t2058-t2065", "specialized-collective-biographies-t2063-t2065",
    ],
    continuationBoundaryGroups: ["high-monk-series-t2059-t2062"],
    sourceReuseBoundaryGroups: ["xuanzang-biographies-t2052-t2053", "collective-biography-reuse-t2059-t2061-t2064"],
    relatedDistinctWorkGroups: relationGroups.filter((group) => !group.type.startsWith("same_work_")).map((group) => group.groupId),
    candidateRelationsNotMerged: [
      "T2040/T2041 同编释迦谱系，但作者、卷数、结构、DILA 作品号不同，五字组包含度约 0.090468",
      "T2042/T2043 是相关的阿育王长篇汉译传统，DILA 作品号不同且五字组包含度约 0.016720；T2044/T2045 的譬喻和坏目因缘范围另立",
      "T2046、T2048、T2049 传述不同印度论师；只有 T2047a/b 满足同作品版本见证证据链",
      "T2052/T2053 共享玄奘生平资料且包含度约 0.206132，但一卷行状与十卷传记的作者、编纂层、范围和 DILA 作品号不同",
      "T2059–T2062 构成历代高僧传续修系列，但作者、时代、题名、卷数和 DILA 作品号不同，相互正文包含度均低于 0.006",
      "T2064 对 T2059–T2061 的五字组包含度约 0.168946–0.203935，记录选录和史料复用，不把神异主题汇编并回任一高僧传",
      "T2063、T2064、T2065 分别按性别、神异主题与高丽地域组织，传记体裁相同不构成作品同一",
      "T2044 标为失译；T2057 与 T2064 题记未署名，均不从相邻作品、后世目录或共享材料补造责任者",
    ],
    partialWorkWitnesses: [],
    editionWitnesses: ["T2047a", "T2047b"],
    sourceRoles,
    textualComparison: {
      algorithm: "Unicode text from stable reading lines; punctuation/space removed; unique character 5-gram containment and Jaccard. Overlap records version关系、共享生平资料、续修与史料复用；只有题名、责任、目录权威、共同作品入口和正文证据链合取时才合并作品。",
      pairs: comparisonPairs,
    },
    authoritySources: [
      "https://github.com/cbeta-org/xml-p5/tree/2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9/T/T50",
      ...authorityValues.map((code) => `https://authority.dila.edu.tw/catalog/search.php?code=${code}`),
      "https://dazangthings.nz/cbc/text/1465/",
    ],
    caveat: "T50 是佛传、阿育王叙事、印度论师传、东亚高僧行状、付法传承与僧尼传记合集，不是佛陀逐字亲说的单一经藏集合。平台完整保存固定 CBETA TEI、校勘和传统责任题记，同时分离人物对象、作品、表达、a/b 版本见证、行状与长传、本编与续修、性别与地域范围、失译与未署名、选录与史料复用；相邻经号、共同人物、体裁、传统译者、后世引用或机器相似度都不能单独证明作品相同或责任无争议。",
  },
  files,
};

if (
  files.length !== 27 ||
  batchWorkIds.size !== 26 ||
  batch.collection.newSourceBytes !== 19479473 ||
  batch.collection.newStableSegments !== 87435 ||
  batch.collection.newFolios !== 3162 ||
  batch.collection.newJuans !== 152 ||
  batch.collection.verifiedEditionWitnesses !== 2 ||
  batch.collection.unsignedResponsibilityRecords !== 2 ||
  batch.collection.lostTranslatorResponsibilityRecords !== 1
) {
  throw new Error(`T50 来源、作品、版本、段落、卷页或责任计数漂移：${JSON.stringify(batch.collection)}`);
}
if (new Set(batch.boundaryAudit.authoritySources).size !== 29) {
  throw new Error("T50 CBETA、27 个 DILA 权威记录与共同 CBC 作品入口必须完整且唯一");
}

const outputPath = resolve(root, `data/corpus/cbeta/batch-v${version}.json`);
await writeFile(outputPath, `${JSON.stringify(batch, null, 2)}\n`, "utf8");
console.log(`CBETA T50 审计完成：${files.length}/${inventory.totals.records} 个固定来源记录；新增 ${batchWorkIds.size} 个作品、${files.length} 个完整表达或版本见证、${batch.collection.newStableSegments} 个稳定行段、${batch.collection.newFolios} 个版页单元、${batch.collection.newJuans} 卷。`);

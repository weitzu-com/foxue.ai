import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { buildPageNavigation, parseCbetaReadingLines } from "../src/lib/cbeta-tei.mjs";

const root = process.cwd();
const version = "4.18.0";
const expectedCommit = "2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9";
const sourceArgument = process.argv.find((argument) => argument.startsWith("--source-dir="));
if (!sourceArgument) {
  console.error("用法：node scripts/audit-cbeta-t51.mjs --source-dir=/固定提交的/xml-p5");
  process.exit(1);
}
const sourceRoot = resolve(sourceArgument.slice("--source-dir=".length));
const actualCommit = execFileSync("git", ["-C", sourceRoot, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (actualCommit !== expectedCommit) throw new Error(`上游工作树必须固定到 ${expectedCommit}`);

const inventoryPath = "data/gbcr/cbeta-taisho-t51-inventory-v0.1.0.json";
const inventory = JSON.parse(await readFile(resolve(root, inventoryPath), "utf8"));
const baseCatalogPath = "data/corpus/cbeta/catalog-v4.17.0.json";
const baseCatalog = JSON.parse(await readFile(resolve(root, baseCatalogPath), "utf8"));
const sourceUnits = (file) => file.sourceParts ?? [file];
const controlledPaths = new Set(baseCatalog.files.flatMap(sourceUnits).map((file) => file.upstreamPath));
const candidates = inventory.records.filter((record) => !controlledPaths.has(record.upstreamPath));
if (inventory.totals.records !== 36 || inventory.totals.upstreamBytes !== 17025589 || candidates.length !== 36) {
  throw new Error(`T51 固定来源分母或新增记录漂移：${inventory.totals.records}/${candidates.length}`);
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
    "pilgrimage_biography_scope_distinct",
    "pilgrimage-biographies-t2066-t2085-t2089",
    "求法高僧传、个人游记与游方抄本范围边界",
    "T2066 汇编多位赴西域求法高僧，T2085、T2086、T2087、T2089 分别保存法显、惠生、玄奘与慧超等人的行记或编纂记录；人物、时代、责任、体例、卷数及 DILA/CBC 作品入口不同，求法与旅行主题不能证明同一作品。",
    ["T2066", "T2085", "T2086", "T2087", "T2089"],
  ),
  relation(
    "lotus_devotional_biographies_distinct",
    "lotus-devotion-biographies-t2067-t2068",
    "两部法华传记作品与责任边界",
    "T2067《弘赞法华传》与 T2068《法华传记》均为十卷法华信仰史传，但题名、编纂者、结构和 DILA/CBC 作品入口不同；T2068 的 TEI 题记作“僧詳撰”，DILA 当前显示“僧祥”，平台并列保留而不静默归一。",
    ["T2067", "T2068"],
  ),
  relation(
    "sectarian_lineage_records_scope_distinct",
    "lineage-traditions-t2069-t2075-t2081",
    "天台九祖、禅宗法宝与密教师资付法记录边界",
    "T2069、T2075、T2081 分属天台祖师传、禅宗传法史与两部大法师资付法记；宗派、谱系对象、作者状态与作品权威入口均不同，不能因祖统结构或付法语汇合并。",
    ["T2069", "T2075", "T2081"],
  ),
  relation(
    "pure_land_rebirth_anthologies_distinct",
    "pure-land-rebirth-anthologies-t2070-t2072",
    "三部净土往生传集作品边界",
    "T2070《往生西方净土瑞应传》、T2071《净土往生传》、T2072《往生集》跨越不同年代、责任、卷数和收录范围；共享往生人物与故事属于史料复用证据，三个 DILA/CBC 作品入口保持独立。",
    ["T2070", "T2071", "T2072"],
  ),
  relation(
    "huayan_devotional_biographies_distinct",
    "huayan-devotion-biographies-t2073-t2074",
    "华严经传记与感应传范围边界",
    "T2073 五卷《华严经传记》与 T2074 一卷《大方广佛华严经感应传》共享华严信仰材料，但题名、责任、体量、结构及 DILA/CBC 作品入口不同，建立关联而不合并。",
    ["T2073", "T2074"],
  ),
  relation(
    "transmission_histories_genres_distinct",
    "transmission-histories-t2075-t2081",
    "灯录、传法史、祖图、宗论与师资记体例边界",
    "T2075–T2081 均涉及法脉或师资传承，却分别采用传灯录、续灯录、传法正宗记、定祖图、宗论与密教师资记等体例；题名、作者、时代、结构、宗派范围与 7 个权威作品入口均不同。",
    ["T2075", "T2076", "T2077", "T2078", "T2079", "T2080", "T2081"],
  ),
  relation(
    "transmission_lamp_continuation_distinct",
    "transmission-lamp-series-t2076-t2077",
    "《景德传灯录》与《续传灯录》续修边界",
    "T2077 明代《续传灯录》承续 T2076 宋代《景德传灯录》的灯录传统，但作者、时代、卷数、收录范围及 DILA/CBC 作品入口不同；续修关系不等于同一表达。",
    ["T2076", "T2077"],
  ),
  relation(
    "same_author_companion_works_distinct",
    "qisong-companion-works-t2078-t2080",
    "契嵩传法正宗记、定祖图与宗论伴随著作边界",
    "T2078、T2079、T2080 同属契嵩责任脉络，但分别是九卷史记、一卷祖统图与二卷宗论；相同作者和论证目标只建立伴随著作关系，不能消除体例、范围和三个作品权威号。",
    ["T2078", "T2079", "T2080"],
  ),
  relation(
    "karmic_response_anthologies_source_reuse_distinct",
    "karmic-response-anthologies-t2082-t2084",
    "冥报、释门自镜与三宝感应录材料复用边界",
    "T2082–T2084 都汇集因果、冥报或三宝感应故事，可能复用人物与叙事，但作者、时代、选录原则、题名、卷数及 DILA/CBC 作品入口不同；共享故事不触发作品合并。",
    ["T2082", "T2083", "T2084"],
  ),
  relation(
    "travel_geography_and_dunhuang_records_scope_distinct",
    "travel-geography-records-t2085-t2091",
    "西域行记、佛国方志、法灭记录与敦煌录范围边界",
    "T2085–T2091 横跨个人求法记、使西域记、十二卷地理志、释迦方志、游方抄、像法灭尽记录与敦煌录。共同地理或敦煌保存语境不能越过责任、文类、范围及 7 个独立权威作品入口。",
    ["T2085", "T2086", "T2087", "T2088", "T2089", "T2090", "T2091"],
  ),
  relation(
    "temple_records_regional_scope_distinct",
    "temple-records-t2092-t2094",
    "洛阳、长安寺塔与梁京寺院记录地域边界",
    "T2092《洛阳伽蓝记》、T2093《寺塔记》与 T2094《梁京寺记》分别记录不同都城、作者状态、时代和全文范围；寺院地理材料相近不构成同一作品。",
    ["T2092", "T2093", "T2094"],
  ),
  relation(
    "sacred_mountain_gazetteers_regional_scope_distinct",
    "sacred-mountain-gazetteers-t2095-t2101",
    "庐山、天台、南岳、清凉与补陀洛迦山志地域边界",
    "T2095–T2101 分别围绕不同佛教名山或不同清凉山编纂层，作者、年代、地域、卷数和 DILA/CBC 作品入口不同；共同方志体裁不能把七部作品互相替代。",
    ["T2095", "T2096", "T2097", "T2098", "T2099", "T2100", "T2101"],
  ),
  relation(
    "qingliang_gazetteer_series_continuations_distinct",
    "qingliang-gazetteer-series-t2098-t2100",
    "古、广、续清凉传续修边界",
    "T2098《古清凉传》、T2099《广清凉传》与 T2100《续清凉传》形成五台山方志的扩编续修序列，但由唐、宋不同作者编纂，卷数、时代、范围与三个权威作品入口均不同。",
    ["T2098", "T2099", "T2100"],
  ),
];

const authorityIds = {
  T2066: "CA0000686", T2067: "CA0001339", T2068: "CA0000896", T2069: "CA0003240",
  T2070: "CA0003295", T2071: "CA0001854", T2072: "CA0003289", T2073: "CA0001438",
  T2074: "CA0001378", T2075: "CA0002039", T2076: "CA0001818", T2077: "CA0003638",
  T2078: "CA0000513", T2079: "CA0000512", T2080: "CA0000514", T2081: "CA0002060",
  T2082: "CA0002252", T2083: "CA0003138", T2084: "CA0002705", T2085: "CA0000943",
  T2086: "CA0003522", T2087: "CA0000685", T2088: "CA0003113", T2089: "CA0003813",
  T2090: "CA0003118", T2091: "CA0000807", T2092: "CA0002154", T2093: "CA0002767",
  T2094: "CA0002059", T2095: "CA0002126", T2096: "CA0003245", T2097: "CA0002333",
  T2098: "CA0002595", T2099: "CA0002596", T2100: "CA0002597", T2101: "CA0000339",
};
const cbcTextIds = {
  T2066: 32, T2067: 33, T2068: 49, T2069: 46, T2070: 31, T2071: 53, T2072: 37, T2073: 52,
  T2074: 35, T2075: 41, T2076: 64, T2077: 59, T2078: 47, T2079: 34, T2080: 30, T2081: 62,
  T2082: 58, T2083: 48, T2084: 50, T2085: 36, T2086: 60, T2087: 42, T2088: 38, T2089: 51,
  T2090: 43, T2091: 61, T2092: 39, T2093: 57, T2094: 44, T2095: 54, T2096: 56, T2097: 63,
  T2098: 29, T2099: 45, T2100: 55, T2101: 40,
};
if (
  Object.keys(authorityIds).length !== 36 ||
  new Set(Object.values(authorityIds)).size !== 36 ||
  Object.keys(cbcTextIds).length !== 36 ||
  new Set(Object.values(cbcTextIds)).size !== 36
) throw new Error("T51 必须保留 36 个唯一 DILA 作品号与 36 个唯一 CBC 作品入口");

const familyFor = (id) => {
  const number = Number(id.slice(1));
  if (number === 2066) return { code: "pilgrimage-monk-biography", role: "pilgrimage_monk_collective_biography", tradition: "汉传佛教 · 求法高僧传" };
  if (number <= 2068) return { code: "devotional-biography", role: "east_asian_devotional_biography", tradition: "汉传佛教 · 经传与感应史" };
  if (number === 2069) return { code: "sectarian-lineage-biography", role: "east_asian_sectarian_lineage_biography", tradition: "东亚佛教 · 祖师谱系" };
  if (number <= 2072) return { code: "pure-land-rebirth-biography", role: "pure_land_rebirth_anthology", tradition: "汉传佛教 · 净土往生传" };
  if (number <= 2074) return { code: "huayan-devotional-biography", role: "huayan_devotional_biography", tradition: "汉传佛教 · 华严经传与感应" };
  if (number <= 2081) return { code: "dharma-transmission-history", role: "east_asian_dharma_transmission_history", tradition: "东亚佛教 · 灯录与付法史" };
  if (number <= 2084) return { code: "karmic-response-anthology", role: "east_asian_karmic_response_anthology", tradition: "东亚佛教 · 冥报与感应录" };
  if (number <= 2091) return { code: "pilgrimage-geography-record", role: "buddhist_travel_or_geography_record", tradition: "佛教史传 · 西域游记与地理记录" };
  if (number <= 2094) return { code: "temple-gazetteer", role: "east_asian_buddhist_temple_gazetteer", tradition: "东亚佛教 · 寺塔方志" };
  return { code: "sacred-mountain-gazetteer", role: "east_asian_buddhist_sacred_mountain_gazetteer", tradition: "东亚佛教 · 名山方志" };
};
const roleOverrides = {
  T2075: "unattributed_chan_lineage_chronicle",
  T2076: "song_transmission_lamp_base_compilation",
  T2077: "ming_transmission_lamp_continuation",
  T2078: "qisong_transmission_orthodoxy_chronicle",
  T2079: "qisong_transmission_orthodoxy_lineage_diagram",
  T2080: "qisong_transmission_orthodoxy_treatise",
  T2085: "faxian_pilgrimage_record",
  T2086: "unattributed_huisheng_western_regions_record",
  T2087: "xuanzang_bianji_composite_western_regions_record",
  T2089: "huichao_yuanzhao_composite_travel_excerpt",
  T2090: "facheng_translation_dharma_decline_record",
  T2091: "unattributed_dunhuang_record",
  T2094: "unattributed_liang_capital_temple_record",
  T2098: "tang_old_qingliang_gazetteer",
  T2099: "song_expanded_qingliang_gazetteer",
  T2100: "song_continuation_qingliang_gazetteer",
};
const statusOverrides = {
  T2068: "verified_distinct_responsibility_label_conflict",
  T2077: "verified_distinct_continuation_work",
  T2078: "verified_distinct_same_author_companion_work",
  T2079: "verified_distinct_same_author_companion_work",
  T2080: "verified_distinct_same_author_companion_work",
  T2087: "verified_distinct_composite_translation_and_compilation_responsibility",
  T2089: "verified_distinct_composite_authorship_responsibility",
  T2098: "verified_distinct_gazetteer_base_work",
  T2099: "verified_distinct_gazetteer_expansion",
  T2100: "verified_distinct_gazetteer_continuation",
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
  const identity = {
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
      canonRef: `大正藏 T51, no. ${canonId.slice(1)}`,
      translator: author.replace(/\s+/g, " · "),
      summary: `${extent}。完整保存固定 CBETA TEI、校勘与责任题记；作为独立佛教史传、感应传、灯录、游记或方志建模，不标成佛陀逐字亲说。传统责任题记：${author}。`,
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
  ["T2067", "T2068"],
  ["T2070", "T2071"], ["T2070", "T2072"], ["T2071", "T2072"],
  ["T2073", "T2074"],
  ["T2075", "T2076"], ["T2075", "T2077"], ["T2076", "T2077"],
  ["T2078", "T2079"], ["T2078", "T2080"], ["T2079", "T2080"],
  ["T2082", "T2083"], ["T2082", "T2084"], ["T2083", "T2084"],
  ["T2085", "T2087"], ["T2086", "T2087"], ["T2089", "T2091"],
  ["T2092", "T2093"], ["T2092", "T2094"], ["T2093", "T2094"],
  ["T2098", "T2099"], ["T2098", "T2100"], ["T2099", "T2100"],
].map(([left, right]) => compareBodies(left, right));
const comparisonByPair = new Map(comparisonPairs.map((item) => [item.pair.join("/"), item]));
if (
  comparisonByPair.get("T2067/T2068").fiveGramContainmentOfShorter < 0.14 ||
  comparisonByPair.get("T2076/T2077").fiveGramContainmentOfShorter < 0.02 ||
  comparisonByPair.get("T2078/T2079").fiveGramContainmentOfShorter < 0.25
) throw new Error("T51 法华传、灯录续修或契嵩伴随著作正文比较漂移");

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
  rightsCategory: "Individually reviewed CBETA TEI files in Taishō volumes T01–T51; T51 source-record closure",
  workOverrides: {},
  fileOverrides: {},
  collection: {
    id: "CBETA-TAISHO-T51",
    title: "大正藏 T51 求法传、感应传、灯录、游记与佛教方志固定来源记录",
    sourceRecordDenominator: 36,
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
    workCountingDecision: "T51 的 36 份固定来源记录登记为 36 个完整表达和 36 个独立作品。DILA 返回 36 个不同 CA 作品号，CBC 也给出 36 个不同作品入口；法华与往生传、华严感应、灯录续修、契嵩伴随著作、冥报故事、西域行记、寺塔记录与清凉山方志只建立关系，不据主题、作者、续修题名、地域或机器重叠自动合并。",
  },
  boundaryAudit: {
    status: "verified_source_integrity_devotional_lineage_travel_gazetteer_responsibility_continuation_and_source_reuse_boundaries_recorded",
    existingControlledRecords: [],
    verifiedTranslationGroups: [],
    rootVinayaCommentaryGroups: [],
    rootTreatiseCommentaryGroups: [],
    rootEditionBoundaryGroups: [],
    editionOrRecensionGroups: [],
    subcommentaryGroups: [],
    sameNumberBoundaryGroups: [],
    layeredAttributionGroups: ["lotus-devotion-biographies-t2067-t2068", "travel-geography-records-t2085-t2091"],
    scopeBoundaryGroups: [
      "pilgrimage-biographies-t2066-t2085-t2089", "lotus-devotion-biographies-t2067-t2068", "lineage-traditions-t2069-t2075-t2081",
      "pure-land-rebirth-anthologies-t2070-t2072", "huayan-devotion-biographies-t2073-t2074", "transmission-histories-t2075-t2081",
      "karmic-response-anthologies-t2082-t2084", "travel-geography-records-t2085-t2091", "temple-records-t2092-t2094",
      "sacred-mountain-gazetteers-t2095-t2101",
    ],
    continuationBoundaryGroups: ["transmission-lamp-series-t2076-t2077", "qingliang-gazetteer-series-t2098-t2100"],
    sourceReuseBoundaryGroups: [
      "lotus-devotion-biographies-t2067-t2068", "pure-land-rebirth-anthologies-t2070-t2072",
      "huayan-devotion-biographies-t2073-t2074", "karmic-response-anthologies-t2082-t2084",
      "qingliang-gazetteer-series-t2098-t2100",
    ],
    sameAuthorCompanionWorkGroups: ["qisong-companion-works-t2078-t2080"],
    relatedDistinctWorkGroups: relationGroups.map((group) => group.groupId),
    candidateRelationsNotMerged: [
      "T2067/T2068 同为十卷法华史传且五字组包含度约 0.147774，但题名、责任、结构与 DILA/CBC 作品入口不同；T2068 的僧詳/僧祥标签差异并列保留",
      "T2070–T2072 跨时代汇编净土往生故事，最高五字组包含度约 0.032554；史料复用不消除题名、作者状态、范围和三个作品号",
      "T2073/T2074 同属华严信仰史传且包含度约 0.019690，但五卷经传与一卷感应传保持两部作品",
      "T2076/T2077 是灯录本编—续修关系且包含度约 0.026718；T2078/T2079 的记—图包含度约 0.260212，T2078–T2080 仍按契嵩同作者的记、图、论三部伴随著作分立",
      "T2082–T2084 共享冥报与感应故事只记录材料复用，不把三种选录体系合并",
      "T2085–T2091 的个人行记、官方编纂、方志、法灭记录与敦煌抄录文类不同；T2087/T2089 复合责任逐层保存",
      "T2092–T2094 记录不同都城寺院，地域、责任与范围独立",
      "T2098–T2100 构成古、广、续清凉传序列，但三个时代、作者、卷数和作品入口保持分立",
      "T2070、T2075、T2086、T2091、T2094 传统责任题记未署名，不从相邻目录、共享故事或后世研究补造责任者",
    ],
    partialWorkWitnesses: [],
    editionWitnesses: [],
    sourceRoles,
    textualComparison: {
      algorithm: "Unicode text from stable reading lines; punctuation/space removed; unique character 5-gram containment and Jaccard. Overlap records shared stories, continuation, companion works and source reuse; distinct DILA/CBC work entries, title, responsibility, genre and scope prevent automatic work merge.",
      pairs: comparisonPairs,
    },
    authoritySources: [
      "https://github.com/cbeta-org/xml-p5/tree/2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9/T/T51",
      ...Object.values(authorityIds).map((code) => `https://authority.dila.edu.tw/catalog/search.php?code=${code}`),
      ...Object.values(cbcTextIds).map((id) => `https://dazangthings.nz/cbc/text/${id}/`),
    ],
    caveat: "T51 是求法传、信仰感应传、宗派灯录、冥报故事、西域行记、寺塔记与佛教名山方志合集，不是佛陀逐字亲说的单一经藏集合。平台完整保存固定 CBETA TEI、校勘与传统责任题记，同时分离物理记录、作品、表达、续修、伴随著作、复合责任、地域与史料复用；相邻经号、共同宗派、信仰对象、人物、地名、体裁、后世引用或机器相似度都不能单独证明作品相同或责任无争议。",
  },
  files,
};

if (
  files.length !== 36 ||
  batchWorkIds.size !== 36 ||
  batch.collection.newSourceBytes !== 17025589 ||
  batch.collection.newStableSegments !== 96503 ||
  batch.collection.newFolios !== 3518 ||
  batch.collection.newJuans !== 168 ||
  batch.collection.verifiedEditionWitnesses !== 0 ||
  batch.collection.unsignedResponsibilityRecords !== 5 ||
  batch.collection.lostTranslatorResponsibilityRecords !== 0 ||
  batch.collection.relationAnnotatedRecords !== 36 ||
  new Set(batch.boundaryAudit.authoritySources).size !== 73
) throw new Error(`T51 来源、作品、权威、关系或责任计数漂移：${JSON.stringify(batch.collection)}`);

const outputPath = resolve(root, `data/corpus/cbeta/batch-v${version}.json`);
await writeFile(outputPath, `${JSON.stringify(batch, null, 2)}\n`, "utf8");
console.log(`CBETA T51 审计完成：${files.length}/${inventory.totals.records} 个固定来源记录；新增 ${batchWorkIds.size} 个作品与完整表达、${batch.collection.newStableSegments} 个稳定行段、${batch.collection.newFolios} 个版页单元、${batch.collection.newJuans} 卷。`);

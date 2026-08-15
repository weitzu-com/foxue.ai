import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { buildPageNavigation, parseCbetaReadingLines } from "../src/lib/cbeta-tei.mjs";

const root = process.cwd();
const version = "4.14.0";
const expectedCommit = "2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9";
const sourceArgument = process.argv.find((argument) => argument.startsWith("--source-dir="));
if (!sourceArgument) {
  console.error("用法：node scripts/audit-cbeta-t47.mjs --source-dir=/固定提交的/xml-p5");
  process.exit(1);
}
const sourceRoot = resolve(sourceArgument.slice("--source-dir=".length));
const actualCommit = execFileSync("git", ["-C", sourceRoot, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (actualCommit !== expectedCommit) throw new Error(`上游工作树必须固定到 ${expectedCommit}`);

const inventoryPath = "data/gbcr/cbeta-taisho-t47-inventory-v0.1.0.json";
const inventory = JSON.parse(await readFile(resolve(root, inventoryPath), "utf8"));
const baseCatalogPath = "data/corpus/cbeta/catalog-v4.13.0.json";
const baseCatalog = JSON.parse(await readFile(resolve(root, baseCatalogPath), "utf8"));
const sourceUnits = (file) => file.sourceParts ?? [file];
const controlledPaths = new Set(baseCatalog.files.flatMap(sourceUnits).map((file) => file.upstreamPath));
const candidates = inventory.records.filter((record) => !controlledPaths.has(record.upstreamPath));
if (inventory.totals.records !== 49 || inventory.totals.upstreamBytes !== 11178014 || candidates.length !== 49) {
  throw new Error(`T47 固定来源分母或新增记录漂移：${inventory.totals.records}/${candidates.length}`);
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
    "pure_land_doctrinal_compiled_works_scope_distinct",
    "pure-land-doctrinal-and-compiled-works-t1957-t1977",
    "净土论著、问答与文类汇编范围边界",
    "T1957–T1977 横跨论义、集论、疑难问答、念佛法门与文类汇编。DILA 为每份记录分配不同作品权威号；共同净土主题、祖师传承或引文不能消除独立题名、责任、结构与全文边界。",
    ["T1957", "T1958", "T1959", "T1960", "T1961", "T1962", "T1963", "T1964", "T1965", "T1966", "T1967", "T1968", "T1969A", "T1969B", "T1970", "T1971", "T1972", "T1973", "T1974", "T1975", "T1976", "T1977"],
  ),
  relation(
    "same_traditional_author_pure_land_works_scope_distinct",
    "tanluan-pure-land-works-t1957-t1978",
    "曇鸾净土论义与赞偈作品边界",
    "T1957 与 T1978 均传统题署曇鸾，却分别是论义与赞偈，DILA 权威号、题名、体例和全文范围均不同。",
    ["T1957", "T1978"],
  ),
  relation(
    "same_traditional_author_pure_land_methods_distinct",
    "zhiyi-pure-land-works-t1961-t1962",
    "智顗传统题署净土著述边界",
    "T1961、T1962 的 TEI 分别题署智顗说与智顗撰。平台忠实保存传统责任题记而不把题署升级为现代归属定论；两个 DILA 权威号和独立全文仍构成两部作品。",
    ["T1961", "T1962"],
  ),
  relation(
    "same_number_compiled_pure_land_works_distinct",
    "le-bang-compilations-t1969a-t1969b",
    "《乐邦文类》与《乐邦遗稿》同数字经号边界",
    "T1969A、T1969B 均题署宗晓编并共享数字经号 1969，但 DILA 分配 CA0001936、CA0001937 两个作品号；题名、规模、结构与全文不同，登记为相关而独立的汇编。",
    ["T1969A", "T1969B"],
  ),
  relation(
    "pure_land_hymn_ritual_liturgy_works_related_distinct",
    "pure-land-hymns-and-rituals-t1978-t1984",
    "净土赞偈、法事赞、礼忏与念佛仪轨边界",
    "T1978–T1984 共享净土礼赞与行仪语汇，但责任、用途、结构、篇幅和 DILA 权威号均不同。共同尊格、愿生目标或仪式功能不证明作品相同。",
    ["T1978", "T1979", "T1980", "T1981", "T1982", "T1983", "T1984"],
  ),
  relation(
    "same_traditional_author_doctrine_and_liturgies_distinct",
    "shandao-pure-land-works-t1959-t1979-t1981",
    "善导集记与撰述净土法门、法事赞边界",
    "T1959、T1979、T1980、T1981 均与善导传统责任相关，却分别处理观念法门、转经法事、往生礼赞与般舟行道；不同 DILA 权威号、题名和正文支持四部独立作品。",
    ["T1959", "T1979", "T1980", "T1981"],
  ),
  relation(
    "same_author_pure_land_doctrine_and_ritual_distinct",
    "zunshi-pure-land-works-t1968-t1984",
    "遵式净土论述与忏愿仪边界",
    "T1968、T1984 均题署遵式撰，但一为决疑行愿论述，一为忏愿仪；DILA 权威号、文类与全文范围不同。",
    ["T1968", "T1984"],
  ),
  relation(
    "chan_master_recorded_sayings_collections_distinct",
    "chan-recorded-sayings-t1985-t2000",
    "禅宗诸师语录与宗门汇编作品边界",
    "T1985–T2000 记录不同禅师、门庭和后世编校层。师承、宗派、语录体例或公案复用只建立检索关系；DILA 权威号、所记宗师、编者、结构和全文范围共同维持作品边界。",
    ["T1985", "T1986A", "T1986B", "T1987A", "T1987B", "T1988", "T1989", "T1990", "T1991", "T1992", "T1993", "T1994A", "T1994B", "T1995", "T1996", "T1997", "T1998A", "T1998B", "T1999", "T2000"],
  ),
  relation(
    "same_number_same_master_recorded_sayings_distinct",
    "dongshan-records-t1986a-t1986b",
    "两部洞山禅师语录的同数字经号与高重叠边界",
    "T1986A、T1986B 均围绕洞山良价，五字组较短一方包含度约 0.459652；但题名、编校责任、规模和 DILA 权威号 CA0000788/CA0000787 不同，因此保留为相关而独立的语录作品。",
    ["T1986A", "T1986B"],
  ),
  relation(
    "same_number_same_master_recorded_sayings_distinct",
    "caoshan-records-t1987a-t1987b",
    "两部曹山禅师语录的同数字经号与高重叠边界",
    "T1987A、T1987B 均围绕曹山本寂，五字组较短一方包含度约 0.707505；但题名、编校责任、范围和 DILA 权威号 CA0000368/CA0000367 不同。高重叠记录共同材料，不能自动证明同一作品或同一表达。",
    ["T1987A", "T1987B"],
  ),
  relation(
    "same_number_main_and_later_record_distinct",
    "yangqi-records-t1994a-t1994b",
    "杨岐方会语录与后录边界",
    "T1994A 为具名编者的语录，T1994B 为未署名责任的后录；两者有不同题名、全文和 DILA 权威号 CA0003684/CA0003683，不能因共享数字经号与宗师而合并。",
    ["T1994A", "T1994B"],
  ),
  relation(
    "same_number_same_master_record_and_compendium_distinct",
    "dahui-records-t1998a-t1998b",
    "大慧语录与《宗门武库》边界",
    "T1998A 是大慧普觉禅师语录，T1998B 是道谦编《宗门武库》；两份记录的题名、编者、规模、结构与 DILA 权威号 CA0000601/CA0000602 不同。",
    ["T1998A", "T1998B"],
  ),
];

const authorityIds = {
  T1957: "CA0000091", T1958: "CA0000090", T1959: "CA0001198", T1960: "CA0003133",
  T1961: "CA0001853", T1962: "CA0003471", T1963: "CA0001840", T1964: "CA0003513",
  T1965: "CA0003814", T1966: "CA0002357", T1967: "CA0002361", T1968: "CA0003292",
  T1969A: "CA0001936", T1969B: "CA0001937", T1970: "CA0002114", T1971: "CA0001837",
  T1972: "CA0001833", T1973: "CA0002055", T1974: "CA0000261", T1975: "CA0001846",
  T1976: "CA0003507", T1977: "CA0001856", T1978: "CA0003936", T1979: "CA0003291",
  T1980: "CA0003293", T1981: "CA0000237", T1982: "CA0001509", T1983: "CA0001855",
  T1984: "CA0003290", T1985: "CA0002069", T1986A: "CA0000788", T1986B: "CA0000787",
  T1987A: "CA0000368", T1987B: "CA0000367", T1988: "CA0003919", T1989: "CA0003337",
  T1990: "CA0003685", T1991: "CA0003385", T1992: "CA0001022", T1993: "CA0001482",
  T1994A: "CA0003684", T1994B: "CA0003683", T1995: "CA0000947", T1996: "CA0002261",
  T1997: "CA0003891", T1998A: "CA0000601", T1998B: "CA0000602", T1999: "CA0002199",
  T2000: "CA0003626",
};

const familyFor = (id) => {
  const number = Number(id.match(/\d+/)?.[0]);
  if (number <= 1977) return { code: "pure-land-doctrine", role: "pure_land_doctrinal_or_compiled_work", tradition: "汉传佛教 · 净土论著与文类汇编" };
  if (number <= 1984) return { code: "pure-land-liturgy", role: "pure_land_hymn_ritual_or_liturgy", tradition: "汉传佛教 · 净土礼赞与行仪" };
  return { code: "chan-recorded-sayings", role: "chan_recorded_sayings_or_compiled_record", tradition: "汉传佛教 · 禅宗语录与宗门汇编" };
};
const roleOverrides = {
  T1969A: "pure_land_compiled_literary_collection",
  T1969B: "pure_land_compiled_supplementary_collection",
  T1973: "pure_land_historical_doctrinal_compendium",
  T1978: "pure_land_hymn",
  T1979: "pure_land_processional_service_hymn",
  T1980: "pure_land_rebirth_liturgy",
  T1981: "pure_land_pratyutpanna_practice_hymn",
  T1982: "compiled_buddhist_repentance_ritual",
  T1983: "pure_land_five_tone_recitation_liturgy",
  T1984: "pure_land_repentance_and_vow_ritual",
  T1986A: "chan_same_master_recorded_sayings_a",
  T1986B: "chan_same_master_recorded_sayings_b",
  T1987A: "chan_same_master_recorded_sayings_a",
  T1987B: "chan_same_master_recorded_sayings_b",
  T1994A: "chan_main_recorded_sayings",
  T1994B: "unsigned_chan_later_record",
  T1998A: "chan_extended_recorded_sayings",
  T1998B: "chan_compiled_cases_collection",
};
const statusOverrides = {
  T1969A: "verified_distinct_compiled_collection",
  T1969B: "verified_distinct_related_compiled_collection",
  T1986A: "verified_distinct_related_same_master_record",
  T1986B: "verified_distinct_related_same_master_record",
  T1987A: "verified_distinct_related_same_master_record",
  T1987B: "verified_distinct_related_same_master_record",
  T1994A: "verified_distinct_main_recorded_sayings",
  T1994B: "verified_distinct_unsigned_later_record",
  T1998A: "verified_distinct_extended_recorded_sayings",
  T1998B: "verified_distinct_compiled_cases_collection",
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
  const author = stripXml(text.match(/<author>([\s\S]*?)<\/author>/)?.[1] ?? "") || "传统责任题记未署名";
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
  files.push({
    id: canonId,
    slug: `taisho-${canonId.toLowerCase()}`,
    workId: `gbcr:work:taisho-${canonId.toLowerCase()}-${family.code}`,
    workIdentityStatus: statusOverrides[canonId] ?? "verified_distinct_east_asian_authored_or_compiled_work",
    workTitle: title,
    sourceRole: roleOverrides[canonId] ?? family.role,
    bibliographicRelations: relations,
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
      canonRef: `大正藏 T47, no. ${canonId.slice(1)}`,
      translator: author.replace(/\s+/g, " · "),
      summary: `${extent}。完整保存固定 CBETA TEI、校勘与责任题记；作为独立东亚佛教著述或汇编建模，不标成佛陀逐字亲说。传统责任题记：${author}。`,
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
  ["T1957", "T1978"], ["T1961", "T1962"], ["T1968", "T1984"], ["T1969A", "T1969B"],
  ["T1959", "T1979"], ["T1959", "T1980"], ["T1959", "T1981"],
  ["T1979", "T1980"], ["T1979", "T1981"], ["T1980", "T1981"],
  ["T1986A", "T1986B"], ["T1987A", "T1987B"], ["T1994A", "T1994B"], ["T1998A", "T1998B"],
].map(([left, right]) => compareBodies(left, right));
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
  rightsCategory: "Individually reviewed CBETA TEI files in Taishō volumes T01–T47; T47 source-record closure",
  workOverrides: {},
  fileOverrides: {},
  collection: {
    id: "CBETA-TAISHO-T47",
    title: "大正藏 T47 净土论著、礼赞仪轨与禅宗语录固定来源记录",
    sourceRecordDenominator: 49,
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
    newWorks: batchWorkIds.size,
    controlledWorks: batchWorkIds.size,
    workCountingDecision: "T47 的 49 份来源记录登记为 49 个完整表达和 49 个独立东亚著述或汇编作品。DILA 为每份记录分配不同作品权威号；五组 A/B 同数字经号、同一宗师语录、同作者异作、礼赞仪轨复用与机器文本重叠均保持相关而独立。没有仅凭题名、作者、宗派、宗师、仪式功能、引文或文本重叠执行作品合并。",
  },
  boundaryAudit: {
    status: "verified_source_integrity_pure_land_doctrine_liturgy_same_author_same_number_chan_master_record_and_unsigned_boundaries_recorded",
    existingControlledRecords: [],
    verifiedTranslationGroups: [],
    rootVinayaCommentaryGroups: [],
    rootTreatiseCommentaryGroups: [],
    rootEditionBoundaryGroups: [],
    subcommentaryGroups: [],
    sameNumberBoundaryGroups: ["le-bang-compilations-t1969a-t1969b", "dongshan-records-t1986a-t1986b", "caoshan-records-t1987a-t1987b", "yangqi-records-t1994a-t1994b", "dahui-records-t1998a-t1998b"],
    layeredAttributionGroups: ["tanluan-pure-land-works-t1957-t1978", "zhiyi-pure-land-works-t1961-t1962", "shandao-pure-land-works-t1959-t1979-t1981", "zunshi-pure-land-works-t1968-t1984"],
    scopeBoundaryGroups: ["pure-land-doctrinal-and-compiled-works-t1957-t1977", "pure-land-hymns-and-rituals-t1978-t1984", "chan-recorded-sayings-t1985-t2000"],
    relatedDistinctWorkGroups: relationGroups.map((group) => group.groupId),
    candidateRelationsNotMerged: [
      "T1969A/B、T1986A/B、T1987A/B、T1994A/B、T1998A/B 共享数字经号或宗师脉络，但均有两个不同 DILA 作品号",
      "T1986A/B 五字组较短一方包含度约 0.459652，T1987A/B 约 0.707505；高重叠只记录共同材料与传承，不证明同一作品或表达",
      "T1957/T1978、T1961/T1962、T1959/T1979–T1981、T1968/T1984 是同一传统责任者下的异作，不因作者相同合并",
      "T1978–T1984 共享净土礼赞、愿生与行仪语汇，但尊格、功能、引文与仪轨相似不能独立证明作品同一",
      "T1994B 的 TEI 责任字段为空，按未署名后录登记，不据宗师、相邻记录或传统推断编者",
      "T1985–T2000 语录共同使用禅宗语汇与公案材料；宗派、师承和文体均只形成关系，不改变作品边界",
    ],
    partialWorkWitnesses: [],
    sourceRoles,
    textualComparison: {
      algorithm: "Unicode text from stable reading lines; punctuation/space removed; unique character 5-gram containment and Jaccard. Overlap records quotation, shared sayings, ritual reuse and compilation dependence only; it cannot merge same-number records, same-master collections, same-author works, liturgies or unsigned supplements.",
      pairs: comparisonPairs,
    },
    authoritySources: [
      "https://github.com/cbeta-org/xml-p5/tree/2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9/T/T47",
      ...Object.values(authorityIds).map((code) => `https://authority.dila.edu.tw/catalog/search.php?code=${code}`),
    ],
    caveat: "T47 是净土论著、礼赞仪轨与禅宗语录集合，不是佛陀逐字亲说的单一经藏集合。平台完整保存固定 CBETA TEI 与校勘注记，同时区分同作者异作、同数字 A/B 记录、同一宗师的不同语录编校层、仪轨复用、汇编责任和未署名后录；共同宗派、题名、作者、宗师、仪式功能、引文或机器相似度都不能单独证明作品相同、作者无争议或佛陀逐字亲说。",
  },
  files,
};

const outputPath = resolve(root, `data/corpus/cbeta/batch-v${version}.json`);
await writeFile(outputPath, `${JSON.stringify(batch, null, 2)}\n`, "utf8");
console.log(`CBETA T47 审计完成：${files.length}/${inventory.totals.records} 个固定来源记录；新增 ${batchWorkIds.size} 个作品、${files.length} 个表达、${batch.collection.newStableSegments} 个稳定行段、${batch.collection.newFolios} 个版页单元、${batch.collection.newJuans} 卷。`);

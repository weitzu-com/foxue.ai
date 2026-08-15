import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { buildPageNavigation, parseCbetaReadingLines } from "../src/lib/cbeta-tei.mjs";

const root = process.cwd();
const version = "4.15.0";
const expectedCommit = "2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9";
const sourceArgument = process.argv.find((argument) => argument.startsWith("--source-dir="));
if (!sourceArgument) {
  console.error("用法：node scripts/audit-cbeta-t48.mjs --source-dir=/固定提交的/xml-p5");
  process.exit(1);
}
const sourceRoot = resolve(sourceArgument.slice("--source-dir=".length));
const actualCommit = execFileSync("git", ["-C", sourceRoot, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (actualCommit !== expectedCommit) throw new Error(`上游工作树必须固定到 ${expectedCommit}`);

const inventoryPath = "data/gbcr/cbeta-taisho-t48-inventory-v0.1.0.json";
const inventory = JSON.parse(await readFile(resolve(root, inventoryPath), "utf8"));
const baseCatalogPath = "data/corpus/cbeta/catalog-v4.14.0.json";
const baseCatalog = JSON.parse(await readFile(resolve(root, baseCatalogPath), "utf8"));
const sourceUnits = (file) => file.sourceParts ?? [file];
const controlledPaths = new Set(baseCatalog.files.flatMap(sourceUnits).map((file) => file.upstreamPath));
const candidates = inventory.records.filter((record) => !controlledPaths.has(record.upstreamPath));
if (inventory.totals.records !== 28 || inventory.totals.upstreamBytes !== 12935999 || candidates.length !== 28) {
  throw new Error(`T48 固定来源分母或新增记录漂移：${inventory.totals.records}/${candidates.length}`);
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
    "chan_master_recorded_sayings_collections_distinct",
    "chan-recorded-sayings-t2001-t2002b",
    "宏智与如净禅师语录作品边界",
    "T2001、T2002A、T2002B 分别记录宏智正觉与如净的不同语录层。DILA 作品号、所记宗师、编者、题名、结构和全文范围均不同；同属曹洞宗或语录体不能自动合并作品。",
    ["T2001", "T2002A", "T2002B"],
  ),
  relation(
    "koan_commentarial_and_lineage_collections_distinct",
    "koan-commentaries-and-lineage-t2003-t2006",
    "公案评唱、无门关与宗派纲目作品边界",
    "T2003–T2005 是不同公案颂古、评唱或关则集合，T2006 则汇集禅门纲宗与宗派眼目。共享公案、宗派语汇或禅师谱系只建立检索关系，不消除四个 DILA 权威号与独立结构。",
    ["T2003", "T2004", "T2005", "T2006"],
  ),
  relation(
    "platform_sutra_related_recensions_distinct",
    "platform-sutra-recensions-t2007-t2008",
    "《坛经》法海集本与宗宝编本传本边界",
    "T2007 与 T2008 属《坛经》相关传本家族，但长短题名、法海集／宗宝编责任、结构、篇幅和 DILA 作品号 CA0002334/CA0002105 不同。五字组较短一方包含度约 0.202299；平台建立传本关系而不在缺少更强作品同一证据时合并。",
    ["T2007", "T2008"],
  ),
  relation(
    "chan_treatises_songs_and_teaching_records_distinct",
    "chan-treatises-songs-t2009-t2015",
    "早期禅宗论说、歌铭与教诫作品边界",
    "T2009–T2015 横跨汇编论门、铭、论、语录、集序与证道歌。传统作者、共同心性论题或歌偈体不能替代 DILA 权威号、责任题记和全文边界。",
    ["T2009", "T2010", "T2011", "T2012A", "T2012B", "T2013", "T2014", "T2015"],
  ),
  relation(
    "chan_doctrinal_compendia_and_cultivation_works_distinct",
    "chan-compendia-cultivation-t2016-t2021",
    "宗镜、万善、唯心与高丽修心论著边界",
    "T2016–T2021 由百卷宗镜汇编、同作者异作、知讷修心论著与元代决疑集组成。共同唯心、修心或禅净语汇以及引文复用不能把不同作者、题名、规模和权威号合并。",
    ["T2016", "T2017", "T2018", "T2019A", "T2019B", "T2020", "T2021"],
  ),
  relation(
    "chan_monastic_admonitions_training_and_rules_distinct",
    "chan-monastic-admonitions-rules-t2022-t2025",
    "丛林宝训、缁门警训、禅关策进与百丈清规边界",
    "T2022–T2024 是不同编集责任与范围的训诫、警策或参禅材料，T2025 是制度性清规。共同丛林使用场景、引文或修行功能不构成作品同一。",
    ["T2022", "T2023", "T2024", "T2025"],
  ),
  relation(
    "same_number_same_master_recorded_sayings_distinct",
    "rujing-records-t2002a-t2002b",
    "如净语录与续语录同数字经号边界",
    "T2002A、T2002B 均围绕如净并共享数字经号 2002，但分别由文素与义远编，题名、范围和 DILA 权威号 CA0002651/CA0003257 不同；五字组包含度约 0.012523。",
    ["T2002A", "T2002B"],
  ),
  relation(
    "same_number_same_compiler_teaching_records_distinct",
    "huangbo-records-t2012a-t2012b",
    "黄檗《传心法要》与《宛陵录》同数字经号边界",
    "T2012A、T2012B 均题署裴休集并共享数字经号 2012，却具有不同题名、说法场景、全文和 DILA 权威号 CA0000802/CA0003282；五字组包含度约 0.024504。",
    ["T2012A", "T2012B"],
  ),
  relation(
    "same_number_same_author_korean_chan_works_distinct",
    "jinul-works-t2019a-t2019b",
    "知讷《真心直说》与《诫初心学人文》同数字经号边界",
    "T2019A、T2019B 均传统题署高丽知讷并共享数字经号 2019，但文类、题名、全文和 DILA 权威号 CA0004050/CA0001595 不同；五字组包含度约 0.001484。",
    ["T2019A", "T2019B"],
  ),
  relation(
    "same_traditional_author_chan_works_scope_distinct",
    "yongjia-works-t2013-t2014",
    "永嘉玄觉集与证道歌作品边界",
    "T2013 与 T2014 均传统题署玄觉，却分别是禅宗集与证道歌，DILA 权威号、文类和正文不同；五字组包含度约 0.004596。",
    ["T2013", "T2014"],
  ),
  relation(
    "same_author_yanshou_compendia_and_treatises_distinct",
    "yanshou-works-t2016-t2018",
    "延寿《宗镜录》《万善同归集》《唯心诀》作品边界",
    "T2016–T2018 均与延寿责任相关，但百卷汇编、三卷论集与一卷唯心诀的题名、规模、结构和 DILA 权威号各异。T2016/T2018 五字组包含度约 0.198994，只证明材料与思想关联。",
    ["T2016", "T2017", "T2018"],
  ),
  relation(
    "same_author_jinul_cultivation_works_distinct",
    "jinul-works-t2019a-t2020",
    "知讷三部修心著述边界",
    "T2019A、T2019B、T2020 均传统题署知讷，但题名、文类、对象、全文与三个 DILA 权威号不同；文本五字组包含度均低于 0.008。",
    ["T2019A", "T2019B", "T2020"],
  ),
];

const authorityIds = {
  T2001: "CA0001335", T2002A: "CA0002651", T2002B: "CA0003257", T2003: "CA0000310",
  T2004: "CA0003286", T2005: "CA0000421", T2006: "CA0002623", T2007: "CA0002334",
  T2008: "CA0002105", T2009: "CA0002920", T2010: "CA0003593", T2011: "CA0003984",
  T2012A: "CA0000802", T2012B: "CA0003282", T2013: "CA0000422", T2014: "CA0003798",
  T2015: "CA0000414", T2016: "CA0003965", T2017: "CA0003287", T2018: "CA0003803",
  T2019A: "CA0004050", T2019B: "CA0001595", T2020: "CA0003611", T2021: "CA0000419",
  T2022: "CA0000389", T2023: "CA0003950", T2024: "CA0000387", T2025: "CA0000161",
};
if (Object.keys(authorityIds).length !== 28 || new Set(Object.values(authorityIds)).size !== 28) {
  throw new Error("T48 DILA 作品权威号必须为 28 个且互不重复");
}

const familyFor = (id) => {
  const number = Number(id.match(/\d+/)?.[0]);
  if (number <= 2002) return { code: "chan-recorded-sayings", role: "chan_recorded_sayings", tradition: "汉传佛教 · 禅宗语录" };
  if (number <= 2006) return { code: "chan-koan-lineage", role: "chan_koan_commentary_or_lineage_collection", tradition: "汉传佛教 · 公案评唱与宗派纲目" };
  if (number <= 2008) return { code: "platform-sutra-recension", role: "platform_sutra_related_recension", tradition: "汉传佛教 · 《坛经》相关传本" };
  if (number <= 2015) return { code: "chan-treatise-song", role: "chan_treatise_song_or_teaching_record", tradition: "汉传佛教 · 禅宗论说与歌铭" };
  if (number <= 2021) return { code: "chan-doctrine-cultivation", role: "chan_doctrinal_compendium_or_cultivation_work", tradition: "汉传佛教 · 禅宗宗论与修心著述" };
  return { code: "chan-monastic-training-rules", role: "chan_monastic_admonition_training_or_rule", tradition: "汉传佛教 · 丛林训诫与清规" };
};
const roleOverrides = {
  T2002A: "chan_same_master_recorded_sayings_main",
  T2002B: "chan_same_master_recorded_sayings_continuation",
  T2003: "chan_koan_verse_and_commentary_collection",
  T2004: "chan_koan_verse_and_commentary_collection",
  T2005: "chan_koan_case_collection",
  T2006: "chan_lineage_and_school_classification_compendium",
  T2007: "platform_sutra_fahai_compiled_recension",
  T2008: "platform_sutra_zongbao_compiled_recension",
  T2009: "unsigned_chan_treatise_collection",
  T2012A: "chan_same_compiler_teaching_record_a",
  T2012B: "chan_same_compiler_teaching_record_b",
  T2016: "large_chan_doctrinal_mirror_compendium",
  T2019A: "korean_chan_same_author_treatise_a",
  T2019B: "korean_chan_same_author_admonition_b",
  T2020: "korean_chan_same_author_cultivation_treatise",
  T2025: "chan_monastic_regulations",
};
const statusOverrides = {
  T2002A: "verified_distinct_related_same_master_record",
  T2002B: "verified_distinct_related_same_master_record",
  T2007: "verified_distinct_related_platform_sutra_recension",
  T2008: "verified_distinct_related_platform_sutra_recension",
  T2009: "verified_distinct_unsigned_compiled_treatise_collection",
  T2012A: "verified_distinct_related_same_compiler_record",
  T2012B: "verified_distinct_related_same_compiler_record",
  T2019A: "verified_distinct_related_same_author_work",
  T2019B: "verified_distinct_related_same_author_work",
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
      canonRef: `大正藏 T48, no. ${canonId.slice(1)}`,
      translator: author.replace(/\s+/g, " · "),
      summary: `${extent}。完整保存固定 CBETA TEI、校勘与责任题记；作为独立东亚佛教著述、传本或汇编建模，不标成佛陀逐字亲说。传统责任题记：${author}。`,
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
  ["T2002A", "T2002B"], ["T2003", "T2004"], ["T2003", "T2005"], ["T2004", "T2005"],
  ["T2007", "T2008"], ["T2009", "T2010"], ["T2012A", "T2012B"], ["T2013", "T2014"],
  ["T2016", "T2017"], ["T2016", "T2018"], ["T2017", "T2018"],
  ["T2019A", "T2019B"], ["T2019A", "T2020"], ["T2019B", "T2020"],
  ["T2022", "T2023"], ["T2022", "T2024"], ["T2023", "T2024"], ["T2023", "T2025"],
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
  rightsCategory: "Individually reviewed CBETA TEI files in Taishō volumes T01–T48; T48 source-record closure",
  workOverrides: {},
  fileOverrides: {},
  collection: {
    id: "CBETA-TAISHO-T48",
    title: "大正藏 T48 禅宗语录、公案评唱、宗论警策与清规固定来源记录",
    sourceRecordDenominator: 28,
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
    workCountingDecision: "T48 的 28 份来源记录登记为 28 个完整表达和 28 个独立东亚著述、传本或汇编作品。DILA 为每份记录分配不同作品权威号；三组 A/B 同数字经号、《坛经》相关传本、同作者异作、公案与训诫材料复用均保持相关而独立。没有仅凭题名、作者、宗师、文类、传本家族、引文或文本重叠执行作品合并。",
  },
  boundaryAudit: {
    status: "verified_source_integrity_chan_records_koans_platform_sutra_treatises_same_author_same_number_unsigned_and_monastic_rules_boundaries_recorded",
    existingControlledRecords: [],
    verifiedTranslationGroups: [],
    rootVinayaCommentaryGroups: [],
    rootTreatiseCommentaryGroups: [],
    rootEditionBoundaryGroups: [],
    subcommentaryGroups: [],
    sameNumberBoundaryGroups: ["rujing-records-t2002a-t2002b", "huangbo-records-t2012a-t2012b", "jinul-works-t2019a-t2019b"],
    layeredAttributionGroups: ["yongjia-works-t2013-t2014", "yanshou-works-t2016-t2018", "jinul-works-t2019a-t2020"],
    scopeBoundaryGroups: ["chan-recorded-sayings-t2001-t2002b", "koan-commentaries-and-lineage-t2003-t2006", "platform-sutra-recensions-t2007-t2008", "chan-treatises-songs-t2009-t2015", "chan-compendia-cultivation-t2016-t2021", "chan-monastic-admonitions-rules-t2022-t2025"],
    relatedDistinctWorkGroups: relationGroups.map((group) => group.groupId),
    candidateRelationsNotMerged: [
      "T2002A/B、T2012A/B、T2019A/B 共享数字经号，但每份记录均有不同 DILA 作品号、题名与全文范围",
      "T2007/T2008 同属《坛经》相关传本家族，五字组包含度约 0.202299；法海集与宗宝编责任、结构和权威号不同，当前建立关系但不无证据合并",
      "T2013/T2014、T2016–T2018、T2019A/B/T2020 是同一传统责任者下的异作，不因作者相同合并",
      "T2016/T2018 五字组较短一方包含度约 0.198994，只记录延寿著述间的材料与思想关联",
      "T2003–T2005 共享公案与颂古传统，T2022–T2025 共享丛林训练场景；文类、功能与引文均不改变作品边界",
      "T2009 的 TEI 责任字段为空，按未署名禅宗论门汇编登记，不据传统归属、题名或相邻记录推断作者",
    ],
    partialWorkWitnesses: [],
    sourceRoles,
    textualComparison: {
      algorithm: "Unicode text from stable reading lines; punctuation/space removed; unique character 5-gram containment and Jaccard. Overlap records shared sayings, koans, quotations, recension relationships and compilation dependence only; it cannot merge same-number records, related recensions, same-author works, admonitions or unsigned collections.",
      pairs: comparisonPairs,
    },
    authoritySources: [
      "https://github.com/cbeta-org/xml-p5/tree/2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9/T/T48",
      ...Object.values(authorityIds).map((code) => `https://authority.dila.edu.tw/catalog/search.php?code=${code}`),
    ],
    caveat: "T48 是禅宗语录、公案评唱、《坛经》相关传本、宗论警策与清规集合，不是佛陀逐字亲说的单一经藏集合。平台完整保存固定 CBETA TEI 与校勘注记，同时区分同数字 A/B 记录、相关传本、同作者异作、公案材料复用、汇编责任、传统归属与未署名记录；共同宗派、题名、作者、宗师、修行功能、引文或机器相似度都不能单独证明作品相同、作者无争议或佛陀逐字亲说。",
  },
  files,
};

if (files.length !== 28 || batchWorkIds.size !== 28 || batch.collection.unsignedResponsibilityRecords !== 1) {
  throw new Error("T48 文件、作品或未署名责任计数漂移");
}
if (new Set(batch.boundaryAudit.authoritySources).size !== 29) {
  throw new Error("T48 CBETA 与 28 个 DILA 权威来源必须完整且唯一");
}

const outputPath = resolve(root, `data/corpus/cbeta/batch-v${version}.json`);
await writeFile(outputPath, `${JSON.stringify(batch, null, 2)}\n`, "utf8");
console.log(`CBETA T48 审计完成：${files.length}/${inventory.totals.records} 个固定来源记录；新增 ${batchWorkIds.size} 个作品、${files.length} 个表达、${batch.collection.newStableSegments} 个稳定行段、${batch.collection.newFolios} 个版页单元、${batch.collection.newJuans} 卷。`);

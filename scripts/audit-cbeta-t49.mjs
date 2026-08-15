import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { buildPageNavigation, parseCbetaReadingLines } from "../src/lib/cbeta-tei.mjs";

const root = process.cwd();
const version = "4.16.0";
const expectedCommit = "2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9";
const sourceArgument = process.argv.find((argument) => argument.startsWith("--source-dir="));
if (!sourceArgument) {
  console.error("用法：node scripts/audit-cbeta-t49.mjs --source-dir=/固定提交的/xml-p5");
  process.exit(1);
}
const sourceRoot = resolve(sourceArgument.slice("--source-dir=".length));
const actualCommit = execFileSync("git", ["-C", sourceRoot, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (actualCommit !== expectedCommit) throw new Error(`上游工作树必须固定到 ${expectedCommit}`);

const inventoryPath = "data/gbcr/cbeta-taisho-t49-inventory-v0.1.0.json";
const inventory = JSON.parse(await readFile(resolve(root, inventoryPath), "utf8"));
const baseCatalogPath = "data/corpus/cbeta/catalog-v4.15.0.json";
const baseCatalog = JSON.parse(await readFile(resolve(root, baseCatalogPath), "utf8"));
const sourceUnits = (file) => file.sourceParts ?? [file];
const controlledPaths = new Set(baseCatalog.files.flatMap(sourceUnits).map((file) => file.upstreamPath));
const candidates = inventory.records.filter((record) => !controlledPaths.has(record.upstreamPath));
if (inventory.totals.records !== 14 || inventory.totals.upstreamBytes !== 13132361 || candidates.length !== 14) {
  throw new Error(`T49 固定来源分母或新增记录漂移：${inventory.totals.records}/${candidates.length}`);
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
    "council_dharma_duration_and_decline_records_distinct",
    "council-dharma-duration-decline-t2026-t2030",
    "结集、法住与法灭记录作品边界",
    "T2026–T2030 分别叙述三藏结集、迦叶结经、未来变乱、法灭偈与罗汉法住。五份记录的题名、叙事对象、责任题记、结构与 DILA 作品号均不同；共同讨论佛灭后传承不能证明作品相同。",
    ["T2026", "T2027", "T2028", "T2029", "T2030"],
  ),
  relation(
    "sectarian_buddhist_treatises_scope_distinct",
    "sectarian-treatises-t2031-t2033",
    "三部部派论书来源记录边界",
    "T2031《异部宗轮论》、T2032《十八部论》与 T2033《部执异论》关系密切，但题名、传统责任、译者、全文和 DILA 作品号 CA0003759/CA0003028/CA0000343 不同。在缺少独立作品级裁决前保持三个作品与三个完整表达。",
    ["T2031", "T2032", "T2033"],
  ),
  relation(
    "east_asian_buddhist_histories_scope_distinct",
    "east-asian-buddhist-histories-t2034-t2039",
    "中韩佛教通史、编年史与史传杂录边界",
    "T2034–T2039 横跨隋、宋、元、明中国佛教史传与高丽史传杂录。共同年代、人物、谱系、史料和编年体例只形成检索关系；六个 DILA 权威号、题名、地域、编者与全文范围保持独立。",
    ["T2034", "T2035", "T2036", "T2037", "T2038", "T2039"],
  ),
  relation(
    "related_sectarian_treatises_not_merged",
    "sectarian-related-texts-t2031-t2033",
    "部派论书相近传本或译本关系",
    "T2031/T2032、T2031/T2033、T2032/T2033 的五字组较短一方包含度分别约 0.015878、0.053791、0.022336。低至有限的文字重叠与传统归属只能证明关系，不能单独裁定同一根本作品或可互换译本。",
    ["T2031", "T2032", "T2033"],
  ),
  relation(
    "historiographic_source_reuse_without_work_merge",
    "historiographic-reuse-t2034-t2038",
    "佛教史书史料复用与编纂依赖边界",
    "T2034–T2038 共享人物、年代、谱系与既有史料。五字组中 T2036/T2037 较短一方包含度约 0.106599，T2035/T2036 约 0.043773；这些数值记录史料复用与编纂依赖，不消除题名、时代、编者、范围和作品权威号差异。",
    ["T2034", "T2035", "T2036", "T2037", "T2038"],
  ),
  relation(
    "historical_compilation_and_continuation_distinct",
    "shishi-jigu-and-continuation-t2037-t2038",
    "《释氏稽古略》与《释鉴稽古略续集》本编—续集边界",
    "T2038 明示为续集，但由明代幻轮编，T2037 由元代觉岸编；题名、编者、时代、卷数、内容范围和 DILA 作品号 CA0003154/CA0003128 均不同。五字组包含度约 0.006027，因此建立续修关系而保持两个作品。",
    ["T2037", "T2038"],
  ),
  relation(
    "catalog_responsibility_labels_preserved",
    "samguk-yusa-responsibility-t2039",
    "《三国遗事》撰者与目录责任标签边界",
    "T2039 的 CBETA TEI 题署为‘高丽 一然撰’，DILA 当前检索页把一然标作 translator。平台把两项都作为来源证据保存，以 TEI 题记呈现责任，不把目录标签差异静默改写成确定作者或译者裁决。",
    ["T2039"],
  ),
];

const authorityIds = {
  T2026: "CA0004162", T2027: "CA0001530", T2028: "CA0001527", T2029: "CA0001080",
  T2030: "CA0000957", T2031: "CA0003759", T2032: "CA0003028", T2033: "CA0000343",
  T2034: "CA0002040", T2035: "CA0001102", T2036: "CA0001101", T2037: "CA0003154",
  T2038: "CA0003128", T2039: "CA0002713",
};
if (Object.keys(authorityIds).length !== 14 || new Set(Object.values(authorityIds)).size !== 14) {
  throw new Error("T49 DILA 作品权威号必须为 14 个且互不重复");
}

const familyFor = (id) => {
  const number = Number(id.match(/\d+/)?.[0]);
  if (number <= 2030) return { code: "early-buddhist-transmission-record", role: "council_dharma_duration_or_decline_record", tradition: "汉传佛教 · 结集与法住法灭传承" };
  if (number <= 2033) return { code: "sectarian-buddhist-treatise", role: "sectarian_buddhist_treatise_or_related_recension", tradition: "部派佛教 · 部派论书" };
  if (number <= 2038) return { code: "chinese-buddhist-historiography", role: "chinese_buddhist_historical_chronicle", tradition: "汉传佛教 · 佛教史传" };
  return { code: "korean-buddhist-historical-compilation", role: "korean_buddhist_historical_compilation", tradition: "高丽佛教 · 史传杂录" };
};
const roleOverrides = {
  T2026: "lost_translator_tripitaka_compilation_legend",
  T2027: "translated_kasyapa_council_record",
  T2028: "lost_translator_future_dharma_change_record",
  T2029: "lost_translator_dharma_extinction_verses",
  T2030: "translated_arhat_dharma_duration_record",
  T2031: "xuanzang_translation_sectarian_treatise",
  T2032: "paramartha_translation_eighteen_schools_treatise",
  T2033: "paramartha_translation_related_sectarian_treatise",
  T2034: "buddhist_bibliographic_historical_chronicle",
  T2035: "buddhist_patriarchal_chronicle",
  T2036: "buddhist_universal_historical_chronicle",
  T2037: "buddhist_historical_compendium",
  T2038: "buddhist_historical_compendium_continuation",
  T2039: "korean_historical_mythic_compilation",
};
const statusOverrides = {
  T2031: "verified_distinct_related_sectarian_treatise",
  T2032: "verified_distinct_related_sectarian_treatise",
  T2033: "verified_distinct_related_sectarian_treatise",
  T2037: "verified_distinct_historical_base_compilation",
  T2038: "verified_distinct_historical_continuation",
  T2039: "verified_distinct_korean_history_with_responsibility_boundary",
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
    workIdentityStatus: statusOverrides[canonId] ?? "verified_distinct_canonical_buddhist_work",
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
      canonRef: `大正藏 T49, no. ${canonId.slice(1)}`,
      translator: author.replace(/\s+/g, " · "),
      summary: `${extent}。完整保存固定 CBETA TEI、校勘与责任题记；作为独立佛教作品、译本或史传汇编建模，不标成佛陀逐字亲说。传统责任题记：${author}。`,
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
  ["T2026", "T2027"], ["T2026", "T2028"], ["T2026", "T2029"], ["T2028", "T2029"],
  ["T2031", "T2032"], ["T2031", "T2033"], ["T2032", "T2033"],
  ["T2034", "T2035"], ["T2034", "T2036"], ["T2034", "T2037"],
  ["T2035", "T2036"], ["T2035", "T2037"], ["T2035", "T2038"],
  ["T2036", "T2037"], ["T2036", "T2038"], ["T2037", "T2038"],
  ["T2035", "T2039"], ["T2036", "T2039"], ["T2037", "T2039"],
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
  rightsCategory: "Individually reviewed CBETA TEI files in Taishō volumes T01–T49; T49 source-record closure",
  workOverrides: {},
  fileOverrides: {},
  collection: {
    id: "CBETA-TAISHO-T49",
    title: "大正藏 T49 结集、法灭、部派论书与佛教史传固定来源记录",
    sourceRecordDenominator: 14,
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
    workCountingDecision: "T49 的 14 份来源记录登记为 14 个完整表达和 14 个独立作品、译本或史传汇编。DILA 为每份记录分配不同作品权威号；三部部派论书保持相关而独立，五部中国史书的史料复用不构成作品同一，《释氏稽古略》与续集分立，《三国遗事》的 TEI 与目录责任标签并列保存。没有仅凭题名、主题、译者、编者、编年结构、引文或文本重叠执行作品合并。",
  },
  boundaryAudit: {
    status: "verified_source_integrity_council_decline_sectarian_treatises_histories_continuation_and_responsibility_boundaries_recorded",
    existingControlledRecords: [],
    verifiedTranslationGroups: [],
    rootVinayaCommentaryGroups: [],
    rootTreatiseCommentaryGroups: [],
    rootEditionBoundaryGroups: [],
    subcommentaryGroups: [],
    sameNumberBoundaryGroups: [],
    layeredAttributionGroups: ["sectarian-related-texts-t2031-t2033", "samguk-yusa-responsibility-t2039"],
    scopeBoundaryGroups: ["council-dharma-duration-decline-t2026-t2030", "sectarian-treatises-t2031-t2033", "east-asian-buddhist-histories-t2034-t2039"],
    continuationBoundaryGroups: ["shishi-jigu-and-continuation-t2037-t2038"],
    catalogResponsibilityBoundaryGroups: ["samguk-yusa-responsibility-t2039"],
    relatedDistinctWorkGroups: relationGroups.map((group) => group.groupId),
    candidateRelationsNotMerged: [
      "T2026–T2030 共同讨论佛灭后的结集、法住与法灭，但叙事对象、责任题记、题名和五个 DILA 作品号不同",
      "T2031–T2033 是关系密切的部派论书；五字组包含度最高约 0.053791，当前记录关系但不把三个 DILA 作品号自动压成同一作品的译本",
      "T2034–T2038 共享佛教史料；T2036/T2037 五字组包含度约 0.106599，只证明编纂依赖或史料复用",
      "T2037/T2038 是本编与续集，五字组包含度约 0.006027；续修关系不消除不同编者、时代、范围与作品号",
      "T2039 与中国佛教史传共享东亚佛教历史主题，但地域、体例、内容与作品权威号不同",
      "T2039 的 TEI 题署一然撰，DILA 当前责任标签为 translator；两种来源标签并列保留，不静默改写责任裁决",
      "T2026、T2028、T2029 的责任题记为失译，表示译者失载而不是无署名原创，也不据相邻记录推定译者",
    ],
    partialWorkWitnesses: [],
    sourceRoles,
    textualComparison: {
      algorithm: "Unicode text from stable reading lines; punctuation/space removed; unique character 5-gram containment and Jaccard. Overlap records shared sectarian accounts, chronologies, names, quotations, source reuse and compilation dependence only; it cannot merge related treatises, historical chronicles, base works and continuations, or resolve catalog responsibility conflicts.",
      pairs: comparisonPairs,
    },
    authoritySources: [
      "https://github.com/cbeta-org/xml-p5/tree/2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9/T/T49",
      ...Object.values(authorityIds).map((code) => `https://authority.dila.edu.tw/catalog/search.php?code=${code}`),
    ],
    caveat: "T49 是结集与法灭记录、部派论书及中韩佛教史传集合，不是佛陀逐字亲说的单一经藏集合。平台完整保存固定 CBETA TEI 与校勘注记，同时区分相关部派论书、史料复用、通史与编年史、本编与续集、失译责任及目录责任标签冲突；共同主题、人物、年代、译者、编者、地域、史料、引文或机器相似度都不能单独证明作品相同、责任无争议或佛陀逐字亲说。",
  },
  files,
};

if (
  files.length !== 14 ||
  batchWorkIds.size !== 14 ||
  batch.collection.unsignedResponsibilityRecords !== 0 ||
  batch.collection.lostTranslatorResponsibilityRecords !== 3
) {
  throw new Error("T49 文件、作品、未署名或失译责任计数漂移");
}
if (new Set(batch.boundaryAudit.authoritySources).size !== 15) {
  throw new Error("T49 CBETA 与 14 个 DILA 权威来源必须完整且唯一");
}

const outputPath = resolve(root, `data/corpus/cbeta/batch-v${version}.json`);
await writeFile(outputPath, `${JSON.stringify(batch, null, 2)}\n`, "utf8");
console.log(`CBETA T49 审计完成：${files.length}/${inventory.totals.records} 个固定来源记录；新增 ${batchWorkIds.size} 个作品、${files.length} 个表达、${batch.collection.newStableSegments} 个稳定行段、${batch.collection.newFolios} 个版页单元、${batch.collection.newJuans} 卷。`);

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { buildPageNavigation, parseCbetaReadingLines } from "../src/lib/cbeta-tei.mjs";

const root = process.cwd();
const version = "4.23.0";
const expectedCommit = "2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9";
const sourceArgument = process.argv.find((argument) => argument.startsWith("--source-dir="));
if (!sourceArgument) {
  console.error("用法：node scripts/audit-cbeta-t85.mjs --source-dir=/固定提交的/xml-p5");
  process.exit(1);
}
const sourceRoot = resolve(sourceArgument.slice("--source-dir=".length));
const actualCommit = execFileSync("git", ["-C", sourceRoot, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (actualCommit !== expectedCommit) throw new Error(`上游工作树必须固定到 ${expectedCommit}`);

const inventoryPath = "data/gbcr/cbeta-taisho-t85-inventory-v0.1.0.json";
const inventory = JSON.parse(await readFile(resolve(root, inventoryPath), "utf8"));
const baseCatalogPath = "data/corpus/cbeta/catalog-v4.22.0.json";
const baseCatalog = JSON.parse(await readFile(resolve(root, baseCatalogPath), "utf8"));
const sourceUnits = (file) => file.sourceParts ?? [file];
const controlledPaths = new Set(baseCatalog.files.flatMap(sourceUnits).map((file) => file.upstreamPath));
const candidates = inventory.records.filter((record) => !controlledPaths.has(record.upstreamPath));
if (inventory.totals.records !== 192 || inventory.totals.upstreamBytes !== 15451526 || candidates.length !== 192) {
  throw new Error(`T85 固定来源分母或新增记录漂移：${inventory.totals.records}/${candidates.length}`);
}

const relation = (type, groupId, label, evidence, ids) => ({
  type,
  groupId,
  label,
  evidence,
  externalIds: { cbeta: ids },
});
const numberFor = (id) => Number(id.match(/^T(\d+)/)?.[1]);
const idsInRange = (first, last) => candidates
  .map((record) => record.canonWitnessId)
  .filter((id) => numberFor(id) >= first && numberFor(id) <= last);
const relationGroups = [
  relation(
    "taisho_t85_source_records_distinct_pending_manuscript_collation",
    "t85-lost-and-suspected-text-source-records",
    "T85 古逸部与疑似部来源记录边界",
    "T85 的 192 份记录混合敦煌等古写本、残卷、同题异本与疑似经。平台完整保存来源并为每份记录建立可追踪作品实体，但在写本学证据不足时保持暂定，不以题名、经号或机器相似度自动归并。",
    candidates.map((record) => record.canonWitnessId),
  ),
  relation(
    "lost_buddhist_manuscript_records_distinct",
    "t85-lost-texts-t2732-t2864",
    "T85 古逸部佛教写本边界",
    "T2732–T2864 的 135 份来源记录包含经疏、律疏、论疏、禅籍、礼忏、变文、传记、诗文和文书。它们是佛教文献与文化史材料，不因大藏经位置而成为佛陀逐字亲说。",
    idsInRange(2732, 2864),
  ),
  relation(
    "suspected_or_indigenous_scripture_records_distinct",
    "t85-suspected-texts-t2865-t2920",
    "T85 疑似部作品与佛陀亲说边界",
    "T2865–T2920 的 57 份记录保留传统佛说式题名、译者题记和敦煌传本证据，但疑似、汉地成书或流通文书属性未完成逐件裁决；一律不得自动标作佛陀逐字亲说。",
    idsInRange(2865, 2920),
  ),
  relation("lost_commentary_records_distinct", "t85-commentaries-t2732-t2786", "古逸经疏、义记与问答边界", "同经疏释、同题残卷和相邻编号只建立研究关系；责任、卷次、写本与正文未完成校勘前不自动合并。", idsInRange(2732, 2786)),
  relation("lost_vinaya_records_distinct", "t85-vinaya-t2787-t2798", "古逸律疏与戒本材料边界", "律疏、戒本疏、律抄和行仪分别保存，部派、题名或共同术语不能单独证明同一作品。", idsInRange(2787, 2798)),
  relation("lost_treatise_records_distinct", "t85-treatises-t2799-t2823", "古逸论疏、经论抄与入道文献边界", "论疏、手记、义章、经抄和入道次第按来源记录分层；残卷与同作者关系不自动消除作品边界。", idsInRange(2799, 2823)),
  relation("lost_practice_records_distinct", "t85-practice-t2824-t2830", "古逸教判、真言与净土文献边界", "图式、真言要决、净土集、念佛仪、赞与礼文属于不同文类；共同实践传统不构成同一作品。", idsInRange(2824, 2830)),
  relation("lost_chan_records_distinct", "t85-chan-t2831-t2840", "古逸禅宗文献边界", "禅论、观门、灯史、诗与图各自保存；传统祖师归属、相近教说或题名不能单独证明作者与作品同一。", idsInRange(2831, 2840)),
  relation("lost_liturgy_records_distinct", "t85-liturgy-t2841-t2857", "古逸礼忏、祈愿与仪文边界", "礼忏、祈愿、回向、斋日、布萨和讽诵文按各来源记录保存；通用题名不等于同一作品。", idsInRange(2841, 2857)),
  relation("lost_narrative_and_document_records_distinct", "t85-narrative-documents-t2858-t2864", "古逸变文、传记、诗集与文书边界", "变文、外传、功德记、诗集与行政文书具有不同体裁；可供佛教文化史研究，但不进入佛教经典或佛陀亲说分子。", idsInRange(2858, 2864)),
];
const sameNumberPairs = [["T2764A", "T2764B"], ["T2830A", "T2830B"], ["T2917A", "T2917B"]];
for (const [left, right] of sameNumberPairs) {
  relationGroups.push(relation(
    "same_number_distinct_manuscript_records",
    `taisho-${left.slice(1).toLowerCase()}-${right.slice(1).toLowerCase()}-distinct`,
    `${left}/${right} 同数字经号异作边界`,
    `${left} 与 ${right} 共享数字经号，但题名、传本或正文不同；A/B 后缀只表示目录分录，不足以证明同一作品或版本。`,
    [left, right],
  ));
}

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
const fileTitles = new Map();

const familyFor = (id) => {
  const number = numberFor(id);
  if (number <= 2786) return { code: "lost-scripture-commentary", role: "taisho_t85_lost_scripture_commentary_or_exegesis", tradition: "汉传佛教 · 古逸经疏与义记" };
  if (number <= 2798) return { code: "lost-vinaya-text", role: "taisho_t85_lost_vinaya_commentary_or_ritual", tradition: "汉传佛教 · 古逸律疏与行仪" };
  if (number <= 2823) return { code: "lost-treatise-text", role: "taisho_t85_lost_treatise_commentary_or_compendium", tradition: "汉传佛教 · 古逸论疏与经论抄" };
  if (number <= 2830) return { code: "lost-practice-text", role: "taisho_t85_lost_doctrinal_practice_or_pure_land_text", tradition: "汉传佛教 · 古逸教判、真言与净土" };
  if (number <= 2840) return { code: "lost-chan-text", role: "taisho_t85_lost_chan_text_or_history", tradition: "汉传佛教 · 古逸禅宗文献" };
  if (number <= 2857) return { code: "lost-liturgy-text", role: "taisho_t85_lost_liturgy_prayer_or_ritual_text", tradition: "汉传佛教 · 古逸礼忏与仪文" };
  if (number <= 2864) return { code: "lost-cultural-document", role: "taisho_t85_lost_narrative_biography_poetry_or_document", tradition: "东亚佛教文化史 · 古逸叙事与文书" };
  return { code: "suspected-buddhist-text", role: "taisho_t85_suspected_or_indigenous_buddhist_scripture", tradition: "汉传佛教 · 疑似部" };
};

for (const record of candidates) {
  const upstream = execFileSync("git", ["-C", sourceRoot, "show", `HEAD:${record.upstreamPath}`], {
    encoding: "buffer",
    maxBuffer: Math.max(record.upstreamBytes + 1024, 8 * 1024 * 1024),
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
  if (relations.length < 2) throw new Error(`${canonId} 缺少来源范围、文类或责任关系裁决`);

  const segments = parseCbetaReadingLines(text, { canonId });
  if (!segments.length) throw new Error(`${canonId} 没有可定位的稳定阅读行`);
  const navigation = buildPageNavigation(segments);
  const numericJuans = [...new Set(segments.map((segment) => segment.juan))].map(Number);
  if (numericJuans.some((juan, index) => !Number.isSafeInteger(juan) || juan < 1 || (index > 0 && juan <= numericJuans[index - 1]))) {
    throw new Error(`${canonId} 原始卷次不是严格递增正整数`);
  }
  normalizedBodies.set(canonId, normalizeBody(segments));
  fileTitles.set(canonId, title);
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
  const suspected = numberFor(canonId) >= 2865;
  const culturalReference = numberFor(canonId) >= 2858 && numberFor(canonId) <= 2864;
  files.push({
    id: canonId,
    slug: `taisho-${canonId.toLowerCase()}`,
    workId: `gbcr:work:taisho-${canonId.toLowerCase()}-${family.code}`,
    workIdentityStatus: "provisional_distinct_t85_source_record_pending_manuscript_collation",
    workTitle: title,
    sourceRole: family.role,
    canonicalStatus: suspected
      ? "suspected_or_indigenous_buddhist_text_not_claimed_as_buddha_word"
      : culturalReference
        ? "buddhist_cultural_reference_document_not_scripture"
        : "buddhist_lost_text_or_manuscript_reference_not_claimed_as_buddha_word",
    buddhaWordStatus: "not_claimed_buddha_word",
    bibliographicRelations: relations,
    authorityIds: { cbetaText: canonId },
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
      canonRef: `大正藏 T85, no. ${canonId.slice(1)}`,
      translator: author.replace(/\s+/g, " · "),
      summary: `${extent}。完整保存固定 CBETA TEI、校勘、写本线索、责任题记与原始卷序；来源文件完整不等于原作品完整。作品身份暂定，等待写本学复核；不标成佛陀逐字亲说。传统责任题记：${author}。`,
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

const byExactTitle = new Map();
for (const file of files) {
  if (!byExactTitle.has(file.workTitle)) byExactTitle.set(file.workTitle, []);
  byExactTitle.get(file.workTitle).push(file.id);
}
const exactTitleGroups = [...byExactTitle.entries()].filter(([, ids]) => ids.length > 1);
for (const [title, ids] of exactTitleGroups) {
  const group = relation(
    "same_title_manuscript_records_not_automatically_merged",
    `t85-same-title-${ids.map((id) => id.slice(1).toLowerCase()).join("-")}`,
    `T85 同题《${title}》写本记录边界`,
    "通用题名、相同经疏名或相同仪文名不足以证明同一作品；各记录保持暂定独立，等待底本、首尾题、正文和目录证据校勘。",
    ids,
  );
  relationGroups.push(group);
  for (const file of files.filter((candidate) => ids.includes(candidate.id))) file.bibliographicRelations.push(group);
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
    titles: [fileTitles.get(leftId), fileTitles.get(rightId)],
    normalizedCharacters: [leftText.length, rightText.length],
    uniqueFiveGrams: [left.size, right.size],
    sharedFiveGrams: shared,
    fiveGramContainmentOfShorter: Number((shared / Math.min(left.size, right.size)).toFixed(6)),
    fiveGramJaccard: Number((shared / (left.size + right.size - shared)).toFixed(6)),
  };
};
const comparisonPairIds = [];
for (const pair of sameNumberPairs) comparisonPairIds.push(pair);
for (const [, ids] of exactTitleGroups) {
  for (let left = 0; left < ids.length; left += 1) {
    for (let right = left + 1; right < ids.length; right += 1) comparisonPairIds.push([ids[left], ids[right]]);
  }
}
const uniqueComparisonPairs = [...new Map(comparisonPairIds.map((pair) => [pair.join("/"), pair])).values()];
const comparisonPairs = uniqueComparisonPairs.map(([left, right]) => compareBodies(left, right));
const comparisonByPair = new Map(comparisonPairs.map((item) => [item.pair.join("/"), item]));
if (
  comparisonByPair.get("T2764A/T2764B")?.fiveGramContainmentOfShorter !== 0.001955 ||
  comparisonByPair.get("T2830A/T2830B")?.fiveGramContainmentOfShorter !== 0.029851 ||
  comparisonByPair.get("T2917A/T2917B")?.fiveGramContainmentOfShorter !== 0.015152
) throw new Error("T85 A/B 同号异作正文比较漂移");

const sourceRoles = Object.fromEntries([...new Set(files.map((file) => file.sourceRole))].sort().map((role) => [
  role,
  files.filter((file) => file.sourceRole === role).map((file) => file.id),
]));
const irregularJuanFiles = files.filter((file) => file.verification.juanSequence.some((juan, index, values) => index > 0 && juan !== values[index - 1] + 1));
const batchWorkIds = new Set(files.map((file) => file.workId));
const batch = {
  schema: "https://foxue.ai/schemas/cbeta-controlled-batch-v1.0",
  version,
  publishedAt: "2026-08-16",
  baseCatalog: baseCatalogPath,
  inventory: inventoryPath,
  rightsCategory: "Individually reviewed CBETA TEI files in Taishō volumes T01–T55 and T85; T85 lost and suspected-text source-record closure",
  workOverrides: {},
  fileOverrides: {},
  collection: {
    id: "CBETA-TAISHO-T85",
    title: "大正藏 T85 古逸部与疑似部固定来源记录",
    sourceRecordDenominator: 192,
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
    provisionalRecords: files.length,
    newFullSourceTexts: files.length,
    newPartialSourceWitnesses: 0,
    relationAnnotatedRecords: files.filter((file) => file.bibliographicRelations?.length).length,
    attributionBoundaryRecords: files.length,
    unsignedResponsibilityRecords: files.filter((file) => file.presentation.translator === "传统责任题记未署名").length,
    lostTranslatorResponsibilityRecords: 0,
    nonBuddhistReferenceRecords: 0,
    buddhistCulturalReferenceRecords: files.filter((file) => file.canonicalStatus === "buddhist_cultural_reference_document_not_scripture").length,
    suspectedTextRecords: files.filter((file) => file.canonicalStatus === "suspected_or_indigenous_buddhist_text_not_claimed_as_buddha_word").length,
    newWorks: batchWorkIds.size,
    controlledWorks: batchWorkIds.size,
    workCountingDecision: "T85 的 192 份固定来源记录先登记为 192 个暂定作品实体与 192 个完整来源表达。A/B 同号、同题残卷和疑似经只建立待校勘关系；在写本、首尾题、正文和权威目录证据完成前不自动归并，也不把任何记录标成佛陀逐字亲说。",
  },
  boundaryAudit: {
    status: "verified_source_integrity_genre_same_number_manuscript_responsibility_suspected_text_and_buddha_word_boundaries_recorded",
    existingControlledRecords: [],
    verifiedTranslationGroups: [],
    rootVinayaCommentaryGroups: [],
    rootTreatiseCommentaryGroups: [],
    rootEditionBoundaryGroups: [],
    editionOrRecensionGroups: [],
    subcommentaryGroups: [],
    sameNumberBoundaryGroups: sameNumberPairs.map(([left, right]) => `taisho-${left.slice(1).toLowerCase()}-${right.slice(1).toLowerCase()}-distinct`),
    sameTitleBoundaryGroups: exactTitleGroups.map(([, ids]) => `t85-same-title-${ids.map((id) => id.slice(1).toLowerCase()).join("-")}`),
    layeredAttributionGroups: [],
    scopeBoundaryGroups: ["t85-lost-and-suspected-text-source-records", "t85-lost-texts-t2732-t2864", "t85-suspected-texts-t2865-t2920"],
    continuationBoundaryGroups: [],
    sourceReuseBoundaryGroups: [],
    sameAuthorCompanionWorkGroups: [],
    crossVolumeRelationGroups: [],
    irregularJuanSequenceGroups: irregularJuanFiles.map((file) => ({ id: file.id, encodedJuans: file.verification.juanSequence })),
    nonBuddhistReferenceGroups: [],
    manuscriptCollationPendingGroups: [...sameNumberPairs.map((pair) => pair.join("/")), ...exactTitleGroups.map(([, ids]) => ids.join("/"))],
    relatedDistinctWorkGroups: relationGroups.map((group) => group.groupId),
    candidateRelationsNotMerged: [
      "T2764A/B、T2830A/B、T2917A/B 共享数字经号，但五字组包含度仅 0.001955、0.029851、0.015152，不能据 A/B 自动归并",
      "《金刚经疏》《法华经疏》《药师经疏》《维摩经疏》《律戒本疏》《祈愿文》《礼忏文》《护身命经》《新菩萨经》等同题记录均等待写本学校勘",
      "T2732–T2864 的古逸材料分属经疏、律疏、论疏、禅籍、礼仪、变文、传记、诗文和文书，不构成单一经典集合",
      "T2865–T2920 疑似部保留传统题名与责任题记，但一律不自动标作佛陀逐字亲说",
      "来源文件完整仅表示固定 TEI 被完整保存，不表示残存原作品全文完整",
    ],
    partialWorkWitnesses: [],
    editionWitnesses: [],
    sourceRoles,
    textualComparison: {
      algorithm: "Unicode text from stable reading lines; punctuation/space removed; unique character 5-gram containment and Jaccard. Same title or A/B numbering only creates a collation queue; no automatic work merge.",
      pairs: comparisonPairs,
    },
    authoritySources: [
      "https://github.com/cbeta-org/xml-p5/tree/2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9/T/T85",
      "https://cbetaonline.dila.edu.tw/zh/T2732_001",
      "https://cbetaonline.dila.edu.tw/zh/T2865_001",
      "https://cbetaonline.dila.edu.tw/zh/T2920_001",
    ],
    caveat: "T85 是古逸部与疑似部的混合来源集合，不是佛陀逐字亲说的单一经藏。平台完整保存固定 CBETA TEI、校勘、写本线索、责任题记和原始卷序，同时把来源文件完整、原作品完整、作品身份、宗教归属和佛陀亲说分别建模；同题、A/B 经号、传统译者题记、大藏经位置或机器重叠均不能单独证明同一作品或佛陀亲说。",
  },
  files,
};

if (
  files.length !== 192 || batchWorkIds.size !== 192 || batch.collection.newSourceBytes !== 15451526 ||
  batch.collection.provisionalRecords !== 192 || batch.collection.suspectedTextRecords !== 57 ||
  batch.collection.buddhistCulturalReferenceRecords !== 7 || batch.collection.relationAnnotatedRecords !== 192 ||
  batch.boundaryAudit.sameNumberBoundaryGroups.length !== 3 || exactTitleGroups.length !== 9
) throw new Error(`T85 来源、作品、文类、同题或责任边界计数漂移：${JSON.stringify(batch.collection)}`);

const outputPath = resolve(root, `data/corpus/cbeta/batch-v${version}.json`);
await writeFile(outputPath, `${JSON.stringify(batch, null, 2)}\n`, "utf8");
console.log(`CBETA T85 审计完成：${files.length}/${inventory.totals.records} 个固定来源记录；新增 ${batchWorkIds.size} 个暂定作品与 ${files.length} 个完整来源表达、${batch.collection.newStableSegments} 个稳定行段、${batch.collection.newFolios} 个版页单元、${batch.collection.newJuans} 个卷单元；${batch.collection.suspectedTextRecords} 份疑似部记录均不标为佛陀逐字亲说。`);

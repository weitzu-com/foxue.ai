import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { buildPageNavigation, parseCbetaReadingLines } from "../src/lib/cbeta-tei.mjs";

const root = process.cwd();
const version = "3.1.0";
const expectedCommit = "2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9";
const sourceArgument = process.argv.find((argument) => argument.startsWith("--source-dir="));
if (!sourceArgument) {
  console.error("用法：node scripts/audit-cbeta-t24.mjs --source-dir=/固定提交的/xml-p5");
  process.exit(1);
}
const sourceRoot = resolve(sourceArgument.slice("--source-dir=".length));
const actualCommit = execFileSync("git", ["-C", sourceRoot, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (actualCommit !== expectedCommit) throw new Error(`上游工作树必须固定到 ${expectedCommit}`);

const inventoryPath = "data/gbcr/cbeta-taisho-t24-inventory-v0.1.0.json";
const inventory = JSON.parse(await readFile(resolve(root, inventoryPath), "utf8"));
const baseCatalogPath = "data/corpus/cbeta/catalog-v3.0.0.json";
const baseCatalog = JSON.parse(await readFile(resolve(root, baseCatalogPath), "utf8"));
const sourceUnits = (file) => file.sourceParts ?? [file];
const controlledPaths = new Set(baseCatalog.files.flatMap(sourceUnits).map((file) => file.upstreamPath));
const candidates = inventory.records.filter((record) => !controlledPaths.has(record.upstreamPath));
if (inventory.totals.records !== 59 || inventory.totals.upstreamBytes !== 19745486 || candidates.length !== 59) {
  throw new Error(`T24 固定来源分母或新增记录漂移：${inventory.totals.records}/${candidates.length}`);
}

const relation = (type, groupId, label, evidence, ids) => ({
  type, groupId, label, evidence, externalIds: { cbeta: ids },
});
const candidateRelations = [
  relation(
    "vinaya_collection_component_family_candidate_unmerged",
    "mulasarvastivada-vinaya-t1442-t1457",
    "根本说一切有部毘奈耶及事部文本家族",
    "T1442–T1457 连续保存僧尼毘奈耶、出家、安居、随意、皮革、药、羯耻那衣、破僧、杂事、尼陀那目得迦、羯磨、戒经与摄颂；共同译者、部派和结构证明同一律藏家族，但不把广律、事部、戒本、羯磨与摄颂合成一个书目作品。",
    ["T1442", "T1443", "T1444", "T1445", "T1446", "T1447", "T1448", "T1449", "T1450", "T1451", "T1452", "T1453", "T1454", "T1455", "T1456", "T1457"],
  ),
  relation(
    "vinaya_root_text_exegesis_family_candidate_unmerged",
    "mulasarvastivada-vinaya-exegesis-t1454-t1459",
    "根本说一切有部戒经、律摄与毘奈耶颂关系",
    "T1458《律摄》对 T1454 戒经的五字片段覆盖超过 82%，T1459 为毘奈耶颂；高覆盖与题记支持根本文本、解释和偈颂关系，不证明它们是同一作品的版本。",
    ["T1454", "T1455", "T1458", "T1459"],
  ),
  relation(
    "vinaya_pratimoksa_parallel_candidate_unmerged",
    "vinaya-pratimoksa-parallel-t1454-t1460",
    "僧尼戒经与解脱戒经平行文本候选",
    "T1454/T1455 是根本说一切有部僧尼戒经，T1460 为《解脱戒经》；题名、体裁与正文重合支持戒本平行研究，但部派、对象与文本范围不足以裁为同一作品。",
    ["T1454", "T1455", "T1460"],
  ),
  relation(
    "same_work_edition_or_recension_group_verified",
    "disciplinary-consequences-t1467a-b",
    "《犯戒罪报轻重经》T1467 a/b 版本见证",
    "DILA/CBETA 把两份同基础经号、核心题名和重合正文的记录并列；五字片段覆盖约 68.9%。平台合并作品实体，保留 a 的安世高传统归属争议与 b 的无署名状态。",
    ["T1467a", "T1467b"],
  ),
  relation(
    "novice_precepts_conduct_family_candidate_unmerged",
    "novice-precepts-conduct-t1471-t1473",
    "沙弥十戒与威仪文本家族",
    "T1471–T1473 都围绕沙弥十戒与威仪，T1471/T1472 五字片段覆盖约 59.7%；失译、求那跋摩译与施护译题记及文本范围有别，只登记关系而不自动归并。",
    ["T1471", "T1472", "T1473"],
  ),
  relation(
    "same_work_edition_or_recension_group_verified",
    "maudgalyayana-vinaya-questions-t1483a-b",
    "《目连问戒律中五百轻重事》T1483 a/b 版本见证",
    "DILA/CBETA 以一个 T1483 书目入口收录 a/b，核心题名一致且五字片段覆盖约 77.8%；研究又提示现存形态有后加卷与中国编纂层，故共享作品实体但保留两份版本见证和形成史争议。",
    ["T1483a", "T1483b"],
  ),
  relation(
    "east_asian_bodhisattva_precepts_family_candidate_unmerged",
    "east-asian-bodhisattva-precepts-t1484-t1485",
    "《梵网经》与《菩萨璎珞本业经》东亚菩萨戒传统",
    "两经都是东亚菩萨戒传统的关键文本，现代研究对其中国撰述层及传统译者归属均有争议；平台保存传统题记和争议标识，不据相邻经号或思想关系合并作品。",
    ["T1484", "T1485"],
  ),
  relation(
    "same_work_translation_group_verified",
    "paramarthasamvrtisatyanirdesa-t1489-t1490",
    "Paramārthasaṃvṛtisatyanirdeśa 汉译组",
    "两份固定 TEI 题记互列对方经号，DILA/CBETA 明确登记为同一 Paramārthasaṃvṛtisatyanirdeśa 的异译；平台共享作品实体并保留鸠摩罗什与法海两个汉译表达。",
    ["T1489", "T1490"],
  ),
  relation(
    "yogacara_bodhisattva_precepts_family_candidate_unmerged",
    "yogacara-bodhisattva-precepts-t1499-t1501",
    "瑜伽行派菩萨戒羯磨与戒本文本家族",
    "T1499 是羯磨程序，T1500/T1501 是传统上分别由昙无谶与玄奘译出的菩萨戒本；目录与文本证据支持瑜伽行派戒律家族和节出关系，不足以把三者裁为同一作品或同一表达。",
    ["T1499", "T1500", "T1501"],
  ),
];
const relationsByCanonId = new Map();
for (const item of candidateRelations) {
  for (const id of item.externalIds.cbeta) {
    if (!id.startsWith("T24") && Number(id.match(/^T(\d+)/)?.[1]) < 1448) continue;
    relationsByCanonId.set(id, [...(relationsByCanonId.get(id) ?? []), item]);
  }
}

const editionGroups = new Map([
  ["T1467a", { workId: "gbcr:work:disciplinary-consequences-t1467", status: "verified_edition_witness" }],
  ["T1467b", { workId: "gbcr:work:disciplinary-consequences-t1467", status: "verified_edition_witness" }],
  ["T1483a", { workId: "gbcr:work:maudgalyayana-vinaya-questions", status: "verified_edition_witness" }],
  ["T1483b", { workId: "gbcr:work:maudgalyayana-vinaya-questions", status: "verified_edition_witness" }],
]);
const translationGroups = new Map([
  ["T1489", { workId: "gbcr:work:paramarthasamvrtisatyanirdesa", status: "verified_same_work_expression" }],
  ["T1490", { workId: "gbcr:work:paramarthasamvrtisatyanirdesa", status: "verified_same_work_expression" }],
]);
const authoredTexts = new Set(["T1458", "T1459", "T1461", "T1499", "T1500", "T1501"]);
const lostTranslations = new Set(["T1463", "T1465", "T1471", "T1474", "T1475", "T1478", "T1486", "T1494", "T1504"]);
const contestedTraditional = new Set(["T1467a", "T1484", "T1485"]);
const contestedNativeCompilation = new Set(["T1483a", "T1483b"]);

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const gitBlobSha1 = (value) => createHash("sha1").update(`blob ${value.length}\0`).update(value).digest("hex");
const matchRequired = (text, pattern, label, id) => {
  const value = text.match(pattern)?.[1]?.trim();
  if (!value) throw new Error(`${id} 缺少 ${label}`);
  return value;
};
const stripXml = (value) => value.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
const displayNumber = (canonId) => canonId.slice(1).replace(/^0+(?=\d)/, "");
const classifyAttribution = (canonId, author) => {
  if (canonId === "T1467b") {
    if (author) throw new Error("T1467b 预期为空署名");
    return {
      sourceRole: "unattributed_vinaya_text",
      label: "题记未载作者或译者",
      summary: "题记未载作者或译者，平台不从同作品另一版本补造其责任归属；",
    };
  }
  if (contestedTraditional.has(canonId)) return {
    sourceRole: "traditional_attributed_vinaya_translation_with_contested_history",
    label: author.replace(/\s+/g, " · "),
    summary: "目录保存传统译者题记，同时明确现代研究对译者归属、中国撰述层或形成年代的争议；",
  };
  if (contestedNativeCompilation.has(canonId)) return {
    sourceRole: "lost_translation_with_contested_native_compilation_history",
    label: "失譯；现存形态与中国编纂层有争议",
    summary: "目录标为失译，研究提示正文可能源自讲律记录且现存形态含后加编纂层；",
  };
  if (lostTranslations.has(canonId)) return {
    sourceRole: "lost_translation_vinaya_text",
    label: "失譯",
    summary: "目录保留失译状态，平台不补造译者、印度原本或佛陀逐字亲说归属；",
  };
  if (authoredTexts.has(canonId)) return {
    sourceRole: "authored_or_taught_vinaya_text_with_translation",
    label: author.replace(/\s+/g, " · "),
    summary: "题记并列保存造、说与汉译责任，不把论师或菩萨说扩张成佛陀逐字亲说；",
  };
  return {
    sourceRole: "translated_vinaya_canonical_record",
    label: author.replace(/\s+/g, " · "),
    summary: "目录署为翻译；律部位置、体裁或正文重合不能单独证明同一作品或佛陀逐字亲说；",
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
  const attribution = classifyAttribution(canonId, author);
  const identity = editionGroups.get(canonId) ?? translationGroups.get(canonId) ?? {
    workId: `gbcr:work:taisho-${canonId.toLowerCase()}`,
    status: "provisional_canon_record",
  };
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
  const completeness = canonId === "T1482" ? "complete_source_file_partial_work_witness" : "complete_source_file";
  files.push({
    id: canonId,
    slug: `taisho-${canonId.toLowerCase()}`,
    workId: identity.workId,
    workIdentityStatus: identity.status,
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
    completeness,
    presentation: {
      title,
      alternateTitle: title,
      tradition: "漢傳佛教 · 律部",
      language: "漢文",
      canonRef: `大正藏 T24, no. ${displayNumber(canonId)}`,
      translator: attribution.label,
      summary: `${extent}。本站${canonId === "T1482" ? "完整保存该节出见证的" : "完整保存"} ${canonId} 固定 CBETA TEI 来源记录与可校验页栏行锚点；${attribution.summary}物理记录、作品、译本、版本见证与归属边界分层计数。`,
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
  ["T1454", "T1458"], ["T1483a", "T1483b"], ["T1452", "T1456"], ["T1467a", "T1467b"],
  ["T1454", "T1455"], ["T1471", "T1472"], ["T1451", "T1457"], ["T1455", "T1458"],
  ["T1499", "T1501"], ["T1449", "T1453"], ["T1456", "T1457"], ["T1454", "T1460"],
].map(([left, right]) => compareBodies(left, right));
const comparisonByPair = new Map(comparisonPairs.map((item) => [item.pair.join("/"), item]));
if (
  comparisonByPair.get("T1454/T1458").fiveGramContainmentOfShorter < 0.82 ||
  comparisonByPair.get("T1483a/T1483b").fiveGramContainmentOfShorter < 0.77 ||
  comparisonByPair.get("T1452/T1456").fiveGramContainmentOfShorter < 0.77 ||
  comparisonByPair.get("T1467a/T1467b").fiveGramContainmentOfShorter < 0.68 ||
  comparisonByPair.get("T1471/T1472").fiveGramContainmentOfShorter < 0.59 ||
  comparisonByPair.get("T1451/T1457").fiveGramContainmentOfShorter < 0.57
) throw new Error("T24 高风险异本、戒本、摄颂或威仪正文比较漂移");

const batch = {
  schema: "https://foxue.ai/schemas/cbeta-controlled-batch-v1.0",
  version,
  publishedAt: "2026-08-14",
  baseCatalog: baseCatalogPath,
  inventory: inventoryPath,
  rightsCategory: "Individually reviewed CBETA TEI files in Taishō volumes T01–T24; T24 source-record closure",
  workOverrides: {},
  fileOverrides: {},
  collection: {
    id: "CBETA-TAISHO-T24",
    title: "大正藏 T24 律部固定来源记录",
    sourceRecordDenominator: 59,
    previouslyControlledSourceRecords: 0,
    newSourceRecords: files.length,
    controlledSourceRecords: files.length,
    newSourceBytes: files.reduce((sum, file) => sum + file.upstreamBytes, 0),
    newStableSegments: files.reduce((sum, file) => sum + file.verification.segments, 0),
    newFolios: files.reduce((sum, file) => sum + file.verification.folios, 0),
    verifiedSameWorkExpressions: files.filter((file) => file.workIdentityStatus === "verified_same_work_expression").length,
    verifiedEditionWitnesses: files.filter((file) => file.workIdentityStatus === "verified_edition_witness").length,
    provisionalRecords: files.filter((file) => file.workIdentityStatus === "provisional_canon_record").length,
    newFullSourceTexts: files.filter((file) => file.completeness === "complete_source_file").length,
    newPartialSourceWitnesses: files.filter((file) => file.completeness !== "complete_source_file").length,
    relationAnnotatedRecords: files.filter((file) => file.bibliographicRelations?.length).length,
    attributionBoundaryRecords: files.filter((file) => file.sourceRole !== "translated_vinaya_canonical_record").length,
    newWorks: new Set(files.map((file) => file.workId)).size,
    controlledWorks: new Set(files.map((file) => file.workId)).size,
    workCountingDecision: "T24 共 59 条固定来源记录。T1467 a/b 与 T1483 a/b 各归为一个作品的两个版本见证，T1489/T1490 归为一个作品的两个汉译表达；其余 53 条暂按独立书目实体登记，共新增 56 个作品。T1500/T1501 等戒本、羯磨、摄颂、解释书与疑伪文本关系只作分层候选，不因相邻经号、传统译者或机器相似度自动归并。",
  },
  boundaryAudit: {
    status: "verified_source_integrity_work_expression_witness_attribution_apocrypha_and_partial_boundaries_recorded",
    existingControlledRecords: [],
    editionOrRecensionGroups: ["disciplinary-consequences-t1467a-b", "maudgalyayana-vinaya-questions-t1483a-b"],
    verifiedTranslationGroups: ["paramarthasamvrtisatyanirdesa-t1489-t1490"],
    candidateRelationsNotMerged: candidateRelations.filter((item) => !item.type.startsWith("same_work_")).map((item) => item.groupId),
    partialWorkWitnesses: ["T1482"],
    translatedRecords: files.filter((file) => file.sourceRole === "translated_vinaya_canonical_record").map((file) => file.id),
    traditionalAttributionContestedRecords: files.filter((file) => file.sourceRole === "traditional_attributed_vinaya_translation_with_contested_history").map((file) => file.id),
    authoredOrTaughtRecords: files.filter((file) => file.sourceRole === "authored_or_taught_vinaya_text_with_translation").map((file) => file.id),
    lostTranslationRecords: files.filter((file) => file.sourceRole === "lost_translation_vinaya_text").map((file) => file.id),
    lostTranslationContestedCompilationRecords: files.filter((file) => file.sourceRole === "lost_translation_with_contested_native_compilation_history").map((file) => file.id),
    unattributedRecords: files.filter((file) => file.sourceRole === "unattributed_vinaya_text").map((file) => file.id),
    textualComparison: {
      algorithm: "Unicode text from stable reading lines; punctuation/space removed; unique character 5-gram containment and Jaccard. Machine comparison records edition, component, parallel or explanatory evidence but never decides work identity by itself.",
      pairs: comparisonPairs,
    },
    authoritySources: [
      "https://github.com/cbeta-org/xml-p5/tree/2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9/T/T24",
      "https://cbetaonline.dila.edu.tw/zh/T1467a_001",
      "https://authority.dila.edu.tw/person/search.php?aid=A001512",
      "https://cbetaonline.dila.edu.tw/zh/T1483a_001",
      "https://cbetaonline.dila.edu.tw/zh/T1484_001",
      "https://cbetaonline.dila.edu.tw/zh/T1485_001",
      "https://cbetaonline.dila.edu.tw/zh/T1489_001",
      "https://cbetaonline.dila.edu.tw/zh/T1490_001",
      "https://cbetaonline.dila.edu.tw/zh/T1501_001",
    ],
    caveat: "T24 同时容纳根本说一切有部律事、律摄、戒经、羯磨、威仪、在家戒与菩萨戒，也含同经异本、异译、节出、失译、无署名和传统归属有争议的中国撰述候选。平台完整保存固定来源与传统题记，但不把传统归属伪装成现代定论，也不把同一律藏、目录邻接、题名或机器文本重合单独当成同一作品或佛陀逐字亲说的证明。",
  },
  files,
};

if (
  batch.collection.newSourceRecords !== 59 ||
  batch.collection.newSourceBytes !== 19745486 ||
  batch.collection.newStableSegments !== 95817 ||
  batch.collection.newFolios !== 3502 ||
  batch.collection.verifiedSameWorkExpressions !== 2 ||
  batch.collection.verifiedEditionWitnesses !== 4 ||
  batch.collection.provisionalRecords !== 53 ||
  batch.collection.newFullSourceTexts !== 58 ||
  batch.collection.newPartialSourceWitnesses !== 1 ||
  batch.collection.relationAnnotatedRecords !== 27 ||
  batch.collection.attributionBoundaryRecords !== 21 ||
  batch.collection.newWorks !== 56
) throw new Error(`T24 关系、归属或作品边界统计漂移：${JSON.stringify(batch.collection)}`);

await writeFile(resolve(root, `data/corpus/cbeta/batch-v${version}.json`), `${JSON.stringify(batch, null, 2)}\n`, "utf8");
console.log(`CBETA T24 审计完成：59/59 个固定来源记录；新增 ${batch.collection.newWorks} 个作品、${batch.collection.newSourceRecords} 个表达或见证、${batch.collection.newStableSegments} 个稳定行段。`);

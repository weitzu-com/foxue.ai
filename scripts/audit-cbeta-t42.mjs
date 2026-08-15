import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { buildPageNavigation, parseCbetaReadingLines } from "../src/lib/cbeta-tei.mjs";

const root = process.cwd();
const version = "4.9.0";
const expectedCommit = "2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9";
const sourceArgument = process.argv.find((argument) => argument.startsWith("--source-dir="));
if (!sourceArgument) {
  console.error("用法：node scripts/audit-cbeta-t42.mjs --source-dir=/固定提交的/xml-p5");
  process.exit(1);
}
const sourceRoot = resolve(sourceArgument.slice("--source-dir=".length));
const actualCommit = execFileSync("git", ["-C", sourceRoot, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (actualCommit !== expectedCommit) throw new Error(`上游工作树必须固定到 ${expectedCommit}`);

const inventoryPath = "data/gbcr/cbeta-taisho-t42-inventory-v0.1.0.json";
const inventory = JSON.parse(await readFile(resolve(root, inventoryPath), "utf8"));
const baseCatalogPath = "data/corpus/cbeta/catalog-v4.8.0.json";
const baseCatalog = JSON.parse(await readFile(resolve(root, baseCatalogPath), "utf8"));
const sourceUnits = (file) => file.sourceParts ?? [file];
const controlledPaths = new Set(baseCatalog.files.flatMap(sourceUnits).map((file) => file.upstreamPath));
const candidates = inventory.records.filter((record) => !controlledPaths.has(record.upstreamPath));
if (inventory.totals.records !== 5 || inventory.totals.upstreamBytes !== 10207300 || candidates.length !== 5) {
  throw new Error(`T42 固定来源分母或新增记录漂移：${inventory.totals.records}/${candidates.length}`);
}

const relation = (type, groupId, label, evidence, ids) => ({
  type,
  groupId,
  label,
  evidence,
  externalIds: { cbeta: ids },
});
const madhyamakaCommentary = relation(
  "commentary_on_madhyamaka_sastra_distinct",
  "madhyamaka-sastra-commentary-t1564-t1824",
  "《中论》与吉藏《中观论疏》",
  "DILA 权威记录将 T1824 关联到 T1564。十卷隋代疏具有吉藏作者责任、独立解释结构和完整来源边界，不是《中论》的另一表达。",
  ["T1564", "T1824"],
);
const dvadasamukhaCommentaries = relation(
  "commentaries_on_dvadasamukha_sastra_distinct",
  "dvadasamukha-sastra-commentaries-t1568-t1825-t1826",
  "《十二门论》与吉藏、法藏两部注疏",
  "DILA 权威记录将 T1825、T1826 均关联到 T1568。两部注疏分别署吉藏与法藏，具有独立作者责任、篇幅、解释范围和全文边界。",
  ["T1568", "T1825", "T1826"],
);
const parallelDvadasamukhaCommentaries = relation(
  "parallel_commentaries_on_same_treatise_distinct",
  "dvadasamukha-parallel-commentaries-t1825-t1826",
  "吉藏《十二门论疏》与法藏《十二门论宗致义记》",
  "两书同释 T1568，但传统作者题记、三卷与二卷的范围、行文及五字片段统计不同；共享根本论引文不能据以合并。",
  ["T1568", "T1825", "T1826"],
);
const dvadasamukhaScope = relation(
  "full_commentary_and_doctrinal_meaning_commentary_scope_distinct",
  "dvadasamukha-commentary-scope-t1825-t1826",
  "《十二门论疏》与《十二门论宗致义记》的解释范围",
  "T1825 按吉藏三卷疏完整解释 T1568，T1826 以法藏宗致义记的两卷组织阐明宗旨；共同根本论不能消除体例与范围差异。",
  ["T1568", "T1825", "T1826"],
);
const satakaCommentary = relation(
  "commentary_on_sataka_sastra_distinct",
  "sataka-sastra-commentary-t1569-t1827",
  "《百论》与吉藏《百论疏》",
  "DILA 权威记录将 T1827 关联到 T1569。三卷吉藏疏具有独立作者责任和解释结构，不是提婆本颂、婆藪释或罗什译文的另一表达。",
  ["T1569", "T1827"],
);
const yogacarabhumiCommentary = relation(
  "commentary_on_yogacarabhumi_distinct",
  "yogacarabhumi-commentary-t1579-t1828",
  "《瑜伽师地论》与遁伦《瑜伽论记》",
  "DILA 权威记录将 T1828 关联到 T1579。二十四卷唐代集撰疏具有遁伦责任题记、独立注释结构和完整来源边界，不是百卷根本论的另一表达。",
  ["T1579", "T1828"],
);
const jizangThreeTreatiseCommentaries = relation(
  "jizang_three_treatise_commentaries_related_distinct",
  "jizang-three-treatise-commentaries-t1824-t1825-t1827",
  "吉藏的中论、十二门论与百论三部注疏",
  "DILA 人名与经录权威记录将 T1824、T1825、T1827 均署吉藏；共同作者与三论传统构成相关性，但三种根本论和三套正文边界保持为不同作品。",
  ["T1564", "T1568", "T1569", "T1824", "T1825", "T1827"],
);

const d = (workId, sourceRole, tradition, relations, summary) => ({
  workId: `gbcr:work:${workId}`,
  sourceRole,
  tradition,
  workIdentityStatus: "verified_distinct_commentary_work",
  relations,
  summary,
  completeness: "complete_source_file",
});
const decisions = new Map(Object.entries({
  T1824: d("madhyamaka-sastra-shu-jizang", "sinitic_authored_madhyamaka_sastra_commentary", "汉传佛教 · 中观论疏部 · 中论注疏", [madhyamakaCommentary, jizangThreeTreatiseCommentaries], "吉藏《中观论疏》完整来源。"),
  T1825: d("dvadasamukha-sastra-shu-jizang", "sinitic_authored_dvadasamukha_sastra_commentary", "汉传佛教 · 中观论疏部 · 十二门论注疏", [dvadasamukhaCommentaries, parallelDvadasamukhaCommentaries, dvadasamukhaScope, jizangThreeTreatiseCommentaries], "吉藏《十二门论疏》完整来源。"),
  T1826: d("dvadasamukha-sastra-zongzhi-yiji-fazang", "sinitic_authored_dvadasamukha_sastra_commentary", "汉传佛教 · 中观论疏部 · 十二门论注疏", [dvadasamukhaCommentaries, parallelDvadasamukhaCommentaries, dvadasamukhaScope], "法藏《十二门论宗致义记》完整来源。"),
  T1827: d("sataka-sastra-shu-jizang", "sinitic_authored_sataka_sastra_commentary", "汉传佛教 · 中观论疏部 · 百论注疏", [satakaCommentary, jizangThreeTreatiseCommentaries], "吉藏《百论疏》完整来源。"),
  T1828: d("yogacarabhumi-lun-ji-dunlun", "sinitic_authored_yogacarabhumi_commentary", "汉传佛教 · 瑜伽论疏部 · 瑜伽师地论注疏", [yogacarabhumiCommentary], "遁伦《瑜伽论记》完整来源。"),
}));

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
  const author = stripXml(required(text.match(/<author>([\s\S]*?)<\/author>/)?.[1], "传统作者题记", record.sourceRecordId));
  const extent = required(text.match(/<extent>([^<]+)<\/extent>/)?.[1], "卷数", record.sourceRecordId);
  const canonId = record.canonWitnessId;
  const decision = decisions.get(canonId);
  if (!decision) throw new Error(`T42 出现未裁决经号 ${canonId}`);

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
    workId: decision.workId,
    workIdentityStatus: decision.workIdentityStatus,
    workTitle: title,
    sourceRole: decision.sourceRole,
    bibliographicRelations: decision.relations,
    localPath,
    upstreamPath: record.upstreamPath,
    upstreamGitBlobSha1: record.upstreamGitBlobSha1,
    upstreamBytes: upstream.length,
    upstreamSha256: sha256(upstream),
    localBytes: normalized.length,
    localSha256: sha256(normalized),
    format: "application/tei+xml",
    completeness: decision.completeness,
    presentation: {
      title,
      alternateTitle: title,
      tradition: decision.tradition,
      language: "汉文",
      canonRef: `大正藏 T42, no. ${canonId.slice(1)}`,
      translator: author.replace(/\s+/g, " · "),
      summary: `${extent}。${decision.summary}传统责任题记：${author}。`,
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
  ["T1824", "T1825"], ["T1824", "T1826"], ["T1824", "T1827"], ["T1824", "T1828"],
  ["T1825", "T1826"], ["T1825", "T1827"], ["T1825", "T1828"],
  ["T1826", "T1827"], ["T1826", "T1828"], ["T1827", "T1828"],
].map(([left, right]) => compareBodies(left, right));
const sourceRoles = Object.fromEntries([...new Set(files.map((file) => file.sourceRole))].sort().map((role) => [
  role,
  files.filter((file) => file.sourceRole === role).map((file) => file.id),
]));
const batchWorkIds = new Set(files.map((file) => file.workId));
const rootTreatiseCommentaryGroups = [
  "madhyamaka-sastra-commentary-t1564-t1824",
  "dvadasamukha-sastra-commentaries-t1568-t1825-t1826",
  "sataka-sastra-commentary-t1569-t1827",
  "yogacarabhumi-commentary-t1579-t1828",
];
const batch = {
  schema: "https://foxue.ai/schemas/cbeta-controlled-batch-v1.0",
  version,
  publishedAt: "2026-08-15",
  baseCatalog: baseCatalogPath,
  inventory: inventoryPath,
  rightsCategory: "Individually reviewed CBETA TEI files in Taishō volumes T01–T42; T42 source-record closure",
  workOverrides: {},
  fileOverrides: {},
  collection: {
    id: "CBETA-TAISHO-T42",
    title: "大正藏 T42 中观与瑜伽论疏部固定来源记录",
    sourceRecordDenominator: 5,
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
    newWorks: batchWorkIds.size,
    controlledWorks: batchWorkIds.size,
    workCountingDecision: "T42 的 5 份来源记录登记为 5 个完整表达和 5 个独立汉地注疏作品。T1824、T1827、T1828 分别解释 T1564、T1569、T1579；T1825 吉藏《十二门论疏》和 T1826 法藏《十二门论宗致义记》均解释 T1568，但保持不同作者责任、篇幅、体例与全文边界。五者均不标作根本论的同作品表达、印度论本或佛陀逐字亲说。",
  },
  boundaryAudit: {
    status: "verified_source_integrity_madhyamaka_and_yogacara_root_treatise_parallel_commentary_and_scope_boundaries_recorded",
    existingControlledRecords: ["T1564", "T1568", "T1569", "T1579"],
    verifiedTranslationGroups: [],
    rootVinayaCommentaryGroups: [],
    rootTreatiseCommentaryGroups,
    subcommentaryGroups: [],
    scopeBoundaryGroups: ["dvadasamukha-commentary-scope-t1825-t1826"],
    relatedDistinctWorkGroups: ["dvadasamukha-parallel-commentaries-t1825-t1826", "jizang-three-treatise-commentaries-t1824-t1825-t1827"],
    candidateRelationsNotMerged: [
      "T1564↔T1824、T1569↔T1827、T1579↔T1828（三种根本论与各自汉地注疏分层保存）",
      "T1568↔T1825/T1826（十二门论、吉藏三卷疏与法藏两卷宗致义记按作者和范围分层）",
      "T1824↔T1825↔T1827（共同吉藏作者责任和三论传统不构成同一作品）",
    ],
    partialWorkWitnesses: [],
    sourceRoles,
    textualComparison: {
      algorithm: "Unicode text from stable reading lines; punctuation/space removed; unique character 5-gram containment and Jaccard. Text overlap only records shared technical vocabulary, quotation and exegetical dependence; it cannot merge four root treatises or five commentaries with different authors, base texts and scope.",
      pairs: comparisonPairs,
    },
    authoritySources: [
      "https://github.com/cbeta-org/xml-p5/tree/2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9/T/T42",
      ...["CA0004105", "CA0004103", "CA0003044", "CA0003045", "CA0003046", "CA0000150", "CA0000151", "CA0003829", "CA0003827"].map((code) => `https://authority.dila.edu.tw/catalog/search.php?code=${code}`),
    ],
    caveat: "T42 是汉地中观与瑜伽论疏集合，不是佛说经或印度根本论集合。平台完整保存固定 CBETA TEI 与校勘注记，同时区分 T1564、T1568、T1569、T1579 四种根本论和五部汉地注疏；共同术语、同一作者、同一根本论、传统责任题记或机器相似度都不能单独证明作品相同、作者无争议、文本已成批校本或佛陀逐字亲说。",
  },
  files,
};

const outputPath = resolve(root, `data/corpus/cbeta/batch-v${version}.json`);
await writeFile(outputPath, `${JSON.stringify(batch, null, 2)}\n`, "utf8");
console.log(`CBETA T42 审计完成：${files.length}/${inventory.totals.records} 个固定来源记录；新增 ${batchWorkIds.size} 个作品、${files.length} 个表达、${batch.collection.newStableSegments} 个稳定行段、${batch.collection.newFolios} 个版页单元、${batch.collection.newJuans} 卷。`);

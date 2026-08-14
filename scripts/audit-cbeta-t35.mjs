import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { buildPageNavigation, parseCbetaReadingLines } from "../src/lib/cbeta-tei.mjs";

const root = process.cwd();
const version = "4.2.0";
const expectedCommit = "2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9";
const sourceArgument = process.argv.find((argument) => argument.startsWith("--source-dir="));
if (!sourceArgument) {
  console.error("用法：node scripts/audit-cbeta-t35.mjs --source-dir=/固定提交的/xml-p5");
  process.exit(1);
}
const sourceRoot = resolve(sourceArgument.slice("--source-dir=".length));
const actualCommit = execFileSync("git", ["-C", sourceRoot, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (actualCommit !== expectedCommit) throw new Error(`上游工作树必须固定到 ${expectedCommit}`);

const inventoryPath = "data/gbcr/cbeta-taisho-t35-inventory-v0.1.0.json";
const inventory = JSON.parse(await readFile(resolve(root, inventoryPath), "utf8"));
const baseCatalogPath = "data/corpus/cbeta/catalog-v4.1.0.json";
const baseCatalog = JSON.parse(await readFile(resolve(root, baseCatalogPath), "utf8"));
const sourceUnits = (file) => file.sourceParts ?? [file];
const controlledPaths = new Set(baseCatalog.files.flatMap(sourceUnits).map((file) => file.upstreamPath));
const candidates = inventory.records.filter((record) => !controlledPaths.has(record.upstreamPath));
if (inventory.totals.records !== 5 || inventory.totals.upstreamBytes !== 11056559 || candidates.length !== 5) {
  throw new Error(`T35 固定来源分母或新增记录漂移：${inventory.totals.records}/${candidates.length}`);
}

const relation = (type, groupId, label, evidence, ids) => ({
  type,
  groupId,
  label,
  evidence,
  externalIds: { cbeta: ids },
});
const sixtyFascicleHuayanExegesis = relation(
  "commentaries_and_doctrinal_expositions_on_sixty_fascicle_avatamsaka_distinct",
  "sixty-fascicle-huayan-exegesis-t0278-t1731-t1734",
  "六十卷本《大方广佛华严经》与四部游意、搜玄、探玄及纲目",
  "DILA T0278、T1731、T1732、T1733、T1734 规范记录互相标示相关经典。四部汉地撰述共享六十卷本解释对象，但作者、体例、规模和结构不同；根本经、教义游意、经疏与纲目保持五个作品实体。",
  ["T0278", "T1731", "T1732", "T1733", "T1734"],
);
const zhiyanFazangCommentaries = relation(
  "related_commentaries_on_same_canonical_translation_distinct",
  "huayan-commentaries-t1732-t1733",
  "智俨《搜玄记》与法藏《探玄记》",
  "T1732 与 T1733 都解释 T0278，但分别题为智俨述、法藏述，卷数、组织和正文均不同；师承或共同根经不能据以合并为同一注疏作品。",
  ["T0278", "T1732", "T1733"],
);
const fazangHuayanWorks = relation(
  "related_commentary_and_outline_by_same_author_distinct",
  "fazang-huayan-t1733-t1734",
  "法藏《华严经探玄记》与《花严经文义纲目》",
  "DILA 的法藏著作记录分别列出 T1733 与 T1734；二十卷探玄记与一卷文义纲目虽同作者、同根经，体例与范围不同，保持两个作品实体。",
  ["T0278", "T1733", "T1734"],
);
const eightyFascicleHuayanCommentary = relation(
  "commentary_and_subcommentary_on_eighty_fascicle_avatamsaka_distinct",
  "eighty-fascicle-huayan-t0279-t1735-t1736",
  "八十卷本《大方广佛华严经》、澄观疏与随疏演义钞",
  "DILA T1735 规范记录明确关联 T0279 与 T1736；T1735 是对八十卷本的独立经疏，T1736 是下一卷所收的独立演义钞。根本经、疏与再注释分层登记。",
  ["T0279", "T1735", "T1736"],
);

const d = (workId, sourceRole, relations, summary) => ({
  workId: `gbcr:work:${workId}`,
  sourceRole,
  workIdentityStatus: "verified_distinct_commentary_work",
  relations,
  summary,
  completeness: "complete_source_file",
});
const decisions = new Map(Object.entries({
  T1731: d("huayan-youyi-jizang", "sinitic_authored_doctrinal_exposition", [sixtyFascicleHuayanExegesis], "吉藏《华严游意》教义阐释完整来源。"),
  T1732: d("huayan-souxuan-fenqi-tongzhi-fanggui-zhiyan", "sinitic_authored_sutra_commentary", [sixtyFascicleHuayanExegesis, zhiyanFazangCommentaries], "智俨《搜玄分齐通智方轨》完整来源。"),
  T1733: d("huayan-tanxuan-ji-fazang", "sinitic_authored_sutra_commentary", [sixtyFascicleHuayanExegesis, zhiyanFazangCommentaries, fazangHuayanWorks], "法藏《华严经探玄记》完整来源。"),
  T1734: d("huayan-wenyi-gangmu-fazang", "sinitic_authored_doctrinal_outline", [sixtyFascicleHuayanExegesis, fazangHuayanWorks], "法藏《花严经文义纲目》完整来源。"),
  T1735: d("huayan-jing-shu-chengguan", "sinitic_authored_sutra_commentary", [eightyFascicleHuayanCommentary], "澄观《大方广佛华严经疏》完整来源。"),
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
  if (!decision) throw new Error(`T35 出现未裁决经号 ${canonId}`);

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
      tradition: "汉传佛教 · 经疏部 · 华严",
      language: "汉文",
      canonRef: `大正藏 T35, no. ${canonId.slice(1)}`,
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
  ["T1731", "T1732"], ["T1732", "T1733"], ["T1733", "T1734"],
  ["T1733", "T1735"], ["T1734", "T1735"],
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
  rightsCategory: "Individually reviewed CBETA TEI files in Taishō volumes T01–T35; T35 source-record closure",
  workOverrides: {},
  fileOverrides: {},
  collection: {
    id: "CBETA-TAISHO-T35",
    title: "大正藏 T35 华严经疏部固定来源记录",
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
    workCountingDecision: "T35 的 5 份来源记录登记为 5 个完整表达和 5 个独立华严经疏作品。T1731–T1734 关联 T0278 六十卷本，但游意、搜玄、探玄与纲目体例不同；T1733、T1734 虽同为法藏作品仍保持独立；T1735 关联 T0279 八十卷本，并与 T36 的 T1736 形成疏—再注释关系。所有记录均不标作根本经表达或佛陀逐字亲说。",
  },
  boundaryAudit: {
    status: "verified_source_integrity_root_translation_commentary_outline_same_author_and_subcommentary_boundaries_recorded",
    existingControlledRecords: ["T0278", "T0279"],
    verifiedTranslationGroups: [],
    rootTreatiseCommentaryGroups: [
      sixtyFascicleHuayanExegesis.groupId,
      eightyFascicleHuayanCommentary.groupId,
    ],
    subcommentaryGroups: [eightyFascicleHuayanCommentary.groupId],
    relatedDistinctWorkGroups: [
      sixtyFascicleHuayanExegesis.groupId,
      zhiyanFazangCommentaries.groupId,
      fazangHuayanWorks.groupId,
    ],
    candidateRelationsNotMerged: [
      "T0278↔T1731–T1734（六十卷根本经与四部不同体例的游意、经疏及纲目分层保存）",
      "T1732↔T1733（智俨搜玄记与法藏探玄记共享根经但为两个注疏作品）",
      "T1733↔T1734（法藏同作者的探玄记与文义纲目保持两个作品）",
      "T0279↔T1735（八十卷根本经与澄观疏分列作品）",
      "T1735↔T1736（澄观疏与下一卷随疏演义钞为注释—再注释关系）",
    ],
    partialWorkWitnesses: [],
    sourceRoles,
    textualComparison: {
      algorithm: "Unicode text from stable reading lines; punctuation/space removed; unique character 5-gram containment and Jaccard. Text overlap only records quotation and exegetical dependence; it cannot merge root translations, doctrinal expositions, direct commentaries, outlines or subcommentaries.",
      pairs: comparisonPairs,
    },
    authoritySources: [
      "https://github.com/cbeta-org/xml-p5/tree/2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9/T/T35",
      "https://authority.dila.edu.tw/catalog/search.php?code=CA0001372",
      "https://authority.dila.edu.tw/catalog/search.php?code=CA0001373",
      "https://authority.dila.edu.tw/catalog/search.php?code=CA0001435",
      "https://authority.dila.edu.tw/catalog/search.php?code=CA0001392",
      "https://authority.dila.edu.tw/catalog/search.php?code=CA0001417",
      "https://authority.dila.edu.tw/catalog/search.php?code=CA0001420",
      "https://authority.dila.edu.tw/catalog/search.php?code=CA0001411",
      "https://authority.dila.edu.tw/catalog/search.php?code=CA0001409",
      "https://authority.dila.edu.tw/person/search.php?aid=A000329",
      "https://authority.dila.edu.tw/person/search.php?aid=A001304",
      "https://authority.dila.edu.tw/person/search.php?aid=A002450",
      "https://authority.dila.edu.tw/person/search.php?aid=A001755",
    ],
    caveat: "T35 是华严经疏部，不是佛说经集合。平台完整保存固定来源，同时区分 T0278 六十卷译本、T0279 八十卷译本、游意、直接注疏、纲目和再注释；共同根经、师承、同作者、传统责任题记、正文引文或机器相似度都不能单独证明作品相同、作者无争议或佛陀逐字亲说。",
  },
  files,
};

if (
  batch.collection.newSourceRecords !== 5 || batch.collection.newSourceBytes !== 11056559 ||
  batch.collection.newStableSegments !== 82994 || batch.collection.newFolios !== 2938 ||
  batch.collection.newJuans !== 87 ||
  batch.collection.verifiedSameWorkExpressions !== 0 || batch.collection.verifiedPartialWorkWitnesses !== 0 ||
  batch.collection.provisionalRecords !== 0 || batch.collection.newFullSourceTexts !== 5 ||
  batch.collection.newPartialSourceWitnesses !== 0 || batch.collection.relationAnnotatedRecords !== 5 ||
  batch.collection.newWorks !== 5 || batch.collection.controlledWorks !== 5 ||
  batch.collection.attributionBoundaryRecords !== 5
) throw new Error(`T35 关系、归属或作品边界统计漂移：${JSON.stringify(batch.collection)}`);

await writeFile(resolve(root, `data/corpus/cbeta/batch-v${version}.json`), `${JSON.stringify(batch, null, 2)}\n`, "utf8");
console.log(`CBETA T35 审计完成：5/5 个固定来源记录；新增 ${batch.collection.newWorks} 个作品、${batch.collection.newSourceRecords} 个表达、${batch.collection.newStableSegments} 个稳定行段、${batch.collection.newFolios} 个版页单元、${batch.collection.newJuans} 卷。`);

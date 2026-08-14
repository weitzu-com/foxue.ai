import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { buildPageNavigation, parseCbetaReadingLines } from "../src/lib/cbeta-tei.mjs";

const root = process.cwd();
const version = "4.8.0";
const expectedCommit = "2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9";
const sourceArgument = process.argv.find((argument) => argument.startsWith("--source-dir="));
if (!sourceArgument) {
  console.error("用法：node scripts/audit-cbeta-t41.mjs --source-dir=/固定提交的/xml-p5");
  process.exit(1);
}
const sourceRoot = resolve(sourceArgument.slice("--source-dir=".length));
const actualCommit = execFileSync("git", ["-C", sourceRoot, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (actualCommit !== expectedCommit) throw new Error(`上游工作树必须固定到 ${expectedCommit}`);

const inventoryPath = "data/gbcr/cbeta-taisho-t41-inventory-v0.1.0.json";
const inventory = JSON.parse(await readFile(resolve(root, inventoryPath), "utf8"));
const baseCatalogPath = "data/corpus/cbeta/catalog-v4.7.0.json";
const baseCatalog = JSON.parse(await readFile(resolve(root, baseCatalogPath), "utf8"));
const sourceUnits = (file) => file.sourceParts ?? [file];
const controlledPaths = new Set(baseCatalog.files.flatMap(sourceUnits).map((file) => file.upstreamPath));
const candidates = inventory.records.filter((record) => !controlledPaths.has(record.upstreamPath));
if (inventory.totals.records !== 3 || inventory.totals.upstreamBytes !== 16077486 || candidates.length !== 3) {
  throw new Error(`T41 固定来源分母或新增记录漂移：${inventory.totals.records}/${candidates.length}`);
}

const relation = (type, groupId, label, evidence, ids) => ({
  type,
  groupId,
  label,
  evidence,
  externalIds: { cbeta: ids },
});
const fullTreatiseCommentaries = relation(
  "commentaries_on_abhidharmakosa_treatise_distinct",
  "abhidharmakosa-bhasya-commentaries-t1558-t1821-t1822",
  "玄奘译《阿毘达磨俱舍论》与普光《俱舍论记》、法宝《俱舍论疏》",
  "DILA 权威记录将 T1821、T1822 均关联到 T1558。两部三十卷唐代注疏分别署普光与法宝，具有独立作者责任、解释结构和全文边界，不是根本论的另一表达。",
  ["T1558", "T1821", "T1822"],
);
const parallelCommentaries = relation(
  "parallel_commentaries_on_same_treatise_distinct",
  "abhidharmakosa-parallel-commentaries-t1821-t1822",
  "普光《俱舍论记》与法宝《俱舍论疏》",
  "两书同释 T1558 且均为三十卷，但传统作者题记、行文与五字片段统计显著不同；共享引论不能据以合并。",
  ["T1558", "T1821", "T1822"],
);
const verseCommentary = relation(
  "commentary_on_abhidharmakosa_bhasya_and_verses_distinct",
  "abhidharmakosa-verse-commentary-t1558-t1560-t1823",
  "《阿毘达磨俱舍论》《俱舍论本颂》与圆晖《俱舍论颂疏》",
  "DILA 权威记录将 T1823 同时关联 T1558 与 T1560。圆晖疏以俱舍颂为组织核心，兼依完整论释，须与论本、根本颂及两部通论注疏分开。",
  ["T1558", "T1560", "T1823"],
);
const commentaryScope = relation(
  "full_bhasya_and_verse_commentary_scope_distinct",
  "abhidharmakosa-commentary-scope-t1821-t1823",
  "两部俱舍通论注疏与一部俱舍颂疏",
  "T1821、T1822 直接贯释 T1558，T1823 以 T1560 根本颂为结构并参照 T1558；共同术语和三十卷规模不能消除注释对象与组织范围差异。",
  ["T1558", "T1560", "T1821", "T1822", "T1823"],
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
  T1821: d("abhidharmakosa-ji-puguang", "sinitic_authored_abhidharmakosa_bhasya_commentary", [fullTreatiseCommentaries, parallelCommentaries, commentaryScope], "普光《俱舍论记》完整来源。"),
  T1822: d("abhidharmakosa-shu-fabao", "sinitic_authored_abhidharmakosa_bhasya_commentary", [fullTreatiseCommentaries, parallelCommentaries, commentaryScope], "法宝《俱舍论疏》完整来源。"),
  T1823: d("abhidharmakosa-karika-shu-yuanhui", "sinitic_authored_abhidharmakosa_verse_commentary", [verseCommentary, commentaryScope], "圆晖《俱舍论颂疏》完整来源。"),
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
  if (!decision) throw new Error(`T41 出现未裁决经号 ${canonId}`);

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
      tradition: "汉传佛教 · 阿毘达磨论疏部 · 俱舍论与俱舍颂注疏",
      language: "汉文",
      canonRef: `大正藏 T41, no. ${canonId.slice(1)}`,
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
  ["T1821", "T1822"], ["T1821", "T1823"], ["T1822", "T1823"],
].map(([left, right]) => compareBodies(left, right));
const sourceRoles = Object.fromEntries([...new Set(files.map((file) => file.sourceRole))].sort().map((role) => [
  role,
  files.filter((file) => file.sourceRole === role).map((file) => file.id),
]));
const batchWorkIds = new Set(files.map((file) => file.workId));
const rootTreatiseCommentaryGroups = [
  "abhidharmakosa-bhasya-commentaries-t1558-t1821-t1822",
  "abhidharmakosa-verse-commentary-t1558-t1560-t1823",
];
const batch = {
  schema: "https://foxue.ai/schemas/cbeta-controlled-batch-v1.0",
  version,
  publishedAt: "2026-08-15",
  baseCatalog: baseCatalogPath,
  inventory: inventoryPath,
  rightsCategory: "Individually reviewed CBETA TEI files in Taishō volumes T01–T41; T41 source-record closure",
  workOverrides: {},
  fileOverrides: {},
  collection: {
    id: "CBETA-TAISHO-T41",
    title: "大正藏 T41 俱舍论注疏部固定来源记录",
    sourceRecordDenominator: 3,
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
    workCountingDecision: "T41 的 3 份来源记录登记为 3 个完整表达和 3 个独立阿毘达磨注疏作品。T1821 普光《俱舍论记》和 T1822 法宝《俱舍论疏》均直接解释 T1558，但保持不同作者责任与全文边界；T1823 圆晖《俱舍论颂疏》兼依 T1558 与 T1560，按颂疏范围独立保存。三者均不标作 T1558/T1560 的同作品表达、世亲论本或佛陀逐字亲说。",
  },
  boundaryAudit: {
    status: "verified_source_integrity_abhidharmakosa_root_treatise_parallel_commentary_and_verse_commentary_scope_boundaries_recorded",
    existingControlledRecords: ["T1558", "T1560"],
    verifiedTranslationGroups: [],
    rootVinayaCommentaryGroups: [],
    rootTreatiseCommentaryGroups,
    subcommentaryGroups: [],
    scopeBoundaryGroups: ["abhidharmakosa-commentary-scope-t1821-t1823"],
    relatedDistinctWorkGroups: ["abhidharmakosa-parallel-commentaries-t1821-t1822"],
    candidateRelationsNotMerged: [
      "T1558↔T1821/T1822（玄奘译俱舍论与普光、法宝两部独立唐疏分层保存）",
      "T1558/T1560↔T1823（完整论释、根本颂与圆晖颂疏按注释对象和范围分层）",
      "T1821↔T1822↔T1823（共同俱舍传统、三十卷规模与引论文字不构成同一作品）",
    ],
    partialWorkWitnesses: [],
    sourceRoles,
    textualComparison: {
      algorithm: "Unicode text from stable reading lines; punctuation/space removed; unique character 5-gram containment and Jaccard. Text overlap only records shared technical vocabulary, quotation and exegetical dependence; it cannot merge the root treatise, root verses, or three commentaries with different authors and scope.",
      pairs: comparisonPairs,
    },
    authoritySources: [
      "https://github.com/cbeta-org/xml-p5/tree/2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9/T/T41",
      ...["CA0001890", "CA0001898", "CA0001893"].map((code) => `https://authority.dila.edu.tw/catalog/search.php?code=${code}`),
    ],
    caveat: "T41 是唐代俱舍论注疏集合，不是佛说经或世亲论本集合。平台完整保存固定来源，同时区分 T1558 完整论释、T1560 根本颂、两部通论注疏与一部颂疏；共同术语、相近题名、同为三十卷、传统责任题记或机器相似度都不能单独证明作品相同、作者无争议或佛陀逐字亲说。",
  },
  files,
};

const outputPath = resolve(root, `data/corpus/cbeta/batch-v${version}.json`);
await writeFile(outputPath, `${JSON.stringify(batch, null, 2)}\n`, "utf8");
console.log(`CBETA T41 审计完成：${files.length}/${inventory.totals.records} 个固定来源记录；新增 ${batchWorkIds.size} 个作品、${files.length} 个表达、${batch.collection.newStableSegments} 个稳定行段、${batch.collection.newFolios} 个版页单元、${batch.collection.newJuans} 卷。`);

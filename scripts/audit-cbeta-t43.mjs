import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { buildPageNavigation, parseCbetaReadingLines } from "../src/lib/cbeta-tei.mjs";

const root = process.cwd();
const version = "4.10.0";
const expectedCommit = "2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9";
const sourceArgument = process.argv.find((argument) => argument.startsWith("--source-dir="));
if (!sourceArgument) {
  console.error("用法：node scripts/audit-cbeta-t43.mjs --source-dir=/固定提交的/xml-p5");
  process.exit(1);
}
const sourceRoot = resolve(sourceArgument.slice("--source-dir=".length));
const actualCommit = execFileSync("git", ["-C", sourceRoot, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (actualCommit !== expectedCommit) throw new Error(`上游工作树必须固定到 ${expectedCommit}`);

const inventoryPath = "data/gbcr/cbeta-taisho-t43-inventory-v0.1.0.json";
const inventory = JSON.parse(await readFile(resolve(root, inventoryPath), "utf8"));
const baseCatalogPath = "data/corpus/cbeta/catalog-v4.9.0.json";
const baseCatalog = JSON.parse(await readFile(resolve(root, baseCatalogPath), "utf8"));
const sourceUnits = (file) => file.sourceParts ?? [file];
const controlledPaths = new Set(baseCatalog.files.flatMap(sourceUnits).map((file) => file.upstreamPath));
const candidates = inventory.records.filter((record) => !controlledPaths.has(record.upstreamPath));
if (inventory.totals.records !== 6 || inventory.totals.upstreamBytes !== 10412626 || candidates.length !== 6) {
  throw new Error(`T43 固定来源分母或新增记录漂移：${inventory.totals.records}/${candidates.length}`);
}

const relation = (type, groupId, label, evidence, ids) => ({
  type,
  groupId,
  label,
  evidence,
  externalIds: { cbeta: ids },
});
const yogacarabhumiAbridgedCommentary = relation(
  "abridged_commentary_on_yogacarabhumi_distinct",
  "yogacarabhumi-abridged-commentary-t1579-t1829",
  "《瑜伽师地论》与窺基《瑜伽师地论略纂》",
  "DILA 权威记录将 T1829 关联到 T1579。十六卷略纂具有窺基作者责任、选择性解释结构和完整来源边界，不是百卷根本论的另一表达。",
  ["T1579", "T1829"],
);
const chengWeishiCommentaries = relation(
  "commentaries_on_cheng_weishi_lun_distinct",
  "cheng-weishi-lun-commentaries-t1585-t1830-t1831-t1832",
  "《成唯识论》与《述记》《掌中枢要》《了义灯》",
  "DILA 权威记录将 T1830、T1831、T1832 关联到 T1585；三书的作者责任、体例、篇幅、解释层级和全文边界不同，均不是根本论的另一表达。",
  ["T1585", "T1830", "T1831", "T1832"],
);
const liaoyiDengSubcommentary = relation(
  "subcommentary_on_cheng_weishi_lun_shuji_distinct",
  "cheng-weishi-lun-shuji-subcommentary-t1830-t1832",
  "《成唯识论述记》与惠沼《成唯识论了义灯》",
  "DILA 同时将 T1832 关联到 T1585 与 T1830。了义灯保留惠沼责任、七卷组织和独立正文，是对根本论及述记传统的再解释，不是 T1830 的同作品表达。",
  ["T1585", "T1830", "T1832"],
);
const yanmiSubcommentary = relation(
  "subcommentary_on_cheng_weishi_lun_shuji_distinct",
  "cheng-weishi-lun-shuji-subcommentary-t1830-t1833",
  "《成唯识论述记》与智周《成唯识论演秘》",
  "DILA 将 T1833 关联到 T1830。演秘保留智周责任、七卷组织和独立正文，是对述记的再注释，不是窺基述记的同作品表达。",
  ["T1830", "T1833"],
);
const shujiShuyaoScope = relation(
  "full_commentary_and_essential_companion_scope_distinct",
  "cheng-weishi-lun-commentary-scope-t1830-t1831",
  "《成唯识论述记》与《成唯识论掌中枢要》的解释范围",
  "T1830 以十卷述记逐层解释 T1585，T1831 以两卷掌中枢要提举宗要；共同作者和根本论不能消除体例、篇幅与解释范围差异。",
  ["T1585", "T1830", "T1831"],
);
const shujiShuyaoDistinct = relation(
  "same_author_same_root_commentaries_distinct",
  "kuiji-cheng-weishi-commentaries-t1830-t1831",
  "窺基《成唯识论述记》与《掌中枢要》",
  "两书同署窺基并解释 T1585，但题名、十卷与两卷规模、结构和全文锚点不同，保持两个相关但不同作品。",
  ["T1585", "T1830", "T1831"],
);
const parallelSubcommentaries = relation(
  "parallel_subcommentaries_distinct",
  "cheng-weishi-shuji-parallel-subcommentaries-t1832-t1833",
  "惠沼《了义灯》与智周《演秘》",
  "两书同处成唯识论述记解释传统，但分别署惠沼、智周，具有独立组织和全文边界；共同师承与术语不能据以合并。",
  ["T1830", "T1832", "T1833"],
);
const kuijiYogacaraWorks = relation(
  "kuiji_yogacara_commentaries_related_distinct",
  "kuiji-yogacara-commentaries-t1829-t1830-t1831-t1834",
  "窺基的四部瑜伽行派论疏",
  "T1829、T1830、T1831、T1834 均署窺基，但分别解释 T1579、T1585、T1590，并采用略纂、述记、枢要等不同体例；共同作者和唯识传统只构成相关证据。",
  ["T1579", "T1585", "T1590", "T1829", "T1830", "T1831", "T1834"],
);
const vimsatikaCommentary = relation(
  "commentary_on_vimsatika_distinct",
  "vimsatika-commentary-t1590-t1834",
  "《唯识二十论》与窺基《唯识二十论述记》",
  "DILA 权威记录将 T1834 关联到玄奘译 T1590。两卷述记具有窺基责任和独立解释结构，不是世亲根本论或其玄奘译表达。",
  ["T1590", "T1834"],
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
  T1829: d("yogacarabhumi-luezuan-kuiji", "sinitic_authored_yogacarabhumi_abridged_commentary", "汉传佛教 · 瑜伽论疏部 · 瑜伽师地论略纂", [yogacarabhumiAbridgedCommentary, kuijiYogacaraWorks], "窺基《瑜伽师地论略纂》完整来源。"),
  T1830: d("cheng-weishi-lun-shuji-kuiji", "sinitic_authored_cheng_weishi_lun_commentary", "汉传佛教 · 唯识论疏部 · 成唯识论述记", [chengWeishiCommentaries, liaoyiDengSubcommentary, yanmiSubcommentary, shujiShuyaoScope, shujiShuyaoDistinct, kuijiYogacaraWorks], "窺基《成唯识论述记》完整来源。"),
  T1831: d("cheng-weishi-lun-zhangzhong-shuyao-kuiji", "sinitic_authored_cheng_weishi_lun_essential_commentary", "汉传佛教 · 唯识论疏部 · 成唯识论枢要", [chengWeishiCommentaries, shujiShuyaoScope, shujiShuyaoDistinct, kuijiYogacaraWorks], "窺基《成唯识论掌中枢要》完整来源。"),
  T1832: d("cheng-weishi-lun-liaoyi-deng-huizhao", "sinitic_authored_cheng_weishi_lun_commentary_and_subcommentary", "汉传佛教 · 唯识论疏部 · 成唯识论再注释", [chengWeishiCommentaries, liaoyiDengSubcommentary, parallelSubcommentaries], "惠沼《成唯识论了义灯》完整来源。"),
  T1833: d("cheng-weishi-lun-yanmi-zhizhou", "sinitic_authored_cheng_weishi_lun_subcommentary", "汉传佛教 · 唯识论疏部 · 成唯识论述记再注释", [yanmiSubcommentary, parallelSubcommentaries], "智周《成唯识论演秘》完整来源。"),
  T1834: d("vimsatika-shuji-kuiji", "sinitic_authored_vimsatika_commentary", "汉传佛教 · 唯识论疏部 · 唯识二十论述记", [vimsatikaCommentary, kuijiYogacaraWorks], "窺基《唯识二十论述记》完整来源。"),
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
  if (!decision) throw new Error(`T43 出现未裁决经号 ${canonId}`);

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
      canonRef: `大正藏 T43, no. ${canonId.slice(1)}`,
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
  ["T1829", "T1830"], ["T1829", "T1831"], ["T1829", "T1832"], ["T1829", "T1833"], ["T1829", "T1834"],
  ["T1830", "T1831"], ["T1830", "T1832"], ["T1830", "T1833"], ["T1830", "T1834"],
  ["T1831", "T1832"], ["T1831", "T1833"], ["T1831", "T1834"],
  ["T1832", "T1833"], ["T1832", "T1834"], ["T1833", "T1834"],
].map(([left, right]) => compareBodies(left, right));
const sourceRoles = Object.fromEntries([...new Set(files.map((file) => file.sourceRole))].sort().map((role) => [
  role,
  files.filter((file) => file.sourceRole === role).map((file) => file.id),
]));
const batchWorkIds = new Set(files.map((file) => file.workId));
const rootTreatiseCommentaryGroups = [
  "yogacarabhumi-abridged-commentary-t1579-t1829",
  "cheng-weishi-lun-commentaries-t1585-t1830-t1831-t1832",
  "vimsatika-commentary-t1590-t1834",
];
const batch = {
  schema: "https://foxue.ai/schemas/cbeta-controlled-batch-v1.0",
  version,
  publishedAt: "2026-08-15",
  baseCatalog: baseCatalogPath,
  inventory: inventoryPath,
  rightsCategory: "Individually reviewed CBETA TEI files in Taishō volumes T01–T43; T43 source-record closure",
  workOverrides: {},
  fileOverrides: {},
  collection: {
    id: "CBETA-TAISHO-T43",
    title: "大正藏 T43 瑜伽论疏部固定来源记录",
    sourceRecordDenominator: 6,
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
    workCountingDecision: "T43 的 6 份来源记录登记为 6 个完整表达和 6 个独立汉地唯识论疏作品。T1829、T1830/T1831/T1832、T1834 分别连接 T1579、T1585、T1590；T1832、T1833 又分别连接 T1830 的再注释层。共同作者、唯识传统、根本论或述记不能消除作者责任、体例、篇幅、解释层级与全文边界。六者均不标作根本论的同作品表达、印度论本或佛陀逐字亲说。",
  },
  boundaryAudit: {
    status: "verified_source_integrity_yogacara_root_treatise_commentary_subcommentary_parallel_commentary_author_and_scope_boundaries_recorded",
    existingControlledRecords: ["T1579", "T1585", "T1590"],
    verifiedTranslationGroups: [],
    rootVinayaCommentaryGroups: [],
    rootTreatiseCommentaryGroups,
    subcommentaryGroups: ["cheng-weishi-lun-shuji-subcommentary-t1830-t1832", "cheng-weishi-lun-shuji-subcommentary-t1830-t1833"],
    scopeBoundaryGroups: ["cheng-weishi-lun-commentary-scope-t1830-t1831"],
    relatedDistinctWorkGroups: ["kuiji-cheng-weishi-commentaries-t1830-t1831", "cheng-weishi-shuji-parallel-subcommentaries-t1832-t1833", "kuiji-yogacara-commentaries-t1829-t1830-t1831-t1834"],
    candidateRelationsNotMerged: [
      "T1579↔T1829、T1585↔T1830/T1831/T1832、T1590↔T1834（三种根本论与汉地直接论疏分层保存）",
      "T1830↔T1832/T1833（窺基述记与惠沼、智周再注释按作者和解释层级分层）",
      "T1830↔T1831（共同窺基作者责任和 T1585 根本论不消除述记与枢要的体例及范围差异）",
      "T1829↔T1830↔T1831↔T1834（共同窺基作者责任和唯识传统不构成同一作品）",
    ],
    partialWorkWitnesses: [],
    sourceRoles,
    textualComparison: {
      algorithm: "Unicode text from stable reading lines; punctuation/space removed; unique character 5-gram containment and Jaccard. Text overlap only records shared technical vocabulary, quotation and exegetical dependence; it cannot merge three root treatises, six commentaries, two subcommentary layers or works with different authors and scope.",
      pairs: comparisonPairs,
    },
    authoritySources: [
      "https://github.com/cbeta-org/xml-p5/tree/2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9/T/T43",
      ...["CA0003829", "CA0003828", "CA0000452", "CA0000463", "CA0000462", "CA0000456", "CA0000466", "CA0003317", "CA0003318"].map((code) => `https://authority.dila.edu.tw/catalog/search.php?code=${code}`),
    ],
    caveat: "T43 是汉地瑜伽行派论疏集合，不是佛说经或印度根本论集合。平台完整保存固定 CBETA TEI 与校勘注记，同时区分 T1579、T1585、T1590 三种根本论、窺基直接论疏、惠沼和智周再注释，以及同作者异作与述记/枢要范围；共同术语、师承、作者、根本论、传统责任题记或机器相似度都不能单独证明作品相同、作者无争议、文本已成批校本或佛陀逐字亲说。",
  },
  files,
};

const outputPath = resolve(root, `data/corpus/cbeta/batch-v${version}.json`);
await writeFile(outputPath, `${JSON.stringify(batch, null, 2)}\n`, "utf8");
console.log(`CBETA T43 审计完成：${files.length}/${inventory.totals.records} 个固定来源记录；新增 ${batchWorkIds.size} 个作品、${files.length} 个表达、${batch.collection.newStableSegments} 个稳定行段、${batch.collection.newFolios} 个版页单元、${batch.collection.newJuans} 卷。`);

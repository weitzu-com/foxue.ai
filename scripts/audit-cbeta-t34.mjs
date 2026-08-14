import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { buildPageNavigation, parseCbetaReadingLines } from "../src/lib/cbeta-tei.mjs";

const root = process.cwd();
const version = "4.1.0";
const expectedCommit = "2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9";
const sourceArgument = process.argv.find((argument) => argument.startsWith("--source-dir="));
if (!sourceArgument) {
  console.error("用法：node scripts/audit-cbeta-t34.mjs --source-dir=/固定提交的/xml-p5");
  process.exit(1);
}
const sourceRoot = resolve(sourceArgument.slice("--source-dir=".length));
const actualCommit = execFileSync("git", ["-C", sourceRoot, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (actualCommit !== expectedCommit) throw new Error(`上游工作树必须固定到 ${expectedCommit}`);

const inventoryPath = "data/gbcr/cbeta-taisho-t34-inventory-v0.1.0.json";
const inventory = JSON.parse(await readFile(resolve(root, inventoryPath), "utf8"));
const baseCatalogPath = "data/corpus/cbeta/catalog-v4.0.0.json";
const baseCatalog = JSON.parse(await readFile(resolve(root, baseCatalogPath), "utf8"));
const sourceUnits = (file) => file.sourceParts ?? [file];
const controlledPaths = new Set(baseCatalog.files.flatMap(sourceUnits).map((file) => file.upstreamPath));
const candidates = inventory.records.filter((record) => !controlledPaths.has(record.upstreamPath));
if (inventory.totals.records !== 13 || inventory.totals.upstreamBytes !== 13196188 || candidates.length !== 13) {
  throw new Error(`T34 固定来源分母或新增记录漂移：${inventory.totals.records}/${candidates.length}`);
}

const relation = (type, groupId, label, evidence, ids) => ({
  type,
  groupId,
  label,
  evidence,
  externalIds: { cbeta: ids },
});
const lotusExegesis = relation(
  "lotus_sutra_commentary_exposition_and_subcommentary_distinct",
  "lotus-exegesis-t1718-t1725",
  "《法华经》文句、玄论、义疏、游意、玄赞、宗要与再注释",
  "DILA 的 T0262 规范记录逐项关联 T1718–T1725；这些文本共享《妙法莲华经》解释对象，却由不同作者、体例和注释层形成，根本经、直接注释、教义阐释和再注释保持独立作品。",
  ["T0262", "T1718", "T1719", "T1720", "T1721", "T1722", "T1723", "T1724", "T1725"],
);
const lotusWenjuSubcommentary = relation(
  "subcommentary_on_commentary_verified",
  "lotus-wenju-t1718-t1719",
  "智顗《妙法莲华经文句》与湛然《法华文句记》",
  "DILA T1718、T1719 规范记录互相连接，T1719 是承接 T1718 文句层的独立再注释，不是《法华经》正文表达，也不是 T1718 的另一版本。",
  ["T1718", "T1719"],
);
const jizangLotusWorks = relation(
  "related_commentaries_by_same_author_distinct",
  "jizang-lotus-t1720-t1722",
  "吉藏《法华玄论》《法华义疏》《法华游意》",
  "三部作品作者相同且同释《法华经》，但玄论、逐文义疏与游意的体例、范围和结构不同；同行研究分别列举并比较这些著作，不能按作者与题名合并。",
  ["T0262", "T1720", "T1721", "T1722"],
);
const lotusXuanzanSubcommentary = relation(
  "subcommentary_on_commentary_verified",
  "lotus-xuanzan-t1723-t1724",
  "窺基《妙法莲华经玄赞》与慧沼《法华玄赞义决》",
  "DILA T1723 与 T1724 规范记录互相连接；《义决》解释《玄赞》，两者分别是注释与再注释作品。",
  ["T1723", "T1724"],
);
const guanyinChapterExegesis = relation(
  "commentary_on_canonical_chapter_verified",
  "lotus-guanyin-chapter-t1726-t1729",
  "《法华经·观世音菩萨普门品》的玄义、义疏与两部记",
  "DILA 把 T1726、T1728 的解释对象明确标为 T0262 第二十五品，并分别连接 T1727、T1729。章节、两部直接疏释和两部再注释保持五个层次，不把章节注释冒充整部经的新译本。",
  ["T0262", "T1726", "T1727", "T1728", "T1729"],
);
const guanyinXuanyiSubcommentary = relation(
  "subcommentary_on_commentary_verified",
  "guanyin-xuanyi-t1726-t1727",
  "智顗、灌顶《观音玄义》与知礼《观音玄义记》",
  "T1727 的题名、卷首和 DILA 关系都明确其为 T1726《观音玄义》的记；讲说记录与宋代再注释分列作品。",
  ["T1726", "T1727"],
);
const guanyinYishuSubcommentary = relation(
  "subcommentary_on_commentary_verified",
  "guanyin-yishu-t1728-t1729",
  "智顗、灌顶《观音义疏》与知礼《观音义疏记》",
  "T1729 的题名、卷首和 DILA 关系都明确其为 T1728《观音义疏》的记；两层文本及责任题记独立保存。",
  ["T1728", "T1729"],
);
const vajrasamadhiCommentary = relation(
  "commentary_on_disputed_origin_canonical_work_verified",
  "vajrasamadhi-t0273-t1730",
  "《金刚三昧经》与元晓《金刚三昧经论》",
  "DILA T1730 规范记录明确关联 T0273。平台把元晓的论登记为独立注释作品，同时继承 T0273 已公开的失译题记与东亚本土成书争议，不用注释关系反推根本经为无争议印度译本或佛陀逐字亲说。",
  ["T0273", "T1730"],
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
  T1718: d("lotus-sutra-wenju-zhiyi", "sinitic_taught_commentary_record", [lotusExegesis, lotusWenjuSubcommentary], "传统题记为智顗说的逐文法华经注释完整来源。"),
  T1719: d("lotus-wenju-ji-zhanran", "sinitic_authored_subcommentary", [lotusExegesis, lotusWenjuSubcommentary], "湛然《法华文句记》再注释完整来源。"),
  T1720: d("lotus-sutra-xuanlun-jizang", "sinitic_authored_doctrinal_exposition", [lotusExegesis, jizangLotusWorks], "吉藏《法华玄论》教义阐释完整来源。"),
  T1721: d("lotus-sutra-yishu-jizang", "sinitic_authored_sutra_commentary", [lotusExegesis, jizangLotusWorks], "吉藏《法华义疏》经文注释完整来源。"),
  T1722: d("lotus-sutra-youyi-jizang", "sinitic_authored_doctrinal_exposition", [lotusExegesis, jizangLotusWorks], "吉藏《法华游意》教义阐释完整来源。"),
  T1723: d("lotus-sutra-xuanzan-kuiji", "sinitic_authored_sutra_commentary", [lotusExegesis, lotusXuanzanSubcommentary], "窺基《妙法莲华经玄赞》完整来源。"),
  T1724: d("lotus-xuanzan-yijue-huizhao", "sinitic_authored_subcommentary", [lotusExegesis, lotusXuanzanSubcommentary], "慧沼《法华玄赞义决》再注释完整来源。"),
  T1725: d("lotus-sutra-zongyao-wonhyo", "sinitic_authored_doctrinal_exposition", [lotusExegesis], "元晓《法华宗要》教义宗要完整来源。"),
  T1726: d("guanyin-xuanyi-zhiyi-guanding", "sinitic_taught_commentary_record", [guanyinChapterExegesis, guanyinXuanyiSubcommentary], "智顗说、灌顶记的《观音玄义》完整来源。"),
  T1727: d("guanyin-xuanyi-ji-zhili", "sinitic_authored_subcommentary", [guanyinChapterExegesis, guanyinXuanyiSubcommentary], "知礼《观音玄义记》再注释完整来源。"),
  T1728: d("guanyin-yishu-zhiyi-guanding", "sinitic_taught_commentary_record", [guanyinChapterExegesis, guanyinYishuSubcommentary], "智顗说、灌顶记的《观音义疏》完整来源。"),
  T1729: d("guanyin-yishu-ji-zhili", "sinitic_authored_subcommentary", [guanyinChapterExegesis, guanyinYishuSubcommentary], "知礼《观音义疏记》再注释完整来源。"),
  T1730: d("vajrasamadhi-sutra-commentary-wonhyo", "sinitic_authored_sutra_commentary", [vajrasamadhiCommentary], "元晓《金刚三昧经论》独立注释作品完整来源。"),
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
  if (!decision) throw new Error(`T34 出现未裁决经号 ${canonId}`);

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
      tradition: "汉传佛教 · 经疏部",
      language: "汉文",
      canonRef: `大正藏 T34, no. ${canonId.slice(1)}`,
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
  ["T1718", "T1719"], ["T1720", "T1721"], ["T1720", "T1722"], ["T1723", "T1724"],
  ["T1725", "T1720"], ["T1726", "T1727"], ["T1726", "T1728"], ["T1728", "T1729"],
].map(([left, right]) => compareBodies(left, right));
const sourceRoles = Object.fromEntries([...new Set(files.map((file) => file.sourceRole))].sort().map((role) => [
  role,
  files.filter((file) => file.sourceRole === role).map((file) => file.id),
]));
const batchWorkIds = new Set(files.map((file) => file.workId));
const batch = {
  schema: "https://foxue.ai/schemas/cbeta-controlled-batch-v1.0",
  version,
  publishedAt: "2026-08-14",
  baseCatalog: baseCatalogPath,
  inventory: inventoryPath,
  rightsCategory: "Individually reviewed CBETA TEI files in Taishō volumes T01–T34; T34 source-record closure",
  workOverrides: {},
  fileOverrides: {},
  collection: {
    id: "CBETA-TAISHO-T34",
    title: "大正藏 T34 经疏部固定来源记录",
    sourceRecordDenominator: 13,
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
    workCountingDecision: "T34 的 13 份来源记录登记为 13 个完整表达和 13 个独立经疏作品。T1719、T1724、T1727、T1729 分别作为 T1718、T1723、T1726、T1728 的再注释；T1720–T1722 是吉藏同释《法华经》但体例不同的三部作品；T1726–T1729 只解释 T0262 第二十五品，不能冒充整部《法华经》的表达；T1730 是对来源身份仍有争议的 T0273 所作独立论释。所有记录均不标作根本经表达或佛陀逐字亲说。",
  },
  boundaryAudit: {
    status: "verified_source_integrity_commentary_subcommentary_chapter_root_text_and_authorship_boundaries_recorded",
    existingControlledRecords: [],
    verifiedTranslationGroups: [],
    rootTreatiseCommentaryGroups: [
      lotusExegesis.groupId,
      guanyinChapterExegesis.groupId,
      vajrasamadhiCommentary.groupId,
    ],
    subcommentaryGroups: [
      lotusWenjuSubcommentary.groupId,
      lotusXuanzanSubcommentary.groupId,
      guanyinXuanyiSubcommentary.groupId,
      guanyinYishuSubcommentary.groupId,
    ],
    relatedDistinctWorkGroups: [
      lotusExegesis.groupId,
      jizangLotusWorks.groupId,
      guanyinChapterExegesis.groupId,
    ],
    candidateRelationsNotMerged: [
      "T1718↔T1719（《法华文句》与《文句记》为注释—再注释关系）",
      "T1720–T1722（吉藏同释《法华经》的玄论、义疏与游意保持三个作品）",
      "T1723↔T1724（《法华玄赞》与《玄赞义决》为注释—再注释关系）",
      "T1718–T1725（共同解释《法华经》不构成同一注释作品）",
      "T1726↔T1727（《观音玄义》与《观音玄义记》为讲说记录—再注释关系）",
      "T1728↔T1729（《观音义疏》与《观音义疏记》为讲说记录—再注释关系）",
      "T1726–T1729（共同解释普门品，玄义、义疏及两部记保持四个作品）",
      "T0273↔T1730（根本经来源争议与元晓论释的作品责任分层保存）",
    ],
    partialWorkWitnesses: [],
    sourceRoles,
    textualComparison: {
      algorithm: "Unicode text from stable reading lines; punctuation/space removed; unique character 5-gram containment and Jaccard. Text overlap only records quotation and exegetical dependence; it cannot merge root texts, direct commentaries, doctrinal expositions or subcommentaries.",
      pairs: comparisonPairs,
    },
    authoritySources: [
      "https://github.com/cbeta-org/xml-p5/tree/2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9/T/T34",
      "https://authority.dila.edu.tw/catalog/search.php?code=CA0002222",
      "https://authority.dila.edu.tw/catalog/search.php?code=CA0002227",
      "https://authority.dila.edu.tw/catalog/search.php?code=CA0000871",
      "https://authority.dila.edu.tw/catalog/search.php?code=CA0000879",
      "https://authority.dila.edu.tw/catalog/search.php?code=CA0000884",
      "https://authority.dila.edu.tw/catalog/search.php?code=CA0001253",
      "https://authority.dila.edu.tw/catalog/search.php?code=CA0001254",
      "https://authority.dila.edu.tw/catalog/search.php?code=CA0001750",
      "https://authority.dila.edu.tw/catalog/search.php?code=CA0001751",
      "https://www.jstage.jst.go.jp/article/ibk/69/3/69_1156/_article",
      "https://www.kci.go.kr/kciportal/ci/sereArticleSearch/ciSereArtiView.kci?sereArticleSearchBean.artiId=ART001320677",
    ],
    caveat: "T34 是经疏部，不是佛说经集合。平台完整保存固定来源，同时区分整部根本经、单一章节、直接注释、教义阐释、讲说记录与再注释；共同经题、共同作者、传统责任题记、正文引文或机器相似度都不能单独证明作品相同、作者无争议或佛陀逐字亲说。",
  },
  files,
};

if (
  batch.collection.newSourceRecords !== 13 || batch.collection.newSourceBytes !== 13196188 ||
  batch.collection.newStableSegments !== 86768 || batch.collection.newFolios !== 3058 ||
  batch.collection.newJuans !== 70 ||
  batch.collection.verifiedSameWorkExpressions !== 0 || batch.collection.verifiedPartialWorkWitnesses !== 0 ||
  batch.collection.provisionalRecords !== 0 || batch.collection.newFullSourceTexts !== 13 ||
  batch.collection.newPartialSourceWitnesses !== 0 || batch.collection.relationAnnotatedRecords !== 13 ||
  batch.collection.newWorks !== 13 || batch.collection.controlledWorks !== 13 ||
  batch.collection.attributionBoundaryRecords !== 13
) throw new Error(`T34 关系、归属或作品边界统计漂移：${JSON.stringify(batch.collection)}`);

await writeFile(resolve(root, `data/corpus/cbeta/batch-v${version}.json`), `${JSON.stringify(batch, null, 2)}\n`, "utf8");
console.log(`CBETA T34 审计完成：13/13 个固定来源记录；新增 ${batch.collection.newWorks} 个作品、${batch.collection.newSourceRecords} 个表达、${batch.collection.newStableSegments} 个稳定行段、${batch.collection.newFolios} 个版页单元、${batch.collection.newJuans} 卷。`);

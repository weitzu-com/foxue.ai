import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { buildPageNavigation, parseCbetaReadingLines } from "../src/lib/cbeta-tei.mjs";

const root = process.cwd();
const version = "4.3.0";
const expectedCommit = "2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9";
const sourceArgument = process.argv.find((argument) => argument.startsWith("--source-dir="));
if (!sourceArgument) {
  console.error("用法：node scripts/audit-cbeta-t36.mjs --source-dir=/固定提交的/xml-p5");
  process.exit(1);
}
const sourceRoot = resolve(sourceArgument.slice("--source-dir=".length));
const actualCommit = execFileSync("git", ["-C", sourceRoot, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (actualCommit !== expectedCommit) throw new Error(`上游工作树必须固定到 ${expectedCommit}`);

const inventoryPath = "data/gbcr/cbeta-taisho-t36-inventory-v0.1.0.json";
const inventory = JSON.parse(await readFile(resolve(root, inventoryPath), "utf8"));
const baseCatalogPath = "data/corpus/cbeta/catalog-v4.2.0.json";
const baseCatalog = JSON.parse(await readFile(resolve(root, baseCatalogPath), "utf8"));
const sourceUnits = (file) => file.sourceParts ?? [file];
const controlledPaths = new Set(baseCatalog.files.flatMap(sourceUnits).map((file) => file.upstreamPath));
const candidates = inventory.records.filter((record) => !controlledPaths.has(record.upstreamPath));
if (inventory.totals.records !== 8 || inventory.totals.upstreamBytes !== 14520834 || candidates.length !== 8) {
  throw new Error(`T36 固定来源分母或新增记录漂移：${inventory.totals.records}/${candidates.length}`);
}

const relation = (type, groupId, label, evidence, ids) => ({
  type,
  groupId,
  label,
  evidence,
  externalIds: { cbeta: ids },
});
const eightyFascicleHuayanExegesis = relation(
  "commentaries_and_doctrinal_expositions_on_eighty_fascicle_avatamsaka_distinct",
  "eighty-fascicle-huayan-exegesis-t0279-t1735-t1743",
  "八十卷本《大方广佛华严经》与 T1735–T1743 九部疏、钞、论、纲目及讲义",
  "DILA T1735–T1743 规范记录均把 T0279 标为相关经典，其中 T1736 还明确关联 T1735。共享根经、正文引文或相邻经号只证明诠释关系；根本经、直接注疏、再注释、略策、章释、论、卷意、决疑论、观门骨目与宫廷讲义保持十个作品实体。",
  ["T0279", "T1735", "T1736", "T1737", "T1738", "T1739", "T1740", "T1741", "T1742", "T1743"],
);
const chengguanHuayanWorks = relation(
  "related_commentary_subcommentary_outline_and_verse_exposition_by_same_author_distinct",
  "chengguan-huayan-t1735-t1738",
  "澄观《华严经疏》《随疏演义钞》《大华严经略策》与《七处九会颂释章》",
  "DILA 分别登记 T1735–T1738，并给出独立规范码。四部虽同为澄观撰述并围绕 T0279，但六十卷疏、九十卷演义钞、一卷略策和一卷颂释章的体例、范围与依赖层级不同，保持四个作品实体。",
  ["T0279", "T1735", "T1736", "T1737", "T1738"],
);
const liTongxuanHuayanWorks = relation(
  "related_commentary_outline_and_doctrinal_treatise_by_same_author_distinct",
  "li-tongxuan-huayan-t1739-t1741",
  "李通玄《新华严经论》《卷卷大意略叙》与《修行次第决疑论》",
  "DILA 分别登记 T1739、T1740、T1741，并给出独立规范码和篇幅。三部虽同作者且都关联 T0279，但四十卷经论、一卷卷意与四卷决疑论体例不同，保持三个作品实体。",
  ["T0279", "T1739", "T1740", "T1741"],
);
const eightyFascicleHuayanCommentary = relation(
  "commentary_and_subcommentary_on_eighty_fascicle_avatamsaka_distinct",
  "eighty-fascicle-huayan-t0279-t1735-t1736",
  "八十卷本《大方广佛华严经》、澄观疏与随疏演义钞",
  "DILA T1735 与 T1736 规范记录互相标示相关经典；T1735 是对八十卷本的独立经疏，T1736 是依疏展开的独立演义钞。根本经、疏与再注释分层登记。",
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
  T1736: d("huayan-suishu-yanyi-chao-chengguan", "sinitic_authored_subcommentary", [eightyFascicleHuayanExegesis, chengguanHuayanWorks, eightyFascicleHuayanCommentary], "澄观《大方广佛华严经随疏演义钞》再注释完整来源。"),
  T1737: d("da-huayan-jing-luece-chengguan", "sinitic_authored_doctrinal_outline", [eightyFascicleHuayanExegesis, chengguanHuayanWorks], "澄观《大华严经略策》完整来源。"),
  T1738: d("xin-yi-huayan-qi-chu-jiu-hui-song-shi-zhang-chengguan", "sinitic_authored_verse_exposition", [eightyFascicleHuayanExegesis, chengguanHuayanWorks], "澄观《新译华严经七处九会颂释章》完整来源。"),
  T1739: d("xin-huayan-jing-lun-li-tongxuan", "sinitic_authored_sutra_commentary", [eightyFascicleHuayanExegesis, liTongxuanHuayanWorks], "李通玄《新华严经论》完整来源。"),
  T1740: d("huayan-jing-juan-juan-dayi-li-tongxuan", "sinitic_authored_doctrinal_outline", [eightyFascicleHuayanExegesis, liTongxuanHuayanWorks], "李通玄《大方广佛华严经中卷卷大意略叙》完整来源。"),
  T1741: d("lueshi-xin-huayan-xiuxing-jueyi-lun-li-tongxuan", "sinitic_authored_doctrinal_treatise", [eightyFascicleHuayanExegesis, liTongxuanHuayanWorks], "李通玄《略释新华严经修行次第决疑论》完整来源。"),
  T1742: d("huayan-yuanxing-guanmen-gumu-zhanran", "sinitic_authored_practice_outline", [eightyFascicleHuayanExegesis], "湛然《大方广佛华严经愿行观门骨目》完整来源。"),
  T1743: d("linde-dian-huayan-xuanyi-jingju", "sinitic_authored_court_lecture", [eightyFascicleHuayanExegesis], "静居麟德殿《华严经玄义》讲义完整来源。"),
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
  if (!decision) throw new Error(`T36 出现未裁决经号 ${canonId}`);

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
      canonRef: `大正藏 T36, no. ${canonId.slice(1)}`,
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
  ["T1736", "T1737"], ["T1736", "T1738"], ["T1737", "T1738"],
  ["T1739", "T1740"], ["T1739", "T1741"], ["T1740", "T1741"],
  ["T1742", "T1743"],
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
  rightsCategory: "Individually reviewed CBETA TEI files in Taishō volumes T01–T36; T36 source-record closure",
  workOverrides: {},
  fileOverrides: {},
  collection: {
    id: "CBETA-TAISHO-T36",
    title: "大正藏 T36 华严经疏部固定来源记录",
    sourceRecordDenominator: 8,
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
    workCountingDecision: "T36 的 8 份来源记录登记为 8 个完整表达和 8 个独立华严经疏作品。T1736–T1743 均关联 T0279 八十卷本，其中 T1736 与已受控 T1735 形成疏—再注释关系；澄观 T1736–T1738、李通玄 T1739–T1741 即使同作者、同根经，仍因体例、范围与依赖层级不同保持独立。T1742 观门骨目与 T1743 宫廷讲义也分别计作作品。所有记录均不标作根本经表达或佛陀逐字亲说。",
  },
  boundaryAudit: {
    status: "verified_source_integrity_root_translation_commentary_outline_same_author_and_subcommentary_boundaries_recorded",
    existingControlledRecords: ["T0279", "T1735"],
    verifiedTranslationGroups: [],
    rootTreatiseCommentaryGroups: [
      eightyFascicleHuayanExegesis.groupId,
      eightyFascicleHuayanCommentary.groupId,
    ],
    subcommentaryGroups: [eightyFascicleHuayanCommentary.groupId],
    relatedDistinctWorkGroups: [
      chengguanHuayanWorks.groupId,
      liTongxuanHuayanWorks.groupId,
    ],
    candidateRelationsNotMerged: [
      "T0279↔T1736–T1743（八十卷根本经与八部不同体例、不同作者的疏钞论义分层保存）",
      "T1735↔T1736（澄观疏与随疏演义钞为注释—再注释关系）",
      "T1736↔T1737↔T1738（澄观同作者的演义钞、略策与颂释章保持三个作品）",
      "T1739↔T1740↔T1741（李通玄同作者的经论、卷意与决疑论保持三个作品）",
      "T1742↔T1743（湛然观门骨目与静居宫廷讲义同根经但为两个作品）",
    ],
    partialWorkWitnesses: [],
    sourceRoles,
    textualComparison: {
      algorithm: "Unicode text from stable reading lines; punctuation/space removed; unique character 5-gram containment and Jaccard. Text overlap only records quotation and exegetical dependence; it cannot merge root translations, direct commentaries, subcommentaries, outlines, doctrinal treatises, practice digests or lecture texts.",
      pairs: comparisonPairs,
    },
    authoritySources: [
      "https://github.com/cbeta-org/xml-p5/tree/2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9/T/T36",
      "https://authority.dila.edu.tw/catalog/search.php?code=CA0001373",
      "https://authority.dila.edu.tw/catalog/search.php?code=CA0001411",
      "https://authority.dila.edu.tw/catalog/search.php?code=CA0001409",
      "https://authority.dila.edu.tw/catalog/search.php?code=CA0001391",
      "https://authority.dila.edu.tw/catalog/search.php?code=CA0001400",
      "https://authority.dila.edu.tw/catalog/search.php?code=CA0001390",
      "https://authority.dila.edu.tw/catalog/search.php?code=CA0001376",
      "https://authority.dila.edu.tw/catalog/search.php?code=CA0001387",
      "https://authority.dila.edu.tw/catalog/search.php?code=CA0001436",
      "https://authority.dila.edu.tw/catalog/search.php?code=CA0000724",
      "https://authority.dila.edu.tw/person/search.php?aid=A001755",
      "https://authority.dila.edu.tw/person/search.php?aid=A000517",
      "https://authority.dila.edu.tw/person/search.php?aid=A001307",
      "https://authority.dila.edu.tw/person/search.php?aid=A001835",
    ],
    caveat: "T36 是华严经疏部，不是佛说经集合。平台完整保存固定来源，同时区分 T0279 八十卷译本、T1735 直接注疏、T1736 再注释、略策、颂释章、经论、卷意、决疑论、观门骨目和宫廷讲义；共同根经、同作者、传统责任题记、正文引文或机器相似度都不能单独证明作品相同、作者无争议或佛陀逐字亲说。",
  },
  files,
};

if (
  batch.collection.newSourceRecords !== 8 || batch.collection.newSourceBytes !== 14520834 ||
  batch.collection.newStableSegments !== 91748 || batch.collection.newFolios !== 3288 ||
  batch.collection.newJuans !== 140 ||
  batch.collection.verifiedSameWorkExpressions !== 0 || batch.collection.verifiedPartialWorkWitnesses !== 0 ||
  batch.collection.provisionalRecords !== 0 || batch.collection.newFullSourceTexts !== 8 ||
  batch.collection.newPartialSourceWitnesses !== 0 || batch.collection.relationAnnotatedRecords !== 8 ||
  batch.collection.newWorks !== 8 || batch.collection.controlledWorks !== 8 ||
  batch.collection.attributionBoundaryRecords !== 8
) throw new Error(`T36 关系、归属或作品边界统计漂移：${JSON.stringify(batch.collection)}`);

await writeFile(resolve(root, `data/corpus/cbeta/batch-v${version}.json`), `${JSON.stringify(batch, null, 2)}\n`, "utf8");
console.log(`CBETA T36 审计完成：8/8 个固定来源记录；新增 ${batch.collection.newWorks} 个作品、${batch.collection.newSourceRecords} 个表达、${batch.collection.newStableSegments} 个稳定行段、${batch.collection.newFolios} 个版页单元、${batch.collection.newJuans} 卷。`);

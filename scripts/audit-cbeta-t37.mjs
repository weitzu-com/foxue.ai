import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { buildPageNavigation, parseCbetaReadingLines } from "../src/lib/cbeta-tei.mjs";

const root = process.cwd();
const version = "4.4.0";
const expectedCommit = "2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9";
const sourceArgument = process.argv.find((argument) => argument.startsWith("--source-dir="));
if (!sourceArgument) {
  console.error("用法：node scripts/audit-cbeta-t37.mjs --source-dir=/固定提交的/xml-p5");
  process.exit(1);
}
const sourceRoot = resolve(sourceArgument.slice("--source-dir=".length));
const actualCommit = execFileSync("git", ["-C", sourceRoot, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (actualCommit !== expectedCommit) throw new Error(`上游工作树必须固定到 ${expectedCommit}`);

const inventoryPath = "data/gbcr/cbeta-taisho-t37-inventory-v0.1.0.json";
const inventory = JSON.parse(await readFile(resolve(root, inventoryPath), "utf8"));
const baseCatalogPath = "data/corpus/cbeta/catalog-v4.3.0.json";
const baseCatalog = JSON.parse(await readFile(resolve(root, baseCatalogPath), "utf8"));
const sourceUnits = (file) => file.sourceParts ?? [file];
const controlledPaths = new Set(baseCatalog.files.flatMap(sourceUnits).map((file) => file.upstreamPath));
const candidates = inventory.records.filter((record) => !controlledPaths.has(record.upstreamPath));
if (inventory.totals.records !== 21 || inventory.totals.upstreamBytes !== 10041102 || candidates.length !== 21) {
  throw new Error(`T37 固定来源分母或新增记录漂移：${inventory.totals.records}/${candidates.length}`);
}

const relation = (type, groupId, label, evidence, ids) => ({
  type,
  groupId,
  label,
  evidence,
  externalIds: { cbeta: ids },
});
const srimalaExegesis = relation(
  "commentary_on_srimaladevi_sutra_distinct",
  "srimala-exegesis-t0353-t1744",
  "《胜鬘师子吼一乘大方便方广经》与吉藏《胜鬘宝窟》",
  "DILA T1744 规范记录把 T0353 标为相关经典。根本经与三卷经疏保持两个作品实体；经题、引文和经疏部目录位置不构成同一作品或佛陀逐字亲说证明。",
  ["T0353", "T1744"],
);
const largerSukhavativyuhaExegesis = relation(
  "commentaries_on_larger_sukhavativyuha_distinct",
  "larger-sukhavativyuha-exegesis-t0360-t1745-t1748",
  "《佛说无量寿经》与 T1745–T1748 四部义疏、宗要及述文赞",
  "DILA T1745–T1748 规范记录均把 T0360 标为相关经典。四部注疏具有不同作者、题名、体例和篇幅，根本经与四部诠释保持五个作品实体。",
  ["T0360", "T1745", "T1746", "T1747", "T1748"],
);
const contemplationSutraExegesis = relation(
  "commentaries_on_contemplation_sutra_distinct",
  "contemplation-sutra-exegesis-t0365-t1749-t1754",
  "《佛说观无量寿佛经》与 T1749–T1754 六部义疏、疏钞及集记",
  "DILA T1749–T1754 规范记录均把 T0365 标为相关经典。共同根经、相同或近似题名、讲说与集记责任只形成可审计关系，不合并六部后世注释作品。",
  ["T0365", "T1749", "T1750", "T1751", "T1752", "T1753", "T1754"],
);
const contemplationSubcommentary = relation(
  "commentary_and_subcommentary_on_contemplation_sutra_distinct",
  "contemplation-sutra-commentary-subcommentary-t0365-t1750-t1751",
  "《观无量寿佛经》、智顗说疏与知礼《妙宗钞》",
  "DILA T1750 与 T1751 规范记录互相关联：T1750 保存智顗说的直接经疏，T1751 是知礼依疏展开的六卷妙宗钞。根本经、讲说记录与再注释分层登记。",
  ["T0365", "T1750", "T1751"],
);
const amitabhaSutraExegesis = relation(
  "commentaries_on_amitabha_sutra_distinct",
  "amitabha-sutra-exegesis-t0366-t1755-t1762",
  "《佛说阿弥陀经》与 T1755–T1762 八部义记、义述、疏、通赞疏及要解",
  "DILA T1755–T1762 规范记录均把 T0366 标为相关经典。八部文本跨隋唐宋明，作者、题名与体例不同；共同根经和相同题名不能替代作品裁决。",
  ["T0366", "T1755", "T1756", "T1757", "T1758", "T1759", "T1760", "T1761", "T1762"],
);
const nirvanaCollectedExegesis = relation(
  "commentary_on_southern_nirvana_recension_distinct",
  "nirvana-exegesis-t0375-t1763",
  "南本《大般涅槃经》与宝亮等《大般涅槃经集解》",
  "DILA T1763 规范记录把 T0375 标为相关经典。七十一卷集解保存后世集成责任，是独立注释作品，不是南本根经的另一表达。",
  ["T0375", "T1763"],
);
const nirvanaYiji = relation(
  "commentary_on_northern_nirvana_recension_distinct",
  "nirvana-exegesis-t0374-t1764",
  "北本《大般涅槃经》与慧远《大般涅槃经义记》",
  "DILA T1764 规范记录把 T0374 标为相关经典。十卷义记与四十卷北本根经保持两个作品实体，不据共同经题改写为根经表达。",
  ["T0374", "T1764"],
);
const wuliangshouYishu = relation(
  "same_title_commentaries_by_different_authors_distinct",
  "wuliangshou-yishu-t1745-t1746",
  "慧远与吉藏两部《无量寿经义疏》",
  "DILA 分别登记 T1745 与 T1746，并给出不同作者、卷数和规范码。相同题名与共同根经不构成同一作品。",
  ["T0360", "T1745", "T1746"],
);
const kuijiAmitabha = relation(
  "related_commentaries_by_same_author_distinct",
  "kuiji-amitabha-commentaries-t1757-t1758",
  "窥基《阿弥陀经疏》与《阿弥陀经通赞疏》",
  "DILA 分别登记 T1757 与 T1758，并给出独立规范码和篇幅。两部虽同作者、同根经，仍因题名、结构和范围不同保持两个作品。",
  ["T0366", "T1757", "T1758"],
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
  T1744: d("srimala-baoku-jizang", "sinitic_authored_sutra_commentary", [srimalaExegesis], "吉藏《胜鬘宝窟》完整来源。"),
  T1745: d("wuliangshou-yishu-huiyuan", "sinitic_authored_sutra_commentary", [largerSukhavativyuhaExegesis, wuliangshouYishu], "慧远《无量寿经义疏》完整来源。"),
  T1746: d("wuliangshou-yishu-jizang", "sinitic_authored_sutra_commentary", [largerSukhavativyuhaExegesis, wuliangshouYishu], "吉藏《无量寿经义疏》完整来源。"),
  T1747: d("liangjuan-wuliangshou-zongyao-wonhyo", "sinitic_authored_doctrinal_exposition", [largerSukhavativyuhaExegesis], "元晓《两卷无量寿经宗要》完整来源。"),
  T1748: d("wuliangshou-lianyi-shuwen-zan-gyeongheung", "sinitic_authored_sutra_commentary", [largerSukhavativyuhaExegesis], "璟兴《无量寿经连义述文赞》完整来源。"),
  T1749: d("guan-wuliangshou-yishu-huiyuan", "sinitic_authored_sutra_commentary", [contemplationSutraExegesis], "慧远《观无量寿经义疏》完整来源。"),
  T1750: d("guan-wuliangshou-shu-zhiyi", "sinitic_taught_commentary_record", [contemplationSutraExegesis, contemplationSubcommentary], "智顗说《观无量寿佛经疏》讲说记录完整来源。"),
  T1751: d("guan-wuliangshou-miaozong-chao-zhili", "sinitic_authored_subcommentary", [contemplationSutraExegesis, contemplationSubcommentary], "知礼《观无量寿佛经疏妙宗钞》再注释完整来源。"),
  T1752: d("guan-wuliangshou-yishu-jizang", "sinitic_authored_sutra_commentary", [contemplationSutraExegesis], "吉藏《观无量寿经义疏》完整来源。"),
  T1753: d("guan-wuliangshou-shu-shandao", "sinitic_compiled_commentary_record", [contemplationSutraExegesis], "善导集记《观无量寿佛经疏》完整来源。"),
  T1754: d("guan-wuliangshou-yishu-yuanzhao", "sinitic_authored_sutra_commentary", [contemplationSutraExegesis], "元照《观无量寿佛经义疏》完整来源。"),
  T1755: d("amitabha-yiji-zhiyi", "sinitic_taught_commentary_record", [amitabhaSutraExegesis], "智顗说《阿弥陀经义记》讲说记录完整来源。"),
  T1756: d("amitabha-yishu-huijing", "sinitic_authored_sutra_commentary", [amitabhaSutraExegesis], "慧净《阿弥陀经义述》完整来源。"),
  T1757: d("amitabha-shu-kuiji", "sinitic_authored_sutra_commentary", [amitabhaSutraExegesis, kuijiAmitabha], "窥基《阿弥陀经疏》完整来源。"),
  T1758: d("amitabha-tongzan-shu-kuiji", "sinitic_authored_sutra_commentary", [amitabhaSutraExegesis, kuijiAmitabha], "窥基《阿弥陀经通赞疏》完整来源。"),
  T1759: d("amitabha-shu-wonhyo", "sinitic_authored_sutra_commentary", [amitabhaSutraExegesis], "元晓《阿弥陀经疏》完整来源。"),
  T1760: d("amitabha-shu-zhiyuan", "sinitic_authored_sutra_commentary", [amitabhaSutraExegesis], "智圆《阿弥陀经疏》完整来源。"),
  T1761: d("amitabha-yishu-yuanzhao", "sinitic_authored_sutra_commentary", [amitabhaSutraExegesis], "元照《阿弥陀经义疏》完整来源。"),
  T1762: d("amitabha-yaojie-zhixu", "sinitic_authored_sutra_commentary", [amitabhaSutraExegesis], "智旭《阿弥陀经要解》完整来源。"),
  T1763: d("nirvana-jijie-baoliang", "sinitic_collective_compiled_sutra_commentary", [nirvanaCollectedExegesis], "宝亮等集《大般涅槃经集解》完整来源。"),
  T1764: d("nirvana-yiji-huiyuan", "sinitic_authored_sutra_commentary", [nirvanaYiji], "慧远《大般涅槃经义记》完整来源。"),
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
  if (!decision) throw new Error(`T37 出现未裁决经号 ${canonId}`);

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
      tradition: "汉传佛教 · 经疏部 · 胜鬘、净土与涅槃",
      language: "汉文",
      canonRef: `大正藏 T37, no. ${canonId.slice(1)}`,
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
  ["T1745", "T1746"], ["T1749", "T1752"], ["T1750", "T1751"],
  ["T1757", "T1758"], ["T1757", "T1759"], ["T1757", "T1760"],
  ["T1759", "T1760"], ["T1763", "T1764"],
].map(([left, right]) => compareBodies(left, right));
const sourceRoles = Object.fromEntries([...new Set(files.map((file) => file.sourceRole))].sort().map((role) => [
  role,
  files.filter((file) => file.sourceRole === role).map((file) => file.id),
]));
const batchWorkIds = new Set(files.map((file) => file.workId));
const rootTreatiseCommentaryGroups = [
  "srimala-exegesis-t0353-t1744",
  "larger-sukhavativyuha-exegesis-t0360-t1745-t1748",
  "contemplation-sutra-exegesis-t0365-t1749-t1754",
  "amitabha-sutra-exegesis-t0366-t1755-t1762",
  "nirvana-exegesis-t0375-t1763",
  "nirvana-exegesis-t0374-t1764",
];
const batch = {
  schema: "https://foxue.ai/schemas/cbeta-controlled-batch-v1.0",
  version,
  publishedAt: "2026-08-15",
  baseCatalog: baseCatalogPath,
  inventory: inventoryPath,
  rightsCategory: "Individually reviewed CBETA TEI files in Taishō volumes T01–T37; T37 source-record closure",
  workOverrides: {},
  fileOverrides: {},
  collection: {
    id: "CBETA-TAISHO-T37",
    title: "大正藏 T37 净土与涅槃经疏部固定来源记录",
    sourceRecordDenominator: 21,
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
    workCountingDecision: "T37 的 21 份来源记录登记为 21 个完整表达和 21 个独立经疏作品。T1744 连接 T0353；T1745–T1748 连接 T0360；T1749–T1754 连接 T0365，其中 T1750 与 T1751 形成直接经疏—再注释关系；T1755–T1762 连接 T0366；T1763 与 T1764 分别连接 T0375 南本和 T0374 北本《大般涅槃经》。相同题名、共同根经、同一作者、讲说或集记责任都不自动合并作品，所有记录均不标作根本经表达或佛陀逐字亲说。",
  },
  boundaryAudit: {
    status: "verified_source_integrity_root_translation_commentary_same_title_taught_record_collective_compilation_and_subcommentary_boundaries_recorded",
    existingControlledRecords: ["T0353", "T0360", "T0365", "T0366", "T0374", "T0375"],
    verifiedTranslationGroups: [],
    rootTreatiseCommentaryGroups,
    subcommentaryGroups: ["contemplation-sutra-commentary-subcommentary-t0365-t1750-t1751"],
    relatedDistinctWorkGroups: ["wuliangshou-yishu-t1745-t1746", "kuiji-amitabha-commentaries-t1757-t1758"],
    candidateRelationsNotMerged: [
      "T0353↔T1744（《胜鬘经》根经与吉藏经疏分层保存）",
      "T0360↔T1745–T1748（《无量寿经》与四部不同作者、体例的注疏分层保存）",
      "T0365↔T1749–T1754，T1750↔T1751（根经、直接经疏、妙宗钞再注释及其他注疏分层保存）",
      "T0366↔T1755–T1762（《阿弥陀经》与八部跨时代注疏分层保存）",
      "T0375↔T1763、T0374↔T1764（南北本根经表达与集解、义记分别保存）",
      "T1745↔T1746、T1757↔T1758（同题异作或同作者异作只形成关系，不合并作品）",
    ],
    partialWorkWitnesses: [],
    sourceRoles,
    textualComparison: {
      algorithm: "Unicode text from stable reading lines; punctuation/space removed; unique character 5-gram containment and Jaccard. Text overlap only records quotation and exegetical dependence; it cannot merge root translations, direct commentaries, subcommentaries, taught records, collected explanations or same-title works.",
      pairs: comparisonPairs,
    },
    authoritySources: [
      "https://github.com/cbeta-org/xml-p5/tree/2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9/T/T37",
      ...["CA0003005", "CA0003412", "CA0001216", "CA0000015", "CA0000538", "CA0000539", "CA0003001", "CA0003418", "CA0003419", "CA0003422", "CA0003416", "CA0001227", "CA0001218", "CA0001220", "CA0001226", "CA0001219", "CA0001222", "CA0000033", "CA0000036", "CA0000021", "CA0000028", "CA0000020", "CA0000034", "CA0000035", "CA0000029", "CA0000541", "CA0000543"].map((code) => `https://authority.dila.edu.tw/catalog/search.php?code=${code}`),
      ...["A000329", "A002000", "A000136", "A001748", "A001301", "A000756", "A001349", "A000129", "A001723", "A001019", "A001282", "A001257", "A001921"].map((aid) => `https://authority.dila.edu.tw/person/search.php?aid=${aid}`),
    ],
    caveat: "T37 是经疏部，不是佛说经集合。平台完整保存固定来源，同时区分《胜鬘经》、净土三经、《大般涅槃经》南北本等根经表达，以及义疏、宗要、述文赞、讲说记录、妙宗钞再注释、集记、集解与要解；共同经题、同作者、传统责任题记、正文引文或机器相似度都不能单独证明作品相同、作者无争议或佛陀逐字亲说。",
  },
  files,
};

const outputPath = resolve(root, `data/corpus/cbeta/batch-v${version}.json`);
await writeFile(outputPath, `${JSON.stringify(batch, null, 2)}\n`, "utf8");
console.log(`CBETA T37 审计完成：${files.length}/${inventory.totals.records} 个固定来源记录；新增 ${batchWorkIds.size} 个作品、${files.length} 个表达、${batch.collection.newStableSegments} 个稳定行段、${batch.collection.newFolios} 个版页单元、${batch.collection.newJuans} 卷。`);

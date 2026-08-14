import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { buildPageNavigation, parseCbetaReadingLines } from "../src/lib/cbeta-tei.mjs";

const root = process.cwd();
const version = "4.0.0";
const expectedCommit = "2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9";
const sourceArgument = process.argv.find((argument) => argument.startsWith("--source-dir="));
if (!sourceArgument) {
  console.error("用法：node scripts/audit-cbeta-t33.mjs --source-dir=/固定提交的/xml-p5");
  process.exit(1);
}
const sourceRoot = resolve(sourceArgument.slice("--source-dir=".length));
const actualCommit = execFileSync("git", ["-C", sourceRoot, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (actualCommit !== expectedCommit) throw new Error(`上游工作树必须固定到 ${expectedCommit}`);

const inventoryPath = "data/gbcr/cbeta-taisho-t33-inventory-v0.1.0.json";
const inventory = JSON.parse(await readFile(resolve(root, inventoryPath), "utf8"));
const baseCatalogPath = "data/corpus/cbeta/catalog-v3.9.0.json";
const baseCatalog = JSON.parse(await readFile(resolve(root, baseCatalogPath), "utf8"));
const sourceUnits = (file) => file.sourceParts ?? [file];
const controlledPaths = new Set(baseCatalog.files.flatMap(sourceUnits).map((file) => file.upstreamPath));
const candidates = inventory.records.filter((record) => !controlledPaths.has(record.upstreamPath));
if (inventory.totals.records !== 25 || inventory.totals.upstreamBytes !== 12016019 || candidates.length !== 25) {
  throw new Error(`T33 固定来源分母或新增记录漂移：${inventory.totals.records}/${candidates.length}`);
}

const relation = (type, groupId, label, evidence, ids) => ({
  type,
  groupId,
  label,
  evidence,
  externalIds: { cbeta: ids },
});
const renbenCommentary = relation(
  "commentary_on_canonical_work_verified",
  "renben-yusheng-t0014-t1693",
  "《人本欲生经》与道安注",
  "T1693 的题名、卷首经序与 CBETA 校勘头明确其为道安对《人本欲生经》的注释；根本经与注释保持两个作品实体。",
  ["T0014", "T1693"],
);
const yinchiCommentary = relation(
  "commentary_on_canonical_work_verified",
  "yinchi-ru-t0603-t1694",
  "《阴持入经》与陈慧注",
  "T1694 的正藏题名与责任题记明确其为陈慧所撰经注；平台保存根本经、注释作品与撰者责任，不作同作品合并。",
  ["T0603", "T1694"],
);
const greatPrajnaCommentaries = relation(
  "related_commentaries_on_great_prajnaparamita_distinct",
  "great-prajnaparamita-commentaries-t1695-t1697",
  "大般若、大品与大慧度经疏释边界",
  "T1695 是般若理趣分述赞，T1696 是《大品经》游意，T1697 是《大慧度经》宗要；三者对象、作者、体例和范围均不同，只记录经疏亲缘，不合并作品。",
  ["T0220", "T1695", "T1696", "T1697"],
);
const diamondCommentaries = relation(
  "diamond_sutra_commentaries_distinct",
  "diamond-sutra-commentaries-t1698-t1704",
  "《金刚经》七部疏、赞、纂要与注解",
  "T1698–T1704 共享《金刚般若》解释对象，但由不同作者、时代和注释层形成；共同根本经不等于同一注释作品。",
  ["T0235", "T1698", "T1699", "T1700", "T1701", "T1702", "T1703", "T1704"],
);
const diamondSubcommentary = relation(
  "subcommentary_on_commentary_verified",
  "diamond-t1701-t1702",
  "《金刚般若经疏论纂要》与《刊定记》",
  "T1702 的题名与正文结构明确承接 T1701 的《纂要》而作刊定记；再注释与所释注疏分列作品。",
  ["T1701", "T1702"],
);
const renwangOldCommentaries = relation(
  "renwang_old_translation_commentaries_distinct",
  "renwang-commentaries-t1705-t1708",
  "旧译《仁王经》疏与再注释",
  "T1705、T1707、T1708 是不同师家对《仁王经》的疏释，T1706 是围绕智顗、灌顶疏系形成的神宝记；共同经题与宗派传承不取消各自作品身份。",
  ["T0245", "T1705", "T1706", "T1707", "T1708"],
);
const renwangSubcommentary = relation(
  "subcommentary_on_commentary_verified",
  "renwang-t1705-t1706",
  "《仁王护国般若经疏》与《疏神宝记》",
  "T1706 明示为疏之神宝记，属于对 T1705 疏系的再注释；两层文本及责任题记独立保存。",
  ["T1705", "T1706"],
);
const renwangNewCommentary = relation(
  "commentary_on_new_renwang_translation_verified",
  "renwang-new-translation-t0246-t1709",
  "不空新译《仁王经》与良贲疏",
  "T1709 对《仁王护国般若波罗蜜多经》作疏，和 T1705–T1708 的旧译疏系保持版本及注释传统边界。",
  ["T0246", "T1709"],
);
const heartCommentaries = relation(
  "heart_sutra_commentaries_distinct",
  "heart-sutra-commentaries-t1710-t1714",
  "《心经》幽赞、赞、略疏、连珠记与注解",
  "T1710–T1714 共享《心经》解释对象，却由窺基、圆测、法藏、师会、宗泐与如玘等不同责任层形成；不得重复算作《心经》正文表达，也不得彼此合并。",
  ["T0251", "T1710", "T1711", "T1712", "T1713", "T1714"],
);
const heartSubcommentary = relation(
  "subcommentary_on_commentary_verified",
  "heart-t1712-t1713",
  "法藏《心经略疏》与师会《连珠记》",
  "T1713 题名明示为《般若心经略疏连珠记》，承接 T1712 的略疏而作；再注释与原疏分列作品。",
  ["T1712", "T1713"],
);
const lotusCommentaries = relation(
  "lotus_sutra_commentary_and_doctrinal_exegesis_distinct",
  "lotus-commentaries-t1715-t1717",
  "《法华经》义记、玄义与释籤",
  "T1715 是法云《法华经义记》，T1716 是智顗讲说的《法华玄义》，T1717 是湛然对玄义所作释籤；经文注释、教义玄释与再注释分别建模。",
  ["T0262", "T1715", "T1716", "T1717"],
);
const lotusSubcommentary = relation(
  "subcommentary_on_commentary_verified",
  "lotus-t1716-t1717",
  "《法华玄义》与《法华玄义释籤》",
  "T1717 明示解释 T1716《法华玄义》，是独立再注释作品，不作为 T1716 的另一版本或《法华经》正文表达。",
  ["T1716", "T1717"],
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
  T1693: d("renben-yusheng-jing-zhu-daoan", "sinitic_authored_sutra_commentary", [renbenCommentary], "道安所撰经注完整来源。"),
  T1694: d("yinchi-ru-jing-zhu-chenhui", "sinitic_authored_sutra_commentary", [yinchiCommentary], "陈慧所撰经注完整来源。"),
  T1695: d("prajna-liqu-fen-shuzan-kuiji", "sinitic_authored_sutra_commentary", [greatPrajnaCommentaries], "窺基《般若理趣分述赞》完整来源。"),
  T1696: d("dapin-jing-youyi-jizang", "sinitic_authored_doctrinal_exposition", [greatPrajnaCommentaries], "吉藏《大品经游意》完整来源。"),
  T1697: d("dahuidu-jing-zongyao-wonhyo", "sinitic_authored_doctrinal_exposition", [greatPrajnaCommentaries], "元晓《大慧度经宗要》完整来源。"),
  T1698: d("jingang-bore-jing-shu-zhiyi", "sinitic_taught_commentary_record", [diamondCommentaries], "传统题记为智顗说的《金刚般若经疏》完整来源。"),
  T1699: d("jingang-bore-shu-jizang", "sinitic_authored_sutra_commentary", [diamondCommentaries], "吉藏《金刚般若疏》完整来源。"),
  T1700: d("jingang-bore-jing-zanshu-kuiji", "sinitic_authored_sutra_commentary", [diamondCommentaries], "窺基《金刚般若经赞述》完整来源。"),
  T1701: d("jingang-bore-jing-shulun-zuanyao-zongmi", "sinitic_commentary_with_editorial_redaction", [diamondCommentaries, diamondSubcommentary], "宗密述、子璿治定的《疏论纂要》完整来源。"),
  T1702: d("jingang-jing-zuanyao-kandingji-zixuan", "sinitic_authored_subcommentary", [diamondCommentaries, diamondSubcommentary], "子璿《金刚经纂要刊定记》完整来源。"),
  T1703: d("jingang-bore-jing-zhujie-zongle-ruqi", "sinitic_coauthored_sutra_commentary", [diamondCommentaries], "宗泐、如玘同注本完整来源。"),
  T1704: d("jingang-bore-jing-lueshu-zhiyan", "sinitic_authored_sutra_commentary", [diamondCommentaries], "智俨《金刚般若波罗蜜经略疏》完整来源。"),
  T1705: d("renwang-huguo-bore-jing-shu-zhiyi-guanding", "sinitic_taught_commentary_record", [renwangOldCommentaries, renwangSubcommentary], "智顗说、灌顶记的仁王经疏完整来源。"),
  T1706: d("renwang-shu-shenbaoji-shanyue", "sinitic_authored_subcommentary", [renwangOldCommentaries, renwangSubcommentary], "善月《仁王经疏神宝记》完整来源。"),
  T1707: d("renwang-bore-jing-shu-jizang", "sinitic_authored_sutra_commentary", [renwangOldCommentaries], "吉藏《仁王般若经疏》完整来源。"),
  T1708: d("renwang-jing-shu-woncheuk", "sinitic_authored_sutra_commentary", [renwangOldCommentaries], "圆测《仁王经疏》完整来源。"),
  T1709: d("renwang-huguo-bore-boluomiduo-jing-shu-liangben", "sinitic_authored_sutra_commentary", [renwangNewCommentary], "良贲新译仁王经疏完整来源。"),
  T1710: d("heart-sutra-youzan-kuiji", "sinitic_authored_sutra_commentary", [heartCommentaries], "窺基《心经幽赞》完整来源。"),
  T1711: d("heart-sutra-zan-woncheuk", "sinitic_authored_sutra_commentary", [heartCommentaries], "圆测《心经赞》完整来源。"),
  T1712: d("heart-sutra-lueshu-fazang", "sinitic_authored_sutra_commentary", [heartCommentaries, heartSubcommentary], "法藏《心经略疏》完整来源。"),
  T1713: d("heart-sutra-lueshu-lianzhuji-shihui", "sinitic_authored_subcommentary", [heartCommentaries, heartSubcommentary], "师会《心经略疏连珠记》完整来源。"),
  T1714: d("heart-sutra-zhujie-zongle-ruqi", "sinitic_coauthored_sutra_commentary", [heartCommentaries], "宗泐、如玘同注《心经》完整来源。"),
  T1715: d("lotus-sutra-yiji-fayun", "sinitic_authored_sutra_commentary", [lotusCommentaries], "法云《法华经义记》完整来源。"),
  T1716: d("lotus-sutra-xuanyi-zhiyi", "sinitic_taught_doctrinal_exposition_record", [lotusCommentaries, lotusSubcommentary], "智顗说《妙法莲华经玄义》完整来源。"),
  T1717: d("lotus-xuanyi-shiqian-zhanran", "sinitic_authored_subcommentary", [lotusCommentaries, lotusSubcommentary], "湛然《法华玄义释籤》完整来源。"),
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
  if (!decision) throw new Error(`T33 出现未裁决经号 ${canonId}`);

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
      canonRef: `大正藏 T33, no. ${canonId.slice(1)}`,
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
  ["T1698", "T1699"], ["T1701", "T1702"], ["T1705", "T1706"], ["T1705", "T1707"],
  ["T1710", "T1711"], ["T1712", "T1713"], ["T1715", "T1716"], ["T1716", "T1717"],
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
  rightsCategory: "Individually reviewed CBETA TEI files in Taishō volumes T01–T33; T33 source-record closure",
  workOverrides: {},
  fileOverrides: {},
  collection: {
    id: "CBETA-TAISHO-T33",
    title: "大正藏 T33 经疏部固定来源记录",
    sourceRecordDenominator: 25,
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
    workCountingDecision: "T33 的 25 份来源记录登记为 25 个完整表达和 25 个独立经疏作品。共同解释《般若》《金刚》《仁王》《心经》或《法华经》只形成主题与注释关系，不构成同一作品；T1702、T1706、T1713、T1717 分别作为再注释作品连接到所释注疏，仍不合并。所有记录均为东亚撰述、讲说记录、治定本、合注、疏、记或释籤，不标作根本经的表达或佛陀逐字亲说。",
  },
  boundaryAudit: {
    status: "verified_source_integrity_commentary_subcommentary_root_text_and_authorship_boundaries_recorded",
    existingControlledRecords: [],
    verifiedTranslationGroups: [],
    rootTreatiseCommentaryGroups: [
      renbenCommentary.groupId,
      yinchiCommentary.groupId,
      greatPrajnaCommentaries.groupId,
      diamondCommentaries.groupId,
      renwangOldCommentaries.groupId,
      renwangNewCommentary.groupId,
      heartCommentaries.groupId,
      lotusCommentaries.groupId,
    ],
    subcommentaryGroups: [
      diamondSubcommentary.groupId,
      renwangSubcommentary.groupId,
      heartSubcommentary.groupId,
      lotusSubcommentary.groupId,
    ],
    relatedDistinctWorkGroups: [
      greatPrajnaCommentaries.groupId,
      diamondCommentaries.groupId,
      renwangOldCommentaries.groupId,
      heartCommentaries.groupId,
      lotusCommentaries.groupId,
    ],
    candidateRelationsNotMerged: [
      "T1695–T1697（同属般若经疏释，但根本对象、作者、体例与范围不同）",
      "T1698–T1704（共同解释《金刚经》，七部注疏保持七个作品）",
      "T1701↔T1702（疏论纂要与刊定记为注疏—再注释关系）",
      "T1705↔T1706（仁王经疏与神宝记为注疏—再注释关系）",
      "T1705–T1708↔T1709（旧译与新译仁王经疏系保持版本对象边界）",
      "T1710–T1714（共同解释《心经》，五部经疏保持五个作品）",
      "T1712↔T1713（心经略疏与连珠记为注疏—再注释关系）",
      "T1715↔T1716↔T1717（义记、玄义与释籤分属经文注释、教义玄释和再注释）",
    ],
    partialWorkWitnesses: [],
    sourceRoles,
    textualComparison: {
      algorithm: "Unicode text from stable reading lines; punctuation/space removed; unique character 5-gram containment and Jaccard. Text overlap only records quotation and exegetical dependence; it cannot merge root texts, commentaries or subcommentaries.",
      pairs: comparisonPairs,
    },
    authoritySources: [
      "https://github.com/cbeta-org/xml-p5/tree/2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9/T/T33",
      "https://cbetaonline.dila.edu.tw/zh/T1693_001",
      "https://cbetaonline.dila.edu.tw/zh/T1694_001",
      "https://cbetaonline.dila.edu.tw/zh/T1701_001",
      "https://cbetaonline.dila.edu.tw/zh/T1702_001",
      "https://cbetaonline.dila.edu.tw/zh/T1705_001",
      "https://cbetaonline.dila.edu.tw/zh/T1706_001",
      "https://cbetaonline.dila.edu.tw/zh/T1712_001",
      "https://cbetaonline.dila.edu.tw/zh/T1713_001",
      "https://cbetaonline.dila.edu.tw/zh/T1716_001",
      "https://cbetaonline.dila.edu.tw/zh/T1717_001",
    ],
    caveat: "T33 是经疏部，不是佛说经集合。平台完整保存固定来源，同时区分根本经、直接注疏、教义玄释、讲说记录、治定本、合注和再注释；共同经题、宗派传承、作者题记、正文引文或机器相似度都不能单独证明作品相同、作者无争议或佛陀逐字亲说。",
  },
  files,
};

if (
  batch.collection.newSourceRecords !== 25 || batch.collection.newSourceBytes !== 12016019 ||
  batch.collection.newStableSegments !== 82527 || batch.collection.newFolios !== 2930 ||
  batch.collection.newJuans !== 90 || batch.collection.verifiedSameWorkExpressions !== 0 ||
  batch.collection.verifiedPartialWorkWitnesses !== 0 || batch.collection.provisionalRecords !== 0 ||
  batch.collection.newFullSourceTexts !== 25 || batch.collection.newPartialSourceWitnesses !== 0 ||
  batch.collection.relationAnnotatedRecords !== 25 || batch.collection.newWorks !== 25 ||
  batch.collection.controlledWorks !== 25 || batch.collection.attributionBoundaryRecords !== 25
) throw new Error(`T33 关系、归属或作品边界统计漂移：${JSON.stringify(batch.collection)}`);

await writeFile(resolve(root, `data/corpus/cbeta/batch-v${version}.json`), `${JSON.stringify(batch, null, 2)}\n`, "utf8");
console.log(`CBETA T33 审计完成：25/25 个固定来源记录；新增 ${batch.collection.newWorks} 个作品、${batch.collection.newSourceRecords} 个表达、${batch.collection.newStableSegments} 个稳定行段。`);

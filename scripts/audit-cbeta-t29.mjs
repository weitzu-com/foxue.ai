import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { buildPageNavigation, parseCbetaReadingLines } from "../src/lib/cbeta-tei.mjs";

const root = process.cwd();
const version = "3.6.0";
const expectedCommit = "2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9";
const sourceArgument = process.argv.find((argument) => argument.startsWith("--source-dir="));
if (!sourceArgument) {
  console.error("用法：node scripts/audit-cbeta-t29.mjs --source-dir=/固定提交的/xml-p5");
  process.exit(1);
}
const sourceRoot = resolve(sourceArgument.slice("--source-dir=".length));
const actualCommit = execFileSync("git", ["-C", sourceRoot, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (actualCommit !== expectedCommit) throw new Error(`上游工作树必须固定到 ${expectedCommit}`);

const inventoryPath = "data/gbcr/cbeta-taisho-t29-inventory-v0.1.0.json";
const inventory = JSON.parse(await readFile(resolve(root, inventoryPath), "utf8"));
const baseCatalogPath = "data/corpus/cbeta/catalog-v3.5.0.json";
const baseCatalog = JSON.parse(await readFile(resolve(root, baseCatalogPath), "utf8"));
const sourceUnits = (file) => file.sourceParts ?? [file];
const controlledPaths = new Set(baseCatalog.files.flatMap(sourceUnits).map((file) => file.upstreamPath));
const candidates = inventory.records.filter((record) => !controlledPaths.has(record.upstreamPath));
if (inventory.totals.records !== 6 || inventory.totals.upstreamBytes !== 11019060 || candidates.length !== 6) {
  throw new Error(`T29 固定来源分母或新增记录漂移：${inventory.totals.records}/${candidates.length}`);
}

const kosaFamily = {
  type: "same_work_translations_and_separate_root_verses_verified",
  groupId: "abhidharmakosa-t1558-t1560",
  label: "《俱舍论释》同本异译与独立本颂关系",
  evidence: "学术资料把玄奘 T1558 与真谛 T1559 明确列为世亲《Abhidharmakośabhāṣya》的两种汉译；T1560 题为《俱舍论本颂》，且其绝大多数五字组可在 T1558 中找到。平台把 T1558/T1559 登记为同一释论作品的两个表达，把独立流通的 T1560 登记为相关但不同的根本颂作品，不把本颂与自释混成一个作品。",
  externalIds: { cbeta: ["T1558", "T1559", "T1560"] },
};
const tattvarthaRelation = {
  type: "extreme_abridgment_commentary_witness_verified",
  groupId: "abhidharmakosa-tattvartha-t1561",
  label: "安慧《俱舍论实义疏》极端节本见证",
  evidence: "奥地利科学院出版的 Tattvārthā 研究说明，T1561 名列五卷、实仅大正藏三页并只涉及前三品，不是完整注疏的残卷，而是极端节出。平台完整保存这份来源文件，但把它标为安慧注疏作品的部分见证。",
  externalIds: { cbeta: ["T1558", "T1559", "T1561"] },
};
const sanghabhadraFamily = {
  type: "broad_critique_and_abridged_exposition_relation_verified",
  groupId: "sanghabhadra-nyayanusara-samayapradipika-t1562-t1563",
  label: "众贤《顺正理》广论与《显宗》略论关系",
  evidence: "同行评审研究确认 T1562 *Nyāyānusāra 与 T1563 *Abhidharmasamayapradīpikā 是众贤的两部不同著作；T1563 序颂自述为使《顺正理》广文易解而造略论，现代研究也说明其大体节出前者显正义部分。平台登记为两个作品并建立广略派生关系。",
  externalIds: { cbeta: ["T1562", "T1563"] },
};

const decisions = new Map(Object.entries({
  T1558: {
    slug: "taisho-t1558",
    workId: "gbcr:work:abhidharmakosa-bhasya",
    workIdentityStatus: "verified_same_work_expression",
    workTitle: "阿毘达磨俱舍论（Abhidharmakośabhāṣya）",
    sourceRole: "traditional_authored_abhidharma_autocommentary_translation",
    completeness: "complete_source_file",
    relations: [kosaFamily, tattvarthaRelation],
    title: "阿毘達磨俱舍論",
    author: "尊者世親造 唐 玄奘譯",
    extent: "30卷",
    summary: "固定来源完整保存三十卷与稳定锚点；与 T1559 作为世亲《俱舍论释》的两种汉译共享作品标识，与独立本颂 T1560、安慧注疏 T1561 建立作品关系。传统世亲造、玄奘译题记照录，论书不标为佛陀逐字亲说。",
  },
  T1559: {
    slug: "taisho-t1559",
    workId: "gbcr:work:abhidharmakosa-bhasya",
    workIdentityStatus: "verified_same_work_expression",
    workTitle: "阿毘达磨俱舍论（Abhidharmakośabhāṣya）",
    sourceRole: "traditional_authored_abhidharma_autocommentary_translation",
    completeness: "complete_source_file",
    relations: [kosaFamily, tattvarthaRelation],
    title: "阿毘達磨俱舍釋論",
    author: "婆藪盤豆造 陳 真諦譯",
    extent: "22卷",
    summary: "固定来源完整保存二十二卷与稳定锚点；学术资料确认其与 T1558 是同一《俱舍论释》的真谛、玄奘异译，故按一个作品、两个表达计数。婆薮盘豆即世亲的传统音译，责任题记按来源照录。",
  },
  T1560: {
    slug: "taisho-t1560",
    workId: "gbcr:work:abhidharmakosa-karika",
    workIdentityStatus: "verified_distinct_root_verse_work",
    workTitle: "阿毘达磨俱舍颂（Abhidharmakośakārikā）",
    sourceRole: "traditional_authored_abhidharma_root_verse_translation",
    completeness: "complete_source_file",
    relations: [kosaFamily],
    title: "阿毘達磨俱舍論本頌",
    author: "世親菩薩造 唐 玄奘譯",
    extent: "1卷",
    summary: "固定来源完整保存一卷本颂与稳定锚点；登记为与《俱舍论释》密切相关但可独立流通、可独立表达的根本颂作品，不因 T1558 包含本颂而重复合并表达。传统世亲造、玄奘译题记照录。",
  },
  T1561: {
    slug: "taisho-t1561",
    workId: "gbcr:work:abhidharmakosa-tattvartha-commentary",
    workIdentityStatus: "verified_partial_work_witness",
    workTitle: "俱舍论实义疏（Sthiramati's Tattvārthā）",
    sourceRole: "traditional_authored_extreme_abridgment_of_commentary_witness",
    completeness: "complete_source_file_partial_work_witness",
    relations: [tattvarthaRelation],
    title: "俱舍論實義疏",
    author: "尊者安惠造",
    extent: "5卷",
    summary: "来源文件本身完整保存五卷标号与稳定锚点，但学术研究判定现存汉文只是安慧 Tattvārthā 注疏的极端节本，约三页且只涉及前三品。平台因此计为完整来源文件中的部分作品见证，不冒充完整注疏。",
  },
  T1562: {
    slug: "taisho-t1562",
    workId: "gbcr:work:nyayanusara-sanghabhadra",
    workIdentityStatus: "verified_distinct_abhidharma_critique_work",
    workTitle: "阿毘达磨顺正理论（*Nyāyānusāra）",
    sourceRole: "traditional_authored_abhidharma_critique_and_commentary_translation",
    completeness: "complete_source_file",
    relations: [sanghabhadraFamily],
    title: "阿毘達磨順正理論",
    author: "尊者眾賢造 唐 玄奘譯",
    extent: "80卷",
    summary: "固定来源完整保存八十卷与稳定锚点；登记为众贤回应《俱舍论释》、阐明毘婆沙宗义的独立广论，与 T1563 建立广略派生关系而不合并作品。传统众贤造、玄奘译题记照录。",
  },
  T1563: {
    slug: "taisho-t1563",
    workId: "gbcr:work:abhidharmasamayapradipika-sanghabhadra",
    workIdentityStatus: "verified_distinct_abridged_exposition_work",
    workTitle: "阿毘达磨藏显宗论（*Abhidharmasamayapradīpikā）",
    sourceRole: "traditional_authored_abridged_abhidharma_exposition_translation",
    completeness: "complete_source_file",
    relations: [sanghabhadraFamily],
    title: "阿毘達磨藏顯宗論",
    author: "尊者眾賢造 唐 玄奘譯",
    extent: "40卷",
    summary: "固定来源完整保存四十卷与稳定锚点；其序颂自明为撮取《顺正理》广文的略论，机器对读也显示高度包含，但它经过删择、改颂并形成独立著作，故建立派生关系而不与 T1562 合并。",
  },
}));

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const gitBlobSha1 = (value) => createHash("sha1").update(`blob ${value.length}\0`).update(value).digest("hex");
const matchRequired = (text, pattern, label, id) => {
  const value = text.match(pattern)?.[1]?.trim();
  if (!value) throw new Error(`${id} 缺少 ${label}`);
  return value;
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
  const teiId = matchRequired(text, /<TEI[^>]+xml:id="([^"]+)"/, "TEI 标识", record.sourceRecordId);
  if (teiId !== record.sourceRecordId) throw new Error(`${record.sourceRecordId} TEI 标识漂移`);
  if (!text.includes("Available for non-commercial use when distributed with this header intact.")) {
    throw new Error(`${record.sourceRecordId} 缺少非商业与保留头部声明`);
  }
  const title = stripXml(matchRequired(text, /<title level="m" xml:lang="zh-Hant">([\s\S]*?)<\/title>/, "正藏题名", record.sourceRecordId));
  const author = stripXml(matchRequired(text, /<author>([\s\S]*?)<\/author>/, "传统作者与译者题记", record.sourceRecordId));
  const extent = matchRequired(text, /<extent>([^<]+)<\/extent>/, "卷数", record.sourceRecordId);
  const canonId = record.canonWitnessId;
  const decision = decisions.get(canonId);
  if (!decision) throw new Error(`T29 出现未裁决经号 ${canonId}`);
  if (title !== decision.title || author.replace(/\s+/g, " ") !== decision.author || extent !== decision.extent) {
    throw new Error(`${canonId} 题名、责任题记或卷数漂移：${title}/${author}/${extent}`);
  }

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
    slug: decision.slug,
    workId: decision.workId,
    workIdentityStatus: decision.workIdentityStatus,
    workTitle: decision.workTitle,
    sourceRole: decision.sourceRole,
    ...(decision.relations?.length ? { bibliographicRelations: decision.relations } : {}),
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
      tradition: "汉传佛教 · 毘昙部",
      language: "汉文",
      canonRef: `大正藏 T29, no. ${canonId.slice(1)}`,
      translator: author.replace(/\s+/g, " · "),
      summary: `${extent}。${decision.summary}`,
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
const pairIds = [
  ["T1558", "T1559"], ["T1558", "T1560"], ["T1559", "T1560"],
  ["T1562", "T1563"], ["T1558", "T1562"], ["T1558", "T1563"],
];
const comparisonPairs = pairIds.map(([left, right]) => compareBodies(left, right));
const comparisonByPair = new Map(comparisonPairs.map((item) => [item.pair.join("/"), item]));
const containment = (pair) => comparisonByPair.get(pair).fiveGramContainmentOfShorter;
const inRange = (pair, min, max) => containment(pair) >= min && containment(pair) <= max;
if (
  !inRange("T1558/T1559", 0.02, 0.021) || !inRange("T1558/T1560", 0.815, 0.817) ||
  !inRange("T1559/T1560", 0.026, 0.027) || !inRange("T1562/T1563", 0.89, 0.892) ||
  !inRange("T1558/T1562", 0.485, 0.487) || !inRange("T1558/T1563", 0.387, 0.389)
) throw new Error(`T29 作品体系文本比较漂移：${JSON.stringify(comparisonPairs)}`);

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
  rightsCategory: "Individually reviewed CBETA TEI files in Taishō volumes T01–T29; T29 source-record closure",
  workOverrides: {},
  fileOverrides: {},
  collection: {
    id: "CBETA-TAISHO-T29",
    title: "大正藏 T29 毘昙部固定来源记录",
    sourceRecordDenominator: 6,
    previouslyControlledSourceRecords: 0,
    newSourceRecords: files.length,
    controlledSourceRecords: files.length,
    newSourceBytes: files.reduce((sum, file) => sum + file.upstreamBytes, 0),
    newStableSegments: files.reduce((sum, file) => sum + file.verification.segments, 0),
    newFolios: files.reduce((sum, file) => sum + file.verification.folios, 0),
    verifiedSameWorkExpressions: files.filter((file) => file.workIdentityStatus === "verified_same_work_expression").length,
    verifiedPartialWorkWitnesses: files.filter((file) => file.workIdentityStatus === "verified_partial_work_witness").length,
    verifiedEditionWitnesses: files.filter((file) => file.workIdentityStatus === "verified_edition_witness").length,
    provisionalRecords: files.filter((file) => file.workIdentityStatus === "provisional_canon_record").length,
    newFullSourceTexts: files.filter((file) => file.completeness === "complete_source_file").length,
    newPartialSourceWitnesses: files.filter((file) => file.completeness !== "complete_source_file").length,
    relationAnnotatedRecords: files.filter((file) => file.bibliographicRelations?.length).length,
    attributionBoundaryRecords: files.filter((file) => file.sourceRole !== "translated_canonical_record").length,
    newWorks: batchWorkIds.size,
    controlledWorks: batchWorkIds.size,
    workCountingDecision: "T29 的 6 份来源记录登记为 6 个表达或见证、5 个批次内作品。T1558/T1559 是世亲《俱舍论释》的两个汉译表达；T1560 是独立本颂作品；T1561 是安慧注疏作品的极端节本见证；T1562/T1563 分别是众贤《顺正理》广论与《显宗》略论两个相关作品。因此新增五个作品而不是六个，所有论书均不标为佛陀逐字亲说。",
  },
  boundaryAudit: {
    status: "verified_source_integrity_work_expression_root_verse_extreme_abridgment_and_broad_short_relation_boundaries_recorded",
    existingControlledRecords: [],
    editionOrRecensionGroups: [sanghabhadraFamily.groupId],
    verifiedTranslationGroups: [kosaFamily.groupId],
    rootTreatiseCommentaryGroups: [kosaFamily.groupId, tattvarthaRelation.groupId, sanghabhadraFamily.groupId],
    candidateRelationsNotMerged: ["T1560→T1558/T1559（独立本颂，不与释论合并作品）", "T1563→T1562（显宗略论，不与顺正理广论合并作品）"],
    partialWorkWitnesses: ["T1561"],
    sourceRoles,
    textualComparison: {
      algorithm: "Unicode text from stable reading lines; punctuation/space removed; unique character 5-gram containment and Jaccard. Machine overlap records embedded root verses and broad/short derivative asymmetry only; work, authorship and translation decisions require independent bibliographic evidence.",
      pairs: comparisonPairs,
    },
    authoritySources: [
      "https://github.com/cbeta-org/xml-p5/tree/2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9/T/T29",
      "https://www2.hf.uio.no/polyglotta/index.php?page=volume&vid=511",
      "https://opac.ryukoku.ac.jp/iwjs0005opc/bdyview.do?bodyid=TD32028765&elmid=Body&fname=r-rcwbc-ej_2016_005.pdf",
      "https://austriaca.at/0xc1aa5572_0x004039be.pdf",
      "https://ci.nii.ac.jp/ncid/BD11712610.amp?l=en",
      "https://www.jstage.jst.go.jp/article/ibk/69/1/69_418/_article/-char/en",
      "https://hc.hcu.edu.tw/userfiles/file/paper11/04.pdf",
      "https://www.mahabodhi.org/files/yinshun/40/yinshun40-32.html",
      "https://authority.dila.edu.tw/person/search.php?aid=A000294",
    ],
    caveat: "T29 是阿毘达磨论书、根本颂、释论、注疏节本与广略论的集合，不是佛说经集合。平台完整保存固定来源，同时区分同本异译、本颂与自释、完整来源文件与部分作品见证、广论与略论、传统作者和译者题记；题名、目录位置、传统责任题记或机器相似度均不能单独证明作者事实、完整作品或佛陀逐字亲说归属。",
  },
  files,
};

if (
  batch.collection.newSourceRecords !== 6 || batch.collection.newSourceBytes !== 11019060 ||
  batch.collection.newStableSegments !== 83885 || batch.collection.newFolios !== 3042 ||
  batch.collection.verifiedSameWorkExpressions !== 2 || batch.collection.verifiedPartialWorkWitnesses !== 1 ||
  batch.collection.verifiedEditionWitnesses !== 0 || batch.collection.provisionalRecords !== 0 ||
  batch.collection.newFullSourceTexts !== 5 || batch.collection.newPartialSourceWitnesses !== 1 ||
  batch.collection.relationAnnotatedRecords !== 6 || batch.collection.attributionBoundaryRecords !== 6 ||
  batch.collection.newWorks !== 5 || batch.collection.controlledWorks !== 5
) throw new Error(`T29 关系、归属或作品边界统计漂移：${JSON.stringify(batch.collection)}`);

await writeFile(resolve(root, `data/corpus/cbeta/batch-v${version}.json`), `${JSON.stringify(batch, null, 2)}\n`, "utf8");
console.log(`CBETA T29 审计完成：6/6 个固定来源记录；新增 ${batch.collection.newWorks} 个作品、${batch.collection.newSourceRecords} 个表达或见证、${batch.collection.newStableSegments} 个稳定行段。`);

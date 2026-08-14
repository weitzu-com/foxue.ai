import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { buildPageNavigation, parseCbetaReadingLines } from "../src/lib/cbeta-tei.mjs";

const root = process.cwd();
const version = "4.5.0";
const expectedCommit = "2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9";
const sourceArgument = process.argv.find((argument) => argument.startsWith("--source-dir="));
if (!sourceArgument) {
  console.error("用法：node scripts/audit-cbeta-t38.mjs --source-dir=/固定提交的/xml-p5");
  process.exit(1);
}
const sourceRoot = resolve(sourceArgument.slice("--source-dir=".length));
const actualCommit = execFileSync("git", ["-C", sourceRoot, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (actualCommit !== expectedCommit) throw new Error(`上游工作树必须固定到 ${expectedCommit}`);

const inventoryPath = "data/gbcr/cbeta-taisho-t38-inventory-v0.1.0.json";
const inventory = JSON.parse(await readFile(resolve(root, inventoryPath), "utf8"));
const baseCatalogPath = "data/corpus/cbeta/catalog-v4.4.0.json";
const baseCatalog = JSON.parse(await readFile(resolve(root, baseCatalogPath), "utf8"));
const sourceUnits = (file) => file.sourceParts ?? [file];
const controlledPaths = new Set(baseCatalog.files.flatMap(sourceUnits).map((file) => file.upstreamPath));
const candidates = inventory.records.filter((record) => !controlledPaths.has(record.upstreamPath));
if (inventory.totals.records !== 18 || inventory.totals.upstreamBytes !== 13495590 || candidates.length !== 18) {
  throw new Error(`T38 固定来源分母或新增记录漂移：${inventory.totals.records}/${candidates.length}`);
}

const relation = (type, groupId, label, evidence, ids) => ({
  type,
  groupId,
  label,
  evidence,
  externalIds: { cbeta: ids },
});
const nirvanaExegesis = relation(
  "commentaries_on_southern_nirvana_recension_distinct",
  "nirvana-exegesis-t0375-t1765-t1769",
  "南本《大般涅槃经》与 T1765–T1769 五部玄义、经疏、游意及宗要",
  "DILA T1765–T1769 规范记录均把 T0375 标为相关经典。五部作品的作者、题名、体例与篇幅不同；根本经和后世诠释保持六个作品实体。",
  ["T0375", "T1765", "T1766", "T1767", "T1768", "T1769"],
);
const nirvanaSubcommentary = relation(
  "commentary_and_subcommentary_on_nirvana_sutra_distinct",
  "nirvana-commentary-subcommentary-t0375-t1765-t1766",
  "《大般涅槃经》、灌顶《玄义》与智圆《发源机要》",
  "DILA T1765 与 T1766 规范记录互相关联，题名和内容责任显示 T1766 依 T1765 发明玄义。根经、玄义与再注释分层登记。",
  ["T0375", "T1765", "T1766"],
);
const nirvanaSameAuthor = relation(
  "related_expositions_by_same_author_distinct",
  "guanding-nirvana-expositions-t1765-t1767",
  "灌顶《大般涅槃经玄义》与《大般涅槃经疏》",
  "DILA T1765 与 T1767 规范记录互相关联并同署灌顶；玄义与三十三卷随文经疏具有不同题名、结构和范围，保持两个作品。",
  ["T0375", "T1765", "T1767"],
);
const medicineBuddhaExegesis = relation(
  "commentary_on_medicine_buddha_sutra_distinct",
  "medicine-buddha-exegesis-t0450-t1770",
  "《药师琉璃光如来本愿功德经》与太贤《本愿药师经古迹》",
  "DILA T1770 规范记录把 T0450 标为相关经典。两卷古迹是独立经疏作品，不是根本经的另一表达。",
  ["T0450", "T1770"],
);
const maitreyaUpperExegesis = relation(
  "commentaries_on_maitreya_upper_birth_sutra_distinct",
  "maitreya-upper-birth-exegesis-t0452-t1771-t1774",
  "《观弥勒菩萨上生兜率天经》与 T1771–T1774 四部游意、赞、宗要及经疏",
  "DILA T1771–T1774 规范记录均把 T0452 标为相关经典。四部注疏作者与体例不同，T1774 还同时解释另外两部弥勒经，均保持独立作品。",
  ["T0452", "T1771", "T1772", "T1773", "T1774"],
);
const threeMaitreyaExegesis = relation(
  "commentary_on_three_maitreya_sutras_distinct",
  "three-maitreya-sutras-exegesis-t0452-t0454-t0456-t1774",
  "弥勒上生、下生成佛与大成佛三经及憬兴《三弥勒经疏》",
  "DILA T1774 规范记录同时关联 T0452、T0454 与 T0456。多根经注疏仍是一个独立诠释作品，不能复制为三部作品，也不与任一根经合并。",
  ["T0452", "T0454", "T0456", "T1774"],
);
const vimalakirtiExegesis = relation(
  "commentaries_on_vimalakirti_sutra_distinct",
  "vimalakirti-exegesis-t0475-t1775-t1781",
  "《维摩诘所说经》与 T1775–T1781 七部注、义记、玄疏、略疏、再注及玄论义疏",
  "DILA T1775–T1781 规范记录均把 T0475 标为相关经典。七部作品跨后秦、隋唐与宋，责任、题名、层级和范围不同，根经与各层诠释分开登记。",
  ["T0475", "T1775", "T1776", "T1777", "T1778", "T1779", "T1780", "T1781"],
);
const tiantaiVimalakirtiRecensions = relation(
  "related_tiantai_commentary_recensions_distinct",
  "tiantai-vimalakirti-commentaries-t1777-t1778",
  "智顗《维摩经玄疏》与智顗说、湛然略《维摩经略疏》",
  "DILA T1777 与 T1778 规范记录互相关联，但责任题记、题名、卷数与编定层不同。共同教说传统与略疏关系不构成同一表达。",
  ["T0475", "T1777", "T1778"],
);
const vimalakirtiSubcommentary = relation(
  "commentary_and_subcommentary_on_vimalakirti_sutra_distinct",
  "vimalakirti-commentary-subcommentary-t0475-t1778-t1779",
  "《维摩诘所说经》、智顗说湛然略疏与智圆《垂裕记》",
  "DILA T1778 与 T1779 规范记录互相关联；T1779 依《维摩经略疏》展开十卷再注。根经、略疏和垂裕记分层登记。",
  ["T0475", "T1778", "T1779"],
);
const jizangVimalakirti = relation(
  "related_commentaries_by_same_author_distinct",
  "jizang-vimalakirti-commentaries-t1780-t1781",
  "吉藏《净名玄论》与《维摩经义疏》",
  "DILA T1780 与 T1781 规范记录互相关联并同署吉藏；玄论与六卷义疏题名、结构和范围不同，保持两个作品。",
  ["T0475", "T1780", "T1781"],
);
const xuanzangVimalakirtiExegesis = relation(
  "commentary_on_xuanzang_vimalakirti_translation_distinct",
  "xuanzang-vimalakirti-exegesis-t0476-t1782",
  "玄奘《说无垢称经》与窥基《说无垢称经疏》",
  "DILA T1782 规范记录把 T0476 标为相关经典。六卷经疏是独立诠释作品，不与玄奘译本或罗什 T0475 表达合并。",
  ["T0476", "T1782"],
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
  T1765: d("nirvana-xuanyi-guanding", "sinitic_authored_doctrinal_exposition", [nirvanaExegesis, nirvanaSubcommentary, nirvanaSameAuthor], "灌顶《大般涅槃经玄义》完整来源。"),
  T1766: d("nirvana-xuanyi-fayuan-jiyao-zhiyuan", "sinitic_authored_subcommentary", [nirvanaExegesis, nirvanaSubcommentary], "智圆《涅槃玄义发源机要》再注释完整来源。"),
  T1767: d("nirvana-shu-guanding", "sinitic_authored_sutra_commentary", [nirvanaExegesis, nirvanaSameAuthor], "灌顶《大般涅槃经疏》完整来源。"),
  T1768: d("nirvana-youyi-jizang", "sinitic_authored_doctrinal_exposition", [nirvanaExegesis], "吉藏《涅槃经游意》完整来源。"),
  T1769: d("nirvana-zongyao-wonhyo", "sinitic_authored_doctrinal_exposition", [nirvanaExegesis], "元晓《涅槃宗要》完整来源。"),
  T1770: d("medicine-buddha-gojeok-taehyeon", "sinitic_authored_sutra_commentary", [medicineBuddhaExegesis], "太贤《本愿药师经古迹》完整来源。"),
  T1771: d("maitreya-jing-youyi-jizang", "sinitic_authored_doctrinal_exposition", [maitreyaUpperExegesis], "吉藏《弥勒经游意》完整来源。"),
  T1772: d("maitreya-upper-birth-zan-kuiji", "sinitic_authored_sutra_commentary", [maitreyaUpperExegesis], "窥基《观弥勒上生兜率天经赞》完整来源。"),
  T1773: d("maitreya-upper-birth-zongyao-wonhyo", "sinitic_authored_doctrinal_exposition", [maitreyaUpperExegesis], "元晓《弥勒上生经宗要》完整来源。"),
  T1774: d("three-maitreya-sutras-commentary-gyeongheung", "sinitic_authored_multi_sutra_commentary", [maitreyaUpperExegesis, threeMaitreyaExegesis], "憬兴《三弥勒经疏》多根经注疏完整来源。"),
  T1775: d("zhu-vimalakirti-sengzhao", "sinitic_compiled_sutra_commentary", [vimalakirtiExegesis], "僧肇撰《注维摩诘经》完整来源，保留传统汇注责任边界。"),
  T1776: d("vimalakirti-yiji-huiyuan", "sinitic_authored_sutra_commentary", [vimalakirtiExegesis], "慧远《维摩义记》完整来源。"),
  T1777: d("vimalakirti-xuanshu-zhiyi", "sinitic_authored_sutra_commentary", [vimalakirtiExegesis, tiantaiVimalakirtiRecensions], "智顗《维摩经玄疏》完整来源。"),
  T1778: d("vimalakirti-lueshu-zhiyi-zhanran", "sinitic_taught_abridged_commentary_record", [vimalakirtiExegesis, tiantaiVimalakirtiRecensions, vimalakirtiSubcommentary], "智顗说、湛然略《维摩经略疏》完整来源。"),
  T1779: d("vimalakirti-chuiyu-ji-zhiyuan", "sinitic_authored_subcommentary", [vimalakirtiExegesis, vimalakirtiSubcommentary], "智圆《维摩经略疏垂裕记》再注释完整来源。"),
  T1780: d("jingming-xuanlun-jizang", "sinitic_authored_doctrinal_exposition", [vimalakirtiExegesis, jizangVimalakirti], "吉藏《净名玄论》完整来源。"),
  T1781: d("vimalakirti-yishu-jizang", "sinitic_authored_sutra_commentary", [vimalakirtiExegesis, jizangVimalakirti], "吉藏《维摩经义疏》完整来源。"),
  T1782: d("wugoucheng-shu-kuiji", "sinitic_authored_sutra_commentary", [xuanzangVimalakirtiExegesis], "窥基《说无垢称经疏》完整来源。"),
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
  if (!decision) throw new Error(`T38 出现未裁决经号 ${canonId}`);

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
      tradition: "汉传佛教 · 经疏部 · 涅槃、药师、弥勒与维摩",
      language: "汉文",
      canonRef: `大正藏 T38, no. ${canonId.slice(1)}`,
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
  ["T1765", "T1766"], ["T1765", "T1767"], ["T1768", "T1769"],
  ["T1771", "T1772"], ["T1772", "T1773"], ["T1775", "T1776"],
  ["T1777", "T1778"], ["T1778", "T1779"], ["T1780", "T1781"],
].map(([left, right]) => compareBodies(left, right));
const sourceRoles = Object.fromEntries([...new Set(files.map((file) => file.sourceRole))].sort().map((role) => [
  role,
  files.filter((file) => file.sourceRole === role).map((file) => file.id),
]));
const batchWorkIds = new Set(files.map((file) => file.workId));
const rootTreatiseCommentaryGroups = [
  "nirvana-exegesis-t0375-t1765-t1769",
  "medicine-buddha-exegesis-t0450-t1770",
  "maitreya-upper-birth-exegesis-t0452-t1771-t1774",
  "three-maitreya-sutras-exegesis-t0452-t0454-t0456-t1774",
  "vimalakirti-exegesis-t0475-t1775-t1781",
  "xuanzang-vimalakirti-exegesis-t0476-t1782",
];
const batch = {
  schema: "https://foxue.ai/schemas/cbeta-controlled-batch-v1.0",
  version,
  publishedAt: "2026-08-15",
  baseCatalog: baseCatalogPath,
  inventory: inventoryPath,
  rightsCategory: "Individually reviewed CBETA TEI files in Taishō volumes T01–T38; T38 source-record closure",
  workOverrides: {},
  fileOverrides: {},
  collection: {
    id: "CBETA-TAISHO-T38",
    title: "大正藏 T38 涅槃、药师、弥勒与维摩经疏部固定来源记录",
    sourceRecordDenominator: 18,
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
    workCountingDecision: "T38 的 18 份来源记录登记为 18 个完整表达和 18 个独立经疏作品。T1765–T1769 连接 T0375，其中 T1766 是依 T1765 的再注释；T1770 连接 T0450；T1771–T1774 连接 T0452，且 T1774 同时解释 T0454 与 T0456；T1775–T1781 连接 T0475，其中 T1777/T1778 保持不同编定层、T1779 是 T1778 的再注；T1782 连接玄奘译 T0476。所有记录均不标作根本经表达或佛陀逐字亲说。",
  },
  boundaryAudit: {
    status: "verified_source_integrity_root_translation_commentary_multi_root_abridged_recension_compiled_commentary_and_subcommentary_boundaries_recorded",
    existingControlledRecords: ["T0375", "T0450", "T0452", "T0454", "T0456", "T0475", "T0476"],
    verifiedTranslationGroups: [],
    rootTreatiseCommentaryGroups,
    subcommentaryGroups: [
      "nirvana-commentary-subcommentary-t0375-t1765-t1766",
      "vimalakirti-commentary-subcommentary-t0475-t1778-t1779",
    ],
    relatedDistinctWorkGroups: [
      "guanding-nirvana-expositions-t1765-t1767",
      "tiantai-vimalakirti-commentaries-t1777-t1778",
      "jizang-vimalakirti-commentaries-t1780-t1781",
    ],
    candidateRelationsNotMerged: [
      "T0375↔T1765–T1769，T1765↔T1766（涅槃根经、玄义、经疏与发源机要再注释分层保存）",
      "T0450↔T1770（药师根经与太贤古迹分层保存）",
      "T0452↔T1771–T1774，T1774↔T0454/T0456（上生经注疏与三弥勒经多根经注疏分层保存）",
      "T0475↔T1775–T1781，T1777↔T1778↔T1779（根经、玄疏、略疏与垂裕记再注释分层保存）",
      "T0476↔T1782（玄奘译本与窥基经疏分层保存，不并入罗什译 T0475）",
      "T1765↔T1767、T1780↔T1781（同作者异作只形成关系，不合并作品）",
    ],
    partialWorkWitnesses: [],
    sourceRoles,
    textualComparison: {
      algorithm: "Unicode text from stable reading lines; punctuation/space removed; unique character 5-gram containment and Jaccard. Text overlap only records quotation, abridgment and exegetical dependence; it cannot merge root translations, direct commentaries, compiled annotations, abridged recensions, subcommentaries, multi-root commentaries or same-author works.",
      pairs: comparisonPairs,
    },
    authoritySources: [
      "https://github.com/cbeta-org/xml-p5/tree/2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9/T/T38",
      ...["CA0000539", "CA0003691", "CA0001195", "CA0002193", "CA0002176", "CA0003301", "CA0003201", "CA0000545", "CA0002374", "CA0000544", "CA0002372", "CA0002375", "CA0003688", "CA0002179", "CA0001197", "CA0002190", "CA0002734", "CA0003303", "CA0003314", "CA0003313", "CA0003304", "CA0003306", "CA0001828", "CA0003315", "CA0003202"].map((code) => `https://authority.dila.edu.tw/catalog/search.php?code=${code}`),
    ],
    caveat: "T38 是经疏部，不是佛说经集合。平台完整保存固定来源，同时区分涅槃、药师、弥勒与维摩诸根经表达，以及玄义、发源机要再注、游意、宗要、赞、经疏、汇注、略疏、垂裕记和多根经注疏；共同经题、同作者、传统责任题记、略本关系、正文引文或机器相似度都不能单独证明作品相同、作者无争议或佛陀逐字亲说。",
  },
  files,
};

const outputPath = resolve(root, `data/corpus/cbeta/batch-v${version}.json`);
await writeFile(outputPath, `${JSON.stringify(batch, null, 2)}\n`, "utf8");
console.log(`CBETA T38 审计完成：${files.length}/${inventory.totals.records} 个固定来源记录；新增 ${batchWorkIds.size} 个作品、${files.length} 个表达、${batch.collection.newStableSegments} 个稳定行段、${batch.collection.newFolios} 个版页单元、${batch.collection.newJuans} 卷。`);

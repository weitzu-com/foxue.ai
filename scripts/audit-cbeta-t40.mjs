import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { buildPageNavigation, parseCbetaReadingLines } from "../src/lib/cbeta-tei.mjs";

const root = process.cwd();
const version = "4.7.0";
const expectedCommit = "2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9";
const sourceArgument = process.argv.find((argument) => argument.startsWith("--source-dir="));
if (!sourceArgument) {
  console.error("用法：node scripts/audit-cbeta-t40.mjs --source-dir=/固定提交的/xml-p5");
  process.exit(1);
}
const sourceRoot = resolve(sourceArgument.slice("--source-dir=".length));
const actualCommit = execFileSync("git", ["-C", sourceRoot, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (actualCommit !== expectedCommit) throw new Error(`上游工作树必须固定到 ${expectedCommit}`);

const inventoryPath = "data/gbcr/cbeta-taisho-t40-inventory-v0.1.0.json";
const inventory = JSON.parse(await readFile(resolve(root, inventoryPath), "utf8"));
const baseCatalogPath = "data/corpus/cbeta/catalog-v4.6.0.json";
const baseCatalog = JSON.parse(await readFile(resolve(root, baseCatalogPath), "utf8"));
const sourceUnits = (file) => file.sourceParts ?? [file];
const controlledPaths = new Set(baseCatalog.files.flatMap(sourceUnits).map((file) => file.upstreamPath));
const candidates = inventory.records.filter((record) => !controlledPaths.has(record.upstreamPath));
if (inventory.totals.records !== 17 || inventory.totals.upstreamBytes !== 13266426 || candidates.length !== 17) {
  throw new Error(`T40 固定来源分母或新增记录漂移：${inventory.totals.records}/${candidates.length}`);
}

const relation = (type, groupId, label, evidence, ids) => ({
  type,
  groupId,
  label,
  evidence,
  externalIds: { cbeta: ids },
});
const dharmaguptakaPractice = relation(
  "vinaya_root_practice_manual_and_subcommentary_distinct",
  "dharmaguptaka-practice-t1428-t1804-t1805",
  "《四分律》、道宣《行事钞》与元照《资持记》",
  "DILA T1804 关联 T1428 与 T1805，T1805 关联 T1428 与 T1804。根本广律、律学行事钞和对行事钞的资持记分为三层作品。",
  ["T1428", "T1804", "T1805"],
);
const practiceSubcommentary = relation(
  "vinaya_manual_and_subcommentary_distinct",
  "dharmaguptaka-practice-subcommentary-t1804-t1805",
  "道宣《四分律行事钞》与元照《资持记》",
  "T1805 以 T1804 为直接解释对象；引用相同律文与科判不能把宋代再注释并入唐代行事钞。",
  ["T1428", "T1804", "T1805"],
);
const bhiksuPreceptExegesis = relation(
  "bhiksu_precept_roots_and_commentaries_distinct",
  "dharmaguptaka-bhiksu-precept-t1429-t1430-t1806-t1807",
  "四分律比丘戒本及道宣含注本、定宾疏",
  "DILA T1806、T1807 均关联 T1429 与 T1430。戒本、含注戒本和戒本疏在文本功能与作者责任上不同。",
  ["T1429", "T1430", "T1806", "T1807"],
);
const karmanManuals = relation(
  "karman_roots_and_gender_scoped_manuals_distinct",
  "dharmaguptaka-karman-t1432-t1434-t1808-t1810",
  "四分律羯磨根本资料与道宣、怀素三部羯磨编集",
  "DILA 将 T1808 关联 T1432–T1434，将 T1809 关联 T1432/T1433/T1808，将 T1810 关联 T1432/T1808。通用、僧众与尼众适用范围及编集责任不同。",
  ["T1432", "T1433", "T1434", "T1808", "T1809", "T1810"],
);
const karmanScope = relation(
  "general_monk_nun_karman_scope_distinct",
  "dharmaguptaka-karman-scope-t1808-t1810",
  "道宣《随机羯磨》与怀素《僧羯磨》《尼羯磨》",
  "三部编集共享四分律羯磨传统，但通用删补、僧众和尼众范围不可互换；相似仪式语句不是同一作品证明。",
  ["T1808", "T1809", "T1810"],
);
const brahmaNetCommentaries = relation(
  "commentaries_on_brahma_net_bodhisattva_precepts_distinct",
  "brahma-net-precept-exegesis-t1484-t1811-t1815",
  "《梵网经》菩萨戒与五部东亚戒疏",
  "DILA T1811–T1815 均关联 T1484。智顗说本、明旷删补本、法藏疏、义寂疏与太贤古迹记在作者、结构和传承上不同。",
  ["T1484", "T1811", "T1812", "T1813", "T1814", "T1815"],
);
const tiantaiPreceptRevision = relation(
  "tiantai_precept_commentary_and_revision_distinct",
  "tiantai-precept-commentary-t1811-t1812",
  "智顗说、灌顶记《菩萨戒义疏》与明旷删补《天台菩萨戒疏》",
  "T1812 责任题记明确为明旷删补；即使承用天台戒疏传统，也作为具有独立删补责任与文本边界的作品保存。",
  ["T1484", "T1811", "T1812"],
);
const diamondTreatiseExegesis = relation(
  "commentary_on_diamond_prajna_treatise_distinct",
  "diamond-treatise-exegesis-t1511-t1816",
  "《金刚般若波罗蜜经论》与窥基《会释》",
  "DILA T1816 关联 T1511。三卷会释是独立论疏，不是论本的另一表达。",
  ["T1511", "T1816"],
);
const diamondFinalVerse = relation(
  "commentary_on_diamond_prajna_final_verse_distinct",
  "diamond-final-verse-t1510a-t1514-t1817",
  "金刚般若论书群与义净《末后一颂赞述》",
  "DILA T1817 关联 T1510a、T1511、T1512、T1513、T1514；其范围仅为末后一颂，不能并入任一完整论本或其他论疏。",
  ["T1510a", "T1511", "T1512", "T1513", "T1514", "T1817"],
);
const lotusTreatiseExegesis = relation(
  "commentary_on_lotus_treatise_distinct",
  "lotus-treatise-exegesis-t1519-t1818",
  "《妙法莲华经忧波提舍》与吉藏《法华论疏》",
  "DILA T1818 关联 T1519。三卷疏是独立解释作品，不是世亲论本表达。",
  ["T1519", "T1818"],
);
const rebirthTreatiseExegesis = relation(
  "commentary_on_rebirth_treatise_distinct",
  "rebirth-treatise-exegesis-t1524-t1819",
  "《无量寿经优波提舍》与昙鸾《往生论注》",
  "DILA T1819 关联 T1524。二卷注解是独立净土论疏，不与论本或无量寿经译本合并。",
  ["T1524", "T1819"],
);
const bequeathedTeachingExegesis = relation(
  "sutra_treatise_abridgment_and_supplement_distinct",
  "bequeathed-teaching-t0389-t1529-t1820",
  "《佛遗教经》、遗教经论与净源节要、袾宏补注本",
  "DILA T1820 同时关联 T0389 与 T1529。其责任题记明确包含宋代节要和明代补注，须与根经、论本及原疏层级分开。",
  ["T0389", "T1529", "T1820"],
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
  T1804: d("dharmaguptaka-vinaya-xingshi-chao-daoxuan", "sinitic_compiled_vinaya_practice_manual", [dharmaguptakaPractice, practiceSubcommentary], "道宣《四分律删繁补阙行事钞》完整来源。"),
  T1805: d("dharmaguptaka-vinaya-zichi-ji-yuanzhao", "sinitic_authored_vinaya_subcommentary", [dharmaguptakaPractice, practiceSubcommentary], "元照《四分律行事钞资持记》再注释完整来源。"),
  T1806: d("dharmaguptaka-bhiksu-precept-annotated-daoxuan", "sinitic_annotated_bhiksu_precept_text", [bhiksuPreceptExegesis], "道宣《四分律比丘含注戒本》完整来源。"),
  T1807: d("dharmaguptaka-bhiksu-precept-shu-dingbin", "sinitic_authored_bhiksu_precept_commentary", [bhiksuPreceptExegesis], "定宾《四分比丘戒本疏》完整来源。"),
  T1808: d("dharmaguptaka-suiji-karman-daoxuan", "sinitic_compiled_vinaya_karman_manual", [karmanManuals, karmanScope], "道宣《四分律删补随机羯磨》完整来源。"),
  T1809: d("dharmaguptaka-monk-karman-huaisu", "sinitic_compiled_monk_karman_manual", [karmanManuals, karmanScope], "怀素《僧羯磨》完整来源。"),
  T1810: d("dharmaguptaka-nun-karman-huaisu", "sinitic_compiled_nun_karman_manual", [karmanManuals, karmanScope], "怀素《尼羯磨》完整来源。"),
  T1811: d("brahma-net-bodhisattva-precept-yishu-zhiyi-guanding", "sinitic_taught_precept_commentary_record", [brahmaNetCommentaries, tiantaiPreceptRevision], "智顗说、灌顶记《菩萨戒义疏》完整来源。"),
  T1812: d("tiantai-bodhisattva-precept-shu-mingkuang", "sinitic_revised_precept_commentary", [brahmaNetCommentaries, tiantaiPreceptRevision], "明旷删补《天台菩萨戒疏》完整来源。"),
  T1813: d("brahma-net-precept-shu-fazang", "sinitic_authored_precept_commentary", [brahmaNetCommentaries], "法藏《梵网经菩萨戒本疏》完整来源。"),
  T1814: d("bodhisattva-precept-shu-ui-jeok", "silla_authored_precept_commentary", [brahmaNetCommentaries], "新罗义寂《菩萨戒本疏》完整来源。"),
  T1815: d("brahma-net-gojeok-gi-taehyeon", "silla_compiled_precept_commentary", [brahmaNetCommentaries], "新罗太贤《梵网经古迹记》完整来源。"),
  T1816: d("diamond-prajna-treatise-huishi-kuiji", "sinitic_authored_treatise_commentary", [diamondTreatiseExegesis], "窥基《金刚般若论会释》完整来源。"),
  T1817: d("diamond-prajna-final-verse-zanshu-yijing", "sinitic_authored_verse_commentary", [diamondFinalVerse], "义净《略明般若末后一颂赞述》完整来源。"),
  T1818: d("lotus-treatise-shu-jizang", "sinitic_authored_treatise_commentary", [lotusTreatiseExegesis], "吉藏《法华论疏》完整来源。"),
  T1819: d("rebirth-treatise-commentary-tanluan", "sinitic_authored_treatise_commentary", [rebirthTreatiseExegesis], "昙鸾《无量寿经优婆提舍愿生偈注》完整来源。"),
  T1820: d("bequeathed-teaching-treatise-shu-jieyao", "sinitic_abridged_supplemented_treatise_commentary", [bequeathedTeachingExegesis], "净源节要、袾宏补注《佛遗教经论疏节要》完整来源。"),
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
  if (!decision) throw new Error(`T40 出现未裁决经号 ${canonId}`);

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
      tradition: "汉传佛教 · 律疏与经论疏部 · 四分律、菩萨戒、般若、法华、净土及遗教",
      language: "汉文",
      canonRef: `大正藏 T40, no. ${canonId.slice(1)}`,
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
  ["T1804", "T1805"], ["T1806", "T1807"], ["T1808", "T1809"], ["T1808", "T1810"], ["T1809", "T1810"],
  ["T1811", "T1812"], ["T1811", "T1813"], ["T1813", "T1814"], ["T1813", "T1815"], ["T1814", "T1815"],
  ["T1816", "T1817"],
].map(([left, right]) => compareBodies(left, right));
const sourceRoles = Object.fromEntries([...new Set(files.map((file) => file.sourceRole))].sort().map((role) => [
  role,
  files.filter((file) => file.sourceRole === role).map((file) => file.id),
]));
const batchWorkIds = new Set(files.map((file) => file.workId));
const rootVinayaCommentaryGroups = [
  "dharmaguptaka-practice-t1428-t1804-t1805",
  "dharmaguptaka-bhiksu-precept-t1429-t1430-t1806-t1807",
  "dharmaguptaka-karman-t1432-t1434-t1808-t1810",
  "brahma-net-precept-exegesis-t1484-t1811-t1815",
];
const rootTreatiseCommentaryGroups = [
  "diamond-treatise-exegesis-t1511-t1816",
  "diamond-final-verse-t1510a-t1514-t1817",
  "lotus-treatise-exegesis-t1519-t1818",
  "rebirth-treatise-exegesis-t1524-t1819",
  "bequeathed-teaching-t0389-t1529-t1820",
];
const batch = {
  schema: "https://foxue.ai/schemas/cbeta-controlled-batch-v1.0",
  version,
  publishedAt: "2026-08-15",
  baseCatalog: baseCatalogPath,
  inventory: inventoryPath,
  rightsCategory: "Individually reviewed CBETA TEI files in Taishō volumes T01–T40; T40 source-record closure",
  workOverrides: {},
  fileOverrides: {},
  collection: {
    id: "CBETA-TAISHO-T40",
    title: "大正藏 T40 四分律、菩萨戒及经论疏部固定来源记录",
    sourceRecordDenominator: 17,
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
    workCountingDecision: "T40 的 17 份来源记录登记为 17 个完整表达和 17 个独立律学或经论疏作品。T1804/T1805 保持行事钞—再注释层级；T1806/T1807 保持含注戒本与戒本疏边界；T1808–T1810 按通用、僧众、尼众羯磨范围分开；T1811–T1815 保持五部梵网菩萨戒疏异作；T1817 仅释般若末后一颂；T1820 保存节要与补注的复合责任。所有记录均不标作根本律、根本经、论本表达或佛陀逐字亲说。",
  },
  boundaryAudit: {
    status: "verified_source_integrity_vinaya_root_manual_precept_karman_gender_scope_treatise_commentary_revision_abridgment_supplement_and_subcommentary_boundaries_recorded",
    existingControlledRecords: ["T0389", "T1428", "T1429", "T1430", "T1432", "T1433", "T1434", "T1484", "T1510a", "T1511", "T1512", "T1513", "T1514", "T1519", "T1524", "T1529"],
    verifiedTranslationGroups: [],
    rootVinayaCommentaryGroups,
    rootTreatiseCommentaryGroups,
    subcommentaryGroups: ["dharmaguptaka-practice-subcommentary-t1804-t1805"],
    scopeBoundaryGroups: ["dharmaguptaka-bhiksu-precept-t1429-t1430-t1806-t1807", "dharmaguptaka-karman-scope-t1808-t1810", "tiantai-precept-commentary-t1811-t1812"],
    relatedDistinctWorkGroups: ["dharmaguptaka-karman-scope-t1808-t1810", "brahma-net-precept-exegesis-t1484-t1811-t1815", "diamond-final-verse-t1510a-t1514-t1817", "bequeathed-teaching-t0389-t1529-t1820"],
    candidateRelationsNotMerged: [
      "T1428↔T1804↔T1805（根本广律、行事钞与资持记再注释分层保存）",
      "T1429/T1430↔T1806/T1807（戒本、含注戒本与戒本疏分层保存）",
      "T1432–T1434↔T1808–T1810（羯磨根本资料与通用、僧众、尼众编集按范围分层）",
      "T1484↔T1811–T1815（梵网菩萨戒根本经与五部东亚戒疏保持异作）",
      "T1511↔T1816；T1510a–T1514↔T1817（完整般若论书群、会释与末后一颂范围分层）",
      "T1519↔T1818，T1524↔T1819（法华、净土论本与东亚论疏分层）",
      "T0389/T1529↔T1820（根经、论本与净源节要、袾宏补注的复合编辑责任分层）",
    ],
    partialWorkWitnesses: [],
    sourceRoles,
    textualComparison: {
      algorithm: "Unicode text from stable reading lines; punctuation/space removed; unique character 5-gram containment and Jaccard. Text overlap only records quotation, revision and exegetical dependence; it cannot merge a root vinaya, precept text, karman source, treatise, practice manual, gender-scoped manual, direct commentary, revised commentary, abridgment, supplement or subcommentary.",
      pairs: comparisonPairs,
    },
    authoritySources: [
      "https://github.com/cbeta-org/xml-p5/tree/2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9/T/T40",
      ...["CA0002804", "CA0002815", "CA0002789", "CA0002777", "CA0002799", "CA0002821", "CA0002348", "CA0002439", "CA0000995", "CA0000978", "CA0000980", "CA0000972", "CA0001608", "CA0002142", "CA0000900", "CA0003294", "CA0001094"].map((code) => `https://authority.dila.edu.tw/catalog/search.php?code=${code}`),
    ],
    caveat: "T40 是律疏与经论疏集合，不是佛说经集合。平台完整保存固定来源，同时区分根本律、戒本、羯磨、论本、行事钞、含注本、男女众范围、直接疏、删补本、再注释、末后一颂、节要与补注；目录部类、共同根本典籍、相近题名、同作者、仪式套语、传统责任题记或机器相似度都不能单独证明作品相同、作者无争议或佛陀逐字亲说。",
  },
  files,
};

const outputPath = resolve(root, `data/corpus/cbeta/batch-v${version}.json`);
await writeFile(outputPath, `${JSON.stringify(batch, null, 2)}\n`, "utf8");
console.log(`CBETA T40 审计完成：${files.length}/${inventory.totals.records} 个固定来源记录；新增 ${batchWorkIds.size} 个作品、${files.length} 个表达、${batch.collection.newStableSegments} 个稳定行段、${batch.collection.newFolios} 个版页单元、${batch.collection.newJuans} 卷。`);

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { buildPageNavigation, parseCbetaReadingLines } from "../src/lib/cbeta-tei.mjs";

const root = process.cwd();
const version = "3.5.0";
const expectedCommit = "2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9";
const sourceArgument = process.argv.find((argument) => argument.startsWith("--source-dir="));
if (!sourceArgument) {
  console.error("用法：node scripts/audit-cbeta-t28.mjs --source-dir=/固定提交的/xml-p5");
  process.exit(1);
}
const sourceRoot = resolve(sourceArgument.slice("--source-dir=".length));
const actualCommit = execFileSync("git", ["-C", sourceRoot, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (actualCommit !== expectedCommit) throw new Error(`上游工作树必须固定到 ${expectedCommit}`);

const inventoryPath = "data/gbcr/cbeta-taisho-t28-inventory-v0.1.0.json";
const inventory = JSON.parse(await readFile(resolve(root, inventoryPath), "utf8"));
const baseCatalogPath = "data/corpus/cbeta/catalog-v3.4.0.json";
const baseCatalog = JSON.parse(await readFile(resolve(root, baseCatalogPath), "utf8"));
const sourceUnits = (file) => file.sourceParts ?? [file];
const controlledPaths = new Set(baseCatalog.files.flatMap(sourceUnits).map((file) => file.upstreamPath));
const candidates = inventory.records.filter((record) => !controlledPaths.has(record.upstreamPath));
if (inventory.totals.records !== 12 || inventory.totals.upstreamBytes !== 14447693 || candidates.length !== 12) {
  throw new Error(`T28 固定来源分母或新增记录漂移：${inventory.totals.records}/${candidates.length}`);
}

const mahavibhasaOldTranslation = {
  type: "partial_old_translation_witness_verified",
  groupId: "maha-vibhasa-chinese-t1545-t1546",
  label: "《大毘婆沙论》玄奘译与残存旧译见证",
  evidence: "DILA 将 T1546 与 T1545 列为相关经典；CBC@ 所录研究进一步指出 T1546 的原本与 T1545 所译版本大体相同，旧译原为一百卷，兵乱后只存六十卷。平台把 T1546 归入既有《大毘婆沙论》作品，但标成完整来源文件中的部分作品见证，不冒充完整译本。",
  externalIds: { cbeta: ["T1545", "T1546"] },
};
const mahavibhasaAbridgment = {
  type: "abridged_recension_relation_verified",
  groupId: "maha-vibhasa-abridgment-t1547",
  label: "《鞞婆沙论》与《大毘婆沙论》的节要／版本关系",
  evidence: "权威人名资料将 T1547 说明为尸陀槃尼节抄的《大毘婆沙论》，CBC@ 又记录其并非全译且译出、修订责任存在多种学术判断。平台把它作为独立节要／版本作品与《大毘婆沙论》关联，不强行并入完整作品，也不把传统题记改写成无争议的现代定论。",
  externalIds: { cbeta: ["T1545", "T1547"] },
};
const hrdayaFamily = {
  type: "root_treatise_expansion_commentary_family_verified",
  groupId: "abhidharma-hrdaya-family-t1550-t1552",
  label: "《阿毘曇心论》根本论、优波扇多扩释与法救增广体系",
  evidence: "T1551 题记明确区分法胜论与优波扇多释；T1552 正文及研究资料说明其以法胜《阿毘曇心论》为基础增广。三部共享论书谱系，但分别形成根本论、扩释与增广作品，平台建立关系而不合并作品。",
  externalIds: { cbeta: ["T1550", "T1551", "T1552"] },
};
const pancavastukaFamily = {
  type: "same_work_translations_components_and_commentary_verified",
  groupId: "pancavastuka-t1541-t1557",
  label: "《五事论》同本异译、品类足组件与《五事毘婆沙》注释关系",
  evidence: "梵文断片与对读研究把 T1556、T1557 确认为 Pañcavastuka《五事论》的两种汉译，并对应 T1541〈五法品〉、T1542〈辩五事品〉；T1555 正文自称解释世友所制《五事论》。平台合并 T1556/T1557 的根本作品，保留 T1541/T1542 为《品类足论》中的组件，并把 T1555 登记为独立注释作品。",
  externalIds: { cbeta: ["T1541(五法品)", "T1542(辩五事品)", "T1555", "T1556", "T1557"] },
};

const decisions = new Map(Object.entries({
  T1546: {
    slug: "taisho-t1546",
    workId: "gbcr:work:abhidharma-mahavibhasa",
    workIdentityStatus: "verified_partial_work_witness",
    workTitle: "阿毘达磨大毘婆沙论（Abhidharma Mahāvibhāṣā）",
    sourceRole: "traditional_attributed_partial_old_translation_witness",
    completeness: "complete_source_file_partial_work_witness",
    relations: [mahavibhasaOldTranslation],
    title: "阿毘曇毘婆沙論",
    author: "迦旃延子造 五百羅漢釋 北涼 浮陀跋摩共道泰等譯",
    extent: "60卷",
    summary: "固定来源完整保存现存六十卷与稳定锚点；研究资料指出旧译原为一百卷，现存文本只是《大毘婆沙论》的部分旧译见证，因此与 T1545 共用作品标识但不计作完整译本。传统造论、解释与译者题记照录，翻译协作范围保留争议。",
  },
  T1547: {
    slug: "taisho-t1547",
    workId: "gbcr:work:vibhasa-abridgment-sitapani",
    workIdentityStatus: "verified_distinct_abridged_recension_work",
    workTitle: "鞞婆沙论（Vibhāṣā abridgment/recension）",
    sourceRole: "traditional_attributed_abridged_vibhasa_recension_with_disputed_translation_history",
    completeness: "complete_source_file",
    relations: [mahavibhasaAbridgment],
    title: "鞞婆沙論",
    author: "尸陀槃尼撰 符秦 僧伽跋澄譯",
    extent: "14卷",
    summary: "完整保存十四卷固定来源与稳定锚点；权威资料把它描述为《大毘婆沙论》的节抄或非全译版本，且译出、修订责任有多种判断。平台登记为独立节要／版本作品并建立关系，不凭题名并入 T1545。",
  },
  T1548: {
    slug: "taisho-t1548",
    workId: "gbcr:work:sariputrabhidharma",
    workIdentityStatus: "verified_distinct_abhidharma_work",
    workTitle: "舍利弗阿毘昙论（Śāriputrābhidharma）",
    sourceRole: "title_attributed_abhidharma_treatise_with_translation",
    completeness: "complete_source_file",
    title: "舍利弗阿毘曇論",
    author: "姚秦 曇摩耶舍共曇摩崛多等譯",
    extent: "30卷",
    summary: "完整保存三十卷固定来源与稳定锚点；题名中的舍利弗归属与汉译责任分层记录，不把论书题名当作佛陀逐字亲说或现代可证作者事实。",
  },
  T1549: {
    slug: "taisho-t1549",
    workId: "gbcr:work:vasumitra-samgraha-t1549",
    workIdentityStatus: "verified_distinct_abhidharma_work",
    workTitle: "尊婆须蜜菩萨所集论（Vasumitra collection）",
    sourceRole: "traditional_disputed_authored_abhidharma_treatise_with_translation",
    completeness: "complete_source_file",
    title: "尊婆須蜜菩薩所集論",
    author: "尊婆須蜜造 符秦 僧伽跋澄等譯",
    extent: "10卷",
    summary: "完整保存十卷固定来源与稳定锚点；传统题记归于婆须蜜并记僧伽跋澄等译，现代人名资料指出相关世友身份与作者判断仍待考证，平台明确保留这一不确定性。",
  },
  T1550: {
    slug: "taisho-t1550",
    workId: "gbcr:work:abhidharma-hrdaya",
    workIdentityStatus: "verified_distinct_root_treatise_work",
    workTitle: "阿毘昙心论（Abhidharmahṛdaya）",
    sourceRole: "traditional_authored_abhidharma_root_treatise_with_translation",
    completeness: "complete_source_file",
    relations: [hrdayaFamily],
    title: "阿毘曇心論",
    author: "尊者法勝造 晉 僧迦提婆共慧遠等譯",
    extent: "4卷",
    summary: "完整保存四卷固定来源与稳定锚点；登记为心论体系根本作品，与 T1551、T1552 建立扩释、增广关系而不合并。传统法胜造与译者题记照录。",
  },
  T1551: {
    slug: "taisho-t1551",
    workId: "gbcr:work:abhidharma-hrdaya-commentary-upasanta",
    workIdentityStatus: "verified_distinct_expanded_commentary_work",
    workTitle: "阿毘昙心论经（Upaśānta's expanded Abhidharmahṛdaya commentary）",
    sourceRole: "traditional_authored_expanded_abhidharma_commentary_with_translation",
    completeness: "complete_source_file",
    relations: [hrdayaFamily],
    title: "阿毘曇心論經",
    author: "法勝論 優波扇多釋 高齊 那連提耶舍譯",
    extent: "6卷",
    summary: "完整保存六卷固定来源与稳定锚点；题记明确区分法胜根本论、优波扇多释与那连提耶舍译，故登记为独立扩释作品，不作为 T1550 的第二完整译本。",
  },
  T1552: {
    slug: "taisho-t1552",
    workId: "gbcr:work:samyuktabhidharma-hrdaya",
    workIdentityStatus: "verified_distinct_expanded_abhidharma_work",
    workTitle: "杂阿毘昙心论（Saṃyuktābhidharmahṛdaya）",
    sourceRole: "traditional_authored_abhidharma_expansion_with_translation",
    completeness: "complete_source_file",
    relations: [hrdayaFamily],
    title: "雜阿毘曇心論",
    author: "尊者法救造 宋 僧伽跋摩等譯",
    extent: "11卷",
    summary: "完整保存十一卷固定来源与稳定锚点；正文和研究资料均显示其在《阿毘昙心论》基础上增广，平台登记为独立作品而非同一作品译本。传统法救造与译者题记照录。",
  },
  T1553: {
    slug: "taisho-t1553",
    workId: "gbcr:work:abhidharma-amrtarasa",
    workIdentityStatus: "verified_distinct_abhidharma_work",
    workTitle: "阿毘昙甘露味论（Abhidharmāmṛtarasa）",
    sourceRole: "traditional_authored_abhidharma_treatise_with_lost_translator",
    completeness: "complete_source_file",
    title: "阿毘曇甘露味論",
    author: "尊者瞿沙造 失譯",
    extent: "2卷",
    summary: "完整保存二卷固定来源与稳定锚点；传统瞿沙造与失译状态照录，作者、译者与作品类型分层呈现，不把论书归为佛陀逐字亲说。",
  },
  T1554: {
    slug: "taisho-t1554",
    workId: "gbcr:work:abhidharmavatara",
    workIdentityStatus: "verified_distinct_abhidharma_work",
    workTitle: "入阿毘达磨论（Abhidharmāvatāra）",
    sourceRole: "traditional_authored_abhidharma_manual_with_translation",
    completeness: "complete_source_file",
    title: "入阿毘達磨論",
    author: "塞建陀羅造 唐 玄奘譯",
    extent: "2卷",
    summary: "完整保存二卷固定来源与稳定锚点；传统塞建陀罗造与玄奘译题记照录，登记为独立阿毘达磨入门论书，不以部类位置推定佛陀亲说。",
  },
  T1555: {
    slug: "taisho-t1555",
    workId: "gbcr:work:pancavastuka-vibhasa",
    workIdentityStatus: "verified_distinct_commentary_work",
    workTitle: "五事毘婆沙论（Pañcavastukavibhāṣā）",
    sourceRole: "traditional_authored_abhidharma_commentary_with_translation",
    completeness: "complete_source_file",
    relations: [pancavastukaFamily],
    title: "五事毘婆沙論",
    author: "尊者法救造 唐 玄奘譯",
    extent: "2卷",
    summary: "完整保存二卷固定来源与稳定锚点；正文自称解释世友所制《五事论》，因此登记为独立注释作品，与 T1556/T1557 根本论表达建立关系但不合并。",
  },
  T1556: {
    slug: "taisho-t1556",
    workId: "gbcr:work:pancavastuka",
    workIdentityStatus: "verified_same_work_expression",
    workTitle: "五事论（Pañcavastuka）",
    sourceRole: "abhidharma_root_treatise_translation",
    completeness: "complete_source_file",
    relations: [pancavastukaFamily],
    title: "薩婆多宗五事論",
    author: "唐 法成譯",
    extent: "1卷",
    summary: "完整保存一卷固定来源与稳定锚点；梵文断片及对读研究确认其与 T1557 为《五事论》同本异译，并对应 T1541/T1542 的五事组件。平台按一个根本作品、两个表达计数。",
  },
  T1557: {
    slug: "taisho-t1557",
    workId: "gbcr:work:pancavastuka",
    workIdentityStatus: "verified_same_work_expression",
    workTitle: "五事论（Pañcavastuka）",
    sourceRole: "traditionally_attributed_abhidharma_root_treatise_translation",
    completeness: "complete_source_file",
    relations: [pancavastukaFamily],
    title: "阿毘曇五法行經",
    author: "後漢 安世高譯",
    extent: "1卷",
    summary: "完整保存一卷固定来源与稳定锚点；研究确认其与 T1556 为《五事论》同本异译。安世高译为传统且获得部分语言证据支持的归属，但现代研究判断并非完全一致，平台保留限定语。",
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
  if (!decision) throw new Error(`T28 出现未裁决经号 ${canonId}`);
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
      canonRef: `大正藏 T28, no. ${canonId.slice(1)}`,
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

const ensureBaseBody = async (canonId) => {
  const file = baseCatalog.files.find((item) => item.id === canonId);
  if (!file) throw new Error(`基础目录缺少比较文本 ${canonId}`);
  const segments = [];
  for (const source of sourceUnits(file)) {
    const text = await readFile(resolve(root, source.localPath), "utf8");
    segments.push(...parseCbetaReadingLines(text, { canonId }));
  }
  normalizedBodies.set(canonId, normalizeBody(segments));
};
await ensureBaseBody("T1545");

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
  ["T1545", "T1546"], ["T1545", "T1547"], ["T1546", "T1547"],
  ["T1550", "T1551"], ["T1550", "T1552"], ["T1551", "T1552"],
  ["T1555", "T1556"], ["T1555", "T1557"], ["T1556", "T1557"],
];
const comparisonPairs = pairIds.map(([left, right]) => compareBodies(left, right));
const comparisonByPair = new Map(comparisonPairs.map((item) => [item.pair.join("/"), item]));
const containment = (pair) => comparisonByPair.get(pair).fiveGramContainmentOfShorter;
const inRange = (pair, min, max) => containment(pair) >= min && containment(pair) <= max;
if (
  !inRange("T1545/T1546", 0.07, 0.075) || !inRange("T1545/T1547", 0.02, 0.027) ||
  !inRange("T1546/T1547", 0.04, 0.05) || !inRange("T1550/T1551", 0.10, 0.12) ||
  !inRange("T1550/T1552", 0.12, 0.14) || !inRange("T1551/T1552", 0.10, 0.13) ||
  containment("T1555/T1556") >= 0.01 || containment("T1555/T1557") >= 0.005 ||
  containment("T1556/T1557") >= 0.01
) throw new Error(`T28 作品体系文本比较漂移：${JSON.stringify(comparisonPairs)}`);

const existingWorkIds = new Set(["gbcr:work:abhidharma-mahavibhasa"]);
const sourceRoles = Object.fromEntries([...new Set(files.map((file) => file.sourceRole))].sort().map((role) => [
  role,
  files.filter((file) => file.sourceRole === role).map((file) => file.id),
]));
const batchWorkIds = new Set(files.map((file) => file.workId));
const newWorkIds = new Set([...batchWorkIds].filter((id) => !existingWorkIds.has(id)));
const batch = {
  schema: "https://foxue.ai/schemas/cbeta-controlled-batch-v1.0",
  version,
  publishedAt: "2026-08-14",
  baseCatalog: baseCatalogPath,
  inventory: inventoryPath,
  rightsCategory: "Individually reviewed CBETA TEI files in Taishō volumes T01–T28; T28 source-record closure",
  workOverrides: {
    "gbcr:work:abhidharma-mahavibhasa": { bibliographicRelations: [mahavibhasaOldTranslation, mahavibhasaAbridgment] },
    "gbcr:work:prakaranapada": { bibliographicRelations: [pancavastukaFamily] },
  },
  fileOverrides: {},
  collection: {
    id: "CBETA-TAISHO-T28",
    title: "大正藏 T28 毘昙部固定来源记录",
    sourceRecordDenominator: 12,
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
    newWorks: newWorkIds.size,
    controlledWorks: batchWorkIds.size,
    workCountingDecision: "T28 的 12 份来源记录登记为 12 个表达或见证、11 个批次内作品。T1546 是既有《大毘婆沙论》作品的残存旧译见证；T1556/T1557 是《五事论》同一作品的两个表达；T1547–T1555 各自登记为九个独立论书、节要、扩释或注释作品。因此本批新增十个作品，而不是十二个；所有论书均不标为佛陀逐字亲说。",
  },
  boundaryAudit: {
    status: "verified_source_integrity_work_expression_partial_translation_commentary_and_attribution_boundaries_recorded",
    existingControlledRecords: ["T1541", "T1542", "T1545"],
    editionOrRecensionGroups: [mahavibhasaAbridgment.groupId],
    verifiedTranslationGroups: [pancavastukaFamily.groupId],
    rootTreatiseCommentaryGroups: [hrdayaFamily.groupId, pancavastukaFamily.groupId],
    candidateRelationsNotMerged: ["T1547→T1545（节要／版本作品，不强制作品合并）", "T1551/T1552→T1550（扩释、增广作品，不作为同一作品译本）"],
    partialWorkWitnesses: ["T1546"],
    sourceRoles,
    textualComparison: {
      algorithm: "Unicode text from stable reading lines; punctuation/space removed; unique character 5-gram containment and Jaccard. Machine overlap only records translation-era and derivative-text asymmetry. T1556/T1557 demonstrates that verified same-work translations can have extremely low surface overlap; no work, authorship or translation decision is made by thresholds alone.",
      pairs: comparisonPairs,
    },
    authoritySources: [
      "https://github.com/cbeta-org/xml-p5/tree/2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9/T/T28",
      "https://authority.dila.edu.tw/catalog/search.php?code=CA0000068",
      "https://authority.dila.edu.tw/catalog/search.php?code=CA0000051",
      "https://dazangthings.nz/cbc/text/1348/",
      "https://dazangthings.nz/cbc/text/1346/",
      "https://authority.dila.edu.tw/catalog/search.php?code=CA0002925",
      "https://authority.dila.edu.tw/catalog/search.php?code=CA0003998",
      "https://authority.dila.edu.tw/catalog/search.php?code=CA0002676",
      "https://authority.dila.edu.tw/catalog/search.php?code=CA0003489",
      "https://authority.dila.edu.tw/catalog/search.php?code=CA0000069",
      "https://cbc.dila.edu.tw/cbc/text/1347/",
      "https://buddhism.lib.ntu.edu.tw/search/search_detail.jsp?seq=339205",
      "https://www.jstage.jst.go.jp/article/ibk1952/32/1/32_1_473/_pdf",
      "https://researchmap.jp/tanakayousay/published_papers/45959542/attachment_file.pdf",
      "https://media.dhalbi.com/publ/journ10/wbc_j10.pdf",
      "https://ora.ox.ac.uk/objects/uuid:eacf5f0c-8632-4087-ab4f-23f67b30247d/files/mb2e0e26865aa8b01047145704c8056dd",
    ],
    caveat: "T28 是毘昙部论书集合，不是佛说经集合。平台完整保存固定来源，同时区分根本论、旧译残存见证、节要或版本、同本异译、独立扩释、注释作品、传统作者题记、失译与现代归属争议；题名、目录位置、传统题记或机器相似度都不能单独证明作品相同、作者确定或佛陀逐字亲说。",
  },
  files,
};

if (
  batch.collection.newSourceRecords !== 12 || batch.collection.newSourceBytes !== 14447693 ||
  batch.collection.newStableSegments !== 85917 || batch.collection.newFolios !== 3081 ||
  batch.collection.verifiedSameWorkExpressions !== 2 || batch.collection.verifiedPartialWorkWitnesses !== 1 ||
  batch.collection.verifiedEditionWitnesses !== 0 || batch.collection.provisionalRecords !== 0 ||
  batch.collection.newFullSourceTexts !== 11 || batch.collection.newPartialSourceWitnesses !== 1 ||
  batch.collection.relationAnnotatedRecords !== 8 || batch.collection.attributionBoundaryRecords !== 12 ||
  batch.collection.newWorks !== 10 || batch.collection.controlledWorks !== 11
) throw new Error(`T28 关系、归属或作品边界统计漂移：${JSON.stringify(batch.collection)}`);

await writeFile(resolve(root, `data/corpus/cbeta/batch-v${version}.json`), `${JSON.stringify(batch, null, 2)}\n`, "utf8");
console.log(`CBETA T28 审计完成：12/12 个固定来源记录；新增 ${batch.collection.newWorks} 个作品、${batch.collection.newSourceRecords} 个表达或见证、${batch.collection.newStableSegments} 个稳定行段。`);

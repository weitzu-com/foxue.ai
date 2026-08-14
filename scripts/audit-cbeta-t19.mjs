import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { buildPageNavigation, parseCbetaReadingLines } from "../src/lib/cbeta-tei.mjs";

const root = process.cwd();
const version = "2.6.0";
const expectedCommit = "2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9";
const sourceArgument = process.argv.find((argument) => argument.startsWith("--source-dir="));
if (!sourceArgument) {
  console.error("用法：node scripts/audit-cbeta-t19.mjs --source-dir=/固定提交的/xml-p5");
  process.exit(1);
}
const sourceRoot = resolve(sourceArgument.slice("--source-dir=".length));
const actualCommit = execFileSync("git", ["-C", sourceRoot, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (actualCommit !== expectedCommit) throw new Error(`上游工作树必须固定到 ${expectedCommit}`);

const inventoryPath = "data/gbcr/cbeta-taisho-t19-inventory-v0.1.0.json";
const inventory = JSON.parse(await readFile(resolve(root, inventoryPath), "utf8"));
const baseCatalog = JSON.parse(await readFile(resolve(root, "data/corpus/cbeta/catalog-v2.5.0.json"), "utf8"));
const sourceUnits = (file) => file.sourceParts ?? [file];
const controlledPaths = new Set(baseCatalog.files.flatMap(sourceUnits).map((file) => file.upstreamPath));
const candidates = inventory.records.filter((record) => !controlledPaths.has(record.upstreamPath));
const existingT19 = inventory.records.filter((record) => controlledPaths.has(record.upstreamPath));
if (
  inventory.totals.records !== 126 || inventory.totals.upstreamBytes !== 18889279 ||
  candidates.length !== 125 || existingT19.length !== 1 || existingT19[0].canonWitnessId !== "T0945"
) {
  throw new Error(`T19 固定来源分母、新增记录或既有记录漂移：${inventory.totals.records}/${candidates.length}/${existingT19.map((item) => item.canonWitnessId)}`);
}
if (candidates.reduce((sum, record) => sum + record.upstreamBytes, 0) !== 18161693) {
  throw new Error("T19 新增来源字节数漂移");
}

const relation = (type, groupId, label, evidence, ids, extra = {}) => ({
  type,
  groupId,
  label,
  evidence,
  externalIds: { cbeta: ids },
  ...extra,
});
const editionGroups = [
  {
    ids: ["T0924A", "T0924B"],
    workId: "gbcr:work:bhaisajya-guru-ritual-t0924",
    relation: relation(
      "same_work_edition_or_recension_group_verified",
      "t0924-edition-recension-witnesses",
      "《药师如来念诵仪轨》T0924 A/B 版本见证组",
      "两份固定记录共享大正藏基础经号 924、题名与不空译题记；B 为显著短本，正文五字片段对较短本覆盖 56.9%，平台共享作品实体但完整保留长短本与独立锚点。",
      ["T0924A", "T0924B"],
    ),
  },
  {
    ids: ["T0954A", "T0954B"],
    workId: "gbcr:work:ekaksara-usnisa-cakravartin-ritual-t0954",
    relation: relation(
      "same_work_edition_or_recension_group_verified",
      "t0954-edition-recension-witnesses",
      "《一字顶轮王念诵仪轨》T0954 A/B 版本见证组",
      "两份固定记录共享基础经号与题名，正文五字片段覆盖 52.3%；A 有不空译题记、B 无署名，署名差异和独立文本均保留。",
      ["T0954A", "T0954B"],
    ),
  },
  {
    ids: ["T1022A", "T1022B"],
    workId: "gbcr:work:karandamudra-dharani-t1022",
    relation: relation(
      "same_work_edition_or_recension_group_verified",
      "t1022-edition-recension-witnesses",
      "《一切如来心秘密全身舍利宝箧印陀罗尼经》T1022 A/B 版本见证组",
      "两份固定记录共享基础经号、完整题名与不空译题记，正文五字片段覆盖 34.6%；平台只合并作品实体，不折叠版本内容或来源资产。",
      ["T1022A", "T1022B"],
    ),
  },
  {
    ids: ["T1027a", "T1027b"],
    workId: "gbcr:work:vajra-flame-weather-dharani-t1027",
    relation: relation(
      "same_work_edition_or_recension_group_verified",
      "t1027-edition-recension-witnesses",
      "《金刚光焰止风雨陀罗尼经》T1027 a/b 版本见证组",
      "两份固定记录共享基础经号、题名与菩提流志译题记，正文五字片段覆盖 68.4%，作为同一作品的两个独立版本见证。",
      ["T1027a", "T1027b"],
    ),
  },
];
const candidateRelations = [
  relation(
    "related_ritual_component_candidate_unmerged",
    "bhaisajya-guru-t0924c-component-candidate",
    "T0924C 药师仪轨组件候选",
    "T0924C 与 T0924A/B 同属基础经号 924，但题名、署名和正文范围不同，五字片段覆盖不足 1%；只记录相关组件候选，不并入已核验的 A/B 作品。",
    ["T0924A", "T0924B", "T0924C"],
  ),
  relation(
    "parallel_practice_text_candidate_unmerged",
    "avalokitesvara-practice-t0931-t0932-candidate",
    "T0931／T0932 观自在王修行法候选",
    "题名与修持对象相近、译题记不同，正文五字片段覆盖 26.4%；未完成人工校勘前保持两个作品实体。",
    ["T0931", "T0932"],
  ),
  relation(
    "homonymous_text_family_candidate_unmerged",
    "sitapatra-t0944-candidate",
    "T0944 A/B 大佛顶陀罗尼题名家族候选",
    "同一基础经号下题名相近，但署名与正文范围不同且五字片段覆盖不足 0.1%；不以经号或题名自动合并。",
    ["T0944A", "T0944B"],
  ),
  relation(
    "translation_and_liturgical_component_family_candidate_unmerged",
    "usnisavijaya-t0967-t0974-family-candidate",
    "佛顶尊胜陀罗尼译本与仪轨组件候选家族",
    "T0967–T0974 含多译本、念诵仪轨、注义、灵验记、真言与别法；题名或目录邻接不足以证明全部属于同一作品，暂保留独立作品并公开候选家族。",
    ["T0967", "T0968", "T0969", "T0970", "T0971", "T0972", "T0973", "T0974A", "T0974B", "T0974C", "T0974D", "T0974E", "T0974F"],
  ),
  relation(
    "translation_and_ritual_component_family_candidate_unmerged",
    "mahamayuri-t0982-t0988-family-candidate",
    "孔雀明王经译本与仪轨组件候选家族",
    "T0982–T0988 同时包含多译本、坛场仪轨与梵字真言材料；机器正文相似度差异大，未作跨译本人工校勘前不合并作品。",
    ["T0982", "T0983A", "T0983B", "T0984", "T0985", "T0986", "T0987", "T0988"],
  ),
  relation(
    "translation_or_chapter_witness_family_candidate_unmerged",
    "rain-scripture-t0989-t0993-family-candidate",
    "大云请雨经与第六十四品见证候选家族",
    "T0989、T0991 是不同译题记的请雨经，T0992、T0993 明确为第六十四品局部见证；在组件边界和版本关系完成校勘前保持四个作品实体。",
    ["T0989", "T0991", "T0992", "T0993"],
  ),
  relation(
    "translation_and_mantra_component_family_candidate_unmerged",
    "jeweled-pavilion-t1005-t1006-family-candidate",
    "宝楼阁经译本与梵字真言组件候选家族",
    "T1005A、T1006 是不同译题记的三卷文本，T1005B 是梵字真言组件；三者保持独立作品或组件实体，不按基础经号自动折叠。",
    ["T1005A", "T1005B", "T1006"],
  ),
  relation(
    "multi_translation_text_family_candidate_unmerged",
    "anantamukha-dharani-t1009-t1018-candidate",
    "出生无边门陀罗尼多译本候选家族",
    "T1009、T1011–T1018 的题名和传统目录关系提示多译本家族，但字面重合低且尚未完成逐段语义校勘；仅建立候选关系。",
    ["T1009", "T1011", "T1012", "T1013", "T1014", "T1015", "T1016", "T1017", "T1018"],
  ),
  relation(
    "same_work_translation_candidate_unmerged",
    "karandamudra-t1022-t1023-candidate",
    "宝箧印陀罗尼 T1022／T1023 异译候选",
    "题名与主题提示异译关系，但 T1023 与 T1022 A/B 的作品同一性尚未独立校勘；T1022 A/B 已共享作品，T1023 暂不合并。",
    ["T1022A", "T1022B", "T1023"],
  ),
  relation(
    "same_catalog_number_distinct_genre_candidate_unmerged",
    "child-protection-t1028-component-candidate",
    "T1028 护童子经／念诵法组件候选",
    "T1028A 为陀罗尼经、T1028B 为念诵法，题名、译题记和正文均不同；只保留相关组件候选，不共享作品实体。",
    ["T1028A", "T1028B"],
  ),
];

const decisionByCanonId = new Map();
const relationsByCanonId = new Map();
const addRelation = (ids, item) => {
  for (const id of ids) relationsByCanonId.set(id, [...(relationsByCanonId.get(id) ?? []), item]);
};
for (const group of editionGroups) {
  for (const id of group.ids) decisionByCanonId.set(id, { workId: group.workId, status: "verified_edition_witness" });
  addRelation(group.ids, group.relation);
}
for (const item of candidateRelations) addRelation(item.externalIds.cbeta, item);

const partialWitnessIds = new Set(["T0938", "T0947", "T0983B", "T0992", "T0993", "T1005B"]);
const irregularJuanSequences = new Map([
  ["T0946", ["001", "002", "004", "005"]],
]);
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const gitBlobSha1 = (value) => createHash("sha1").update(`blob ${value.length}\0`).update(value).digest("hex");
const matchRequired = (text, pattern, label, id) => {
  const value = text.match(pattern)?.[1]?.trim();
  if (!value) throw new Error(`${id} 缺少 ${label}`);
  return value;
};
const stripXml = (value) => value.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
const displayNumber = (canonId) => canonId.slice(1).replace(/^0+(?=\d)/, "");
const classifyAttribution = (author) => {
  if (!author) return { sourceRole: "unattributed_esoteric_text_or_ritual", label: "题记未载作者／译者", boundary: true };
  if (["失譯", "闕譯"].includes(author)) return { sourceRole: "translation_attribution_unknown", label: author, boundary: true };
  if (/[撰述集記]$/.test(author) || /請來$/.test(author)) {
    return { sourceRole: "attributed_authored_compiled_or_transmitted_esoteric_text", label: author.replace(/\s+/g, " · "), boundary: true };
  }
  return { sourceRole: "translated_esoteric_canonical_record", label: author.replace(/\s+/g, " · "), boundary: false };
};
const normalizedBodies = new Map();
const files = [];

for (const record of candidates) {
  const upstream = execFileSync("git", ["-C", sourceRoot, "show", `HEAD:${record.upstreamPath}`], {
    encoding: "buffer",
    maxBuffer: Math.max(record.upstreamBytes + 1024, 16 * 1024 * 1024),
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
  const author = stripXml(text.match(/<author>([\s\S]*?)<\/author>/)?.[1] ?? "");
  const attribution = classifyAttribution(author);
  const extent = matchRequired(text, /<extent>([^<]+)<\/extent>/, "卷数", record.sourceRecordId);
  const canonId = record.canonWitnessId;
  const segments = parseCbetaReadingLines(text, { canonId });
  const navigation = buildPageNavigation(segments);
  const juans = [...new Set(segments.map((segment) => segment.juan))];
  const numericJuans = juans.map(Number);
  const expectedIrregularJuans = irregularJuanSequences.get(canonId);
  const hasValidIrregularSequence = expectedIrregularJuans && JSON.stringify(juans) === JSON.stringify(expectedIrregularJuans);
  if (
    numericJuans.some((juan) => !Number.isSafeInteger(juan) || juan < 1) ||
    (!hasValidIrregularSequence && numericJuans.some((juan, index) => index > 0 && juan !== numericJuans[index - 1] + 1))
  ) {
    throw new Error(`${canonId} 卷次不是连续正整数`);
  }
  normalizedBodies.set(canonId, segments.map((segment) => segment.text).join("").replace(/[\s，。；：、！？「」『』（）]/g, ""));
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

  const decision = decisionByCanonId.get(canonId);
  const isPartialWitness = partialWitnessIds.has(canonId);
  const boundarySummary = isPartialWitness
    ? "题名明确显示为某品、真言摘录、梵本组件或母经局部材料，完整保存来源文件但不冒充完整母作品；"
    : attribution.sourceRole === "translated_esoteric_canonical_record"
      ? "目录署为翻译，但密教部类位置或佛说式题名不等于佛陀逐字亲说，作品归属与跨语种关系仍需逐项证据；"
      : attribution.sourceRole === "translation_attribution_unknown"
        ? "目录题记为失译，平台不补造译者、年代或印度来源；"
        : attribution.sourceRole === "unattributed_esoteric_text_or_ritual"
          ? "题记未载作者或译者，平台不把匿名陀罗尼或仪轨自动改写为译经；"
          : "题记明确为撰、述、集、记或请来，平台保留其编撰、记录或传承角色，不改写成佛陀亲说；";
  files.push({
    id: canonId,
    slug: `taisho-${canonId.toLowerCase()}`,
    workId: decision?.workId ?? `gbcr:work:taisho-${canonId.toLowerCase()}`,
    workIdentityStatus: decision?.status ?? "provisional_canon_record",
    sourceRole: attribution.sourceRole,
    ...(relationsByCanonId.has(canonId) ? { bibliographicRelations: relationsByCanonId.get(canonId) } : {}),
    localPath,
    upstreamPath: record.upstreamPath,
    upstreamGitBlobSha1: record.upstreamGitBlobSha1,
    upstreamBytes: upstream.length,
    upstreamSha256: sha256(upstream),
    localBytes: normalized.length,
    localSha256: sha256(normalized),
    format: "application/tei+xml",
    completeness: isPartialWitness ? "complete_source_file_partial_work_witness" : "complete_source_file",
    presentation: {
      title,
      alternateTitle: title,
      tradition: "漢傳佛教 · 密教部",
      language: "漢文",
      canonRef: `大正藏 T19, no. ${displayNumber(canonId)}`,
      translator: attribution.label,
      summary: `${extent}。本站完整保存 ${canonId} 的固定 CBETA TEI 来源记录与可校验页栏行锚点；${boundarySummary}物理记录、作品、表达、版本见证与佛说归属分层计数。`,
      sourceUrl: `https://cbetaonline.dila.edu.tw/zh/${canonId}_001`,
    },
    verification: {
      segments: segments.length,
      folios: navigation.length,
      ...(hasValidIrregularSequence
        ? { juans }
        : { juanRange: [numericJuans[0], numericJuans.at(-1)] }),
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
  ["T0924A", "T0924B"],
  ["T0924A", "T0924C"],
  ["T0931", "T0932"],
  ["T0944A", "T0944B"],
  ["T0954A", "T0954B"],
  ["T0967", "T0971"],
  ["T0982", "T0985"],
  ["T0986", "T0987"],
  ["T0989", "T0991"],
  ["T0992", "T0993"],
  ["T1005A", "T1005B"],
  ["T1005A", "T1006"],
  ["T1009", "T1018"],
  ["T1022A", "T1022B"],
  ["T1022A", "T1023"],
  ["T1027a", "T1027b"],
  ["T1028A", "T1028B"],
].map(([left, right]) => compareBodies(left, right));
const comparisonByPair = new Map(comparisonPairs.map((item) => [item.pair.join("/") , item]));
if (
  comparisonByPair.get("T0924A/T0924B").fiveGramContainmentOfShorter < 0.56 ||
  comparisonByPair.get("T0954A/T0954B").fiveGramContainmentOfShorter < 0.52 ||
  comparisonByPair.get("T1022A/T1022B").fiveGramContainmentOfShorter < 0.34 ||
  comparisonByPair.get("T1027a/T1027b").fiveGramContainmentOfShorter < 0.68 ||
  comparisonByPair.get("T0944A/T0944B").fiveGramContainmentOfShorter > 0.01
) throw new Error("T19 高风险同题、版本或组件正文比较漂移");

const batch = {
  schema: "https://foxue.ai/schemas/cbeta-controlled-batch-v1.0",
  version,
  publishedAt: "2026-08-14",
  baseCatalog: "data/corpus/cbeta/catalog-v2.5.0.json",
  inventory: inventoryPath,
  rightsCategory: "Individually reviewed CBETA TEI files in Taishō volumes T01–T19; T19 source-record closure",
  workOverrides: {},
  fileOverrides: {
    T0945: { sourceRole: "traditional_attributed_translation_with_contested_history" },
  },
  collection: {
    id: "CBETA-TAISHO-T19",
    title: "大正藏 T19 密教部固定来源记录",
    sourceRecordDenominator: 126,
    previouslyControlledSourceRecords: 1,
    newSourceRecords: files.length,
    controlledSourceRecords: files.length + 1,
    newSourceBytes: files.reduce((sum, file) => sum + file.upstreamBytes, 0),
    newStableSegments: files.reduce((sum, file) => sum + file.verification.segments, 0),
    newFolios: files.reduce((sum, file) => sum + file.verification.folios, 0),
    verifiedEditionWitnesses: files.filter((file) => file.workIdentityStatus === "verified_edition_witness").length,
    provisionalRecords: files.filter((file) => file.workIdentityStatus === "provisional_canon_record").length,
    newFullSourceTexts: files.filter((file) => file.completeness === "complete_source_file").length,
    newPartialSourceWitnesses: files.filter((file) => file.completeness === "complete_source_file_partial_work_witness").length,
    fullSourceTexts: files.filter((file) => file.completeness === "complete_source_file").length + 1,
    partialSourceWitnesses: files.filter((file) => file.completeness === "complete_source_file_partial_work_witness").length,
    relationAnnotatedRecords: files.filter((file) => file.bibliographicRelations?.length).length,
    attributionBoundaryRecords: files.filter((file) => classifyAttribution(
      file.presentation.translator === "题记未载作者／译者" ? "" : file.presentation.translator.replace(/ · /g, " "),
    ).boundary).length + 1,
    newWorks: 121,
    controlledWorks: 122,
    workCountingDecision: "T19 共 126 条固定来源记录，其中 T0945 已在早期试点受控，本批新增 125 条。8 条 A/B 或 a/b 记录按同一基础经号、题名、署名与正文证据归入 4 个作品并保留独立版本见证，其余 117 条新增记录暂按书目实体登记，共新增 121 个作品；多译本、同题、品、真言和仪轨组件关系只作候选，不自动归并。",
  },
  boundaryAudit: {
    status: "verified_source_integrity_existing_record_edition_groups_attribution_partial_witness_and_component_boundaries_recorded",
    existingControlledRecords: existingT19.map((item) => item.canonWitnessId),
    editionOrRecensionGroups: editionGroups.map((item) => item.relation.groupId),
    candidateRelationsNotMerged: candidateRelations.map((item) => item.groupId),
    partialWorkWitnesses: [...partialWitnessIds],
    translatedRecords: files.filter((file) => file.sourceRole === "translated_esoteric_canonical_record").map((file) => file.id),
    unattributedRecords: files.filter((file) => file.sourceRole === "unattributed_esoteric_text_or_ritual").map((file) => file.id),
    lostTranslatorRecords: files.filter((file) => file.sourceRole === "translation_attribution_unknown").map((file) => file.id),
    attributedAuthoredCompiledOrTransmittedRecords: files.filter((file) => file.sourceRole === "attributed_authored_compiled_or_transmitted_esoteric_text").map((file) => file.id),
    contestedTraditionalAttributionRecords: ["T0945"],
    irregularJuanSequences: [{
      id: "T0946",
      sourceExtent: "4卷",
      encodedJuans: ["001", "002", "004", "005"],
      decision: "固定 TEI 明确跳过卷三并以卷四、卷五继续；平台保留原始卷号和稳定锚点，不擅自重排为一至四。",
    }],
    textualComparison: {
      algorithm: "Unicode text from stable reading lines; punctuation/space removed; unique character 5-gram containment and Jaccard. Machine comparison is evidence, not a work-identity verdict.",
      pairs: comparisonPairs,
    },
    authoritySources: [
      "https://github.com/cbeta-org/xml-p5/tree/2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9/T/T19",
      "https://cbetaonline.dila.edu.tw/zh/T0945_001",
    ],
    caveat: "T19 同时容纳译经、陀罗尼、仪轨、念诵法、撰述、辑录、请来材料、失译、局部品与版本见证。平台完整保存固定来源，但不把目录位置、佛说式题名、相邻经号、同题或机器文本相似度单独当成佛陀亲说或同一作品的证明。",
  },
  files,
};

if (
  batch.collection.newSourceRecords !== 125 ||
  batch.collection.controlledSourceRecords !== 126 ||
  batch.collection.newSourceBytes !== 18161693 ||
  batch.collection.verifiedEditionWitnesses !== 8 ||
  batch.collection.provisionalRecords !== 117 ||
  batch.collection.newFullSourceTexts !== 119 ||
  batch.collection.newPartialSourceWitnesses !== 6 ||
  batch.collection.fullSourceTexts !== 120 ||
  batch.collection.partialSourceWitnesses !== 6 ||
  batch.collection.attributionBoundaryRecords !== 25 ||
  batch.collection.newWorks !== 121 ||
  batch.collection.controlledWorks !== 122
) throw new Error(`T19 关系、归属或作品边界统计漂移：${JSON.stringify(batch.collection)}`);

await writeFile(resolve(root, `data/corpus/cbeta/batch-v${version}.json`), `${JSON.stringify(batch, null, 2)}\n`, "utf8");
console.log(`CBETA T19 审计完成：126/126 个固定来源记录；新增 ${batch.collection.newWorks} 个作品、${batch.collection.newSourceRecords} 个表达或见证、${batch.collection.newStableSegments} 个稳定行段。`);

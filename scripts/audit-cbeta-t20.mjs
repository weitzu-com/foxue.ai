import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { buildPageNavigation, parseCbetaReadingLines } from "../src/lib/cbeta-tei.mjs";

const root = process.cwd();
const version = "2.7.0";
const expectedCommit = "2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9";
const sourceArgument = process.argv.find((argument) => argument.startsWith("--source-dir="));
if (!sourceArgument) {
  console.error("用法：node scripts/audit-cbeta-t20.mjs --source-dir=/固定提交的/xml-p5");
  process.exit(1);
}
const sourceRoot = resolve(sourceArgument.slice("--source-dir=".length));
const actualCommit = execFileSync("git", ["-C", sourceRoot, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (actualCommit !== expectedCommit) throw new Error(`上游工作树必须固定到 ${expectedCommit}`);

const inventoryPath = "data/gbcr/cbeta-taisho-t20-inventory-v0.1.0.json";
const inventory = JSON.parse(await readFile(resolve(root, inventoryPath), "utf8"));
const baseCatalogPath = "data/corpus/cbeta/catalog-v2.6.0.json";
const baseCatalog = JSON.parse(await readFile(resolve(root, baseCatalogPath), "utf8"));
const sourceUnits = (file) => file.sourceParts ?? [file];
const controlledPaths = new Set(baseCatalog.files.flatMap(sourceUnits).map((file) => file.upstreamPath));
const candidates = inventory.records.filter((record) => !controlledPaths.has(record.upstreamPath));
if (inventory.totals.records !== 184 || inventory.totals.upstreamBytes !== 24220376 || candidates.length !== 184) {
  throw new Error(`T20 固定来源分母或新增记录漂移：${inventory.totals.records}/${candidates.length}`);
}

const relation = (type, groupId, label, evidence, ids) => ({
  type, groupId, label, evidence, externalIds: { cbeta: ids },
});
const editionGroups = [
  ["1045", ["T1045a", "T1045b"], "六字神咒王经 T1045 a/b 版本见证", "同一基础经号、同属失译且题名仅有佛说字样差异；五字片段覆盖 35.6%，共享作品实体但保留独立版本。"],
  ["1057", ["T1057a", "T1057b"], "千眼千臂观世音菩萨陀罗尼神咒经 T1057 a/b 版本见证", "同一基础经号、题名与智通译题记一致；五字片段覆盖 69.9%，作为同作品独立版本。"],
  ["1103", ["T1103a", "T1103b"], "观自在菩萨随心陀罗尼 T1103 a/b 版本见证", "同一基础经号、智通译题记及核心题名一致；五字片段覆盖 20.5%，作为同作品不同传本。"],
  ["1108", ["T1108A", "T1108B"], "救度佛母二十一礼赞 T1108 A/B 版本见证", "同一基础经号和核心题名，五字片段覆盖 51.0%；A 有安藏译题记、B 无署名，署名差异完整保留。"],
  ["1134", ["T1134A", "T1134B"], "金刚寿命陀罗尼经 T1134 A/B 版本见证", "同一基础经号、不空译题记和核心题名；较短本五字片段覆盖 74.1%，作为同作品独立版本。"],
  ["1138", ["T1138a", "T1138b"], "金刚秘密善门陀罗尼经 T1138 a/b 版本见证", "同一基础经号、同属失译且题名只差咒字；字面重合有限，因此只合并作品层并完整保留两个版本。"],
  ["1185", ["T1185A", "T1185B"], "文殊师利法宝藏陀罗尼经 T1185 A/B 版本见证", "同一基础经号、菩提流志译题记和核心题名；五字片段覆盖 30.5%，作为同作品独立版本。"],
].map(([number, ids, label, evidence]) => ({
  ids,
  workId: `gbcr:work:taisho-t${number}-edition-group`,
  relation: relation("same_work_edition_or_recension_group_verified", `t${number}-edition-recension-witnesses`, label, evidence, ids),
}));
const candidateRelations = [
  relation("translation_and_ritual_family_candidate_unmerged", "six-syllable-avalokitesvara-t1044-t1050", "六字观自在译本与仪轨候选家族", "T1044–T1050 涵盖失译、宋译陀罗尼与四卷经；题名和主题相近不足以证明同一作品。", ["T1044", "T1045a", "T1045b", "T1046", "T1047", "T1048", "T1049", "T1050"]),
  relation("translation_and_ritual_family_candidate_unmerged", "thousand-armed-avalokitesvara-t1056-t1068", "千手千眼观自在经咒与仪轨候选家族", "多译本、咒本、治病法、仪轨和无署名材料范围不同；只建立家族关系，不自动合并。", ["T1056", "T1057a", "T1057b", "T1058", "T1059", "T1060", "T1061", "T1062A", "T1062B", "T1063", "T1064", "T1065", "T1066", "T1067", "T1068"]),
  relation("same_catalog_number_component_candidate_unmerged", "t1062-component-candidate", "T1062 咒本与无署名陀罗尼组件候选", "A/B 题名、署名与范围不同，五字片段覆盖仅 3.7%；不按基础经号合并。", ["T1062A", "T1062B"]),
  relation("translation_family_candidate_unmerged", "eleven-faced-avalokitesvara-t1069-t1071", "十一面观自在译本与仪轨候选家族", "一份仪轨与两份不同译题记的咒经尚未完成跨译本逐段校勘。", ["T1069", "T1070", "T1071"]),
  relation("same_catalog_number_component_candidate_unmerged", "t1072-component-candidate", "T1072 马头明王仪轨与心陀罗尼组件候选", "A 为不空译长篇仪轨，B 为无署名短陀罗尼，五字片段覆盖不足 1%；保持独立作品。", ["T1072A", "T1072B"]),
  relation("translation_and_ritual_family_candidate_unmerged", "cundi-t1075-t1079", "准提陀罗尼译本与修法候选家族", "三份译经与两份修法材料属于相关传统，但作品和组件边界待校勘。", ["T1075", "T1076", "T1077", "T1078", "T1079"]),
  relation("translation_and_ritual_family_candidate_unmerged", "cintamani-cakra-t1080-t1091", "如意轮陀罗尼译本与仪轨候选家族", "多译本、念诵法、瑜伽、注诀和观门仪并存，不以题名自动归并。", ["T1080", "T1081", "T1082", "T1083", "T1084", "T1085", "T1086", "T1087", "T1088", "T1089", "T1090", "T1091"]),
  relation("translation_family_candidate_unmerged", "amoghapasa-t1092-t1099", "不空羂索多译本与仪轨候选家族", "三十卷经、短咒经、心咒与仪轨范围悬殊，需作品级校勘后再裁决。", ["T1092", "T1093", "T1094", "T1095", "T1096", "T1097", "T1098", "T1099"]),
  relation("same_catalog_number_distinct_recension_candidate_unmerged", "t1113-recension-candidate", "T1113 大悲心陀罗尼传本候选", "A 为指空校本、B 题署不空译，题名相关但五字片段覆盖仅 2.3%；证据不足，不合并作品。", ["T1113A", "T1113B"]),
  relation("same_catalog_number_ritual_and_mantra_candidate_unmerged", "t1120-component-candidate", "T1120 大乐金刚萨埵仪轨与真言组件候选", "A 为不空译仪轨，B 为请来真言组件，五字片段覆盖不足 1%；保持独立。", ["T1120A", "T1120B"]),
  relation("translation_and_ritual_family_candidate_unmerged", "vajrasattva-t1119-t1125", "金刚萨埵仪轨候选家族", "相关修法共享尊格和瑜伽传统，但并非据此即为同一文本作品。", ["T1119", "T1120A", "T1120B", "T1121", "T1122", "T1123", "T1124", "T1125"]),
  relation("translation_and_ritual_family_candidate_unmerged", "vajra-longevity-t1133-t1140", "金刚寿命与延寿陀罗尼候选家族", "同主题译经、念诵法和失译传本并存；除 T1134 A/B 外不自动合并。", ["T1133", "T1134A", "T1134B", "T1135", "T1136", "T1137", "T1138a", "T1138b", "T1139", "T1140"]),
  relation("same_catalog_number_transmission_component_candidate_unmerged", "t1156-transmission-component", "T1156 大随求忏悔法与口受材料候选", "A 为惟谨述忏悔法，B 为口受记录，五字片段覆盖不足 1%；保持独立来源角色和作品。", ["T1156A", "T1156B"]),
  relation("same_catalog_number_distinct_text_candidate_unmerged", "t1159-earth-store-candidate", "T1159 地藏相关材料候选", "A 为驱策法，B 为地藏陀罗尼经，正文几乎不重合；不按基础经号合并。", ["T1159A", "T1159B"]),
  relation("translation_family_candidate_unmerged", "vasudhara-t1162-t1165", "持世／雨宝陀罗尼异译候选家族", "题名和主题提示相关传统，但跨译本作品同一性尚待人工校勘。", ["T1162", "T1163", "T1164", "T1165"]),
  relation("same_catalog_number_distinct_text_candidate_unmerged", "t1168-eight-mandala-candidate", "T1168 八大曼荼罗传本候选", "A 有法贤译题记、B 无署名且文本范围不同，五字片段覆盖仅 1.2%；暂不合并。", ["T1168A", "T1168B"]),
  relation("same_catalog_number_component_candidate_unmerged", "t1177-manjusri-component", "T1177 千臂千钵文殊大教王经与赞颂组件候选", "A 为十卷译经，B 为请来的一百八名赞，体量、体裁与正文均不同；不共享作品实体。", ["T1177A", "T1177B"]),
  relation("translation_and_ritual_family_candidate_unmerged", "manjusri-t1171-t1198", "文殊密教经咒、仪轨与赞颂候选家族", "T1171–T1198 横跨五字、六字、一字、八字法、名义经、仪轨、赞颂与愿文；目录邻接和尊格相同不能替代作品校勘。", ["T1171", "T1172", "T1173", "T1174", "T1175", "T1176", "T1177A", "T1177B", "T1178", "T1179", "T1180", "T1181", "T1182", "T1183", "T1184", "T1185A", "T1185B", "T1186", "T1187", "T1188", "T1189", "T1190", "T1191", "T1192", "T1193", "T1194", "T1195", "T1196", "T1197", "T1198"]),
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

const partialWitnessIds = new Set(["T1040", "T1120B", "T1130", "T1173", "T1181"]);
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const gitBlobSha1 = (value) => createHash("sha1").update(`blob ${value.length}\0`).update(value).digest("hex");
const matchRequired = (text, pattern, label, id) => {
  const value = text.match(pattern)?.[1]?.trim();
  if (!value) throw new Error(`${id} 缺少 ${label}`);
  return value;
};
const stripXml = (value) => value.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
const displayNumber = (canonId) => canonId.slice(1).replace(/^0+(?=\d)/, "");
const classifyAttribution = (author, title) => {
  if (!author && /口受/.test(title)) return { sourceRole: "attributed_authored_compiled_or_transmitted_esoteric_text", label: "题名载口受传承", boundary: true };
  if (!author) return { sourceRole: "unattributed_esoteric_text_or_ritual", label: "题记未载作者／译者", boundary: true };
  if (/(失譯|闕譯)/.test(author)) return { sourceRole: "translation_attribution_unknown", label: author, boundary: true };
  if (/[撰述集記注校]/.test(author) || /(請來|口受)/.test(author)) {
    return { sourceRole: "attributed_authored_compiled_or_transmitted_esoteric_text", label: author.replace(/\s+/g, " · "), boundary: true };
  }
  return { sourceRole: "translated_esoteric_canonical_record", label: author.replace(/\s+/g, " · "), boundary: false };
};
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
  const author = stripXml(text.match(/<author>([\s\S]*?)<\/author>/)?.[1] ?? "");
  const attribution = classifyAttribution(author, title);
  const extent = matchRequired(text, /<extent>([^<]+)<\/extent>/, "卷数", record.sourceRecordId);
  const canonId = record.canonWitnessId;
  const segments = parseCbetaReadingLines(text, { canonId });
  const navigation = buildPageNavigation(segments);
  const juans = [...new Set(segments.map((segment) => segment.juan))];
  const numericJuans = juans.map(Number);
  if (numericJuans.some((juan, index) => !Number.isSafeInteger(juan) || juan < 1 || (index > 0 && juan !== numericJuans[index - 1] + 1))) {
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
    ? "题名明确显示为某品、某分、母经中独立译出或真言组件，完整保存来源文件但不冒充完整母作品；"
    : attribution.sourceRole === "translated_esoteric_canonical_record"
      ? "目录署为翻译，但密教部类位置或佛说式题名不等于佛陀逐字亲说，作品归属与跨语种关系仍需逐项证据；"
      : attribution.sourceRole === "translation_attribution_unknown"
        ? "目录题记为失译，平台不补造译者、年代或印度来源；"
        : attribution.sourceRole === "unattributed_esoteric_text_or_ritual"
          ? "题记未载作者或译者，平台不把匿名陀罗尼、仪轨或赞颂自动改写为译经；"
          : "题记或题名明确为撰、述、注、校、请来或口受，平台保留其编撰、校注或传承角色，不改写成佛陀亲说；";
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
      canonRef: `大正藏 T20, no. ${displayNumber(canonId)}`,
      translator: attribution.label,
      summary: `${extent}。本站完整保存 ${canonId} 的固定 CBETA TEI 来源记录与可校验页栏行锚点；${boundarySummary}物理记录、作品、表达、版本见证与佛说归属分层计数。`,
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
  ["T1045a", "T1045b"], ["T1057a", "T1057b"], ["T1062A", "T1062B"], ["T1072A", "T1072B"],
  ["T1103a", "T1103b"], ["T1108A", "T1108B"], ["T1113A", "T1113B"], ["T1120A", "T1120B"],
  ["T1134A", "T1134B"], ["T1138a", "T1138b"], ["T1156A", "T1156B"], ["T1159A", "T1159B"],
  ["T1168A", "T1168B"], ["T1177A", "T1177B"], ["T1185A", "T1185B"],
].map(([left, right]) => compareBodies(left, right));
const comparisonByPair = new Map(comparisonPairs.map((item) => [item.pair.join("/"), item]));
if (
  comparisonByPair.get("T1045a/T1045b").fiveGramContainmentOfShorter < 0.35 ||
  comparisonByPair.get("T1057a/T1057b").fiveGramContainmentOfShorter < 0.69 ||
  comparisonByPair.get("T1103a/T1103b").fiveGramContainmentOfShorter < 0.20 ||
  comparisonByPair.get("T1108A/T1108B").fiveGramContainmentOfShorter < 0.50 ||
  comparisonByPair.get("T1134A/T1134B").fiveGramContainmentOfShorter < 0.74 ||
  comparisonByPair.get("T1138a/T1138b").fiveGramContainmentOfShorter < 0.06 ||
  comparisonByPair.get("T1185A/T1185B").fiveGramContainmentOfShorter < 0.30 ||
  comparisonByPair.get("T1072A/T1072B").fiveGramContainmentOfShorter > 0.01 ||
  comparisonByPair.get("T1177A/T1177B").fiveGramContainmentOfShorter > 0.01
) throw new Error("T20 高风险同题、版本或组件正文比较漂移");

const batch = {
  schema: "https://foxue.ai/schemas/cbeta-controlled-batch-v1.0",
  version,
  publishedAt: "2026-08-14",
  baseCatalog: baseCatalogPath,
  inventory: inventoryPath,
  rightsCategory: "Individually reviewed CBETA TEI files in Taishō volumes T01–T20; T20 source-record closure",
  workOverrides: {},
  fileOverrides: {},
  collection: {
    id: "CBETA-TAISHO-T20",
    title: "大正藏 T20 密教部固定来源记录",
    sourceRecordDenominator: 184,
    previouslyControlledSourceRecords: 0,
    newSourceRecords: files.length,
    controlledSourceRecords: files.length,
    newSourceBytes: files.reduce((sum, file) => sum + file.upstreamBytes, 0),
    newStableSegments: files.reduce((sum, file) => sum + file.verification.segments, 0),
    newFolios: files.reduce((sum, file) => sum + file.verification.folios, 0),
    verifiedEditionWitnesses: files.filter((file) => file.workIdentityStatus === "verified_edition_witness").length,
    provisionalRecords: files.filter((file) => file.workIdentityStatus === "provisional_canon_record").length,
    newFullSourceTexts: files.filter((file) => file.completeness === "complete_source_file").length,
    newPartialSourceWitnesses: files.filter((file) => file.completeness === "complete_source_file_partial_work_witness").length,
    relationAnnotatedRecords: files.filter((file) => file.bibliographicRelations?.length).length,
    attributionBoundaryRecords: files.filter((file) => classifyAttribution(
      file.presentation.translator === "题记未载作者／译者" ? "" : file.presentation.translator.replace(/ · /g, " "),
      file.presentation.title,
    ).boundary).length,
    newWorks: 177,
    controlledWorks: 177,
    workCountingDecision: "T20 共 184 条固定来源记录，均为本批新增。14 条 A/B 或 a/b 记录按同一基础经号、核心题名、署名与正文证据归入 7 个作品并保留独立版本见证，其余 170 条暂按书目实体登记，共新增 177 个作品；多译本、同题、尊格相同、赞颂、品、分、真言和仪轨组件关系只作候选，不自动归并。",
  },
  boundaryAudit: {
    status: "verified_source_integrity_edition_groups_attribution_partial_witness_and_component_boundaries_recorded",
    existingControlledRecords: [],
    editionOrRecensionGroups: editionGroups.map((item) => item.relation.groupId),
    candidateRelationsNotMerged: candidateRelations.map((item) => item.groupId),
    partialWorkWitnesses: [...partialWitnessIds],
    translatedRecords: files.filter((file) => file.sourceRole === "translated_esoteric_canonical_record").map((file) => file.id),
    unattributedRecords: files.filter((file) => file.sourceRole === "unattributed_esoteric_text_or_ritual").map((file) => file.id),
    lostTranslatorRecords: files.filter((file) => file.sourceRole === "translation_attribution_unknown").map((file) => file.id),
    attributedAuthoredCompiledAnnotatedCollatedOrTransmittedRecords: files.filter((file) => file.sourceRole === "attributed_authored_compiled_or_transmitted_esoteric_text").map((file) => file.id),
    textualComparison: {
      algorithm: "Unicode text from stable reading lines; punctuation/space removed; unique character 5-gram containment and Jaccard. Machine comparison is evidence, not a work-identity verdict.",
      pairs: comparisonPairs,
    },
    authoritySources: [
      "https://github.com/cbeta-org/xml-p5/tree/2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9/T/T20",
      "https://cbetaonline.dila.edu.tw/zh/T1057a_001",
    ],
    caveat: "T20 同时容纳译经、陀罗尼、仪轨、念诵法、赞颂、注校、请来或口受材料、失译、局部品分与版本见证。平台完整保存固定来源，但不把目录位置、佛说式题名、相邻经号、同尊格、同题或机器文本相似度单独当成佛陀亲说或同一作品的证明。",
  },
  files,
};

if (
  batch.collection.newSourceRecords !== 184 ||
  batch.collection.newSourceBytes !== 24220376 ||
  batch.collection.newStableSegments !== 76527 ||
  batch.collection.newFolios !== 2976 ||
  batch.collection.verifiedEditionWitnesses !== 14 ||
  batch.collection.provisionalRecords !== 170 ||
  batch.collection.newFullSourceTexts !== 179 ||
  batch.collection.newPartialSourceWitnesses !== 5 ||
  batch.collection.attributionBoundaryRecords !== 28 ||
  batch.collection.newWorks !== 177
) throw new Error(`T20 关系、归属或作品边界统计漂移：${JSON.stringify(batch.collection)}`);

await writeFile(resolve(root, `data/corpus/cbeta/batch-v${version}.json`), `${JSON.stringify(batch, null, 2)}\n`, "utf8");
console.log(`CBETA T20 审计完成：184/184 个固定来源记录；新增 ${batch.collection.newWorks} 个作品、${batch.collection.newSourceRecords} 个表达或见证、${batch.collection.newStableSegments} 个稳定行段。`);

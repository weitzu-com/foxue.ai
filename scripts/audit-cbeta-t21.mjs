import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { buildPageNavigation, parseCbetaReadingLines } from "../src/lib/cbeta-tei.mjs";

const root = process.cwd();
const version = "2.8.0";
const expectedCommit = "2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9";
const sourceArgument = process.argv.find((argument) => argument.startsWith("--source-dir="));
if (!sourceArgument) {
  console.error("用法：node scripts/audit-cbeta-t21.mjs --source-dir=/固定提交的/xml-p5");
  process.exit(1);
}
const sourceRoot = resolve(sourceArgument.slice("--source-dir=".length));
const actualCommit = execFileSync("git", ["-C", sourceRoot, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (actualCommit !== expectedCommit) throw new Error(`上游工作树必须固定到 ${expectedCommit}`);

const inventoryPath = "data/gbcr/cbeta-taisho-t21-inventory-v0.1.0.json";
const inventory = JSON.parse(await readFile(resolve(root, inventoryPath), "utf8"));
const baseCatalogPath = "data/corpus/cbeta/catalog-v2.7.0.json";
const baseCatalog = JSON.parse(await readFile(resolve(root, baseCatalogPath), "utf8"));
const sourceUnits = (file) => file.sourceParts ?? [file];
const controlledPaths = new Set(baseCatalog.files.flatMap(sourceUnits).map((file) => file.upstreamPath));
const candidates = inventory.records.filter((record) => !controlledPaths.has(record.upstreamPath));
if (inventory.totals.records !== 228 || inventory.totals.upstreamBytes !== 21264046 || candidates.length !== 228) {
  throw new Error(`T21 固定来源分母或新增记录漂移：${inventory.totals.records}/${candidates.length}`);
}

const relation = (type, groupId, label, evidence, ids) => ({
  type, groupId, label, evidence, externalIds: { cbeta: ids },
});
const editionGroups = [
  ["1222", ["T1222a", "T1222b"], "圣迦抳忿怒金刚童子成就仪轨经 T1222 a/b 版本见证", "同一基础经号、核心题名与不空译题记一致；较短本五字片段覆盖 65.2%，共享作品实体并保留独立版本。"],
  ["1252", ["T1252a", "T1252b"], "大吉祥天女十二名号经 T1252 a/b 版本见证", "同一基础经号、题名与不空译题记完全一致；较短本五字片段覆盖 57.6%，作为同作品独立版本。"],
  ["1255", ["T1255a", "T1255b"], "摩利支天经 T1255 a/b 版本见证", "同一基础经号、不空译题记及核心题名一致；较短本五字片段覆盖 19.9%，共享作品实体但保留文本差异。"],
  ["1264", ["T1264a", "T1264b"], "蘘麌哩曳童女经 T1264 a/b 版本见证", "同一基础经号、不空译题记和毒害陀罗尼主题一致；较短本五字片段覆盖 20.5%，作为同作品不同传本。"],
  ["1369", ["T1369a", "T1369b"], "百千印陀罗尼经 T1369 a/b 版本见证", "同一基础经号、题名与实叉难陀译题记完全一致；较短本五字片段覆盖 22.5%，作为同作品独立版本。"],
  ["1378", ["T1378a", "T1378b"], "幻师颰陀神咒经 T1378 a/b 版本见证", "同一基础经号、曇无兰译题记和核心题名一致；较短本五字片段覆盖 39.5%，作为同作品独立版本。"],
].map(([number, ids, label, evidence]) => ({
  ids,
  workId: `gbcr:work:taisho-t${number}-edition-group`,
  relation: relation("same_work_edition_or_recension_group_verified", `t${number}-edition-recension-witnesses`, label, evidence, ids),
}));
const candidateRelations = [
  relation("ritual_family_candidate_unmerged", "acala-t1199-t1205", "不动尊念诵与安镇法候选家族", "经品、念诵法、安镇法、童子秘要与集成仪轨并存；同一尊格和目录邻接不足以证明同一作品。", ["T1199", "T1200", "T1201", "T1202", "T1203", "T1204", "T1205"]),
  relation("ritual_family_candidate_unmerged", "kurikara-t1206-t1208", "俱利伽罗龙王经法候选家族", "陀罗尼经、像法与仪轨体裁和范围不同，只记录家族关系。", ["T1206", "T1207", "T1208"]),
  relation("ritual_family_candidate_unmerged", "trailokyavijaya-t1209-t1210", "降三世明王仪轨候选家族", "两份不空译密门与念诵仪轨题名相关，尚未完成逐段作品同一性校勘。", ["T1209", "T1210"]),
  relation("ritual_family_candidate_unmerged", "kundali-t1211-t1213", "军荼利念诵法候选家族", "仪轨、记本与梵字真言来源角色不同，不自动归并。", ["T1211", "T1212", "T1213"]),
  relation("translation_and_ritual_family_candidate_unmerged", "yamantaka-t1214-t1219", "焰曼德迦译经与仪轨候选家族", "念诵法、仪轨品、三卷译经、将来咒法与一行撰术并存，作品边界待校勘。", ["T1214", "T1215", "T1216", "T1217", "T1218", "T1219"]),
  relation("ritual_family_candidate_unmerged", "vajrayaksa-t1220-t1221", "金刚药叉修法候选家族", "译仪轨与记述法共享尊格但来源角色不同。", ["T1220", "T1221"]),
  relation("translation_and_ritual_family_candidate_unmerged", "vajrakumara-t1222-t1224", "金刚童子经轨候选家族", "T1222 a/b 是已核版本；T1223 忿迅俱摩罗仪轨与 T1224 无署名持念经仅保留候选家族关系。", ["T1222a", "T1222b", "T1223", "T1224"]),
  relation("translation_and_ritual_family_candidate_unmerged", "ucchusma-t1225-t1229", "乌芻涩么／秽迹金刚经轨候选家族", "不空、请来梵字本与阿质达霰译经法范围不同，不以尊格或近题合并。", ["T1225", "T1226", "T1227", "T1228", "T1229"]),
  relation("ritual_family_candidate_unmerged", "great-wheel-vajra-t1230-t1231", "大轮金刚经法候选家族", "一份无署名陀罗尼经与一份修行供养法相关但体裁不同。", ["T1230", "T1231"]),
  relation("translation_family_candidate_unmerged", "anengsheng-t1233-t1236", "无能胜明王陀罗尼候选家族", "四份法天译题名由大明王经到心陀罗尼、金刚火陀罗尼不等，尚不据此合并。", ["T1233", "T1234", "T1235", "T1236"]),
  relation("translation_and_ritual_family_candidate_unmerged", "atavaka-t1237-t1240", "阿吒婆拘大将经轨候选家族", "两份失译咒经、三卷修行仪轨与付嘱咒范围不同。", ["T1237", "T1238", "T1239", "T1240"]),
  relation("translation_and_ritual_family_candidate_unmerged", "vaisravana-t1244-t1250", "毗沙门天王经轨候选家族", "多译经、随军护法、真言与别行仪轨并存，目录邻接不作作品合并。", ["T1244", "T1245", "T1246", "T1247", "T1248", "T1249", "T1250"]),
  relation("translation_family_candidate_unmerged", "sri-t1252-t1253", "大吉祥天女名号经候选家族", "T1252 a/b 是已核版本；T1253 含十二契与一百八名，范围不同而不自动合并。", ["T1252a", "T1252b", "T1253"]),
  relation("translation_and_ritual_family_candidate_unmerged", "marici-t1254-t1259", "摩利支天经咒与修法候选家族", "华鬘经、多译陀罗尼、七卷经、略念诵法和一印法并存。", ["T1254", "T1255a", "T1255b", "T1256", "T1257", "T1258", "T1259"]),
  relation("translation_family_candidate_unmerged", "hariti-t1260-t1263", "欢喜母／鬼子母经法候选家族", "成就法、真言经、失译鬼子母经与童子经相关但不等同。", ["T1260", "T1261", "T1262", "T1263"]),
  relation("translation_family_candidate_unmerged", "janguli-t1264-t1265", "蘘麌哩曳／常瞿利毒女异译候选家族", "T1264 a/b 为已核版本；T1265 译者和题名不同，跨译本关系待校。", ["T1264a", "T1264b", "T1265"]),
  relation("translation_and_ritual_family_candidate_unmerged", "vinayaka-t1266-t1275", "毗那夜迦经轨候选家族", "咒法、陀罗尼、双身供养法、四卷经、记本、形像仪轨与式法来源角色各异。", ["T1266", "T1267", "T1268", "T1269", "T1270", "T1271", "T1272", "T1273", "T1274", "T1275"]),
  relation("ritual_collection_candidate_unmerged", "deity-rituals-t1276-t1298", "诸天与护世仪轨目录家族", "金翅鸟、摩醯首罗、地天、大黑天、焰罗王、罗刹与十二天等对象不同；只保留目录家族，不构成同一作品。", ["T1276", "T1277", "T1278", "T1279", "T1280", "T1281", "T1282", "T1283", "T1284", "T1285", "T1286", "T1287", "T1288", "T1289", "T1290", "T1291", "T1292", "T1293", "T1294", "T1295", "T1296", "T1297", "T1298"]),
  relation("astral_text_family_candidate_unmerged", "astral-t1299-t1312", "宿曜与北斗星曜经轨候选家族", "译经、历宿、护摩法与撰述术书并存，星曜主题不是作品同一性证据。", ["T1299", "T1300", "T1301", "T1302", "T1303", "T1304", "T1305", "T1306", "T1307", "T1308", "T1309", "T1310", "T1311", "T1312"]),
  relation("translation_and_ritual_family_candidate_unmerged", "hungry-ghost-feeding-t1313-t1321", "焰口施食经轨候选家族", "多译陀罗尼、饮食水法、缘由与施食仪范围不同，不能直接归并。", ["T1313", "T1314", "T1315", "T1316", "T1317", "T1318", "T1319", "T1320", "T1321"]),
  relation("healing_dharani_collection_candidate_unmerged", "healing-t1323-t1330", "治病陀罗尼目录家族", "眼疾、痔病、时气、齿目与小儿病对象不同，目录连续不等于同一作品。", ["T1323", "T1324", "T1325", "T1326", "T1327", "T1328", "T1329", "T1330"]),
  relation("dharani_collection_candidate_unmerged", "dharani-collections-t1331-t1341", "灌顶与陀罗尼合集目录家族", "十二卷灌顶经、失译杂集与多部大型陀罗尼经是独立合集或作品，不因体裁相近合并。", ["T1331", "T1332", "T1333", "T1334", "T1335", "T1336", "T1337", "T1338", "T1339", "T1340", "T1341"]),
  relation("translation_family_candidate_unmerged", "eastern-lamp-t1353-t1355", "东方最胜灯王译本候选家族", "两份隋译与一份宋译题名相近，作品同一性待逐段校勘。", ["T1353", "T1354", "T1355"]),
  relation("translation_family_candidate_unmerged", "flower-heap-t1356-t1359", "华积／花聚陀罗尼译本候选家族", "吴译、失译和宋译题名相关，范围与文本关系尚未人工裁决。", ["T1356", "T1357", "T1358", "T1359"]),
  relation("translation_family_candidate_unmerged", "victory-banner-t1363-t1364", "胜幢臂印／妙臂印幢异译候选", "玄奘与实叉难陀译题名高度相关，跨译本逐段校勘前不合并。", ["T1363", "T1364"]),
  relation("translation_family_candidate_unmerged", "eight-names-t1365-t1366", "八名陀罗尼异译候选", "唐译与宋译题名相关，保持独立译本和候选关系。", ["T1365", "T1366"]),
  relation("translation_family_candidate_unmerged", "great-dharani-kings-t1370-t1371", "总持王经异译候选", "两份施护译题名和核心术语相关，范围同一性待校。", ["T1370", "T1371"]),
  relation("translation_family_candidate_unmerged", "adornment-king-t1374-t1376", "庄严王经咒异译候选家族", "唐译经、咒经与二卷宋译陀罗尼经范围不等。", ["T1374", "T1375", "T1376"]),
  relation("same_title_component_candidate_unmerged", "past-life-knowledge-t1382-t1383", "宿命智陀罗尼经题名候选", "同为法贤译且题名仅差经字，但没有共享基础经号，暂不越号合并。", ["T1382", "T1383"]),
  relation("obstacle_removal_family_candidate_unmerged", "obstacle-removal-t1395-t1400", "拔罪除障陀罗尼候选家族", "不同译者、题名与障难对象并存，只记录功能性家族。", ["T1395", "T1396", "T1397", "T1398", "T1399", "T1400"]),
  relation("wish_jewel_family_candidate_unmerged", "wish-jewel-t1402-t1404", "随求如意与如意宝总持候选家族", "题名均含如意宝语汇，但文本范围与作品关系未校。", ["T1402", "T1403", "T1404"]),
  relation("protection_family_candidate_unmerged", "thief-protection-t1405-t1407", "辟除贼难与诸恶陀罗尼候选家族", "两译一失署材料的保护对象相关，不以功能自动合并。", ["T1405", "T1406", "T1407"]),
  relation("translation_family_candidate_unmerged", "supreme-dharani-t1408-t1409", "最上意／最胜陀罗尼候选", "同为施护译但题名和正文关系未完成校勘，保持独立作品。", ["T1408", "T1409"]),
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

const partialWitnessIds = new Set(["T1199", "T1215", "T1216", "T1273", "T1276", "T1297"]);
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
  if (!author && /龍樹五明論/.test(title)) return { sourceRole: "attributed_authored_compiled_or_transmitted_esoteric_text", label: "题名载龙树传统归属", boundary: true };
  if (!author && /口受/.test(title)) return { sourceRole: "attributed_authored_compiled_or_transmitted_esoteric_text", label: "题名载口受传承", boundary: true };
  if (!author) return { sourceRole: "unattributed_esoteric_text_or_ritual", label: "题记未载作者／译者", boundary: true };
  if (/(失譯|闕譯)/.test(author)) return { sourceRole: "translation_attribution_unknown", label: author, boundary: true };
  if (/[撰述集記注校造]/.test(author) || /(請來|口受|將來|譯解)/.test(author)) {
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
    ? "题名明确显示为某品、法品或大教王经中的独立译出组件，完整保存来源文件但不冒充完整母作品；"
    : attribution.sourceRole === "translated_esoteric_canonical_record"
      ? "目录署为翻译，但密教部类位置或佛说式题名不等于佛陀逐字亲说，作品归属与跨语种关系仍需逐项证据；"
      : attribution.sourceRole === "translation_attribution_unknown"
        ? "目录题记为失译，平台不补造译者、年代或印度来源；"
        : attribution.sourceRole === "unattributed_esoteric_text_or_ritual"
          ? "题记未载作者或译者，平台不把匿名陀罗尼、仪轨、术书、合集或论书自动改写为译经；"
          : "题记或题名明确为撰、述、集、记、造、注、校、请来、将来、口受或译解，平台保留其编撰、论造、校注、传承或解释角色，不改写成佛陀亲说；";
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
      canonRef: `大正藏 T21, no. ${displayNumber(canonId)}`,
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
  ["T1222a", "T1222b"], ["T1252a", "T1252b"], ["T1255a", "T1255b"],
  ["T1264a", "T1264b"], ["T1369a", "T1369b"], ["T1378a", "T1378b"],
].map(([left, right]) => compareBodies(left, right));
const comparisonByPair = new Map(comparisonPairs.map((item) => [item.pair.join("/"), item]));
if (
  comparisonByPair.get("T1222a/T1222b").fiveGramContainmentOfShorter < 0.65 ||
  comparisonByPair.get("T1252a/T1252b").fiveGramContainmentOfShorter < 0.57 ||
  comparisonByPair.get("T1255a/T1255b").fiveGramContainmentOfShorter < 0.19 ||
  comparisonByPair.get("T1264a/T1264b").fiveGramContainmentOfShorter < 0.20 ||
  comparisonByPair.get("T1369a/T1369b").fiveGramContainmentOfShorter < 0.22 ||
  comparisonByPair.get("T1378a/T1378b").fiveGramContainmentOfShorter < 0.39
) throw new Error("T21 高风险同号版本正文比较漂移");

const batch = {
  schema: "https://foxue.ai/schemas/cbeta-controlled-batch-v1.0",
  version,
  publishedAt: "2026-08-14",
  baseCatalog: baseCatalogPath,
  inventory: inventoryPath,
  rightsCategory: "Individually reviewed CBETA TEI files in Taishō volumes T01–T21; T21 source-record closure",
  workOverrides: {},
  fileOverrides: {},
  collection: {
    id: "CBETA-TAISHO-T21",
    title: "大正藏 T21 密教部固定来源记录",
    sourceRecordDenominator: 228,
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
    attributionBoundaryRecords: files.filter((file) => file.sourceRole !== "translated_esoteric_canonical_record").length,
    newWorks: 222,
    controlledWorks: 222,
    workCountingDecision: "T21 共 228 条固定来源记录，均为本批新增。12 条 a/b 记录按同一基础经号、核心题名、署名与正文证据归入 6 个作品并保留独立版本见证，其余 216 条暂按书目实体登记，共新增 222 个作品；多译本、同题、同尊格、功能相近、品分、合集、论书和仪轨组件关系只作候选，不自动归并。",
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
      "https://github.com/cbeta-org/xml-p5/tree/2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9/T/T21",
      "https://cbetaonline.dila.edu.tw/zh/T1222a_001",
    ],
    caveat: "T21 同时容纳译经、陀罗尼、仪轨、念诵法、天部修法、星曜术、施食法、治病咒、合集、论书、译解、失译、局部品分与版本见证。平台完整保存固定来源，但不把目录位置、佛说式题名、相邻经号、同尊格、同功能、同题或机器文本相似度单独当成佛陀亲说或同一作品的证明。",
  },
  files,
};

if (
  batch.collection.newSourceRecords !== 228 ||
  batch.collection.newSourceBytes !== 21264046 ||
  batch.collection.newStableSegments !== 78342 ||
  batch.collection.newFolios !== 3119 ||
  batch.collection.verifiedEditionWitnesses !== 12 ||
  batch.collection.provisionalRecords !== 216 ||
  batch.collection.newFullSourceTexts !== 222 ||
  batch.collection.newPartialSourceWitnesses !== 6 ||
  batch.collection.relationAnnotatedRecords !== 177 ||
  batch.collection.attributionBoundaryRecords !== 58 ||
  batch.collection.newWorks !== 222
) throw new Error(`T21 关系、归属或作品边界统计漂移：${JSON.stringify(batch.collection)}`);

await writeFile(resolve(root, `data/corpus/cbeta/batch-v${version}.json`), `${JSON.stringify(batch, null, 2)}\n`, "utf8");
console.log(`CBETA T21 审计完成：228/228 个固定来源记录；新增 ${batch.collection.newWorks} 个作品、${batch.collection.newSourceRecords} 个表达或见证、${batch.collection.newStableSegments} 个稳定行段。`);

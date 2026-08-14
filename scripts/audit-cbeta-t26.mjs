import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { buildPageNavigation, parseCbetaReadingLines } from "../src/lib/cbeta-tei.mjs";

const root = process.cwd();
const version = "3.3.0";
const expectedCommit = "2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9";
const sourceArgument = process.argv.find((argument) => argument.startsWith("--source-dir="));
if (!sourceArgument) {
  console.error("用法：node scripts/audit-cbeta-t26.mjs --source-dir=/固定提交的/xml-p5");
  process.exit(1);
}
const sourceRoot = resolve(sourceArgument.slice("--source-dir=".length));
const actualCommit = execFileSync("git", ["-C", sourceRoot, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (actualCommit !== expectedCommit) throw new Error(`上游工作树必须固定到 ${expectedCommit}`);

const inventoryPath = "data/gbcr/cbeta-taisho-t26-inventory-v0.1.0.json";
const inventory = JSON.parse(await readFile(resolve(root, inventoryPath), "utf8"));
const baseCatalogPath = "data/corpus/cbeta/catalog-v3.2.0.json";
const baseCatalog = JSON.parse(await readFile(resolve(root, baseCatalogPath), "utf8"));
const sourceUnits = (file) => file.sourceParts ?? [file];
const controlledPaths = new Set(baseCatalog.files.flatMap(sourceUnits).map((file) => file.upstreamPath));
const candidates = inventory.records.filter((record) => !controlledPaths.has(record.upstreamPath));
if (inventory.totals.records !== 26 || inventory.totals.upstreamBytes !== 14495358 || candidates.length !== 26) {
  throw new Error(`T26 固定来源分母或新增记录漂移：${inventory.totals.records}/${candidates.length}`);
}

const relation = (type, groupId, label, evidence, ids) => ({
  type, groupId, label, evidence, externalIds: { cbeta: ids },
});
const relations = [
  relation(
    "same_work_translation_and_root_commentary_group_verified",
    "lotus-upadesa-t1519-t1520",
    "《法华论》两种汉译与《法华经》根本经关系",
    "目录规范资料把 T1519 与 T1520 登记为同一印度论书的两种汉译，并共同连接《妙法莲华经》汉译组。平台共享一个论书作品实体，保留两译的译者、卷次和措辞，同时不把论书计作佛陀逐字亲说经文。",
    ["T0262", "T0264", "T1519", "T1520"],
  ),
  relation(
    "root_sutra_commentary_family_candidate_unmerged",
    "dasabhumi-commentaries-t1521-t1522",
    "Daśabhūmika／《十地经》论释家族",
    "T1521《十住毘婆沙论》与 T1522《十地经论》都解释十地传统，但作者、结构和传承不同。平台分别建立作品，并共同连接 T0286/T0287《十地经》汉译组。",
    ["T0286", "T0287", "T1521", "T1522"],
  ),
  relation(
    "root_sutra_commentary_relation_verified",
    "kasyapaparivarta-t0352-t1523",
    "Kāśyapaparivarta／《大迦叶问经》与《大宝积经论》",
    "T1523 正文围绕迦叶问法展开，书目研究把它放在 Kāśyapaparivarta 论释传统。平台连接 T0352 的作品实体，不把它误并入整部合编《大宝积经》T0310。",
    ["T0352", "T1523"],
  ),
  relation(
    "root_sutra_commentary_relation_verified",
    "larger-sukhavati-t1524",
    "Larger Sukhāvatīvyūha／《无量寿经》与往生论",
    "T1524 是世亲传统《无量寿经优波提舍》，平台连接 T0360/T0363 同一根本经作品；经与论保持两个作品，论师归属不扩张为佛陀说法。",
    ["T0360", "T0363", "T1524"],
  ),
  relation(
    "root_sutra_commentary_relation_verified",
    "maitreya-vow-t0349-t1525",
    "《弥勒菩萨所问本愿经》与经论关系",
    "T1525 与 T0349 共享弥勒本愿问答的书目关系。平台登记根本经—论释连接，但在缺少足够同一性证据时不与其他弥勒经或论书合并。",
    ["T0349", "T1525"],
  ),
  relation(
    "embedded_root_text_commentary_relation_recorded",
    "ratnacuda-four-dharmas-t1526",
    "宝髻经四法根本文与论释结构",
    "T1526 题名、序文与正文表明其解释宝髻经四法段落；目前没有足够证据把所释片段绑定到一个独立、完整的受控根本经记录，故只记录内嵌根本文—论释结构。",
    ["T1526"],
  ),
  relation(
    "root_sutra_commentary_family_candidate_unmerged",
    "mahaparinirvana-commentaries-t1527-t1528",
    "Mahāparinirvāṇa／《涅槃经》两种不同论释",
    "T1527 与 T1528 都连接 T0374/T0375《大般涅槃经》作品，但不是同一论书：前者是独立《涅槃论》，后者专释本有今无偈。平台保留两个论书作品。",
    ["T0374", "T0375", "T1527", "T1528"],
  ),
  relation(
    "root_sutra_commentary_relation_with_contested_origin",
    "bequeathed-teaching-t0389-t1529",
    "《佛遗教经》与《遗教经论》关系及来源争议",
    "T1529 大量嵌入 T0389 根本文，机器五字片段包含率超过 84%；目录保留世亲造、真谛译传统题记，现代书目研究则认为它很可能是汉地撰述。平台并列呈现，不把传统归属冒充定论。",
    ["T0389", "T1529"],
  ),
  relation(
    "embedded_root_text_commentary_relation_verified",
    "buddhabhumi-t0680-t1530",
    "Buddhabhūmisūtra／《佛地经》与《佛地经论》",
    "T1530 逐段解释 T0680，机器五字片段包含率超过 90%。平台把根本经与亲光等造论分成两个作品，并记录高置信内嵌根本文关系。",
    ["T0680", "T1530"],
  ),
  relation(
    "root_sutra_commentary_relation_verified",
    "gaya-sirsa-t0464-t1531",
    "Gayāśīrṣasūtra／《文殊师利问菩提经》与经论",
    "T1531 连接 T0464 所属 Gayāśīrṣasūtra 汉译作品。平台分别计算根本经表达与世亲传统论释表达。",
    ["T0464", "T1531"],
  ),
  relation(
    "root_sutra_commentary_relation_verified",
    "brahma-visesa-cinti-t1532",
    "Brahmaviśeṣacintiparipṛcchā／《思益梵天所问经》与经论",
    "T1532 连接 T0585/T0586/T0587 同一根本经汉译组。共同所释经典只建立关系，不把不同经译或论书合成单一文本。",
    ["T0585", "T0586", "T0587", "T1532"],
  ),
  relation(
    "root_sutra_commentary_family_candidate_unmerged",
    "dharmacakra-t1533",
    "Dharmacakrapravartana／转法轮经与论释家族",
    "T1533 解释转法轮经传统；T0109 与 T0110 当前仍是两个独立受控作品。平台同时连接二者为候选经论家族，不凭题名直接完成根本经同一性合并。",
    ["T0109", "T0110", "T1533"],
  ),
  relation(
    "embedded_root_text_commentary_relation_recorded",
    "three-completions-t1534",
    "《三具足经》根本文与论释结构",
    "T1534 题记只载毘目智仙译，未载论书作者；所释《三具足经》尚未安全绑定到独立受控根本经记录。平台保留内嵌根本文结构，并拒绝从相邻目录补造作者。",
    ["T1534"],
  ),
  relation(
    "root_sutra_commentary_relation_with_anonymous_epitome",
    "mahayana-four-dharmas-t0774-t1535",
    "《大乘四法经》与敦煌无署名释题",
    "T1535 是连接 T0774 的短篇敦煌释题/撮要。文件题记无作者，正文提到世亲本释不足以证明本篇由世亲撰写；平台把它登记为无署名汉地释文，不补造印度作者。",
    ["T0774", "T1535"],
  ),
  relation(
    "abhidharma_historical_collection_family_unmerged",
    "sarvastivada-six-feet-and-body-t1536-t1544",
    "说一切有部“六足一身”阿毗达磨文献家族",
    "T1536–T1544 属说一切有部阿毗达磨历史文献群。‘六足一身’是后期形成的分类模型，不是作品同一性的证明；除有独立证据的 T1541/T1542 与 T1543/T1544 两组外，各书保持独立作品。",
    ["T1536", "T1537", "T1538", "T1539", "T1540", "T1541", "T1542", "T1543", "T1544"],
  ),
  relation(
    "same_work_translation_group_verified",
    "prakaranapada-t1541-t1542",
    "Prakaraṇapāda／《品类足论》两种汉译",
    "书目资料明确把 T1541《众事分阿毗昙论》与 T1542《阿毗达磨品类足论》列为同本异译。平台共享一个作品实体，保留求那跋陀罗/菩提耶舍译与玄奘译两个完整表达。",
    ["T1541", "T1542"],
  ),
  relation(
    "same_work_translation_recension_group_verified",
    "jnanaprasthana-t1543-t1544",
    "Jñānaprasthāna／《发智论》两种汉译与异传",
    "比较研究把 T1543《阿毗昙八犍度论》与 T1544《阿毗达磨发智论》确认为同一基础作品的两种汉译，同时指出两者可能反映不同传承层。平台共享作品实体，但明确保留译本与传承差异。",
    ["T1543", "T1544"],
  ),
];
const relationsByCanonId = new Map();
for (const item of relations) {
  for (const id of item.externalIds.cbeta) {
    relationsByCanonId.set(id, [...(relationsByCanonId.get(id) ?? []), item]);
  }
}

const identityGroups = new Map([
  ["T1519", { workId: "gbcr:work:lotus-sutra-upadesa", status: "verified_same_work_expression", canonicalTitle: "法华经论（Saddharmapuṇḍarīkopadeśa）" }],
  ["T1520", { workId: "gbcr:work:lotus-sutra-upadesa", status: "verified_same_work_expression", canonicalTitle: "法华经论（Saddharmapuṇḍarīkopadeśa）" }],
  ["T1541", { workId: "gbcr:work:prakaranapada", status: "verified_same_work_expression", canonicalTitle: "品类足论（Prakaraṇapāda）" }],
  ["T1542", { workId: "gbcr:work:prakaranapada", status: "verified_same_work_expression", canonicalTitle: "品类足论（Prakaraṇapāda）" }],
  ["T1543", { workId: "gbcr:work:jnanaprasthana", status: "verified_same_work_expression", canonicalTitle: "发智论（Jñānaprasthāna）" }],
  ["T1544", { workId: "gbcr:work:jnanaprasthana", status: "verified_same_work_expression", canonicalTitle: "发智论（Jñānaprasthāna）" }],
]);
const unnamedExegeticalAuthors = new Set(["T1523", "T1525", "T1534"]);
const authoredAbhidharma = new Set(["T1539", "T1540", "T1541", "T1542", "T1543", "T1544"]);

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const gitBlobSha1 = (value) => createHash("sha1").update(`blob ${value.length}\0`).update(value).digest("hex");
const matchRequired = (text, pattern, label, id) => {
  const value = text.match(pattern)?.[1]?.trim();
  if (!value) throw new Error(`${id} 缺少 ${label}`);
  return value;
};
const stripXml = (value) => value.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
const displayNumber = (canonId) => canonId.slice(1).replace(/^0+(?=\d)/, "");
const classifyAttribution = (canonId, author) => {
  if (canonId === "T1529") return {
    sourceRole: "traditional_attributed_exegetical_treatise_with_contested_origin",
    label: author.replace(/\s+/g, " · "),
    summary: "目录保存世亲造、真谛译传统题记，同时公开现代书目研究认为本论很可能为汉地撰述的证据；",
  };
  if (canonId === "T1535") return {
    sourceRole: "anonymous_dunhuang_exegetical_epitome",
    label: "敦煌遗书 · 无署名",
    summary: "来源题记没有作者或译者，正文提及世亲本释不等于本篇由世亲撰写，平台不补造归属；",
  };
  if (canonId === "T1536") return {
    sourceRole: "traditional_taught_abhidharma_with_translation",
    label: author.replace(/\s+/g, " · "),
    summary: "题记保存舍利子说、玄奘译的传统责任陈述，‘说’与现代意义的作者身份分层记录；",
  };
  if (canonId === "T1537") return {
    sourceRole: "traditional_attributed_abhidharma_with_contested_authorship",
    label: author.replace(/\s+/g, " · "),
    summary: "汉译题记归于大目乾连，梵藏传统另有舍利子归属，平台并列保存相互冲突的作者传统；",
  };
  if (canonId === "T1538") return {
    sourceRole: "translated_abhidharma_without_named_author",
    label: author.replace(/\s+/g, " · "),
    summary: "题记仅载法护等译而未载作者，平台不从‘六足一身’分类或相邻文本补造作者；",
  };
  if (authoredAbhidharma.has(canonId)) return {
    sourceRole: "authored_abhidharma_with_translation",
    label: author.replace(/\s+/g, " · "),
    summary: "题记分开保存论师与译者责任；历史分类、作品身份、译本与传承层保持可审计边界；",
  };
  if (unnamedExegeticalAuthors.has(canonId)) return {
    sourceRole: "translated_exegetical_treatise_without_named_author",
    label: author.replace(/\s+/g, " · "),
    summary: "题记保存译者但未载论书作者，平台不从题名、相邻目录或后世传统补造作者；",
  };
  return {
    sourceRole: "authored_exegetical_treatise_with_translation",
    label: author.replace(/\s+/g, " · "),
    summary: "题记分开保存论书作者与汉译责任，不把论师撰述扩张成佛陀逐字亲说；",
  };
};

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
  const author = stripXml(text.match(/<author>([\s\S]*?)<\/author>/)?.[1] ?? "");
  const extent = matchRequired(text, /<extent>([^<]+)<\/extent>/, "卷数", record.sourceRecordId);
  const canonId = record.canonWitnessId;
  const attribution = classifyAttribution(canonId, author);
  const identity = identityGroups.get(canonId) ?? {
    workId: `gbcr:work:taisho-${canonId.toLowerCase()}`,
    status: "provisional_canon_record",
  };
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
    workId: identity.workId,
    workIdentityStatus: identity.status,
    ...(identity.canonicalTitle ? { workTitle: identity.canonicalTitle } : {}),
    sourceRole: attribution.sourceRole,
    bibliographicRelations: relationsByCanonId.get(canonId) ?? [],
    localPath,
    upstreamPath: record.upstreamPath,
    upstreamGitBlobSha1: record.upstreamGitBlobSha1,
    upstreamBytes: upstream.length,
    upstreamSha256: sha256(upstream),
    localBytes: normalized.length,
    localSha256: sha256(normalized),
    format: "application/tei+xml",
    completeness: "complete_source_file",
    presentation: {
      title,
      alternateTitle: title,
      tradition: canonId >= "T1536" ? "漢傳佛教 · 毘曇部" : "漢傳佛教 · 釋經論部",
      language: "漢文",
      canonRef: `大正藏 T26, no. ${displayNumber(canonId)}`,
      translator: attribution.label,
      summary: `${extent}。本站完整保存 ${canonId} 固定 CBETA TEI 来源记录与可校验页栏行锚点；${attribution.summary}物理记录、作品、译本、传本、根本经论关系与责任归属分层计数。`,
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
  if (normalizedBodies.has(canonId)) return;
  const file = baseCatalog.files.find((item) => item.id === canonId);
  if (!file) throw new Error(`基础目录缺少比较文本 ${canonId}`);
  const segments = [];
  for (const source of sourceUnits(file)) {
    const text = await readFile(resolve(root, source.localPath), "utf8");
    segments.push(...parseCbetaReadingLines(text, { canonId }));
  }
  normalizedBodies.set(canonId, normalizeBody(segments));
};
for (const canonId of ["T0389", "T0680", "T0464", "T0286"]) await ensureBaseBody(canonId);

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
  ["T1519", "T1520"], ["T1541", "T1542"], ["T1543", "T1544"],
  ["T1521", "T1522"], ["T1527", "T1528"], ["T1536", "T1537"], ["T1539", "T1540"],
  ["T1529", "T0389"], ["T1530", "T0680"], ["T1531", "T0464"], ["T1522", "T0286"],
].map(([left, right]) => compareBodies(left, right));
const comparisonByPair = new Map(comparisonPairs.map((item) => [item.pair.join("/"), item]));
const containment = (pair) => comparisonByPair.get(pair).fiveGramContainmentOfShorter;
if (
  containment("T1519/T1520") < 0.63 ||
  containment("T1541/T1542") < 0.11 || containment("T1541/T1542") > 0.13 ||
  containment("T1543/T1544") < 0.07 || containment("T1543/T1544") > 0.09 ||
  containment("T1521/T1522") > 0.02 || containment("T1527/T1528") > 0.005 ||
  containment("T1536/T1537") < 0.07 || containment("T1536/T1537") > 0.09 ||
  containment("T1539/T1540") > 0.02 || containment("T1529/T0389") < 0.84 ||
  containment("T1530/T0680") < 0.89 || containment("T1531/T0464") < 0.28 ||
  containment("T1522/T0286") < 0.21
) throw new Error(`T26 同本异译、不同论书或根本经内嵌正文比较漂移：${JSON.stringify(comparisonPairs)}`);

const relationFor = (groupId) => relations.find((item) => item.groupId === groupId);
const batch = {
  schema: "https://foxue.ai/schemas/cbeta-controlled-batch-v1.0",
  version,
  publishedAt: "2026-08-14",
  baseCatalog: baseCatalogPath,
  inventory: inventoryPath,
  rightsCategory: "Individually reviewed CBETA TEI files in Taishō volumes T01–T26; T26 source-record closure",
  workOverrides: {
    "gbcr:work:saddharma-pundarika-t0262": { bibliographicRelations: [relationFor("lotus-upadesa-t1519-t1520")] },
    "gbcr:work:dasabhumi": { bibliographicRelations: [relationFor("dasabhumi-commentaries-t1521-t1522")] },
    "gbcr:work:kashyapa-parivarta": { bibliographicRelations: [relationFor("kasyapaparivarta-t0352-t1523")] },
    "gbcr:work:larger-sukhavati-vyuha-t0360": { bibliographicRelations: [relationFor("larger-sukhavati-t1524")] },
    "gbcr:work:taisho-t0349": { bibliographicRelations: [relationFor("maitreya-vow-t0349-t1525")] },
    "gbcr:work:mahaparinirvana-t0374": { bibliographicRelations: [relationFor("mahaparinirvana-commentaries-t1527-t1528")] },
    "gbcr:work:taisho-t0389": { bibliographicRelations: [relationFor("bequeathed-teaching-t0389-t1529")] },
    "gbcr:work:taisho-t0680": { bibliographicRelations: [relationFor("buddhabhumi-t0680-t1530")] },
    "gbcr:work:gaya-sirsa-sutra": { bibliographicRelations: [relationFor("gaya-sirsa-t0464-t1531")] },
    "gbcr:work:brahma-visesa-cinti-pariprccha": { bibliographicRelations: [relationFor("brahma-visesa-cinti-t1532")] },
    "gbcr:work:taisho-t0109": { bibliographicRelations: [relationFor("dharmacakra-t1533")] },
    "gbcr:work:taisho-t0110": { bibliographicRelations: [relationFor("dharmacakra-t1533")] },
    "gbcr:work:taisho-t0774": { bibliographicRelations: [relationFor("mahayana-four-dharmas-t0774-t1535")] },
  },
  fileOverrides: {},
  collection: {
    id: "CBETA-TAISHO-T26",
    title: "大正藏 T26 释经论与毘昙部固定来源记录",
    sourceRecordDenominator: 26,
    previouslyControlledSourceRecords: 0,
    newSourceRecords: files.length,
    controlledSourceRecords: files.length,
    newSourceBytes: files.reduce((sum, file) => sum + file.upstreamBytes, 0),
    newStableSegments: files.reduce((sum, file) => sum + file.verification.segments, 0),
    newFolios: files.reduce((sum, file) => sum + file.verification.folios, 0),
    verifiedSameWorkExpressions: files.filter((file) => file.workIdentityStatus === "verified_same_work_expression").length,
    verifiedEditionWitnesses: files.filter((file) => file.workIdentityStatus === "verified_edition_witness").length,
    provisionalRecords: files.filter((file) => file.workIdentityStatus === "provisional_canon_record").length,
    newFullSourceTexts: files.filter((file) => file.completeness === "complete_source_file").length,
    newPartialSourceWitnesses: files.filter((file) => file.completeness !== "complete_source_file").length,
    relationAnnotatedRecords: files.filter((file) => file.bibliographicRelations?.length).length,
    attributionBoundaryRecords: files.filter((file) => file.sourceRole !== "translated_canonical_record").length,
    newWorks: new Set(files.map((file) => file.workId)).size,
    controlledWorks: new Set(files.map((file) => file.workId)).size,
    workCountingDecision: "T26 共 26 条完整固定来源记录。T1519/T1520、T1541/T1542、T1543/T1544 各确认为一个作品的两个汉译表达，共 3 个共享作品组；其余 20 条保持独立，共新增 23 个作品。T1521/T1522、T1527/T1528 虽共同解释同一根本经仍是不同论书。T1529、T1535、T1537 的来源或作者争议单独公开。",
  },
  boundaryAudit: {
    status: "verified_source_integrity_work_expression_commentary_recension_and_attribution_boundaries_recorded",
    existingControlledRecords: [],
    editionOrRecensionGroups: ["jnanaprasthana-t1543-t1544"],
    verifiedTranslationGroups: ["lotus-upadesa-t1519-t1520", "prakaranapada-t1541-t1542", "jnanaprasthana-t1543-t1544"],
    rootTextCommentaryGroups: [
      "lotus-upadesa-t1519-t1520", "dasabhumi-commentaries-t1521-t1522", "kasyapaparivarta-t0352-t1523",
      "larger-sukhavati-t1524", "maitreya-vow-t0349-t1525", "ratnacuda-four-dharmas-t1526",
      "mahaparinirvana-commentaries-t1527-t1528", "bequeathed-teaching-t0389-t1529", "buddhabhumi-t0680-t1530",
      "gaya-sirsa-t0464-t1531", "brahma-visesa-cinti-t1532", "dharmacakra-t1533", "three-completions-t1534",
      "mahayana-four-dharmas-t0774-t1535",
    ],
    candidateRelationsNotMerged: ["dasabhumi-commentaries-t1521-t1522", "dharmacakra-t1533", "sarvastivada-six-feet-and-body-t1536-t1544"],
    partialWorkWitnesses: [],
    sourceRoles: Object.fromEntries([...new Set(files.map((file) => file.sourceRole))].sort().map((role) => [role, files.filter((file) => file.sourceRole === role).map((file) => file.id)])),
    textualComparison: {
      algorithm: "Unicode text from stable reading lines; punctuation/space removed; unique character 5-gram containment and Jaccard. Machine comparison documents translation, recension and embedded-root evidence; low overlap does not negate authority-supported same-work translations, and high overlap never decides work identity alone.",
      pairs: comparisonPairs,
    },
    authoritySources: [
      "https://github.com/cbeta-org/xml-p5/tree/2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9/T/T26",
      "https://www.gaya.org.tw/library/manage/guide/genrule.pdf",
      "https://dazangthings.nz/cbc/text/918/",
      "https://buddhism.lib.ntu.edu.tw/DLMBS/en/search/search_detail.jsp?seq=669123",
      "https://www.fuyan.org.tw/download/journal/fbs/FBS_vol17-1.pdf",
      "https://dazangthings.nz/cbc/text/914/",
      "https://authority.dila.edu.tw/catalog/search.php?code=CA0002775",
      "https://deerpark.app/cbeta/T1535",
      "https://authority.dila.edu.tw/catalog/search.php?code=CA0000244",
      "https://deerpark.app/cbeta/T1526",
      "https://kabc.dongguk.edu/content/pop_seoji?dataId=ABC_IT_K0568",
      "https://buddhism.lib.ntu.edu.tw/FULLTEXT/JR-AN/an122300.pdf",
    ],
    caveat: "T26 是释经论与毘昙部，不是单纯佛说经集合。平台完整保存固定来源和传统题记，同时区分根本经、论书、同本异译、异传、后期历史分类、无署名汉地释文和争议作者。任何论书都不因大藏经位置、传统题记、题名或机器相似度而被标成佛陀逐字亲说。",
  },
  files,
};

if (
  batch.collection.newSourceRecords !== 26 ||
  batch.collection.newSourceBytes !== 14495358 ||
  batch.collection.newStableSegments !== 88216 ||
  batch.collection.newFolios !== 3213 ||
  batch.collection.verifiedSameWorkExpressions !== 6 ||
  batch.collection.verifiedEditionWitnesses !== 0 ||
  batch.collection.provisionalRecords !== 20 ||
  batch.collection.newFullSourceTexts !== 26 ||
  batch.collection.newPartialSourceWitnesses !== 0 ||
  batch.collection.relationAnnotatedRecords !== 26 ||
  batch.collection.attributionBoundaryRecords !== 26 ||
  batch.collection.newWorks !== 23
) throw new Error(`T26 关系、归属或作品边界统计漂移：${JSON.stringify(batch.collection)}`);

await writeFile(resolve(root, `data/corpus/cbeta/batch-v${version}.json`), `${JSON.stringify(batch, null, 2)}\n`, "utf8");
console.log(`CBETA T26 审计完成：26/26 个固定来源记录；新增 ${batch.collection.newWorks} 个作品、${batch.collection.newSourceRecords} 个表达、${batch.collection.newStableSegments} 个稳定行段。`);

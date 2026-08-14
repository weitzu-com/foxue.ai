import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { buildPageNavigation, parseCbetaReadingLines } from "../src/lib/cbeta-tei.mjs";

const root = process.cwd();
const version = "3.2.0";
const expectedCommit = "2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9";
const sourceArgument = process.argv.find((argument) => argument.startsWith("--source-dir="));
if (!sourceArgument) {
  console.error("用法：node scripts/audit-cbeta-t25.mjs --source-dir=/固定提交的/xml-p5");
  process.exit(1);
}
const sourceRoot = resolve(sourceArgument.slice("--source-dir=".length));
const actualCommit = execFileSync("git", ["-C", sourceRoot, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (actualCommit !== expectedCommit) throw new Error(`上游工作树必须固定到 ${expectedCommit}`);

const inventoryPath = "data/gbcr/cbeta-taisho-t25-inventory-v0.1.0.json";
const inventory = JSON.parse(await readFile(resolve(root, inventoryPath), "utf8"));
const baseCatalogPath = "data/corpus/cbeta/catalog-v3.1.0.json";
const baseCatalog = JSON.parse(await readFile(resolve(root, baseCatalogPath), "utf8"));
const sourceUnits = (file) => file.sourceParts ?? [file];
const controlledPaths = new Set(baseCatalog.files.flatMap(sourceUnits).map((file) => file.upstreamPath));
const candidates = inventory.records.filter((record) => !controlledPaths.has(record.upstreamPath));
if (inventory.totals.records !== 15 || inventory.totals.upstreamBytes !== 20558857 || candidates.length !== 15) {
  throw new Error(`T25 固定来源分母或新增记录漂移：${inventory.totals.records}/${candidates.length}`);
}

const relation = (type, groupId, label, evidence, ids) => ({
  type, groupId, label, evidence, externalIds: { cbeta: ids },
});
const relations = [
  relation(
    "same_work_translation_group_verified",
    "tridharmakasastra-t1505-t1506",
    "Tridharmakaśāstra／《三法度论》汉译组",
    "大正藏把 T1505 与 T1506 互列为对应文本；目录学与佛教文献研究明确称二者为同本异译。平台共享一个作品实体，保留《四阿鋡暮抄解》二卷与《三法度论》三卷的译者、结构和措辞差异。",
    ["T1505", "T1506"],
  ),
  relation(
    "agama_exegesis_family_candidate_unmerged",
    "agama-exegesis-t1505-t1508",
    "阿含论释与口解文本家族",
    "T1505–T1508 均解释阿含、三法或十二因缘，但只有 T1505/T1506 有同本异译证据；T1507《分别功德论》与 T1508《阿含口解十二因缘经》保持独立作品，不因目录邻接或题材相近归并。",
    ["T1505", "T1506", "T1507", "T1508"],
  ),
  relation(
    "root_sutra_commentary_relation_verified",
    "maha-prajnaparamita-t0223-t1509",
    "《摩诃般若波罗蜜经》与《大智度论》经论关系",
    "大正藏在 T1509 题首明确标注参照 T0223；《大智度论》是对大品般若传统的巨型论释。平台把根本经与论书连接，但绝不把论书计作佛陀逐字亲说经文；龙树传统归属与罗什参与程度另行保留争议。",
    ["T0223", "T1509"],
  ),
  relation(
    "same_work_edition_or_recension_group_verified",
    "asanga-vajracchedika-commentary-t1510a-b",
    "无著《金刚般若论》T1510 a/b 异本见证",
    "T1510a/b 共享基础经号、无著造与达磨笈多译题记；大正藏校勘记称二卷丽本与宋元明三卷本相当而内容大异。平台共享一个作品实体，同时保留两套卷次与异文系统为不同传本见证。",
    ["T1510a", "T1510b"],
  ),
  relation(
    "same_work_translation_group_verified",
    "vasubandhu-vajracchedika-commentary-t1511-t1513",
    "世亲《金刚般若论释》汉译组",
    "大正藏把 T1511 与 T1513 互列；佛教文献研究明确指出菩提流支译《论》与义净译《论释》为同本异译。平台共享一个世亲论释作品实体，保留两种汉译表达。",
    ["T1511", "T1513"],
  ),
  relation(
    "embedded_root_text_commentary_relation_verified",
    "asanga-verses-vasubandhu-commentary-t1513-t1514",
    "无著论颂与世亲论释根本颂—复注关系",
    "T1513 题记明确为无著造颂、世亲释，T1514 为同一义净译系的独立论颂；五字片段比较显示独立论颂约 73.0% 可在论释中定位。平台把根本颂与复注分成两个作品，并记录内嵌关系。",
    ["T1513", "T1514"],
  ),
  relation(
    "sutra_exegesis_family_candidate_unmerged",
    "vajracchedika-exegesis-t0235-t1515",
    "Vajracchedikā／《金刚经》印度论释家族",
    "T1510a/b、T1511、T1512、T1513、T1514、T1515 均围绕《金刚经》形成根本颂、论、释与复注层；共同所释经典不等于同一论书，平台连接到 T0235–T0239 汉译组而不合并各论作品。",
    ["T0235", "T0236a", "T0236b", "T0237", "T0238", "T0239", "T1510a", "T1510b", "T1511", "T1512", "T1513", "T1514", "T1515"],
  ),
  relation(
    "embedded_root_text_commentary_relation_verified",
    "prajnaparamita-samgraha-t1517-t1518",
    "《佛母般若圆集要义论》根本论与释论关系",
    "T1517 题记明确由三宝尊解释大域龙所造本论，且大正藏与经录互列 T1517/T1518；五字片段比较显示 T1518 根本文本约 77.8% 可在 T1517 释论中定位。平台保持根本论与释论两个作品。",
    ["T1517", "T1518"],
  ),
];
const relationsByCanonId = new Map();
for (const item of relations) {
  for (const id of item.externalIds.cbeta) {
    relationsByCanonId.set(id, [...(relationsByCanonId.get(id) ?? []), item]);
  }
}

const identityGroups = new Map([
  ["T1505", { workId: "gbcr:work:tridharmakasastra", status: "verified_same_work_expression", canonicalTitle: "三法度论（Tridharmakaśāstra）" }],
  ["T1506", { workId: "gbcr:work:tridharmakasastra", status: "verified_same_work_expression", canonicalTitle: "三法度论（Tridharmakaśāstra）" }],
  ["T1510a", { workId: "gbcr:work:asanga-vajracchedika-commentary", status: "verified_edition_witness", canonicalTitle: "金刚般若论（无著释本）" }],
  ["T1510b", { workId: "gbcr:work:asanga-vajracchedika-commentary", status: "verified_edition_witness", canonicalTitle: "金刚般若论（无著释本）" }],
  ["T1511", { workId: "gbcr:work:vasubandhu-vajracchedika-commentary", status: "verified_same_work_expression", canonicalTitle: "金刚般若论释（世亲释）" }],
  ["T1513", { workId: "gbcr:work:vasubandhu-vajracchedika-commentary", status: "verified_same_work_expression", canonicalTitle: "金刚般若论释（世亲释）" }],
]);
const lostTranslation = new Set(["T1507"]);
const unnamedAuthor = new Set(["T1506", "T1508"]);
const contestedAuthorship = new Set(["T1509"]);
const contestedOrigin = new Set(["T1512"]);

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
  if (lostTranslation.has(canonId)) return {
    sourceRole: "lost_translation_exegetical_treatise",
    label: "失译；附后汉录",
    summary: "目录仅保留失译与经录归属，平台不补造作者、译者或印度原本；",
  };
  if (unnamedAuthor.has(canonId)) return {
    sourceRole: "translated_exegetical_treatise_without_named_author",
    label: author.replace(/\s+/g, " · "),
    summary: "题记保存译者但未载论书作者，平台不从相邻文本补造作者；",
  };
  if (contestedAuthorship.has(canonId)) return {
    sourceRole: "traditional_attributed_exegetical_treatise_with_contested_authorship",
    label: author.replace(/\s+/g, " · "),
    summary: "目录保存龙树造、鸠摩罗什译的传统题记，同时公开现代研究对作者及罗什参与程度的争论；",
  };
  if (contestedOrigin.has(canonId)) return {
    sourceRole: "traditional_attributed_exegetical_treatise_with_contested_origin",
    label: author.replace(/\s+/g, " · "),
    summary: "目录保存世亲造、金刚仙释、菩提流支译的传统题记，同时保留古代经疏已见的非印度原作质疑；",
  };
  return {
    sourceRole: "authored_exegetical_treatise_with_translation",
    label: author.replace(/\s+/g, " · "),
    summary: "题记分开保存论书作者、释者与汉译责任，不把论师撰述扩张成佛陀逐字亲说；",
  };
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
  files.push({
    id: canonId,
    slug: `taisho-${canonId.toLowerCase()}`,
    workId: identity.workId,
    workIdentityStatus: identity.status,
    ...(identity.canonicalTitle ? { workTitle: identity.canonicalTitle } : {}),
    sourceRole: attribution.sourceRole,
    bibliographicRelations: relationsByCanonId.get(canonId),
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
      tradition: "漢傳佛教 · 釋經論部",
      language: "漢文",
      canonRef: `大正藏 T25, no. ${displayNumber(canonId)}`,
      translator: attribution.label,
      summary: `${extent}。本站完整保存 ${canonId} 固定 CBETA TEI 来源记录与可校验页栏行锚点；${attribution.summary}物理记录、作品、译本、传本与根本经论关系分层计数。`,
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
  ["T1505", "T1506"], ["T1510a", "T1510b"], ["T1511", "T1513"], ["T1513", "T1514"],
  ["T1511", "T1512"], ["T1517", "T1518"], ["T1510a", "T1514"], ["T1510b", "T1514"],
].map(([left, right]) => compareBodies(left, right));
const comparisonByPair = new Map(comparisonPairs.map((item) => [item.pair.join("/"), item]));
if (
  comparisonByPair.get("T1510a/T1510b").fiveGramContainmentOfShorter < 0.70 ||
  comparisonByPair.get("T1513/T1514").fiveGramContainmentOfShorter < 0.72 ||
  comparisonByPair.get("T1517/T1518").fiveGramContainmentOfShorter < 0.77 ||
  comparisonByPair.get("T1511/T1512").fiveGramContainmentOfShorter < 0.27 ||
  comparisonByPair.get("T1505/T1506").fiveGramContainmentOfShorter > 0.03 ||
  comparisonByPair.get("T1511/T1513").fiveGramContainmentOfShorter > 0.03
) throw new Error("T25 异译、异本、根本颂或复注正文比较漂移");

const relationForRootWork = (groupId) => relations.find((item) => item.groupId === groupId);
const batch = {
  schema: "https://foxue.ai/schemas/cbeta-controlled-batch-v1.0",
  version,
  publishedAt: "2026-08-14",
  baseCatalog: baseCatalogPath,
  inventory: inventoryPath,
  rightsCategory: "Individually reviewed CBETA TEI files in Taishō volumes T01–T25; T25 source-record closure",
  workOverrides: {
    "gbcr:work:maha-prajnaparamita-t0223": {
      bibliographicRelations: [relationForRootWork("maha-prajnaparamita-t0223-t1509")],
    },
    "gbcr:work:vajracchedika-prajnaparamita": {
      bibliographicRelations: [relationForRootWork("vajracchedika-exegesis-t0235-t1515")],
    },
  },
  fileOverrides: {},
  collection: {
    id: "CBETA-TAISHO-T25",
    title: "大正藏 T25 释经论部固定来源记录",
    sourceRecordDenominator: 15,
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
    workCountingDecision: "T25 共 15 条固定来源记录。T1505/T1506 与 T1511/T1513 各确认为同一作品的两个汉译表达，T1510a/b 确认为同一无著论书的两个传本见证；其余 9 条保持独立书目实体，共新增 12 个作品。T1513/T1514、T1517/T1518 分别按根本颂—复注关系保留两个作品；T1509、T1512 的传统作者归属不冒充现代定论。",
  },
  boundaryAudit: {
    status: "verified_source_integrity_work_expression_witness_commentary_authorship_and_embedded_root_boundaries_recorded",
    existingControlledRecords: [],
    editionOrRecensionGroups: ["asanga-vajracchedika-commentary-t1510a-b"],
    verifiedTranslationGroups: ["tridharmakasastra-t1505-t1506", "vasubandhu-vajracchedika-commentary-t1511-t1513"],
    rootTextCommentaryGroups: ["maha-prajnaparamita-t0223-t1509", "asanga-verses-vasubandhu-commentary-t1513-t1514", "prajnaparamita-samgraha-t1517-t1518"],
    candidateRelationsNotMerged: ["agama-exegesis-t1505-t1508", "vajracchedika-exegesis-t0235-t1515"],
    partialWorkWitnesses: [],
    authoredTreatises: files.filter((file) => file.sourceRole === "authored_exegetical_treatise_with_translation").map((file) => file.id),
    translatedTreatisesWithoutNamedAuthor: files.filter((file) => file.sourceRole === "translated_exegetical_treatise_without_named_author").map((file) => file.id),
    lostTranslationTreatises: files.filter((file) => file.sourceRole === "lost_translation_exegetical_treatise").map((file) => file.id),
    contestedAuthorshipTreatises: files.filter((file) => file.sourceRole === "traditional_attributed_exegetical_treatise_with_contested_authorship").map((file) => file.id),
    contestedOriginTreatises: files.filter((file) => file.sourceRole === "traditional_attributed_exegetical_treatise_with_contested_origin").map((file) => file.id),
    textualComparison: {
      algorithm: "Unicode text from stable reading lines; punctuation/space removed; unique character 5-gram containment and Jaccard. Machine comparison documents recension, embedded root text and exegesis evidence; low lexical overlap does not negate authority-supported same-work translations, and high overlap never decides work identity alone.",
      pairs: comparisonPairs,
    },
    authoritySources: [
      "https://github.com/cbeta-org/xml-p5/tree/2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9/T/T25",
      "https://cbetaonline.dila.edu.tw/zh/T1505_001",
      "https://cbetaonline.dila.edu.tw/zh/T1506_001",
      "https://cbetaonline.dila.edu.tw/zh/T1509_001",
      "https://cbetaonline.dila.edu.tw/zh/T1510a_001",
      "https://cbetaonline.dila.edu.tw/zh/T1510b_001",
      "https://authority.dila.edu.tw/catalog/search.php?code=CA0001762",
      "https://www.chibs.edu.tw/ch_html/hkbj/05/hkbj0504.htm",
      "https://cir.nii.ac.jp/crid/1390009224880757632",
      "https://cbetaonline.dila.edu.tw/zh/T1517_001",
      "https://cbetaonline.dila.edu.tw/zh/T1518_001",
    ],
    caveat: "T25 是释经论部，不是单纯佛说经集合。平台完整保存固定来源及传统题记，同时区分根本经、论颂、论释、复注、同本异译和传本见证；《大智度论》《金刚仙论》的传统作者归属与现代争论并列呈现。任何论书都不因大藏经位置、题名、传统作者或机器相似度而被标成佛陀逐字亲说。",
  },
  files,
};

if (
  batch.collection.newSourceRecords !== 15 ||
  batch.collection.newSourceBytes !== 20558857 ||
  batch.collection.newStableSegments !== 77880 ||
  batch.collection.newFolios !== 2816 ||
  batch.collection.verifiedSameWorkExpressions !== 4 ||
  batch.collection.verifiedEditionWitnesses !== 2 ||
  batch.collection.provisionalRecords !== 9 ||
  batch.collection.newFullSourceTexts !== 15 ||
  batch.collection.newPartialSourceWitnesses !== 0 ||
  batch.collection.relationAnnotatedRecords !== 14 ||
  batch.collection.attributionBoundaryRecords !== 15 ||
  batch.collection.newWorks !== 12
) throw new Error(`T25 关系、归属或作品边界统计漂移：${JSON.stringify(batch.collection)}`);

await writeFile(resolve(root, `data/corpus/cbeta/batch-v${version}.json`), `${JSON.stringify(batch, null, 2)}\n`, "utf8");
console.log(`CBETA T25 审计完成：15/15 个固定来源记录；新增 ${batch.collection.newWorks} 个作品、${batch.collection.newSourceRecords} 个表达或见证、${batch.collection.newStableSegments} 个稳定行段。`);

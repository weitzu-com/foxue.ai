import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { buildPageNavigation, parseCbetaReadingLines } from "../src/lib/cbeta-tei.mjs";

const root = process.cwd();
const version = "4.20.0";
const expectedCommit = "2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9";
const sourceArgument = process.argv.find((argument) => argument.startsWith("--source-dir="));
if (!sourceArgument) {
  console.error("用法：node scripts/audit-cbeta-t53.mjs --source-dir=/固定提交的/xml-p5");
  process.exit(1);
}
const sourceRoot = resolve(sourceArgument.slice("--source-dir=".length));
const actualCommit = execFileSync("git", ["-C", sourceRoot, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (actualCommit !== expectedCommit) throw new Error(`上游工作树必须固定到 ${expectedCommit}`);

const inventoryPath = "data/gbcr/cbeta-taisho-t53-inventory-v0.1.0.json";
const inventory = JSON.parse(await readFile(resolve(root, inventoryPath), "utf8"));
const baseCatalogPath = "data/corpus/cbeta/catalog-v4.19.0.json";
const baseCatalog = JSON.parse(await readFile(resolve(root, baseCatalogPath), "utf8"));
const sourceUnits = (file) => file.sourceParts ?? [file];
const controlledPaths = new Set(baseCatalog.files.flatMap(sourceUnits).map((file) => file.upstreamPath));
const candidates = inventory.records.filter((record) => !controlledPaths.has(record.upstreamPath));
if (inventory.totals.records !== 2 || inventory.totals.upstreamBytes !== 23150439 || candidates.length !== 2) {
  throw new Error(`T53 固定来源分母或新增记录漂移：${inventory.totals.records}/${candidates.length}`);
}

const relation = (type, groupId, label, evidence, ids) => ({
  type,
  groupId,
  label,
  evidence,
  externalIds: { cbeta: ids },
});
const relationGroups = [
  relation(
    "buddhist_encyclopedic_compendia_distinct",
    "buddhist-encyclopedic-compendia-t2121-t2122",
    "《经律异相》与《法苑珠林》佛教类书作品边界",
    "T2121 是梁代五十卷经律分类摘编，T2122 是唐代一百卷佛教类书；二者编纂时代、责任、分类结构、篇目范围、卷数及 DILA/CBC 作品入口均不同。共同的佛教事汇文类、主题或引文不能构成同一作品或同一表达。",
    ["T2121", "T2122"],
  ),
  relation(
    "quoted_canonical_source_reuse_distinct",
    "t53-compendia-quotation-source-reuse-t2121-t2122",
    "两部类书共同引文与材料复用边界",
    "稳定阅读行去标点后，T2121/T2122 唯一五字组对较短文本的包含度为 0.110043、Jaccard 为 0.030456，符合两部类书共享经律论、史传、故事与表达的事实。机器重叠只登记为可复核的引文或材料复用，不消除两个独立作品号、编纂范围与时代。",
    ["T2121", "T2122"],
  ),
  relation(
    "compiler_and_quoted_source_responsibility_layered",
    "t53-compilers-and-quoted-source-authors-layered",
    "类书编纂责任与所引原典责任分层",
    "T2121 与 T2122 都汇集大量既有原典、目录材料和叙事。僧旻、宝唱等的编集责任与道世的撰述责任属于类书层；所引经、律、论及史传的译者、作者和传统归属仍属于被引作品层，不能把编者视为全部引文作者，也不能把类书全文标成佛陀逐字亲说。",
    ["T2121", "T2122"],
  ),
  relation(
    "responsibility_label_variation_same_work",
    "jinglu-yixiang-responsibility-labels-t2121",
    "《经律异相》责任标签差异并列保存",
    "固定 TEI 头部写“梁 宝唱等集”，正文各卷 byline 与 CBC 入口写“梁沙门僧旻宝唱等集”；DILA 主责任列宝唱（集），其高丽藏说明又并列僧旻、宝唱等。差异属于同一 T2121 表达的目录与正文责任证据，不能删去僧旻，也不能凭单一标签拆成两个作品。",
    ["T2121"],
  ),
  relation(
    "completion_date_evidence_variation_same_work",
    "jinglu-yixiang-completion-date-evidence-t2121",
    "《经律异相》完成年代证据差异",
    "DILA 目录记录梁天监十五年（516），CBC 收录的 Palumbo 研究判断为 517 或稍后。平台保留两条来源和各自证据层级，不把目录年代与现代研究判断伪装为无争议的单一日期。",
    ["T2121"],
  ),
];

const authorityIds = { T2121: "CA0001817", T2122: "CA0000954" };
const cbcTextIds = { T2121: 66, T2122: 65 };
if (
  Object.keys(authorityIds).length !== 2 || new Set(Object.values(authorityIds)).size !== 2 ||
  Object.keys(cbcTextIds).length !== 2 || new Set(Object.values(cbcTextIds)).size !== 2
) throw new Error("T53 必须保留 2 个唯一 DILA 作品号与 2 个唯一 CBC 作品入口");

const sourceRoles = {
  T2121: "liang_buddhist_sutra_vinaya_excerpt_compendium",
  T2122: "tang_buddhist_encyclopedic_compendium",
};
const statusById = {
  T2121: "verified_distinct_compilation_with_responsibility_and_date_evidence_variation",
  T2122: "verified_distinct_authored_buddhist_encyclopedic_compendium",
};
const responsibilityEvidence = {
  T2121: {
    teiHeader: "梁 寶唱等集",
    textByline: "梁沙門僧旻寶唱等集",
    dila: "寶唱（集）；高丽藏说明另载僧旻、宝唱等编集",
    cbc: "梁沙門僧旻寶唱等集",
  },
  T2122: {
    teiHeader: "唐 道世撰",
    textByline: "西明寺沙門釋道世撰",
    dila: "道世（撰）",
    cbc: "当前 T2122 入口未列人物断言",
  },
};

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
  const author = stripXml(required(text.match(/<author>([\s\S]*?)<\/author>/)?.[1], "责任题记", record.sourceRecordId));
  const extent = required(text.match(/<extent>([^<]+)<\/extent>/)?.[1], "卷数", record.sourceRecordId);
  const canonId = record.canonWitnessId;
  const relations = relationGroups.filter((group) => group.externalIds.cbeta.includes(canonId));
  if (!authorityIds[canonId] || !cbcTextIds[canonId] || relations.length === 0) {
    throw new Error(`${canonId} 缺少权威号、CBC 入口或关系裁决`);
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
    slug: `taisho-${canonId.toLowerCase()}`,
    workId: `gbcr:work:taisho-${canonId.toLowerCase()}-buddhist-encyclopedic-compendium`,
    workIdentityStatus: statusById[canonId],
    workTitle: title,
    sourceRole: sourceRoles[canonId],
    bibliographicRelations: relations,
    authorityIds: { dilaCatalog: authorityIds[canonId], cbcText: String(cbcTextIds[canonId]) },
    traditionalResponsibilityEvidence: responsibilityEvidence[canonId],
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
      tradition: "汉传佛教 · 佛教类书与事汇",
      language: "汉文",
      canonRef: `大正藏 T53, no. ${canonId.slice(1)}`,
      translator: author.replace(/\s+/g, " · "),
      summary: `${extent}。完整保存固定 CBETA TEI、校勘、责任题记与类书引文结构；作为独立佛教类书建模，不把所引原典与编者责任混合，也不标成佛陀逐字亲说。传统责任题记：${author}。`,
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
const leftText = normalizedBodies.get("T2121");
const rightText = normalizedBodies.get("T2122");
const left = grams(leftText);
const right = grams(rightText);
let shared = 0;
for (const value of left) if (right.has(value)) shared += 1;
const comparison = {
  pair: ["T2121", "T2122"],
  normalizedCharacters: [leftText.length, rightText.length],
  uniqueFiveGrams: [left.size, right.size],
  sharedFiveGrams: shared,
  fiveGramContainmentOfShorter: Number((shared / Math.min(left.size, right.size)).toFixed(6)),
  fiveGramJaccard: Number((shared / (left.size + right.size - shared)).toFixed(6)),
};
if (comparison.fiveGramContainmentOfShorter !== 0.110043 || comparison.fiveGramJaccard !== 0.030456) {
  throw new Error("T53 两部类书正文重叠证据漂移");
}

const roles = Object.fromEntries(Object.values(sourceRoles).sort().map((role) => [
  role,
  files.filter((file) => file.sourceRole === role).map((file) => file.id),
]));
const batchWorkIds = new Set(files.map((file) => file.workId));
const batch = {
  schema: "https://foxue.ai/schemas/cbeta-controlled-batch-v1.0",
  version,
  publishedAt: "2026-08-15",
  baseCatalog: baseCatalogPath,
  inventory: inventoryPath,
  rightsCategory: "Individually reviewed CBETA TEI files in Taishō volumes T01–T53; T53 source-record closure",
  workOverrides: {},
  fileOverrides: {},
  collection: {
    id: "CBETA-TAISHO-T53",
    title: "大正藏 T53《经律异相》与《法苑珠林》佛教类书固定来源记录",
    sourceRecordDenominator: 2,
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
    unsignedResponsibilityRecords: 0,
    lostTranslatorResponsibilityRecords: 0,
    newWorks: batchWorkIds.size,
    controlledWorks: batchWorkIds.size,
    workCountingDecision: "T53 的 2 份固定来源记录登记为 2 个完整表达和 2 个独立作品。DILA 返回 CA0001817/CA0000954 两个作品号，CBC 返回 66/65 两个入口；共同类书文类、所引原典、主题、故事与 0.110043 的五字组包含度只建立材料复用关系，不自动合并。T2121 的头部、正文、DILA 与 CBC 责任标签差异属于同一作品的证据层，不拆分作品。",
  },
  boundaryAudit: {
    status: "verified_source_integrity_encyclopedic_compendium_quotation_reuse_and_layered_responsibility_boundaries_recorded",
    existingControlledRecords: [],
    verifiedTranslationGroups: [],
    rootVinayaCommentaryGroups: [],
    rootTreatiseCommentaryGroups: [],
    rootEditionBoundaryGroups: [],
    editionOrRecensionGroups: [],
    subcommentaryGroups: [],
    sameNumberBoundaryGroups: [],
    layeredAttributionGroups: [
      "t53-compilers-and-quoted-source-authors-layered",
      "jinglu-yixiang-responsibility-labels-t2121",
    ],
    scopeBoundaryGroups: ["buddhist-encyclopedic-compendia-t2121-t2122"],
    continuationBoundaryGroups: [],
    sourceReuseBoundaryGroups: ["t53-compendia-quotation-source-reuse-t2121-t2122"],
    sameAuthorCompanionWorkGroups: [],
    crossVolumeRelationGroups: [],
    relatedDistinctWorkGroups: relationGroups.map((group) => group.groupId),
    candidateRelationsNotMerged: [
      "T2121/T2122 同为佛教类书但时代、责任、结构、卷数和两个权威作品入口不同，保持两部完整独立作品",
      "T2121/T2122 唯一五字组对较短文本包含度为 0.110043；共享引文、故事与分类材料只登记来源复用，不自动合并",
      "两部类书编者与所引经律论、史传原责任分层；类书不标成佛陀逐字亲说",
      "T2121 TEI 头部的宝唱等集与正文/CBC 的僧旻宝唱等集并列保存，不删人名也不拆作品",
      "T2121 的 516 目录年代与 CBC 收录研究的 517 或稍后判断并列保存，不伪造无争议单值",
    ],
    partialWorkWitnesses: [],
    editionWitnesses: [],
    sourceRoles: roles,
    textualComparison: {
      algorithm: "Unicode text from stable reading lines; punctuation/space removed; unique character 5-gram containment and Jaccard. Shared quotations and stories are evidence of source reuse; distinct DILA/CBC work entries, title, date, responsibility, structure and scope prevent automatic work merge.",
      pairs: [comparison],
    },
    authoritySources: [
      "https://github.com/cbeta-org/xml-p5/tree/2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9/T/T53",
      ...Object.values(authorityIds).map((code) => `https://authority.dila.edu.tw/catalog/search.php?code=${code}`),
      ...Object.values(cbcTextIds).map((id) => `https://dazangthings.nz/cbc/text/${id}/`),
    ],
    caveat: "T53 是两部东亚佛教类书，不是佛陀逐字亲说的单一经藏集合。平台完整保存固定 CBETA TEI、校勘、编纂责任与引文结构，同时分离类书、所引作品、责任证据和完成年代证据；共同题材、故事、引文、分类框架或机器相似度都不能单独证明作品相同。",
  },
  files,
};

if (
  files.length !== 2 || batchWorkIds.size !== 2 ||
  batch.collection.newSourceBytes !== 23150439 ||
  batch.collection.newStableSegments !== 88027 ||
  batch.collection.newFolios !== 3178 ||
  batch.collection.newJuans !== 150 ||
  batch.collection.verifiedEditionWitnesses !== 0 ||
  batch.collection.unsignedResponsibilityRecords !== 0 ||
  batch.collection.lostTranslatorResponsibilityRecords !== 0 ||
  batch.collection.relationAnnotatedRecords !== 2 ||
  new Set(batch.boundaryAudit.authoritySources).size !== 5
) throw new Error(`T53 来源、作品、权威、关系或责任计数漂移：${JSON.stringify(batch.collection)}`);

const outputPath = resolve(root, `data/corpus/cbeta/batch-v${version}.json`);
await writeFile(outputPath, `${JSON.stringify(batch, null, 2)}\n`, "utf8");
console.log(`CBETA T53 审计完成：${files.length}/${inventory.totals.records} 个固定来源记录；新增 ${batchWorkIds.size} 个作品与完整表达、${batch.collection.newStableSegments} 个稳定行段、${batch.collection.newFolios} 个版页单元、${batch.collection.newJuans} 卷。`);

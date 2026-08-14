import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { buildPageNavigation, parseCbetaReadingLines } from "../src/lib/cbeta-tei.mjs";

const root = process.cwd();
const version = "2.5.0";
const expectedCommit = "2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9";
const sourceArgument = process.argv.find((argument) => argument.startsWith("--source-dir="));
if (!sourceArgument) {
  console.error("用法：node scripts/audit-cbeta-t18.mjs --source-dir=/固定提交的/xml-p5");
  process.exit(1);
}
const sourceRoot = resolve(sourceArgument.slice("--source-dir=".length));
const actualCommit = execFileSync("git", ["-C", sourceRoot, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (actualCommit !== expectedCommit) throw new Error(`上游工作树必须固定到 ${expectedCommit}`);

const inventoryPath = "data/gbcr/cbeta-taisho-t18-inventory-v0.1.0.json";
const inventory = JSON.parse(await readFile(resolve(root, inventoryPath), "utf8"));
const baseCatalog = JSON.parse(await readFile(resolve(root, "data/corpus/cbeta/catalog-v2.4.0.json"), "utf8"));
const sourceUnits = (file) => file.sourceParts ?? [file];
const controlledPaths = new Set(baseCatalog.files.flatMap(sourceUnits).map((file) => file.upstreamPath));
const candidates = inventory.records.filter((record) => !controlledPaths.has(record.upstreamPath));
if (inventory.totals.records !== 76 || candidates.length !== 76) {
  throw new Error(`T18 固定来源分母或新增记录数漂移：${inventory.totals.records}/${candidates.length}`);
}
if (candidates.reduce((sum, record) => sum + record.upstreamBytes, 0) !== 23056368) {
  throw new Error("T18 新增来源字节数漂移");
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
    ids: ["T0852a", "T0852b"],
    workId: "gbcr:work:maha-vairocana-ritual-t0852",
    relation: relation(
      "same_work_edition_or_recension_group_verified",
      "t0852-edition-recension-witnesses",
      "大毘卢遮那胎藏仪轨 T0852 a/b 版本见证组",
      "两份固定记录共享大正藏基础经号 852，题名范围相合，正文五字片段对较短本的覆盖为 61.9%；作者题记与具体措辞差异作为版本/传承边界保留，不合并来源资产。",
      ["T0852a", "T0852b"],
    ),
  },
  {
    ids: ["T0893a", "T0893b", "T0893c"],
    workId: "gbcr:work:susiddhikara-sutra-t0893",
    relation: relation(
      "same_work_edition_or_recension_group_verified",
      "t0893-edition-recension-witnesses",
      "《苏悉地羯罗经》T0893 a/b/c 版本见证组",
      "三份固定记录共享大正藏基础经号 893、题名、译者和三卷范围；正文五字片段两两覆盖为 59.0%–70.4%，平台登记为同一作品的三个独立版本/传承见证。",
      ["T0893a", "T0893b", "T0893c"],
    ),
  },
  {
    ids: ["T0894a", "T0894b"],
    workId: "gbcr:work:susiddhikara-puja-t0894",
    relation: relation(
      "same_work_edition_or_recension_group_verified",
      "t0894-edition-recension-witnesses",
      "《苏悉地羯罗供养法》T0894 a/b 版本见证组",
      "两份固定记录共享大正藏基础经号 894、题名和译者；卷数与正文范围不同，五字片段覆盖为 37.4%，故只共享作品实体并保留为两个版本/传承表达。",
      ["T0894a", "T0894b"],
    ),
  },
  {
    ids: ["T0895a", "T0895b"],
    workId: "gbcr:work:subahu-pariprccha-t0895",
    relation: relation(
      "same_work_edition_or_recension_group_verified",
      "t0895-edition-recension-witnesses",
      "《苏婆呼童子请问经》T0895 a/b 版本见证组",
      "两份固定记录共享大正藏基础经号 895、题名和译者；三卷/二卷范围与正文差异保留，五字片段覆盖为 37.4%，不折叠来源或稳定锚点。",
      ["T0895a", "T0895b"],
    ),
  },
];
const candidateRelations = [
  relation(
    "text_family_or_component_candidate_unmerged",
    "sarvatathagata-tattvasamgraha-t0865-t0866-t0882",
    "《一切如来真实摄》文本家族与组件候选",
    "DILA 经录为 T0865、T0866、T0882 相互列出相关经典，T0882 并登记 Sarvatathāgatatattvasaṁgraha；三者篇幅与结构差异显著，未完成人工组件校勘前保持三个作品实体。",
    ["T0865", "T0866", "T0882"],
    { authorityUrl: "https://authority.dila.edu.tw/catalog/search.php?code=CA0003733" },
  ),
  relation(
    "homonymous_scope_conflict_candidate_unmerged",
    "homonymous-t0865-t0874",
    "T0865／T0874 同题异范围候选",
    "两条记录题名与译者完全相同，但卷数为三卷/二卷，规范化正文五字片段覆盖仅 2.2%、Jaccard 仅 0.9%；题名不足以证明作品等同，保留独立作品并公开范围冲突。",
    ["T0865", "T0874"],
  ),
  relation(
    "same_work_candidate_unmerged",
    "homa-ritual-t0908-t0909-candidate",
    "《金刚顶瑜伽护摩仪轨》T0908／T0909 候选",
    "DILA 经录让 T0908 与 T0909 互列相关经典；两条记录同题、同署不空译且五字片段覆盖为 40.1%，但底本与正文差异仍须人工校勘，暂不合并 Work。",
    ["T0908", "T0909"],
    { authorityUrl: "https://authority.dila.edu.tw/catalog/search.php?code=CA0001642" },
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

const partialWitnessIds = new Set(["T0863", "T0886"]);
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
  if (/[撰述集造說]$/.test(author)) {
    return { sourceRole: "attributed_authored_compiled_or_taught_esoteric_text", label: author.replace(/\s+/g, " · "), boundary: true };
  }
  return { sourceRole: "translated_esoteric_canonical_record", label: author.replace(/\s+/g, " · "), boundary: false };
};
const normalizedBodies = new Map();
const files = [];

for (const record of candidates) {
  // Read the immutable Git object instead of depending on the caller's sparse-checkout shape.
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
  if (numericJuans.some((juan) => !Number.isSafeInteger(juan) || juan < 1) || numericJuans.some((juan, index) => index > 0 && juan !== numericJuans[index - 1] + 1)) {
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
    ? "题名明确显示为某品或某教中的局部材料，完整保存来源文件但不冒充完整母作品；"
    : attribution.sourceRole === "translated_esoteric_canonical_record"
      ? "目录署为翻译，但密教部类位置不等于佛陀逐字亲说，作品归属与跨语种关系仍需逐项证据；"
      : attribution.sourceRole === "translation_attribution_unknown"
        ? "目录题记为失译，平台不补造译者、年代或印度来源；"
        : attribution.sourceRole === "unattributed_esoteric_text_or_ritual"
          ? "题记未载作者或译者，平台不把匿名仪轨自动改写为译经；"
          : "题记明确为撰、述、集、造或说，平台保留其编撰/传授角色，不改写成佛陀亲说；";
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
      canonRef: `大正藏 T18, no. ${displayNumber(canonId)}`,
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
  ["T0852a", "T0852b"],
  ["T0865", "T0874"],
  ["T0865", "T0882"],
  ["T0866", "T0882"],
  ["T0893a", "T0893b"],
  ["T0893a", "T0893c"],
  ["T0893b", "T0893c"],
  ["T0894a", "T0894b"],
  ["T0895a", "T0895b"],
  ["T0908", "T0909"],
].map(([left, right]) => compareBodies(left, right));
const comparisonByPair = new Map(comparisonPairs.map((item) => [item.pair.join("/"), item]));
if (
  comparisonByPair.get("T0852a/T0852b").fiveGramContainmentOfShorter < 0.6 ||
  comparisonByPair.get("T0893b/T0893c").fiveGramContainmentOfShorter < 0.7 ||
  comparisonByPair.get("T0865/T0874").fiveGramContainmentOfShorter > 0.03 ||
  comparisonByPair.get("T0908/T0909").fiveGramContainmentOfShorter < 0.39
) throw new Error("T18 高风险同题/版本正文比较漂移");

const batch = {
  schema: "https://foxue.ai/schemas/cbeta-controlled-batch-v1.0",
  version,
  publishedAt: "2026-08-14",
  baseCatalog: "data/corpus/cbeta/catalog-v2.4.0.json",
  inventory: inventoryPath,
  rightsCategory: "Individually reviewed CBETA TEI files in Taishō volumes T01–T18 plus T19n0945; T18 source-record closure",
  workOverrides: {},
  collection: {
    id: "CBETA-TAISHO-T18",
    title: "大正藏 T18 密教部固定来源记录",
    sourceRecordDenominator: 76,
    previouslyControlledSourceRecords: 0,
    newSourceRecords: files.length,
    controlledSourceRecords: files.length,
    newSourceBytes: files.reduce((sum, file) => sum + file.upstreamBytes, 0),
    newStableSegments: files.reduce((sum, file) => sum + file.verification.segments, 0),
    newFolios: files.reduce((sum, file) => sum + file.verification.folios, 0),
    verifiedSameWorkExpressions: 0,
    verifiedEditionWitnesses: files.filter((file) => file.workIdentityStatus === "verified_edition_witness").length,
    provisionalRecords: files.filter((file) => file.workIdentityStatus === "provisional_canon_record").length,
    fullSourceTexts: files.filter((file) => file.completeness === "complete_source_file").length,
    partialSourceWitnesses: files.filter((file) => file.completeness === "complete_source_file_partial_work_witness").length,
    relationAnnotatedRecords: files.filter((file) => file.bibliographicRelations?.length).length,
    attributionBoundaryRecords: files.filter((file) => classifyAttribution(
      file.presentation.translator === "题记未载作者／译者" ? "" : file.presentation.translator.replace(/ · /g, " "),
    ).boundary).length,
    newWorks: 71,
    workCountingDecision: "T18 共 76 条固定来源记录。9 条 a/b/c 记录按同一大正藏基础经号、题名、署名与正文主干归入 4 个作品并保留为独立版本/传承见证；其余 67 条暂按书目实体登记，共新增 71 个作品。T0865/T0866/T0882、同题异范围 T0865/T0874 与 T0908/T0909 只建立候选关系，不自动归并。",
  },
  boundaryAudit: {
    status: "verified_source_integrity_edition_groups_attribution_partial_witness_and_homonymous_scope_boundaries_recorded",
    editionOrRecensionGroups: editionGroups.map((item) => item.relation.groupId),
    candidateRelationsNotMerged: candidateRelations.map((item) => item.groupId),
    partialWorkWitnesses: [...partialWitnessIds],
    translatedRecords: files.filter((file) => file.sourceRole === "translated_esoteric_canonical_record").map((file) => file.id),
    unattributedRecords: files.filter((file) => file.sourceRole === "unattributed_esoteric_text_or_ritual").map((file) => file.id),
    lostTranslatorRecords: files.filter((file) => file.sourceRole === "translation_attribution_unknown").map((file) => file.id),
    attributedAuthoredCompiledOrTaughtRecords: files.filter((file) => file.sourceRole === "attributed_authored_compiled_or_taught_esoteric_text").map((file) => file.id),
    textualComparison: {
      algorithm: "Unicode text from stable reading lines; punctuation/space removed; unique character 5-gram containment and Jaccard. Machine comparison is evidence, not a work-identity verdict.",
      pairs: comparisonPairs,
    },
    authoritySources: [
      "https://authority.dila.edu.tw/catalog/search.php?code=CA0003733",
      "https://authority.dila.edu.tw/catalog/search.php?code=CA0001642",
      "https://github.com/cbeta-org/xml-p5/tree/2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9/T/T18",
    ],
    caveat: "T18 的目录部类同时容纳译经、仪轨、念诵法、撰述、辑录、失译与版本见证。平台完整保存固定来源，但不把部类位置、佛说式题名、同题或相似片段单独当成佛陀亲说或同一作品的证明。",
  },
  files,
};

if (
  batch.collection.newSourceRecords !== 76 ||
  batch.collection.newSourceBytes !== 23056368 ||
  batch.collection.newStableSegments !== 77825 ||
  batch.collection.verifiedEditionWitnesses !== 9 ||
  batch.collection.provisionalRecords !== 67 ||
  batch.collection.fullSourceTexts !== 74 ||
  batch.collection.partialSourceWitnesses !== 2 ||
  batch.collection.relationAnnotatedRecords !== 15 ||
  batch.collection.attributionBoundaryRecords !== 25 ||
  batch.collection.newWorks !== 71
) throw new Error(`T18 关系、归属或作品边界统计漂移：${JSON.stringify(batch.collection)}`);

await writeFile(resolve(root, `data/corpus/cbeta/batch-v${version}.json`), `${JSON.stringify(batch, null, 2)}\n`, "utf8");
console.log(`CBETA T18 审计完成：76/76 个固定来源记录；新增 71 个作品、76 个表达或见证、${batch.collection.newStableSegments} 个稳定行段。`);

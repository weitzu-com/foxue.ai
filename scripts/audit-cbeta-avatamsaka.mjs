import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { buildPageNavigation, parseCbetaReadingLines } from "../src/lib/cbeta-tei.mjs";

const root = process.cwd();
const version = "1.7.0";
const expectedCommit = "2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9";
const sourceArgument = process.argv.find((argument) => argument.startsWith("--source-dir="));
if (!sourceArgument) {
  console.error("用法：node scripts/audit-cbeta-avatamsaka.mjs --source-dir=/固定提交的/xml-p5");
  process.exit(1);
}
const sourceRoot = resolve(sourceArgument.slice("--source-dir=".length));
const actualCommit = execFileSync("git", ["-C", sourceRoot, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (actualCommit !== expectedCommit) throw new Error(`上游工作树必须固定到 ${expectedCommit}`);

const inventory = JSON.parse(await readFile(resolve(root, "data/gbcr/cbeta-taisho-sutra-inventory-v0.2.1.json"), "utf8"));
const baseCatalog = JSON.parse(await readFile(resolve(root, "data/corpus/cbeta/catalog-v1.6.0.json"), "utf8"));
const sourceUnits = (file) => file.sourceParts ?? [file];
const controlledPaths = new Set(baseCatalog.files.flatMap(sourceUnits).map((file) => file.upstreamPath));
const volumeRecords = inventory.records.filter((record) => record.volume === "T10");
const candidates = volumeRecords.filter((record) => !controlledPaths.has(record.upstreamPath));
if (volumeRecords.length !== 31) throw new Error(`T10 固定来源分母应为 31，实际为 ${volumeRecords.length}`);
if (candidates.length !== 30) throw new Error(`T10 应新增 30 个来源记录，实际为 ${candidates.length}`);
if (candidates.reduce((sum, record) => sum + record.upstreamBytes, 0) !== 9331418) {
  throw new Error("T10 新增来源字节数漂移");
}

const relation = (type, groupId, label, evidence, cbeta, extra = {}) => ({
  type,
  groupId,
  label,
  evidence,
  externalIds: { cbeta, ...extra },
});
const avatamsakaComponents = relation(
  "component_text_family_verified",
  "avatamsaka-component-translations-t10",
  "Buddhāvataṃsaka／《华严经》单品与组件译本",
  "DILA 经录逐条把 T0280–T0292 等早期译本对应到 T0278、T0279 的具体品次；84000 说明《华严经》由多个曾独立流通的经典或章节汇成。平台记录组件关系，不把单品别译冒充六十卷或八十卷全经。",
  ["T0278", "T0279", "T0280-T0292", "T0306"],
  { toh: ["toh44"] },
);
const tenAbodes = relation(
  "same_work_translation_group_verified",
  "avatamsaka-ten-abodes-chinese",
  "《华严经·十住品》汉译组",
  "DILA 经录把 T0283、T0284 互列，并共同对应 T0278 第十一品、T0279 第十五品；二者作为同一十住组件作品的两个汉译表达。",
  ["T0283", "T0284"],
);
const dasabhumi = relation(
  "same_work_translation_group_verified",
  "dasabhumi-chinese",
  "Daśabhūmika／《十地经》汉译组",
  "DILA 为 T0285、T0286、T0287 登记共同《华严经·十地品》关系，并为 T0286 明列梵名 Daśabhūmikasūtra；平台登记为同一作品的三个汉译表达。",
  ["T0285", "T0286", "T0287"],
  { toh: ["toh44-31"] },
);
const buddhaFields = relation(
  "same_work_translation_group_verified",
  "buddha-field-qualities-chinese",
  "Tathāgatānāṃ buddhakṣetraguṇokta／佛刹功德汉译组",
  "DILA 将 T0289、T0290 共同对应 T0278 寿命品、T0279 寿量品，T0290 并登记梵名 Tathāgatānāṃbuddhakṣetraguṇoktadharmaparyāya；平台登记为同一组件作品的两个汉译表达。",
  ["T0289", "T0290"],
);
const gandavyuha = relation(
  "same_work_with_partial_witnesses_verified",
  "gandavyuha-chinese",
  "Gaṇḍavyūha／《入法界品》汉译与节译见证",
  "DILA 为 T0293、T0295 登记共同梵名 Gaṇḍavyūhasūtra，并把 T0294、T0295 标为对应 T0278、T0279 入法界品及 T0293 的部分文本；84000 亦说明 Gaṇḍavyūha 是《华严经》最长的末章且曾独立流通。",
  ["T0293", "T0294", "T0295"],
  { toh: ["toh44-45"] },
);
const bhadracarya = relation(
  "same_work_translation_group_verified",
  "bhadracarya-pranidhana-chinese",
  "Bhadracaryāpraṇidhāna／普贤行愿汉译组",
  "DILA 为 T0296 登记梵名 Bhadracaryapraṇidhāna，并与 T0297、T0293 第四十卷互列；84000 同列 T0296、T0297 为该愿文的汉文来源。平台登记为同一愿文作品的两个汉译表达。",
  ["T0296", "T0297"],
  { toh: ["toh1095"] },
);
const inconceivableRealmCandidate = relation(
  "same_work_candidate_unmerged",
  "inconceivable-buddha-realm-candidate",
  "不思议佛境界相关译本候选",
  "DILA 为 T0300、T0301 互列相关经典，但当前证据未提供足以排除节译、改译或文本层次差异的共同作品裁决；平台先保留候选关系，不自动合并。",
  ["T0300", "T0301"],
);
const tathagataQualities = relation(
  "same_work_translation_group_verified",
  "tathagata-qualities-wisdom-realm-chinese",
  "Tathāgataguṇajñānācintyaviṣayāvatāra 汉译组",
  "DILA 为 T0302、T0303、T0304 互列相关经典，并为 T0303、T0304 登记共同梵名 Tathāgataguṇajñānācintyaviṣayāvatāranirdeśasūtra 与共同藏译目录号；平台登记为同一作品的三个汉译表达。",
  ["T0302", "T0303", "T0304"],
  { toh: ["toh185"] },
);

const relationByCanonId = new Map();
const addRelation = (ids, item) => {
  for (const id of ids) relationByCanonId.set(id, [...(relationByCanonId.get(id) ?? []), item]);
};
addRelation(["T0280", "T0281", "T0282", "T0283", "T0284", "T0285", "T0286", "T0287", "T0288", "T0289", "T0290", "T0291", "T0292", "T0293", "T0294", "T0295", "T0306"], avatamsakaComponents);
addRelation(["T0283", "T0284"], tenAbodes);
addRelation(["T0285", "T0286", "T0287"], dasabhumi);
addRelation(["T0289", "T0290"], buddhaFields);
addRelation(["T0293", "T0294", "T0295"], gandavyuha);
addRelation(["T0296", "T0297"], bhadracarya);
addRelation(["T0300", "T0301"], inconceivableRealmCandidate);
addRelation(["T0302", "T0303", "T0304"], tathagataQualities);

const workDecisions = new Map([
  ...["T0283", "T0284"].map((id) => [id, { workId: "gbcr:work:avatamsaka-ten-abodes", status: "verified_same_work_expression" }]),
  ...["T0285", "T0286", "T0287"].map((id) => [id, { workId: "gbcr:work:dasabhumi", status: "verified_same_work_expression" }]),
  ...["T0289", "T0290"].map((id) => [id, { workId: "gbcr:work:buddha-field-qualities", status: "verified_same_work_expression" }]),
  ["T0293", { workId: "gbcr:work:gandavyuha", status: "verified_same_work_expression" }],
  ["T0294", { workId: "gbcr:work:gandavyuha", status: "verified_partial_work_witness" }],
  ["T0295", { workId: "gbcr:work:gandavyuha", status: "verified_partial_work_witness" }],
  ...["T0296", "T0297"].map((id) => [id, { workId: "gbcr:work:bhadracarya-pranidhana", status: "verified_same_work_expression" }]),
  ...["T0302", "T0303", "T0304"].map((id) => [id, { workId: "gbcr:work:tathagata-qualities-wisdom-realm", status: "verified_same_work_expression" }]),
]);
const sourceRoles = new Map([
  ["T0294", "partial_translation_witness"],
  ["T0295", "partial_translation_witness"],
  ["T0302", "translation_attribution_unknown"],
]);
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const gitBlobSha1 = (value) => createHash("sha1").update(`blob ${value.length}\0`).update(value).digest("hex");
const matchRequired = (text, pattern, label, id) => {
  const value = text.match(pattern)?.[1]?.trim();
  if (!value) throw new Error(`${id} 缺少 ${label}`);
  return value;
};
const stripXml = (value) => value.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
const translatorLabel = (author) => author === "失譯" ? author : author.replace(/\s+/g, " · ");
const displayNumber = (canonId) => canonId.slice(1).replace(/^0+(?=\d)/, "");
const files = [];

for (const record of candidates) {
  const upstream = await readFile(resolve(sourceRoot, record.upstreamPath));
  if (upstream.length !== record.upstreamBytes || gitBlobSha1(upstream) !== record.upstreamGitBlobSha1 || upstream.at(-1) === 10) {
    throw new Error(`${record.sourceRecordId} 固定 Git 对象、字节数或换行假设不一致`);
  }
  const text = upstream.toString("utf8");
  const teiId = matchRequired(text, /<TEI[^>]+xml:id="([^"]+)"/, "TEI 标识", record.sourceRecordId);
  if (teiId !== record.sourceRecordId) throw new Error(`${record.sourceRecordId} TEI 标识漂移`);
  if (!text.includes("Available for non-commercial use when distributed with this header intact.")) {
    throw new Error(`${record.sourceRecordId} 缺少非商业使用与保留头部声明`);
  }
  const title = matchRequired(text, /<title level="m" xml:lang="zh-Hant">([^<]+)<\/title>/, "正藏题名", record.sourceRecordId);
  const author = text.match(/<author>([^<]+)<\/author>/)?.[1]?.trim()
    || stripXml(matchRequired(text, /<byline>([\s\S]*?)<\/byline>/, "译者或题记", record.sourceRecordId));
  const extent = matchRequired(text, /<extent>([^<]+)<\/extent>/, "卷数", record.sourceRecordId);
  const canonId = record.canonWitnessId;
  const segments = parseCbetaReadingLines(text, { canonId });
  const navigation = buildPageNavigation(segments);
  const juans = [...new Set(segments.map((segment) => segment.juan))];
  const numericJuans = juans.map(Number);
  if (numericJuans.some((juan) => !Number.isSafeInteger(juan) || juan < 1) || numericJuans.some((juan, index) => index > 0 && juan !== numericJuans[index - 1] + 1)) {
    throw new Error(`${canonId} 卷次不是连续正整数`);
  }

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

  const decision = workDecisions.get(canonId);
  const sourceRole = sourceRoles.get(canonId) ?? "translated_canonical_record";
  const partialWitness = sourceRole === "partial_translation_witness";
  files.push({
    id: canonId,
    slug: `taisho-${canonId.toLowerCase()}`,
    workId: decision?.workId ?? `gbcr:work:taisho-${canonId.toLowerCase()}`,
    workIdentityStatus: decision?.status ?? "provisional_canon_record",
    sourceRole,
    ...(relationByCanonId.has(canonId) ? { bibliographicRelations: relationByCanonId.get(canonId) } : {}),
    localPath,
    upstreamPath: record.upstreamPath,
    upstreamGitBlobSha1: record.upstreamGitBlobSha1,
    upstreamBytes: upstream.length,
    upstreamSha256: sha256(upstream),
    localBytes: normalized.length,
    localSha256: sha256(normalized),
    format: "application/tei+xml",
    completeness: partialWitness ? "complete_source_file_partial_work_witness" : "complete_source_file",
    presentation: {
      title,
      alternateTitle: title,
      tradition: "漢傳佛教 · 華嚴部",
      language: "漢文",
      canonRef: `大正藏 ${record.volume}, no. ${displayNumber(canonId)}`,
      translator: translatorLabel(author),
      summary: `${extent}。本站完整保存 ${canonId} 的固定 CBETA TEI 来源记录与可校验页栏行锚点；${partialWitness ? "本记录是《入法界品》规范作品的节译见证，不冒充完整译本；" : decision ? "已由权威目录确认与规范作品的多译本关系；" : "华严全经、单品组件与独立作品分层登记；"}物理记录、完整译本与全球去重作品分层计数。`,
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

const batch = {
  schema: "https://foxue.ai/schemas/cbeta-controlled-batch-v0.6",
  version,
  publishedAt: "2026-08-12",
  baseCatalog: "data/corpus/cbeta/catalog-v1.6.0.json",
  inventory: "data/gbcr/cbeta-taisho-sutra-inventory-v0.2.1.json",
  rightsCategory: "Individually reviewed CBETA TEI files in Taishō volumes 1–17 and 19; T10 source-record closure",
  workOverrides: {
    "gbcr:work:avatamsaka-t0278": { bibliographicRelations: [avatamsakaComponents, gandavyuha, bhadracarya] },
  },
  collection: {
    id: "CBETA-TAISHO-T10",
    title: "大正藏 T10 华严部固定来源记录",
    sourceRecordDenominator: 31,
    previouslyControlledSourceRecords: 1,
    newSourceRecords: files.length,
    controlledSourceRecords: 31,
    newSourceBytes: files.reduce((sum, file) => sum + file.upstreamBytes, 0),
    newStableSegments: files.reduce((sum, file) => sum + file.verification.segments, 0),
    newFolios: files.reduce((sum, file) => sum + file.verification.folios, 0),
    verifiedSameWorkExpressions: files.filter((file) => file.workIdentityStatus === "verified_same_work_expression").length,
    verifiedPartialWorkWitnesses: files.filter((file) => file.workIdentityStatus === "verified_partial_work_witness").length,
    provisionalRecords: files.filter((file) => file.workIdentityStatus === "provisional_canon_record").length,
    relationAnnotatedRecords: files.filter((file) => file.bibliographicRelations?.length).length,
    attributionBoundaryRecords: files.filter((file) => sourceRoles.has(file.id)).length,
    workCountingDecision: "30 个新增来源记录保持独立可寻址。证据充分的十住、十地、佛刹功德、入法界、普贤行愿与如来德智组按同一作品多表达或节译见证登记；全经、单品组件、相关候选与独立经典不因同属华严部而自动合并。",
  },
  boundaryAudit: {
    status: "verified_translation_groups_partial_component_witnesses_and_candidates_recorded",
    verifiedSameWorkGroups: ["avatamsaka-ten-abodes-chinese", "dasabhumi-chinese", "buddha-field-qualities-chinese", "gandavyuha-chinese", "bhadracarya-pranidhana-chinese", "tathagata-qualities-wisdom-realm-chinese"],
    partialWitnesses: ["T0294", "T0295"],
    componentFamilies: ["avatamsaka-component-translations-t10"],
    unmergedCandidates: ["inconceivable-buddha-realm-candidate"],
    attributionCaveats: ["T0302"],
    caveat: "《华严经》全经、曾独立流通的组件经典、单品别译、节译见证与相关候选分层记录；只有权威经录给出共同梵名和明确互见证据的文本共享规范作品。",
  },
  files,
};
if (
  batch.collection.newSourceRecords !== 30 ||
  batch.collection.newSourceBytes !== 9331418 ||
  batch.collection.newStableSegments !== 51718 ||
  batch.collection.newFolios !== 1881 ||
  batch.collection.verifiedSameWorkExpressions !== 13 ||
  batch.collection.verifiedPartialWorkWitnesses !== 2 ||
  batch.collection.provisionalRecords !== 15 ||
  batch.collection.relationAnnotatedRecords !== 24 ||
  batch.collection.attributionBoundaryRecords !== 3
) throw new Error(`T10 关系或作品边界统计漂移：${JSON.stringify(batch.collection)}`);

await writeFile(resolve(root, `data/corpus/cbeta/batch-v${version}.json`), `${JSON.stringify(batch, null, 2)}\n`, "utf8");
console.log(`CBETA 华严部审计完成：T10 31/31 个固定来源记录；新增 ${files.length} 个表达或见证、${batch.collection.newStableSegments} 个稳定行段。`);

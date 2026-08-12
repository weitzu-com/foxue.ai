import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { buildPageNavigation, parseCbetaReadingLines } from "../src/lib/cbeta-tei.mjs";

const root = process.cwd();
const version = "1.6.0";
const expectedCommit = "2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9";
const sourceArgument = process.argv.find((argument) => argument.startsWith("--source-dir="));
if (!sourceArgument) {
  console.error("用法：node scripts/audit-cbeta-lotus.mjs --source-dir=/固定提交的/xml-p5");
  process.exit(1);
}
const sourceRoot = resolve(sourceArgument.slice("--source-dir=".length));
const actualCommit = execFileSync("git", ["-C", sourceRoot, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (actualCommit !== expectedCommit) throw new Error(`上游工作树必须固定到 ${expectedCommit}`);

const inventory = JSON.parse(await readFile(resolve(root, "data/gbcr/cbeta-taisho-sutra-inventory-v0.2.1.json"), "utf8"));
const baseCatalog = JSON.parse(await readFile(resolve(root, "data/corpus/cbeta/catalog-v1.5.0.json"), "utf8"));
const sourceUnits = (file) => file.sourceParts ?? [file];
const controlledPaths = new Set(baseCatalog.files.flatMap(sourceUnits).map((file) => file.upstreamPath));
const volumeRecords = inventory.records.filter((record) => record.volume === "T09");
const candidates = volumeRecords.filter((record) => !controlledPaths.has(record.upstreamPath));
if (volumeRecords.length !== 17) throw new Error(`T09 固定来源分母应为 17，实际为 ${volumeRecords.length}`);
if (candidates.length !== 15) throw new Error(`T09 应新增 15 个来源记录，实际为 ${candidates.length}`);
if (candidates.reduce((sum, record) => sum + record.upstreamBytes, 0) !== 6342363) {
  throw new Error("T09 新增来源字节数漂移");
}

const lotusTranslationsRelation = {
  type: "same_work_translation_group_verified",
  groupId: "saddharmapundarika-chinese",
  label: "Saddharmapuṇḍarīka／《法华经》汉译组",
  evidence: "84000 的《白莲正法》导言明确列出 T0262、T0263、T0264 为《法华经》的现存汉译或修订本；平台据此共享一个规范作品实体，同时完整保留三种译文及其章节差异。",
  externalIds: { cbeta: ["T0262", "T0263", "T0264"], toh: ["toh113"] },
};
const lotusPartialWitnessRelation = {
  type: "partial_translation_witness_verified",
  groupId: "saddharmapundarika-partial-chinese",
  label: "《薩曇分陀利经》法华经节译见证",
  evidence: "DILA 经录把 T0265 明确对应到 T0262 第十一、十二品及 T0263、T0264 的第十一品，并登记同一梵名 Saddharmapuṇḍarīkasūtra；平台归入《法华经》作品，但不把一卷节译计作完整译本。",
  externalIds: { cbeta: ["T0262(11-12)", "T0263(11)", "T0264(11)", "T0265"], toh: ["toh113"] },
};
const avaivartikaRelation = {
  type: "same_work_translation_group_verified",
  groupId: "avaivartikacakra-chinese",
  label: "Avaivartikacakra／不退转法轮汉译组",
  evidence: "DILA 经录为 T0266、T0267、T0268 互列相关经典，并给出共同梵名 Avaivartikacakrasūtra、共同藏译目录号 Toh 240；平台登记为同一作品的三个汉译表达。",
  externalIds: { cbeta: ["T0266", "T0267", "T0268"], toh: ["toh240"] },
};
const sarvavaidalyasamgrahaRelation = {
  type: "same_work_translation_group_verified",
  groupId: "sarvavaidalyasamgraha-chinese",
  label: "Sarvavaidalyasaṃgraha 汉译组",
  evidence: "DILA 经录为 T0274、T0275 互列相关经典，二者同具梵名 Sarvavaidalyasaṃgrahasūtra、藏译目录号 Toh 227；平台登记为同一作品的两个汉译表达。",
  externalIds: { cbeta: ["T0274", "T0275"], toh: ["toh227"] },
};
const threefoldLotusRelation = {
  type: "liturgical_text_family_verified",
  groupId: "threefold-lotus-sutra",
  label: "三部法华经仪轨组合",
  evidence: "BDK America 将 T0276 说明为《法华经》的开经、T0277 说明为结经，并与 T0262 合称 Threefold Lotus Sutra；这是东亚读诵与教义组合，不是同一作品或同一译本。",
  externalIds: { cbeta: ["T0262", "T0276", "T0277"] },
};
const vajrasamadhiOriginRelation = {
  type: "authorship_origin_disputed",
  groupId: "vajrasamadhi-origin",
  label: "《金刚三昧经》成书地与翻译身份争议",
  evidence: "传统目录保存 T0273 为失译经；现代专门研究则把它视为东亚本土形成的佛教疑伪经。平台保留经藏位置与传统题记，但不把“失译”当作已经证明的印度译本身份。",
  externalIds: { cbeta: ["T0273"] },
};

const relationByCanonId = new Map();
const addRelation = (canonIds, relation) => {
  for (const canonId of canonIds) {
    relationByCanonId.set(canonId, [...(relationByCanonId.get(canonId) ?? []), relation]);
  }
};
addRelation(["T0263", "T0264"], lotusTranslationsRelation);
addRelation(["T0265"], lotusPartialWitnessRelation);
addRelation(["T0266", "T0267", "T0268"], avaivartikaRelation);
addRelation(["T0273"], vajrasamadhiOriginRelation);
addRelation(["T0274", "T0275"], sarvavaidalyasamgrahaRelation);
addRelation(["T0276", "T0277"], threefoldLotusRelation);

const workDecisions = new Map([
  ["T0263", { workId: "gbcr:work:saddharma-pundarika-t0262", status: "verified_same_work_expression" }],
  ["T0264", { workId: "gbcr:work:saddharma-pundarika-t0262", status: "verified_same_work_expression" }],
  ["T0265", { workId: "gbcr:work:saddharma-pundarika-t0262", status: "verified_partial_work_witness" }],
  ...["T0266", "T0267", "T0268"].map((id) => [id, { workId: "gbcr:work:avaivartika-cakra", status: "verified_same_work_expression" }]),
  ...["T0274", "T0275"].map((id) => [id, { workId: "gbcr:work:sarvavaidalyasamgraha", status: "verified_same_work_expression" }]),
]);
const sourceRoles = new Map([
  ["T0265", "partial_translation_witness"],
  ["T0273", "indigenous_composition_candidate"],
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
  if (
    upstream.length !== record.upstreamBytes ||
    gitBlobSha1(upstream) !== record.upstreamGitBlobSha1 ||
    upstream.at(-1) === 10
  ) {
    throw new Error(`${record.sourceRecordId} 固定 Git 对象、字节数或换行假设不一致`);
  }
  const text = upstream.toString("utf8");
  const teiId = matchRequired(text, /<TEI[^>]+xml:id="([^"]+)"/, "TEI 标识", record.sourceRecordId);
  if (teiId !== record.sourceRecordId) throw new Error(`${record.sourceRecordId} TEI 标识漂移`);
  if (!text.includes("Available for non-commercial use when distributed with this header intact.")) {
    throw new Error(`${record.sourceRecordId} 缺少非商业使用与保留头部声明`);
  }
  const title = matchRequired(
    text,
    /<title level="m" xml:lang="zh-Hant">([^<]+)<\/title>/,
    "正藏题名",
    record.sourceRecordId,
  );
  const author = text.match(/<author>([^<]+)<\/author>/)?.[1]?.trim()
    || stripXml(matchRequired(text, /<byline>([\s\S]*?)<\/byline>/, "译者或题记", record.sourceRecordId));
  const extent = matchRequired(text, /<extent>([^<]+)<\/extent>/, "卷数", record.sourceRecordId);
  const canonId = record.canonWitnessId;
  const segments = parseCbetaReadingLines(text, { canonId });
  const navigation = buildPageNavigation(segments);
  const juans = [...new Set(segments.map((segment) => segment.juan))];
  const numericJuans = juans.map(Number);
  if (
    numericJuans.some((juan) => !Number.isSafeInteger(juan) || juan < 1) ||
    numericJuans.some((juan, index) => index > 0 && juan !== numericJuans[index - 1] + 1)
  ) throw new Error(`${canonId} 卷次不是连续正整数`);

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
      tradition: "漢傳佛教 · 法華部",
      language: "漢文",
      canonRef: `大正藏 ${record.volume}, no. ${displayNumber(canonId)}`,
      translator: translatorLabel(author),
      summary: `${extent}。本站完整保存 ${canonId} 的固定 CBETA TEI 来源记录与可校验页栏行锚点；${partialWitness ? "本记录是规范作品的节译见证，不冒充完整译本；" : decision ? "已由权威目录确认与规范作品的多译本关系；" : "作品同一性与跨语种平行仍按逐条证据管理；"}物理记录、完整译本与全球去重作品分层计数。`,
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
  schema: "https://foxue.ai/schemas/cbeta-controlled-batch-v0.5",
  version,
  publishedAt: "2026-08-12",
  baseCatalog: "data/corpus/cbeta/catalog-v1.5.0.json",
  inventory: "data/gbcr/cbeta-taisho-sutra-inventory-v0.2.1.json",
  rightsCategory: "Individually reviewed CBETA TEI files in Taishō volumes 1–17 and 19; T09 source-record closure",
  workOverrides: {
    "gbcr:work:saddharma-pundarika-t0262": {
      bibliographicRelations: [lotusTranslationsRelation, lotusPartialWitnessRelation, threefoldLotusRelation],
    },
  },
  collection: {
    id: "CBETA-TAISHO-T09",
    title: "大正藏 T09 法华部固定来源记录",
    sourceRecordDenominator: 17,
    previouslyControlledSourceRecords: 2,
    newSourceRecords: files.length,
    controlledSourceRecords: 17,
    newSourceBytes: files.reduce((sum, file) => sum + file.upstreamBytes, 0),
    newStableSegments: files.reduce((sum, file) => sum + file.verification.segments, 0),
    newFolios: files.reduce((sum, file) => sum + file.verification.folios, 0),
    verifiedSameWorkExpressions: files.filter((file) => file.workIdentityStatus === "verified_same_work_expression").length,
    verifiedPartialWorkWitnesses: files.filter((file) => file.workIdentityStatus === "verified_partial_work_witness").length,
    provisionalRecords: files.filter((file) => file.workIdentityStatus === "provisional_canon_record").length,
    relationAnnotatedRecords: files.filter((file) => file.bibliographicRelations?.length).length,
    attributionBoundaryRecords: files.filter((file) => sourceRoles.has(file.id)).length,
    workCountingDecision: "15 个新增来源记录全部保持独立可寻址表达或见证。T0263、T0264 与既有 T0262 归入《法华经》作品，T0265 归入同作品但明确为节译见证；T0266–T0268 与 T0274–T0275 分别建立多译本作品。T0276、T0277 只建立三部法华经仪轨组合，T0273 保留本土成书候选边界。",
  },
  boundaryAudit: {
    status: "verified_translation_groups_partial_witness_and_liturgical_family_recorded",
    verifiedSameWorkGroups: ["saddharmapundarika-chinese", "avaivartikacakra-chinese", "sarvavaidalyasamgraha-chinese"],
    partialWitnesses: ["T0265"],
    liturgicalFamilies: ["threefold-lotus-sutra"],
    attributionCaveats: ["T0273"],
    caveat: "完整译本、节译见证、仪轨组合和本土成书候选分层记录；只有权威经录给出共同梵名与对应关系的文本共享规范作品。",
  },
  files,
};
if (
  batch.collection.newSourceRecords !== 15 ||
  batch.collection.newSourceBytes !== 6342363 ||
  batch.collection.newStableSegments !== 28512 ||
  batch.collection.newFolios !== 1034 ||
  batch.collection.verifiedSameWorkExpressions !== 7 ||
  batch.collection.verifiedPartialWorkWitnesses !== 1 ||
  batch.collection.provisionalRecords !== 7 ||
  batch.collection.relationAnnotatedRecords !== 11 ||
  batch.collection.attributionBoundaryRecords !== 2
) {
  throw new Error(`T09 关系或作品边界统计漂移：${JSON.stringify(batch.collection)}`);
}
await writeFile(
  resolve(root, `data/corpus/cbeta/batch-v${version}.json`),
  `${JSON.stringify(batch, null, 2)}\n`,
  "utf8",
);
console.log(
  `CBETA 法华部审计完成：T09 17/17 个固定来源记录；新增 ${files.length} 个表达或见证、${batch.collection.newStableSegments} 个稳定行段。`,
);

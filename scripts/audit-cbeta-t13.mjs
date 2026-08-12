import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { buildPageNavigation, parseCbetaReadingLines } from "../src/lib/cbeta-tei.mjs";

const root = process.cwd();
const version = "2.0.0";
const expectedCommit = "2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9";
const sourceArgument = process.argv.find((argument) => argument.startsWith("--source-dir="));
if (!sourceArgument) {
  console.error("用法：node scripts/audit-cbeta-t13.mjs --source-dir=/固定提交的/xml-p5");
  process.exit(1);
}
const sourceRoot = resolve(sourceArgument.slice("--source-dir=".length));
const actualCommit = execFileSync("git", ["-C", sourceRoot, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (actualCommit !== expectedCommit) throw new Error(`上游工作树必须固定到 ${expectedCommit}`);

const inventory = JSON.parse(await readFile(resolve(root, "data/gbcr/cbeta-taisho-sutra-inventory-v0.2.1.json"), "utf8"));
const baseCatalog = JSON.parse(await readFile(resolve(root, "data/corpus/cbeta/catalog-v1.9.0.json"), "utf8"));
const sourceUnits = (file) => file.sourceParts ?? [file];
const controlledPaths = new Set(baseCatalog.files.flatMap(sourceUnits).map((file) => file.upstreamPath));
const volumeRecords = inventory.records.filter((record) => record.volume === "T13");
const candidates = volumeRecords.filter((record) => !controlledPaths.has(record.upstreamPath));
if (volumeRecords.length !== 28) throw new Error(`T13 固定来源分母应为 28，实际为 ${volumeRecords.length}`);
if (candidates.length !== 28) throw new Error(`T13 应新增 28 个来源记录，实际为 ${candidates.length}`);
if (candidates.reduce((sum, record) => sum + record.upstreamBytes, 0) !== 15927605) {
  throw new Error("T13 新增来源字节数漂移");
}

const relation = (type, groupId, label, evidence, cbeta, extra = {}) => ({
  type,
  groupId,
  label,
  evidence,
  externalIds: { cbeta, ...extra },
});
const sameWork = (groupId, label, evidence, cbeta, extra) => relation(
  "same_work_translation_group_verified",
  groupId,
  label,
  evidence,
  cbeta,
  extra,
);
const mahasannipataComponents = relation(
  "collection_component_translation_verified",
  "mahasannipata-component-translations-t13",
  "Mahāsannipāta／《大方等大集经》合集与独立流通译本",
  "DILA 经录把 T0398–T0404 分别对应到 T0397 的第一至第九分中的具体品或分；T0397 正文又逐卷保留曇无讖、智严与宝云、那连提耶舍等不同译者题记。平台把 T0397 登记为多译者合集见证，并保留独立流通译本的组件关系，不把单品译本冒充整部六十卷合集的另一完整译本。",
  ["T0397", "T0398-T0404"],
  { toh: ["toh138"] },
);
const akashagarbha = sameWork(
  "akashagarbha-sutra-chinese",
  "Ākāśagarbhasūtra／《虚空藏菩萨经》汉译组",
  "DILA 经录把 T0405–T0408 互列，且共同登记梵名 Ākāśagarbhasūtra、Toh 260 与 O.926。平台登记为同一作品的四种汉文表达，同时保留 T0406 的失译状态与 T0407 的现代译者归属争议。",
  ["T0405", "T0406", "T0407", "T0408"],
  { toh: ["toh260"] },
);
const dasacakra = sameWork(
  "ksitigarbha-dasacakra-chinese",
  "Daśacakrakṣitigarbha／《十轮经》汉译组",
  "DILA 经录把 T0410、T0411 互列为相关经典；两部题名、内容范围与目录记录共同支持其为同一十轮作品的不同汉译。平台共享规范作品并完整保留两个译本。",
  ["T0410", "T0411"],
);
const buddhanusmrti = sameWork(
  "bodhisattva-buddhanusmrti-samadhi-chinese",
  "Bodhisattvabuddhānusmṛtisamādhi／《菩萨念佛三昧经》汉译组",
  "DILA 经录把 T0414、T0415 互列，并为 T0414 登记梵名 Bodhisattvabuddhānusmṛtisamādhisūtra。平台登记为同一作品的两个完整汉译表达。",
  ["T0414", "T0415"],
);
const pratyutpanna = relation(
  "same_work_translation_and_abridged_witness_group_verified",
  "pratyutpanna-buddha-sammukhavasthita-samadhi-chinese",
  "Pratyutpannabuddhasaṃmukhāvasthitasamādhi／《般舟三昧经》汉译与节本见证组",
  "DILA 经录把 T0416–T0419 互列为同一文本组。CBC@ 汇录的 Harrison、Zürcher 等研究进一步判定一卷本 T0417 是三卷本 T0418 的后出节本，而非独立译本；T0419 是古短本。平台把 T0416、T0418、T0419 作为同作品表达，把 T0417 作为节本见证，并公开译者归属争议。",
  ["T0416", "T0417", "T0418", "T0419"],
  { toh: ["toh133"] },
);
const ishvararaja = sameWork(
  "ishvararaja-bodhisattva-chinese",
  "Īśvararājabodhisattva／《自在王菩萨经》汉译组",
  "DILA 经录把 T0420、T0421 互列为相关经典；平台据此登记为同一作品的两个汉译表达，同时保留各自译者与全文。",
  ["T0420", "T0421"],
);
const sanghata = sameWork(
  "sanghata-sutra-chinese",
  "Saṅghāṭasūtra／《僧伽吒经》汉译组",
  "DILA 经录把 T0423、T0424 互列，并为 T0424 登记梵名 Saṅghāṭīsūtradharmaparyāya。平台登记为同一作品的两个汉译表达。",
  ["T0423", "T0424"],
);
const ksitigarbhaAttribution = relation(
  "attribution_and_origin_dispute_documented",
  "ksitigarbha-purvapranidhana-origin-dispute",
  "《地藏菩萨本愿经》译者与成书地争议",
  "传统目录把 T0412 署为实叉难陀译；CBC@ 汇录的现代研究则提出其可能在于阗或汉地形成，且至少有汉地增补。平台保留传统署名与完整正文，但不把译者和印度来源当作已裁决事实。",
  ["T0412"],
);

const relationByCanonId = new Map();
const addRelation = (ids, item) => {
  for (const id of ids) relationByCanonId.set(id, [...(relationByCanonId.get(id) ?? []), item]);
};
addRelation(["T0397", "T0398", "T0399", "T0400", "T0401", "T0402", "T0403", "T0404"], mahasannipataComponents);
for (const [ids, item] of [
  [["T0405", "T0406", "T0407", "T0408"], akashagarbha],
  [["T0410", "T0411"], dasacakra],
  [["T0412"], ksitigarbhaAttribution],
  [["T0414", "T0415"], buddhanusmrti],
  [["T0416", "T0417", "T0418", "T0419"], pratyutpanna],
  [["T0420", "T0421"], ishvararaja],
  [["T0423", "T0424"], sanghata],
]) addRelation(ids, item);

const sameExpression = (workId) => ({ workId, status: "verified_same_work_expression" });
const partialWitness = (workId) => ({ workId, status: "verified_partial_work_witness" });
const workDecisions = new Map([
  ["T0397", { workId: "gbcr:work:mahasannipata-t0397", status: "verified_collection_expression" }],
  ...["T0405", "T0406", "T0407", "T0408"].map((id) => [id, sameExpression("gbcr:work:akashagarbha-sutra")]),
  ...["T0410", "T0411"].map((id) => [id, sameExpression("gbcr:work:ksitigarbha-dasacakra")]),
  ...["T0414", "T0415"].map((id) => [id, sameExpression("gbcr:work:bodhisattva-buddhanusmrti-samadhi")]),
  ["T0416", sameExpression("gbcr:work:pratyutpanna-buddha-sammukhavasthita-samadhi")],
  ["T0417", partialWitness("gbcr:work:pratyutpanna-buddha-sammukhavasthita-samadhi")],
  ["T0418", sameExpression("gbcr:work:pratyutpanna-buddha-sammukhavasthita-samadhi")],
  ["T0419", sameExpression("gbcr:work:pratyutpanna-buddha-sammukhavasthita-samadhi")],
  ...["T0420", "T0421"].map((id) => [id, sameExpression("gbcr:work:ishvararaja-bodhisattva")]),
  ...["T0423", "T0424"].map((id) => [id, sameExpression("gbcr:work:sanghata-sutra")]),
]);
const sourceRoles = new Map([
  ["T0397", "multi_translation_collection_witness"],
  ["T0406", "translation_attribution_unknown"],
  ["T0407", "traditional_translation_attribution_disputed"],
  ["T0412", "indigenous_composition_candidate"],
  ["T0417", "abridged_recension_witness"],
  ["T0418", "traditional_translation_attribution_disputed"],
  ["T0419", "translation_attribution_unknown"],
]);
const partialSourceRecords = new Set(["T0417"]);
const translatorOverrides = new Map([
  ["T0397", "多译者合集 · 曇无讖、智严、宝云、那连提耶舍等"],
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
  const authorTag = text.match(/<author>([\s\S]*?)<\/author>/)?.[1] ?? "";
  const bylineTag = text.match(/<byline>([\s\S]*?)<\/byline>/)?.[1] ?? "";
  const author = stripXml(authorTag) || stripXml(bylineTag) || "題記未載譯者";
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
  const partial = partialSourceRecords.has(canonId);
  const boundarySummary = partial
    ? "本记录是规范作品的后出节本见证，不作为另一部完整译本计数；"
    : sourceRole === "multi_translation_collection_witness"
      ? "本记录是多译者、多组件汇编合集，合集与各独立流通文本分层计数；"
      : sourceRole === "indigenous_composition_candidate"
        ? "传统译者署名与成书地均有现代学术争议，平台保留争议而不提前裁决；"
        : sourceRole === "traditional_translation_attribution_disputed"
          ? "现代研究对传统译者署名或成书路径存在争议，平台不把题记当作已裁决事实；"
          : decision
            ? "已由权威目录确认与规范作品的多译本关系；"
            : relationByCanonId.has(canonId)
              ? "本经与合集具体组件的关系已记录，但不冒充整部合集的另一译本；"
              : "作品同一性与跨语种平行仍按逐条证据管理；";
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
    completeness: partial ? "complete_source_file_partial_work_witness" : "complete_source_file",
    presentation: {
      title,
      alternateTitle: title,
      tradition: "漢傳佛教 · 大集部",
      language: "漢文",
      canonRef: `大正藏 ${record.volume}, no. ${displayNumber(canonId)}`,
      translator: translatorOverrides.get(canonId) ?? translatorLabel(author),
      summary: `${extent}。本站完整保存 ${canonId} 的固定 CBETA TEI 来源记录与可校验页栏行锚点；${boundarySummary}物理记录、合集、作品、表达与版本见证分层计数。`,
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
  schema: "https://foxue.ai/schemas/cbeta-controlled-batch-v0.8",
  version,
  publishedAt: "2026-08-12",
  baseCatalog: "data/corpus/cbeta/catalog-v1.9.0.json",
  inventory: "data/gbcr/cbeta-taisho-sutra-inventory-v0.2.1.json",
  rightsCategory: "Individually reviewed CBETA TEI files in Taishō volumes 1–17 and 19; T13 source-record closure",
  collection: {
    id: "CBETA-TAISHO-T13",
    title: "大正藏 T13 大集部固定来源记录",
    sourceRecordDenominator: 28,
    previouslyControlledSourceRecords: 0,
    newSourceRecords: files.length,
    controlledSourceRecords: 28,
    newSourceBytes: files.reduce((sum, file) => sum + file.upstreamBytes, 0),
    newStableSegments: files.reduce((sum, file) => sum + file.verification.segments, 0),
    newFolios: files.reduce((sum, file) => sum + file.verification.folios, 0),
    verifiedCollectionExpressions: files.filter((file) => file.workIdentityStatus === "verified_collection_expression").length,
    verifiedSameWorkExpressions: files.filter((file) => file.workIdentityStatus === "verified_same_work_expression").length,
    verifiedPartialWorkWitnesses: files.filter((file) => file.workIdentityStatus === "verified_partial_work_witness").length,
    provisionalRecords: files.filter((file) => file.workIdentityStatus === "provisional_canon_record").length,
    fullSourceTexts: files.filter((file) => file.completeness === "complete_source_file").length,
    partialSourceWitnesses: files.filter((file) => file.completeness === "complete_source_file_partial_work_witness").length,
    relationAnnotatedRecords: files.filter((file) => file.bibliographicRelations?.length).length,
    attributionBoundaryRecords: files.filter((file) => sourceRoles.has(file.id)).length,
    workCountingDecision: "28 个来源记录全部独立可寻址，归入 18 个作品实体。T0397 按多译者合集见证登记；T0398–T0404 只建立合集组件关系。T0417 按 T0418 的后出节本见证登记；T0412 保留传统署名与疑似汉地成书争议。合集、独立流通译本、同经异译、节本与来源记录不混计。",
  },
  boundaryAudit: {
    status: "verified_collection_components_translation_groups_abridgement_and_attribution_disputes_recorded",
    verifiedSameWorkGroups: [
      "akashagarbha-sutra-chinese",
      "ksitigarbha-dasacakra-chinese",
      "bodhisattva-buddhanusmrti-samadhi-chinese",
      "pratyutpanna-buddha-sammukhavasthita-samadhi-chinese",
      "ishvararaja-bodhisattva-chinese",
      "sanghata-sutra-chinese",
    ],
    collectionComponentFamilies: ["mahasannipata-component-translations-t13"],
    collectionWitnesses: ["T0397"],
    abridgedWitnesses: ["T0417"],
    attributionCaveats: ["T0406", "T0407", "T0412", "T0418", "T0419"],
    caveat: "《大集经》合集、单品译本、同作品汉译、后出节本和译者归属争议分层登记；目录互列只在有题名、梵名、内容或现代研究支持时用于作品合并。",
  },
  files,
};
if (
  batch.collection.newSourceRecords !== 28 ||
  batch.collection.newSourceBytes !== 15927605 ||
  batch.collection.verifiedCollectionExpressions !== 1 ||
  batch.collection.verifiedSameWorkExpressions !== 15 ||
  batch.collection.verifiedPartialWorkWitnesses !== 1 ||
  batch.collection.provisionalRecords !== 11 ||
  batch.collection.fullSourceTexts !== 27 ||
  batch.collection.partialSourceWitnesses !== 1 ||
  batch.collection.relationAnnotatedRecords !== 25 ||
  batch.collection.attributionBoundaryRecords !== 7
) throw new Error(`T13 关系或作品边界统计漂移：${JSON.stringify(batch.collection)}`);

await writeFile(resolve(root, `data/corpus/cbeta/batch-v${version}.json`), `${JSON.stringify(batch, null, 2)}\n`, "utf8");
console.log(`CBETA T13 审计完成：28/28 个固定来源记录；新增 ${files.length} 个表达或见证、${batch.collection.newStableSegments} 个稳定行段。`);

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { buildPageNavigation, parseCbetaReadingLines } from "../src/lib/cbeta-tei.mjs";

const root = process.cwd();
const version = "1.8.0";
const expectedCommit = "2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9";
const sourceArgument = process.argv.find((argument) => argument.startsWith("--source-dir="));
if (!sourceArgument) {
  console.error("用法：node scripts/audit-cbeta-ratnakuta.mjs --source-dir=/固定提交的/xml-p5");
  process.exit(1);
}
const sourceRoot = resolve(sourceArgument.slice("--source-dir=".length));
const actualCommit = execFileSync("git", ["-C", sourceRoot, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (actualCommit !== expectedCommit) throw new Error(`上游工作树必须固定到 ${expectedCommit}`);

const inventory = JSON.parse(await readFile(resolve(root, "data/gbcr/cbeta-taisho-sutra-inventory-v0.2.1.json"), "utf8"));
const baseCatalog = JSON.parse(await readFile(resolve(root, "data/corpus/cbeta/catalog-v1.7.0.json"), "utf8"));
const sourceUnits = (file) => file.sourceParts ?? [file];
const controlledPaths = new Set(baseCatalog.files.flatMap(sourceUnits).map((file) => file.upstreamPath));
const volumeRecords = inventory.records.filter((record) => record.volume === "T11");
const candidates = volumeRecords.filter((record) => !controlledPaths.has(record.upstreamPath));
if (volumeRecords.length !== 12) throw new Error(`T11 固定来源分母应为 12，实际为 ${volumeRecords.length}`);
if (candidates.length !== 11) throw new Error(`T11 应新增 11 个来源记录，实际为 ${candidates.length}`);
if (candidates.reduce((sum, record) => sum + record.upstreamBytes, 0) !== 3417170) {
  throw new Error("T11 新增来源字节数漂移");
}

const relation = (type, groupId, label, evidence, cbeta, extra = {}) => ({
  type,
  groupId,
  label,
  evidence,
  externalIds: { cbeta, ...extra },
});
const ratnakutaComponents = relation(
  "collection_component_translation_verified",
  "maharatnakuta-component-translations-t11",
  "Mahāratnakūṭa／《大宝积经》合集会与独立流通译本",
  "DILA 经录逐条把 T0311–T0320 对应到 T0310《大宝积经》的具体会；84000 也将 Ratnakūṭa 描述为多部经典的合集。平台记录合集组件关系，不把单会独立译本冒充整部一百二十卷合集的另一完整译本。",
  ["T0310", "T0311-T0320"],
);
const samantamukhaWitnesses = relation(
  "same_work_edition_witnesses_verified",
  "samantamukha-parivarta-chinese-witnesses",
  "Samantamukhaparivarta／《普门品经》版本见证组",
  "DILA 经录为 T0315a、T0315b 登记同题、同译者、同梵名 Samantamukhaparivarta，并分别保留不同字数和版本信息；平台按同一作品的两个完整版本见证登记，不把小写 a/b 误作两部独立作品。",
  ["T0315a", "T0315b"],
  { toh: ["toh54"] },
);
const manjushriBuddhaField = relation(
  "same_work_translation_group_verified",
  "manjushri-buddha-field-chinese",
  "Mañjuśrībuddhakṣetraguṇavyūha／文殊师利佛土庄严汉译组",
  "DILA 经录把 T0318、T0319 互列，并共同对应 T0310 第十五文殊师利授记会；平台登记为同一作品的两个汉译表达，同时保留各自译者、题名、全文与稳定锚点。",
  ["T0318", "T0319", "T0310(15)"],
);

const relationByCanonId = new Map();
const addRelation = (ids, item) => {
  for (const id of ids) relationByCanonId.set(id, [...(relationByCanonId.get(id) ?? []), item]);
};
addRelation(["T0311", "T0312", "T0313", "T0314", "T0315a", "T0315b", "T0316", "T0317", "T0318", "T0319", "T0320"], ratnakutaComponents);
addRelation(["T0315a", "T0315b"], samantamukhaWitnesses);
addRelation(["T0318", "T0319"], manjushriBuddhaField);

const workDecisions = new Map([
  ["T0315a", { workId: "gbcr:work:samantamukha-parivarta", status: "verified_same_work_witness" }],
  ["T0315b", { workId: "gbcr:work:samantamukha-parivarta", status: "verified_same_work_witness" }],
  ["T0318", { workId: "gbcr:work:manjushri-buddha-field", status: "verified_same_work_expression" }],
  ["T0319", { workId: "gbcr:work:manjushri-buddha-field", status: "verified_same_work_expression" }],
]);
const sourceRoles = new Map([
  ["T0315a", "edition_witness"],
  ["T0315b", "edition_witness"],
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
  files.push({
    id: canonId,
    slug: `taisho-${canonId.toLowerCase()}`,
    workId: decision?.workId ?? `gbcr:work:taisho-${canonId.toLowerCase()}`,
    workIdentityStatus: decision?.status ?? "provisional_canon_record",
    sourceRole,
    bibliographicRelations: relationByCanonId.get(canonId),
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
      tradition: "漢傳佛教 · 寶積部",
      language: "漢文",
      canonRef: `大正藏 ${record.volume}, no. ${displayNumber(canonId)}`,
      translator: translatorLabel(author),
      summary: `${extent}。本站完整保存 ${canonId} 的固定 CBETA TEI 来源记录与可校验页栏行锚点；${sourceRole === "edition_witness" ? "本记录是同一《普门品经》作品的独立版本见证；" : decision ? "已由权威目录确认与规范作品的多译本关系；" : "本经与《大宝积经》具体会的组件关系已记录，但不冒充整部合集的另一译本；"}物理记录、合集、作品、表达与版本见证分层计数。`,
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
  baseCatalog: "data/corpus/cbeta/catalog-v1.7.0.json",
  inventory: "data/gbcr/cbeta-taisho-sutra-inventory-v0.2.1.json",
  rightsCategory: "Individually reviewed CBETA TEI files in Taishō volumes 1–17 and 19; T11 source-record closure",
  workOverrides: {
    "gbcr:work:maharatnakuta-t0310": { bibliographicRelations: [ratnakutaComponents, manjushriBuddhaField] },
  },
  collection: {
    id: "CBETA-TAISHO-T11",
    title: "大正藏 T11 宝积部固定来源记录",
    sourceRecordDenominator: 12,
    previouslyControlledSourceRecords: 1,
    newSourceRecords: files.length,
    controlledSourceRecords: 12,
    newSourceBytes: files.reduce((sum, file) => sum + file.upstreamBytes, 0),
    newStableSegments: files.reduce((sum, file) => sum + file.verification.segments, 0),
    newFolios: files.reduce((sum, file) => sum + file.verification.folios, 0),
    verifiedSameWorkExpressions: files.filter((file) => file.workIdentityStatus === "verified_same_work_expression").length,
    verifiedSameWorkWitnesses: files.filter((file) => file.workIdentityStatus === "verified_same_work_witness").length,
    provisionalRecords: files.filter((file) => file.workIdentityStatus === "provisional_canon_record").length,
    relationAnnotatedRecords: files.filter((file) => file.bibliographicRelations?.length).length,
    attributionBoundaryRecords: files.filter((file) => sourceRoles.has(file.id)).length,
    workCountingDecision: "11 个新增来源记录保持独立可寻址。T0318/T0319 按同作品多译本登记，T0315a/T0315b 按同作品多版本见证登记；其余独立流通译本与 T0310 的具体会建立合集组件关系，但不冒充整部《大宝积经》的另一完整表达。",
  },
  boundaryAudit: {
    status: "verified_collection_components_translation_group_and_edition_witnesses_recorded",
    verifiedSameWorkGroups: ["samantamukha-parivarta-chinese-witnesses", "manjushri-buddha-field-chinese"],
    collectionComponentFamilies: ["maharatnakuta-component-translations-t11"],
    editionWitnesses: ["T0315a", "T0315b"],
    caveat: "《大宝积经》是合集；单会独立流通译本、同作品汉译与同译本版本见证分层记录。合集组件关系不自动构成整部合集的多译本关系。",
  },
  files,
};
if (
  batch.collection.newSourceRecords !== 11 ||
  batch.collection.newSourceBytes !== 3417170 ||
  batch.collection.newStableSegments !== 24936 ||
  batch.collection.newFolios !== 942 ||
  batch.collection.verifiedSameWorkExpressions !== 2 ||
  batch.collection.verifiedSameWorkWitnesses !== 2 ||
  batch.collection.provisionalRecords !== 7 ||
  batch.collection.relationAnnotatedRecords !== 11 ||
  batch.collection.attributionBoundaryRecords !== 2
) throw new Error(`T11 关系或作品边界统计漂移：${JSON.stringify(batch.collection)}`);

await writeFile(resolve(root, `data/corpus/cbeta/batch-v${version}.json`), `${JSON.stringify(batch, null, 2)}\n`, "utf8");
console.log(`CBETA 宝积部审计完成：T11 12/12 个固定来源记录；新增 ${files.length} 个表达或见证、${batch.collection.newStableSegments} 个稳定行段。`);

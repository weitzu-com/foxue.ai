import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { buildPageNavigation, parseCbetaReadingLines } from "../src/lib/cbeta-tei.mjs";

const root = process.cwd();
const version = "1.4.0";
const expectedCommit = "2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9";
const sourceArgument = process.argv.find((argument) => argument.startsWith("--source-dir="));
if (!sourceArgument) {
  console.error("用法：node scripts/audit-cbeta-benyuan.mjs --source-dir=/固定提交的/xml-p5");
  process.exit(1);
}
const sourceRoot = resolve(sourceArgument.slice("--source-dir=".length));
const actualCommit = execFileSync("git", ["-C", sourceRoot, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (actualCommit !== expectedCommit) throw new Error(`上游工作树必须固定到 ${expectedCommit}`);

const inventory = JSON.parse(await readFile(resolve(root, "data/gbcr/cbeta-taisho-sutra-inventory-v0.2.1.json"), "utf8"));
const baseCatalog = JSON.parse(await readFile(resolve(root, "data/corpus/cbeta/catalog-v1.3.0.json"), "utf8"));
const sourceUnits = (file) => file.sourceParts ?? [file];
const controlledPaths = new Set(baseCatalog.files.flatMap(sourceUnits).map((file) => file.upstreamPath));
const volumeRecords = inventory.records.filter((record) => ["T03", "T04"].includes(record.volume));
const candidates = volumeRecords.filter((record) => !controlledPaths.has(record.upstreamPath));
if (volumeRecords.length !== 72) throw new Error(`T03–T04 固定来源分母应为 72，实际为 ${volumeRecords.length}`);
if (candidates.length !== 71) throw new Error(`T03–T04 应新增 71 个来源记录，实际为 ${candidates.length}`);
if (candidates.reduce((sum, record) => sum + record.upstreamBytes, 0) !== 33152203) {
  throw new Error("T03–T04 新增来源字节数漂移");
}

const relationByCanonId = new Map();
const addRelation = (canonIds, relation) => {
  for (const canonId of canonIds) {
    relationByCanonId.set(canonId, [...(relationByCanonId.get(canonId) ?? []), relation]);
  }
};
addRelation(["T0157", "T0158"], {
  type: "same_work_candidate",
  groupId: "karunapundarika-chinese",
  label: "《悲华经》汉译组",
  evidence: "T0157 的 CBETA 校勘资料保留梵名 Karuṇāpuṇḍarīka-sūtra，并逐行引用 T0158；在独立书目复核前先建立候选关系，不合并计数。",
});
addRelation(["T0174", "T0175a", "T0175b", "T0175c"], {
  type: "same_work_and_witness_candidate",
  groupId: "sama-jataka-chinese",
  label: "睒子本生汉译与藏本见证组",
  evidence: "T0175c 的 CBETA 校勘注明确标为 Sāma-jātaka 540；T0175a/b/c 的题记与校勘注显示不同藏本形态，T0174 为相关汉译。见证层模型完成前不合并表达计数。",
});
addRelation(["T0181a", "T0181b"], {
  type: "same_translation_witness_candidate",
  groupId: "nine-colored-deer-witnesses",
  label: "《九色鹿经》藏本见证组",
  evidence: "两份来源同题材、同译者；CBETA 原校注分别说明丽本/明本及宋元本对校关系。见证层模型完成前不合并。",
});
addRelation(["T0182a", "T0182b"], {
  type: "same_translation_witness_candidate",
  groupId: "deer-mother-witnesses",
  label: "《鹿母经》藏本见证组",
  evidence: "两份来源同题名核心、同译者；CBETA 原校注说明不同藏本及对校关系。见证层模型完成前不合并。",
});
addRelation(["T0186", "T0187"], {
  type: "same_work_candidate",
  groupId: "lalitavistara-chinese",
  label: "Lalitavistara 汉译组",
  evidence: "T0187 的 CBETA 校勘资料保留梵名 Lalitavistara；T0186 与 T0187 均为佛传章品结构。先登记候选关系，等待章节级对齐后再合并作品。",
});
addRelation(["T0198"], {
  type: "chapter_level_parallel_verified",
  groupId: "atthakavagga-parallel",
  label: "《义足经》与《经集·八颂品》平行组",
  evidence: "CBETA 校勘注逐章标识 Sn. Aṭṭhaka-vagga 及对应偈号；这是章节级平行关系，不把两个传承的文本直接合并为同一表达。",
  externalIds: { suttacentral: ["snp4"] },
});
addRelation(["T0200"], {
  type: "sanskrit_parallel_candidate",
  groupId: "avadanasataka-parallel",
  label: "《撰集百缘经》与 Avadānaśataka 平行组",
  evidence: "CBETA 校勘注引用 Avadānaśataka 梵本；需完成故事级对齐后才能决定作品边界。",
});
addRelation(["T0211", "T0212", "T0213"], {
  type: "text_family_candidate",
  groupId: "dharmapada-udanavarga-family",
  label: "法句—譬喻—出曜—法集要颂文本家族",
  evidence: "这些文本共享法句/出曜偈颂传统，但包含偈颂、譬喻与注释等不同层次；只建立文本家族，不合并为单一作品。",
});

const attributedAuthorshipIds = new Set([
  "T0160", "T0192", "T0194", "T0201", "T0207", "T0208", "T0209", "T0213",
]);
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const gitBlobSha1 = (value) => createHash("sha1").update(`blob ${value.length}\0`).update(value).digest("hex");
const matchRequired = (text, pattern, label, id) => {
  const value = text.match(pattern)?.[1]?.trim();
  if (!value) throw new Error(`${id} 缺少 ${label}`);
  return value;
};
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
  const author = matchRequired(text, /<author>([^<]+)<\/author>/, "译者或作者题记", record.sourceRecordId);
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

  const sourceRole = attributedAuthorshipIds.has(canonId)
    ? "attributed_authored_or_compiled_text"
    : "translated_canonical_record";
  files.push({
    id: canonId,
    slug: `taisho-${canonId.toLowerCase()}`,
    workId: `gbcr:work:taisho-${canonId.toLowerCase()}`,
    workIdentityStatus: "provisional_canon_record",
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
    completeness: "complete_source_file",
    presentation: {
      title,
      alternateTitle: title,
      tradition: "漢傳佛教 · 本緣部",
      language: "漢文",
      canonRef: `大正藏 ${record.volume}, no. ${displayNumber(canonId)}`,
      translator: translatorLabel(author),
      summary: `${extent}。本站完整保存 ${canonId} 的固定 CBETA TEI 文本与可校验页栏行锚点；${sourceRole === "attributed_authored_or_compiled_text" ? "题记显示为造、撰、集或论类文本，不标作佛陀亲说；" : "传承归属与作品同一性仍待跨目录校勘；"}一个经号记录不自动等同于全球去重作品。`,
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
  schema: "https://foxue.ai/schemas/cbeta-controlled-batch-v0.4",
  version,
  publishedAt: "2026-08-12",
  baseCatalog: "data/corpus/cbeta/catalog-v1.3.0.json",
  inventory: "data/gbcr/cbeta-taisho-sutra-inventory-v0.2.1.json",
  rightsCategory: "Individually reviewed CBETA TEI files in Taishō volumes 1–17 and 19; T03–T04 source-record closure",
  workOverrides: {},
  collection: {
    id: "CBETA-TAISHO-T03-T04",
    title: "大正藏 T03–T04 本缘部固定来源记录",
    sourceRecordDenominator: 72,
    previouslyControlledSourceRecords: 1,
    newSourceRecords: files.length,
    controlledSourceRecords: 72,
    newSourceBytes: files.reduce((sum, file) => sum + file.upstreamBytes, 0),
    newStableSegments: files.reduce((sum, file) => sum + file.verification.segments, 0),
    newFolios: files.reduce((sum, file) => sum + file.verification.folios, 0),
    attributedAuthoredOrCompiledRecords: files.filter((file) => file.sourceRole === "attributed_authored_or_compiled_text").length,
    relationAnnotatedRecords: files.filter((file) => file.bibliographicRelations?.length).length,
    workCountingDecision: "71 个新增经号先以 provisional_canon_record 建立可追踪书目实体。已识别的藏本见证、同作品候选、巴利平行和法句文本家族写入逐条关系证据，但在见证层模型与人工章节对齐完成前不合并计数。T03–T04 的 72 是固定来源记录完整性，不是全球作品覆盖率。",
  },
  boundaryAudit: {
    status: "relation_candidates_recorded_work_dedup_pending",
    witnessGroups: ["sama-jataka-chinese", "nine-colored-deer-witnesses", "deer-mother-witnesses"],
    sameWorkCandidates: ["karunapundarika-chinese", "sama-jataka-chinese", "lalitavistara-chinese"],
    crossLanguageParallels: ["atthakavagga-parallel", "avadanasataka-parallel"],
    textFamilies: ["dharmapada-udanavarga-family"],
    caveat: "关系证据用于阻止错误去重或重复计数；除章节级平行已由 CBETA 校勘注直接支持外，其余候选仍需版本学复核。",
  },
  files,
};
if (batch.collection.newStableSegments !== 150383 || batch.collection.newFolios !== 5489) {
  throw new Error("T03–T04 新增稳定行段或阅读页统计漂移");
}
await writeFile(
  resolve(root, `data/corpus/cbeta/batch-v${version}.json`),
  `${JSON.stringify(batch, null, 2)}\n`,
  "utf8",
);
console.log(
  `CBETA 本缘部审计完成：T03–T04 72/72 个固定来源记录；新增 ${files.length} 个记录、${batch.collection.newStableSegments} 个稳定行段。`,
);

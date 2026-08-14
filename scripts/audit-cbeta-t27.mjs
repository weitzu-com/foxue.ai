import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { buildPageNavigation, parseCbetaReadingLines } from "../src/lib/cbeta-tei.mjs";

const root = process.cwd();
const version = "3.4.0";
const expectedCommit = "2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9";
const sourceArgument = process.argv.find((argument) => argument.startsWith("--source-dir="));
if (!sourceArgument) {
  console.error("用法：node scripts/audit-cbeta-t27.mjs --source-dir=/固定提交的/xml-p5");
  process.exit(1);
}
const sourceRoot = resolve(sourceArgument.slice("--source-dir=".length));
const actualCommit = execFileSync("git", ["-C", sourceRoot, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (actualCommit !== expectedCommit) throw new Error(`上游工作树必须固定到 ${expectedCommit}`);

const inventoryPath = "data/gbcr/cbeta-taisho-t27-inventory-v0.1.0.json";
const inventory = JSON.parse(await readFile(resolve(root, inventoryPath), "utf8"));
const baseCatalogPath = "data/corpus/cbeta/catalog-v3.3.0.json";
const baseCatalog = JSON.parse(await readFile(resolve(root, baseCatalogPath), "utf8"));
const sourceUnits = (file) => file.sourceParts ?? [file];
const controlledPaths = new Set(baseCatalog.files.flatMap(sourceUnits).map((file) => file.upstreamPath));
const candidates = inventory.records.filter((record) => !controlledPaths.has(record.upstreamPath));
if (inventory.totals.records !== 1 || inventory.totals.upstreamBytes !== 9552926 || candidates.length !== 1) {
  throw new Error(`T27 固定来源分母或新增记录漂移：${inventory.totals.records}/${candidates.length}`);
}

const relation = {
  type: "root_treatise_commentary_relation_verified",
  groupId: "jnanaprasthana-mahavibhasa-t1543-t1545",
  label: "Jñānaprasthāna／《发智论》与《大毘婆沙论》根本论—广释关系",
  evidence: "T1545 正文明确说明迦多衍尼子造《发智论》，全书围绕其论题进行大规模解释；书目与研究资料也将《大毘婆沙论》视为《发智论》的注释性汇编。T1543 与 T1544 是《发智论》的两种汉译或传承表达，T1545 则是独立的广释作品。平台建立关系但不合并作品。",
  externalIds: { cbeta: ["T1543", "T1544", "T1545"] },
};

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const gitBlobSha1 = (value) => createHash("sha1").update(`blob ${value.length}\0`).update(value).digest("hex");
const matchRequired = (text, pattern, label, id) => {
  const value = text.match(pattern)?.[1]?.trim();
  if (!value) throw new Error(`${id} 缺少 ${label}`);
  return value;
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
  const teiId = matchRequired(text, /<TEI[^>]+xml:id="([^"]+)"/, "TEI 标识", record.sourceRecordId);
  if (teiId !== record.sourceRecordId) throw new Error(`${record.sourceRecordId} TEI 标识漂移`);
  if (!text.includes("Available for non-commercial use when distributed with this header intact.")) {
    throw new Error(`${record.sourceRecordId} 缺少非商业与保留头部声明`);
  }
  const title = stripXml(matchRequired(text, /<title level="m" xml:lang="zh-Hant">([\s\S]*?)<\/title>/, "正藏题名", record.sourceRecordId));
  const author = stripXml(matchRequired(text, /<author>([\s\S]*?)<\/author>/, "传统作者与译者题记", record.sourceRecordId));
  const extent = matchRequired(text, /<extent>([^<]+)<\/extent>/, "卷数", record.sourceRecordId);
  const canonId = record.canonWitnessId;
  if (canonId !== "T1545") throw new Error(`T27 出现未裁决经号 ${canonId}`);
  if (!author.includes("五百大阿羅漢") || !author.includes("玄奘")) throw new Error("T1545 传统集体归属或译者题记漂移");

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
    slug: "taisho-t1545",
    workId: "gbcr:work:abhidharma-mahavibhasa",
    workIdentityStatus: "verified_distinct_commentary_work",
    workTitle: "阿毘达磨大毘婆沙论（Abhidharma Mahāvibhāṣā）",
    sourceRole: "traditional_collective_authored_abhidharma_commentary_with_translation",
    bibliographicRelations: [relation],
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
      tradition: "漢傳佛教 · 毘曇部",
      language: "漢文",
      canonRef: "大正藏 T27, no. 1545",
      translator: author.replace(/\s+/g, " · "),
      summary: `${extent}。本站完整保存 T1545 固定 CBETA TEI 来源记录与可校验页栏行锚点；题记保存“五百大阿罗汉等造、玄奘译”的传统责任陈述，但不把传统集体归属冒充可独立证实的现代作者事实。作品作为《发智论》的独立广释，与 T1543/T1544 建立关系而不合并，也不标为佛陀逐字亲说。`,
      sourceUrl: "https://cbetaonline.dila.edu.tw/zh/T1545_001",
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
  const file = baseCatalog.files.find((item) => item.id === canonId);
  if (!file) throw new Error(`基础目录缺少比较文本 ${canonId}`);
  const segments = [];
  for (const source of sourceUnits(file)) {
    const text = await readFile(resolve(root, source.localPath), "utf8");
    segments.push(...parseCbetaReadingLines(text, { canonId }));
  }
  normalizedBodies.set(canonId, normalizeBody(segments));
};
for (const canonId of ["T1543", "T1544"]) await ensureBaseBody(canonId);

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
const comparisonPairs = [["T1543", "T1545"], ["T1544", "T1545"]].map(([left, right]) => compareBodies(left, right));
const comparisonByPair = new Map(comparisonPairs.map((item) => [item.pair.join("/"), item]));
const containment = (pair) => comparisonByPair.get(pair).fiveGramContainmentOfShorter;
if (
  containment("T1543/T1545") < 0.05 || containment("T1543/T1545") > 0.07 ||
  containment("T1544/T1545") < 0.61 || containment("T1544/T1545") > 0.64 ||
  containment("T1544/T1545") < containment("T1543/T1545") * 8
) throw new Error(`T27 根本论—广释文本比较漂移：${JSON.stringify(comparisonPairs)}`);

const batch = {
  schema: "https://foxue.ai/schemas/cbeta-controlled-batch-v1.0",
  version,
  publishedAt: "2026-08-14",
  baseCatalog: baseCatalogPath,
  inventory: inventoryPath,
  rightsCategory: "Individually reviewed CBETA TEI files in Taishō volumes T01–T27; T27 source-record closure",
  workOverrides: {
    "gbcr:work:jnanaprasthana": { bibliographicRelations: [relation] },
  },
  fileOverrides: {},
  collection: {
    id: "CBETA-TAISHO-T27",
    title: "大正藏 T27 毘曇部《大毘婆沙论》固定来源记录",
    sourceRecordDenominator: 1,
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
    workCountingDecision: "T27 只有 T1545 一份完整来源记录，登记为一个独立的《阿毘达磨大毘婆沙论》作品和一个汉译表达。T1543/T1544 仍共享《发智论》根本论作品；T1545 与二者建立根本论—广释关系，不合并为第三个《发智论》表达。",
  },
  boundaryAudit: {
    status: "verified_source_integrity_distinct_commentary_work_root_treatise_and_attribution_boundaries_recorded",
    existingControlledRecords: [],
    editionOrRecensionGroups: [],
    verifiedTranslationGroups: [],
    rootTreatiseCommentaryGroups: [relation.groupId],
    candidateRelationsNotMerged: [],
    partialWorkWitnesses: [],
    sourceRoles: { traditional_collective_authored_abhidharma_commentary_with_translation: ["T1545"] },
    textualComparison: {
      algorithm: "Unicode text from stable reading lines; punctuation/space removed; unique character 5-gram containment and Jaccard. Machine overlap documents a root-treatise/commentary relationship and recension asymmetry; it never decides work identity or authorship alone.",
      pairs: comparisonPairs,
    },
    authoritySources: [
      "https://github.com/cbeta-org/xml-p5/tree/2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9/T/T27",
      "https://authority.dila.edu.tw/catalog/search.php?code=CA0000051",
      "https://buddhism.lib.ntu.edu.tw/search/search_detail.jsp?seq=290413",
      "https://buddhism.lib.ntu.edu.tw/en/search/search_detail.jsp?seq=162490",
      "https://buddhism.lib.ntu.edu.tw/DLMBS/en/search/search_detail.jsp?seq=669123",
      "https://buddhism.lib.ntu.edu.tw/search/search_detail.jsp?seq=665095",
      "https://buddhism.lib.ntu.edu.tw/FULLTEXT/JR-BJ013/bj013133226.pdf",
    ],
    caveat: "T1545 是阿毘达磨论释文献，不是佛说经集合。平台完整保存固定来源、传统集体造论题记与玄奘译记，同时区分根本论、广释作品、汉译表达、传承层和现代书目判断；高文本重叠不能把注释与根本论合并，传统题记也不能被改写成无争议的现代作者事实。",
  },
  files,
};

if (
  batch.collection.newSourceRecords !== 1 ||
  batch.collection.newSourceBytes !== 9552926 ||
  batch.collection.newStableSegments !== 86292 ||
  batch.collection.newFolios !== 3139 ||
  batch.collection.verifiedSameWorkExpressions !== 0 ||
  batch.collection.verifiedEditionWitnesses !== 0 ||
  batch.collection.provisionalRecords !== 0 ||
  batch.collection.newFullSourceTexts !== 1 ||
  batch.collection.newPartialSourceWitnesses !== 0 ||
  batch.collection.relationAnnotatedRecords !== 1 ||
  batch.collection.attributionBoundaryRecords !== 1 ||
  batch.collection.newWorks !== 1
) throw new Error(`T27 关系、归属或作品边界统计漂移：${JSON.stringify(batch.collection)}`);

await writeFile(resolve(root, `data/corpus/cbeta/batch-v${version}.json`), `${JSON.stringify(batch, null, 2)}\n`, "utf8");
console.log(`CBETA T27 审计完成：1/1 个固定来源记录；新增 ${batch.collection.newWorks} 个作品、${batch.collection.newSourceRecords} 个表达、${batch.collection.newStableSegments} 个稳定行段。`);

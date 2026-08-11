import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { buildPageNavigation, parseCbetaReadingLines } from "../src/lib/cbeta-tei.mjs";

const root = process.cwd();
const version = "1.3.0";
const expectedCommit = "2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9";
const sourceArgument = process.argv.find((argument) => argument.startsWith("--source-dir="));
if (!sourceArgument) {
  console.error("用法：node scripts/audit-cbeta-agama.mjs --source-dir=/固定提交的/xml-p5");
  process.exit(1);
}
const sourceRoot = resolve(sourceArgument.slice("--source-dir=".length));
const actualCommit = execFileSync("git", ["-C", sourceRoot, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (actualCommit !== expectedCommit) throw new Error(`上游工作树必须固定到 ${expectedCommit}`);

const inventory = JSON.parse(await readFile(resolve(root, "data/gbcr/cbeta-taisho-sutra-inventory-v0.2.1.json"), "utf8"));
const baseCatalog = JSON.parse(await readFile(resolve(root, "data/corpus/cbeta/catalog-v0.6.0.json"), "utf8"));
const sourceUnits = (file) => file.sourceParts ?? [file];
const controlledPaths = new Set(baseCatalog.files.flatMap(sourceUnits).map((file) => file.upstreamPath));
const candidates = inventory.records.filter((record) =>
  ["T01", "T02"].includes(record.volume) && !controlledPaths.has(record.upstreamPath),
);
if (candidates.length !== 151) throw new Error(`T01–T02 应新增 151 个来源记录，实际为 ${candidates.length}`);
if (candidates.reduce((sum, record) => sum + record.upstreamBytes, 0) !== 10508944) {
  throw new Error("T01–T02 新增来源字节数漂移");
}

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const gitBlobSha1 = (value) => createHash("sha1").update(`blob ${value.length}\0`).update(value).digest("hex");
const matchRequired = (text, pattern, label, id) => {
  const value = text.match(pattern)?.[1]?.trim();
  if (!value) throw new Error(`${id} 缺少 ${label}`);
  return value;
};
const translatorLabel = (author) => author === "失譯" ? author : author.replace(" ", " · ");
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
  const author = matchRequired(text, /<author>([^<]+)<\/author>/, "译者题记", record.sourceRecordId);
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

  files.push({
    id: canonId,
    slug: `taisho-${canonId.toLowerCase()}`,
    workId: `gbcr:work:taisho-${canonId.toLowerCase()}`,
    workIdentityStatus: "provisional_canon_record",
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
      tradition: "漢傳佛教 · 阿含部",
      language: "漢文",
      canonRef: `大正藏 ${record.volume}, no. ${displayNumber(canonId)}`,
      translator: translatorLabel(author),
      summary: `${extent}。本站完整保存 ${canonId} 的固定 CBETA TEI 文本与可校验页栏行锚点；作品同一性与异译关系仍待跨目录校勘，不把一个经号记录自动等同于全球去重作品。`,
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
  schema: "https://foxue.ai/schemas/cbeta-controlled-batch-v0.3",
  version,
  publishedAt: "2026-08-12",
  baseCatalog: "data/corpus/cbeta/catalog-v0.6.0.json",
  inventory: "data/gbcr/cbeta-taisho-sutra-inventory-v0.2.1.json",
  rightsCategory: "Individually reviewed CBETA TEI files in Taishō volumes 1–17 and 19; T01–T02 source-record closure",
  workOverrides: {},
  collection: {
    id: "CBETA-TAISHO-T01-T02",
    title: "大正藏 T01–T02 阿含部固定来源记录",
    sourceRecordDenominator: 155,
    previouslyControlledSourceRecords: 4,
    newSourceRecords: files.length,
    controlledSourceRecords: 155,
    newSourceBytes: files.reduce((sum, file) => sum + file.upstreamBytes, 0),
    newStableSegments: files.reduce((sum, file) => sum + file.verification.segments, 0),
    newFolios: files.reduce((sum, file) => sum + file.verification.folios, 0),
    workCountingDecision: "151 个新增大正藏经号先以 provisional_canon_record 建立可追踪作品实体；这保证每份文本可寻址，但不宣称已经完成异译、别本与平行经去重。T01–T02 的 155 是固定来源记录完整性，不是全球作品覆盖率。",
  },
  files,
};
await writeFile(
  resolve(root, `data/corpus/cbeta/batch-v${version}.json`),
  `${JSON.stringify(batch, null, 2)}\n`,
  "utf8",
);
console.log(
  `CBETA 阿含部审计完成：T01–T02 155/155 个固定来源记录；新增 ${files.length} 个记录、${batch.collection.newStableSegments} 个稳定行段。`,
);

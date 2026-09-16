import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const dataPath = "src/data/xinjing-apparatus.json";
const catalogPath = "data/corpus/cbeta/catalog-v4.23.0.json";
const apparatus = JSON.parse(readFileSync(dataPath, "utf8"));
const xml = readFileSync(apparatus.source.xmlPath, "utf8");
const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));

function decodeXml(value) {
  return value
    .replace(/<[^>]+>/g, "")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .trim();
}

function compact(value) {
  return value.replace(/\s+/g, "");
}

function notesByType(type) {
  return [...xml.matchAll(/<note\b([^>]*)>([\s\S]*?)<\/note>/g)]
    .filter((match) => new RegExp(`\\btype="${type}"`).test(match[1]))
    .map((match) => ({
      n: match[1].match(/\bn="([^"]+)"/)?.[1],
      text: decodeXml(match[2]),
    }));
}

function lineText(locator) {
  const sourceLine = locator.match(/\.(\d{4}[abc]\d{2})$/)?.[1];
  if (!sourceLine) throw new Error(`无效稳定行号：${locator}`);
  const matches = [...xml.matchAll(/<lb\b(?=[^>]*\bn="(\d{4}[abc]\d{2})")[^>]*\/>/g)];
  const index = matches.findIndex((match) => match[1] === sourceLine);
  if (index < 0) throw new Error(`TEI 中不存在稳定行：${locator}`);
  const current = matches[index];
  const next = matches[index + 1];
  const start = (current.index ?? 0) + current[0].length;
  const end = next?.index ?? xml.length;
  return decodeXml(xml.slice(start, end));
}

if (apparatus.source.catalogVersion !== catalog.version) {
  throw new Error("《心经》校记数据登记的目录版本与 CBETA 目录不一致");
}

if (apparatus.source.upstreamCommit !== catalog.source.commit) {
  throw new Error("《心经》校记数据登记的 CBETA 上游提交与目录不一致");
}

const catalogRecord = catalog.files.find((file) => file.id === apparatus.source.canon);
if (!catalogRecord) throw new Error("CBETA 目录缺少 T0251 记录");
if (catalogRecord.localPath !== apparatus.source.xmlPath) {
  throw new Error("《心经》校记数据指向的 TEI 路径与受控目录不一致");
}

const sha256 = createHash("sha256").update(xml).digest("hex");
if (sha256 !== apparatus.source.localSha256 || sha256 !== catalogRecord.localSha256) {
  throw new Error("《心经》校记来源指纹与固定 TEI 文件不一致");
}

if (apparatus.witnesses.length !== 6) {
  throw new Error("《心经》校记必须完整登记当前 T0251 的 6 个见证标记");
}

for (const witness of apparatus.witnesses) {
  const expected = `<witness xml:id="${witness.id}">${witness.code}</witness>`;
  if (!xml.includes(expected)) {
    throw new Error(`TEI 见证图例不匹配：${witness.id} ${witness.code}`);
  }
}

const modernNotes = notesByType("mod");
const originalNotes = notesByType("orig");
if (apparatus.variants.length !== 5) {
  throw new Error("《心经》校记书案必须恰好收录 5 组现代校注");
}
if (apparatus.sourceNotes.length !== 2) {
  throw new Error("《心经》校记书案必须恰好收录 2 条相关大正藏原注");
}
if (modernNotes.length !== apparatus.variants.length) {
  throw new Error("《心经》校记书案没有完整覆盖固定 TEI 中的现代校注");
}
if (originalNotes.length !== apparatus.variants.length + apparatus.sourceNotes.length) {
  throw new Error("《心经》校记书案没有完整覆盖固定 TEI 中的大正藏原注");
}

const ids = new Set();
for (const variant of apparatus.variants) {
  if (ids.has(variant.id)) throw new Error(`《心经》校记存在重复 note 编号：${variant.id}`);
  ids.add(variant.id);

  const modern = modernNotes.find((note) => note.n === variant.id);
  const original = originalNotes.find((note) => note.n === variant.id);
  if (modern?.text !== variant.sourceNote) {
    throw new Error(`NOTE ${variant.id} 的 CBETA 校注转录与 TEI 不一致`);
  }
  if (original?.text !== variant.taishoNote) {
    throw new Error(`NOTE ${variant.id} 的大正藏原注转录与 TEI 不一致`);
  }
  if (variant.href !== `/jingzang/xinjing/001-0848c#${variant.locator}`) {
    throw new Error(`NOTE ${variant.id} 没有回到自己的稳定行号`);
  }

  const sourceLine = compact(lineText(variant.locator));
  if (!sourceLine.includes(compact(variant.readerExcerpt))) {
    throw new Error(`NOTE ${variant.id} 的站内正文摘录与 TEI 行文不一致`);
  }
  if (!sourceLine.includes(compact(variant.focus))) {
    throw new Error(`NOTE ${variant.id} 的采用读法没有出现在对应 TEI 行文中`);
  }
}

for (const note of apparatus.sourceNotes) {
  const original = originalNotes.find((item) => item.n === note.id);
  if (original?.text !== note.text) {
    throw new Error(`NOTE ${note.id} 的大正藏来源注转录与 TEI 不一致`);
  }
  if (note.href !== `/jingzang/xinjing/001-0848c#${note.locator}`) {
    throw new Error(`NOTE ${note.id} 没有回到自己的稳定行号`);
  }
  lineText(note.locator);
}

const coveredOriginalIds = new Set([
  ...apparatus.variants.map((variant) => variant.id),
  ...apparatus.sourceNotes.map((note) => note.id),
]);
for (const note of originalNotes) {
  if (!coveredOriginalIds.has(note.n)) {
    throw new Error(`《心经》校记书案遗漏大正藏原注：NOTE ${note.n}`);
  }
}

console.log(
  `心经校记校验通过：${apparatus.variants.length} 组异读、${apparatus.sourceNotes.length} 条原注、${apparatus.witnesses.length} 个见证标记；来源 SHA-256 ${sha256}`,
);

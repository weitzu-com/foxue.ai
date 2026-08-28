import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import { parseCbetaReadingLines } from "../src/lib/cbeta-tei.mjs";

const dataSource = fs.readFileSync("src/data/amituojing-learning-path.ts", "utf8");
const compiled = ts.transpileModule(dataSource, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const sandbox = { exports: {}, module: { exports: {} } };
sandbox.exports = sandbox.module.exports;
vm.runInNewContext(compiled, sandbox);

const days = sandbox.module.exports.amituojingLearningDays;
const corpora = new Map([
  [
    "T0366",
    parseCbetaReadingLines(
      fs.readFileSync("data/corpus/cbeta/T12n0366.xml", "utf8"),
      { canonId: "T0366" },
    ),
  ],
  [
    "T0367",
    parseCbetaReadingLines(
      fs.readFileSync("data/corpus/cbeta/T12n0367.xml", "utf8"),
      { canonId: "T0367" },
    ),
  ],
]);

function parseLocator(locator) {
  const match = locator.match(
    /^(T\d{4})\.(\d{3})\.(\d{4}[abc])(\d{2})–(?:(\d{4}[abc]))?(\d{2})$/,
  );
  if (!match) throw new Error(`无效的稳定行段：${locator}`);
  const [, canonId, juan, startPage, startLine, explicitEndPage, endLine] = match;
  const endPage = explicitEndPage ?? startPage;
  return {
    canonId,
    startId: `${canonId}.${juan}.${startPage}${startLine}`,
    endId: `${canonId}.${juan}.${endPage}${endLine}`,
    folio: `${juan}-${startPage}`,
  };
}

function segmentsForLocator(locator) {
  const parsed = parseLocator(locator);
  const corpus = corpora.get(parsed.canonId);
  if (!corpus) throw new Error(`未加载 ${parsed.canonId} 语料。`);
  const start = corpus.findIndex((segment) => segment.id === parsed.startId);
  const end = corpus.findIndex((segment) => segment.id === parsed.endId);
  if (start < 0 || end < start) {
    throw new Error(`${locator} 无法在 ${parsed.canonId} TEI 中解析。`);
  }
  return { parsed, segments: corpus.slice(start, end + 1) };
}

if (!Array.isArray(days) || days.length !== 7) {
  throw new Error("《佛说阿弥陀经》研读路径必须恰好包含 7 日。");
}

const seenAnchors = new Set();
for (const [index, day] of days.entries()) {
  if (day.id !== index + 1) {
    throw new Error(`《佛说阿弥陀经》日期不连续：位置 ${index + 1} 的 id 为 ${day.id}。`);
  }
  if (seenAnchors.has(day.segmentId)) {
    throw new Error(`重复使用原典锚点：${day.segmentId}`);
  }
  seenAnchors.add(day.segmentId);

  for (const field of ["title", "focus", "reading", "practice", "context", "versionNote"]) {
    if (typeof day[field] !== "string" || day[field].trim().length < 4) {
      throw new Error(`第 ${day.id} 日缺少 ${field} 内容。`);
    }
  }
  if ([day.practice, day.context, day.versionNote].some((text) => text === day.reading)) {
    throw new Error(`第 ${day.id} 日把编辑辅助层复制成了经文。`);
  }

  const primary = segmentsForLocator(day.locator);
  if (primary.parsed.canonId !== "T0366") {
    throw new Error(`第 ${day.id} 日阅读底本不是 T0366：${day.locator}`);
  }
  const sourceText = primary.segments.map((segment) => segment.text).join("");
  if (!sourceText.includes(day.reading)) {
    throw new Error(`第 ${day.id} 日引文不是 ${day.locator} 中的逐字片段。`);
  }
  if (!primary.segments.some((segment) => segment.id === day.segmentId)) {
    throw new Error(`第 ${day.id} 日锚点 ${day.segmentId} 不在声明行段内。`);
  }
  const expectedPrimaryHref = `/jingzang/amituojing/${primary.parsed.folio}#${day.segmentId}`;
  if (day.href !== expectedPrimaryHref) {
    throw new Error(`第 ${day.id} 日 T0366 链接错误：${day.href}`);
  }

  const parallel = segmentsForLocator(day.parallelLocator);
  if (parallel.parsed.canonId !== "T0367") {
    throw new Error(`第 ${day.id} 日相关译本不是 T0367：${day.parallelLocator}`);
  }
  const expectedParallelHref =
    `/jingzang/taisho-t0367/${parallel.parsed.folio}#${parallel.parsed.startId}`;
  if (day.parallelHref !== expectedParallelHref) {
    throw new Error(`第 ${day.id} 日 T0367 相关段落链接错误：${day.parallelHref}`);
  }
}

console.log("Verified 7 《佛说阿弥陀经》 excerpts against T0366 and related T0367 stable lines.");

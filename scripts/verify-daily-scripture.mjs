import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";

const dataPath = "src/data/daily-scripture.ts";
const moduleCache = new Map();

function resolveLocalModule(specifier, parentPath) {
  const unresolved = specifier.startsWith("@/")
    ? path.resolve("src", specifier.slice(2))
    : path.resolve(path.dirname(parentPath), specifier);
  for (const candidate of [unresolved, `${unresolved}.ts`, `${unresolved}.tsx`]) {
    if (fs.existsSync(candidate)) return candidate;
  }
  throw new Error(`无法解析本地 TypeScript 模块：${specifier}（来自 ${parentPath}）`);
}

function loadTypeScriptModule(modulePath) {
  const absolutePath = path.resolve(modulePath);
  if (moduleCache.has(absolutePath)) return moduleCache.get(absolutePath).exports;

  const loadedModule = { exports: {} };
  moduleCache.set(absolutePath, loadedModule);
  const dataSource = fs.readFileSync(absolutePath, "utf8");
  const compiled = ts.transpileModule(dataSource, {
    fileName: absolutePath,
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const nativeRequire = createRequire(absolutePath);
  const localRequire = (specifier) =>
    specifier.startsWith("@/") || specifier.startsWith(".")
      ? loadTypeScriptModule(resolveLocalModule(specifier, absolutePath))
      : nativeRequire(specifier);
  const sandbox = {
    exports: loadedModule.exports,
    module: loadedModule,
    require: localRequire,
    __dirname: path.dirname(absolutePath),
    __filename: absolutePath,
  };
  vm.runInNewContext(compiled, sandbox, { filename: absolutePath });
  return loadedModule.exports;
}

const { dailyScripturePassages: passages, dailyScriptureSeries: series } = loadTypeScriptModule(dataPath);
const workByCanon = {
  T0099: { route: "zaahanjing", source: "data/corpus/cbeta/T02n0099.xml" },
  T0102: { route: "taisho-t0102", source: "data/corpus/cbeta/T02n0102.xml" },
  T0210: { route: "fajujing", source: "data/corpus/cbeta/T04n0210.xml" },
  T0235: { route: "jingangjing", source: "data/corpus/cbeta/T08n0235.xml" },
  T0251: { route: "xinjing", source: "data/corpus/cbeta/T08n0251.xml" },
  T0262: { route: "fahuajing", source: "data/corpus/cbeta/T09n0262.xml" },
  T0366: { route: "amituojing", source: "data/corpus/cbeta/T12n0366.xml" },
  T0801: { route: "taisho-t0801", source: "data/corpus/cbeta/T17n0801.xml" },
};

function decodeXmlText(value) {
  return value
    .replace(/<note\b[\s\S]*?<\/note>/g, "")
    .replace(/<[^>]+>/g, "")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replace(/\s+/g, "");
}

const sourceLineCache = new Map();
function sourceLines(sourcePath) {
  if (sourceLineCache.has(sourcePath)) return sourceLineCache.get(sourcePath);
  const source = fs.readFileSync(sourcePath, "utf8");
  const matches = [...source.matchAll(/<lb\b(?=[^>]*\bn="(\d{4}[abc]\d{2})")[^>]*\/>/g)];
  const lines = new Map();
  for (let index = 0; index < matches.length; index += 1) {
    const current = matches[index];
    const next = matches[index + 1];
    const start = (current.index ?? 0) + current[0].length;
    const end = next?.index ?? source.length;
    lines.set(current[1], decodeXmlText(source.slice(start, end)));
  }
  sourceLineCache.set(sourcePath, lines);
  return lines;
}

if (!Array.isArray(passages) || passages.length !== 30) {
  throw new Error("“今日原典”必须恰好包含 30 段受控原文，形成完整月读清单。");
}

if (!Array.isArray(series) || series.length !== 6) {
  throw new Error("三十段原典必须分成 6 组明确阅读路径。");
}

const ids = new Set();
const seriesIds = new Set(series.map((item) => item.id));
const seriesCounts = new Map(series.map((item) => [item.id, 0]));
for (const passage of passages) {
  if (ids.has(passage.id)) throw new Error(`“今日原典”存在重复 id：${passage.id}`);
  ids.add(passage.id);

  if (!seriesIds.has(passage.series)) {
    throw new Error(`${passage.id} 使用了未知阅读组：${passage.series}`);
  }
  seriesCounts.set(passage.series, (seriesCounts.get(passage.series) ?? 0) + 1);

  for (const field of [
    "workTitle",
    "witness",
    "quote",
    "locator",
    "sourceHref",
    "studyHref",
    "quietPrompt",
    "context",
    "verification",
  ]) {
    if (typeof passage[field] !== "string" || !passage[field].trim()) {
      throw new Error(`${passage.id} 缺少字段：${field}`);
    }
  }

  const [startId, endSuffix] = passage.locator.split("–");
  const startMatch = startId.match(/^(T\d{4})\.(\d{3})\.(\d{4}[abc])(\d{2})$/);
  if (!startMatch) throw new Error(`${passage.id} 使用了无效行段：${passage.locator}`);

  const [, canon, juan, folio, startLineText] = startMatch;
  const work = workByCanon[canon];
  if (!work || !fs.existsSync(work.source)) {
    throw new Error(`${passage.id} 没有受控 CBETA 来源映射：${canon}`);
  }

  const startLine = Number(startLineText);
  const endLine = endSuffix ? Number(endSuffix) : startLine;
  if (!Number.isInteger(endLine) || endLine < startLine) {
    throw new Error(`${passage.id} 的结束行无效：${passage.locator}`);
  }

  const linePrefix = `${canon}.${juan}.${folio}`;
  const lines = sourceLines(work.source);
  const sourceText = Array.from(
    { length: endLine - startLine + 1 },
    (_, offset) => lines.get(`${folio}${String(startLine + offset).padStart(2, "0")}`) ?? "",
  ).join("");

  if (!sourceText.includes(passage.quote.replace(/\s+/g, ""))) {
    throw new Error(`${passage.id} 的引文不是 ${passage.locator} 中的逐字片段。`);
  }

  const expectedAnchor = `${linePrefix}${startLineText}`;
  const expectedHref = `/jingzang/${work.route}/${juan}-${folio}#${expectedAnchor}`;
  if (passage.sourceHref !== expectedHref) {
    throw new Error(`${passage.id} 的原典链接应为 ${expectedHref}，实际为 ${passage.sourceHref}`);
  }

  if (passage.quietPrompt.includes(passage.quote) || passage.context.includes(passage.quote)) {
    throw new Error(`${passage.id} 把编辑辅助层与原文重复混写。`);
  }
}

for (const item of series) {
  const count = seriesCounts.get(item.id) ?? 0;
  if (count === 0) throw new Error(`阅读组 ${item.id} 没有任何受控原文。`);
}

console.log(`Verified ${passages.length} daily scripture excerpts across ${series.length} reading series against stable CBETA source lines.`);

import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import { parseCbetaReadingLines } from "../src/lib/cbeta-tei.mjs";
import { parseSatReadingLines } from "../src/lib/sat-tei.mjs";

const dataSource = fs.readFileSync("src/data/fahuajing-reading-path.ts", "utf8");
const compiled = ts.transpileModule(dataSource, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const sandbox = { exports: {}, module: { exports: {} } };
sandbox.exports = sandbox.module.exports;
vm.runInNewContext(compiled, sandbox);

const gates = sandbox.module.exports.fahuajingReadingGates;
const chineseSegments = parseCbetaReadingLines(
  fs.readFileSync("data/corpus/cbeta/T09n0262.xml", "utf8"),
  { canonId: "T0262" },
);
const englishSegments = parseSatReadingLines(
  fs.readFileSync("data/corpus/gutenberg/lotus-sutra-soothill-1930.xml", "utf8"),
  { canonId: "GUTENBERG-LOTUS-SOOTHILL-1930" },
);
const soothillManifest = JSON.parse(
  fs.readFileSync("data/corpus/gutenberg/lotus-sutra-soothill-manifest-v1.0.0.json", "utf8"),
);

const expectedChapters = [2, 3, 5, 10, 15, 16, 25];
if (!Array.isArray(gates) || gates.length !== 7) {
  throw new Error("《法华经》研读路径必须恰好包含 7 个阅读关口。");
}

for (const [index, gate] of gates.entries()) {
  if (gate.id !== index + 1 || gate.chapter !== expectedChapters[index]) {
    throw new Error(`《法华经》第 ${index + 1} 关的顺序或品次发生漂移。`);
  }

  const [startId, endSuffix] = gate.locator.split("–");
  const startMatch = startId.match(/^(T0262\.\d{3}\.\d{4}[abc])(\d{2})$/);
  if (!startMatch) {
    throw new Error(`第 ${gate.id} 关使用了无效的 T0262 行段：${gate.locator}`);
  }

  const startLine = Number(startMatch[2]);
  const endLine = endSuffix ? Number(endSuffix) : startLine;
  const segments = chineseSegments.filter((segment) =>
    segment.id.startsWith(startMatch[1])
      && Number(segment.id.slice(-2)) >= startLine
      && Number(segment.id.slice(-2)) <= endLine,
  );
  const sourceText = segments.map((segment) => segment.text).join("");

  if (!sourceText.includes(gate.reading)) {
    throw new Error(`第 ${gate.id} 关引文不是 ${gate.locator} 中的逐字片段。`);
  }
  if (!segments.some((segment) => segment.id === gate.segmentId)) {
    throw new Error(`第 ${gate.id} 关锚点 ${gate.segmentId} 不在声明行段内。`);
  }
  if (!gate.href.endsWith(`#${gate.segmentId}`)) {
    throw new Error(`第 ${gate.id} 关原典链接没有落到声明锚点。`);
  }

  const englishAnchor = gate.englishHref.split("#")[1];
  const englishSegment = englishSegments.find((segment) => segment.id === englishAnchor);
  const expectedPage = `c${String(gate.chapter).padStart(2, "0")}`;
  if (!englishSegment || englishSegment.page !== expectedPage) {
    throw new Error(`第 ${gate.id} 关的 Soothill 同品见证不存在或品次不符。`);
  }
  if (!gate.englishHref.includes(`/001-${expectedPage}#`)) {
    throw new Error(`第 ${gate.id} 关的 Soothill 链接没有落到第 ${gate.chapter} 品。`);
  }
}

const soothillFile = soothillManifest.files?.[0];
if (
  soothillFile?.verification?.chapterCount !== 28
  || soothillFile?.verification?.sentenceAlignedToT0262 !== false
  || soothillManifest.rightsDecision?.status !== "approved_us_public_domain_with_jurisdiction_notice"
) {
  throw new Error("Soothill 28 品、未逐句对齐或美国公版边界发生漂移。");
}

console.log("Verified 7 《法华经》 reading gates against T0262 and same-chapter Soothill witnesses.");

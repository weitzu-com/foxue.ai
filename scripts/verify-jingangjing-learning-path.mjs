import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const dataSource = fs.readFileSync("src/data/jingangjing-learning-path.ts", "utf8");
const compiled = ts.transpileModule(dataSource, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const sandbox = { exports: {}, module: { exports: {} } };
sandbox.exports = sandbox.module.exports;
vm.runInNewContext(compiled, sandbox);

const days = sandbox.module.exports.jingangjingLearningDays;
const corpus = JSON.parse(
  fs.readFileSync("src/data/work-landing-text.generated.json", "utf8"),
).works.jingangjing.segments;

if (!Array.isArray(days) || days.length !== 7) {
  throw new Error("《金刚经》研读路径必须恰好包含 7 日。");
}

for (const [index, day] of days.entries()) {
  if (day.id !== index + 1) {
    throw new Error(`《金刚经》研读路径日期不连续：位置 ${index + 1} 的 id 为 ${day.id}。`);
  }

  const [startId, endSuffix] = day.locator.split("–");
  const startMatch = startId.match(/^(T0235\.001\.\d{4}[abc])(\d{2})$/);
  if (!startMatch) {
    throw new Error(`第 ${day.id} 日使用了无效的 T0235 行段：${day.locator}`);
  }

  const startLine = Number(startMatch[2]);
  const endLine = endSuffix ? Number(endSuffix) : startLine;
  const segments = corpus.filter((segment) =>
    segment.id.startsWith(startMatch[1])
      && Number(segment.id.slice(-2)) >= startLine
      && Number(segment.id.slice(-2)) <= endLine,
  );
  const sourceText = segments.map((segment) => segment.text).join("");

  if (!sourceText.includes(day.reading)) {
    throw new Error(`第 ${day.id} 日引文不是 ${day.locator} 中的逐字片段。`);
  }
  if (!segments.some((segment) => segment.id === day.segmentId)) {
    throw new Error(`第 ${day.id} 日锚点 ${day.segmentId} 不在声明行段内。`);
  }
  if (!day.href.endsWith(`#${day.segmentId}`)) {
    throw new Error(`第 ${day.id} 日链接没有落到声明锚点 ${day.segmentId}。`);
  }
}

console.log("Verified 7 《金刚经》 learning-path excerpts against T0235 stable lines.");

import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const dataPath = "src/data/daily-scripture.ts";
const dataSource = fs.readFileSync(dataPath, "utf8");
const compiled = ts.transpileModule(dataSource, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const sandbox = { exports: {}, module: { exports: {} } };
sandbox.exports = sandbox.module.exports;
vm.runInNewContext(compiled, sandbox);

const passages = sandbox.module.exports.dailyScripturePassages;
const works = JSON.parse(
  fs.readFileSync("src/data/work-landing-text.generated.json", "utf8"),
).works;
const workByCanon = {
  T0210: { slug: "fajujing", route: "fajujing" },
  T0235: { slug: "jingangjing", route: "jingangjing" },
  T0251: { slug: "xinjing", route: "xinjing" },
};

if (!Array.isArray(passages) || passages.length < 9) {
  throw new Error("“今日原典”必须至少包含 9 段受控原文，避免伪装成每日轮换的固定卡片。");
}

const ids = new Set();
for (const passage of passages) {
  if (ids.has(passage.id)) throw new Error(`“今日原典”存在重复 id：${passage.id}`);
  ids.add(passage.id);

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
  if (!work || !works[work.slug]) throw new Error(`${passage.id} 没有受控作品映射：${canon}`);

  const startLine = Number(startLineText);
  const endLine = endSuffix ? Number(endSuffix) : startLine;
  if (!Number.isInteger(endLine) || endLine < startLine) {
    throw new Error(`${passage.id} 的结束行无效：${passage.locator}`);
  }

  const linePrefix = `${canon}.${juan}.${folio}`;
  const segments = works[work.slug].segments.filter((segment) => {
    if (!segment.id.startsWith(linePrefix)) return false;
    const line = Number(segment.id.slice(-2));
    return line >= startLine && line <= endLine;
  });
  const sourceText = segments.map((segment) => segment.text).join("");

  if (!sourceText.includes(passage.quote)) {
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

console.log(`Verified ${passages.length} daily scripture excerpts against stable source lines.`);

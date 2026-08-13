import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const version = "0.1.0";
const inputPath = "data/gbcr/suttacentral-chinese-parallels-v0.7.0.json";
const outputPath = `data/gbcr/suttacentral-chinese-parallel-reader-index-v${version}.json`;
const inputRaw = await readFile(resolve(root, inputPath), "utf8");
const input = JSON.parse(inputRaw);
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const requireValue = (condition, message) => {
  if (!condition) throw new Error(message);
};
const decisionOrder = {
  full_parallel_without_automatic_work_merge: 0,
  component_parallel_within_registered_work: 2,
  resembling_or_partial_parallel: 3,
  citation_or_mention_only: 4,
};

requireValue(input.version === "0.7.0", "汉巴平行证据账本版本不匹配");
requireValue(input.summary?.deduplicatedParallelEdges === 5161, "汉巴平行证据边数漂移");

const drafts = new Map();
for (const edge of input.parallels) {
  for (const [side, counterpartSide] of [["pali", "chinese"], ["chinese", "pali"]]) {
    const current = edge[side];
    const counterpart = edge[counterpartSide];
    if (!current.localSlug || !counterpart.localSlug) continue;
    const draft = drafts.get(current.localSlug) ?? {
      edgeCount: 0,
      decisionClasses: {},
      counterpartWorkIds: new Set(),
      candidates: [],
    };
    draft.edgeCount += 1;
    draft.decisionClasses[edge.decisionClass] = (draft.decisionClasses[edge.decisionClass] ?? 0) + 1;
    draft.counterpartWorkIds.add(counterpart.workId);
    draft.candidates.push({
      id: edge.id,
      decisionClass: edge.decisionClass,
      currentReference: current.reference,
      counterpartReference: counterpart.reference,
      counterpartTitle: counterpart.title,
      counterpartSlug: counterpart.localSlug,
      counterpartWorkId: counterpart.workId,
      counterpartLanguage: counterpartSide === "pali" ? "巴利" : "汉译",
      hasUpstreamRemark: Boolean(edge.remark),
      upstreamType: edge.upstreamType,
    });
    drafts.set(current.localSlug, draft);
  }
}

const records = {};
for (const slug of [...drafts.keys()].sort((left, right) => left.localeCompare(right, "en", { numeric: true }))) {
  const draft = drafts.get(slug);
  const seen = new Set();
  const examples = draft.candidates
    .sort((left, right) => {
      const leftRank = left.decisionClass === "full_parallel_without_automatic_work_merge"
        ? 0
        : left.hasUpstreamRemark ? 1 : decisionOrder[left.decisionClass];
      const rightRank = right.decisionClass === "full_parallel_without_automatic_work_merge"
        ? 0
        : right.hasUpstreamRemark ? 1 : decisionOrder[right.decisionClass];
      return leftRank - rightRank
        || left.counterpartReference.localeCompare(right.counterpartReference, "en", { numeric: true })
        || left.currentReference.localeCompare(right.currentReference, "en", { numeric: true });
    })
    .filter((item) => {
      const key = [item.counterpartWorkId, item.currentReference, item.counterpartReference, item.decisionClass].join("\t");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 4);
  records[slug] = {
    edgeCount: draft.edgeCount,
    counterpartWorks: draft.counterpartWorkIds.size,
    decisionClasses: Object.fromEntries(Object.entries(draft.decisionClasses).sort(([left], [right]) => left.localeCompare(right))),
    examples,
  };
}

const document = {
  schema: "https://foxue.ai/schemas/gbcr/suttacentral-chinese-parallel-reader-index-v0.1",
  version,
  generatedAt: "2026-08-14",
  generatedFrom: {
    file: inputPath,
    version: input.version,
    sha256: sha256(inputRaw),
    sourceCommit: input.source.commit,
  },
  policy: {
    completeLedgerEmbeddedInPages: false,
    automaticWorkMerge: false,
    segmentAlignmentAsserted: false,
    examplesPerSlug: 4,
  },
  summary: {
    indexedSlugs: Object.keys(records).length,
    directionalSlugAssociations: Object.values(records).reduce((sum, record) => sum + record.edgeCount, 0),
    completeLedgerEdges: input.summary.deduplicatedParallelEdges,
  },
  records,
};

requireValue(document.summary.indexedSlugs === 393, "阅读页汉巴证据索引的文本数漂移");
requireValue(document.summary.directionalSlugAssociations === 10322, "阅读页汉巴证据索引的双向关联数漂移");
requireValue(document.records["digha-nikaya-dn1"]?.examples?.[0]?.counterpartReference === "t21", "DN1 代表性整经平行关系缺失");
requireValue(document.records["majjhima-nikaya-mn1"]?.examples?.[0]?.counterpartReference === "ma106", "MN1 带备注的部分平行关系缺失");

const outputRaw = `${JSON.stringify(document, null, 2)}\n`;
if (process.argv.includes("--verify")) {
  requireValue(await readFile(resolve(root, outputPath), "utf8") === outputRaw, `${outputPath} 不可复现`);
  console.log(`汉巴阅读页索引 v${version} 可复现：${document.summary.indexedSlugs} 部站内文本、${document.summary.directionalSlugAssociations} 条双向页面关联。`);
} else {
  await writeFile(resolve(root, outputPath), outputRaw, "utf8");
  console.log(`汉巴阅读页索引 v${version} 已生成：${document.summary.indexedSlugs} 部站内文本。`);
}

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const version = "0.1.0";
const snapshotVersion = "4.4.0";
const expectedCommit = "2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9";
const expectedTree = "f83fede8f44bdc11f5bae3bc2501bb101495d80c";
const sourceArgument = process.argv.find((argument) => argument.startsWith("--source-dir="));
if (!sourceArgument) {
  console.error("用法：node scripts/snapshot-cbeta-t85.mjs --source-dir=/固定提交的/xml-p5 [--write|--verify]");
  process.exit(1);
}
const sourceRoot = resolve(sourceArgument.slice("--source-dir=".length));
const actualCommit = execFileSync("git", ["-C", sourceRoot, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (actualCommit !== expectedCommit) throw new Error(`上游工作树必须固定到 ${expectedCommit}`);
const actualTree = execFileSync("git", ["-C", sourceRoot, "rev-parse", "HEAD:T/T85"], { encoding: "utf8" }).trim();
if (actualTree !== expectedTree) throw new Error(`T85 Git tree 必须固定到 ${expectedTree}`);

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const digestPaths = (paths) => sha256([...paths].sort().join("\n"));
const treeRaw = execFileSync(
  "git",
  ["-C", sourceRoot, "ls-tree", "-r", "-z", "--long", "HEAD", "T/T85"],
  { maxBuffer: 8 * 1024 * 1024 },
).toString("utf8");
const treeEntries = treeRaw.split("\0").filter(Boolean).map((entry) => {
  const match = entry.match(/^\d+\s+blob\s+([a-f0-9]{40})\s+(\d+)\t(.+)$/);
  if (!match) throw new Error(`无法解析 T85 Git tree 记录：${entry}`);
  return { sha: match[1], size: Number(match[2]), path: match[3] };
}).filter((entry) => /^T\/T85\/T85n[0-9A-Za-z_]+\.xml$/.test(entry.path));

if (treeEntries.length !== 192) throw new Error(`T85 固定来源记录应为 192，实际 ${treeEntries.length}`);
if (treeEntries.reduce((sum, entry) => sum + entry.size, 0) !== 15451526) {
  throw new Error("T85 固定来源字节数漂移");
}

const inventory = {
  schema: "https://foxue.ai/schemas/gbcr/cbeta-volume-source-record-inventory-v0.1",
  version,
  capturedAt: "2026-08-16",
  source: { repository: "cbeta-org/xml-p5", commit: expectedCommit, tree: expectedTree },
  subset: {
    id: "taisho_lost_and_suspected_texts_t85",
    label: "大正藏 T85 古逸部与疑似部固定来源记录",
    inclusionRule: "固定 Git tree 中 T/T85 目录下、文件名卷号一致的 T85n*.xml",
    recordUnit: "TEI P5 source record",
    denominatorCaveat: "T85 的 192 份来源记录混合敦煌等古写本所存经疏、律疏、论疏、禅籍、礼忏、变文、传记、诗文与疑似经。来源记录数不是去重作品数；残卷、同题异本、A/B 同号记录与疑似佛经均须分层建模。疑似部不得因佛说式题名、大藏经位置或传统译者题记而自动标为佛陀逐字亲说。",
  },
  totals: {
    records: treeEntries.length,
    upstreamBytes: treeEntries.reduce((sum, entry) => sum + entry.size, 0),
    candidatePathSha256: digestPaths(treeEntries.map((entry) => entry.path)),
  },
  records: treeEntries.map((entry) => {
    const filename = entry.path.split("/").at(-1);
    const sourceRecordId = filename.replace(/\.xml$/, "");
    return {
      sourceRecordId,
      canonWitnessId: sourceRecordId.replace(/^T85n/, "T"),
      volume: "T85",
      upstreamPath: entry.path,
      upstreamGitBlobSha1: entry.sha,
      upstreamBytes: entry.size,
    };
  }),
};
const inventoryRaw = `${JSON.stringify(inventory, null, 2)}\n`;

const baseSnapshotPath = "data/gbcr/source-snapshots-v4.3.0.json";
const baseSnapshot = JSON.parse(await readFile(resolve(root, baseSnapshotPath), "utf8"));
const cbetaSource = baseSnapshot.sources.find((source) => source.id === "cbeta_xml_p5");
if (!cbetaSource || cbetaSource.commit !== expectedCommit) throw new Error("既有 CBETA 来源快照提交不一致");
if (cbetaSource.candidateSubsets.some((subset) => subset.id === inventory.subset.id)) {
  throw new Error("既有来源快照已经包含 T85 子集");
}

const inventoryPath = `data/gbcr/cbeta-taisho-t85-inventory-v${version}.json`;
const snapshotPath = `data/gbcr/source-snapshots-v${snapshotVersion}.json`;
const snapshot = {
  ...baseSnapshot,
  version: snapshotVersion,
  capturedAt: "2026-08-16",
  derivedFrom: { file: baseSnapshotPath, sha256: sha256(await readFile(resolve(root, baseSnapshotPath))) },
  sources: baseSnapshot.sources.map((source) => source.id === "cbeta_xml_p5"
    ? {
        ...source,
        candidateSubsets: [
          ...source.candidateSubsets,
          {
            id: inventory.subset.id,
            label: inventory.subset.label,
            candidateRecordCount: inventory.totals.records,
            recordUnit: inventory.subset.recordUnit,
            inclusionRule: inventory.subset.inclusionRule,
            candidatePathSha256: inventory.totals.candidatePathSha256,
            candidateBytes: inventory.totals.upstreamBytes,
            inventoryFile: inventoryPath,
            inventorySha256: sha256(inventoryRaw),
            groups: { T85: inventory.totals.records },
            denominatorCaveat: inventory.subset.denominatorCaveat,
          },
        ],
      }
    : source),
};
const snapshotRaw = `${JSON.stringify(snapshot, null, 2)}\n`;

if (process.argv.includes("--verify")) {
  for (const [relativePath, expected] of [[inventoryPath, inventoryRaw], [snapshotPath, snapshotRaw]]) {
    if (await readFile(resolve(root, relativePath), "utf8") !== expected) {
      throw new Error(`${relativePath} 与固定 T85 Git tree 不一致`);
    }
  }
  console.log(`CBETA T85 来源快照可复现：${inventory.totals.records} 份、${inventory.totals.upstreamBytes} 字节。`);
} else if (process.argv.includes("--write")) {
  await writeFile(resolve(root, inventoryPath), inventoryRaw, "utf8");
  await writeFile(resolve(root, snapshotPath), snapshotRaw, "utf8");
  console.log(`CBETA T85 来源快照已写入：${inventory.totals.records} 份、${inventory.totals.upstreamBytes} 字节。`);
} else {
  console.error("必须指定 --write 或 --verify");
  process.exit(1);
}

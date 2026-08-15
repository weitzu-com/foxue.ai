import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const version = "0.1.0";
const snapshotVersion = "4.3.0";
const expectedCommit = "2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9";
const expectedTree = "e7a2e395f478f297ad75d2cbcbc44607394f249a";
const sourceArgument = process.argv.find((argument) => argument.startsWith("--source-dir="));
if (!sourceArgument) {
  console.error("用法：node scripts/snapshot-cbeta-t55.mjs --source-dir=/固定提交的/xml-p5 [--write|--verify]");
  process.exit(1);
}
const sourceRoot = resolve(sourceArgument.slice("--source-dir=".length));
const actualCommit = execFileSync("git", ["-C", sourceRoot, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (actualCommit !== expectedCommit) throw new Error(`上游工作树必须固定到 ${expectedCommit}`);
const actualTree = execFileSync("git", ["-C", sourceRoot, "rev-parse", "HEAD:T/T55"], { encoding: "utf8" }).trim();
if (actualTree !== expectedTree) throw new Error(`T55 Git tree 必须固定到 ${expectedTree}`);

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const digestPaths = (paths) => sha256([...paths].sort().join("\n"));
const treeRaw = execFileSync(
  "git",
  ["-C", sourceRoot, "ls-tree", "-r", "-z", "--long", "HEAD", "T/T55"],
  { maxBuffer: 8 * 1024 * 1024 },
).toString("utf8");
const treeEntries = treeRaw.split("\0").filter(Boolean).map((entry) => {
  const match = entry.match(/^\d+\s+blob\s+([a-f0-9]{40})\s+(\d+)\t(.+)$/);
  if (!match) throw new Error(`无法解析 T55 Git tree 记录：${entry}`);
  return { sha: match[1], size: Number(match[2]), path: match[3] };
}).filter((entry) => /^T\/T55\/T55n[0-9A-Za-z_]+\.xml$/.test(entry.path));

if (treeEntries.length !== 42) throw new Error(`T55 固定来源记录应为 42，实际 ${treeEntries.length}`);
if (treeEntries.reduce((sum, entry) => sum + entry.size, 0) !== 25586209) {
  throw new Error("T55 固定来源字节数漂移");
}

const inventory = {
  schema: "https://foxue.ai/schemas/gbcr/cbeta-volume-source-record-inventory-v0.1",
  version,
  capturedAt: "2026-08-16",
  source: { repository: "cbeta-org/xml-p5", commit: expectedCommit, tree: expectedTree },
  subset: {
    id: "taisho_buddhist_catalogues_t55",
    label: "大正藏 T55 汉地经录、日本入唐请来目录与宗派章疏目录固定来源记录",
    inclusionRule: "固定 Git tree 中 T/T55 目录下、文件名卷号一致的 T55n*.xml",
    recordUnit: "TEI P5 source record",
    denominatorCaveat: "T55 的 42 份来源记录是佛教目录学与知识史原典，不是佛陀逐字亲说的经藏集合。T2146–T2148 同题而时代、作者和范围不同；续录、略出、请来目录与宗派目录必须保持独立作品关系。T2168A/B 与 T2174A/B 共享数字经号但题名和内容不同，不得仅凭 A/B 标识自动归并；未署名责任也不得由相邻记录推定。",
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
      canonWitnessId: sourceRecordId.replace(/^T55n/, "T"),
      volume: "T55",
      upstreamPath: entry.path,
      upstreamGitBlobSha1: entry.sha,
      upstreamBytes: entry.size,
    };
  }),
};
const inventoryRaw = `${JSON.stringify(inventory, null, 2)}\n`;

const baseSnapshotPath = "data/gbcr/source-snapshots-v4.2.0.json";
const baseSnapshot = JSON.parse(await readFile(resolve(root, baseSnapshotPath), "utf8"));
const cbetaSource = baseSnapshot.sources.find((source) => source.id === "cbeta_xml_p5");
if (!cbetaSource || cbetaSource.commit !== expectedCommit) throw new Error("既有 CBETA 来源快照提交不一致");
if (cbetaSource.candidateSubsets.some((subset) => subset.id === inventory.subset.id)) {
  throw new Error("既有来源快照已经包含 T55 子集");
}

const inventoryPath = `data/gbcr/cbeta-taisho-t55-inventory-v${version}.json`;
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
            groups: { T55: inventory.totals.records },
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
      throw new Error(`${relativePath} 与固定 T55 Git tree 不一致`);
    }
  }
  console.log(`CBETA T55 来源快照可复现：${inventory.totals.records} 份、${inventory.totals.upstreamBytes} 字节。`);
} else if (process.argv.includes("--write")) {
  await writeFile(resolve(root, inventoryPath), inventoryRaw, "utf8");
  await writeFile(resolve(root, snapshotPath), snapshotRaw, "utf8");
  console.log(`CBETA T55 来源快照已写入：${inventory.totals.records} 份、${inventory.totals.upstreamBytes} 字节。`);
} else {
  console.error("必须指定 --write 或 --verify");
  process.exit(1);
}

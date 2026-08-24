import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const expectedCommit = "2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9";
const snapshotVersion = "4.7.0";
const inventoryVersion = "0.1.0";
const sourceArgument = process.argv.find((argument) => argument.startsWith("--source-dir="));
if (!sourceArgument) {
  console.error("用法：node scripts/snapshot-cbeta-zhaochen-fangshan.mjs --source-dir=/固定提交的/xml-p5 [--write|--verify]");
  process.exit(1);
}
const sourceRoot = resolve(sourceArgument.slice("--source-dir=".length));
const actualCommit = execFileSync("git", ["-C", sourceRoot, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (actualCommit !== expectedCommit) throw new Error(`上游工作树必须固定到 ${expectedCommit}`);

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const digestPaths = (paths) => sha256([...paths].sort().join("\n"));
const collections = [
  {
    dir: "A",
    expectedTree: "9e2fb08289eaad64a904077ee29fce84ad4482a5",
    expectedRecords: 12,
    expectedBytes: 7592001,
    filePattern: /^A\/A\d+\/A\d+n[0-9A-Za-z]+\.xml$/,
    subset: {
      id: "zhaochen_jinzang",
      label: "趙城金藏固定來源記錄",
      inclusionRule: "固定 Git tree 中 A/ 目錄下、檔名卷號一致的 A*.xml",
      denominatorCaveat: "12 份來源記錄是大正藏未收的趙城金藏補輯，混合音義、經錄、論疏與少數譯經。檔案數不是作品數，也不是嚴格佛說經數。",
    },
    inventoryFile: `data/gbcr/cbeta-zhaochen-inventory-v${inventoryVersion}.json`,
  },
  {
    dir: "F",
    expectedTree: "2ae5f2310b12049c47751c27597439f8e8577fa3",
    expectedRecords: 27,
    expectedBytes: 8371545,
    filePattern: /^F\/F\d+\/F\d+n[0-9A-Za-z]+\.xml$/,
    subset: {
      id: "fangshan_shijing",
      label: "房山石經固定來源記錄",
      inclusionRule: "固定 Git tree 中 F/ 目錄下、檔名卷號一致的 F*.xml",
      denominatorCaveat: "27 份來源記錄是大正藏與卍續藏未收的房山石刻補輯，混合譯經、律、陀羅尼、注疏、道教題名與彙編。檔案數不是佛說經作品數。",
    },
    inventoryFile: `data/gbcr/cbeta-fangshan-inventory-v${inventoryVersion}.json`,
  },
];

function readTree(dir, filePattern) {
  const actualTree = execFileSync("git", ["-C", sourceRoot, "rev-parse", `HEAD:${dir}`], { encoding: "utf8" }).trim();
  const treeRaw = execFileSync(
    "git",
    ["-C", sourceRoot, "ls-tree", "-r", "-z", "--long", "HEAD", dir],
    { maxBuffer: 16 * 1024 * 1024 },
  ).toString("utf8");
  const treeEntries = treeRaw.split("\0").filter(Boolean).map((entry) => {
    const match = entry.match(/^\d+\s+blob\s+([a-f0-9]{40})\s+(\d+)\t(.+)$/);
    if (!match) throw new Error(`無法解析 ${dir} Git tree 記錄：${entry}`);
    return { sha: match[1], size: Number(match[2]), path: match[3] };
  }).filter((entry) => filePattern.test(entry.path));
  return { actualTree, treeEntries };
}

const inventories = collections.map((collection) => {
  const { actualTree, treeEntries } = readTree(collection.dir, collection.filePattern);
  if (actualTree !== collection.expectedTree) {
    throw new Error(`${collection.dir} Git tree 必須固定到 ${collection.expectedTree}`);
  }
  const upstreamBytes = treeEntries.reduce((sum, entry) => sum + entry.size, 0);
  if (treeEntries.length !== collection.expectedRecords) {
    throw new Error(`${collection.dir} 固定來源記錄應為 ${collection.expectedRecords}，實際 ${treeEntries.length}`);
  }
  if (upstreamBytes !== collection.expectedBytes) {
    throw new Error(`${collection.dir} 固定來源位元組數漂移：${upstreamBytes}`);
  }
  const groups = {};
  for (const entry of treeEntries) {
    const volume = entry.path.split("/")[1];
    groups[volume] = (groups[volume] ?? 0) + 1;
  }
  const inventory = {
    schema: "https://foxue.ai/schemas/gbcr/cbeta-volume-source-record-inventory-v0.1",
    version: inventoryVersion,
    capturedAt: "2026-08-24",
    source: { repository: "cbeta-org/xml-p5", commit: expectedCommit, tree: actualTree },
    subset: {
      ...collection.subset,
      recordUnit: "TEI P5 source record",
    },
    totals: {
      records: treeEntries.length,
      upstreamBytes,
      candidatePathSha256: digestPaths(treeEntries.map((entry) => entry.path)),
    },
    records: treeEntries.map((entry) => {
      const filename = entry.path.split("/").at(-1);
      const sourceRecordId = filename.replace(/\.xml$/, "");
      const volume = entry.path.split("/")[1];
      return {
        sourceRecordId,
        canonWitnessId: sourceRecordId,
        volume,
        upstreamPath: entry.path,
        upstreamGitBlobSha1: entry.sha,
        upstreamBytes: entry.size,
      };
    }),
  };
  return { collection, inventory, groups, inventoryRaw: `${JSON.stringify(inventory, null, 2)}\n` };
});

const baseSnapshotPath = "data/gbcr/source-snapshots-v4.6.0.json";
const baseSnapshot = JSON.parse(await readFile(resolve(root, baseSnapshotPath), "utf8"));
const cbetaSource = baseSnapshot.sources.find((source) => source.id === "cbeta_xml_p5");
if (!cbetaSource || cbetaSource.commit !== expectedCommit) throw new Error("既有 CBETA 來源快照提交不一致");
for (const { collection } of inventories) {
  if (cbetaSource.candidateSubsets.some((subset) => subset.id === collection.subset.id)) {
    throw new Error(`既有來源快照已經包含 ${collection.subset.id}`);
  }
}

const snapshotPath = `data/gbcr/source-snapshots-v${snapshotVersion}.json`;
const snapshot = {
  ...baseSnapshot,
  version: snapshotVersion,
  capturedAt: "2026-08-24",
  status: "multi_tradition_candidate_record_inventory_with_zhaochen_fangshan_subsets",
  derivedFrom: {
    file: baseSnapshotPath,
    sha256: sha256(await readFile(resolve(root, baseSnapshotPath))),
  },
  sources: baseSnapshot.sources.map((source) => source.id === "cbeta_xml_p5"
    ? {
        ...source,
        candidateSubsets: [
          ...source.candidateSubsets,
          ...inventories.map(({ collection, inventory, groups, inventoryRaw }) => ({
            id: collection.subset.id,
            label: collection.subset.label,
            candidateRecordCount: inventory.totals.records,
            recordUnit: inventory.subset.recordUnit,
            inclusionRule: collection.subset.inclusionRule,
            candidatePathSha256: inventory.totals.candidatePathSha256,
            candidateBytes: inventory.totals.upstreamBytes,
            inventoryFile: collection.inventoryFile,
            inventorySha256: sha256(inventoryRaw),
            groups,
            denominatorCaveat: collection.subset.denominatorCaveat,
          })),
        ],
      }
    : source),
};
const snapshotRaw = `${JSON.stringify(snapshot, null, 2)}\n`;
const outputs = [
  ...inventories.map(({ collection, inventoryRaw }) => [collection.inventoryFile, inventoryRaw]),
  [snapshotPath, snapshotRaw],
];

if (process.argv.includes("--verify")) {
  for (const [relativePath, expected] of outputs) {
    if (await readFile(resolve(root, relativePath), "utf8") !== expected) {
      throw new Error(`${relativePath} 與固定 CBETA 趙城／房山 Git tree 不一致`);
    }
  }
  console.log(`CBETA 趙城金藏與房山石經來源快照可復現：A ${inventories[0].inventory.totals.records}、F ${inventories[1].inventory.totals.records}。`);
} else if (process.argv.includes("--write")) {
  for (const [relativePath, raw] of outputs) {
    await writeFile(resolve(root, relativePath), raw, "utf8");
  }
  console.log(`CBETA 趙城金藏與房山石經來源快照已寫入：A ${inventories[0].inventory.totals.records}、F ${inventories[1].inventory.totals.records}。`);
} else {
  console.error("必須指定 --write 或 --verify");
  process.exit(1);
}

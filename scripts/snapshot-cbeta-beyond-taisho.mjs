import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const expectedCommit = "2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9";
const snapshotVersion = "4.6.0";
const inventoryVersion = "0.1.0";
const sourceArgument = process.argv.find((argument) => argument.startsWith("--source-dir="));
if (!sourceArgument) {
  console.error("用法：node scripts/snapshot-cbeta-beyond-taisho.mjs --source-dir=/固定提交的/xml-p5 [--write|--verify]");
  process.exit(1);
}
const sourceRoot = resolve(sourceArgument.slice("--source-dir=".length));
const actualCommit = execFileSync("git", ["-C", sourceRoot, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (actualCommit !== expectedCommit) throw new Error(`上游工作树必须固定到 ${expectedCommit}`);

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const digestPaths = (paths) => sha256([...paths].sort().join("\n"));
const collections = [
  {
    dir: "N",
    expectedTree: "845a24eb64fdc063a1eba5ea12ff7ad991a6ff1f",
    expectedRecords: 83,
    expectedBytes: 56261556,
    filePattern: /^N\/N\d+\/N\d+n[0-9A-Za-z]+\.xml$/,
    subset: {
      id: "yuanheng_nanchuan_tipitaka",
      label: "元亨寺漢譯南傳大藏經固定來源記錄",
      inclusionRule: "固定 Git tree 中 N/ 目錄下、檔名卷號一致的 N*.xml",
      denominatorCaveat: "83 份來源記錄覆蓋律、經、論、義釋、史傳與注書。檔案數不是作品數，也不是嚴格佛說經數。本快照只凍結可核驗目錄，不把律藏、論藏或註釋自動計入佛陀親說。",
    },
    inventoryFile: `data/gbcr/cbeta-nanchuan-inventory-v${inventoryVersion}.json`,
  },
  {
    dir: "X",
    expectedTree: "590fefaddff1c32f6f8807b696b50959af113542",
    expectedRecords: 1236,
    expectedBytes: 676436667,
    filePattern: /^X\/X\d+\/X\d+n[0-9A-Za-z]+\.xml$/,
    subset: {
      id: "manji_xuzangjing",
      label: "卍續藏固定來源記錄",
      inclusionRule: "固定 Git tree 中 X/ 目錄下、檔名卷號一致的 X*.xml",
      denominatorCaveat: "1,236 份來源記錄以經疏、宗派撰述、儀軌和後出文獻為主，不是大正藏未收佛說經的作品數。必須先分類再決定何者可進入經藏閱讀，不得把續藏檔案數相加到全球分母。",
    },
    inventoryFile: `data/gbcr/cbeta-xuzangjing-inventory-v${inventoryVersion}.json`,
  },
  {
    dir: "B",
    expectedTree: "3b96ec65db035c28e095c5c68b61f7e46e04d6c2",
    expectedRecords: 204,
    expectedBytes: 125294198,
    filePattern: /^B\/B\d+\/B\d+n[0-9A-Za-z]+\.xml$/,
    subset: {
      id: "dazangjing_bubian",
      label: "大藏經補編固定來源記錄",
      inclusionRule: "固定 Git tree 中 B/ 目錄下、檔名卷號一致的 B*.xml",
      denominatorCaveat: "204 份來源記錄混合現代南傳漢譯、韓國華嚴學、編輯說明與後出文獻。檔案數不是去重作品數；編輯說明與註釋不得計入佛說經。",
    },
    inventoryFile: `data/gbcr/cbeta-dazangjing-bubian-inventory-v${inventoryVersion}.json`,
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
    capturedAt: "2026-08-22",
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

const baseSnapshotPath = "data/gbcr/source-snapshots-v4.5.0.json";
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
  capturedAt: "2026-08-22",
  status: "multi_tradition_candidate_record_inventory_with_cbeta_beyond_taisho_subsets",
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
      throw new Error(`${relativePath} 與固定 CBETA 非大正藏 Git tree 不一致`);
    }
  }
  console.log(`CBETA 大正藏以外來源快照可復現：N ${inventories[0].inventory.totals.records}、X ${inventories[1].inventory.totals.records}、B ${inventories[2].inventory.totals.records}。`);
} else if (process.argv.includes("--write")) {
  for (const [relativePath, raw] of outputs) {
    await writeFile(resolve(root, relativePath), raw, "utf8");
  }
  console.log(`CBETA 大正藏以外來源快照已寫入：N ${inventories[0].inventory.totals.records}、X ${inventories[1].inventory.totals.records}、B ${inventories[2].inventory.totals.records}。`);
} else {
  console.error("必須指定 --write 或 --verify");
  process.exit(1);
}

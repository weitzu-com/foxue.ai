import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const version = "0.1.0";
const snapshotVersion = "1.8.0";
const expectedCommit = "2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9";
const sourceArgument = process.argv.find((argument) => argument.startsWith("--source-dir="));
if (!sourceArgument) {
  console.error("用法：node scripts/snapshot-cbeta-t30.mjs --source-dir=/固定提交的/xml-p5 [--write|--verify]");
  process.exit(1);
}
const sourceRoot = resolve(sourceArgument.slice("--source-dir=".length));
const actualCommit = execFileSync("git", ["-C", sourceRoot, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (actualCommit !== expectedCommit) throw new Error(`上游工作树必须固定到 ${expectedCommit}`);

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const digestPaths = (paths) => sha256([...paths].sort().join("\n"));
const treeRaw = execFileSync(
  "git",
  ["-C", sourceRoot, "ls-tree", "-r", "-z", "--long", "HEAD", "T/T30"],
  { maxBuffer: 8 * 1024 * 1024 },
).toString("utf8");
const treeEntries = treeRaw.split("\0").filter(Boolean).map((entry) => {
  const match = entry.match(/^\d+\s+blob\s+([a-f0-9]{40})\s+(\d+)\t(.+)$/);
  if (!match) throw new Error(`无法解析 T30 Git tree 记录：${entry}`);
  return { sha: match[1], size: Number(match[2]), path: match[3] };
}).filter((entry) => /^T\/T30\/T30n[0-9A-Za-z_]+\.xml$/.test(entry.path));

if (treeEntries.length !== 21) throw new Error(`T30 固定来源记录应为 21，实际 ${treeEntries.length}`);
if (treeEntries.reduce((sum, entry) => sum + entry.size, 0) !== 13938106) {
  throw new Error("T30 固定来源字节数漂移");
}

const inventory = {
  schema: "https://foxue.ai/schemas/gbcr/cbeta-volume-source-record-inventory-v0.1",
  version,
  capturedAt: "2026-08-14",
  source: { repository: "cbeta-org/xml-p5", commit: expectedCommit },
  subset: {
    id: "taisho_madhyamaka_yogacara_t30",
    label: "大正藏 T30 中觀部、瑜伽部固定來源記錄",
    inclusionRule: "固定 Git tree 中 T/T30 目錄下、文件名卷號一致的 T30n*.xml",
    recordUnit: "TEI P5 source record",
    denominatorCaveat: "T30 的 21 份來源記錄包含根本頌、釋論、節略注釋、僅存前半的譯本、整部瑜伽論、獨立流通的組成部分、異譯或改編爭議，以及原屬同一十卷文本而後分離的兩份來源；來源文件、表達、作品、組成部分、完整作品見證與傳統作者題記必須分層計量。",
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
      canonWitnessId: sourceRecordId.replace(/^T30n/, "T"),
      volume: "T30",
      upstreamPath: entry.path,
      upstreamGitBlobSha1: entry.sha,
      upstreamBytes: entry.size,
    };
  }),
};
const inventoryRaw = `${JSON.stringify(inventory, null, 2)}\n`;

const baseSnapshotPath = "data/gbcr/source-snapshots-v1.7.0.json";
const baseSnapshot = JSON.parse(await readFile(resolve(root, baseSnapshotPath), "utf8"));
const cbetaSource = baseSnapshot.sources.find((source) => source.id === "cbeta_xml_p5");
if (!cbetaSource || cbetaSource.commit !== expectedCommit) throw new Error("既有 CBETA 來源快照提交不一致");
if (cbetaSource.candidateSubsets.some((subset) => subset.id === inventory.subset.id)) {
  throw new Error("既有來源快照已經包含 T30 子集");
}

const inventoryPath = `data/gbcr/cbeta-taisho-t30-inventory-v${version}.json`;
const snapshotPath = `data/gbcr/source-snapshots-v${snapshotVersion}.json`;
const snapshot = {
  ...baseSnapshot,
  version: snapshotVersion,
  capturedAt: "2026-08-14",
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
            groups: { T30: inventory.totals.records },
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
      throw new Error(`${relativePath} 與固定 T30 Git tree 不一致`);
    }
  }
  console.log(`CBETA T30 來源快照可復現：${inventory.totals.records} 份、${inventory.totals.upstreamBytes} 字節。`);
} else if (process.argv.includes("--write")) {
  await writeFile(resolve(root, inventoryPath), inventoryRaw, "utf8");
  await writeFile(resolve(root, snapshotPath), snapshotRaw, "utf8");
  console.log(`CBETA T30 來源快照已生成：${inventory.totals.records} 份、${inventory.totals.upstreamBytes} 字節。`);
} else {
  process.stdout.write(snapshotRaw);
}

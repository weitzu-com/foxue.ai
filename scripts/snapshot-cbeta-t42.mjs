import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const version = "0.1.0";
const snapshotVersion = "3.0.0";
const expectedCommit = "2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9";
const expectedTree = "b9188db47bdbfc84a8e081812682597a938ad5e9";
const sourceArgument = process.argv.find((argument) => argument.startsWith("--source-dir="));
if (!sourceArgument) {
  console.error("用法：node scripts/snapshot-cbeta-t42.mjs --source-dir=/固定提交的/xml-p5 [--write|--verify]");
  process.exit(1);
}
const sourceRoot = resolve(sourceArgument.slice("--source-dir=".length));
const actualCommit = execFileSync("git", ["-C", sourceRoot, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (actualCommit !== expectedCommit) throw new Error(`上游工作树必须固定到 ${expectedCommit}`);
const actualTree = execFileSync("git", ["-C", sourceRoot, "rev-parse", "HEAD:T/T42"], { encoding: "utf8" }).trim();
if (actualTree !== expectedTree) throw new Error(`T42 Git tree 必须固定到 ${expectedTree}`);

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const digestPaths = (paths) => sha256([...paths].sort().join("\n"));
const treeRaw = execFileSync(
  "git",
  ["-C", sourceRoot, "ls-tree", "-r", "-z", "--long", "HEAD", "T/T42"],
  { maxBuffer: 8 * 1024 * 1024 },
).toString("utf8");
const treeEntries = treeRaw.split("\0").filter(Boolean).map((entry) => {
  const match = entry.match(/^\d+\s+blob\s+([a-f0-9]{40})\s+(\d+)\t(.+)$/);
  if (!match) throw new Error(`无法解析 T42 Git tree 记录：${entry}`);
  return { sha: match[1], size: Number(match[2]), path: match[3] };
}).filter((entry) => /^T\/T42\/T42n[0-9A-Za-z_]+\.xml$/.test(entry.path));

if (treeEntries.length !== 5) throw new Error(`T42 固定来源记录应为 5，实际 ${treeEntries.length}`);
if (treeEntries.reduce((sum, entry) => sum + entry.size, 0) !== 10207300) {
  throw new Error("T42 固定来源字节数漂移");
}

const inventory = {
  schema: "https://foxue.ai/schemas/gbcr/cbeta-volume-source-record-inventory-v0.1",
  version,
  capturedAt: "2026-08-15",
  source: { repository: "cbeta-org/xml-p5", commit: expectedCommit, tree: expectedTree },
  subset: {
    id: "taisho_madhyamaka_and_yogacara_commentaries_t42",
    label: "大正藏 T42 中观与瑜伽论疏部固定来源记录",
    inclusionRule: "固定 Git tree 中 T/T42 目录下、文件名卷号一致的 T42n*.xml",
    recordUnit: "TEI P5 source record",
    denominatorCaveat: "T42 的 5 份来源记录是吉藏《中观论疏》《十二门论疏》《百论疏》、法藏《十二门论宗致义记》和遁伦《瑜伽论记》五部汉地论疏。它们分别解释 T1564、T1568、T1569 与 T1579；T1825、T1826 虽同释 T1568，仍因作者责任、篇幅与解释范围不同而保持为两部平行注疏。共同根本论、三论传统、题名或正文引文不能把不同作者和注释结构误作同一作品、根本论表达或佛陀逐字亲说归属。",
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
      canonWitnessId: sourceRecordId.replace(/^T42n/, "T"),
      volume: "T42",
      upstreamPath: entry.path,
      upstreamGitBlobSha1: entry.sha,
      upstreamBytes: entry.size,
    };
  }),
};
const inventoryRaw = `${JSON.stringify(inventory, null, 2)}\n`;

const baseSnapshotPath = "data/gbcr/source-snapshots-v2.9.0.json";
const baseSnapshot = JSON.parse(await readFile(resolve(root, baseSnapshotPath), "utf8"));
const cbetaSource = baseSnapshot.sources.find((source) => source.id === "cbeta_xml_p5");
if (!cbetaSource || cbetaSource.commit !== expectedCommit) throw new Error("既有 CBETA 来源快照提交不一致");
if (cbetaSource.candidateSubsets.some((subset) => subset.id === inventory.subset.id)) {
  throw new Error("既有来源快照已经包含 T42 子集");
}

const inventoryPath = `data/gbcr/cbeta-taisho-t42-inventory-v${version}.json`;
const snapshotPath = `data/gbcr/source-snapshots-v${snapshotVersion}.json`;
const snapshot = {
  ...baseSnapshot,
  version: snapshotVersion,
  capturedAt: "2026-08-15",
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
            groups: { T42: inventory.totals.records },
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
      throw new Error(`${relativePath} 与固定 T42 Git tree 不一致`);
    }
  }
  console.log(`CBETA T42 来源快照可复现：${inventory.totals.records} 份、${inventory.totals.upstreamBytes} 字节。`);
} else if (process.argv.includes("--write")) {
  await writeFile(resolve(root, inventoryPath), inventoryRaw, "utf8");
  await writeFile(resolve(root, snapshotPath), snapshotRaw, "utf8");
  console.log(`CBETA T42 来源快照已生成：${inventory.totals.records} 份、${inventory.totals.upstreamBytes} 字节。`);
} else {
  process.stdout.write(snapshotRaw);
}

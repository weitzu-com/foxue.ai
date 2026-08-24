import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const expectedCommit = "2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9";
const snapshotVersion = "4.8.0";
const inventoryVersion = "0.1.0";
const sourceArgument = process.argv.find((argument) => argument.startsWith("--source-dir="));
if (!sourceArgument) {
  console.error("用法：node scripts/snapshot-cbeta-remaining-collections.mjs --source-dir=/固定提交的/xml-p5 [--write|--verify]");
  process.exit(1);
}
const sourceRoot = resolve(sourceArgument.slice("--source-dir=".length));
const actualCommit = execFileSync("git", ["-C", sourceRoot, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (actualCommit !== expectedCommit) throw new Error(`上游工作树必须固定到 ${expectedCommit}`);

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const digestPaths = (paths) => sha256([...paths].sort().join("\n"));

const collections = [
  { dir: "B", expectedTree: "3b96ec65db035c28e095c5c68b61f7e46e04d6c2", expectedRecords: 204, expectedBytes: 125294198, id: "dazangjing_bubian_remaining_rescan", label: "大藏經補編（#63 未做佛說過濾的再掃描）" },
  { dir: "J", expectedTree: "f1404e597483e3cc0ff548b025042e938ff9b32c", expectedRecords: 287, expectedBytes: 104684929, id: "jiaxing_dazangjing", label: "嘉興藏固定來源記錄" },
  { dir: "ZW", expectedTree: "e9d699cfa5e651213c8beb00c71580f59afd3a67", expectedRecords: 202, expectedBytes: 18493721, id: "zangwai_fojiao_wenxian", label: "藏外佛教文獻固定來源記錄" },
  { dir: "D", expectedTree: "488a0388ce3a0687eced23d30b0860f6ddb11631", expectedRecords: 64, expectedBytes: 42170954, id: "guotu_shanben", label: "國圖善本佛典固定來源記錄" },
  { dir: "P", expectedTree: "c2941d22f6893e65c5afefdb6ef9227d9ff2a580", expectedRecords: 20, expectedBytes: 16691462, id: "yongle_beizang", label: "永樂北藏固定來源記錄" },
  { dir: "C", expectedTree: "567616eef0c0158668646267f8c8d4b29bfd38b6", expectedRecords: 12, expectedBytes: 14394742, id: "zhonghua_dazangjing", label: "中華大藏經固定來源記錄" },
  { dir: "G", expectedTree: "af56753f847a0d392ea27484d35975bed0bfcb59", expectedRecords: 60, expectedBytes: 13694764, id: "fojiao_dazangjing", label: "佛教大藏經固定來源記錄" },
  { dir: "K", expectedTree: "6ebc60f04b3f608e72164037e8be0137b0df08c2", expectedRecords: 10, expectedBytes: 37000252, id: "gaoli_dazangjing_chinese_script", label: "高麗大藏經漢文固定來源記錄" },
  { dir: "L", expectedTree: "a37761d3066f16125176a913f2ae2d02abd15a34", expectedRecords: 26, expectedBytes: 25160880, id: "qianlong_dazangjing", label: "乾隆大藏經固定來源記錄" },
  { dir: "M", expectedTree: "3c6ab1cf59f6cd212eec9e56c901fa68a925f160", expectedRecords: 1, expectedBytes: 1068973, id: "manji_zhengzang", label: "卍正藏經固定來源記錄" },
  { dir: "S", expectedTree: "0019f17b3117ee348c6f7bd2ed0333d96af3f276", expectedRecords: 2, expectedBytes: 419499, id: "songzang_yizhen", label: "宋藏遺珍固定來源記錄" },
  { dir: "U", expectedTree: "9f91fc4b987a5fff42a583720cbffb4a45247c86", expectedRecords: 3, expectedBytes: 2392630, id: "hongwu_nanzang", label: "洪武南藏固定來源記錄" },
  { dir: "CC", expectedTree: "ad02cddc03f808aa56b97e05624cdfb7047ba513", expectedRecords: 6, expectedBytes: 1695458, id: "cbeta_selected_collection", label: "CBETA 選集固定來源記錄" },
  { dir: "GA", expectedTree: "5b399be88466d7598ea58d5817e15ba18a53ea80", expectedRecords: 58, expectedBytes: 29951612, id: "fosi_shizhi_huikan", label: "中國佛寺史志彙刊固定來源記錄" },
  { dir: "GB", expectedTree: "f35b65efee5849868a84add37ae90f12aeee9e58", expectedRecords: 2, expectedBytes: 240030, id: "fosi_zhi_congkan", label: "中國佛寺志叢刊固定來源記錄" },
  { dir: "I", expectedTree: "945ded5f5c04e4b8b7c7adeec07c107cbc8a48a2", expectedRecords: 101, expectedBytes: 2334321, id: "beichao_shike", label: "北朝佛教石刻拓片固定來源記錄" },
  { dir: "LC", expectedTree: "bde5e1f1fbd7a31b0f04cff76301a1db6106e85d", expectedRecords: 8, expectedBytes: 6460908, id: "luzheng_category_b", label: "呂澂佛學著作集固定來源記錄" },
  { dir: "TX", expectedTree: "edaff07fc94dc1703e83e75097441334c6c761e1", expectedRecords: 40, expectedBytes: 28738452, id: "taixu_category_b", label: "太虛大師全書固定來源記錄" },
  { dir: "Y", expectedTree: "73592704bb7245f7d640f1369e24e077a5a768dc", expectedRecords: 44, expectedBytes: 51591185, id: "yinshun_category_b", label: "印順著作固定來源記錄" },
  { dir: "YP", expectedTree: "12a48e69d518b24e79bd5c3e00a3acba89667b0d", expectedRecords: 25, expectedBytes: 13414713, id: "yanpei_category_b", label: "演培法師全集固定來源記錄" },
  { dir: "ZS", expectedTree: "5e2b00a087f60cc80501e9242770c4b271f01335", expectedRecords: 1, expectedBytes: 2523812, id: "zhengshi_fojiao_ziliao", label: "正史佛教資料類編固定來源記錄" },
].map((collection) => ({
  ...collection,
  filePattern: new RegExp(`^${collection.dir}/${collection.dir}[^/]*/${collection.dir}[^/]*\\.xml$`),
}));

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

const collectionInventories = collections.map((collection) => {
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
  return {
    collection,
    actualTree,
    groups,
    records: treeEntries.map((entry) => {
      const filename = entry.path.split("/").at(-1);
      return {
        sourceRecordId: filename.replace(/\.xml$/, ""),
        collection: collection.dir,
        volume: entry.path.split("/")[1],
        upstreamPath: entry.path,
        upstreamGitBlobSha1: entry.sha,
        upstreamBytes: entry.size,
      };
    }),
  };
});

const allRecords = collectionInventories.flatMap((item) => item.records);
const inventory = {
  schema: "https://foxue.ai/schemas/gbcr/cbeta-remaining-collections-inventory-v0.1",
  version: inventoryVersion,
  capturedAt: "2026-08-24",
  source: { repository: "cbeta-org/xml-p5", commit: expectedCommit },
  subset: {
    id: "cbeta_remaining_collections_not_filtered_in_pr63",
    label: "CBETA 固定提交中 #63 未做佛說過濾的館藏",
    recordUnit: "TEI P5 source record",
    inclusionRule: "固定 Git tree 中 B/J/ZW/D/P/C/G/K/L/M/S/U/CC/GA/GB/I/LC/TX/Y/YP/ZS 目錄下、檔名卷號一致的 XML。不含 T/N/X/A/F。",
    denominatorCaveat: "1,176 份來源記錄混合嘉興語錄、藏外疑偽、補編現代譯、寺志、石刻、正史與 Category B 近人著作。檔案數不是佛說經作品數。B 已在 v4.6 入庫，本清單只為佛說過濾再掃描，不重複計入大正藏以外已收錄的 3 份 A/F。",
  },
  totals: {
    records: allRecords.length,
    upstreamBytes: allRecords.reduce((sum, record) => sum + record.upstreamBytes, 0),
    candidatePathSha256: digestPaths(allRecords.map((record) => record.upstreamPath)),
    collections: Object.fromEntries(collectionInventories.map((item) => [item.collection.dir, item.records.length])),
  },
  collections: collectionInventories.map((item) => ({
    id: item.collection.id,
    dir: item.collection.dir,
    label: item.collection.label,
    tree: item.actualTree,
    records: item.records.length,
    upstreamBytes: item.records.reduce((sum, record) => sum + record.upstreamBytes, 0),
    groups: item.groups,
  })),
  records: allRecords,
};
if (inventory.totals.records !== 1176) throw new Error(`剩餘館藏來源應為 1,176，實際 ${inventory.totals.records}`);

const inventoryPath = `data/gbcr/cbeta-remaining-collections-inventory-v${inventoryVersion}.json`;
const inventoryRaw = `${JSON.stringify(inventory, null, 2)}\n`;
const baseSnapshotPath = "data/gbcr/source-snapshots-v4.7.0.json";
const baseSnapshot = JSON.parse(await readFile(resolve(root, baseSnapshotPath), "utf8"));
const cbetaSource = baseSnapshot.sources.find((source) => source.id === "cbeta_xml_p5");
if (!cbetaSource || cbetaSource.commit !== expectedCommit) throw new Error("既有 CBETA 來源快照提交不一致");
if (baseSnapshot.version !== "4.7.0") throw new Error("來源快照基線必須為 v4.7.0");

const snapshotPath = `data/gbcr/source-snapshots-v${snapshotVersion}.json`;
const snapshot = {
  ...baseSnapshot,
  version: snapshotVersion,
  capturedAt: "2026-08-24",
  status: "multi_tradition_candidate_record_inventory_with_remaining_collection_rescan",
  derivedFrom: {
    file: baseSnapshotPath,
    sha256: sha256(await readFile(resolve(root, baseSnapshotPath))),
  },
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
            groups: inventory.totals.collections,
            denominatorCaveat: inventory.subset.denominatorCaveat,
          },
        ],
      }
    : source),
};
const snapshotRaw = `${JSON.stringify(snapshot, null, 2)}\n`;
const outputs = [
  [inventoryPath, inventoryRaw],
  [snapshotPath, snapshotRaw],
];

if (process.argv.includes("--verify")) {
  for (const [relativePath, expected] of outputs) {
    if (await readFile(resolve(root, relativePath), "utf8") !== expected) {
      throw new Error(`${relativePath} 與固定 CBETA 剩餘館藏 Git tree 不一致`);
    }
  }
  console.log(`CBETA 剩餘館藏來源快照可復現：${inventory.totals.records} 份來源。`);
} else if (process.argv.includes("--write")) {
  for (const [relativePath, raw] of outputs) {
    await writeFile(resolve(root, relativePath), raw, "utf8");
  }
  console.log(`CBETA 剩餘館藏來源快照已寫入：${inventory.totals.records} 份來源。`);
} else {
  console.error("必須指定 --write 或 --verify");
  process.exit(1);
}

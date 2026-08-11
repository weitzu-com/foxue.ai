import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const batchPath = resolve(root, "data/corpus/cbeta/batch-v0.4.0.json");
const outputPath = resolve(root, "data/corpus/cbeta/catalog-v0.4.0.json");
const batch = JSON.parse(await readFile(batchPath, "utf8"));
const base = JSON.parse(await readFile(resolve(root, batch.baseCatalog), "utf8"));
const inventory = JSON.parse(await readFile(resolve(root, batch.inventory), "utf8"));
const inventoryByPath = new Map(inventory.records.map((record) => [record.upstreamPath, record]));
const requireUnique = (values, label) => {
  if (new Set(values).size !== values.length) throw new Error(`${label} 存在重复值`);
};

if (base.source.commit !== inventory.source.commit) throw new Error("基础目录与逐文件清单提交不一致");
for (const file of batch.files) {
  const sourceRecord = inventoryByPath.get(file.upstreamPath);
  if (
    !sourceRecord || sourceRecord.upstreamGitBlobSha1 !== file.upstreamGitBlobSha1 ||
    sourceRecord.upstreamBytes !== file.upstreamBytes
  ) {
    throw new Error(`${file.id} 与逐文件清单不一致`);
  }
  if (!/^[a-f0-9]{64}$/.test(file.upstreamSha256) || !/^[a-f0-9]{64}$/.test(file.localSha256)) {
    throw new Error(`${file.id} 缺少 SHA-256`);
  }
}

const files = [
  ...base.files.map((file) => {
    const override = batch.workOverrides[file.workId];
    return override ? { ...file, workTitle: override.canonicalTitle } : file;
  }),
  ...batch.files,
];
requireUnique(files.map((file) => file.id), "经号");
requireUnique(files.map((file) => file.slug), "阅读 slug");
requireUnique(files.map((file) => file.localPath), "本地路径");
requireUnique(files.map((file) => file.upstreamPath), "上游路径");

const catalog = {
  ...base,
  version: batch.version,
  publishedAt: batch.publishedAt,
  rightsDecision: { ...base.rightsDecision, category: batch.rightsCategory },
  files,
};
const serialized = `${JSON.stringify(catalog, null, 2)}\n`;
if (process.argv.includes("--verify")) {
  if (await readFile(outputPath, "utf8") !== serialized) {
    throw new Error("catalog-v0.4.0.json 与基础目录和批次定义不一致");
  }
  console.log(`CBETA 受控目录 v${batch.version} 可复现：${files.length} 个完整文本表达。`);
} else {
  await writeFile(outputPath, serialized, "utf8");
  console.log(`CBETA 受控目录 v${batch.version} 已生成：${files.length} 个完整文本表达。`);
}

import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const batchPath = resolve(root, "data/corpus/cbeta/batch-v3.2.0.json");
const outputPath = resolve(root, "data/corpus/cbeta/catalog-v3.2.0.json");
const batch = JSON.parse(await readFile(batchPath, "utf8"));
const base = JSON.parse(await readFile(resolve(root, batch.baseCatalog), "utf8"));
const inventory = JSON.parse(await readFile(resolve(root, batch.inventory), "utf8"));
const inventoryByPath = new Map(inventory.records.map((record) => [record.upstreamPath, record]));
const requireUnique = (values, label) => {
  if (new Set(values).size !== values.length) throw new Error(`${label} 存在重复值`);
};
const sourceUnits = (file) => file.sourceParts ?? [file];

if (base.source.commit !== inventory.source.commit) throw new Error("基础目录与逐文件清单提交不一致");
for (const file of batch.files) {
  for (const source of sourceUnits(file)) {
    const sourceRecord = inventoryByPath.get(source.upstreamPath);
    if (
      !sourceRecord || sourceRecord.upstreamGitBlobSha1 !== source.upstreamGitBlobSha1 ||
      sourceRecord.upstreamBytes !== source.upstreamBytes
    ) {
      throw new Error(`${source.id} 与逐文件清单不一致`);
    }
    if (!/^[a-f0-9]{64}$/.test(source.upstreamSha256) || !/^[a-f0-9]{64}$/.test(source.localSha256)) {
      throw new Error(`${source.id} 缺少 SHA-256`);
    }
  }
}

const additions = batch.files.map((file) => {
  const { juanRange, ...verification } = file.verification;
  if (!juanRange) return file;
  const [first, last] = juanRange;
  if (!Number.isInteger(first) || !Number.isInteger(last) || first < 1 || last < first) {
    throw new Error(`${file.id} 卷次范围无效`);
  }
  const juans = Array.from({ length: last - first + 1 }, (_, index) =>
    String(first + index).padStart(3, "0"));
  return {
    ...file,
    verification: {
      segments: verification.segments,
      folios: verification.folios,
      juans,
      anchors: verification.anchors,
      humanSampleVerified: verification.humanSampleVerified,
    },
  };
});

const files = [
  ...base.files.map((file) => {
    const override = batch.workOverrides?.[file.workId];
    const fileOverride = batch.fileOverrides?.[file.id];
    if (!override && !fileOverride) return file;
    return {
      ...file,
      ...(override?.canonicalTitle ? { workTitle: override.canonicalTitle } : {}),
      ...(override?.sourceRole ? { sourceRole: override.sourceRole } : {}),
      ...(fileOverride?.sourceRole ? { sourceRole: fileOverride.sourceRole } : {}),
      ...(override?.bibliographicRelations?.length ? {
        bibliographicRelations: [
          ...(file.bibliographicRelations ?? []),
          ...override.bibliographicRelations,
        ],
      } : {}),
    };
  }),
  ...additions,
];
requireUnique(files.map((file) => file.id), "经号");
requireUnique(files.map((file) => file.slug), "阅读 slug");
const allSourceUnits = files.flatMap(sourceUnits);
requireUnique(allSourceUnits.map((file) => file.id), "来源资产标识");
requireUnique(allSourceUnits.map((file) => file.localPath), "本地路径");
requireUnique(allSourceUnits.map((file) => file.upstreamPath), "上游路径");

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
    throw new Error(`catalog-v${batch.version}.json 与基础目录和批次定义不一致`);
  }
  console.log(`CBETA 受控目录 v${batch.version} 可复现：${files.length} 个表达或见证。`);
} else {
  await writeFile(outputPath, serialized, "utf8");
  console.log(`CBETA 受控目录 v${batch.version} 已生成：${files.length} 个表达或见证。`);
}

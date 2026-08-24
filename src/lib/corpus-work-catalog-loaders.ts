import workLedgerDocument from "@/data/corpus-work-ledger.generated.json";
import shardPathsDocument from "@/data/corpus-shard-paths.generated.json";
import { readRegisteredJsonFile, resolveRegisteredJsonFile } from "@/lib/corpus-json-shard.mjs";

const shardCount = (workLedgerDocument as { shardCount: number }).shardCount;
const catalogFiles = (shardPathsDocument as { catalog: string[] }).catalog;
if (catalogFiles.length !== shardCount) {
  throw new Error("经目分片路径表与账本 shardCount 不一致");
}

const shardPaths = new Map(
  catalogFiles.map((relativePath, id) => [id, resolveRegisteredJsonFile(relativePath)]),
);

export async function loadWorkCatalogShardWorks(id: number): Promise<Record<string, unknown> | null> {
  const assetPath = shardPaths.get(id);
  if (!assetPath) return null;
  const shard = await readRegisteredJsonFile(assetPath);
  if (!shard || typeof shard !== "object" || !("works" in shard) || !shard.works || typeof shard.works !== "object") {
    return null;
  }
  return shard.works as Record<string, unknown>;
}

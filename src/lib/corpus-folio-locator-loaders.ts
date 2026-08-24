import folioLocatorLedgerDocument from "@/data/corpus-folio-locator-ledger.generated.json";
import shardPathsDocument from "@/data/corpus-shard-paths.generated.json";
import { readRegisteredJsonFile, resolveRegisteredJsonFile } from "@/lib/corpus-json-shard.mjs";

const shardCount = (folioLocatorLedgerDocument as { shardCount: number }).shardCount;
const locatorFiles = (shardPathsDocument as { locator: string[] }).locator;
if (locatorFiles.length !== shardCount) {
  throw new Error("定位分片路径表与账本 shardCount 不一致");
}

const shardPaths = new Map(
  locatorFiles.map((relativePath, id) => [id, resolveRegisteredJsonFile(relativePath)]),
);

export async function loadFolioLocatorShardWorks(id: number): Promise<Record<string, unknown> | null> {
  const assetPath = shardPaths.get(id);
  if (!assetPath) return null;
  const shard = await readRegisteredJsonFile(assetPath);
  if (!shard || typeof shard !== "object" || !("works" in shard) || !shard.works || typeof shard.works !== "object") {
    return null;
  }
  return shard.works as Record<string, unknown>;
}

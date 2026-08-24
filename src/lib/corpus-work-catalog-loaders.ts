import { readCorpusJsonShard } from "@/lib/corpus-json-shard.mjs";

export async function loadWorkCatalogShardWorks(id: number): Promise<Record<string, unknown> | null> {
  const shard = await readCorpusJsonShard("src/data/corpus-work-catalog-chunks", id);
  if (!shard || typeof shard !== "object" || !("works" in shard) || !shard.works || typeof shard.works !== "object") {
    return null;
  }
  return shard.works as Record<string, unknown>;
}

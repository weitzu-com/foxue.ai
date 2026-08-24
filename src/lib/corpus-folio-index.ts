import { cache } from "react";
import workLedgerDocument from "@/data/corpus-work-ledger.generated.json";
import { loadWorkCatalogShardWorks } from "@/lib/corpus-work-catalog-loaders.generated";
import type { SegmentFolioRange } from "@/lib/reader-routes";

export type CatalogNavigationItem = {
  key: string;
  id: string;
  label: string;
  juan?: string;
  sourcePage?: string;
};

export type SutraCatalogView = {
  segmentCount: number;
  navigation: CatalogNavigationItem[];
  segmentFolios?: Record<string, string>;
  segmentFolioRanges?: Record<string, SegmentFolioRange[]>;
};

type WorkLedger = {
  schema: string;
  workCount: number;
  folioCount: number;
  shardCount: number;
  targetShardBytes: number;
  slugToShard: Record<string, number>;
};

const workLedgerSchema = "https://foxue.ai/schemas/corpus-work-ledger-v0.1";
const ledger = workLedgerDocument as WorkLedger;

if (ledger.schema !== workLedgerSchema) {
  throw new Error("经目账本 schema 不正确");
}

function asCatalogView(value: unknown): SutraCatalogView | null {
  if (!value || typeof value !== "object") return null;
  const work = value as SutraCatalogView;
  if (!Array.isArray(work.navigation) || work.navigation.length < 1) return null;
  if (!Number.isSafeInteger(work.segmentCount) || work.segmentCount < 1) return null;
  return {
    segmentCount: work.segmentCount,
    navigation: work.navigation,
    segmentFolios: work.segmentFolios,
    segmentFolioRanges: work.segmentFolioRanges,
  };
}

export const getSutraCatalogView = cache(async (slug: string): Promise<SutraCatalogView | null> => {
  const shardId = ledger.slugToShard[slug];
  if (!Number.isSafeInteger(shardId)) return null;
  const works = await loadWorkCatalogShardWorks(shardId);
  return asCatalogView(works?.[slug]);
});

export async function listCatalogFolioKeys(slug: string): Promise<string[]> {
  return (await getSutraCatalogView(slug))?.navigation.map((item) => item.key) ?? [];
}

export function getWorkCatalogLedger() {
  return ledger;
}

export function getFolioIndexStats() {
  return {
    schema: ledger.schema,
    totalWorks: ledger.workCount,
    totalFolios: ledger.folioCount,
  };
}

export function buildCatalogJuanNavigation(navigation: CatalogNavigationItem[]) {
  const groups = new Map<string, { juan?: string; first: CatalogNavigationItem; pages: number }>();
  for (const item of navigation) {
    const key = item.juan ?? "";
    const group = groups.get(key);
    if (group) group.pages += 1;
    else groups.set(key, { juan: item.juan, first: item, pages: 1 });
  }
  return [...groups.values()];
}

export function buildCatalogLegacyAliasMap(segments: Array<{ id: string; legacyIds?: string[] }>) {
  const aliases: Record<string, string> = {};
  for (const segment of segments) {
    for (const legacyId of segment.legacyIds ?? []) aliases[legacyId] = segment.id;
  }
  return aliases;
}

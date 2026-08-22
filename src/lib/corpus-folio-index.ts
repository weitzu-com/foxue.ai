import folioIndexDocument from "@/data/corpus-folio-index.generated.json";
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

type FolioIndexWork = {
  segmentCount: number;
  navigation: CatalogNavigationItem[];
  segmentFolios?: Record<string, string>;
  segmentFolioRanges?: Record<string, SegmentFolioRange[]>;
};

const folioIndex = folioIndexDocument as {
  schema: string;
  totalWorks: number;
  totalFolios: number;
  works: Record<string, FolioIndexWork>;
};

export function getSutraCatalogView(slug: string): SutraCatalogView | null {
  const work = folioIndex.works[slug];
  if (!work?.navigation?.length) return null;
  return {
    segmentCount: work.segmentCount,
    navigation: work.navigation,
    segmentFolios: work.segmentFolios,
    segmentFolioRanges: work.segmentFolioRanges,
  };
}

export function listCatalogFolioKeys(slug: string): string[] {
  return folioIndex.works[slug]?.navigation.map((item) => item.key) ?? [];
}

export function getFolioIndexStats() {
  return {
    schema: folioIndex.schema,
    totalWorks: folioIndex.totalWorks,
    totalFolios: folioIndex.totalFolios,
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

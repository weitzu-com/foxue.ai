import type { SutraSegment } from "@/data/sutras";
import type { ReaderNavigationItem } from "@/lib/corpus-reading";

export function parseBilaraDhammapadaSources(
  sources: Array<{ filename?: string; localPath?: string; text: string }>,
): { segments: SutraSegment[]; navigation: ReaderNavigationItem[] };

export function parseBilaraCollectionSources(
  sources: Array<{ filename?: string; localPath?: string; text: string }>,
  options?: { maxSegments?: number },
): {
  segments: SutraSegment[];
  navigation: ReaderNavigationItem[];
  title: string;
  collectionPrefix: "sn" | "an";
  representedSuttas: number;
  omittedEmptySegmentIds: string[];
};

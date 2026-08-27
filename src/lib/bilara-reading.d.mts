import type { SutraSegment } from "@/data/sutras";
import type { ReaderNavigationItem } from "@/lib/corpus-reading";

export function parseBilaraDhammapadaSources(
  sources: Array<{ filename?: string; localPath?: string; text: string }>,
): { segments: SutraSegment[]; navigation: ReaderNavigationItem[] };

export function parseBilaraSuttaSource(
  source: { filename?: string; localPath?: string; text: string },
  options?: { maxSegments?: number; omitEmptySegments?: boolean },
): {
  segments: SutraSegment[];
  navigation: ReaderNavigationItem[];
  title: string;
  omittedEmptySegmentIds: string[];
};

export function parseBilaraSamyuttaSources(
  sources: Array<{ filename?: string; localPath?: string; text: string }>,
  options?: { maxSegments?: number },
): {
  segments: SutraSegment[];
  navigation: ReaderNavigationItem[];
  title: string;
  representedSuttas: number;
  omittedEmptySegmentIds: string[];
};

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

export function parseBilaraAnguttaraSources(
  sources: Array<{ filename?: string; localPath?: string; text: string }>,
  options?: { maxSegments?: number },
): ReturnType<typeof parseBilaraCollectionSources>;

export function parseBilaraSeriesSources(
  sources: Array<{ filename?: string; localPath?: string; text: string }>,
  options?: {
    maxSegments?: number;
    collectionTitle?: string;
    collectionPrefix?: string;
    titleSuffixes?: string[];
    omitEmptySegments?: boolean;
  },
): {
  segments: SutraSegment[];
  navigation: ReaderNavigationItem[];
  title: string;
  collectionPrefix: string;
  sourceRecords: number;
  omittedEmptySegmentIds: string[];
};

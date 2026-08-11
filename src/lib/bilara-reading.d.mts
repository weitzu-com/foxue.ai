import type { SutraSegment } from "@/data/sutras";
import type { ReaderNavigationItem } from "@/lib/corpus-reading";

export function parseBilaraDhammapadaSources(
  sources: Array<{ filename?: string; localPath?: string; text: string }>,
): { segments: SutraSegment[]; navigation: ReaderNavigationItem[] };

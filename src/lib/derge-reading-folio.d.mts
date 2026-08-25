import type { DergeSegment, DergeSource } from "./derge-reading.d.mts";

export function iterateDergeFolioRanges(source: DergeSource): Array<{
  key: string;
  juan: string;
  page: string;
  sourcePage: string;
  start: number;
  end: number;
}>;

export function parseDergeFolioSlice(
  source: DergeSource,
  options: { canonId: string; juan?: string; sourcePage?: string },
): DergeSegment[];

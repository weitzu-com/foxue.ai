import type { SatReadingLine } from "./sat-tei.d.mts";

export function parseSatFolioSlice(
  xmlSlice: string,
  options: { canonId: string; page: string },
): SatReadingLine[];

export function locateSatBody(xml: string): {
  content: string;
  contentStart: number;
} | null;

export function iterateSatChapterRanges(body: string): Array<{
  page: string;
  start: number;
  end: number;
}>;

import type { CbetaReadingLine } from "./cbeta-tei.d.mts";

export function parseCbetaFolioSlice(
  xmlSlice: string,
  options: { canonId: string; juan: string },
): CbetaReadingLine[];

export function locateCbetaBody(xml: string): {
  content: string;
  contentStart: number;
} | null;

export function iterateVisibleCbetaLineMarkers(
  body: string,
  options?: { juan?: string },
): Array<{
  juan: string;
  sourceLine: string;
  page: string;
  index: number;
}>;

export function stringOffsetsToByteOffsets(
  text: string,
  offsets: number[],
): Map<number, number>;

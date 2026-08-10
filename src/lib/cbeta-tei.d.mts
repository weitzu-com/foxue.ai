export type CbetaReadingLine = {
  id: string;
  juan: string;
  sourceLine: string;
  page: string;
  text: string;
};

export function parseCbetaReadingLines(
  xml: string,
  options: { canonId: string; juan?: string },
): CbetaReadingLine[];

export function buildPageNavigation(
  segments: CbetaReadingLine[],
): Array<{ id: string; label: string; juan: string }>;

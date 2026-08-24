export type SatReadingLine = {
  id: string;
  juan: string;
  sourceLine: string;
  page: string;
  text: string;
};

export function locateSatBody(xml: string): {
  content: string;
  contentStart: number;
} | null;

export function parseSatReadingLines(
  xml: string,
  options?: { canonId?: string },
): SatReadingLine[];

export function extractSatTranslators(xml: string): string[];

export function extractSatTitle(xml: string): string;

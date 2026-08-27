export type InferredReadingSegmentRole = "registration" | "heading" | "byline" | "colophon";

export type ReadingEditionSegment = {
  text: string;
  sourceLine?: string;
};

export function inferReadingSegmentRoles(input: {
  segments: ReadingEditionSegment[];
  title: string;
  alternateTitle: string;
}): Record<string, InferredReadingSegmentRole>;

export function inferBilaraSegmentRoles(input: {
  segments: ReadingEditionSegment[];
}): Record<string, InferredReadingSegmentRole>;

export function buildDefaultReadingEdition(input: {
  slug: string;
  title: string;
  alternateTitle: string;
  translator: string;
  language: string;
  folioLabel: string;
  segments: ReadingEditionSegment[];
  hasNext: boolean;
  readerMode?: "cbeta-folio" | "bilara-chapter" | "bilara-sutta" | "derge-folio" | "sat-folio" | "kokuyaku-folio" | "english-translation-folio";
}): {
  annotationMode: "pinyin" | "plain";
  sourceKind: "cbeta" | "bilara" | "derge" | "sat" | "wikisource";
  contentLanguage: "zh-Hant" | "pi" | "bo-Tibt" | "ja" | "en" | "sa-Latn" | "pra-Latn";
  workLabel: string;
  editionLabel: string;
  documentKind: string;
  documentTitle: string;
  responsibility: string;
  description: string;
  closingMark: string;
  segmentRoles: Record<string, InferredReadingSegmentRole>;
  textOverrides?: Record<string, string>;
};

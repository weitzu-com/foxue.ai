export type DergeSource = {
  filename?: string;
  text: string;
  volume?: string;
  initialPage?: string;
  initialLine?: string;
};

export type DergeSegment = {
  id: string;
  text: string;
  juan: string;
  page: string;
  sourcePage: string;
  sourceLine: string;
};

export function buildDergeNavigation(segments: DergeSegment[]): Array<{
  key: string;
  id: string;
  label: string;
  juan: string;
  sourcePage: string;
}>;

export function parseDergeSources(
  sources: DergeSource[],
  options: { canonId: string },
): { segments: DergeSegment[]; navigation: ReturnType<typeof buildDergeNavigation> };

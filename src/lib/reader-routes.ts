const stableSegmentPattern = /^[^.]+\.([^.]+)\.(\d{4}[abc]\d{2})$/;
const dhammapadaSegmentPattern = /^dhp(\d+):/;
const dhammapadaRanges = [
  [1, 20], [21, 32], [33, 43], [44, 59], [60, 75], [76, 89], [90, 99],
  [100, 115], [116, 128], [129, 145], [146, 156], [157, 166], [167, 178],
  [179, 196], [197, 208], [209, 220], [221, 234], [235, 255], [256, 272],
  [273, 289], [290, 305], [306, 319], [320, 333], [334, 359], [360, 382],
  [383, 409], [410, 423],
] as const;

export function folioKeyFromSegmentId(segmentId: string) {
  const match = segmentId.match(stableSegmentPattern);
  if (match) return `${match[1]}-${match[2].slice(0, 5)}`;
  const dhammapada = segmentId.match(dhammapadaSegmentPattern);
  if (!dhammapada) return null;
  const verse = Number(dhammapada[1]);
  const index = dhammapadaRanges.findIndex(([start, end]) => verse >= start && verse <= end);
  if (index < 0) return null;
  const [start, end] = dhammapadaRanges[index];
  const chapter = index === dhammapadaRanges.length - 1 ? 26 : index + 1;
  return `${String(chapter).padStart(3, "0")}-dhp${start}-${end}`;
}

export function folioHref(slug: string, folioKey: string, segmentId?: string) {
  const path = `/jingzang/${slug}/${folioKey}`;
  return segmentId ? `${path}#${segmentId}` : path;
}

export function buildSegmentFolioMap(
  segments: Array<{ id: string; juan?: string; page?: string }>,
) {
  const foliosByPrefix = new Map<string, Set<string>>();
  for (const segment of segments) {
    if (!segment.juan || !segment.page || !segment.id.includes(":")) continue;
    const prefix = segment.id.slice(0, segment.id.indexOf(":"));
    const folio = `${segment.juan}-${segment.page}`;
    const folios = foliosByPrefix.get(prefix) ?? new Set<string>();
    folios.add(folio);
    foliosByPrefix.set(prefix, folios);
  }
  const entries: Array<[string, string]> = [];
  for (const [prefix, folios] of foliosByPrefix) {
    if (folios.size === 1) entries.push([`${prefix}:*`, [...folios][0]]);
  }
  return Object.fromEntries(entries);
}

export type SegmentFolioRange = {
  first: string;
  last: string;
  folio: string;
};

export function buildSegmentFolioRanges(
  segments: Array<{ id: string; juan?: string; page?: string }>,
) {
  const foliosByPrefix = new Map<string, Map<string, string[]>>();
  for (const segment of segments) {
    if (!segment.juan || !segment.page || !segment.id.includes(":")) continue;
    const prefix = segment.id.slice(0, segment.id.indexOf(":"));
    const folio = `${segment.juan}-${segment.page}`;
    const folios = foliosByPrefix.get(prefix) ?? new Map<string, string[]>();
    const ids = folios.get(folio) ?? [];
    ids.push(segment.id);
    folios.set(folio, ids);
    foliosByPrefix.set(prefix, folios);
  }

  return Object.fromEntries(
    [...foliosByPrefix.entries()].flatMap(([prefix, folios]) => (
      folios.size < 2
        ? []
        : [[prefix, [...folios.entries()].map(([folio, ids]) => ({
            first: ids[0],
            last: ids.at(-1)!,
            folio,
          }))]]
    )),
  ) as Record<string, SegmentFolioRange[]>;
}

export function segmentHref(slug: string, segmentId: string) {
  const folioKey = folioKeyFromSegmentId(segmentId);
  return folioKey
    ? folioHref(slug, folioKey, segmentId)
    : `/jingzang/${slug}#${segmentId}`;
}

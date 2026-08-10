const stableSegmentPattern = /^[^.]+\.([^.]+)\.(\d{4}[abc]\d{2})$/;

export function folioKeyFromSegmentId(segmentId: string) {
  const match = segmentId.match(stableSegmentPattern);
  if (!match) return null;
  return `${match[1]}-${match[2].slice(0, 5)}`;
}

export function folioHref(slug: string, folioKey: string, segmentId?: string) {
  const path = `/jingzang/${slug}/${folioKey}`;
  return segmentId ? `${path}#${segmentId}` : path;
}

export function segmentHref(slug: string, segmentId: string) {
  const folioKey = folioKeyFromSegmentId(segmentId);
  return folioKey
    ? folioHref(slug, folioKey, segmentId)
    : `/jingzang/${slug}#${segmentId}`;
}

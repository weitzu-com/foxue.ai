export function rewriteCatalogFolioPath(pathname, routing) {
  const match = pathname.match(/^\/jingzang\/([a-z0-9-]+)\/([a-z0-9.-]+?)(\.rsc)?\/?$/);
  if (!match) return null;
  const [, slug, folio, rscSuffix] = match;
  const slugToBucket = routing.slugToBucket ?? routing;
  const slugJuanBuckets = routing.slugJuanBuckets ?? {};
  const ranges = slugJuanBuckets[slug];
  let bucket = slugToBucket[slug];
  if (Array.isArray(ranges) && ranges.length > 0) {
    const juan = folio.slice(0, 3);
    const hit = /^\d{3}$/.test(juan)
      ? ranges.find((range) => juan >= range.from && juan <= range.to)
      : null;
    bucket = hit?.bucket ?? ranges[0]?.bucket ?? bucket;
  }
  if (!bucket) return null;
  return `/corpus-runtime/${bucket}/${slug}/${folio}${rscSuffix ?? ""}`;
}

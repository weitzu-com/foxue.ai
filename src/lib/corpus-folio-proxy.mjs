export function rewriteCatalogFolioPath(pathname, slugToBucket) {
  const match = pathname.match(/^\/jingzang\/([a-z0-9-]+)\/([a-z0-9.-]+?)(\.rsc)?\/?$/);
  if (!match) return null;
  const [, slug, folio, rscSuffix] = match;
  const bucket = slugToBucket[slug];
  if (!bucket) return null;
  return `/corpus-runtime/${bucket}/${slug}/${folio}${rscSuffix ?? ""}`;
}

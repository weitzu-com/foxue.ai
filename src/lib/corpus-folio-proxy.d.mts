export type CorpusRuntimeJuanBucket = {
  bucket: string;
  from: string;
  to: string;
};

export type CorpusRuntimeRouting = {
  slugToBucket: Record<string, string>;
  slugJuanBuckets?: Record<string, CorpusRuntimeJuanBucket[]>;
};

export function rewriteCatalogFolioPath(
  pathname: string,
  routing: CorpusRuntimeRouting | Record<string, string>,
): string | null;

export type CorpusRuntimeJuanBucket = {
  bucket: string;
  from: string;
  to: string;
};

export type CorpusRuntimeRouting = {
  slugToBucket: Record<string, string>;
  slugJuanBuckets?: Record<string, CorpusRuntimeJuanBucket[]>;
};

import type { FolioExistenceDocument } from "./corpus-folio-existence.mjs";

export function rewriteCatalogFolioPath(
  pathname: string,
  routing: CorpusRuntimeRouting | Record<string, string>,
  existence: FolioExistenceDocument,
): string | null;

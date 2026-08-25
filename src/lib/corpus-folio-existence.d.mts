export const folioExistenceSchema: string;
export const folioExistenceMaxBytes: number;

export type FolioExistenceDocument = {
  schema: string;
  workCount: number;
  folioCount: number;
  packedSlugs: string[];
  packed: string[];
  looseSlugs: string[];
  looseKeys: string[][];
};

export function packFolioKey(key: string): number | null;
export function encodePackedValues(values: Iterable<number>): string;
export function getFolioExistenceTable(existence: FolioExistenceDocument): Map<
  string,
  { packed: Uint32Array } | { keys: Set<string> }
>;
export function catalogFolioKeyExists(
  existence: FolioExistenceDocument,
  slug: string,
  key: string,
): boolean;

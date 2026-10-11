export type ReaderManifest = {
  releaseId: string;
  expressions: Array<{ canonId: string; indexObjectKey: string; indexSha256: string }>;
};
export const readerManifestMaxBytes: number;
export function projectReaderManifest(bytes: Buffer, path: string, expectedSha256: string): ReaderManifest;
export function createReaderManifestLoader(fetcher?: typeof fetch): (
  baseUrl: string, path: string, expectedSha256: string,
) => Promise<ReaderManifest>;
export const fetchReaderManifest: ReturnType<typeof createReaderManifestLoader>;

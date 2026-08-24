export function readCorpusJsonShard(
  relativeDir: string,
  id: number,
): Promise<Record<string, unknown> | null>;

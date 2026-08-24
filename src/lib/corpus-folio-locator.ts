import { cache } from "react";
import folioLocatorLedgerDocument from "@/data/corpus-folio-locator-ledger.generated.json";
import { loadFolioLocatorShardWorks } from "@/lib/corpus-folio-locator-loaders";
import {
  folioLocatorLedgerSchema,
  folioLocatorMaxSliceBytes,
} from "@/lib/corpus-folio-locator-paths.mjs";

export type FolioLocatorHit = {
  parser: string;
  canonId: string;
  partPath: string;
  start: number;
  end: number;
  wholePart: boolean;
  parserOptions?: Record<string, unknown>;
};

type FolioLocatorWork = {
  parser: string;
  canonId: string;
  parts: string[];
  folios: Record<string, [number, number, number]>;
  parserOptions?: Record<string, unknown>;
};

type FolioLocatorLedger = {
  schema: string;
  workCount: number;
  folioCount: number;
  shardCount: number;
  targetShardBytes: number;
  minSourceBytes: number;
  slugToShard: Record<string, number>;
};

const ledger = folioLocatorLedgerDocument as FolioLocatorLedger;

if (ledger.schema !== folioLocatorLedgerSchema) {
  throw new Error("版页定位账本 schema 不正确");
}

function asLocatorWork(value: unknown): FolioLocatorWork | null {
  if (!value || typeof value !== "object") return null;
  const work = value as FolioLocatorWork;
  if (!Array.isArray(work.parts) || work.parts.length < 1) return null;
  if (!work.folios || typeof work.folios !== "object") return null;
  if (typeof work.parser !== "string" || typeof work.canonId !== "string") return null;
  return work;
}

const loadLocatorWork = cache(async (slug: string): Promise<FolioLocatorWork | null> => {
  const shardId = ledger.slugToShard[slug];
  if (!Number.isSafeInteger(shardId)) return null;
  const works = await loadFolioLocatorShardWorks(shardId);
  return asLocatorWork(works?.[slug]);
});

export function getFolioLocatorLedger() {
  return ledger;
}

export function workUsesFolioLocator(slug: string) {
  return Number.isSafeInteger(ledger.slugToShard[slug]);
}

export const getFolioLocator = cache(async (
  slug: string,
  key: string,
): Promise<FolioLocatorHit | null> => {
  const work = await loadLocatorWork(slug);
  if (!work) return null;
  const tuple = work.folios[key];
  if (!tuple) return null;
  const [partIndex, start, end] = tuple;
  const partPath = work.parts[partIndex];
  if (!partPath || !Number.isSafeInteger(start) || !Number.isSafeInteger(end)) return null;
  const wholePart = start === 0 && end === 0;
  if (!wholePart) {
    if (end <= start) return null;
    if (end - start > folioLocatorMaxSliceBytes) {
      throw new Error(`${slug}/${key} 版页切片超过 ${folioLocatorMaxSliceBytes} 字节`);
    }
  }
  return {
    parser: work.parser,
    canonId: work.canonId,
    partPath,
    start,
    end,
    wholePart,
    parserOptions: work.parserOptions,
  };
});

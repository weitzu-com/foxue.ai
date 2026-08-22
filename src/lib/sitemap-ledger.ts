import sitemapLedgerDocument from "@/data/corpus-sitemap-ledger.generated.json";

const sitemapLedgerSchema = "https://foxue.ai/schemas/corpus-sitemap-ledger-v0.1";

type SitemapLedger = {
  schema: string;
  chunkSize: number;
  staticPathCount: number;
  libraryPageCount: number;
  workCount: number;
  folioCount: number;
  totalUrls: number;
  sitemapCount: number;
};

const ledger = sitemapLedgerDocument as SitemapLedger;

if (ledger.schema !== sitemapLedgerSchema) {
  throw new Error("sitemap 账本 schema 不正确");
}

export const sitemapChunkSize = ledger.chunkSize;

export function getSitemapIds() {
  return Array.from({ length: ledger.sitemapCount }, (_, id) => ({ id: String(id) }));
}

export function getSitemapSnapshot() {
  return {
    totalUrls: ledger.totalUrls,
    sitemapCount: ledger.sitemapCount,
    workCount: ledger.workCount,
    folioCount: ledger.folioCount,
  };
}

export function getSitemapLedger() {
  return ledger;
}

import type { MetadataRoute } from "next";
import { getSitemapLedger } from "@/lib/sitemap-ledger";
import { loadSitemapChunkPaths } from "@/lib/sitemap-chunk-loaders.generated";
import { siteOrigin } from "@/lib/site-metadata";

export { getSitemapIds, getSitemapSnapshot, sitemapChunkSize } from "@/lib/sitemap-ledger";

// Editorial study pages can ship independently of the large corpus ledger.
// Keep them in the lightweight hub sitemap without shifting every precomputed
// corpus shard; a future full corpus rebuild may absorb them into the ledger.
const editorialHubPaths = ["/xue", "/xue/faju", "/xue/biji"];

function sitemapEntryForPath(path: string): MetadataRoute.Sitemap[number] {
  const url = `${siteOrigin}${path}`;
  if (path === "") {
    return { url, changeFrequency: "weekly", priority: 1 };
  }
  const parts = path.split("/").filter(Boolean);
  if (parts[0] === "jingzang" && parts.length === 3) {
    return { url, changeFrequency: "yearly", priority: 0.6 };
  }
  if (parts[0] === "jingzang") {
    return { url, changeFrequency: "monthly", priority: 0.7 };
  }
  return { url, changeFrequency: "monthly", priority: 0.8 };
}

export async function getSitemapChunk(id: string | number): Promise<MetadataRoute.Sitemap> {
  const chunk = Number(id);
  const ledger = getSitemapLedger();
  if (!Number.isSafeInteger(chunk) || chunk < 0 || chunk >= ledger.sitemapCount) return [];
  const paths = await loadSitemapChunkPaths(chunk);
  if (!paths) return [];

  // The ledger is ordered as hubs -> paginated library -> works -> folios.
  // Keep folios in their own shards so Search Console can report each template
  // independently instead of hiding demand pages inside a 40k mixed URL file.
  const folioOffset = ledger.staticPathCount + ledger.libraryPageCount + ledger.workCount;
  const chunkStart = chunk * ledger.chunkSize;
  const localFolioOffset = Math.max(0, folioOffset - chunkStart);
  return paths.slice(localFolioOffset).map(sitemapEntryForPath);
}

export async function getHubSitemap(): Promise<MetadataRoute.Sitemap> {
  const ledger = getSitemapLedger();
  const paths = await loadSitemapChunkPaths(0);
  if (!paths) return [];
  const generated = paths
    .slice(0, ledger.staticPathCount + ledger.libraryPageCount)
    .map(sitemapEntryForPath);
  const generatedUrls = new Set(generated.map((entry) => entry.url));
  const editorial = editorialHubPaths
    .map(sitemapEntryForPath)
    .filter((entry) => !generatedUrls.has(entry.url));
  return [...generated, ...editorial];
}

export async function getWorkSitemap(): Promise<MetadataRoute.Sitemap> {
  const ledger = getSitemapLedger();
  const paths = await loadSitemapChunkPaths(0);
  if (!paths) return [];
  const workOffset = ledger.staticPathCount + ledger.libraryPageCount;
  return paths
    .slice(workOffset, workOffset + ledger.workCount)
    .map(sitemapEntryForPath);
}

export function serializeSitemap(entries: MetadataRoute.Sitemap) {
  const body = entries.map((entry) => {
    const fields = [
      `<loc>${escapeXml(entry.url)}</loc>`,
      entry.changeFrequency ? `<changefreq>${entry.changeFrequency}</changefreq>` : "",
      typeof entry.priority === "number" ? `<priority>${entry.priority}</priority>` : "",
    ].filter(Boolean);
    return `<url>${fields.join("")}</url>`;
  }).join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    body,
    "</urlset>",
    "",
  ].join("\n");
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

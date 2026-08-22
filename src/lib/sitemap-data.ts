import type { MetadataRoute } from "next";
import { getSitemapLedger } from "@/lib/sitemap-ledger";
import { loadSitemapChunkPaths } from "@/lib/sitemap-chunk-loaders.generated";
import { siteOrigin } from "@/lib/site-metadata";

export { getSitemapIds, getSitemapSnapshot, sitemapChunkSize } from "@/lib/sitemap-ledger";

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
  return (paths ?? []).map(sitemapEntryForPath);
}

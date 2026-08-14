import type { MetadataRoute } from "next";
import { getSitemapEntries, getSitemapIds, sitemapChunkSize } from "@/lib/sitemap-data";

export async function generateSitemaps() {
  return getSitemapIds();
}

export default async function sitemap({
  id,
}: {
  id: Promise<string>;
}): Promise<MetadataRoute.Sitemap> {
  const chunk = Number(await id);
  if (!Number.isSafeInteger(chunk) || chunk < 0) return [];
  const entries = await getSitemapEntries();
  if (chunk >= Math.ceil(entries.length / sitemapChunkSize)) return [];
  return entries.slice(chunk * sitemapChunkSize, (chunk + 1) * sitemapChunkSize);
}

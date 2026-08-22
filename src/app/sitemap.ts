import type { MetadataRoute } from "next";
import { getSitemapChunk, getSitemapIds } from "@/lib/sitemap-data";

export const dynamic = "force-static";
export const revalidate = 86400;

export async function generateSitemaps() {
  return getSitemapIds();
}

export default async function sitemap({
  id,
}: {
  id: Promise<string>;
}): Promise<MetadataRoute.Sitemap> {
  return getSitemapChunk(await id);
}

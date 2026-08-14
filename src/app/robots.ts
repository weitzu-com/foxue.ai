import type { MetadataRoute } from "next";
import { getSitemapIds } from "@/lib/sitemap-data";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://foxue.ai";
  const sitemapIds = await getSitemapIds();
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: sitemapIds.map(({ id }) => `${baseUrl}/sitemap/${id}.xml`),
    host: baseUrl,
  };
}

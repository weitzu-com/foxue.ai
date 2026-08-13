import type { MetadataRoute } from "next";
import { sutras } from "@/data/sutras";
import { getSutraReading } from "@/lib/corpus-reading";
import { folioHref } from "@/lib/reader-routes";

const sitemapChunkSize = 40_000;

export async function generateSitemaps() {
  return [{ id: "0" }, { id: "1" }];
}

async function allSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://foxue.ai";
  const staticRoutes = ["", "/wenjing", "/jingzang", "/fugai", "/yuanze", "/touming"];
  const readings = await Promise.all(
    sutras.map(async (sutra) => ({ sutra, reading: await getSutraReading(sutra) })),
  );
  const folioRoutes = readings.flatMap(({ sutra, reading }) =>
    reading.navigation.map((item) => ({
      url: `${baseUrl}${folioHref(sutra.slug, item.key)}`,
      lastModified: new Date("2026-08-14"),
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
  );

  return [
    ...staticRoutes.map((path) => ({
      url: `${baseUrl}${path}`,
      lastModified: new Date("2026-08-14"),
      changeFrequency: path === "" ? ("weekly" as const) : ("monthly" as const),
      priority: path === "" ? 1 : 0.8,
    })),
    ...sutras.map((sutra) => ({
      url: `${baseUrl}/jingzang/${sutra.slug}`,
      lastModified: new Date("2026-08-14"),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...folioRoutes,
  ];
}

export default async function sitemap({
  id,
}: {
  id: Promise<string>;
}): Promise<MetadataRoute.Sitemap> {
  const chunk = Number(await id);
  if (!Number.isSafeInteger(chunk) || chunk < 0 || chunk > 1) return [];
  const entries = await allSitemapEntries();
  return entries.slice(chunk * sitemapChunkSize, (chunk + 1) * sitemapChunkSize);
}
